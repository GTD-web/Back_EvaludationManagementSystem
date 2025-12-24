import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { DeleteWbsSelfEvaluationsByAssignmentResponse } from '@context/performance-evaluation-context/handlers/self-evaluation';
import { WbsAssignmentListItem } from '@context/evaluation-criteria-management-context/handlers/wbs-assignment/queries/get-wbs-assignment-list.handler';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { ProjectService } from '@domain/common/project/project.service';
import { EvaluationLineService } from '@domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { WbsItemStatus } from '@domain/common/wbs-item/wbs-item.types';
import type {
  CreateEvaluationWbsAssignmentData,
  OrderDirection,
} from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

/**
 * WBS 할당 비즈니스 서비스
 *
 * WBS 할당 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 여러 컨텍스트 서비스 조율
 * - 알림 서비스 연동 (추후)
 * - 복합 비즈니스 로직 처리
 */
@Injectable()
export class WbsAssignmentBusinessService {
  private readonly logger = new Logger(WbsAssignmentBusinessService.name);

  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly employeeService: EmployeeService,
    private readonly projectService: ProjectService,
    private readonly evaluationLineService: EvaluationLineService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    // private readonly notificationService: NotificationService, // TODO: 알림 서비스 추가 시 주입
    // private readonly organizationManagementService: OrganizationManagementService, // TODO: 조직 관리 서비스 추가 시 주입
  ) {}

  /**
   * WBS를 할당하고 관련 알림을 발송한다
   */
  async WBS를_할당한다(params: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    assignedBy: string;
  }): Promise<any> {
    this.logger.log('WBS 할당 비즈니스 로직 시작', {
      employeeId: params.employeeId,
      wbsItemId: params.wbsItemId,
      projectId: params.projectId,
    });

    // 1. WBS 할당 생성 (컨텍스트 호출)
    const data: CreateEvaluationWbsAssignmentData = {
      employeeId: params.employeeId,
      wbsItemId: params.wbsItemId,
      projectId: params.projectId,
      periodId: params.periodId,
      assignedBy: params.assignedBy,
    };

    const assignment =
      await this.evaluationCriteriaManagementService.WBS를_할당한다(
        data,
        params.assignedBy,
      );

    // 2. WBS 평가기준 자동 생성 (없는 경우)
    const existingCriteria =
      await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(
        params.wbsItemId,
      );

    if (!existingCriteria || existingCriteria.length === 0) {
      this.logger.log('WBS 평가기준이 없어 빈 기준을 생성합니다', {
        wbsItemId: params.wbsItemId,
      });

      await this.evaluationCriteriaManagementService.WBS_평가기준을_생성한다(
        {
          wbsItemId: params.wbsItemId,
          criteria: '', // 빈 평가기준으로 생성
          importance: 5, // 기본 중요도
        },
        params.assignedBy,
      );
    }

    // 3. 평가라인 자동 구성
    await this.평가라인을_자동으로_구성한다(
      params.employeeId,
      params.wbsItemId,
      params.projectId,
      params.periodId,
      params.assignedBy,
    );

    // 4. WBS별 평가라인 구성 (동료평가를 위한 평가라인)
    this.logger.log('WBS별 평가라인 구성 시작', {
      employeeId: params.employeeId,
      wbsItemId: params.wbsItemId,
      periodId: params.periodId,
    });

    const wbsEvaluationLineResult =
      await this.evaluationCriteriaManagementService.직원_WBS별_평가라인을_구성한다(
        params.employeeId,
        params.wbsItemId,
        params.periodId,
        params.assignedBy,
      );

    this.logger.log('WBS별 평가라인 구성 완료', {
      createdLines: wbsEvaluationLineResult.createdLines,
      createdMappings: wbsEvaluationLineResult.createdMappings,
    });

    // 5. 활동 내역 기록
    try {
      await this.activityLogContextService.활동내역을_기록한다({
        periodId: params.periodId,
        employeeId: params.employeeId,
        activityType: 'wbs_assignment',
        activityAction: 'created',
        activityTitle: 'WBS 할당',
        relatedEntityType: 'wbs_assignment',
        relatedEntityId: assignment.id,
        performedBy: params.assignedBy,
        activityMetadata: {
          wbsItemId: params.wbsItemId,
          projectId: params.projectId,
        },
      });
    } catch (error) {
      // 활동 내역 기록 실패 시에도 WBS 할당은 정상 처리
      this.logger.warn('WBS 할당 생성 활동 내역 기록 실패', {
        assignmentId: assignment.id,
        error: error.message,
      });
    }

    // 6. 알림 발송 (추후 구현)
    // TODO: WBS 할당 알림 발송
    // await this.notificationService.send({
    //   type: 'WBS_ASSIGNED',
    //   recipientId: params.employeeId,
    //   data: {
    //     wbsItemId: params.wbsItemId,
    //     projectId: params.projectId,
    //     periodId: params.periodId,
    //   },
    // });

    this.logger.log('WBS 할당, 평가기준 생성, 평가라인 구성 완료', {
      assignmentId: assignment.id,
    });

    return assignment;
  }

  /**
   * WBS 할당을 취소하고 관련 데이터를 정리한다
   *
   * 실행 순서:
   * 1. 자기평가 삭제 (해당 직원의 해당 WBS 항목 자기평가 모두 삭제)
   * 2. 남은 할당 확인
   * 3. 평가기준 삭제 (마지막 할당인 경우에만)
   * 4. 평가라인 매핑 삭제 (2차 평가자 연결 해제)
   * 5. WBS 할당 삭제 (실제 할당 레코드 삭제)
   * 6. 활동 내역 기록
   *
   * 참고:
   * - 컨텍스트 레벨에서 멱등성 보장 (할당이 없어도 성공 처리)
   * - 비즈니스 서비스는 관련 데이터 정리를 수행하므로, 할당이 없으면 조기 반환
   */
  async WBS_할당을_취소한다(params: {
    assignmentId: string;
    cancelledBy: string;
  }): Promise<void> {
    this.logger.log('WBS 할당 취소 비즈니스 로직 시작', {
      assignmentId: params.assignmentId,
    });

    // 1. 할당 정보 조회 (평가기준 정리를 위해 wbsItemId와 periodId 필요)
    // Domain 서비스를 통해 직접 ID로 조회합니다
    const assignment = await this.evaluationWbsAssignmentService.ID로_조회한다(
      params.assignmentId,
    );

    // 할당이 없으면 평가기준 정리할 것이 없으므로 조기 반환
    // (컨텍스트에서 취소는 이미 멱등성을 보장함)
    if (!assignment) {
      this.logger.log(
        'WBS 할당을 찾을 수 없습니다. 평가기준 정리를 생략합니다.',
        {
          assignmentId: params.assignmentId,
        },
      );
      return;
    }

    const employeeId = assignment.employeeId;
    const wbsItemId = assignment.wbsItemId;
    const periodId = assignment.periodId;

    this.logger.log('🔵 [STEP 1] WBS 할당 정보 확인 완료, 자기평가 삭제 시작', {
      employeeId,
      wbsItemId,
      periodId,
      hasPerformanceEvaluationService: !!this.performanceEvaluationService,
    });

    // STEP 1: 해당 WBS 항목의 자기평가 삭제
    let deletionResult: DeleteWbsSelfEvaluationsByAssignmentResponse = {
      deletedCount: 0,
      deletedEvaluations: [],
    };

    try {
      this.logger.log('🔵 [STEP 1-1] 자기평가 삭제 호출 시작');
      deletionResult =
        await this.performanceEvaluationService.WBS할당_자기평가를_삭제한다({
          employeeId,
          periodId,
          wbsItemId,
          deletedBy: params.cancelledBy,
        });

      this.logger.log('🔵 [STEP 1-2] 자기평가 삭제 호출 완료', {
        deletedCount: deletionResult.deletedCount,
        deletedEvaluations: deletionResult.deletedEvaluations,
      });

      if (deletionResult.deletedCount > 0) {
        this.logger.log(
          `✅ 자기평가 ${deletionResult.deletedCount}개 삭제 완료`,
          {
            assignmentId: params.assignmentId,
            wbsItemId,
            deletedEvaluations: deletionResult.deletedEvaluations,
          },
        );
      } else {
        this.logger.log('ℹ️ 삭제할 자기평가가 없습니다', {
          employeeId,
          periodId,
          wbsItemId,
        });
      }
    } catch (error) {
      this.logger.error('❌ 자기평가 삭제 중 에러 발생', {
        error: error.message,
        stack: error.stack,
        employeeId,
        periodId,
        wbsItemId,
      });
      // 에러가 발생해도 WBS 할당 취소는 계속 진행
    }

    // STEP 2: 해당 WBS 항목에 다른 할당이 있는지 확인
    this.logger.log('🔵 [STEP 2] 남은 WBS 할당 확인 시작', { wbsItemId });
    const remainingAssignments =
      await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
        wbsItemId,
        periodId,
      );

    // STEP 3: 마지막 할당이었다면 평가기준 삭제
    if (!remainingAssignments || remainingAssignments.length === 0) {
      this.logger.log('🔵 [STEP 3] 마지막 WBS 할당이므로 평가기준 삭제 시작', {
        wbsItemId,
      });

      await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
        wbsItemId,
        params.cancelledBy,
      );
      this.logger.log('✅ 평가기준 삭제 완료', { wbsItemId });
    } else {
      this.logger.log('ℹ️ 남은 WBS 할당이 있어 평가기준은 유지합니다', {
        wbsItemId,
        remainingCount: remainingAssignments.length,
      });
    }

    // STEP 4: 해당 WBS에 대한 평가라인 매핑 삭제 (2차 평가자)
    this.logger.log('🔵 [STEP 4] 평가라인 매핑 삭제 시작', {
      employeeId,
      wbsItemId,
      periodId,
    });
    await this.평가라인_매핑을_삭제한다(
      employeeId,
      wbsItemId,
      periodId,
      params.cancelledBy,
    );
    this.logger.log('✅ 평가라인 매핑 삭제 완료');

    // STEP 5: WBS 할당 취소 (컨텍스트 호출 - 멱등성 보장됨)
    this.logger.log('🔵 [STEP 5] WBS 할당 취소 시작', {
      assignmentId: params.assignmentId,
    });
    await this.evaluationCriteriaManagementService.WBS_할당을_취소한다(
      params.assignmentId,
      params.cancelledBy,
    );
    this.logger.log('✅ WBS 할당 취소 완료', {
      assignmentId: params.assignmentId,
    });

    // STEP 6: 활동 내역 기록
    this.logger.log('🔵 [STEP 6] 활동 내역 기록 시작');
    try {
      await this.activityLogContextService.활동내역을_기록한다({
        periodId,
        employeeId,
        activityType: 'wbs_assignment',
        activityAction: 'cancelled',
        activityTitle: 'WBS 할당 취소',
        relatedEntityType: 'wbs_assignment',
        relatedEntityId: params.assignmentId,
        performedBy: params.cancelledBy,
        activityMetadata: {
          wbsItemId,
          projectId: assignment.projectId,
        },
      });
      this.logger.log('✅ 활동 내역 기록 완료');
    } catch (error) {
      // 활동 내역 기록 실패 시에도 WBS 할당 취소는 정상 처리
      this.logger.warn('⚠️ 활동 내역 기록 실패 (계속 진행)', {
        assignmentId: params.assignmentId,
        error: error.message,
      });
    }

    // STEP 7: 알림 발송 (추후 구현)
    // TODO: WBS 할당 취소 알림 발송
    // await this.notificationService.send({
    //   type: 'WBS_ASSIGNMENT_CANCELLED',
    //   recipientId: assignment.employeeId,
    //   data: {
    //     assignmentId: params.assignmentId,
    //   },
    // });

    this.logger.log('🎉 WBS 할당 취소 프로세스 완료', {
      assignmentId: params.assignmentId,
      자기평가_삭제: deletionResult.deletedCount,
      평가기준_삭제: !remainingAssignments || remainingAssignments.length === 0,
    });
  }

  /**
   * WBS ID를 사용하여 WBS 할당을 취소하고 관련 데이터를 정리한다
   *
   * 실행 순서:
   * 1. WBS 할당 상세 조회 (할당 ID 확인)
   * 2. WBS_할당을_취소한다 메서드 호출 (내부에서 순차적으로 처리)
   *    - 자기평가 삭제
   *    - 평가기준 삭제 (마지막 할당인 경우)
   *    - 평가라인 매핑 삭제
   *    - WBS 할당 삭제
   */
  async WBS_할당을_WBS_ID로_취소한다(params: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    cancelledBy: string;
  }): Promise<void> {
    this.logger.log('WBS ID 기반 할당 취소 비즈니스 로직 시작', {
      employeeId: params.employeeId,
      wbsItemId: params.wbsItemId,
      projectId: params.projectId,
      periodId: params.periodId,
    });

    // 1. WBS 할당 상세 조회하여 할당 ID 찾기
    const assignmentDetail =
      await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(
        params.employeeId,
        params.wbsItemId,
        params.projectId,
        params.periodId,
      );

    // 할당이 없으면 평가기준 정리할 것이 없으므로 조기 반환
    // (컨텍스트에서 취소는 이미 멱등성을 보장함)
    if (!assignmentDetail) {
      this.logger.log(
        'WBS 할당을 찾을 수 없습니다. 평가기준 정리를 생략합니다.',
        {
          employeeId: params.employeeId,
          wbsItemId: params.wbsItemId,
          projectId: params.projectId,
          periodId: params.periodId,
        },
      );
      return;
    }

    // 2. 기존 취소 메서드 호출 (활동 내역 기록 포함)
    await this.WBS_할당을_취소한다({
      assignmentId: assignmentDetail.id,
      cancelledBy: params.cancelledBy,
    });
  }

  /**
   * WBS를 대량으로 할당하고 관련 알림을 발송한다
   */
  async WBS를_대량으로_할당한다(params: {
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      projectId: string;
      periodId: string;
      assignedBy: string;
    }>;
    assignedBy: string;
  }): Promise<any[]> {
    this.logger.log('WBS 대량 할당 비즈니스 로직 시작', {
      count: params.assignments.length,
    });

    // 1. WBS 대량 할당 (컨텍스트 호출)
    const assignmentsData: CreateEvaluationWbsAssignmentData[] =
      params.assignments.map((assignment) => ({
        employeeId: assignment.employeeId,
        wbsItemId: assignment.wbsItemId,
        projectId: assignment.projectId,
        periodId: assignment.periodId,
        assignedBy: params.assignedBy,
      }));

    const assignments =
      await this.evaluationCriteriaManagementService.WBS를_대량으로_할당한다(
        assignmentsData,
        params.assignedBy,
      );

    // 2. 각 WBS 항목에 대해 평가기준 자동 생성 (없는 경우)
    const uniqueWbsItemIds = [
      ...new Set(params.assignments.map((a) => a.wbsItemId)),
    ];

    await Promise.all(
      uniqueWbsItemIds.map(async (wbsItemId) => {
        const existingCriteria =
          await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(
            wbsItemId,
          );

        if (!existingCriteria || existingCriteria.length === 0) {
          this.logger.log('WBS 평가기준이 없어 빈 기준을 생성합니다', {
            wbsItemId,
          });

          await this.evaluationCriteriaManagementService.WBS_평가기준을_생성한다(
            {
              wbsItemId,
              criteria: '', // 빈 평가기준으로 생성
              importance: 5, // 기본 중요도
            },
            params.assignedBy,
          );
        }
      }),
    );

    // 3. 각 할당에 대해 평가라인 자동 구성
    await Promise.all(
      params.assignments.map(async (assignment) => {
        await this.평가라인을_자동으로_구성한다(
          assignment.employeeId,
          assignment.wbsItemId,
          assignment.projectId,
          assignment.periodId,
          params.assignedBy,
        );
      }),
    );

    // 4. 각 할당에 대해 활동 내역 기록
    await Promise.all(
      assignments.map(async (assignment) => {
        try {
          await this.activityLogContextService.활동내역을_기록한다({
            periodId: assignment.periodId,
            employeeId: assignment.employeeId,
            activityType: 'wbs_assignment',
            activityAction: 'created',
            activityTitle: 'WBS 할당',
            relatedEntityType: 'wbs_assignment',
            relatedEntityId: assignment.id,
            performedBy: params.assignedBy,
            activityMetadata: {
              wbsItemId: assignment.wbsItemId,
              projectId: assignment.projectId,
            },
          });
        } catch (error) {
          // 활동 내역 기록 실패 시에도 WBS 할당은 정상 처리
          this.logger.warn('WBS 대량 할당 활동 내역 기록 실패', {
            assignmentId: assignment.id,
            error: error.message,
          });
        }
      }),
    );

    // 5. 각 직원에게 알림 발송 (추후 구현)
    // TODO: 대량 할당 알림 발송
    // const uniqueEmployeeIds = [
    //   ...new Set(params.assignments.map((a) => a.employeeId)),
    // ];
    // await Promise.all(
    //   uniqueEmployeeIds.map((employeeId) =>
    //     this.notificationService.send({
    //       type: 'WBS_BULK_ASSIGNED',
    //       recipientId: employeeId,
    //       data: {
    //         assignmentCount: assignments.filter(
    //           (a) => a.employeeId === employeeId,
    //         ).length,
    //       },
    //     }),
    //   ),
    // );

    this.logger.log('WBS 대량 할당, 평가기준 생성, 평가라인 구성 완료', {
      count: assignments.length,
    });

    return assignments;
  }

  /**
   * WBS 할당 순서를 변경한다
   */
  async WBS_할당_순서를_변경한다(params: {
    assignmentId: string;
    direction: OrderDirection;
    updatedBy: string;
  }): Promise<any> {
    this.logger.log('WBS 할당 순서 변경 비즈니스 로직 시작', {
      assignmentId: params.assignmentId,
      direction: params.direction,
    });

    // WBS 할당 순서 변경 (컨텍스트 호출)
    const assignment =
      await this.evaluationCriteriaManagementService.WBS_할당_순서를_변경한다(
        params.assignmentId,
        params.direction,
        params.updatedBy,
      );

    this.logger.log('WBS 할당 순서 변경 완료', {
      assignmentId: params.assignmentId,
    });

    return assignment;
  }

  /**
   * WBS ID를 사용하여 WBS 할당 순서를 변경한다
   */
  async WBS_할당_순서를_WBS_ID로_변경한다(params: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    direction: OrderDirection;
    updatedBy: string;
  }): Promise<any> {
    this.logger.log('WBS ID 기반 할당 순서 변경 비즈니스 로직 시작', {
      employeeId: params.employeeId,
      wbsItemId: params.wbsItemId,
      projectId: params.projectId,
      periodId: params.periodId,
      direction: params.direction,
    });

    // 1. WBS 할당 상세 조회하여 할당 ID 찾기
    const assignmentDetail =
      await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(
        params.employeeId,
        params.wbsItemId,
        params.projectId,
        params.periodId,
      );

    if (!assignmentDetail) {
      throw new NotFoundException(
        `WBS 할당을 찾을 수 없습니다. (employeeId: ${params.employeeId}, wbsItemId: ${params.wbsItemId}, projectId: ${params.projectId}, periodId: ${params.periodId})`,
      );
    }

    // 2. 할당 ID를 사용하여 순서 변경
    const assignment =
      await this.evaluationCriteriaManagementService.WBS_할당_순서를_변경한다(
        assignmentDetail.id,
        params.direction,
        params.updatedBy,
      );

    this.logger.log('WBS ID 기반 할당 순서 변경 완료', {
      assignmentId: assignmentDetail.id,
    });

    return assignment;
  }

  /**
   * 평가기간의 WBS 할당을 초기화하고 관련 알림을 발송한다
   */
  async 평가기간의_WBS_할당을_초기화한다(params: {
    periodId: string;
    resetBy: string;
  }): Promise<void> {
    this.logger.log('평가기간 WBS 할당 초기화 비즈니스 로직 시작', {
      periodId: params.periodId,
    });

    // 1. 초기화 전 모든 할당 조회하여 영향받는 WBS 항목 ID 수집
    const allAssignments =
      await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
        { periodId: params.periodId },
        1,
        10000,
      );

    const affectedWbsItemIds = [
      ...new Set(allAssignments.assignments.map((a) => a.wbsItemId)),
    ];

    // 2. 평가기간 WBS 할당 초기화 (컨텍스트 호출)
    await this.evaluationCriteriaManagementService.평가기간의_WBS_할당을_초기화한다(
      params.periodId,
      params.resetBy,
    );

    // 3. 고아 평가기준 정리 (할당이 없는 WBS 항목의 평가기준 삭제)
    await Promise.all(
      affectedWbsItemIds.map(async (wbsItemId) => {
        const remainingAssignments =
          await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
            wbsItemId,
            params.periodId,
          );

        if (!remainingAssignments || remainingAssignments.length === 0) {
          this.logger.log('고아 평가기준 삭제', { wbsItemId });
          await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
            wbsItemId,
            params.resetBy,
          );
        }
      }),
    );

    // 4. 관련 직원들에게 알림 발송 (추후 구현)
    // TODO: 평가기간 WBS 할당 초기화 알림 발송
    // const affectedEmployees = await this.getAffectedEmployees(params.periodId);
    // await Promise.all(
    //   affectedEmployees.map((employeeId) =>
    //     this.notificationService.send({
    //       type: 'PERIOD_WBS_ASSIGNMENTS_RESET',
    //       recipientId: employeeId,
    //       data: {
    //         periodId: params.periodId,
    //       },
    //     }),
    //   ),
    // );

    this.logger.log('평가기간 WBS 할당 초기화 및 평가기준 정리 완료', {
      periodId: params.periodId,
      cleanedWbsItems: affectedWbsItemIds.length,
    });
  }

  /**
   * 프로젝트의 WBS 할당을 초기화하고 관련 알림을 발송한다
   */
  async 프로젝트의_WBS_할당을_초기화한다(params: {
    projectId: string;
    periodId: string;
    resetBy: string;
  }): Promise<void> {
    this.logger.log('프로젝트 WBS 할당 초기화 비즈니스 로직 시작', {
      projectId: params.projectId,
      periodId: params.periodId,
    });

    // 1. 초기화 전 모든 할당 조회하여 영향받는 WBS 항목 ID 수집
    const allAssignments =
      await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
        { projectId: params.projectId, periodId: params.periodId },
        1,
        10000,
      );

    const affectedWbsItemIds = [
      ...new Set(allAssignments.assignments.map((a) => a.wbsItemId)),
    ];

    // 2. 프로젝트 WBS 할당 초기화 (컨텍스트 호출)
    await this.evaluationCriteriaManagementService.프로젝트의_WBS_할당을_초기화한다(
      params.projectId,
      params.periodId,
      params.resetBy,
    );

    // 3. 고아 평가기준 정리 (할당이 없는 WBS 항목의 평가기준 삭제)
    await Promise.all(
      affectedWbsItemIds.map(async (wbsItemId) => {
        const remainingAssignments =
          await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
            wbsItemId,
            params.periodId,
          );

        if (!remainingAssignments || remainingAssignments.length === 0) {
          this.logger.log('고아 평가기준 삭제', { wbsItemId });
          await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
            wbsItemId,
            params.resetBy,
          );
        }
      }),
    );

    // 4. 관련 직원들에게 알림 발송 (추후 구현)
    // TODO: 프로젝트 WBS 할당 초기화 알림 발송
    // const affectedEmployees = await this.getAffectedEmployeesByProject(
    //   params.projectId,
    //   params.periodId,
    // );
    // await Promise.all(
    //   affectedEmployees.map((employeeId) =>
    //     this.notificationService.send({
    //       type: 'PROJECT_WBS_ASSIGNMENTS_RESET',
    //       recipientId: employeeId,
    //       data: {
    //         projectId: params.projectId,
    //         periodId: params.periodId,
    //       },
    //     }),
    //   ),
    // );

    this.logger.log('프로젝트 WBS 할당 초기화 및 평가기준 정리 완료', {
      projectId: params.projectId,
      cleanedWbsItems: affectedWbsItemIds.length,
    });
  }

  /**
   * 직원의 WBS 할당을 초기화하고 관련 알림을 발송한다
   */
  async 직원의_WBS_할당을_초기화한다(params: {
    employeeId: string;
    periodId: string;
    resetBy: string;
  }): Promise<void> {
    this.logger.log('직원 WBS 할당 초기화 비즈니스 로직 시작', {
      employeeId: params.employeeId,
      periodId: params.periodId,
    });

    // 1. 초기화 전 모든 할당 조회하여 영향받는 WBS 항목 ID 수집
    const allAssignments =
      await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
        { employeeId: params.employeeId, periodId: params.periodId },
        1,
        10000,
      );

    const affectedWbsItemIds = [
      ...new Set(allAssignments.assignments.map((a) => a.wbsItemId)),
    ];

    // 2. 직원 WBS 할당 초기화 (컨텍스트 호출)
    await this.evaluationCriteriaManagementService.직원의_WBS_할당을_초기화한다(
      params.employeeId,
      params.periodId,
      params.resetBy,
    );

    // 3. 고아 평가기준 정리 (할당이 없는 WBS 항목의 평가기준 삭제)
    await Promise.all(
      affectedWbsItemIds.map(async (wbsItemId) => {
        const remainingAssignments =
          await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
            wbsItemId,
            params.periodId,
          );

        if (!remainingAssignments || remainingAssignments.length === 0) {
          this.logger.log('고아 평가기준 삭제', { wbsItemId });
          await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
            wbsItemId,
            params.resetBy,
          );
        }
      }),
    );

    // 4. 직원에게 알림 발송 (추후 구현)
    // TODO: 직원 WBS 할당 초기화 알림 발송
    // await this.notificationService.send({
    //   type: 'EMPLOYEE_WBS_ASSIGNMENTS_RESET',
    //   recipientId: params.employeeId,
    //   data: {
    //     periodId: params.periodId,
    //   },
    // });

    this.logger.log('직원 WBS 할당 초기화 및 평가기준 정리 완료', {
      employeeId: params.employeeId,
      cleanedWbsItems: affectedWbsItemIds.length,
    });
  }

  /**
   * WBS 할당 목록을 조회한다
   */
  async WBS_할당_목록을_조회한다(params: {
    periodId?: string;
    employeeId?: string;
    wbsItemId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<any> {
    this.logger.log('WBS 할당 목록 조회 비즈니스 로직', {
      periodId: params.periodId,
      employeeId: params.employeeId,
    });

    const filter = {
      periodId: params.periodId,
      employeeId: params.employeeId,
      wbsItemId: params.wbsItemId,
      projectId: params.projectId,
    };

    return await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
      filter,
      params.page,
      params.limit,
      params.orderBy,
      params.orderDirection,
    );
  }

  /**
   * WBS 할당 상세를 조회한다
   */
  async WBS_할당_상세를_조회한다(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
  ): Promise<any> {
    this.logger.log('WBS 할당 상세 조회 비즈니스 로직', {
      employeeId,
      wbsItemId,
      projectId,
      periodId,
    });

    return await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(
      employeeId,
      wbsItemId,
      projectId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 직원에게 할당된 WBS를 조회한다
   */
  async 특정_평가기간에_직원에게_할당된_WBS를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any[]> {
    this.logger.log('직원 WBS 할당 조회 비즈니스 로직', {
      employeeId,
      periodId,
    });

    return await this.evaluationCriteriaManagementService.특정_평가기간에_직원에게_할당된_WBS를_조회한다(
      employeeId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 프로젝트의 WBS 할당을 조회한다
   */
  async 특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<any[]> {
    this.logger.log('프로젝트 WBS 할당 조회 비즈니스 로직', {
      projectId,
      periodId,
    });

    return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
      projectId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 WBS 항목에 할당된 직원을 조회한다
   */
  async 특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
    wbsItemId: string,
    periodId: string,
  ): Promise<any[]> {
    this.logger.log('WBS 항목 할당 직원 조회 비즈니스 로직', {
      wbsItemId,
      periodId,
    });

    return await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
      wbsItemId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 프로젝트에서 할당되지 않은 WBS 항목 목록을 조회한다
   */
  async 특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
    projectId: string,
    periodId: string,
    employeeId?: string,
  ): Promise<WbsItemDto[]> {
    this.logger.log('할당되지 않은 WBS 항목 조회 비즈니스 로직', {
      projectId,
      periodId,
      employeeId,
    });

    return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
      projectId,
      periodId,
      employeeId,
    );
  }

  /**
   * 평가라인을 자동으로 구성한다
   * - 1차 평가자: 기존에 할당된 1차 평가자 (없으면 Employee.managerId)
   * - 2차 평가자: 프로젝트 PM (Project.managerId)
   */
  private async 평가라인을_자동으로_구성한다(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
    createdBy: string,
  ): Promise<void> {
    this.logger.log('평가라인 자동 구성 시작', {
      employeeId,
      wbsItemId,
      projectId,
    });

    // 1. 직원 정보 조회 (담당 평가자 확인)
    const employee = await this.employeeService.ID로_조회한다(employeeId);
    if (!employee) {
      this.logger.warn('직원을 찾을 수 없습니다', { employeeId });
      return;
    }

    console.log('🔍 직원 정보:', {
      id: employee.id,
      name: employee.name,
      managerId: employee.managerId,
      departmentId: employee.departmentId,
    });

    // 2. 프로젝트 정보 조회 (PM 확인)
    const project = await this.projectService.ID로_조회한다(projectId);
    if (!project) {
      this.logger.warn('프로젝트를 찾을 수 없습니다', { projectId });
      return;
    }

    console.log('🔍 프로젝트 정보:', {
      id: project.id,
      name: project.name,
      managerId: project.manager?.managerId,
      employeeId: project.manager?.employeeId,
    });

    // 3. 1차 평가자 구성 (기존 할당된 평가자 우선, 없으면 담당 평가자)
    const existingPrimaryEvaluator = await this.기존_1차_평가자를_조회한다(
      employeeId,
      periodId,
    );

    let primaryEvaluatorId = existingPrimaryEvaluator;
    if (!primaryEvaluatorId && employee.managerId) {
      primaryEvaluatorId = employee.managerId;
      this.logger.log('기존 1차 평가자가 없어 담당 평가자를 사용', {
        evaluatorId: employee.managerId,
      });
    } else if (existingPrimaryEvaluator) {
      this.logger.log('기존 1차 평가자를 사용', {
        evaluatorId: existingPrimaryEvaluator,
      });
    }

    if (primaryEvaluatorId) {
      await this.evaluationCriteriaManagementService.일차_평가자를_구성한다(
        employeeId,
        periodId,
        primaryEvaluatorId,
        createdBy,
      );
    } else {
      this.logger.warn('1차 평가자를 설정할 수 없습니다', {
        employeeId,
        hasExistingEvaluator: !!existingPrimaryEvaluator,
        hasManagerId: !!employee.managerId,
      });
    }

    // 4. 2차 평가자 구성 (프로젝트 PM) - Upsert 방식
    // 제약 조건 제거: PM이 있으면 항상 2차 평가자로 구성
    const projectManagerExternalId = project.managerId;
    const projectManagerEmployeeId = project.manager?.employeeId;

    // projectManagerEmployeeId가 있으면 사용, 없으면 externalId로 Employee 조회
    let evaluatorId: string | null = null;
    if (projectManagerEmployeeId) {
      evaluatorId = projectManagerEmployeeId;
    } else if (projectManagerExternalId) {
      // externalId로 Employee 조회하여 id 획득
      const managerEmployee = await this.employeeService.findByExternalId(
        projectManagerExternalId,
      );
      if (managerEmployee) {
        evaluatorId = managerEmployee.id;
        this.logger.log('프로젝트 PM externalId를 Employee id로 변환', {
          externalId: projectManagerExternalId,
          employeeId: managerEmployee.id,
        });
      } else {
        this.logger.warn('프로젝트 PM Employee를 찾을 수 없습니다', {
          externalId: projectManagerExternalId,
        });
      }
    }

    if (evaluatorId) {
      // PM이 관리자와 같은 경우 2차 평가자로 설정하지 않음
      // employee.managerId는 externalId이므로 비교 시 주의 필요
      const employeeManager = employee.managerId
        ? await this.employeeService.findByExternalId(employee.managerId)
        : null;
      const employeeManagerId = employeeManager?.id;

      if (!employeeManagerId || evaluatorId !== employeeManagerId) {
        this.logger.log('2차 평가자(프로젝트 PM) 구성', {
          evaluatorId,
          employeeId,
        });

        await this.evaluationCriteriaManagementService.이차_평가자를_구성한다(
          employeeId,
          wbsItemId,
          periodId,
          evaluatorId,
          createdBy,
        );
      } else {
        this.logger.log(
          '프로젝트 PM이 관리자와 동일하여 2차 평가자로 설정하지 않습니다',
          {
            projectId,
            evaluatorId,
          },
        );
      }
    } else {
      this.logger.warn(
        '프로젝트 PM(managerId)이 설정되지 않았거나 Employee를 찾을 수 없습니다',
        {
          projectId,
          managerId: projectManagerExternalId,
        },
      );
    }

    this.logger.log('평가라인 자동 구성 완료', {
      employeeId,
      wbsItemId,
      primaryEvaluator: employee.managerId,
      secondaryEvaluator:
        projectManagerEmployeeId &&
        projectManagerEmployeeId !== employee.managerId
          ? projectManagerEmployeeId
          : null,
    });
  }

  /**
   * 평가라인 매핑을 삭제한다
   * WBS 할당 취소 시 해당 WBS에 대한 평가라인 매핑(주로 2차 평가자)을 삭제
   */
  private async 평가라인_매핑을_삭제한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    deletedBy: string,
  ): Promise<void> {
    this.logger.log('평가라인 매핑 삭제 시작', {
      employeeId,
      wbsItemId,
      periodId,
    });

    // 해당 WBS에 대한 평가라인 매핑 조회
    const mappings = await this.evaluationLineMappingService.필터_조회한다({
      evaluationPeriodId: periodId,
      employeeId,
      wbsItemId,
    });

    // 매핑 삭제
    for (const mapping of mappings) {
      const mappingId = mapping.DTO로_변환한다().id;
      await this.evaluationLineMappingService.삭제한다(mappingId, deletedBy);
      this.logger.log('평가라인 매핑 삭제 완료', {
        mappingId,
        evaluatorId: mapping.DTO로_변환한다().evaluatorId,
      });
    }

    this.logger.log('평가라인 매핑 삭제 완료', {
      deletedCount: mappings.length,
    });
  }

  /**
   * 기존에 할당된 1차 평가자를 조회한다
   * 직원별 고정 담당자(wbsItemId가 null인 매핑)를 조회
   */
  private async 기존_1차_평가자를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<string | null> {
    // 1차 평가 라인 조회
    const evaluationLines = await this.evaluationLineService.필터_조회한다({
      evaluatorType: EvaluatorType.PRIMARY,
      orderFrom: 1,
      orderTo: 1,
    });

    if (evaluationLines.length === 0) {
      return null;
    }

    const primaryEvaluationLineId = evaluationLines[0].DTO로_변환한다().id;

    // 기존 매핑 조회 (직원별 고정 담당자) - evaluationPeriodId 포함
    const existingMappings =
      await this.evaluationLineMappingService.필터_조회한다({
        evaluationPeriodId: periodId,
        employeeId,
        evaluationLineId: primaryEvaluationLineId,
      });

    // wbsItemId가 null인 매핑만 필터링 (직원별 고정 담당자)
    const primaryMappings = existingMappings.filter(
      (mapping) => !mapping.wbsItemId,
    );

    if (primaryMappings.length > 0) {
      return primaryMappings[0].DTO로_변환한다().evaluatorId;
    }

    return null;
  }

  /**
   * WBS를 생성하고 직원에게 할당한다
   */
  async WBS를_생성하고_할당한다(params: {
    title: string;
    projectId: string;
    employeeId: string;
    periodId: string;
    createdBy: string;
  }): Promise<{
    wbsItem: WbsItemDto;
    assignment: any;
  }> {
    this.logger.log('WBS 생성 및 할당 비즈니스 로직 시작', {
      title: params.title,
      projectId: params.projectId,
      employeeId: params.employeeId,
    });

    // 1. WBS 항목 생성 (코드 자동 생성 포함)
    const wbsItem =
      await this.evaluationCriteriaManagementService.WBS_항목을_생성하고_코드를_자동_생성한다(
        {
          title: params.title,
          status: WbsItemStatus.PENDING,
          level: 1, // 최상위 항목
          assignedToId: params.employeeId,
          projectId: params.projectId,
          parentWbsId: undefined,
          startDate: undefined,
          endDate: undefined,
          progressPercentage: 0,
        },
        params.createdBy,
      );

    this.logger.log('WBS 항목 생성 완료', {
      wbsItemId: wbsItem.id,
      wbsCode: wbsItem.wbsCode,
    });

    // 2. WBS 할당 생성
    const assignment = await this.WBS를_할당한다({
      employeeId: params.employeeId,
      wbsItemId: wbsItem.id,
      projectId: params.projectId,
      periodId: params.periodId,
      assignedBy: params.createdBy,
    });

    this.logger.log('WBS 생성 및 할당 완료', {
      wbsItemId: wbsItem.id,
      assignmentId: assignment.id,
    });

    return {
      wbsItem,
      assignment,
    };
  }

  /**
   * WBS를 두 WBS 사이에 생성하고 직원에게 할당한다
   */
  async WBS를_사이에_생성하고_할당한다(params: {
    title: string;
    projectId: string;
    employeeId: string;
    periodId: string;
    previousWbsItemId?: string;
    nextWbsItemId?: string;
    createdBy: string;
  }): Promise<{
    wbsItem: WbsItemDto;
    assignment: any;
  }> {
    this.logger.log('WBS 사이에 생성 및 할당 비즈니스 로직 시작', {
      title: params.title,
      projectId: params.projectId,
      employeeId: params.employeeId,
      previousWbsItemId: params.previousWbsItemId,
      nextWbsItemId: params.nextWbsItemId,
    });

    // 1. WBS 항목 생성 (코드 자동 생성 포함)
    const wbsItem =
      await this.evaluationCriteriaManagementService.WBS_항목을_생성하고_코드를_자동_생성한다(
        {
          title: params.title,
          status: WbsItemStatus.PENDING,
          level: 1, // 최상위 항목
          assignedToId: params.employeeId,
          projectId: params.projectId,
          parentWbsId: undefined,
          startDate: undefined,
          endDate: undefined,
          progressPercentage: 0,
        },
        params.createdBy,
      );

    this.logger.log('WBS 항목 생성 완료', {
      wbsItemId: wbsItem.id,
      wbsCode: wbsItem.wbsCode,
    });

    // 2. 삽입 위치(targetIndex) 계산
    let targetIndex: number | undefined = undefined;
    
    if (params.previousWbsItemId || params.nextWbsItemId) {
      // 동일 직원-프로젝트-평가기간의 모든 WBS 할당 조회
      const allAssignments =
        await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
          {
            employeeId: params.employeeId,
            projectId: params.projectId,
            periodId: params.periodId,
          },
          1,
          1000,
          'displayOrder',
          'ASC',
        );

      // displayOrder와 assignedDate로 정렬하여 현재 순서 파악
      const sortedAssignments = allAssignments.assignments.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return (
          new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime()
        );
      });

      this.logger.log('기존 WBS 할당 목록 조회', {
        count: sortedAssignments.length,
        assignments: sortedAssignments.map((a) => ({
          wbsItemId: a.wbsItemId,
          displayOrder: a.displayOrder,
          assignedDate: a.assignedDate,
        })),
      });

      // 이전/다음 WBS의 인덱스 찾기
      if (params.previousWbsItemId && params.nextWbsItemId) {
        // 두 WBS 사이에 삽입
        const prevIndex = sortedAssignments.findIndex(
          (a) => a.wbsItemId === params.previousWbsItemId,
        );
        const nextIdx = sortedAssignments.findIndex(
          (a) => a.wbsItemId === params.nextWbsItemId,
        );

        if (prevIndex !== -1 && nextIdx !== -1) {
          // previousWbs 다음 위치에 삽입
          targetIndex = prevIndex + 1;
        } else {
          // 둘 다 찾지 못한 경우 마지막에 추가
          targetIndex = sortedAssignments.length;
        }
      } else if (params.previousWbsItemId) {
        // previousWbs 다음에 추가
        const prevIndex = sortedAssignments.findIndex(
          (a) => a.wbsItemId === params.previousWbsItemId,
        );
        if (prevIndex !== -1) {
          targetIndex = prevIndex + 1;
        } else {
          targetIndex = sortedAssignments.length;
        }
      } else if (params.nextWbsItemId) {
        // nextWbs 이전에 추가
        const nextIdx = sortedAssignments.findIndex(
          (a) => a.wbsItemId === params.nextWbsItemId,
        );
        if (nextIdx !== -1) {
          targetIndex = nextIdx;
        } else {
          targetIndex = 0;
        }
      }

      this.logger.log('삽입 위치 계산', { targetIndex });
    }

    // 3. WBS 할당 생성 (임시 displayOrder로 생성 - 재정렬에서 올바른 값으로 설정됨)
    const data: CreateEvaluationWbsAssignmentData = {
      employeeId: params.employeeId,
      wbsItemId: wbsItem.id,
      projectId: params.projectId,
      periodId: params.periodId,
      assignedBy: params.createdBy,
      displayOrder: 999999, // 임시 값, 재정렬에서 올바른 값으로 설정됨
    };

    const assignment =
      await this.evaluationCriteriaManagementService.WBS를_할당한다(
        data,
        params.createdBy,
      );

    // 4. WBS 평가기준 자동 생성 (없는 경우)
    const existingCriteria =
      await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(
        wbsItem.id,
      );

    if (!existingCriteria || existingCriteria.length === 0) {
      this.logger.log('WBS 평가기준이 없어 빈 기준을 생성합니다', {
        wbsItemId: wbsItem.id,
      });

      await this.evaluationCriteriaManagementService.WBS_평가기준을_생성한다(
        {
          wbsItemId: wbsItem.id,
          criteria: '', // 빈 평가기준으로 생성
          importance: 5, // 기본 중요도
        },
        params.createdBy,
      );
    }

    // 5. 평가라인 자동 구성
    await this.평가라인을_자동으로_구성한다(
      params.employeeId,
      wbsItem.id,
      params.projectId,
      params.periodId,
      params.createdBy,
    );

    // 6. WBS별 평가라인 구성 (동료평가를 위한 평가라인)
    this.logger.log('WBS별 평가라인 구성 시작', {
      employeeId: params.employeeId,
      wbsItemId: wbsItem.id,
      periodId: params.periodId,
    });

    const wbsEvaluationLineResult =
      await this.evaluationCriteriaManagementService.직원_WBS별_평가라인을_구성한다(
        params.employeeId,
        wbsItem.id,
        params.periodId,
        params.createdBy,
      );

    this.logger.log('WBS별 평가라인 구성 완료', {
      createdLines: wbsEvaluationLineResult.createdLines,
      createdMappings: wbsEvaluationLineResult.createdMappings,
    });

    // 7. 활동 내역 기록
    try {
      await this.activityLogContextService.활동내역을_기록한다({
        periodId: params.periodId,
        employeeId: params.employeeId,
        activityType: 'wbs_assignment',
        activityAction: 'created',
        activityTitle: 'WBS 사이에 생성 및 할당',
        relatedEntityType: 'wbs_assignment',
        relatedEntityId: assignment.id,
        performedBy: params.createdBy,
        activityMetadata: {
          wbsItemId: wbsItem.id,
          projectId: params.projectId,
          previousWbsItemId: params.previousWbsItemId,
          nextWbsItemId: params.nextWbsItemId,
          displayOrder: assignment.displayOrder,
        },
      });
    } catch (error) {
      // 활동 내역 기록 실패 시에도 WBS 할당은 정상 처리
      this.logger.warn('WBS 사이에 생성 활동 내역 기록 실패', {
        assignmentId: assignment.id,
        error: error.message,
      });
    }

    // 8. 전체 WBS 할당 재정렬 (displayOrder 정규화)
    // 새로 생성한 WBS의 ID와 targetIndex를 전달하여 올바른 위치에 삽입
    await this.전체_WBS_할당_순서를_재정렬한다(
      params.employeeId,
      params.projectId,
      params.periodId,
      params.createdBy,
      wbsItem.id, // 새로 생성한 WBS ID
      targetIndex, // 삽입 위치 인덱스
    );

    this.logger.log('WBS 사이에 생성, 할당, 평가기준 생성, 평가라인 구성 완료', {
      wbsItemId: wbsItem.id,
      assignmentId: assignment.id,
      displayOrder: assignment.displayOrder,
    });

    return {
      wbsItem,
      assignment,
    };
  }

  /**
   * 전체 WBS 할당 순서를 재정렬한다
   * displayOrder를 0, 1, 2, 3, ... 순서로 정규화
   * 
   * @param employeeId 직원 ID
   * @param projectId 프로젝트 ID
   * @param periodId 평가기간 ID
   * @param updatedBy 업데이트 실행자 ID
   * @param newWbsItemId 새로 추가된 WBS 항목 ID (선택적)
   * @param targetIndex 새 WBS를 삽입할 인덱스 (newWbsItemId가 있을 때 필수)
   */
  private async 전체_WBS_할당_순서를_재정렬한다(
    employeeId: string,
    projectId: string,
    periodId: string,
    updatedBy: string,
    newWbsItemId?: string,
    targetIndex?: number,
  ): Promise<void> {
    this.logger.log('WBS 할당 순서 재정렬 시작', {
      employeeId,
      projectId,
      periodId,
      newWbsItemId,
      targetIndex,
    });

    // 1. 전체 할당 조회
    const allAssignments =
      await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
        {
          employeeId,
          projectId,
          periodId,
        },
        1,
        1000,
        'displayOrder',
        'ASC',
      );

    // 2. 새로 추가된 WBS를 제외하고 정렬
    let existingAssignments = allAssignments.assignments;
    let newAssignment: WbsAssignmentListItem | undefined = undefined;

    if (newWbsItemId) {
      newAssignment = existingAssignments.find(
        (a) => a.wbsItemId === newWbsItemId,
      );
      existingAssignments = existingAssignments.filter(
        (a) => a.wbsItemId !== newWbsItemId,
      );
    }

    // 기존 할당들을 displayOrder와 assignedDate로 정렬
    const sortedExistingAssignments = existingAssignments.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return (
        new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime()
      );
    });

    // 3. 새 WBS를 targetIndex 위치에 삽입
    let finalSortedAssignments = [...sortedExistingAssignments];
    if (newAssignment && targetIndex !== undefined) {
      finalSortedAssignments.splice(targetIndex, 0, newAssignment);
      this.logger.log('새 WBS 삽입', {
        newWbsItemId,
        targetIndex,
        wbsItemId: newAssignment.wbsItemId,
      });
    }

    this.logger.log('정렬된 WBS 할당 목록', {
      count: finalSortedAssignments.length,
      assignments: finalSortedAssignments.map((a, index) => ({
        index,
        wbsItemId: a.wbsItemId,
        currentDisplayOrder: a.displayOrder,
        willBeDisplayOrder: index,
      })),
    });

    // 4. displayOrder를 0부터 순차적으로 재설정 (Repository 직접 사용)
    const updatePromises: Promise<UpdateResult>[] = [];
    for (let i = 0; i < finalSortedAssignments.length; i++) {
      const assignment = finalSortedAssignments[i];
      if (assignment.displayOrder !== i) {
        this.logger.log('displayOrder 업데이트 예정', {
          assignmentId: assignment.id,
          wbsItemId: assignment.wbsItemId,
          oldOrder: assignment.displayOrder,
          newOrder: i,
        });

        // Repository를 직접 사용하여 displayOrder와 updatedAt, updatedBy 업데이트
        const updatePromise = this.wbsAssignmentRepository.update(
          { id: assignment.id },
          {
            displayOrder: i,
            updatedAt: new Date(),
            updatedBy: updatedBy,
          },
        );

        updatePromises.push(updatePromise);
      }
    }

    // 모든 업데이트 완료 대기
    await Promise.all(updatePromises);

    this.logger.log('WBS 할당 순서 재정렬 완료', {
      count: finalSortedAssignments.length,
      updatedCount: updatePromises.length,
    });
  }

  /**
   * WBS 항목 이름을 수정한다
   */
  async WBS_항목_이름을_수정한다(params: {
    wbsItemId: string;
    title: string;
    updatedBy: string;
  }): Promise<WbsItemDto> {
    this.logger.log('WBS 항목 이름 수정 시작', {
      wbsItemId: params.wbsItemId,
      title: params.title,
    });

    const updatedWbsItem =
      await this.evaluationCriteriaManagementService.WBS_항목을_수정한다(
        params.wbsItemId,
        { title: params.title },
        params.updatedBy,
      );

    this.logger.log('WBS 항목 이름 수정 완료', {
      wbsItemId: params.wbsItemId,
      newTitle: params.title,
    });

    return updatedWbsItem;
  }
}
