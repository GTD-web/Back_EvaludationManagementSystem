import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';
import { RecipientType } from '@domain/sub/evaluation-revision-request';
import { GetEmployeeSelfEvaluationsQuery } from '@context/performance-evaluation-context/handlers/self-evaluation/queries/get-employee-self-evaluations.handler';
import { SecondaryEvaluationStepApproval } from '@/domain/sub/secondary-evaluation-step-approval';
import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import { DownwardEvaluationBusinessService } from '@business/downward-evaluation/downward-evaluation-business.service';

/**
 * 단계 승인 비즈니스 서비스
 *
 * 단계 승인 처리 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 단계 승인 상태 변경
 * - 승인 시 제출 상태 자동 변경
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class StepApprovalBusinessService {
  private readonly logger = new Logger(StepApprovalBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly stepApprovalContextService: StepApprovalContextService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly revisionRequestContextService: RevisionRequestContextService,
    private readonly employeeSyncService: EmployeeSyncService,
    @Inject(forwardRef(() => WbsSelfEvaluationBusinessService))
    private readonly wbsSelfEvaluationBusinessService: WbsSelfEvaluationBusinessService,
    @Inject(forwardRef(() => DownwardEvaluationBusinessService))
    private readonly downwardEvaluationBusinessService: DownwardEvaluationBusinessService,
  ) {}

  /**
   * 자기평가 승인 시 제출 상태 변경
   * 자기평가 단계에서 승인(APPROVED) 처리 시 제출 상태를 자동으로 변경합니다.
   * submittedToEvaluator와 submittedToManager 모두 true로 설정합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param approvedBy 승인자 ID
   */
  async 자기평가_승인_시_제출상태_변경(
    evaluationPeriodId: string,
    employeeId: string,
    approvedBy: string,
  ): Promise<void> {
    this.logger.log(
      `자기평가 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    try {
      // 승인 시 submittedToEvaluator와 submittedToManager를 모두 true로 설정
      await this.performanceEvaluationService.직원의_전체_자기평가를_승인시_제출한다(
        employeeId,
        evaluationPeriodId,
        approvedBy,
      );

      this.logger.log(
        `자기평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 이미 제출된 상태일 수 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `자기평가 승인 시 제출 상태 변경 실패 (이미 제출되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
    }

    // 2. 해당 평가기간에 발생한 자기평가에 대한 재작성 요청 자동 완료 처리
    // 재작성 요청이 없거나 완료 처리에 실패해도 승인은 정상적으로 진행되어야 함
    try {
      // 피평가자에게 요청된 재작성 요청 완료 처리
      await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'self',
        employeeId,
        RecipientType.EVALUATEE,
        '자기평가 승인으로 인한 재작성 완료 처리',
      );

      this.logger.log(
        `자기평가 승인 시 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 재작성 요청 완료 처리 실패 시에도 자기평가 승인은 정상 처리되어야 함
      // 재작성 요청이 없거나 이미 완료된 경우도 정상적인 상황일 수 있음
      this.logger.warn(
        '자기평가 승인 시 재작성 요청 완료 처리 실패 (승인은 계속 진행)',
        {
          employeeId,
          evaluationPeriodId,
          error: error.message,
          errorStack: error.stack,
        },
      );
      // 예외를 다시 throw하지 않음 - 승인은 정상적으로 진행되어야 함
    }
  }

  /**
   * 1차 하향평가 승인 시 제출 상태 변경
   * 1차 하향평가 단계에서 승인(APPROVED) 처리 시 제출 상태를 자동으로 변경합니다.
   * 해당 평가의 isCompleted를 true로 설정합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param approvedBy 승인자 ID
   */
  async 일차_하향평가_승인_시_제출상태_변경(
    evaluationPeriodId: string,
    employeeId: string,
    approvedBy: string,
  ): Promise<void> {
    this.logger.log(
      `1차 하향평가 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    // 1차 평가자 조회
    const primaryEvaluatorId =
      await this.stepApprovalContextService.일차평가자를_조회한다(
        evaluationPeriodId,
        employeeId,
      );

    if (!primaryEvaluatorId) {
      this.logger.warn(
        `1차 평가자를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
      return;
    }

    // 해당 피평가자의 모든 1차 하향평가를 강제 제출 처리
    // 승인 시에는 필수 항목 검증을 건너뛰고 모든 평가를 제출합니다.
    const result =
      await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        approvedBy,
        true, // forceSubmit: true - 승인 시 강제 제출
      );

    // 하향평가가 없는 경우는 정상적인 상황일 수 있음 (아직 하향평가가 생성되지 않았을 수 있음)
    if (result.submittedCount === 0 && result.skippedCount === 0) {
      this.logger.debug(
        `1차 하향평가가 없어 제출 상태 변경을 건너뜀 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`,
      );
      return;
    }

    // 2. 해당 평가기간에 발생한 1차 하향평가에 대한 재작성 요청 자동 완료 처리
    try {
      await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'primary',
        primaryEvaluatorId,
        RecipientType.PRIMARY_EVALUATOR,
        '1차 하향평가 승인으로 인한 재작성 완료 처리',
      );

      this.logger.log(
        `1차 하향평가 승인 시 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`,
      );
    } catch (error) {
      // 재작성 요청 완료 처리 실패 시에도 하향평가 제출은 정상 처리
      this.logger.warn('1차 하향평가 승인 시 재작성 요청 완료 처리 실패', {
        evaluatorId: primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        error: error.message,
      });
    }

    this.logger.log(
      `1차 하향평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}, 제출: ${result.submittedCount}, 건너뜀: ${result.skippedCount}`,
    );
  }

  /**
   * 2차 하향평가 승인 시 제출 상태 변경
   * 2차 하향평가 단계에서 승인(APPROVED) 처리 시 제출 상태를 자동으로 변경합니다.
   * 해당 평가의 isCompleted를 true로 설정합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param evaluatorId 평가자 ID
   * @param approvedBy 승인자 ID
   */
  async 이차_하향평가_승인_시_제출상태_변경(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    approvedBy: string,
  ): Promise<void> {
    this.logger.log(
      `2차 하향평가 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
    );

    // 해당 평가자의 모든 2차 하향평가를 강제 제출 처리
    // 승인 시에는 필수 항목 검증을 건너뛰고 모든 평가를 제출합니다.
    const result =
      await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        approvedBy,
        true, // forceSubmit: true - 승인 시 강제 제출
      );

    // 하향평가가 없는 경우는 정상적인 상황일 수 있음 (아직 하향평가가 생성되지 않았을 수 있음)
    if (result.submittedCount === 0 && result.skippedCount === 0) {
      this.logger.debug(
        `2차 하향평가가 없어 제출 상태 변경을 건너뜀 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
      );
      return;
    }

    // 2. 해당 평가기간에 발생한 2차 하향평가에 대한 재작성 요청 자동 완료 처리
    try {
      await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'secondary',
        evaluatorId,
        RecipientType.SECONDARY_EVALUATOR,
        '2차 하향평가 승인으로 인한 재작성 완료 처리',
      );

      this.logger.log(
        `2차 하향평가 승인 시 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
      );
    } catch (error) {
      // 재작성 요청 완료 처리 실패 시에도 하향평가 제출은 정상 처리
      this.logger.warn('2차 하향평가 승인 시 재작성 요청 완료 처리 실패', {
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        error: error.message,
      });
    }

    this.logger.log(
      `2차 하향평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}, 제출: ${result.submittedCount}, 건너뜀: ${result.skippedCount}`,
    );
  }

  /**
   * 평가기준 설정 재작성 요청 생성 및 제출 상태 초기화
   * 평가기준 설정 단계에서 재작성 요청(REVISION_REQUESTED) 생성 시 제출 상태를 초기화합니다.
   * 평가기준 설정 단계에서는 평가기준만 재작성 요청을 보냅니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param revisionComment 재작성 요청 코멘트
   * @param updatedBy 처리자 ID
   */
  async 평가기준설정_재작성요청_생성_및_제출상태_초기화(
    evaluationPeriodId: string,
    employeeId: string,
    revisionComment: string,
    updatedBy: string,
  ): Promise<void> {
    this.logger.log(
      `평가기준 설정 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    // 1. 평가기준 제출 상태 초기화
    try {
      await this.evaluationCriteriaManagementService.평가기준_제출을_초기화한다(
        evaluationPeriodId,
        employeeId,
        updatedBy,
      );

      this.logger.log(
        `평가기준 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 이미 초기화된 상태일 수 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `평가기준 제출 상태 초기화 실패 (이미 초기화되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
    }

    // 2. 단계 승인 상태를 재작성 요청으로 변경
    // stepApprovalContextService에서 재작성 요청 생성까지 처리됨
    await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      status: 'revision_requested' as StepApprovalStatus,
      revisionComment,
      updatedBy,
    });

    // 3. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId,
          employeeId,
          step: 'criteria',
          status: 'revision_requested' as StepApprovalStatus,
          revisionComment,
          updatedBy,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }

    this.logger.log(
      `평가기준 설정 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );
  }

  /**
   * 평가기준 설정 승인 시 제출 상태 변경
   * 평가기준 설정 단계에서 승인(APPROVED) 처리 시 제출 상태를 자동으로 변경합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param approvedBy 승인자 ID
   */
  async 평가기준설정_승인_시_제출상태_변경(
    evaluationPeriodId: string,
    employeeId: string,
    approvedBy: string,
  ): Promise<void> {
    this.logger.log(
      `평가기준 설정 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    try {
      await this.evaluationCriteriaManagementService.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        approvedBy,
      );

      this.logger.log(
        `평가기준 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 이미 제출된 상태일 수 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `평가기준 제출 상태 변경 실패 (이미 제출되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
    }

    // 2. 해당 평가기간에 발생한 평가기준 설정에 대한 재작성 요청 자동 완료 처리
    try {
      // 피평가자에게 요청된 재작성 요청 완료 처리
      await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
        evaluationPeriodId,
        employeeId,
        'criteria',
        employeeId,
        RecipientType.EVALUATEE,
        '평가기준 설정 승인으로 인한 재작성 완료 처리',
      );

      this.logger.log(
        `평가기준 설정 승인 시 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 재작성 요청 완료 처리 실패 시에도 평가기준 제출은 정상 처리
      this.logger.warn('평가기준 설정 승인 시 재작성 요청 완료 처리 실패', {
        employeeId,
        evaluationPeriodId,
        error: error.message,
      });
    }

    this.logger.log(
      `평가기준 설정 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );
  }

  /**
   * 평가기준 설정 단계 승인 상태를 변경한다 (활동 내역 기록 포함)
   */
  async 평가기준설정_확인상태를_변경한다(params: {
    evaluationPeriodId: string;
    employeeId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
  }): Promise<void> {
    // 1. 단계 승인 상태 변경
    await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다({
      evaluationPeriodId: params.evaluationPeriodId,
      employeeId: params.employeeId,
      status: params.status,
      revisionComment: params.revisionComment,
      updatedBy: params.updatedBy,
    });

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId: params.evaluationPeriodId,
          employeeId: params.employeeId,
          step: 'criteria',
          status: params.status,
          revisionComment: params.revisionComment,
          updatedBy: params.updatedBy,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }
  }

  /**
   * 자기평가 단계 승인 상태를 변경한다 (활동 내역 기록 포함)
   */
  async 자기평가_확인상태를_변경한다(params: {
    evaluationPeriodId: string;
    employeeId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
  }): Promise<void> {
    // 1. 단계 승인 상태 변경
    await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
      evaluationPeriodId: params.evaluationPeriodId,
      employeeId: params.employeeId,
      status: params.status,
      revisionComment: params.revisionComment,
      updatedBy: params.updatedBy,
    });

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId: params.evaluationPeriodId,
          employeeId: params.employeeId,
          step: 'self',
          status: params.status,
          revisionComment: params.revisionComment,
          updatedBy: params.updatedBy,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }
  }

  /**
   * 1차 하향평가 단계 승인 상태를 변경한다 (활동 내역 기록 포함)
   */
  async 일차하향평가_확인상태를_변경한다(params: {
    evaluationPeriodId: string;
    employeeId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
  }): Promise<void> {
    this.logger.log(
      `1차 하향평가 단계 승인 상태를 변경한다 - 직원: ${params.employeeId}, 평가기간: ${params.evaluationPeriodId}, 상태: ${params.status}`,
    );

    // 1. 단계 승인 상태 변경
    await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다({
      evaluationPeriodId: params.evaluationPeriodId,
      employeeId: params.employeeId,
      status: params.status,
      revisionComment: params.revisionComment,
      updatedBy: params.updatedBy,
    });

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId: params.evaluationPeriodId,
          employeeId: params.employeeId,
          step: 'primary',
          status: params.status,
          revisionComment: params.revisionComment,
          updatedBy: params.updatedBy,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }
  }

  /**
   * 2차 하향평가 단계 승인 상태를 변경한다 (활동 내역 기록 포함)
   */
  async 이차하향평가_확인상태를_변경한다(params: {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
  }): Promise<SecondaryEvaluationStepApproval> {
    // 1. 단계 승인 상태 변경
    const approval =
      await this.stepApprovalContextService.이차하향평가_확인상태를_변경한다({
        evaluationPeriodId: params.evaluationPeriodId,
        employeeId: params.employeeId,
        evaluatorId: params.evaluatorId,
        status: params.status,
        revisionComment: params.revisionComment,
        updatedBy: params.updatedBy,
      });

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId: params.evaluationPeriodId,
          employeeId: params.employeeId,
          step: 'secondary',
          status: params.status,
          revisionComment: params.revisionComment,
          updatedBy: params.updatedBy,
          evaluatorId: params.evaluatorId,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }

    return approval;
  }

  /**
   * 자기평가 승인 시 하위 평가들도 함께 승인한다
   * 1차 하향평가, 2차 하향평가를 자동으로 승인 처리합니다.
   */
  async 자기평가_승인_시_하위평가들을_승인한다(
    evaluationPeriodId: string,
    employeeId: string,
    updatedBy: string,
  ): Promise<void> {
    this.logger.log(
      `자기평가 승인 시 하위 평가 자동 승인 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    try {
      // 1. 1차 하향평가 승인
      await this.일차하향평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        status: 'approved' as StepApprovalStatus,
        updatedBy,
      });

      // 1차 하향평가 제출 상태 변경
      await this.일차_하향평가_승인_시_제출상태_변경(
        evaluationPeriodId,
        employeeId,
        updatedBy,
      );

      this.logger.log(
        `1차 하향평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );

      // 2. 2차 하향평가 승인 (모든 2차 평가자에 대해)
      const secondaryEvaluators =
        await this.stepApprovalContextService.이차평가자들을_조회한다(
          evaluationPeriodId,
          employeeId,
        );

      for (const evaluatorId of secondaryEvaluators) {
        try {
          await this.이차하향평가_확인상태를_변경한다({
            evaluationPeriodId,
            employeeId,
            evaluatorId,
            status: 'approved' as StepApprovalStatus,
            updatedBy,
          });

          // 2차 하향평가 제출 상태 변경
          await this.이차_하향평가_승인_시_제출상태_변경(
            evaluationPeriodId,
            employeeId,
            evaluatorId,
            updatedBy,
          );

          this.logger.log(
            `2차 하향평가 자동 승인 완료 - 직원: ${employeeId}, 평가자: ${evaluatorId}, 평가기간: ${evaluationPeriodId}`,
          );
        } catch (error) {
          // 개별 2차 평가자 승인 실패 시에도 다른 평가자는 계속 처리
          this.logger.warn(
            `2차 하향평가 자동 승인 실패 - 직원: ${employeeId}, 평가자: ${evaluatorId}`,
            error,
          );
        }
      }

      this.logger.log(
        `자기평가 승인 시 하위 평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      this.logger.error(
        `자기평가 승인 시 하위 평가 자동 승인 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 1차 하향평가 승인 시 하위 평가들도 함께 승인한다
   * 2차 하향평가를 자동으로 승인 처리합니다.
   */
  async 일차하향평가_승인_시_하위평가들을_승인한다(
    evaluationPeriodId: string,
    employeeId: string,
    updatedBy: string,
  ): Promise<void> {
    this.logger.log(
      `1차 하향평가 승인 시 하위 평가 자동 승인 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    try {
      // 2차 하향평가 승인 (모든 2차 평가자에 대해)
      const secondaryEvaluators =
        await this.stepApprovalContextService.이차평가자들을_조회한다(
          evaluationPeriodId,
          employeeId,
        );

      for (const evaluatorId of secondaryEvaluators) {
        try {
          await this.이차하향평가_확인상태를_변경한다({
            evaluationPeriodId,
            employeeId,
            evaluatorId,
            status: 'approved' as StepApprovalStatus,
            updatedBy,
          });

          // 2차 하향평가 제출 상태 변경
          await this.이차_하향평가_승인_시_제출상태_변경(
            evaluationPeriodId,
            employeeId,
            evaluatorId,
            updatedBy,
          );

          this.logger.log(
            `2차 하향평가 자동 승인 완료 - 직원: ${employeeId}, 평가자: ${evaluatorId}, 평가기간: ${evaluationPeriodId}`,
          );
        } catch (error) {
          // 개별 2차 평가자 승인 실패 시에도 다른 평가자는 계속 처리
          this.logger.warn(
            `2차 하향평가 자동 승인 실패 - 직원: ${employeeId}, 평가자: ${evaluatorId}`,
            error,
          );
        }
      }

      this.logger.log(
        `1차 하향평가 승인 시 하위 평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      this.logger.error(
        `1차 하향평가 승인 시 하위 평가 자동 승인 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 1차 하향평가 승인 시 상위 평가를 함께 승인한다
   * 자기평가를 자동으로 승인 처리합니다.
   * 자기평가가 없는 경우 자동으로 생성합니다.
   */
  async 일차하향평가_승인_시_상위평가를_승인한다(
    evaluationPeriodId: string,
    employeeId: string,
    updatedBy: string,
  ): Promise<void> {
    this.logger.log(
      `1차 하향평가 승인 시 상위 평가 자동 승인 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    try {
      // 1. 승인자 이름 조회
      const approver =
        await this.employeeSyncService.getEmployeeById(updatedBy);
      const approverName = approver?.name || '관리자';

      // 2. 할당된 WBS 목록 조회
      const wbsAssignments =
        await this.evaluationCriteriaManagementService.특정_평가기간에_직원에게_할당된_WBS를_조회한다(
          employeeId,
          evaluationPeriodId,
        );

      // 3. 기존 자기평가 목록 조회
      const existingSelfEvaluationsQuery = new GetEmployeeSelfEvaluationsQuery(
        employeeId,
        evaluationPeriodId,
        undefined, // projectId
        1, // page
        1000, // limit (충분히 큰 값)
      );
      const existingSelfEvaluationsResult =
        await this.performanceEvaluationService.직원의_자기평가_목록을_조회한다(
          existingSelfEvaluationsQuery,
        );
      const existingWbsItemIds = new Set(
        existingSelfEvaluationsResult.evaluations.map((e) => e.wbsItemId),
      );

      // 4. 각 WBS에 대해 자기평가가 없으면 생성
      for (const assignment of wbsAssignments) {
        if (!existingWbsItemIds.has(assignment.wbsItemId)) {
          // 자기평가 생성 (승인 메시지 포함)
          const approvalMessage = `${approverName}님에 따라 자기평가가 승인 처리되었습니다.`;
          await this.performanceEvaluationService.WBS자기평가를_생성한다(
            evaluationPeriodId,
            employeeId,
            assignment.wbsItemId,
            approvalMessage, // selfEvaluationContent
            0, // selfEvaluationScore (기본값)
            undefined, // performanceResult
            updatedBy, // createdBy
          );

          this.logger.log(
            `자기평가 자동 생성 완료 - 직원: ${employeeId}, WBS: ${assignment.wbsItemId}, 평가기간: ${evaluationPeriodId}`,
          );
        }
      }

      // 5. 자기평가 승인
      await this.자기평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        status: 'approved' as StepApprovalStatus,
        updatedBy,
      });

      // 6. 자기평가 제출 상태 변경
      await this.자기평가_승인_시_제출상태_변경(
        evaluationPeriodId,
        employeeId,
        updatedBy,
      );

      this.logger.log(
        `자기평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      this.logger.error(
        `1차 하향평가 승인 시 상위 평가 자동 승인 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 2차 하향평가 승인 시 상위 평가들을 함께 승인한다
   * 1차 하향평가와 자기평가를 자동으로 승인 처리합니다.
   */
  async 이차하향평가_승인_시_상위평가들을_승인한다(
    evaluationPeriodId: string,
    employeeId: string,
    updatedBy: string,
  ): Promise<void> {
    this.logger.log(
      `2차 하향평가 승인 시 상위 평가 자동 승인 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    try {
      // 1. 1차 하향평가 승인
      await this.일차하향평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        status: 'approved' as StepApprovalStatus,
        updatedBy,
      });

      // 1차 하향평가 제출 상태 변경
      await this.일차_하향평가_승인_시_제출상태_변경(
        evaluationPeriodId,
        employeeId,
        updatedBy,
      );

      this.logger.log(
        `1차 하향평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );

      // 2. 자기평가 승인
      await this.자기평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        status: 'approved' as StepApprovalStatus,
        updatedBy,
      });

      // 자기평가 제출 상태 변경
      await this.자기평가_승인_시_제출상태_변경(
        evaluationPeriodId,
        employeeId,
        updatedBy,
      );

      this.logger.log(
        `자기평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );

      this.logger.log(
        `2차 하향평가 승인 시 상위 평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      this.logger.error(
        `2차 하향평가 승인 시 상위 평가 자동 승인 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
      throw error;
    }
  }
}
