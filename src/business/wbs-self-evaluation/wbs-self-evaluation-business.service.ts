import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import type {
  SubmitAllWbsSelfEvaluationsResponse,
  SubmitAllWbsSelfEvaluationsToEvaluatorResponse,
  ResetAllWbsSelfEvaluationsToEvaluatorResponse,
} from '@context/performance-evaluation-context/handlers/self-evaluation';
import { RecipientType } from '@domain/sub/evaluation-revision-request';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';

/**
 * WBS 자기평가 비즈니스 서비스
 *
 * WBS 자기평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 재작성 요청 자동 완료 처리
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class WbsSelfEvaluationBusinessService {
  private readonly logger = new Logger(WbsSelfEvaluationBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly revisionRequestContextService: RevisionRequestContextService,
    private readonly stepApprovalContextService: StepApprovalContextService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
  ) {}

  /**
   * 직원의 전체 WBS 자기평가를 제출하고 재작성 요청을 자동 완료 처리한다 (1차 평가자 → 관리자)
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 관리자에게 제출하고,
   * 해당 평가기간에 발생한 자기평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   */
  async 직원의_전체_WBS자기평가를_제출하고_재작성요청을_완료한다(
    employeeId: string,
    periodId: string,
    submittedBy: string,
  ): Promise<SubmitAllWbsSelfEvaluationsResponse> {
    this.logger.log(
      `직원의 전체 WBS 자기평가 제출 및 재작성 요청 완료 처리 시작 - 직원: ${employeeId}, 평가기간: ${periodId}`,
    );

    // 1. 자기평가 제출
    const result =
      await this.performanceEvaluationService.직원의_전체_WBS자기평가를_제출한다(
        employeeId,
        periodId,
        submittedBy,
      );

    // 2. 해당 평가기간에 발생한 자기평가에 대한 재작성 요청 자동 완료 처리
    // 피평가자에게 요청된 재작성 요청 완료 처리
    // (criteria, self 단계의 경우 자동으로 1차평가자도 함께 완료 처리됨)
    await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
      periodId,
      employeeId,
      'self',
      employeeId,
      RecipientType.EVALUATEE,
      '자기평가 제출로 인한 재작성 완료 처리',
    );

    // 3. 활동 내역 기록
    try {
      await this.activityLogContextService.활동내역을_기록한다({
        periodId,
        employeeId,
        activityType: 'wbs_self_evaluation',
        activityAction: 'submitted',
        activityTitle: 'WBS 자기평가 제출',
        relatedEntityType: 'wbs_self_evaluation',
        performedBy: submittedBy,
      });
    } catch (error) {
      // 활동 내역 기록 실패 시에도 평가 제출은 정상 처리
      this.logger.warn('활동 내역 기록 실패', {
        employeeId,
        periodId,
        error: error.message,
      });
    }

    this.logger.log(
      `직원의 전체 WBS 자기평가 제출 및 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${periodId}`,
    );

    return result;
  }

  /**
   * 자기평가 재작성 요청 생성 및 제출 상태 초기화
   * 자기평가 단계에서 재작성 요청이 생성될 때, 해당 평가기간의 자기평가 제출 상태를 초기화합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param revisionComment 재작성 요청 코멘트
   * @param requestedBy 요청자 ID
   */
  async 자기평가_재작성요청_생성_및_제출상태_초기화(
    evaluationPeriodId: string,
    employeeId: string,
    revisionComment: string,
    requestedBy: string,
  ): Promise<void> {
    this.logger.log(
      `자기평가 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    // 1. 해당 평가기간의 자기평가 제출 상태 초기화 (submittedToManager, submittedToManagerAt)
    await this.performanceEvaluationService.직원의_전체_WBS자기평가를_초기화한다(
      employeeId,
      evaluationPeriodId,
      requestedBy,
    );

    // 2. 재작성 요청 생성
    await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      status: StepApprovalStatus.REVISION_REQUESTED,
      revisionComment,
      updatedBy: requestedBy,
    });

    // 3. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId,
          employeeId,
          step: 'self',
          status: 'revision_requested' as StepApprovalStatus,
          revisionComment,
          updatedBy: requestedBy,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }

    this.logger.log(
      `자기평가 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );
  }

  /**
   * 직원의 전체 WBS 자기평가를 1차 평가자에게 제출한다 (피평가자 → 1차 평가자)
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 1차 평가자에게 제출합니다.
   */
  async 직원의_전체_자기평가를_1차평가자에게_제출한다(
    employeeId: string,
    periodId: string,
    submittedBy: string,
  ): Promise<SubmitAllWbsSelfEvaluationsToEvaluatorResponse> {
    // 1. 자기평가 제출
    const result =
      await this.performanceEvaluationService.직원의_전체_자기평가를_1차평가자에게_제출한다(
        employeeId,
        periodId,
        submittedBy,
      );

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.활동내역을_기록한다({
        periodId,
        employeeId,
        activityType: 'wbs_self_evaluation',
        activityAction: 'submitted',
        activityTitle: 'WBS 자기평가 제출 (1차 평가자)',
        relatedEntityType: 'wbs_self_evaluation',
        performedBy: submittedBy,
      });
    } catch (error) {
      // 활동 내역 기록 실패 시에도 평가 제출은 정상 처리
      this.logger.warn('활동 내역 기록 실패', {
        employeeId,
        periodId,
        error: error.message,
      });
    }

    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가를 1차 평가자 제출 취소한다 (피평가자 → 1차 평가자 제출 취소)
   * 특정 직원의 특정 평가기간에 대한 모든 1차 평가자 제출 완료된 WBS 자기평가를 취소합니다.
   */
  async 직원의_전체_자기평가를_1차평가자_제출_취소한다(
    employeeId: string,
    periodId: string,
    resetBy: string,
  ): Promise<ResetAllWbsSelfEvaluationsToEvaluatorResponse> {
    // 1. 자기평가 제출 취소
    const result =
      await this.performanceEvaluationService.직원의_전체_자기평가를_1차평가자_제출_취소한다(
        employeeId,
        periodId,
        resetBy,
      );

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.활동내역을_기록한다({
        periodId,
        employeeId,
        activityType: 'wbs_self_evaluation',
        activityAction: 'cancelled',
        activityTitle: 'WBS 자기평가 제출 취소 (1차 평가자)',
        relatedEntityType: 'wbs_self_evaluation',
        performedBy: resetBy,
      });
    } catch (error) {
      // 활동 내역 기록 실패 시에도 평가 취소는 정상 처리
      this.logger.warn('활동 내역 기록 실패', {
        employeeId,
        periodId,
        error: error.message,
      });
    }

    return result;
  }
}
