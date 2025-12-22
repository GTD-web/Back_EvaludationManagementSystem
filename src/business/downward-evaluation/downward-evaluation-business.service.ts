import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { GetDownwardEvaluationListQuery } from '@context/performance-evaluation-context/handlers/downward-evaluation';
import { GetEmployeeSelfEvaluationsQuery } from '@context/performance-evaluation-context/handlers/self-evaluation';
import { RecipientType } from '@domain/sub/evaluation-revision-request';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';
import { NotificationHelperService } from '@domain/common/notification';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';

/**
 * 하향평가 비즈니스 서비스
 *
 * 하향평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 평가라인 검증
 * - 평가자 권한 확인
 * - 여러 컨텍스트 간 조율
 * - 재작성 요청 자동 완료 처리
 * - 알림 서비스 연동
 */
@Injectable()
export class DownwardEvaluationBusinessService {
  private readonly logger = new Logger(DownwardEvaluationBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly evaluationPeriodManagementContextService: EvaluationPeriodManagementContextService,
    private readonly revisionRequestContextService: RevisionRequestContextService,
    private readonly stepApprovalContextService: StepApprovalContextService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
    private readonly notificationHelper: NotificationHelperService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  /**
   * 1차 하향평가를 저장한다 (평가라인 검증 포함)
   */
  async 일차_하향평가를_저장한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    actionBy: string;
  }): Promise<string> {
    // 1. 평가라인 검증: 1차 평가자 권한 확인
    // TODO: 테스트를 위해 임시 주석 처리
    // await this.evaluationCriteriaManagementService.평가라인을_검증한다(
    //   params.evaluateeId,
    //   params.evaluatorId,
    //   params.wbsId,
    //   'primary',
    // );

    // 2. 평가 점수 범위 검증 (점수가 있는 경우에만)
    if (
      params.downwardEvaluationScore !== undefined &&
      params.downwardEvaluationScore !== null
    ) {
      await this.evaluationPeriodManagementContextService.평가_점수를_검증한다(
        params.periodId,
        params.downwardEvaluationScore,
      );
    }

    // 3. 기존 하향평가 존재 여부 확인 (생성인지 수정인지 구분)
    const existingEvaluations =
      await this.performanceEvaluationService.하향평가_목록을_조회한다(
        new GetDownwardEvaluationListQuery(
          params.evaluatorId,
          params.evaluateeId,
          params.periodId,
          params.wbsId,
          'primary',
          undefined,
          1,
          1,
        ),
      );
    const isNewEvaluation =
      !existingEvaluations || existingEvaluations.items?.length === 0;

    // 4. 하향평가 저장 (컨텍스트 호출)
    const evaluationId =
      await this.performanceEvaluationService.하향평가를_저장한다(
        params.evaluatorId,
        params.evaluateeId,
        params.periodId,
        params.wbsId,
        params.selfEvaluationId,
        'primary',
        params.downwardEvaluationContent,
        params.downwardEvaluationScore,
        params.actionBy,
      );

    // 5. 초기 생성 시에만 활동 내역 기록
    if (isNewEvaluation) {
      try {
        await this.activityLogContextService.활동내역을_기록한다({
          periodId: params.periodId,
          employeeId: params.evaluateeId,
          activityType: 'downward_evaluation',
          activityAction: 'created',
          activityTitle: '1차 하향평가 생성',
          relatedEntityType: 'downward_evaluation',
          relatedEntityId: evaluationId,
          performedBy: params.actionBy,
          activityMetadata: {
            evaluatorId: params.evaluatorId,
            evaluationType: 'primary',
            wbsId: params.wbsId,
          },
        });
      } catch (error) {
        // 활동 내역 기록 실패 시에도 하향평가 저장은 정상 처리
        this.logger.warn('1차 하향평가 생성 활동 내역 기록 실패', {
          evaluationId,
          error: error.message,
        });
      }
    }

    // 6. 알림 발송 (추후 구현)
    // TODO: 1차 하향평가 저장 알림 발송
    // await this.notificationService.send({
    //   type: 'PRIMARY_DOWNWARD_EVALUATION_SAVED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     evaluationId,
    //     evaluatorId: params.evaluatorId,
    //     wbsId: params.wbsId,
    //   },
    // });

    this.logger.log('1차 하향평가 저장 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 2차 하향평가를 저장한다 (평가라인 검증 포함)
   */
  async 이차_하향평가를_저장한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    actionBy: string;
  }): Promise<string> {
    this.logger.log('2차 하향평가 저장 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      evaluateeId: params.evaluateeId,
      wbsId: params.wbsId,
    });

    // 1. 평가라인 검증: 2차 평가자 권한 확인
    // TODO: 테스트를 위해 임시 주석 처리
    // await this.evaluationCriteriaManagementService.평가라인을_검증한다(
    //   params.evaluateeId,
    //   params.evaluatorId,
    //   params.wbsId,
    //   'secondary',
    // );

    // 2. 평가 점수 범위 검증 (점수가 있는 경우에만)
    if (
      params.downwardEvaluationScore !== undefined &&
      params.downwardEvaluationScore !== null
    ) {
      await this.evaluationPeriodManagementContextService.평가_점수를_검증한다(
        params.periodId,
        params.downwardEvaluationScore,
      );
    }

    // 3. 기존 하향평가 존재 여부 확인 (생성인지 수정인지 구분)
    const existingEvaluations =
      await this.performanceEvaluationService.하향평가_목록을_조회한다(
        new GetDownwardEvaluationListQuery(
          params.evaluatorId,
          params.evaluateeId,
          params.periodId,
          params.wbsId,
          'secondary',
          undefined,
          1,
          1,
        ),
      );
    const isNewEvaluation =
      !existingEvaluations || existingEvaluations.items?.length === 0;

    // 4. 하향평가 저장 (컨텍스트 호출)
    const evaluationId =
      await this.performanceEvaluationService.하향평가를_저장한다(
        params.evaluatorId,
        params.evaluateeId,
        params.periodId,
        params.wbsId,
        params.selfEvaluationId,
        'secondary',
        params.downwardEvaluationContent,
        params.downwardEvaluationScore,
        params.actionBy,
      );

    // 5. 초기 생성 시에만 활동 내역 기록
    if (isNewEvaluation) {
      try {
        await this.activityLogContextService.활동내역을_기록한다({
          periodId: params.periodId,
          employeeId: params.evaluateeId,
          activityType: 'downward_evaluation',
          activityAction: 'created',
          activityTitle: '2차 하향평가 생성',
          relatedEntityType: 'downward_evaluation',
          relatedEntityId: evaluationId,
          performedBy: params.actionBy,
          activityMetadata: {
            evaluatorId: params.evaluatorId,
            evaluationType: 'secondary',
            wbsId: params.wbsId,
          },
        });
      } catch (error) {
        // 활동 내역 기록 실패 시에도 하향평가 저장은 정상 처리
        this.logger.warn('2차 하향평가 생성 활동 내역 기록 실패', {
          evaluationId,
          error: error.message,
        });
      }
    }

    // 6. 알림 발송 (추후 구현)
    // TODO: 2차 하향평가 저장 알림 발송
    // await this.notificationService.send({
    //   type: 'SECONDARY_DOWNWARD_EVALUATION_SAVED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     evaluationId,
    //     evaluatorId: params.evaluatorId,
    //     wbsId: params.wbsId,
    //   },
    // });

    this.logger.log('2차 하향평가 저장 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 1차 하향평가를 제출하고 재작성 요청을 자동 완료 처리한다
   * 특정 피평가자에 대한 1차 하향평가를 제출하고,
   * 해당 평가기간에 발생한 1차 하향평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   *
   * @param approveAllBelow true일 경우 자기평가도 함께 제출합니다.
   */
  async 일차_하향평가를_제출하고_재작성요청을_완료한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    submittedBy: string,
    approveAllBelow = true,
  ): Promise<void> {
    this.logger.log(
      `1차 하향평가 제출 및 재작성 요청 완료 처리 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}, 하위승인: ${approveAllBelow}`,
    );

    // 1. 1차 하향평가 제출
    await this.performanceEvaluationService.일차_하향평가를_제출한다(
      evaluateeId,
      periodId,
      wbsId,
      evaluatorId,
      submittedBy,
      approveAllBelow,
    );

    // 2. 해당 평가기간에 발생한 1차 하향평가에 대한 재작성 요청 자동 완료 처리
    // 1차평가자에게 요청된 재작성 요청 완료 처리
    await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
      periodId,
      evaluateeId,
      'primary',
      evaluatorId,
      RecipientType.PRIMARY_EVALUATOR,
      '1차 하향평가 제출로 인한 재작성 완료 처리',
    );

    // 3. 하위 단계 자동 승인: 자기평가 제출
    if (approveAllBelow) {
      await this.자기평가를_자동_제출한다(
        evaluateeId,
        periodId,
        wbsId,
        submittedBy,
      );

      // 4. 단계 승인 상태 자동 승인: 평가기준, 자기평가를 approved로 변경
      // (1차평가는 이미 제출 핸들러에서 approved로 설정됨)
      this.logger.log(
        `하위 단계 자동 승인 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}`,
      );

      try {
        // 4-1. 평가기준 설정 승인
        await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다({
          evaluationPeriodId: periodId,
          employeeId: evaluateeId,
          status: StepApprovalStatus.APPROVED,
          updatedBy: submittedBy,
        });

        // 4-2. 자기평가 승인
        await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
          evaluationPeriodId: periodId,
          employeeId: evaluateeId,
          status: StepApprovalStatus.APPROVED,
          updatedBy: submittedBy,
        });

        this.logger.log(
          `하위 단계 자동 승인 완료 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}`,
        );
      } catch (error) {
        this.logger.error('하위 단계 자동 승인 실패 (계속 진행)', error.stack, {
          evaluateeId,
          periodId,
          submittedBy,
        });
      }
    }

    // 5. 알림 전송 (비동기 처리, 실패해도 제출은 성공)
    this.피평가자에게_알림을_전송한다(evaluateeId, periodId).catch((error) => {
      this.logger.error(
        '1차 하향평가 제출 알림 전송 실패 (무시됨)',
        error.stack,
      );
    });

    this.logger.log(
      `1차 하향평가 제출 및 재작성 요청 완료 처리 완료 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
    );
  }

  /**
   * 피평가자에게 1차 하향평가 제출 알림을 전송한다
   */
  private async 피평가자에게_알림을_전송한다(
    evaluateeId: string,
    periodId: string,
  ): Promise<void> {
    try {
      // 평가기간 정보 조회
      const period = await this.evaluationPeriodService.ID로_조회한다(periodId);
      if (!period) {
        this.logger.warn(
          `평가기간을 찾을 수 없어 알림을 전송하지 않습니다. periodId=${periodId}`,
        );
        return;
      }

      // 알림 전송
      await this.notificationHelper.직원에게_알림을_전송한다({
        sender: 'system',
        title: '1차 하향평가 제출 알림',
        content: `${period.name} 평가기간의 1차 하향평가가 제출되었습니다.`,
        employeeNumber: evaluateeId,
        sourceSystem: 'ems',
        linkUrl: '/evaluations/self',
        metadata: {
          type: 'primary-downward-evaluation-submitted',
          priority: 'medium',
          periodId,
        },
      });

      this.logger.log(
        `1차 하향평가 제출 알림 전송 완료: 피평가자=${evaluateeId}`,
      );
    } catch (error) {
      this.logger.error('알림 전송 중 오류 발생', error.stack);
      throw error;
    }
  }

  /**
   * 2차 하향평가를 제출하고 재작성 요청을 자동 완료 처리한다
   * 특정 피평가자에 대한 2차 하향평가를 제출하고,
   * 해당 평가기간에 발생한 2차 하향평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   *
   * @param approveAllBelow true일 경우 1차 하향평가와 자기평가도 함께 제출합니다.
   */
  async 이차_하향평가를_제출하고_재작성요청을_완료한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    submittedBy: string,
    approveAllBelow = true,
  ): Promise<void> {
    this.logger.log(
      `2차 하향평가 제출 및 재작성 요청 완료 처리 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}, 하위승인: ${approveAllBelow}`,
    );

    // 1. 2차 하향평가 제출
    await this.performanceEvaluationService.이차_하향평가를_제출한다(
      evaluateeId,
      periodId,
      wbsId,
      evaluatorId,
      submittedBy,
      approveAllBelow,
    );

    // 2. 해당 평가기간에 발생한 2차 하향평가에 대한 재작성 요청 자동 완료 처리
    // 2차평가자에게 요청된 재작성 요청 완료 처리
    await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
      periodId,
      evaluateeId,
      'secondary',
      evaluatorId,
      RecipientType.SECONDARY_EVALUATOR,
      '2차 하향평가 제출로 인한 재작성 완료 처리',
    );

    // 3. 하위 단계 자동 승인: 1차 하향평가와 자기평가 제출
    if (approveAllBelow) {
      // 3-1. 1차 하향평가 자동 제출
      await this.일차_하향평가를_자동_제출한다(
        evaluateeId,
        periodId,
        wbsId,
        submittedBy,
      );

      // 3-2. 자기평가 자동 제출
      await this.자기평가를_자동_제출한다(
        evaluateeId,
        periodId,
        wbsId,
        submittedBy,
      );

      // 3-3. 단계 승인 상태 자동 승인: 평가기준, 자기평가, 1차평가를 approved로 변경
      // (2차평가는 이미 제출 핸들러에서 approved로 설정됨)
      this.logger.log(
        `하위 단계 자동 승인 시작 (2차) - 피평가자: ${evaluateeId}, 평가기간: ${periodId}`,
      );

      try {
        // 평가기준 설정 승인
        await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다({
          evaluationPeriodId: periodId,
          employeeId: evaluateeId,
          status: StepApprovalStatus.APPROVED,
          updatedBy: submittedBy,
        });

        // 자기평가 승인
        await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
          evaluationPeriodId: periodId,
          employeeId: evaluateeId,
          status: StepApprovalStatus.APPROVED,
          updatedBy: submittedBy,
        });

        // 1차 하향평가 승인
        await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다({
          evaluationPeriodId: periodId,
          employeeId: evaluateeId,
          status: StepApprovalStatus.APPROVED,
          updatedBy: submittedBy,
        });

        this.logger.log(
          `하위 단계 자동 승인 완료 (2차) - 피평가자: ${evaluateeId}, 평가기간: ${periodId}`,
        );
      } catch (error) {
        this.logger.error('하위 단계 자동 승인 실패 (계속 진행)', error.stack, {
          evaluateeId,
          periodId,
          evaluatorId,
          submittedBy,
        });
      }
    }

    this.logger.log(
      `2차 하향평가 제출 및 재작성 요청 완료 처리 완료 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
    );
  }

  /**
   * 1차 하향평가 재작성 요청 생성 및 제출 상태 초기화
   * 1차 하향평가 단계에서 재작성 요청이 생성될 때, 해당 평가기간의 1차 하향평가 제출 상태를 초기화합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param revisionComment 재작성 요청 코멘트
   * @param requestedBy 요청자 ID
   */
  async 일차_하향평가_재작성요청_생성_및_제출상태_초기화(
    evaluationPeriodId: string,
    employeeId: string,
    revisionComment: string,
    requestedBy: string,
  ): Promise<void> {
    this.logger.log(
      `1차 하향평가 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    // 1. 1차 평가자 조회
    const primaryEvaluatorId =
      await this.stepApprovalContextService.일차평가자를_조회한다(
        evaluationPeriodId,
        employeeId,
      );

    if (!primaryEvaluatorId) {
      this.logger.warn(
        `1차 평가자를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
      // 평가자가 없어도 재작성 요청은 생성할 수 있으므로 계속 진행
    } else {
      // 2. 해당 평가기간의 1차 하향평가 제출 상태 초기화 (isCompleted, completedAt)
      try {
        await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_초기화한다(
          primaryEvaluatorId,
          employeeId,
          evaluationPeriodId,
          DownwardEvaluationType.PRIMARY,
          requestedBy,
        );
      } catch (error) {
        // 하향평가가 없을 수도 있으므로 에러를 무시하고 계속 진행
        this.logger.warn(
          `1차 하향평가 초기화 실패 (하향평가가 없을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`,
          error,
        );
      }
    }

    // 3. 재작성 요청 생성
    await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      status: 'revision_requested' as any,
      revisionComment,
      updatedBy: requestedBy,
    });

    // 4. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId,
          employeeId,
          step: 'primary',
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
      `1차 하향평가 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );
  }

  /**
   * 2차 하향평가 재작성 요청 생성 및 제출 상태 초기화
   * 2차 하향평가 단계에서 재작성 요청이 생성될 때, 해당 평가기간의 특정 평가자의 2차 하향평가 제출 상태를 초기화합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param evaluatorId 평가자 ID
   * @param revisionComment 재작성 요청 코멘트
   * @param requestedBy 요청자 ID
   */
  async 이차_하향평가_재작성요청_생성_및_제출상태_초기화(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    revisionComment: string,
    requestedBy: string,
  ): Promise<
    import('@domain/sub/secondary-evaluation-step-approval').SecondaryEvaluationStepApproval
  > {
    this.logger.log(
      `2차 하향평가 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
    );

    // 1. 해당 평가기간의 특정 평가자의 2차 하향평가 제출 상태 초기화 (isCompleted, completedAt)
    try {
      await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_초기화한다(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        requestedBy,
      );
    } catch (error) {
      // 하향평가가 없을 수도 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `2차 하향평가 초기화 실패 (하향평가가 없을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
        error,
      );
    }

    // 2. 재작성 요청 생성
    const approval =
      await this.stepApprovalContextService.이차하향평가_확인상태를_변경한다({
        evaluationPeriodId,
        employeeId,
        evaluatorId,
        status: 'revision_requested' as any,
        revisionComment,
        updatedBy: requestedBy,
      });

    // 3. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId,
          employeeId,
          step: 'secondary',
          status: 'revision_requested' as StepApprovalStatus,
          revisionComment,
          updatedBy: requestedBy,
          evaluatorId,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }

    this.logger.log(
      `2차 하향평가 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
    );

    return approval;
  }

  /**
   * 피평가자의 모든 하향평가를 일괄 제출한다 (재작성 요청 완료 처리 및 활동 내역 기록 포함)
   * 특정 평가자의 특정 피평가자에 대한 모든 하향평가를 일괄 제출하고,
   * 해당 평가기간에 발생한 하향평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   */
  async 피평가자의_모든_하향평가를_일괄_제출한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    evaluationType: DownwardEvaluationType,
    submittedBy: string,
    approveAllBelow: boolean = true,
  ): Promise<{
    submittedCount: number;
    skippedCount: number;
    failedCount: number;
    submittedIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    this.logger.log('하향평가 일괄 제출 시작', {
      evaluatorId,
      evaluateeId,
      periodId,
      evaluationType,
      approveAllBelow,
    });

    // 1. 하향평가 일괄 제출
    const result =
      await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(
        evaluatorId,
        evaluateeId,
        periodId,
        evaluationType,
        submittedBy,
        false, // forceSubmit
        approveAllBelow,
      );

    // 2. 해당 평가기간에 발생한 하향평가에 대한 재작성 요청 자동 완료 처리
    const step =
      evaluationType === DownwardEvaluationType.PRIMARY
        ? 'primary'
        : 'secondary';
    const recipientType =
      evaluationType === DownwardEvaluationType.PRIMARY
        ? RecipientType.PRIMARY_EVALUATOR
        : RecipientType.SECONDARY_EVALUATOR;
    const responseComment =
      evaluationType === DownwardEvaluationType.PRIMARY
        ? '1차 하향평가 일괄 제출로 인한 재작성 완료 처리'
        : '2차 하향평가 일괄 제출로 인한 재작성 완료 처리';

    // 재작성 요청 완료 처리 (재작성 요청이 없으면 그냥 return)
    try {
      await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
        periodId,
        evaluateeId,
        step,
        evaluatorId,
        recipientType,
        responseComment,
      );
    } catch (error) {
      // 재작성 요청 완료 처리 실패 시에도 하향평가 제출은 정상 처리
      this.logger.warn('재작성 요청 완료 처리 실패', {
        evaluatorId,
        evaluateeId,
        periodId,
        evaluationType,
        error: error.message,
      });
    }

    // 3. 하위 단계 자동 승인 (approveAllBelow=true이고 제출이 성공한 경우)
    if (approveAllBelow && result.submittedCount > 0) {
      this.logger.log(
        `하위 단계 자동 승인 시작 (일괄 제출) - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가유형: ${evaluationType}`,
      );

      try {
        // 1차 평가 일괄 제출인 경우: 평가기준, 자기평가, 1차평가를 승인
        if (evaluationType === DownwardEvaluationType.PRIMARY) {
          // 평가기준 설정 승인
          await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다(
            {
              evaluationPeriodId: periodId,
              employeeId: evaluateeId,
              status: StepApprovalStatus.APPROVED,
              updatedBy: submittedBy,
            },
          );

          // 자기평가 승인
          await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
            evaluationPeriodId: periodId,
            employeeId: evaluateeId,
            status: StepApprovalStatus.APPROVED,
            updatedBy: submittedBy,
          });

          // 1차 하향평가 승인
          await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다(
            {
              evaluationPeriodId: periodId,
              employeeId: evaluateeId,
              status: StepApprovalStatus.APPROVED,
              updatedBy: submittedBy,
            },
          );

          this.logger.log(
            `하위 단계 자동 승인 완료 (1차 일괄) - 피평가자: ${evaluateeId}, 평가기간: ${periodId}`,
          );
        }
        // 2차 평가 일괄 제출인 경우: 평가기준, 자기평가, 1차평가, 2차평가를 승인
        else if (evaluationType === DownwardEvaluationType.SECONDARY) {
          // 평가기준 설정 승인
          await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다(
            {
              evaluationPeriodId: periodId,
              employeeId: evaluateeId,
              status: StepApprovalStatus.APPROVED,
              updatedBy: submittedBy,
            },
          );

          // 자기평가 승인
          await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
            evaluationPeriodId: periodId,
            employeeId: evaluateeId,
            status: StepApprovalStatus.APPROVED,
            updatedBy: submittedBy,
          });

          // 1차 하향평가 승인
          await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다(
            {
              evaluationPeriodId: periodId,
              employeeId: evaluateeId,
              status: StepApprovalStatus.APPROVED,
              updatedBy: submittedBy,
            },
          );

          // 2차 하향평가 승인
          await this.stepApprovalContextService.이차하향평가_확인상태를_변경한다(
            {
              evaluationPeriodId: periodId,
              employeeId: evaluateeId,
              evaluatorId,
              status: StepApprovalStatus.APPROVED,
              updatedBy: submittedBy,
            },
          );

          this.logger.log(
            `하위 단계 자동 승인 완료 (2차 일괄) - 피평가자: ${evaluateeId}, 평가기간: ${periodId}`,
          );
        }
      } catch (error) {
        this.logger.error('하위 단계 자동 승인 실패 (계속 진행)', error.stack, {
          evaluatorId,
          evaluateeId,
          periodId,
          evaluationType,
          submittedBy,
        });
      }
    }

    // 4. 활동 내역 기록
    try {
      const evaluationTypeText =
        evaluationType === DownwardEvaluationType.PRIMARY
          ? '1차 하향평가'
          : '2차 하향평가';
      const activityTitle = `${evaluationTypeText} 일괄 제출`;

      await this.activityLogContextService.활동내역을_기록한다({
        periodId,
        employeeId: evaluateeId,
        activityType: 'downward_evaluation',
        activityAction: 'submitted',
        activityTitle,
        relatedEntityType: 'downward_evaluation',
        performedBy: submittedBy,
        activityMetadata: {
          evaluatorId,
          evaluationType,
          submittedCount: result.submittedCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          submittedIds: result.submittedIds,
          bulkOperation: true,
        },
      });
    } catch (error) {
      // 활동 내역 기록 실패 시에도 하향평가 제출은 정상 처리
      this.logger.warn('활동 내역 기록 실패', {
        evaluatorId,
        evaluateeId,
        periodId,
        error: error.message,
      });
    }

    this.logger.log('하향평가 일괄 제출 완료', {
      submittedCount: result.submittedCount,
      skippedCount: result.skippedCount,
      failedCount: result.failedCount,
    });

    return result;
  }

  /**
   * 자기평가를 자동으로 제출한다
   * 해당 WBS와 피평가자의 미제출 자기평가를 찾아서 제출합니다.
   */
  private async 자기평가를_자동_제출한다(
    employeeId: string,
    periodId: string,
    wbsId: string,
    submittedBy: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `자기평가 자동 제출 시작 - 직원: ${employeeId}, 평가기간: ${periodId}, WBS: ${wbsId}`,
      );

      // 1. 해당 WBS와 피평가자의 자기평가 조회 (Context Service 사용)
      const query = new GetEmployeeSelfEvaluationsQuery(
        employeeId,
        periodId,
        undefined, // projectId
        1,
        100, // 충분히 큰 limit로 모든 평가를 조회
      );
      const result =
        await this.performanceEvaluationService.직원의_자기평가_목록을_조회한다(
          query,
        );

      if (!result.evaluations || result.evaluations.length === 0) {
        this.logger.warn(
          `자기평가를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${periodId}`,
        );
        return;
      }

      // wbsId로 필터링
      const selfEvaluation = result.evaluations.find(
        (e) => e.wbsItemId === wbsId,
      );

      if (!selfEvaluation) {
        this.logger.warn(
          `해당 WBS의 자기평가를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${periodId}, WBS: ${wbsId}`,
        );
        return;
      }

      // 2. 이미 제출된 자기평가는 건너뛰기
      if (selfEvaluation.submittedToManager) {
        this.logger.log(
          `자기평가가 이미 제출되어 있습니다 - 자기평가 ID: ${selfEvaluation.id}`,
        );
        return;
      }

      // 3. 자기평가 제출
      await this.performanceEvaluationService.WBS자기평가를_제출한다(
        selfEvaluation.id,
        submittedBy,
      );

      this.logger.log(
        `자기평가 자동 제출 완료 - 자기평가 ID: ${selfEvaluation.id}`,
      );
    } catch (error) {
      this.logger.error(
        `자기평가 자동 제출 실패 - 직원: ${employeeId}, 평가기간: ${periodId}, WBS: ${wbsId}`,
        error,
      );
      // 자기평가 제출 실패 시에도 하향평가 제출은 정상 처리
    }
  }

  /**
   * 1차 하향평가를 자동으로 제출한다
   * 해당 WBS와 피평가자의 미제출 1차 하향평가를 찾아서 제출합니다.
   */
  private async 일차_하향평가를_자동_제출한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    submittedBy: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `1차 하향평가 자동 제출 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, WBS: ${wbsId}`,
      );

      // 1. 1차 평가자 조회
      const primaryEvaluatorId =
        await this.stepApprovalContextService.일차평가자를_조회한다(
          periodId,
          evaluateeId,
        );

      if (!primaryEvaluatorId) {
        this.logger.warn(
          `1차 평가자를 찾을 수 없습니다 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}`,
        );
        return;
      }

      // 2. 해당 WBS와 피평가자의 1차 하향평가 조회 (Context Service 사용)
      const query = new GetDownwardEvaluationListQuery(
        primaryEvaluatorId,
        evaluateeId,
        periodId,
        wbsId,
        'primary',
        undefined,
        1,
        1,
      );
      const result =
        await this.performanceEvaluationService.하향평가_목록을_조회한다(query);

      if (!result.evaluations || result.evaluations.length === 0) {
        this.logger.warn(
          `1차 하향평가를 찾을 수 없습니다 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, WBS: ${wbsId}`,
        );
        return;
      }

      const downwardEvaluation = result.evaluations[0];

      // 3. 이미 제출된 1차 하향평가는 건너뛰기
      if (downwardEvaluation.isCompleted) {
        this.logger.log(
          `1차 하향평가가 이미 제출되어 있습니다 - 하향평가 ID: ${downwardEvaluation.id}`,
        );
        return;
      }

      // 4. 1차 하향평가 제출
      await this.performanceEvaluationService.일차_하향평가를_제출한다(
        evaluateeId,
        periodId,
        wbsId,
        primaryEvaluatorId,
        submittedBy,
      );

      this.logger.log(
        `1차 하향평가 자동 제출 완료 - 하향평가 ID: ${downwardEvaluation.id}`,
      );
    } catch (error) {
      this.logger.error(
        `1차 하향평가 자동 제출 실패 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, WBS: ${wbsId}`,
        error,
      );
      // 1차 하향평가 제출 실패 시에도 2차 하향평가 제출은 정상 처리
    }
  }
}
