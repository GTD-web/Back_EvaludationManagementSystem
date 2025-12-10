import { PeerEvaluationBusinessService } from '@business/peer-evaluation/peer-evaluation-business.service';
import { EvaluationQuestionManagementService } from '@context/evaluation-question-management-context/evaluation-question-management.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import { PeerEvaluationDetailResult } from '@context/performance-evaluation-context/handlers/peer-evaluation';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { ParseUUID, Roles } from '@interface/common/decorators';
import {
  CancelPeerEvaluation,
  CancelPeerEvaluationsByPeriod,
  GetEvaluatorAssignedEvaluatees,
  GetPeerEvaluationDetail,
  GetPeerEvaluations,
  RequestMultiplePeerEvaluations,
  RequestPartLeaderPeerEvaluations,
  RequestEvaluatorsPeerEvaluations,
  RequestPeerEvaluation,
  RequestPeerEvaluationToMultipleEvaluators,
  SubmitPeerEvaluation,
  UpsertPeerEvaluationAnswers
} from '@interface/common/decorators/performance-evaluation/peer-evaluation-api.decorators';
import {
  AssignedEvaluateeDto,
  BulkPeerEvaluationRequestResponseDto,
  GetEvaluatorAssignedEvaluateesQueryDto,
  PeerEvaluationFilterDto,
  PeerEvaluationListResponseDto,
  PeerEvaluationResponseDto,
  RequestMultiplePeerEvaluationsDto,
  RequestPartLeaderPeerEvaluationsDto,
  RequestEvaluatorsPeerEvaluationsDto,
  RequestPeerEvaluationDto,
  RequestPeerEvaluationToMultipleEvaluatorsDto,
  UpsertPeerEvaluationAnswersDto,
  UpsertPeerEvaluationAnswersResponseDto
} from '@interface/common/dto/performance-evaluation/peer-evaluation.dto';
import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * 동료평가 관리 컨트롤러
 *
 * 동료평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('C-5. 관리자 - 성과평가 - 동료평가')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/performance-evaluation/peer-evaluations')
export class PeerEvaluationManagementController {
  constructor(
    private readonly peerEvaluationBusinessService: PeerEvaluationBusinessService,
    private readonly employeeSyncService: EmployeeSyncService,
    private readonly evaluationQuestionManagementService: EvaluationQuestionManagementService,
  ) {}

