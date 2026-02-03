import { DepartmentSyncService } from '@context/organization-management-context/department-sync.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { Employee } from '@domain/common/employee/employee.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodStatus } from '@domain/core/evaluation-period/evaluation-period.types';
import { Public } from '@interface/common/decorators/public.decorator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { In, IsNull, Repository } from 'typeorm';

/**
 * 크론 작업 컨트롤러
 *
 * 크론 작업을 수동으로 실행하기 위한 HTTP 엔드포인트를 제공합니다.
 * 모든 엔드포인트는 Public으로 설정되어 있습니다.
 * 
 * 주의: 일반적으로는 @Cron 데코레이터로 자동 실행되지만,
 * 수동 실행이나 테스트 목적으로 이 엔드포인트를 사용할 수 있습니다.
 */
@ApiTags('Public - 크론 작업')
@Controller('cron')
@Public()
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    private readonly evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly employeeSyncService: EmployeeSyncService,
    private readonly departmentSyncService: DepartmentSyncService,
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
   * 한국 시간대 기준 현재 시간을 반환합니다.
   * (main.ts에서 dayjs.tz.setDefault('Asia/Seoul')로 설정됨)
   * @returns 한국 시간대 기준 현재 시간 (Date 객체)
   */
  private get koreaTime(): Date {
    return dayjs.tz().toDate();
  }

  /**
   * Date 객체를 한국 시간대의 dayjs 객체로 변환합니다.
   * (main.ts에서 dayjs.tz.setDefault('Asia/Seoul')로 설정됨)
   * @param date 변환할 Date 객체
   * @returns 한국 시간대의 dayjs 객체
   */
  private toKoreaDayjs(date: Date): dayjs.Dayjs {
    return dayjs.tz(date);
  }

  /**
   * 평가기간 자동 단계 변경 크론 작업
   * 일반적으로는 @Cron 데코레이터로 매 시간 자동 실행됩니다.
   * 이 엔드포인트는 수동 실행이나 테스트 목적으로 사용됩니다.
   */
  @Get('evaluation-period-auto-phase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '평가기간 자동 단계 변경 크론 작업',
    description: '매 시간마다 실행되어 평가기간의 단계를 자동으로 전이합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '평가기간 자동 단계 변경 완료',
  })
  @ApiResponse({
    status: 200,
    description: '크론 작업 실행 성공',
  })
  async triggerEvaluationPeriodAutoPhase() {
    try {
      // 현재 한국 시간대 기준 시간 로그 출력
      const now = this.koreaTime;
      const koreaNow = this.toKoreaDayjs(now);
      this.logger.log(
        `[평가기간 자동 단계 변경] 현재 한국 시간 (KST): ${koreaNow.format('YYYY-MM-DD HH:mm:ss KST')}`,
      );

      // 진행 중인 평가기간 조회 및 정보 로그 출력
      const activePeriods = await this.evaluationPeriodService.전체_조회한다();
      const inProgressPeriods = activePeriods.filter(
        (period) => period.status === EvaluationPeriodStatus.IN_PROGRESS,
      );

      this.logger.log(
        `[평가기간 자동 단계 변경] 진행 중인 평가기간 수: ${inProgressPeriods.length}개`,
      );

      // 각 평가기간의 시간 정보 로그 출력
      for (const period of inProgressPeriods) {
        const periodInfo = {
          id: period.id,
          name: period.name,
          startDate: period.startDate?.toISOString() || 'N/A',
          currentPhase: period.currentPhase || 'N/A',
          evaluationSetupDeadline:
            period.evaluationSetupDeadline?.toISOString() || 'N/A',
          performanceDeadline:
            period.performanceDeadline?.toISOString() || 'N/A',
          selfEvaluationDeadline:
            period.selfEvaluationDeadline?.toISOString() || 'N/A',
          peerEvaluationDeadline:
            period.peerEvaluationDeadline?.toISOString() || 'N/A',
        };

        this.logger.log(
          `[평가기간 자동 단계 변경] 평가기간 정보 - ID: ${periodInfo.id}, 이름: ${periodInfo.name}, 시작일: ${periodInfo.startDate}, 현재 단계: ${periodInfo.currentPhase}, 평가설정 마감일: ${periodInfo.evaluationSetupDeadline}, 업무수행 마감일: ${periodInfo.performanceDeadline}, 자기평가 마감일: ${periodInfo.selfEvaluationDeadline}, 동료평가 마감일: ${periodInfo.peerEvaluationDeadline}`,
        );
      }

      // 단계 전이 실행
      const count =
        await this.evaluationPeriodAutoPhaseService.autoPhaseTransition();

      // 전이 후 상태 로그 출력
      if (count > 0) {
        this.logger.log(
          `[평가기간 자동 단계 변경] ${count}개 평가기간의 단계가 전이되었습니다.`,
        );

        // 전이된 평가기간의 최종 상태 로그 출력
        const updatedPeriods =
          await this.evaluationPeriodService.전체_조회한다();
        const updatedInProgressPeriods = updatedPeriods.filter(
          (period) => period.status === EvaluationPeriodStatus.IN_PROGRESS,
        );

        for (const period of updatedInProgressPeriods) {
          if (
            inProgressPeriods.find((p) => p.id === period.id)?.currentPhase !==
            period.currentPhase
          ) {
            const beforePhase = inProgressPeriods.find(
              (p) => p.id === period.id,
            )?.currentPhase;
            this.logger.log(
              `[평가기간 자동 단계 변경] 평가기간 ${period.id} (${period.name}) 단계 변경됨: ${beforePhase} → ${period.currentPhase}`,
            );
          }
        }
      } else {
        this.logger.log(
          `[평가기간 자동 단계 변경] 전이된 평가기간이 없습니다.`,
        );
      }

      return {
        success: true,
        message: `평가기간 자동 단계 변경 완료: ${count}개 평가기간 전이됨`,
        transitionedCount: count,
      };
    } catch (error) {
      this.logger.error('평가기간 자동 단계 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 직원 동기화 크론 작업
   * 일반적으로는 @Cron 데코레이터로 10분마다 자동 실행됩니다.
   * 이 엔드포인트는 수동 실행이나 테스트 목적으로 사용됩니다.
   */
  @Get('employee-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '직원 동기화 크론 작업',
    description: '10분마다 실행되어 SSO 서비스와 직원 데이터를 동기화합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '직원 동기화 완료',
  })
  @ApiResponse({
    status: 200,
    description: '크론 작업 실행 성공',
  })
  async triggerEmployeeSync() {
    try {
      await this.employeeSyncService.scheduledSync();
      return {
        success: true,
        message: '직원 동기화 완료',
      };
    } catch (error) {
      this.logger.error('직원 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * 부서 동기화 크론 작업
   * 일반적으로는 @Cron 데코레이터로 10분마다 자동 실행됩니다.
   * 이 엔드포인트는 수동 실행이나 테스트 목적으로 사용됩니다.
   */
  @Get('department-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '부서 동기화 크론 작업',
    description: '10분마다 실행되어 SSO 서비스와 부서 데이터를 동기화합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '부서 동기화 완료',
  })
  @ApiResponse({
    status: 200,
    description: '크론 작업 실행 성공',
  })
  async triggerDepartmentSync() {
    try {
      await this.departmentSyncService.scheduledSync();
      return {
        success: true,
        message: '부서 동기화 완료',
      };
    } catch (error) {
      this.logger.error('부서 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * 하향평가와 맵핑 통계 조회
   * 실제로 맵핑이 존재하는 하향평가 데이터의 통계를 조회합니다.
   */
  @Get('downward-evaluation-mapping-stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '하향평가와 맵핑 통계 조회',
    description: '하향평가와 평가라인 맵핑의 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '통계 조회 성공',
  })
  async getDownwardEvaluationMappingStats() {
    try {
      this.logger.log('=== 하향평가와 맵핑 통계 조회 시작 ===');

      // 1. 전체 평가라인 맵핑 수 (삭제되지 않은 것만)
      const totalMappings = await this.evaluationLineMappingRepository.count({
        where: { deletedAt: IsNull() },
      });

      // 2. 1차 평가자 맵핑 수
      const primaryLine = await this.evaluationLineRepository.findOne({
        where: {
          evaluatorType: EvaluatorType.PRIMARY,
          deletedAt: IsNull(),
        },
      });

      let primaryMappingsCount = 0;
      if (primaryLine) {
        primaryMappingsCount = await this.evaluationLineMappingRepository.count({
          where: {
            evaluationLineId: primaryLine.id,
            deletedAt: IsNull(),
          },
        });
      }

      // 3. 2차 평가자 맵핑 수
      const secondaryLine = await this.evaluationLineRepository.findOne({
        where: {
          evaluatorType: EvaluatorType.SECONDARY,
          deletedAt: IsNull(),
        },
      });

      let secondaryMappingsCount = 0;
      if (secondaryLine) {
        secondaryMappingsCount = await this.evaluationLineMappingRepository.count({
          where: {
            evaluationLineId: secondaryLine.id,
            deletedAt: IsNull(),
          },
        });
      }

      // 4. 전체 하향평가 수 (삭제되지 않은 것만)
      const totalDownwardEvaluations = await this.downwardEvaluationRepository.count({
        where: { deletedAt: IsNull() },
      });

      // 5. 1차 하향평가 수
      const primaryDownwardEvaluations = await this.downwardEvaluationRepository.count({
        where: {
          evaluationType: DownwardEvaluationType.PRIMARY,
          deletedAt: IsNull(),
        },
      });

      // 6. 2차 하향평가 수
      const secondaryDownwardEvaluations = await this.downwardEvaluationRepository.count({
        where: {
          evaluationType: DownwardEvaluationType.SECONDARY,
          deletedAt: IsNull(),
        },
      });

      // 7. 맵핑이 있는 하향평가 수 (평가자, 피평가자, 평가기간, WBS가 모두 일치하는 경우)
      // 1차 평가자 맵핑과 일치하는 하향평가
      let primaryMappingsWithEvaluation = 0;
      if (primaryLine) {
        const primaryMappings = await this.evaluationLineMappingRepository.find({
          where: {
            evaluationLineId: primaryLine.id,
            deletedAt: IsNull(),
          },
          select: ['evaluationPeriodId', 'employeeId', 'evaluatorId', 'wbsItemId'],
        });

        for (const mapping of primaryMappings) {
          // 맵핑이 있는 하향평가 확인: 맵핑의 wbsItemId가 있으면 일치하는 경우만, 없으면 모든 하향평가와 매칭
          // (project-wbs.utils.ts의 로직과 동일: mapping.wbsItemId = downward.wbsId OR mapping.wbsItemId IS NULL)
          let count = 0;
          if (mapping.wbsItemId) {
            // 맵핑에 wbsItemId가 있는 경우: 하향평가의 wbsId와 일치하는 경우만
            count = await this.downwardEvaluationRepository.count({
              where: {
                periodId: mapping.evaluationPeriodId,
                employeeId: mapping.employeeId,
                evaluatorId: mapping.evaluatorId,
                evaluationType: DownwardEvaluationType.PRIMARY,
                wbsId: mapping.wbsItemId,
                deletedAt: IsNull(),
              },
            });
          } else {
            // 맵핑에 wbsItemId가 없는 경우: 모든 하향평가와 매칭 (wbsId 조건 없음)
            count = await this.downwardEvaluationRepository.count({
              where: {
                periodId: mapping.evaluationPeriodId,
                employeeId: mapping.employeeId,
                evaluatorId: mapping.evaluatorId,
                evaluationType: DownwardEvaluationType.PRIMARY,
                deletedAt: IsNull(),
              },
            });
          }
          if (count > 0) {
            primaryMappingsWithEvaluation++;
          }
        }
      }

      // 2차 평가자 맵핑과 일치하는 하향평가
      let secondaryMappingsWithEvaluation = 0;
      if (secondaryLine) {
        const secondaryMappings = await this.evaluationLineMappingRepository.find({
          where: {
            evaluationLineId: secondaryLine.id,
            deletedAt: IsNull(),
          },
          select: ['evaluationPeriodId', 'employeeId', 'evaluatorId', 'wbsItemId'],
        });

        for (const mapping of secondaryMappings) {
          // 맵핑이 있는 하향평가 확인: 맵핑의 wbsItemId가 있으면 일치하는 경우만, 없으면 모든 하향평가와 매칭
          // (project-wbs.utils.ts의 로직과 동일: mapping.wbsItemId = downward.wbsId OR mapping.wbsItemId IS NULL)
          let count = 0;
          if (mapping.wbsItemId) {
            // 맵핑에 wbsItemId가 있는 경우: 하향평가의 wbsId와 일치하는 경우만
            count = await this.downwardEvaluationRepository.count({
              where: {
                periodId: mapping.evaluationPeriodId,
                employeeId: mapping.employeeId,
                evaluatorId: mapping.evaluatorId,
                evaluationType: DownwardEvaluationType.SECONDARY,
                wbsId: mapping.wbsItemId,
                deletedAt: IsNull(),
              },
            });
          } else {
            // 맵핑에 wbsItemId가 없는 경우: 모든 하향평가와 매칭 (wbsId 조건 없음)
            count = await this.downwardEvaluationRepository.count({
              where: {
                periodId: mapping.evaluationPeriodId,
                employeeId: mapping.employeeId,
                evaluatorId: mapping.evaluatorId,
                evaluationType: DownwardEvaluationType.SECONDARY,
                deletedAt: IsNull(),
              },
            });
          }
          if (count > 0) {
            secondaryMappingsWithEvaluation++;
          }
        }
      }

      // 8. 맵핑이 없는 하향평가 수 (평가라인 맵핑과 일치하지 않는 하향평가)
      const allDownwardEvaluations = await this.downwardEvaluationRepository.find({
        where: { deletedAt: IsNull() },
        select: ['id', 'periodId', 'employeeId', 'evaluatorId', 'wbsId', 'evaluationType', 'createdAt'],
      });

      let downwardEvaluationsWithoutMapping = 0;
      const evaluationsWithoutMappingList: any[] = [];

      // Employee와 EvaluationPeriod 정보를 배치로 조회하기 위한 ID 수집
      const employeeIds = new Set<string>();
      const evaluatorIds = new Set<string>();
      const periodIds = new Set<string>();

      for (const evaluation of allDownwardEvaluations) {
        const lineType =
          evaluation.evaluationType === DownwardEvaluationType.PRIMARY
            ? EvaluatorType.PRIMARY
            : EvaluatorType.SECONDARY;

        const line = await this.evaluationLineRepository.findOne({
          where: {
            evaluatorType: lineType,
            deletedAt: IsNull(),
          },
        });

        if (!line) {
          downwardEvaluationsWithoutMapping++;
          employeeIds.add(evaluation.employeeId);
          evaluatorIds.add(evaluation.evaluatorId);
          periodIds.add(evaluation.periodId);
          evaluationsWithoutMappingList.push({
            downwardEvaluationId: evaluation.id,
            employeeId: evaluation.employeeId,
            evaluatorId: evaluation.evaluatorId,
            periodId: evaluation.periodId,
            wbsId: evaluation.wbsId,
            evaluationType: evaluation.evaluationType,
            createdAt: evaluation.createdAt,
            reason: '평가라인이 존재하지 않음',
          });
          continue;
        }

        // 맵핑 존재 여부 확인: wbsItemId가 일치하거나 NULL인 경우 모두 매칭
        // (project-wbs.utils.ts의 로직과 동일: mapping.wbsItemId = downward.wbsId OR mapping.wbsItemId IS NULL)
        const mappingExists = await this.evaluationLineMappingRepository.count({
          where: [
            {
              evaluationLineId: line.id,
              evaluationPeriodId: evaluation.periodId,
              employeeId: evaluation.employeeId,
              evaluatorId: evaluation.evaluatorId,
              deletedAt: IsNull(),
              wbsItemId: evaluation.wbsId, // wbsItemId가 하향평가의 wbsId와 일치하는 경우
            },
            {
              evaluationLineId: line.id,
              evaluationPeriodId: evaluation.periodId,
              employeeId: evaluation.employeeId,
              evaluatorId: evaluation.evaluatorId,
              deletedAt: IsNull(),
              wbsItemId: IsNull(), // wbsItemId가 NULL인 경우 (WBS 없이 맵핑된 경우)
            },
          ],
        });

        if (mappingExists === 0) {
          downwardEvaluationsWithoutMapping++;
          employeeIds.add(evaluation.employeeId);
          evaluatorIds.add(evaluation.evaluatorId);
          periodIds.add(evaluation.periodId);
          evaluationsWithoutMappingList.push({
            downwardEvaluationId: evaluation.id,
            employeeId: evaluation.employeeId,
            evaluatorId: evaluation.evaluatorId,
            periodId: evaluation.periodId,
            wbsId: evaluation.wbsId,
            evaluationType: evaluation.evaluationType,
            createdAt: evaluation.createdAt,
            reason: '맵핑이 존재하지 않음',
          });
        }
      }

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

      // 맵핑이 없는 하향평가 목록에 상세 정보 추가
      const detailedList = evaluationsWithoutMappingList.map((item) => {
        const employee = employeeMap.get(item.employeeId);
        const evaluator = evaluatorMap.get(item.evaluatorId);
        const period = periodMap.get(item.periodId);

        return {
          downwardEvaluationId: item.downwardEvaluationId,
          reason: item.reason,
          evaluationType: item.evaluationType,
          createdAt: item.createdAt,
          wbsId: item.wbsId,
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
      const filename = `downward-evaluations-without-mapping_${timestamp}.json`;
      const filepath = path.join(outputDir, filename);

      const outputData = {
        generatedAt: dayjs().toISOString(),
        totalCount: detailedList.length,
        summary: {
          byEvaluationType: {
            primary: detailedList.filter((e) => e.evaluationType === 'primary').length,
            secondary: detailedList.filter((e) => e.evaluationType === 'secondary').length,
          },
          byReason: {
            평가라인없음: detailedList.filter((e) => e.reason === '평가라인이 존재하지 않음').length,
            맵핑없음: detailedList.filter((e) => e.reason === '맵핑이 존재하지 않음').length,
          },
        },
        evaluations: detailedList,
      };

      fs.writeFileSync(filepath, JSON.stringify(outputData, null, 2), 'utf-8');
      this.logger.log(`맵핑이 없는 하향평가 목록이 저장되었습니다: ${filepath}`);

      // 9. 맵핑은 있지만 하향평가가 없는 맵핑 수
      // 평가라인 정보를 먼저 조회
      const allLines = await this.evaluationLineRepository.find({
        where: { deletedAt: IsNull() },
      });
      const lineTypeMap = new Map<string, EvaluatorType>();
      for (const line of allLines) {
        lineTypeMap.set(line.id, line.evaluatorType);
      }

      const allMappings = await this.evaluationLineMappingRepository.find({
        where: { deletedAt: IsNull() },
        select: ['evaluationPeriodId', 'employeeId', 'evaluatorId', 'wbsItemId', 'evaluationLineId'],
      });

      let mappingsWithoutEvaluation = 0;
      for (const mapping of allMappings) {
        const lineType = lineTypeMap.get(mapping.evaluationLineId);
        if (!lineType) continue;

        const evaluationType =
          lineType === EvaluatorType.PRIMARY
            ? DownwardEvaluationType.PRIMARY
            : DownwardEvaluationType.SECONDARY;

        // 하향평가 존재 여부 확인: 맵핑의 wbsItemId가 있으면 일치하는 경우만, 없으면 모든 하향평가와 매칭
        // (project-wbs.utils.ts의 로직과 동일: mapping.wbsItemId = downward.wbsId OR mapping.wbsItemId IS NULL)
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
          mappingsWithoutEvaluation++;
        }
      }

      const stats = {
        mappings: {
          total: totalMappings,
          primary: primaryMappingsCount,
          secondary: secondaryMappingsCount,
          withoutEvaluation: mappingsWithoutEvaluation,
        },
        downwardEvaluations: {
          total: totalDownwardEvaluations,
          primary: primaryDownwardEvaluations,
          secondary: secondaryDownwardEvaluations,
          withoutMapping: downwardEvaluationsWithoutMapping,
        },
        mappingsWithEvaluation: {
          primary: primaryMappingsWithEvaluation,
          secondary: secondaryMappingsWithEvaluation,
          total: primaryMappingsWithEvaluation + secondaryMappingsWithEvaluation,
        },
        summary: {
          totalMappings: totalMappings,
          totalDownwardEvaluations: totalDownwardEvaluations,
          mappingsWithEvaluation: primaryMappingsWithEvaluation + secondaryMappingsWithEvaluation,
          mappingsWithoutEvaluation: mappingsWithoutEvaluation,
          downwardEvaluationsWithoutMapping: downwardEvaluationsWithoutMapping,
        },
      };

      this.logger.log(
        `=== 하향평가와 맵핑 통계 ===\n` +
          `맵핑:\n` +
          `  - 전체: ${stats.mappings.total}개\n` +
          `  - 1차 평가자: ${stats.mappings.primary}개\n` +
          `  - 2차 평가자: ${stats.mappings.secondary}개\n` +
          `  - 하향평가 없는 맵핑: ${stats.mappings.withoutEvaluation}개\n` +
          `하향평가:\n` +
          `  - 전체: ${stats.downwardEvaluations.total}개\n` +
          `  - 1차: ${stats.downwardEvaluations.primary}개\n` +
          `  - 2차: ${stats.downwardEvaluations.secondary}개\n` +
          `  - 맵핑 없는 하향평가: ${stats.downwardEvaluations.withoutMapping}개\n` +
          `맵핑과 하향평가 일치:\n` +
          `  - 1차: ${stats.mappingsWithEvaluation.primary}개\n` +
          `  - 2차: ${stats.mappingsWithEvaluation.secondary}개\n` +
          `  - 전체: ${stats.mappingsWithEvaluation.total}개`,
      );

      return {
        success: true,
        stats,
        ...(detailedList.length > 0 && {
          downwardEvaluationsWithoutMappingFile: filepath,
          downwardEvaluationsWithoutMappingCount: detailedList.length,
        }),
      };
    } catch (error) {
      this.logger.error('하향평가와 맵핑 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 누락된 맵핑 추가
   * 하향평가 데이터를 기반으로 평가라인 맵핑을 생성합니다.
   */
  @Post('create-missing-mapping')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '누락된 맵핑 추가',
    description: '하향평가 ID를 기반으로 누락된 평가라인 맵핑을 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '맵핑 생성 성공',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
  })
  @ApiResponse({
    status: 404,
    description: '하향평가를 찾을 수 없음',
  })
  async createMissingMapping(
    @Body() body: { downwardEvaluationId: string; createdBy?: string },
  ) {
    try {
      const { downwardEvaluationId, createdBy = 'system' } = body;

      if (!downwardEvaluationId) {
        throw new BadRequestException('하향평가 ID가 필요합니다.');
      }

      // 하향평가 조회
      const evaluation = await this.downwardEvaluationRepository.findOne({
        where: {
          id: downwardEvaluationId,
          deletedAt: IsNull(),
        },
      });

      if (!evaluation) {
        throw new NotFoundException(
          `하향평가를 찾을 수 없습니다: ${downwardEvaluationId}`,
        );
      }

      // 평가라인 조회 (평가 유형에 따라)
      const lineType =
        evaluation.evaluationType === DownwardEvaluationType.PRIMARY
          ? EvaluatorType.PRIMARY
          : EvaluatorType.SECONDARY;

      const line = await this.evaluationLineRepository.findOne({
        where: {
          evaluatorType: lineType,
          deletedAt: IsNull(),
        },
      });

      if (!line) {
        throw new NotFoundException(
          `${lineType} 평가라인을 찾을 수 없습니다.`,
        );
      }

      // 이미 맵핑이 존재하는지 확인
      const existingMapping = await this.evaluationLineMappingRepository.findOne({
        where: [
          {
            evaluationLineId: line.id,
            evaluationPeriodId: evaluation.periodId,
            employeeId: evaluation.employeeId,
            evaluatorId: evaluation.evaluatorId,
            deletedAt: IsNull(),
            wbsItemId: evaluation.wbsId,
          },
          {
            evaluationLineId: line.id,
            evaluationPeriodId: evaluation.periodId,
            employeeId: evaluation.employeeId,
            evaluatorId: evaluation.evaluatorId,
            deletedAt: IsNull(),
            wbsItemId: IsNull(),
          },
        ],
      });

      if (existingMapping) {
        this.logger.warn(
          `이미 맵핑이 존재합니다 - 맵핑 ID: ${existingMapping.id}, 하향평가 ID: ${downwardEvaluationId}`,
        );
        return {
          success: true,
          message: '이미 맵핑이 존재합니다.',
          mapping: {
            id: existingMapping.id,
            evaluationLineId: existingMapping.evaluationLineId,
            evaluationPeriodId: existingMapping.evaluationPeriodId,
            employeeId: existingMapping.employeeId,
            evaluatorId: existingMapping.evaluatorId,
            wbsItemId: existingMapping.wbsItemId,
          },
        };
      }

      // 맵핑 생성
      const mapping = this.evaluationLineMappingRepository.create({
        evaluationLineId: line.id,
        evaluationPeriodId: evaluation.periodId,
        employeeId: evaluation.employeeId,
        evaluatorId: evaluation.evaluatorId,
        wbsItemId: evaluation.wbsId,
        createdBy,
      });

      const savedMapping = await this.evaluationLineMappingRepository.save(mapping);

      this.logger.log(
        `누락된 맵핑 생성 완료 - 맵핑 ID: ${savedMapping.id}, 하향평가 ID: ${downwardEvaluationId}, 평가 유형: ${evaluation.evaluationType}`,
      );

      return {
        success: true,
        message: '맵핑이 성공적으로 생성되었습니다.',
        mapping: {
          id: savedMapping.id,
          evaluationLineId: savedMapping.evaluationLineId,
          evaluationPeriodId: savedMapping.evaluationPeriodId,
          employeeId: savedMapping.employeeId,
          evaluatorId: savedMapping.evaluatorId,
          wbsItemId: savedMapping.wbsItemId,
          createdAt: savedMapping.createdAt,
        },
        downwardEvaluation: {
          id: evaluation.id,
          evaluationType: evaluation.evaluationType,
          periodId: evaluation.periodId,
          employeeId: evaluation.employeeId,
          evaluatorId: evaluation.evaluatorId,
          wbsId: evaluation.wbsId,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('누락된 맵핑 생성 실패:', error);
      throw error;
    }
  }

  /**
   * JSON 파일에서 누락된 모든 맵핑 일괄 생성
   * downward-evaluations-without-mapping JSON 파일을 읽어서 모든 맵핑을 생성합니다.
   */
  @Post('create-all-missing-mappings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '누락된 모든 맵핑 일괄 생성',
    description: 'JSON 파일에서 누락된 맵핑 목록을 읽어서 모든 맵핑을 일괄 생성합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '맵핑 일괄 생성 완료',
  })
  async createAllMissingMappings(
    @Body() body: { filePath?: string; createdBy?: string },
  ) {
    try {
      const { filePath, createdBy = 'system' } = body;

      // 파일 경로 결정
      const targetFilePath = filePath || 
        path.join(process.cwd(), 'logs', 'downward-evaluations-without-mapping_2026-01-10_04-42-42.json');

      this.logger.log(`JSON 파일 읽기 시작: ${targetFilePath}`);

      // JSON 파일 읽기
      if (!fs.existsSync(targetFilePath)) {
        throw new NotFoundException(`파일을 찾을 수 없습니다: ${targetFilePath}`);
      }

      const fileContent = fs.readFileSync(targetFilePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);

      if (!jsonData.evaluations || !Array.isArray(jsonData.evaluations)) {
        throw new BadRequestException('JSON 파일 형식이 올바르지 않습니다.');
      }

      const evaluations = jsonData.evaluations;
      this.logger.log(`총 ${evaluations.length}개의 하향평가에 대한 맵핑 생성 시작`);

      // 평가라인 미리 조회 (성능 최적화)
      const primaryLine = await this.evaluationLineRepository.findOne({
        where: {
          evaluatorType: EvaluatorType.PRIMARY,
          deletedAt: IsNull(),
        },
      });

      const secondaryLine = await this.evaluationLineRepository.findOne({
        where: {
          evaluatorType: EvaluatorType.SECONDARY,
          deletedAt: IsNull(),
        },
      });

      if (!primaryLine || !secondaryLine) {
        throw new NotFoundException('평가라인을 찾을 수 없습니다.');
      }

      const results = {
        total: evaluations.length,
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [] as any[],
        created: [] as any[],
      };

      // 각 하향평가에 대해 맵핑 생성
      for (let i = 0; i < evaluations.length; i++) {
        const evaluation = evaluations[i];
        const downwardEvaluationId = evaluation.downwardEvaluationId;

        try {
          // 하향평가 조회
          const downwardEvaluation = await this.downwardEvaluationRepository.findOne({
            where: {
              id: downwardEvaluationId,
              deletedAt: IsNull(),
            },
          });

          if (!downwardEvaluation) {
            results.failed++;
            results.errors.push({
              downwardEvaluationId,
              error: '하향평가를 찾을 수 없습니다.',
            });
            this.logger.warn(
              `[${i + 1}/${evaluations.length}] 하향평가를 찾을 수 없음: ${downwardEvaluationId}`,
            );
            continue;
          }

          // 평가라인 선택
          const line =
            downwardEvaluation.evaluationType === DownwardEvaluationType.PRIMARY
              ? primaryLine
              : secondaryLine;

          // 이미 맵핑이 존재하는지 확인
          const existingMapping = await this.evaluationLineMappingRepository.findOne({
            where: [
              {
                evaluationLineId: line.id,
                evaluationPeriodId: downwardEvaluation.periodId,
                employeeId: downwardEvaluation.employeeId,
                evaluatorId: downwardEvaluation.evaluatorId,
                deletedAt: IsNull(),
                wbsItemId: downwardEvaluation.wbsId,
              },
              {
                evaluationLineId: line.id,
                evaluationPeriodId: downwardEvaluation.periodId,
                employeeId: downwardEvaluation.employeeId,
                evaluatorId: downwardEvaluation.evaluatorId,
                deletedAt: IsNull(),
                wbsItemId: IsNull(),
              },
            ],
          });

          if (existingMapping) {
            results.skipped++;
            this.logger.debug(
              `[${i + 1}/${evaluations.length}] 이미 맵핑 존재: ${downwardEvaluationId}`,
            );
            continue;
          }

          // 맵핑 생성
          const mapping = this.evaluationLineMappingRepository.create({
            evaluationLineId: line.id,
            evaluationPeriodId: downwardEvaluation.periodId,
            employeeId: downwardEvaluation.employeeId,
            evaluatorId: downwardEvaluation.evaluatorId,
            wbsItemId: downwardEvaluation.wbsId,
            createdBy,
          });

          const savedMapping = await this.evaluationLineMappingRepository.save(mapping);
          results.success++;
          results.created.push({
            mappingId: savedMapping.id,
            downwardEvaluationId,
            evaluationType: downwardEvaluation.evaluationType,
          });

          if ((i + 1) % 10 === 0) {
            this.logger.log(
              `진행 상황: ${i + 1}/${evaluations.length} (성공: ${results.success}, 건너뜀: ${results.skipped}, 실패: ${results.failed})`,
            );
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            downwardEvaluationId,
            error: error.message || String(error),
          });
          this.logger.error(
            `[${i + 1}/${evaluations.length}] 맵핑 생성 실패: ${downwardEvaluationId}`,
            error,
          );
        }
      }

      this.logger.log(
        `=== 맵핑 일괄 생성 완료 ===\n` +
          `전체: ${results.total}개\n` +
          `성공: ${results.success}개\n` +
          `건너뜀: ${results.skipped}개 (이미 존재)\n` +
          `실패: ${results.failed}개`,
      );

      return {
        success: true,
        message: '맵핑 일괄 생성이 완료되었습니다.',
        results,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('누락된 맵핑 일괄 생성 실패:', error);
      throw error;
    }
  }
}
