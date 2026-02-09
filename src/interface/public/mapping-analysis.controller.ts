import { Employee } from '@domain/common/employee/employee.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Public } from '@interface/common/decorators/public.decorator';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { In, IsNull, Repository } from 'typeorm';

/**
 * 맵핑 분석 컨트롤러
 *
 * 맵핑과 하향평가 간의 불일치를 분석하고 리포트를 생성합니다.
 */
@ApiTags('Public - 맵핑 분석')
@Controller('mapping-analysis')
@Public()
export class MappingAnalysisController {
  private readonly logger = new Logger(MappingAnalysisController.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
  ) {}

  /**
   * 1차 평가자(직원별 고정) 매핑 중복 정리 마이그레이션 적용 대상 미리보기
   * migrations/1770200000000-DeduplicatePrimaryEvaluatorMappingsAndAddUniqueConstraint.ts 와 동일한 기준으로
   * 어떤 행이 유지되고 어떤 행이 soft delete 대상인지 조회합니다.
   */
  @Get('primary-evaluator-dedup-preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '1차 평가자 매핑 중복 정리 적용 대상 미리보기',
    description: `1770200000000 마이그레이션과 동일한 로직으로, 직원별 고정 1차 매핑(wbsItemId IS NULL) 중
동일 (평가기간, 피평가자, 평가라인)에 대해 2건 이상 있을 때 유지될 행(최신 1건)과 soft delete 대상 행을 반환합니다.`,
  })
  @ApiResponse({
    status: 200,
    description: '적용 대상 미리보기 조회 성공',
  })
  async getPrimaryEvaluatorDedupPreview(): Promise<{
    summary: {
      totalPrimaryMappings: number;
      duplicateGroupsCount: number;
      rowsToKeep: number;
      rowsToSoftDelete: number;
    };
    duplicateGroups: Array<{
      evaluationPeriodId: string;
      employeeId: string;
      evaluationLineId: string;
      count: number;
      피평가자: { id: string; name: string; employeeNumber: string };
      평가기간: { id: string; name: string };
      kept: {
        id: string;
        evaluatorId: string;
        createdAt: string;
        평가자: { id: string; name: string; employeeNumber: string };
      };
      toSoftDelete: Array<{
        id: string;
        evaluatorId: string;
        createdAt: string;
        평가자: { id: string; name: string; employeeNumber: string };
      }>;
    }>;
  }> {
    const raw = await this.dataSource.query(`
      WITH primary_mappings AS (
        SELECT id, "evaluationPeriodId", "employeeId", "evaluationLineId", "evaluatorId",
               "createdAt",
               ROW_NUMBER() OVER (
                 PARTITION BY "evaluationPeriodId", "employeeId", "evaluationLineId"
                 ORDER BY "createdAt" DESC
               ) AS rn
        FROM evaluation_line_mappings
        WHERE "wbsItemId" IS NULL AND "deletedAt" IS NULL
      )
      SELECT id, "evaluationPeriodId", "employeeId", "evaluationLineId", "evaluatorId",
             "createdAt", rn
      FROM primary_mappings
      ORDER BY "evaluationPeriodId", "employeeId", "evaluationLineId", rn
    `);

    const key = (r: {
      evaluationPeriodId: string;
      employeeId: string;
      evaluationLineId: string;
    }) =>
      `${r.evaluationPeriodId}|${r.employeeId}|${r.evaluationLineId}`;

    const groups = new Map<
      string,
      {
        evaluationPeriodId: string;
        employeeId: string;
        evaluationLineId: string;
        rows: Array<{
          id: string;
          evaluatorId: string;
          createdAt: string;
          rn: number;
        }>;
      }
    >();

    for (const row of raw) {
      const k = key(row);
      if (!groups.has(k)) {
        groups.set(k, {
          evaluationPeriodId: row.evaluationPeriodId,
          employeeId: row.employeeId,
          evaluationLineId: row.evaluationLineId,
          rows: [],
        });
      }
      groups.get(k)!.rows.push({
        id: row.id,
        evaluatorId: row.evaluatorId,
        createdAt:
          row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : String(row.createdAt),
        rn: typeof row.rn === 'string' ? parseInt(row.rn, 10) : Number(row.rn),
      });
    }

    let duplicateGroupsCount = 0;
    let rowsToKeep = 0;
    let rowsToSoftDelete = 0;

    const duplicateGroupsRaw: Array<{
      evaluationPeriodId: string;
      employeeId: string;
      evaluationLineId: string;
      count: number;
      kept: { id: string; evaluatorId: string; createdAt: string };
      toSoftDelete: Array<{
        id: string;
        evaluatorId: string;
        createdAt: string;
      }>;
    }> = [];

    for (const entry of groups.values()) {
      const list = entry.rows;
      if (list.length <= 1) continue;

      const keptRow = list.find((r) => Number(r.rn) === 1);
      const toSoftDeleteRows = list.filter((r) => Number(r.rn) > 1);
      if (!keptRow) continue;

      duplicateGroupsCount += 1;
      rowsToKeep += 1;
      rowsToSoftDelete += toSoftDeleteRows.length;

      duplicateGroupsRaw.push({
        evaluationPeriodId: entry.evaluationPeriodId,
        employeeId: entry.employeeId,
        evaluationLineId: entry.evaluationLineId,
        count: list.length,
        kept: {
          id: keptRow.id,
          evaluatorId: keptRow.evaluatorId,
          createdAt: keptRow.createdAt,
        },
        toSoftDelete: toSoftDeleteRows.map((r) => ({
          id: r.id,
          evaluatorId: r.evaluatorId,
          createdAt: r.createdAt,
        })),
      });
    }

    const totalPrimaryMappings = raw.length;

    const employeeIds = new Set<string>();
    const periodIds = new Set<string>();
    for (const g of duplicateGroupsRaw) {
      employeeIds.add(g.employeeId);
      periodIds.add(g.evaluationPeriodId);
      employeeIds.add(g.kept.evaluatorId);
      for (const r of g.toSoftDelete) employeeIds.add(r.evaluatorId);
    }

    const employees = await this.employeeRepository.find({
      where: { id: In(Array.from(employeeIds)), deletedAt: IsNull() },
      select: ['id', 'name', 'employeeNumber'],
    });
    const periods = await this.evaluationPeriodRepository.find({
      where: { id: In(Array.from(periodIds)), deletedAt: IsNull() },
      select: ['id', 'name'],
    });

    const employeeMap = new Map(
      employees.map((e) => [e.id, { id: e.id, name: e.name, employeeNumber: e.employeeNumber }]),
    );
    const periodMap = new Map(periods.map((p) => [p.id, { id: p.id, name: p.name }]));

    const duplicateGroups = duplicateGroupsRaw.map((g) => ({
      evaluationPeriodId: g.evaluationPeriodId,
      employeeId: g.employeeId,
      evaluationLineId: g.evaluationLineId,
      count: g.count,
      피평가자:
        employeeMap.get(g.employeeId) ?? {
          id: g.employeeId,
          name: 'N/A',
          employeeNumber: 'N/A',
        },
      평가기간:
        periodMap.get(g.evaluationPeriodId) ?? {
          id: g.evaluationPeriodId,
          name: 'N/A',
        },
      kept: {
        id: g.kept.id,
        evaluatorId: g.kept.evaluatorId,
        createdAt: g.kept.createdAt,
        평가자:
          employeeMap.get(g.kept.evaluatorId) ?? {
            id: g.kept.evaluatorId,
            name: 'N/A',
            employeeNumber: 'N/A',
          },
      },
      toSoftDelete: g.toSoftDelete.map((r) => ({
        id: r.id,
        evaluatorId: r.evaluatorId,
        createdAt: r.createdAt,
        평가자:
          employeeMap.get(r.evaluatorId) ?? {
            id: r.evaluatorId,
            name: 'N/A',
            employeeNumber: 'N/A',
          },
      })),
    }));

    return {
      summary: {
        totalPrimaryMappings,
        duplicateGroupsCount,
        rowsToKeep,
        rowsToSoftDelete,
      },
      duplicateGroups,
    };
  }

  /**
   * 하향평가가 없는 맵핑 목록 조회 및 JSON 파일 생성
   */
  @Get('mappings-without-evaluation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '하향평가가 없는 맵핑 목록 조회',
    description: '맵핑은 있지만 하향평가가 없는 맵핑 목록을 조회하고 JSON 파일로 저장합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '목록 조회 및 파일 생성 성공',
  })
  async getMappingsWithoutEvaluation() {
    try {
      this.logger.log('=== 하향평가가 없는 맵핑 목록 조회 시작 ===');

      // 평가라인 정보를 먼저 조회
      const allLines = await this.evaluationLineRepository.find({
        where: { deletedAt: IsNull() },
      });
      const lineTypeMap = new Map<string, EvaluatorType>();
      for (const line of allLines) {
        lineTypeMap.set(line.id, line.evaluatorType);
      }

      // 전체 맵핑 조회
      const allMappings = await this.evaluationLineMappingRepository.find({
        where: { deletedAt: IsNull() },
        select: [
          'id',
          'evaluationPeriodId',
          'employeeId',
          'evaluatorId',
          'wbsItemId',
          'evaluationLineId',
          'createdAt',
        ],
      });

      this.logger.log(`전체 맵핑 수: ${allMappings.length}개`);

      const mappingsWithoutEvaluationList: any[] = [];
      const employeeIds = new Set<string>();
      const evaluatorIds = new Set<string>();
      const periodIds = new Set<string>();

      // 통계 수집
      const statistics = {
        byReason: {
          평가라인없음: 0,
          하향평가없음: 0,
        },
        byEvaluationType: {
          primary: 0,
          secondary: 0,
          unknown: 0, // 평가라인을 찾을 수 없는 경우
        },
        byWbsStatus: {
          wbs있음: 0, // 맵핑에 wbsItemId가 있는 경우
          wbs없음: 0, // 맵핑에 wbsItemId가 없는 경우
        },
        byCase: {
          케이스1_평가라인없음: 0,
          케이스2_하향평가없음_wbs있음: 0,
          케이스3_하향평가없음_wbs없음: 0,
        },
      };

      // 각 맵핑에 대해 하향평가 존재 여부 확인
      for (let i = 0; i < allMappings.length; i++) {
        const mapping = allMappings[i];
        const lineType = lineTypeMap.get(mapping.evaluationLineId);

        if (!lineType) {
          // 케이스 1: 평가라인을 찾을 수 없음
          statistics.byReason.평가라인없음++;
          statistics.byEvaluationType.unknown++;
          statistics.byCase.케이스1_평가라인없음++;
          if (mapping.wbsItemId) {
            statistics.byWbsStatus.wbs있음++;
          } else {
            statistics.byWbsStatus.wbs없음++;
          }

          mappingsWithoutEvaluationList.push({
            mappingId: mapping.id,
            employeeId: mapping.employeeId,
            evaluatorId: mapping.evaluatorId,
            periodId: mapping.evaluationPeriodId,
            wbsItemId: mapping.wbsItemId,
            evaluationLineId: mapping.evaluationLineId,
            createdAt: mapping.createdAt,
            reason: '평가라인을 찾을 수 없음',
            case: '케이스1_평가라인없음',
          });
          employeeIds.add(mapping.employeeId);
          evaluatorIds.add(mapping.evaluatorId);
          periodIds.add(mapping.evaluationPeriodId);
          continue;
        }

        const evaluationType =
          lineType === EvaluatorType.PRIMARY
            ? DownwardEvaluationType.PRIMARY
            : DownwardEvaluationType.SECONDARY;

        // 하향평가 존재 여부 확인: 맵핑의 wbsItemId가 있으면 일치하는 경우만, 없으면 모든 하향평가와 매칭
        let evaluationExists = 0;
        if (mapping.wbsItemId) {
          // 맵핑에 wbsItemId가 있는 경우: 하향평가의 wbsId와 일치하는 경우만
          evaluationExists = await this.downwardEvaluationRepository.count({
            where: {
              periodId: mapping.evaluationPeriodId,
              employeeId: mapping.employeeId,
              evaluatorId: mapping.evaluatorId,
              evaluationType: evaluationType,
              wbsId: mapping.wbsItemId,
              deletedAt: IsNull(),
            },
          });
        } else {
          // 맵핑에 wbsItemId가 없는 경우: 모든 하향평가와 매칭 (wbsId 조건 없음)
          evaluationExists = await this.downwardEvaluationRepository.count({
            where: {
              periodId: mapping.evaluationPeriodId,
              employeeId: mapping.employeeId,
              evaluatorId: mapping.evaluatorId,
              evaluationType: evaluationType,
              deletedAt: IsNull(),
            },
          });
        }

        if (evaluationExists === 0) {
          // 케이스 2 또는 3: 하향평가가 존재하지 않음
          statistics.byReason.하향평가없음++;
          statistics.byEvaluationType[
            evaluationType === DownwardEvaluationType.PRIMARY
              ? 'primary'
              : 'secondary'
          ]++;

          if (mapping.wbsItemId) {
            // 케이스 2: 하향평가 없음 + WBS 있음
            statistics.byCase.케이스2_하향평가없음_wbs있음++;
            statistics.byWbsStatus.wbs있음++;
            mappingsWithoutEvaluationList.push({
              mappingId: mapping.id,
              employeeId: mapping.employeeId,
              evaluatorId: mapping.evaluatorId,
              periodId: mapping.evaluationPeriodId,
              wbsItemId: mapping.wbsItemId,
              evaluationLineId: mapping.evaluationLineId,
              evaluationType: evaluationType,
              createdAt: mapping.createdAt,
              reason: '하향평가가 존재하지 않음 (WBS 있음)',
              case: '케이스2_하향평가없음_wbs있음',
            });
          } else {
            // 케이스 3: 하향평가 없음 + WBS 없음
            statistics.byCase.케이스3_하향평가없음_wbs없음++;
            statistics.byWbsStatus.wbs없음++;
            mappingsWithoutEvaluationList.push({
              mappingId: mapping.id,
              employeeId: mapping.employeeId,
              evaluatorId: mapping.evaluatorId,
              periodId: mapping.evaluationPeriodId,
              wbsItemId: mapping.wbsItemId,
              evaluationLineId: mapping.evaluationLineId,
              evaluationType: evaluationType,
              createdAt: mapping.createdAt,
              reason: '하향평가가 존재하지 않음 (WBS 없음)',
              case: '케이스3_하향평가없음_wbs없음',
            });
          }

          employeeIds.add(mapping.employeeId);
          evaluatorIds.add(mapping.evaluatorId);
          periodIds.add(mapping.evaluationPeriodId);
        }

        if ((i + 1) % 100 === 0) {
          this.logger.log(
            `진행 상황: ${i + 1}/${allMappings.length} (하향평가 없는 맵핑: ${mappingsWithoutEvaluationList.length}개)`,
          );
        }
      }

      this.logger.log(
        `하향평가가 없는 맵핑 수: ${mappingsWithoutEvaluationList.length}개`,
      );

      // Employee와 EvaluationPeriod 정보를 배치로 조회
      const employees = await this.employeeRepository.find({
        where: {
          id: In(Array.from(employeeIds)),
          deletedAt: IsNull(),
        },
        select: ['id', 'name', 'employeeNumber', 'email', 'departmentName'],
      });
      const evaluators = await this.employeeRepository.find({
        where: {
          id: In(Array.from(evaluatorIds)),
          deletedAt: IsNull(),
        },
        select: ['id', 'name', 'employeeNumber', 'email', 'departmentName'],
      });
      const periods = await this.evaluationPeriodRepository.find({
        where: {
          id: In(Array.from(periodIds)),
          deletedAt: IsNull(),
        },
        select: ['id', 'name', 'startDate', 'status', 'currentPhase'],
      });

      // Map으로 변환하여 빠른 조회
      const employeeMap = new Map(employees.map((e) => [e.id, e]));
      const evaluatorMap = new Map(evaluators.map((e) => [e.id, e]));
      const periodMap = new Map(periods.map((p) => [p.id, p]));

      // 하향평가가 없는 맵핑 목록에 상세 정보 추가
      const detailedList = mappingsWithoutEvaluationList.map((item) => {
        const employee = employeeMap.get(item.employeeId);
        const evaluator = evaluatorMap.get(item.evaluatorId);
        const period = periodMap.get(item.periodId);

        return {
          mappingId: item.mappingId,
          reason: item.reason,
          case: item.case,
          evaluationType: item.evaluationType,
          createdAt: item.createdAt,
          wbsItemId: item.wbsItemId,
          evaluationLineId: item.evaluationLineId,
          피평가자: {
            id: item.employeeId,
            name: employee?.name || 'N/A',
            employeeNumber: employee?.employeeNumber || 'N/A',
            email: employee?.email || 'N/A',
            departmentName: employee?.departmentName || 'N/A',
          },
          평가자: {
            id: item.evaluatorId,
            name: evaluator?.name || 'N/A',
            employeeNumber: evaluator?.employeeNumber || 'N/A',
            email: evaluator?.email || 'N/A',
            departmentName: evaluator?.departmentName || 'N/A',
          },
          평가기간: {
            id: item.periodId,
            name: period?.name || 'N/A',
            startDate: period?.startDate?.toISOString() || 'N/A',
            status: period?.status || 'N/A',
            currentPhase: period?.currentPhase || 'N/A',
          },
        };
      });

      // JSON 파일로 저장
      const outputDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
      const filename = `mappings-without-evaluation_${timestamp}.json`;
      const filepath = path.join(outputDir, filename);

      const outputData = {
        generatedAt: dayjs().toISOString(),
        totalCount: detailedList.length,
        summary: {
          byReason: statistics.byReason,
          byEvaluationType: statistics.byEvaluationType,
          byWbsStatus: statistics.byWbsStatus,
          byCase: statistics.byCase,
          상세설명: {
            케이스1_평가라인없음:
              '맵핑의 evaluationLineId에 해당하는 평가라인이 존재하지 않음',
            케이스2_하향평가없음_wbs있음:
              '맵핑에 wbsItemId가 있고, 해당 조건에 맞는 하향평가가 없음 (wbsId 일치 필요)',
            케이스3_하향평가없음_wbs없음:
              '맵핑에 wbsItemId가 없고, 해당 조건에 맞는 하향평가가 없음 (wbsId 조건 없음)',
          },
        },
        mappings: detailedList,
      };

      fs.writeFileSync(filepath, JSON.stringify(outputData, null, 2), 'utf-8');
      this.logger.log(
        `하향평가가 없는 맵핑 목록이 저장되었습니다: ${filepath}`,
      );

      this.logger.log(
        `=== 하향평가가 없는 맵핑 통계 ===\n` +
          `전체: ${outputData.totalCount}개\n` +
          `원인별:\n` +
          `  - 평가라인없음: ${statistics.byReason.평가라인없음}개\n` +
          `  - 하향평가없음: ${statistics.byReason.하향평가없음}개\n` +
          `평가유형별:\n` +
          `  - Primary: ${statistics.byEvaluationType.primary}개\n` +
          `  - Secondary: ${statistics.byEvaluationType.secondary}개\n` +
          `  - Unknown: ${statistics.byEvaluationType.unknown}개\n` +
          `WBS 상태별:\n` +
          `  - WBS 있음: ${statistics.byWbsStatus.wbs있음}개\n` +
          `  - WBS 없음: ${statistics.byWbsStatus.wbs없음}개\n` +
          `케이스별:\n` +
          `  - 케이스1 (평가라인없음): ${statistics.byCase.케이스1_평가라인없음}개\n` +
          `  - 케이스2 (하향평가없음 + WBS있음): ${statistics.byCase.케이스2_하향평가없음_wbs있음}개\n` +
          `  - 케이스3 (하향평가없음 + WBS없음): ${statistics.byCase.케이스3_하향평가없음_wbs없음}개`,
      );

      return {
        success: true,
        message: '하향평가가 없는 맵핑 목록 조회 및 파일 생성 완료',
        filePath: filepath,
        totalCount: detailedList.length,
        summary: outputData.summary,
      };
    } catch (error) {
      this.logger.error('하향평가가 없는 맵핑 목록 조회 실패:', error);
      throw error;
    }
  }
}
