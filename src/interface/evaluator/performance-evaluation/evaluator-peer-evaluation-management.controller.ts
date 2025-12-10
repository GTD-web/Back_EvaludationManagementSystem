import { PeerEvaluationBusinessService } from '@business/peer-evaluation/peer-evaluation-business.service';
import { PeerEvaluationDetailResult } from '@context/performance-evaluation-context/handlers/peer-evaluation';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { ParseUUID, Roles } from '@interface/common/decorators';
import { Body, Controller, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  GetEvaluatorAssignedEvaluatees,
  GetPeerEvaluationDetail,
  GetPeerEvaluations,
  SubmitPeerEvaluation,
  UpsertPeerEvaluationAnswers,
} from '@interface/common/decorators/performance-evaluation/peer-evaluation-api.decorators';
import {
  AssignedEvaluateeDto,
  GetEvaluatorAssignedEvaluateesQueryDto,
  PeerEvaluationFilterDto,
  PeerEvaluationListResponseDto,
  UpsertPeerEvaluationAnswersDto,
  UpsertPeerEvaluationAnswersResponseDto,
} from '@interface/common/dto/performance-evaluation/peer-evaluation.dto';

/**
 * 동료평가 관리 컨트롤러
 *
 * 동료평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('C-5. 평가자 - 성과평가 - 동료평가')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/performance-evaluation/peer-evaluations')
export class EvaluatorPeerEvaluationManagementController {
  constructor(
    private readonly peerEvaluationBusinessService: PeerEvaluationBusinessService,
  ) {}

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
}