  /**
   * 동료평가 요청(할당)
   */
  @RequestPeerEvaluation()
  async requestPeerEvaluation(
    @Body() dto: RequestPeerEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PeerEvaluationResponseDto> {
    const requestedBy = user.id;

    const evaluationId =
      await this.peerEvaluationBusinessService.동료평가를_요청한다({
        evaluatorId: dto.evaluatorId,
        evaluateeId: dto.evaluateeId,
        periodId: dto.periodId,
        requestDeadline: dto.requestDeadline,
        questionIds: dto.questionIds,
        requestedBy,
      });

    return {
      id: evaluationId,
      message: '동료평가가 성공적으로 요청되었습니다.',
    };
  }

  /**
   * 한 명의 피평가자를 여러 평가자에게 요청
   */
  @RequestPeerEvaluationToMultipleEvaluators()
  async requestPeerEvaluationToMultipleEvaluators(
    @Body() dto: RequestPeerEvaluationToMultipleEvaluatorsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BulkPeerEvaluationRequestResponseDto> {
    const requestedBy = user.id;

    const result =
      await this.peerEvaluationBusinessService.여러_평가자에게_동료평가를_요청한다(
        {
          evaluatorIds: dto.evaluatorIds,
          evaluateeId: dto.evaluateeId,
          periodId: dto.periodId,
          requestDeadline: dto.requestDeadline,
          questionIds: dto.questionIds,
          requestedBy,
        },
      );

    return {
      results: result.results,
      summary: result.summary,
      message:
        result.summary.failed > 0
          ? `${result.summary.total}건 중 ${result.summary.success}건의 동료평가 요청이 생성되었습니다. (실패: ${result.summary.failed}건)`
          : `${result.summary.success}건의 동료평가 요청이 성공적으로 생성되었습니다.`,
      // 하위 호환성을 위한 필드
      ids: result.results.filter((r) => r.success).map((r) => r.evaluationId!),
      count: result.summary.success,
    };
  }

  /**
   * 한 명의 평가자가 여러 피평가자를 평가하도록 요청
   */
  @RequestMultiplePeerEvaluations()
  async requestMultiplePeerEvaluations(
    @Body() dto: RequestMultiplePeerEvaluationsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BulkPeerEvaluationRequestResponseDto> {
    const requestedBy = user.id;

    const result =
      await this.peerEvaluationBusinessService.여러_피평가자에_대한_동료평가를_요청한다(
        {
          evaluatorId: dto.evaluatorId,
          evaluateeIds: dto.evaluateeIds,
          periodId: dto.periodId,
          requestDeadline: dto.requestDeadline,
          questionIds: dto.questionIds,
          requestedBy,
        },
      );

    return {
      results: result.results,
      summary: result.summary,
      message:
        result.summary.failed > 0
          ? `${result.summary.total}건 중 ${result.summary.success}건의 동료평가 요청이 생성되었습니다. (실패: ${result.summary.failed}건)`
          : `${result.summary.success}건의 동료평가 요청이 성공적으로 생성되었습니다.`,
      // 하위 호환성을 위한 필드
      ids: result.results.filter((r) => r.success).map((r) => r.evaluationId!),
      count: result.summary.success,
    };
  }

  /**
   * 파트장들 간 동료평가 요청
   */
  @RequestPartLeaderPeerEvaluations()
  async requestPartLeaderPeerEvaluations(
    @Body() dto: RequestPartLeaderPeerEvaluationsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BulkPeerEvaluationRequestResponseDto> {
    const requestedBy = user.id;

    // 1. 파트장 목록 결정
    let evaluatorIds: string[];
    let evaluateeIds: string[];

    if (dto.evaluatorIds && dto.evaluatorIds.length > 0) {
      // evaluatorIds가 제공된 경우: 해당 ID들 사용
      evaluatorIds = dto.evaluatorIds;
    } else {
      // evaluatorIds가 없는 경우: SSO에서 모든 파트장 조회
      const partLeaders = await this.employeeSyncService.getPartLeaders(false);
      evaluatorIds = partLeaders.map((emp) => emp.id);
    }

    if (dto.evaluateeIds && dto.evaluateeIds.length > 0) {
      // evaluateeIds가 제공된 경우: 해당 ID들 사용
      evaluateeIds = dto.evaluateeIds;
    } else {
      // evaluateeIds가 없는 경우: SSO에서 모든 파트장 조회
      const partLeaders = await this.employeeSyncService.getPartLeaders(false);
      evaluateeIds = partLeaders.map((emp) => emp.id);
    }

    // 파트장이 없는 경우
    if (evaluatorIds.length === 0 || evaluateeIds.length === 0) {
      return {
        results: [],
        summary: { total: 0, success: 0, failed: 0, partLeaderCount: 0 },
        message:
          '평가자 또는 피평가자가 없어 동료평가 요청을 생성하지 않았습니다.',
        ids: [],
        count: 0,
      };
    }

    // 2. questionIds가 없으면 기본 파트장 질문 그룹의 질문들을 사용
    let questionIds = dto.questionIds;
    if (!questionIds || questionIds.length === 0) {
      // "파트장 평가 질문" 그룹 조회
      const questionGroups =
        await this.evaluationQuestionManagementService.질문그룹목록을_조회한다({
          nameSearch: '파트장 평가 질문',
        });

      const partLeaderGroup = questionGroups.find(
        (group) => group.name === '파트장 평가 질문',
      );

      if (partLeaderGroup) {
        // 그룹의 질문 목록 조회
        const groupMappings =
          await this.evaluationQuestionManagementService.그룹의_질문목록을_조회한다(
            partLeaderGroup.id,
          );

        // displayOrder로 정렬하고 questionId만 추출
        questionIds = groupMappings
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((mapping) => mapping.questionId);
      }
    }

    // 3. 각 평가자가 지정된 피평가자들을 평가하도록 요청 생성
    const allResults: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const evaluatorId of evaluatorIds) {
      // 각 평가자가 자신을 제외한 모든 피평가자를 평가
      const targetEvaluateeIds = evaluateeIds.filter(
        (id) => id !== evaluatorId,
      );

      if (targetEvaluateeIds.length > 0) {
        const result =
          await this.peerEvaluationBusinessService.여러_피평가자에_대한_동료평가를_요청한다(
            {
              evaluatorId,
              evaluateeIds: targetEvaluateeIds,
              periodId: dto.periodId,
              requestDeadline: dto.requestDeadline,
              questionIds,
              requestedBy,
            },
          );

        allResults.push(...result.results);
        successCount += result.summary.success;
        failedCount += result.summary.failed;
      }
    }

    // 고유한 파트장 수 계산 (evaluators와 evaluatees 합집합)
    const uniquePartLeaderIds = new Set([...evaluatorIds, ...evaluateeIds]);
    const partLeaderCount = uniquePartLeaderIds.size;

    return {
      results: allResults,
      summary: {
        total: allResults.length,
        success: successCount,
        failed: failedCount,
        partLeaderCount,
      },
      message:
        failedCount > 0
          ? `파트장 ${partLeaderCount}명에 대해 ${allResults.length}건 중 ${successCount}건의 동료평가 요청이 생성되었습니다. (실패: ${failedCount}건)`
          : `파트장 ${partLeaderCount}명에 대해 ${successCount}건의 동료평가 요청이 성공적으로 생성되었습니다.`,
      // 하위 호환성을 위한 필드
      ids: allResults.filter((r) => r.success).map((r) => r.evaluationId!),
      count: successCount,
    };
  }

  /**
   * 평가자들 간 동료평가 요청 (다대다)
   */
  @RequestEvaluatorsPeerEvaluations()
  async requestEvaluatorsPeerEvaluations(
    @Body() dto: RequestEvaluatorsPeerEvaluationsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BulkPeerEvaluationRequestResponseDto> {
    const requestedBy = user.id;

    // evaluatorIds와 evaluateeIds는 필수이므로 그대로 사용
    const evaluatorIds = dto.evaluatorIds;
    const evaluateeIds = dto.evaluateeIds;

    // 각 평가자가 지정된 피평가자들을 평가하도록 요청 생성
    const allResults: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const evaluatorId of evaluatorIds) {
      // 각 평가자가 자신을 제외한 모든 피평가자를 평가
      const targetEvaluateeIds = evaluateeIds.filter(
        (id) => id !== evaluatorId,
      );

      if (targetEvaluateeIds.length > 0) {
        const result =
          await this.peerEvaluationBusinessService.여러_피평가자에_대한_동료평가를_요청한다(
            {
              evaluatorId,
              evaluateeIds: targetEvaluateeIds,
              periodId: dto.periodId,
              requestDeadline: dto.requestDeadline,
              questionIds: dto.questionIds,
              requestedBy,
            },
          );

        allResults.push(...result.results);
        successCount += result.summary.success;
        failedCount += result.summary.failed;
      }
    }

    // 고유한 평가자 수 계산 (evaluators와 evaluatees 합집합)
    const uniqueEvaluatorIds = new Set([...evaluatorIds, ...evaluateeIds]);
    const evaluatorCount = uniqueEvaluatorIds.size;

    return {
      results: allResults,
      summary: {
        total: allResults.length,
        success: successCount,
        failed: failedCount,
      },
      message:
        failedCount > 0
          ? `평가자 ${evaluatorCount}명에 대해 ${allResults.length}건 중 ${successCount}건의 동료평가 요청이 생성되었습니다. (실패: ${failedCount}건)`
          : `평가자 ${evaluatorCount}명에 대해 ${successCount}건의 동료평가 요청이 성공적으로 생성되었습니다.`,
      // 하위 호환성을 위한 필드
      ids: allResults.filter((r) => r.success).map((r) => r.evaluationId!),
      count: successCount,
    };
  }

  /**
   * 동료평가 제출
   */
  @SubmitPeerEvaluation()
  async submitPeerEvaluation(
    @ParseUUID('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const submittedBy = user.id;

    await this.peerEvaluationBusinessService.동료평가를_제출한다({
      evaluationId: id,
      submittedBy,
    });
  }

  /**
   * 동료평가 목록 조회 (통합 엔드포인트)
   * evaluatorId와 evaluateeId를 모두 query parameter로 받아 필터링합니다.
   */
  @GetPeerEvaluations()
  async getPeerEvaluations(
    @Query() filter: PeerEvaluationFilterDto,
  ): Promise<PeerEvaluationListResponseDto> {
    return await this.peerEvaluationBusinessService.동료평가_목록을_조회한다({
      evaluatorId: filter.evaluatorId,
      evaluateeId: filter.evaluateeId,
      periodId: filter.periodId,
      status: filter.status,
      page: filter.page || 1,
      limit: filter.limit || 10,
    });
  }


  /**
   * 동료평가 상세정보 조회
   */
  @GetPeerEvaluationDetail()
  async getPeerEvaluationDetail(
    @ParseUUID('id') id: string,
  ): Promise<PeerEvaluationDetailResult> {
    return await this.peerEvaluationBusinessService.동료평가_상세정보를_조회한다(
      {
        evaluationId: id,
      },
    );
  }

  /**
   * 평가자에게 할당된 피평가자 목록 조회
   */
  @GetEvaluatorAssignedEvaluatees()
  async getEvaluatorAssignedEvaluatees(
    @ParseUUID('evaluatorId') evaluatorId: string,
    @Query() query: GetEvaluatorAssignedEvaluateesQueryDto,
  ): Promise<AssignedEvaluateeDto[]> {
    return await this.peerEvaluationBusinessService.평가자에게_할당된_피평가자_목록을_조회한다(
      {
        evaluatorId,
        periodId: query.periodId,
        includeCompleted: query.includeCompleted,
      },
    );
  }

  /**
   * 동료평가 요청 취소
   */
  @CancelPeerEvaluation()
  async cancelPeerEvaluation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const cancelledBy = user.id;

    await this.peerEvaluationBusinessService.동료평가_요청을_취소한다({
      evaluationId: id,
      cancelledBy,
    });
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가 요청 취소
   */
  @CancelPeerEvaluationsByPeriod()
  async cancelPeerEvaluationsByPeriod(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string; cancelledCount: number }> {
    const cancelledBy = user.id;

    const result =
      await this.peerEvaluationBusinessService.피평가자의_동료평가_요청을_일괄_취소한다(
        {
          evaluateeId,
          periodId,
          cancelledBy,
        },
      );

    return {
      message: '동료평가 요청들이 성공적으로 취소되었습니다.',
      cancelledCount: result.cancelledCount,
    };
  }

  /**
   * 동료평가 질문 답변 저장/업데이트 (Upsert)
   */
  @UpsertPeerEvaluationAnswers()
  async upsertPeerEvaluationAnswers(
    @Body() dto: UpsertPeerEvaluationAnswersDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UpsertPeerEvaluationAnswersResponseDto> {
    const answeredBy = user.id;

    const result =
      await this.peerEvaluationBusinessService.동료평가_답변을_저장한다({
        peerEvaluationId: dto.peerEvaluationId,
        answers: dto.answers.map((a) => ({
          questionId: a.questionId,
          answer: a.answer,
          score: a.score,
        })),
        answeredBy,
      });

    return {
      savedCount: result.savedCount,
      message: '답변이 성공적으로 저장되었습니다.',
    };
  }
}
