import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { Public } from '@interface/common/decorators/public.decorator';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { IsNull, In, Repository } from 'typeorm';

/**
 * 매핑 충돌 분석 컨트롤러
 *
 * 프로젝트 PM과 실제 매핑된 평가자가 다른 경우를 찾아 분석합니다.
 */
@ApiTags('Public - 매핑 충돌 분석')
@Controller('mapping-conflict-analysis')
@Public()
export class MappingConflictAnalysisController {
  private readonly logger = new Logger(
    MappingConflictAnalysisController.name,
  );

  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
  ) {}

  /**
   * PM과 매핑된 평가자가 다른 경우 분석
   */
  @Get('pm-mapping-conflicts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PM과 매핑된 평가자 충돌 분석',
    description: `프로젝트 PM과 실제 매핑된 2차 평가자가 다른 경우를 찾아 분석합니다.
    
**분석 기준:**
- WBS 할당이 있고 프로젝트 PM이 설정된 경우
- 해당 WBS에 2차 평가자 매핑이 있는 경우
- PM과 매핑된 평가자가 다른 경우

**분석 항목:**
- PM 매핑 상태 (활성/삭제됨)
- 실제 매핑 상태 (활성/삭제됨)
- 둘 다 활성인 경우 충돌
- 매핑이 없는 경우 누락`,
  })
  @ApiResponse({
    status: 200,
    description: '분석 완료',
  })
  async analyzePmMappingConflicts(
    @Query('evaluationPeriodId') evaluationPeriodId?: string,
  ) {
    try {
      this.logger.log(
        `=== PM과 매핑 충돌 분석 시작 - 평가기간: ${evaluationPeriodId || '전체'} ===`,
      );

      // 평가기간 조회
      const periods = evaluationPeriodId
        ? await this.evaluationPeriodRepository.find({
            where: { id: evaluationPeriodId, deletedAt: IsNull() },
          })
        : await this.evaluationPeriodRepository.find({
            where: { deletedAt: IsNull() },
            order: { startDate: 'DESC' },
          });

      if (periods.length === 0) {
        return {
          success: false,
          message: '평가기간을 찾을 수 없습니다.',
        };
      }

      // 2차 평가 라인 조회
      const secondaryEvaluationLines = await this.evaluationLineRepository.find({
        where: {
          evaluatorType: EvaluatorType.SECONDARY,
          deletedAt: IsNull(),
        },
      });

      if (secondaryEvaluationLines.length === 0) {
        return {
          success: false,
          message: '2차 평가 라인을 찾을 수 없습니다.',
        };
      }

      const secondaryEvaluationLineIds = secondaryEvaluationLines.map(
        (line) => line.id,
      );

      // 전체 프로젝트 정보 조회 (PM 정보 포함)
      const allProjectRows = await this.projectRepository
        .createQueryBuilder('project')
        .leftJoin(
          Employee,
          'pmEmployee',
          'pmEmployee.externalId = project.managerId AND pmEmployee.deletedAt IS NULL',
        )
        .select([
          'project.id AS project_id',
          'project.name AS project_name',
          'project.projectCode AS project_code',
          'project.managerId AS project_manager_id',
          'pmEmployee.id AS pm_employee_internal_id',
        ])
        .where('project.deletedAt IS NULL')
        .getRawMany();

      const globalProjectPmMap = new Map<string, string | null>();
      const globalProjectMap = new Map<string, any>();

      for (const row of allProjectRows) {
        const projectId = row.project_id;
        const pmEmployeeId = row.pm_employee_internal_id || null;
        globalProjectPmMap.set(projectId, pmEmployeeId);
        globalProjectMap.set(projectId, {
          id: projectId,
          name: row.project_name,
          projectCode: row.project_code,
          managerId: row.project_manager_id,
        });
      }

      // WBS 항목 정보 조회 (프로젝트 ID 포함)
      const wbsItems = await this.wbsItemRepository.find({
        where: { deletedAt: IsNull() },
        select: ['id', 'projectId', 'title', 'wbsCode'],
      });

      const wbsItemProjectMap = new Map<string, string>();
      const wbsItemMap = new Map<string, any>();
      for (const wbs of wbsItems) {
        if (wbs.projectId) {
          wbsItemProjectMap.set(wbs.id, wbs.projectId);
        }
        wbsItemMap.set(wbs.id, {
          id: wbs.id,
          title: wbs.title,
          wbsCode: wbs.wbsCode,
          projectId: wbs.projectId,
        });
      }

      // 분석 결과 수집
      const conflicts: any[] = [];
      const statistics = {
        totalWbsAssignments: 0,
        pmExists: 0,
        mappingExists: 0,
        conflicts: {
          pmMatchesMapping: 0, // PM과 매핑이 일치 (정상)
          intentionalChange: 0, // 의도적 변경 (PM 매핑 삭제 후 다른 평가자로 변경)
          pmActiveMappingDifferent: 0, // PM 활성, 매핑은 다른 사람 (의도적 변경 또는 문제)
          pmActiveMappingDeleted: 0, // PM은 활성, 매핑은 삭제됨 (문제)
          pmDeletedMappingActive: 0, // PM 없음, 매핑은 활성 (의도적 변경 가능성)
          bothDeleted: 0, // 둘 다 삭제됨
          noMapping: 0, // 매핑이 없음 (문제)
          multipleActiveMappings: 0, // 활성 매핑이 여러 개 (문제)
          pmAndOtherBothActive: 0, // PM 매핑과 다른 매핑이 모두 활성 (문제)
          multipleMappingsOneActive: 0, // 여러 매핑이 있지만 하나만 활성 (정상)
        },
        byPeriod: {} as Record<string, number>,
      };

      // 각 평가기간별로 분석
      for (const period of periods) {
        this.logger.log(
          `평가기간 분석 중: ${period.name} (${period.id})`,
        );

        // 해당 평가기간의 모든 WBS 할당 조회
        const allWbsAssignments = await this.evaluationWbsAssignmentRepository.find(
          {
            where: {
              periodId: period.id,
              deletedAt: IsNull(),
            },
            select: ['id', 'employeeId', 'projectId', 'wbsItemId'],
          },
        );

        statistics.totalWbsAssignments += allWbsAssignments.length;

        // 해당 평가기간의 모든 2차 평가자 매핑 조회 (활성 + 삭제됨 모두)
        const allSecondaryMappings = await this.evaluationLineMappingRepository
          .createQueryBuilder('mapping')
          .leftJoin(
            EvaluationLine,
            'line',
            'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
          )
          .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId: period.id,
          })
          .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: EvaluatorType.SECONDARY,
          })
          .andWhere('mapping.wbsItemId IS NOT NULL')
          .select([
            'mapping.id',
            'mapping.employeeId',
            'mapping.wbsItemId',
            'mapping.evaluatorId',
            'mapping.deletedAt',
            'mapping.createdAt',
            'mapping.updatedAt',
          ])
          .getMany();

        // WBS별 매핑 맵 생성 (employeeId + wbsItemId -> 매핑 정보 배열)
        // 같은 WBS에 여러 매핑이 있을 수 있으므로 배열로 저장
        const wbsMappingMap = new Map<string, any[]>();
        for (const mapping of allSecondaryMappings) {
          if (mapping.wbsItemId) {
            const key = `${mapping.employeeId}:${mapping.wbsItemId}`;
            if (!wbsMappingMap.has(key)) {
              wbsMappingMap.set(key, []);
            }
            wbsMappingMap.get(key)!.push({
              id: mapping.id,
              evaluatorId: mapping.evaluatorId,
              deletedAt: mapping.deletedAt,
              createdAt: mapping.createdAt,
              updatedAt: mapping.updatedAt,
            });
          }
        }

        // WBS 할당별로 분석
        const analyzedWbsKeys = new Set<string>();

        for (const wbsAssignment of allWbsAssignments) {
          const employeeId = wbsAssignment.employeeId;
          const projectId = wbsAssignment.projectId;
          const wbsItemId = wbsAssignment.wbsItemId;
          const wbsKey = `${employeeId}:${wbsItemId}`;

          // 이미 분석한 WBS는 스킵
          if (analyzedWbsKeys.has(wbsKey)) {
            continue;
          }

          analyzedWbsKeys.add(wbsKey);

          // 프로젝트 PM 확인
          const projectPmId = globalProjectPmMap.get(projectId);
          if (!projectPmId) {
            // PM이 없으면 스킵
            continue;
          }

          statistics.pmExists++;

          // 해당 WBS에 대한 모든 매핑 확인
          const mappings = wbsMappingMap.get(wbsKey) || [];

          if (mappings.length === 0) {
            // 매핑이 없는 경우
            statistics.conflicts.noMapping++;
            conflicts.push({
              periodId: period.id,
              periodName: period.name,
              employeeId,
              projectId,
              wbsItemId,
              projectPmId,
              actualEvaluatorId: null,
              conflictType: 'noMapping',
              conflictReason: '매핑이 없음',
              pmStatus: 'active',
              mappingStatus: 'notExists',
              mappingCount: 0,
            });
            statistics.byPeriod[period.id] =
              (statistics.byPeriod[period.id] || 0) + 1;
            continue;
          }

          statistics.mappingExists++;

          // updatedAt 기준으로 정렬하여 가장 최근 매핑 확인
          const sortedMappings = [...mappings].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );

          // 가장 최근 매핑 (의도한 매핑)
          const latestMapping = sortedMappings[0];
          const actualEvaluatorId = latestMapping.evaluatorId;
          const isMappingDeleted = latestMapping.deletedAt !== null;
          const isPmActive = projectPmId !== null;

          // 여러 매핑이 있는 경우 확인
          const activeMappings = mappings.filter((m) => m.deletedAt === null);
          const deletedMappings = mappings.filter((m) => m.deletedAt !== null);
          const hasMultipleMappings = mappings.length > 1;
          const hasMultipleActiveMappings = activeMappings.length > 1;

          // 여러 매핑이 있는 경우 분석
          if (hasMultipleMappings) {
            // PM을 평가자로 하는 매핑 찾기
            const pmMapping = mappings.find(
              (m) => m.evaluatorId === projectPmId,
            );
            const pmMappingActive = pmMapping && pmMapping.deletedAt === null;

            // 여러 매핑이 있는 경우 충돌로 분류
            let conflictType = '';
            let conflictReason = '';

            if (hasMultipleActiveMappings) {
              // 활성 매핑이 여러 개인 경우 - 심각한 충돌
              conflictType = 'multipleActiveMappings';
              conflictReason = `활성 매핑이 ${activeMappings.length}개 존재함 (최신: ${actualEvaluatorId})`;
              statistics.conflicts.multipleActiveMappings =
                (statistics.conflicts.multipleActiveMappings || 0) + 1;
            } else if (pmMappingActive && !isMappingDeleted) {
              // PM 매핑도 활성이고 최신 매핑도 활성인데 다른 사람
              conflictType = 'pmAndOtherBothActive';
              conflictReason = `PM 매핑과 다른 평가자 매핑이 모두 활성 상태 (PM: ${projectPmId}, 최신: ${actualEvaluatorId})`;
              statistics.conflicts.pmAndOtherBothActive =
                (statistics.conflicts.pmAndOtherBothActive || 0) + 1;
            } else {
              // 여러 매핑이 있지만 하나만 활성
              conflictType = 'multipleMappingsOneActive';
              conflictReason = `매핑이 ${mappings.length}개 존재하지만 하나만 활성 (최신: ${actualEvaluatorId})`;
              statistics.conflicts.multipleMappingsOneActive =
                (statistics.conflicts.multipleMappingsOneActive || 0) + 1;
            }

            conflicts.push({
              periodId: period.id,
              periodName: period.name,
              employeeId,
              projectId,
              wbsItemId,
              projectPmId,
              actualEvaluatorId,
              conflictType,
              conflictReason,
              pmStatus: isPmActive ? 'active' : 'deleted',
              mappingStatus: isMappingDeleted ? 'deleted' : 'active',
              mappingCount: mappings.length,
              activeMappingCount: activeMappings.length,
              deletedMappingCount: deletedMappings.length,
              latestMapping: {
                id: latestMapping.id,
                evaluatorId: latestMapping.evaluatorId,
                deletedAt: latestMapping.deletedAt,
                createdAt: latestMapping.createdAt,
                updatedAt: latestMapping.updatedAt,
              },
              allMappings: mappings.map((m) => ({
                id: m.id,
                evaluatorId: m.evaluatorId,
                deletedAt: m.deletedAt,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt,
                isPmMapping: m.evaluatorId === projectPmId,
              })),
            });

            statistics.byPeriod[period.id] =
              (statistics.byPeriod[period.id] || 0) + 1;
            continue;
          }

          // 매핑이 하나인 경우
          // PM과 매핑된 평가자가 같은 경우
          if (projectPmId === actualEvaluatorId) {
            if (!isMappingDeleted) {
              statistics.conflicts.pmMatchesMapping++;
              // 정상 상태이므로 충돌 목록에 추가하지 않음
            }
            continue;
          }

          // PM과 매핑된 평가자가 다른 경우
          // 의도적 변경인지 실제 문제인지 구분 필요
          // 같은 WBS에 PM을 평가자로 하는 삭제된 매핑이 있는지 확인
          const deletedPmMapping = allSecondaryMappings.find(
            (m) =>
              m.employeeId === employeeId &&
              m.wbsItemId === wbsItemId &&
              m.evaluatorId === projectPmId &&
              m.deletedAt !== null,
          );

          let conflictType = '';
          let conflictReason = '';
          let isIntentionalChange = false;

          if (deletedPmMapping) {
            // PM 매핑이 삭제되고 다른 평가자로 변경됨 - 의도적 변경 가능성 높음
            isIntentionalChange = true;
            conflictType = 'intentionalChange';
            conflictReason = `PM 매핑이 삭제되고 다른 평가자로 변경됨 (의도적 변경 가능성 높음)`;
            statistics.conflicts.intentionalChange =
              (statistics.conflicts.intentionalChange || 0) + 1;
          } else if (isPmActive && !isMappingDeleted) {
            // PM은 활성인데 매핑은 다른 사람 - 실제 문제 가능성
            // 하지만 매핑이 하나만 있으므로 의도적 변경일 수도 있음
            conflictType = 'pmActiveMappingDifferent';
            conflictReason = 'PM은 활성 상태인데 매핑된 평가자가 다름 (의도적 변경 또는 문제)';
            statistics.conflicts.pmActiveMappingDifferent =
              (statistics.conflicts.pmActiveMappingDifferent || 0) + 1;
          } else if (isPmActive && isMappingDeleted) {
            // PM은 활성, 매핑은 삭제됨 - 문제
            conflictType = 'pmActiveMappingDeleted';
            conflictReason = 'PM은 활성 상태이지만 매핑은 삭제됨';
            statistics.conflicts.pmActiveMappingDeleted++;
          } else if (!isPmActive && !isMappingDeleted) {
            // PM은 없음, 매핑은 활성 - 의도적 변경 가능성
            conflictType = 'pmDeletedMappingActive';
            conflictReason = 'PM이 없지만 매핑은 활성 상태 (의도적 변경 가능성)';
            statistics.conflicts.pmDeletedMappingActive++;
          } else {
            // 둘 다 삭제됨 (또는 PM 없음)
            conflictType = 'bothDeleted';
            conflictReason = 'PM과 매핑 모두 삭제됨 또는 비활성';
            statistics.conflicts.bothDeleted++;
          }

          // 의도적 변경은 별도로 분류하되, 확인이 필요한 항목으로 표시
          conflicts.push({
            periodId: period.id,
            periodName: period.name,
            employeeId,
            projectId,
            wbsItemId,
            projectPmId,
            actualEvaluatorId,
            conflictType,
            conflictReason,
            isIntentionalChange,
            pmStatus: isPmActive ? 'active' : 'deleted',
            mappingStatus: isMappingDeleted ? 'deleted' : 'active',
            mappingCount: 1,
            deletedPmMapping: deletedPmMapping
              ? {
                  id: deletedPmMapping.id,
                  deletedAt: deletedPmMapping.deletedAt,
                  createdAt: deletedPmMapping.createdAt,
                  updatedAt: deletedPmMapping.updatedAt,
                }
              : null,
            latestMapping: {
              id: latestMapping.id,
              evaluatorId: latestMapping.evaluatorId,
              deletedAt: latestMapping.deletedAt,
              createdAt: latestMapping.createdAt,
              updatedAt: latestMapping.updatedAt,
            },
          });

          statistics.byPeriod[period.id] =
            (statistics.byPeriod[period.id] || 0) + 1;
        }
      }

      // 직원 정보 조회
      const employeeIds = [
        ...new Set([
          ...conflicts.map((item) => item.employeeId),
          ...conflicts
            .map((item) => item.projectPmId)
            .filter((id): id is string => id !== null),
          ...conflicts
            .map((item) => item.actualEvaluatorId)
            .filter((id): id is string => id !== null),
        ]),
      ];

      const employees = await this.employeeRepository.find({
        where: {
          id: In(employeeIds),
          deletedAt: IsNull(),
        },
        select: ['id', 'name', 'employeeNumber', 'email', 'departmentName'],
      });
      const employeeMap = new Map(employees.map((e) => [e.id, e]));

      // 상세 정보 추가
      const detailedList = conflicts.map((item) => {
        const employee = employeeMap.get(item.employeeId);
        const project = globalProjectMap.get(item.projectId);
        const wbsItem = wbsItemMap.get(item.wbsItemId);
        const pmEmployee = item.projectPmId
          ? employeeMap.get(item.projectPmId)
          : null;
        const actualEvaluator = item.actualEvaluatorId
          ? employeeMap.get(item.actualEvaluatorId)
          : null;

        return {
          periodId: item.periodId,
          periodName: item.periodName,
          conflictType: item.conflictType,
          conflictReason: item.conflictReason,
          피평가자: {
            id: item.employeeId,
            name: employee?.name || 'N/A',
            employeeNumber: employee?.employeeNumber || 'N/A',
            email: employee?.email || 'N/A',
            departmentName: employee?.departmentName || 'N/A',
          },
          프로젝트: {
            id: item.projectId,
            name: project?.name || 'N/A',
            projectCode: project?.projectCode || 'N/A',
          },
          WBS: {
            id: item.wbsItemId,
            title: wbsItem?.title || 'N/A',
            wbsCode: wbsItem?.wbsCode || 'N/A',
          },
          프로젝트PM: {
            id: item.projectPmId,
            name: pmEmployee?.name || 'N/A',
            employeeNumber: pmEmployee?.employeeNumber || 'N/A',
            email: pmEmployee?.email || 'N/A',
            status: item.pmStatus,
          },
          실제매핑된평가자: {
            id: item.actualEvaluatorId,
            name: actualEvaluator?.name || 'N/A',
            employeeNumber: actualEvaluator?.employeeNumber || 'N/A',
            email: actualEvaluator?.email || 'N/A',
            status: item.mappingStatus,
          },
          매핑정보: {
            mappingCount: item.mappingCount || 1,
            activeMappingCount: item.activeMappingCount || (item.mappingStatus === 'active' ? 1 : 0),
            deletedMappingCount: item.deletedMappingCount || (item.mappingStatus === 'deleted' ? 1 : 0),
            latestMapping: item.latestMapping || null,
            allMappings: item.allMappings || (item.latestMapping ? [item.latestMapping] : []),
          },
        };
      });

      // JSON 파일로 저장
      const outputDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
      const filename = `mapping-conflicts_${timestamp}.json`;
      const filepath = path.join(outputDir, filename);

      // 통계를 문제 항목과 정상/의도적 변경 항목으로 구분
      const intentionalChangeCount =
        (statistics.conflicts.intentionalChange || 0) +
        (statistics.conflicts.pmActiveMappingDifferent || 0) +
        (statistics.conflicts.pmDeletedMappingActive || 0) +
        (statistics.conflicts.multipleMappingsOneActive || 0);

      const problemCount =
        statistics.conflicts.pmActiveMappingDeleted +
        statistics.conflicts.bothDeleted +
        statistics.conflicts.noMapping +
        (statistics.conflicts.multipleActiveMappings || 0) +
        (statistics.conflicts.pmAndOtherBothActive || 0);

      // 매핑 없음과 활성 매핑 여러 개 케이스만 필터링
      const filteredConflicts = detailedList.filter(
        (item) =>
          item.conflictType === 'noMapping' ||
          item.conflictType === 'multipleActiveMappings',
      );

      const outputData = {
        generatedAt: dayjs().toISOString(),
        evaluationPeriods: periods.map((p) => ({
          id: p.id,
          name: p.name,
          startDate: p.startDate?.toISOString(),
          status: p.status,
          currentPhase: p.currentPhase,
        })),
        summary: {
          totalWbsAssignments: statistics.totalWbsAssignments,
          pmExists: statistics.pmExists,
          mappingExists: statistics.mappingExists,
          정상: statistics.conflicts.pmMatchesMapping,
          의도적변경_또는_확인필요: intentionalChangeCount,
          문제있음: problemCount,
          정상상세: {
            'PM과_매핑_일치': statistics.conflicts.pmMatchesMapping,
            '여러_매핑_하나만_활성': statistics.conflicts.multipleMappingsOneActive || 0,
          },
          의도적변경상세: {
            'PM_매핑_삭제_후_변경': statistics.conflicts.intentionalChange || 0,
            'PM_활성_매핑_다른사람': statistics.conflicts.pmActiveMappingDifferent || 0,
            'PM_없음_매핑_활성': statistics.conflicts.pmDeletedMappingActive || 0,
          },
          문제상세: {
            'PM_활성_매핑_삭제됨': statistics.conflicts.pmActiveMappingDeleted,
            '둘_다_삭제됨': statistics.conflicts.bothDeleted,
            '매핑_없음': statistics.conflicts.noMapping,
            '활성_매핑_여러개': statistics.conflicts.multipleActiveMappings || 0,
            'PM과_다른_매핑_모두_활성': statistics.conflicts.pmAndOtherBothActive || 0,
          },
        },
        totalCount: filteredConflicts.length,
        statistics,
        conflicts: filteredConflicts,
        설명: {
          정상: {
            pmMatchesMapping:
              'PM과 매핑된 평가자가 일치하는 정상 상태입니다. 충돌 목록에 포함되지 않습니다.',
          },
          의도적변경_또는_확인필요: {
            intentionalChange:
              'PM을 평가자로 하는 매핑이 삭제되고 다른 평가자로 변경되었습니다. 의도적 변경으로 보입니다.',
            pmActiveMappingDifferent:
              'PM은 활성 상태인데 매핑된 평가자가 다릅니다. 의도적 변경일 수도 있고 문제일 수도 있습니다. 확인이 필요합니다.',
            pmDeletedMappingActive:
              '프로젝트에 PM이 없거나 삭제되었는데 매핑은 활성 상태입니다. 의도적 변경 가능성이 있습니다.',
            multipleMappingsOneActive:
              '같은 WBS에 여러 매핑이 있지만 하나만 활성입니다. 이전 매핑들이 소프트 삭제되었지만 정상적인 상태입니다. (최신 매핑이 활성)',
          },
          문제있음: {
            pmActiveMappingDeleted:
              '프로젝트 PM은 활성 상태인데 매핑이 삭제되었습니다. 매핑이 누락되었을 수 있습니다.',
            bothDeleted:
              '프로젝트 PM과 매핑 모두 삭제되었거나 비활성 상태입니다.',
            noMapping:
              'WBS 할당은 있지만 2차 평가자 매핑이 없습니다. 매핑이 생성되지 않았을 수 있습니다.',
            multipleActiveMappings:
              '같은 WBS에 활성 매핑이 여러 개 존재합니다. 시스템 오류이거나 데이터 정합성 문제일 수 있습니다.',
            pmAndOtherBothActive:
              'PM을 평가자로 하는 매핑과 다른 사람을 평가자로 하는 매핑이 모두 활성 상태입니다. 수동 변경 후 이전 매핑이 삭제되지 않았을 수 있습니다.',
          },
        },
      };

      fs.writeFileSync(filepath, JSON.stringify(outputData, null, 2), 'utf-8');
      this.logger.log(
        `매핑 충돌 분석 결과가 저장되었습니다: ${filepath}\n` +
          `저장된 항목: 매핑 없음(${statistics.conflicts.noMapping}개) + 활성 매핑 여러 개(${statistics.conflicts.multipleActiveMappings || 0}개) = ${filteredConflicts.length}개`,
      );

      this.logger.log(
        `=== PM과 매핑 충돌 분석 완료 ===\n` +
          `총 WBS 할당 수: ${statistics.totalWbsAssignments}개\n` +
          `PM 존재: ${statistics.pmExists}개\n` +
          `매핑 존재: ${statistics.mappingExists}개\n\n` +
          `[정상 상태] (${statistics.conflicts.pmMatchesMapping + (statistics.conflicts.multipleMappingsOneActive || 0)}개)\n` +
          `  - PM과 매핑 일치: ${statistics.conflicts.pmMatchesMapping}개\n` +
          `  - 여러 매핑 중 하나만 활성: ${statistics.conflicts.multipleMappingsOneActive || 0}개\n\n` +
          `[의도적 변경 또는 확인 필요] (${intentionalChangeCount}개)\n` +
          `  - PM 매핑 삭제 후 변경: ${statistics.conflicts.intentionalChange || 0}개\n` +
          `  - PM 활성, 매핑 다른 사람: ${statistics.conflicts.pmActiveMappingDifferent || 0}개\n` +
          `  - PM 없음, 매핑 활성: ${statistics.conflicts.pmDeletedMappingActive || 0}개\n\n` +
          `[문제 있는 항목] (${problemCount}개)\n` +
          `  - PM 활성, 매핑 삭제됨: ${statistics.conflicts.pmActiveMappingDeleted}개\n` +
          `  - 둘 다 삭제됨: ${statistics.conflicts.bothDeleted}개\n` +
          `  - 매핑 없음: ${statistics.conflicts.noMapping}개\n` +
          `  - 활성 매핑 여러 개: ${statistics.conflicts.multipleActiveMappings || 0}개\n` +
          `  - PM과 다른 매핑 모두 활성: ${statistics.conflicts.pmAndOtherBothActive || 0}개\n\n` +
          `분석 목록에 포함된 항목: ${detailedList.length}개`,
      );

      return {
        success: true,
        message: '매핑 충돌 분석이 완료되었습니다.',
        data: {
          totalCount: detailedList.length,
          statistics,
          filepath,
          conflicts: detailedList,
        },
      };
    } catch (error) {
      this.logger.error('매핑 충돌 분석 실패', error.stack);
      return {
        success: false,
        message: '매핑 충돌 분석 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
}
