import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import {
  GetPeerEvaluationListQuery,
  GetPeerEvaluationDetailQuery,
  GetEvaluatorAssignedEvaluateesQuery,
  PeerEvaluationDetailResult,
  EvaluatorAssignedEvaluatee,
} from '@context/performance-evaluation-context/handlers/peer-evaluation';

/**
 * 동료평가 비즈니스 서비스
 *
 * 동료평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 컨텍스트 서비스 호출
 * - 알림 서비스 연동
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class PeerEvaluationBusinessService {
  private readonly logger = new Logger(PeerEvaluationBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    // private readonly notificationService: NotificationService, // TODO: 알림 서비스 추가 시 주입
  ) {}

  /**
   * 동료평가를 요청(할당)하고 알림을 발송한다
   * 관리자가 평가자에게 피평가자를 평가하도록 요청합니다.
   * 평가 상태는 PENDING으로 생성됩니다.
   */
  async 동료평가를_요청한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy: string;
  }): Promise<string> {
    this.logger.log('동료평가 요청 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      evaluateeId: params.evaluateeId,
      periodId: params.periodId,
      requestDeadline: params.requestDeadline,
      questionCount: params.questionIds?.length || 0,
    });

    // 1. 동료평가 요청 (PENDING 상태로 생성)
    const evaluationId =
      await this.performanceEvaluationService.동료평가를_생성한다(
        params.evaluatorId,
        params.evaluateeId,
        params.periodId,
        '', // projectId는 빈 문자열 (요청 시에는 프로젝트 미정)
        params.requestDeadline,
        undefined, // evaluationContent (작성 전)
        undefined, // score (작성 전)
        params.requestedBy,
      );

    // 2. 질문 매핑 생성 (questionIds가 제공된 경우)
    if (params.questionIds && params.questionIds.length > 0) {
      await this.performanceEvaluationService.동료평가에_질문을_매핑한다(
        evaluationId,
        params.questionIds,
        params.requestedBy,
      );
      this.logger.log(
        `동료평가 질문 매핑 완료 - 질문 개수: ${params.questionIds.length}`,
      );
    }

    // 3. 알림 발송 (추후 구현)
    // TODO: 동료평가 요청 알림 발송
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATION_REQUESTED',
    //   recipientId: params.evaluatorId,
    //   data: {
    //     evaluationId,
    //     evaluateeId: params.evaluateeId,
    //     periodId: params.periodId,
    //   },
    // });

    this.logger.log('동료평가 요청 및 알림 발송 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 한 명의 피평가자를 여러 평가자에게 요청하고 알림을 발송한다
   * 여러 평가자가 동일한 피평가자를 평가하도록 일괄 요청합니다.
   */
  async 여러_평가자에게_동료평가를_요청한다(params: {
    evaluatorIds: string[];
    evaluateeId: string;
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy: string;
  }): Promise<{
    results: Array<{
      evaluatorId: string;
      evaluateeId: string;
      success: boolean;
      evaluationId?: string;
      error?: { code: string; message: string };
    }>;
    summary: { total: number; success: number; failed: number };
  }> {
    // 자기 자신 평가 방지: evaluatorIds에서 evaluateeId 제거
    const filteredEvaluatorIds = params.evaluatorIds.filter(
      (evaluatorId) => evaluatorId !== params.evaluateeId,
    );

    this.logger.log('여러 평가자에게 동료평가 요청 비즈니스 로직 시작', {
      originalEvaluatorCount: params.evaluatorIds.length,
      filteredEvaluatorCount: filteredEvaluatorIds.length,
      evaluateeId: params.evaluateeId,
      periodId: params.periodId,
      requestDeadline: params.requestDeadline,
      questionCount: params.questionIds?.length || 0,
    });

    const results: Array<{
      evaluatorId: string;
      evaluateeId: string;
      success: boolean;
      evaluationId?: string;
      error?: { code: string; message: string };
    }> = [];

    // 각 평가자에게 평가 요청 생성
    for (const evaluatorId of filteredEvaluatorIds) {
      try {
        const evaluationId = await this.동료평가를_요청한다({
          evaluatorId,
          evaluateeId: params.evaluateeId,
          periodId: params.periodId,
          requestDeadline: params.requestDeadline,
          questionIds: params.questionIds,
          requestedBy: params.requestedBy,
        });

        results.push({
          evaluatorId,
          evaluateeId: params.evaluateeId,
          success: true,
          evaluationId,
        });
      } catch (error) {
        this.logger.error(`평가자 ${evaluatorId}에 대한 요청 생성 실패`, error);

        results.push({
          evaluatorId,
          evaluateeId: params.evaluateeId,
          success: false,
          error: {
            code: error.name || 'UNKNOWN_ERROR',
            message: error.message || '알 수 없는 오류가 발생했습니다.',
          },
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    this.logger.log('여러 평가자에게 동료평가 요청 완료', {
      totalRequested: filteredEvaluatorIds.length,
      successCount,
      failedCount,
    });

    return {
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
      },
    };
  }

  /**
   * 한 명의 평가자가 여러 피평가자를 평가하도록 요청하고 알림을 발송한다
   * 한 명의 평가자가 여러 피평가자를 평가하도록 일괄 요청합니다.
   */
  async 여러_피평가자에_대한_동료평가를_요청한다(params: {
    evaluatorId: string;
    evaluateeIds: string[];
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy: string;
  }): Promise<{
    results: Array<{
      evaluatorId: string;
      evaluateeId: string;
      success: boolean;
      evaluationId?: string;
      error?: { code: string; message: string };
    }>;
    summary: { total: number; success: number; failed: number };
  }> {
    // 자기 자신 평가 방지: evaluateeIds에서 evaluatorId 제거
    const filteredEvaluateeIds = params.evaluateeIds.filter(
      (evaluateeId) => evaluateeId !== params.evaluatorId,
    );

    this.logger.log('여러 피평가자에 대한 동료평가 요청 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      originalEvaluateeCount: params.evaluateeIds.length,
      filteredEvaluateeCount: filteredEvaluateeIds.length,
      periodId: params.periodId,
      requestDeadline: params.requestDeadline,
      questionCount: params.questionIds?.length || 0,
    });

    const results: Array<{
      evaluatorId: string;
      evaluateeId: string;
      success: boolean;
      evaluationId?: string;
      error?: { code: string; message: string };
    }> = [];

    // 각 피평가자에 대한 평가 요청 생성
    for (const evaluateeId of filteredEvaluateeIds) {
      try {
        const evaluationId = await this.동료평가를_요청한다({
          evaluatorId: params.evaluatorId,
          evaluateeId,
          periodId: params.periodId,
          requestDeadline: params.requestDeadline,
          questionIds: params.questionIds,
          requestedBy: params.requestedBy,
        });

        results.push({
          evaluatorId: params.evaluatorId,
          evaluateeId,
          success: true,
          evaluationId,
        });
      } catch (error) {
        this.logger.error(
          `피평가자 ${evaluateeId}에 대한 요청 생성 실패`,
          error,
        );

        results.push({
          evaluatorId: params.evaluatorId,
          evaluateeId,
          success: false,
          error: {
            code: error.name || 'UNKNOWN_ERROR',
            message: error.message || '알 수 없는 오류가 발생했습니다.',
          },
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    this.logger.log('여러 피평가자에 대한 동료평가 요청 완료', {
      totalRequested: filteredEvaluateeIds.length,
      successCount,
      failedCount,
    });

    return {
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
      },
    };
  }

  /**
   * 파트장들 간 동료평가를 요청하고 알림을 발송한다
   * 모든 파트장이 다른 모든 파트장을 평가하도록 일괄 요청합니다.
   * (자기 자신 제외)
   */
  async 파트장들_간_동료평가를_요청한다(params: {
    periodId: string;
    partLeaderIds: string[];
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy: string;
  }): Promise<{
    results: Array<{
      evaluatorId: string;
      evaluateeId: string;
      success: boolean;
      evaluationId?: string;
      error?: { code: string; message: string };
    }>;
    summary: {
      total: number;
      success: number;
      failed: number;
      partLeaderCount: number;
    };
  }> {
    const {
      periodId,
      partLeaderIds,
      requestDeadline,
      questionIds,
      requestedBy,
    } = params;

    this.logger.log('파트장들 간 동료평가 요청 비즈니스 로직 시작', {
      partLeaderCount: partLeaderIds.length,
      periodId,
      requestDeadline,
      questionCount: questionIds?.length || 0,
    });

    const results: Array<{
      evaluatorId: string;
      evaluateeId: string;
      success: boolean;
      evaluationId?: string;
      error?: { code: string; message: string };
    }> = [];

    // 각 파트장이 다른 모든 파트장을 평가하도록 요청 생성
    for (const evaluatorId of partLeaderIds) {
      // 자기 자신을 제외한 다른 파트장들을 피평가자로 설정
      const evaluateeIds = partLeaderIds.filter((id) => id !== evaluatorId);

      for (const evaluateeId of evaluateeIds) {
        try {
          const evaluationId = await this.동료평가를_요청한다({
            evaluatorId,
            evaluateeId,
            periodId,
            requestDeadline,
            questionIds,
            requestedBy,
          });

          results.push({
            evaluatorId,
            evaluateeId,
            success: true,
            evaluationId,
          });
        } catch (error) {
          this.logger.error(
            `파트장 간 동료평가 요청 생성 실패 (평가자: ${evaluatorId}, 피평가자: ${evaluateeId})`,
            error,
          );

          results.push({
            evaluatorId,
            evaluateeId,
            success: false,
            error: {
              code: error.name || 'UNKNOWN_ERROR',
              message: error.message || '알 수 없는 오류가 발생했습니다.',
            },
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    this.logger.log('파트장들 간 동료평가 요청 완료', {
      partLeaderCount: partLeaderIds.length,
      totalRequested: results.length,
      successCount,
      failedCount,
    });

    return {
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
        partLeaderCount: partLeaderIds.length,
      },
    };
  }

  /**
   * 동료평가를 생성하고 알림을 발송한다
   */
  async 동료평가를_생성한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    projectId: string;
    peerEvaluationContent?: string;
    peerEvaluationScore?: number;
    createdBy: string;
  }): Promise<string> {
    this.logger.log('동료평가 생성 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      evaluateeId: params.evaluateeId,
    });

    // 1. 동료평가 생성 (컨텍스트 호출)
    const evaluationId =
      await this.performanceEvaluationService.동료평가를_생성한다(
        params.evaluatorId,
        params.evaluateeId,
        params.periodId,
        params.projectId,
        undefined, // requestDeadline
        params.peerEvaluationContent,
        params.peerEvaluationScore,
        params.createdBy,
      );

    // 2. 알림 발송 (추후 구현)
    // TODO: 동료평가 생성 알림 발송
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATION_CREATED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     evaluationId,
    //     evaluatorId: params.evaluatorId,
    //   },
    // });

    this.logger.log('동료평가 생성 및 알림 발송 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 동료평가를 수정한다
   */
  async 동료평가를_수정한다(params: {
    evaluationId: string;
    peerEvaluationContent?: string;
    peerEvaluationScore?: number;
    updatedBy: string;
  }): Promise<void> {
    this.logger.log('동료평가 수정 비즈니스 로직 시작', {
      evaluationId: params.evaluationId,
    });

    await this.performanceEvaluationService.동료평가를_수정한다(
      params.evaluationId,
      params.peerEvaluationContent,
      params.peerEvaluationScore,
      params.updatedBy,
    );

    this.logger.log('동료평가 수정 완료', {
      evaluationId: params.evaluationId,
    });
  }

  /**
   * 동료평가 요청을 취소한다
   * 관리자가 보낸 평가 요청을 철회합니다.
   */
  async 동료평가_요청을_취소한다(params: {
    evaluationId: string;
    cancelledBy: string;
  }): Promise<void> {
    this.logger.log('동료평가 요청 취소 비즈니스 로직 시작', {
      evaluationId: params.evaluationId,
    });

    // 1. 동료평가 요청 취소 (컨텍스트 호출)
    await this.performanceEvaluationService.동료평가를_취소한다(
      params.evaluationId,
      params.cancelledBy,
    );

    // 2. 알림 발송 (추후 구현)
    // TODO: 동료평가 요청 취소 알림 발송
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATION_REQUEST_CANCELLED',
    //   recipientId: evaluatorId, // 평가자에게 알림
    //   data: {
    //     evaluationId: params.evaluationId,
    //   },
    // });

    this.logger.log('동료평가 요청 취소 완료', {
      evaluationId: params.evaluationId,
    });
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가 요청을 취소한다
   * 해당 피평가자에게 할당된 모든 평가 요청을 일괄 철회합니다.
   */
  async 피평가자의_동료평가_요청을_일괄_취소한다(params: {
    evaluateeId: string;
    periodId: string;
    cancelledBy: string;
  }): Promise<{ cancelledCount: number }> {
    this.logger.log('피평가자의 동료평가 요청 일괄 취소 비즈니스 로직 시작', {
      evaluateeId: params.evaluateeId,
      periodId: params.periodId,
    });

    // 1. 동료평가 요청 일괄 취소 (컨텍스트 호출)
    const result =
      await this.performanceEvaluationService.피평가자의_동료평가를_일괄_취소한다(
        params.evaluateeId,
        params.periodId,
        params.cancelledBy,
      );

    // 2. 알림 발송 (추후 구현)
    // TODO: 동료평가 요청 일괄 취소 알림 발송
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATION_REQUESTS_CANCELLED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     periodId: params.periodId,
    //     cancelledCount: result.cancelledCount,
    //   },
    // });

    this.logger.log('피평가자의 동료평가 요청 일괄 취소 완료', {
      cancelledCount: result.cancelledCount,
    });

    return result;
  }

  /**
   * 동료평가를 제출하고 알림을 발송한다
   */
  async 동료평가를_제출한다(params: {
    evaluationId: string;
    submittedBy: string;
  }): Promise<void> {
    this.logger.log('동료평가 제출 비즈니스 로직 시작', {
      evaluationId: params.evaluationId,
    });

    // 1. 동료평가 제출 (컨텍스트 호출)
    await this.performanceEvaluationService.동료평가를_제출한다(
      params.evaluationId,
      params.submittedBy,
    );

    // 2. 알림 발송 (추후 구현)
    // TODO: 동료평가 제출 알림 발송
    // const evaluation = await this.performanceEvaluationService.동료평가_상세정보를_조회한다({
    //   evaluationId: params.evaluationId,
    // });
    //
    // await this.notificationService.send({
    //   type: 'PEER_EVALUATION_SUBMITTED',
    //   recipientId: evaluation.evaluateeId,
    //   data: {
    //     evaluationId: params.evaluationId,
    //     evaluatorId: evaluation.evaluatorId,
    //   },
    // });

    this.logger.log('동료평가 제출 및 알림 발송 완료', {
      evaluationId: params.evaluationId,
    });
  }

  /**
   * 동료평가 목록을 조회한다
   */
  async 동료평가_목록을_조회한다(params: {
    evaluatorId?: string;
    evaluateeId?: string;
    periodId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const query = new GetPeerEvaluationListQuery(
      params.evaluatorId,
      params.evaluateeId,
      params.periodId,
      params.status,
      params.page,
      params.limit,
    );

    return await this.performanceEvaluationService.동료평가_목록을_조회한다(
      query,
    );
  }

  /**
   * 동료평가 상세정보를 조회한다
   */
  async 동료평가_상세정보를_조회한다(params: {
    evaluationId: string;
  }): Promise<PeerEvaluationDetailResult> {
    this.logger.log('동료평가 상세정보 조회 비즈니스 로직', {
      evaluationId: params.evaluationId,
    });

    const query = new GetPeerEvaluationDetailQuery(params.evaluationId);

    return await this.performanceEvaluationService.동료평가_상세정보를_조회한다(
      query,
    );
  }

  /**
   * 평가자에게 할당된 피평가자 목록을 조회한다
   */
  async 평가자에게_할당된_피평가자_목록을_조회한다(params: {
    evaluatorId: string;
    periodId?: string;
    includeCompleted?: boolean;
  }): Promise<EvaluatorAssignedEvaluatee[]> {
    this.logger.log('평가자에게 할당된 피평가자 목록 조회 비즈니스 로직', {
      evaluatorId: params.evaluatorId,
      periodId: params.periodId,
    });

    const query = new GetEvaluatorAssignedEvaluateesQuery(
      params.evaluatorId,
      params.periodId,
      params.includeCompleted || false,
    );

    return await this.performanceEvaluationService.평가자에게_할당된_피평가자_목록을_조회한다(
      query,
    );
  }

  /**
   * 동료평가 질문에 대한 답변을 저장/업데이트한다
   *
   * 동료평가에 매핑된 질문들에 대한 답변을 upsert합니다.
   * - 기존 답변이 있으면 업데이트
   * - 기존 답변이 없으면 신규 저장
   * - 동료평가 상태를 자동으로 '진행중'으로 변경
   */
  async 동료평가_답변을_저장한다(params: {
    peerEvaluationId: string;
    answers: Array<{
      questionId: string;
      answer: string;
      score?: number;
    }>;
    answeredBy: string;
  }): Promise<{ savedCount: number }> {
    this.logger.log('동료평가 답변 저장 비즈니스 로직 시작', {
      peerEvaluationId: params.peerEvaluationId,
      answersCount: params.answers.length,
    });

    const savedCount =
      await this.performanceEvaluationService.동료평가_답변을_저장한다(
        params.peerEvaluationId,
        params.answers,
        params.answeredBy,
      );

    this.logger.log('동료평가 답변 저장 완료', {
      peerEvaluationId: params.peerEvaluationId,
      savedCount,
    });

    // TODO: 알림 발송 (답변 저장 알림)
    // await this.notificationService.동료평가_답변저장_알림(params.peerEvaluationId);

    return { savedCount };
  }
}
