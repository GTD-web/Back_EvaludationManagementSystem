import { StepApprovalStatusEnum } from '@interface/common/dto/step-approval/update-step-approval.dto';
import { RevisionRequestBusinessService } from '@business/revision-request/revision-request-business.service';
import { RevisionRequestContextService } from '@context/revision-request-context';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import {
  CompleteRevisionRequest,
  CompleteRevisionRequestByEvaluator,
  GetMyRevisionRequests,
  GetMyUnreadCount,
  GetRevisionRequests,
  MarkRevisionRequestAsRead,
} from '@interface/common/decorators/revision-request/revision-request-api.decorators';
import { CompleteRevisionRequestByEvaluatorQueryDto } from '@interface/common/dto/revision-request/complete-revision-request-by-evaluator-query.dto';
import { CompleteRevisionRequestByEvaluatorDto } from '@interface/common/dto/revision-request/complete-revision-request-by-evaluator.dto';
import { CompleteRevisionRequestDto } from '@interface/common/dto/revision-request/complete-revision-request.dto';
import { GetRevisionRequestsQueryDto } from '@interface/common/dto/revision-request/get-revision-requests-query.dto';
import {
  RevisionRequestResponseDto,
  UnreadCountResponseDto,
} from '@interface/common/dto/revision-request/revision-request-response.dto';
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * 재작성 요청 컨트롤러
 * 재작성 요청 조회 및 관리 API를 제공합니다.
 */
@ApiTags('A-0-4. 평가자 - 재작성 요청')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/revision-requests')
export class EvaluatorRevisionRequestController {
  constructor(
    private readonly revisionRequestBusinessService: RevisionRequestBusinessService,
    private readonly revisionRequestContextService: RevisionRequestContextService,
  ) {}

  /**
   * 전체 재작성 요청 목록을 조회한다 (관리자용)
   * @deprecated 이 엔드포인트는 더 이상 사용되지 않습니다.
   */
  @GetRevisionRequests()
  async getRevisionRequests(
    @Query() query: GetRevisionRequestsQueryDto,
  ): Promise<RevisionRequestResponseDto[]> {
    const requests =
      await this.revisionRequestContextService.전체_재작성요청목록을_조회한다({
        evaluationPeriodId: query.evaluationPeriodId,
        employeeId: query.employeeId,
        requestedBy: query.requestedBy,
        isRead: query.isRead,
        isCompleted: query.isCompleted,
        step: query.step as any,
      });

    return requests.map((req) => ({
      requestId: req.request.id,
      evaluationPeriod: req.evaluationPeriod,
      employee: req.employee,
      step: req.request.step,
      comment: req.request.comment,
      requestedBy: req.request.requestedBy,
      requestedAt: req.request.requestedAt,
      recipientId: req.recipientInfo.recipientId,
      recipientType: req.recipientInfo.recipientType,
      isRead: req.recipientInfo.isRead,
      readAt: req.recipientInfo.readAt,
      isCompleted: req.recipientInfo.isCompleted,
      completedAt: req.recipientInfo.completedAt,
      responseComment: req.recipientInfo.responseComment,
      approvalStatus: req.approvalStatus as unknown as StepApprovalStatusEnum,
    }));
  }

  /**
   * 내 재작성 요청 목록을 조회한다
   * @deprecated 이 엔드포인트는 더 이상 사용되지 않습니다.
   */
  @GetMyRevisionRequests()
  async getMyRevisionRequests(
    @Query() query: GetRevisionRequestsQueryDto,
    @CurrentUser('id') recipientId: string,
  ): Promise<RevisionRequestResponseDto[]> {
    const requests =
      await this.revisionRequestContextService.내_재작성요청목록을_조회한다(
        recipientId,
        {
          evaluationPeriodId: query.evaluationPeriodId,
          employeeId: query.employeeId,
          isRead: query.isRead,
          isCompleted: query.isCompleted,
          step: query.step as any,
        },
      );

    return requests.map((req) => ({
      requestId: req.request.id,
      evaluationPeriod: req.evaluationPeriod,
      employee: req.employee,
      step: req.request.step,
      comment: req.request.comment,
      requestedBy: req.request.requestedBy,
      requestedAt: req.request.requestedAt,
      recipientId: req.recipientInfo.recipientId,
      recipientType: req.recipientInfo.recipientType,
      isRead: req.recipientInfo.isRead,
      readAt: req.recipientInfo.readAt,
      isCompleted: req.recipientInfo.isCompleted,
      completedAt: req.recipientInfo.completedAt,
      responseComment: req.recipientInfo.responseComment,
      approvalStatus: req.approvalStatus as unknown as StepApprovalStatusEnum,
    }));
  }

  /**
   * 읽지 않은 재작성 요청 수를 조회한다
   */
  @GetMyUnreadCount()
  async getMyUnreadCount(
    @CurrentUser('id') recipientId: string,
  ): Promise<UnreadCountResponseDto> {
    const count =
      await this.revisionRequestContextService.읽지않은_재작성요청수를_조회한다(
        recipientId,
      );

    return { unreadCount: count };
  }

  /**
   * 재작성 요청을 읽음 처리한다
   */
  @MarkRevisionRequestAsRead()
  async markAsRead(
    @Param('id', ParseUUIDPipe) requestId: string,
    @CurrentUser('id') recipientId: string,
  ): Promise<void> {
    await this.revisionRequestContextService.재작성요청을_읽음처리한다(
      requestId,
      recipientId,
    );
  }

  /**
   * 재작성 완료 응답을 제출한다
   * @deprecated 이 엔드포인트는 더 이상 사용되지 않습니다.
   */
  @CompleteRevisionRequest()
  async completeRevisionRequest(
    @Param('id', ParseUUIDPipe) requestId: string,
    @Body() dto: CompleteRevisionRequestDto,
    @CurrentUser('id') recipientId: string,
  ): Promise<void> {
    await this.revisionRequestBusinessService.재작성완료_응답을_제출한다(
      requestId,
      recipientId,
      dto.responseComment,
    );
  }

  /**
   * 평가기간, 직원, 평가자 기반으로 재작성 완료 응답을 제출한다 (관리자용)
   * @deprecated 이 엔드포인트는 더 이상 사용되지 않습니다.
   */
  @CompleteRevisionRequestByEvaluator()
  async completeRevisionRequestByEvaluator(
    @Param('evaluationPeriodId', ParseUUIDPipe) evaluationPeriodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('evaluatorId', ParseUUIDPipe) evaluatorId: string,
    @Query() queryDto: CompleteRevisionRequestByEvaluatorQueryDto,
    @Body() dto: CompleteRevisionRequestByEvaluatorDto,
  ): Promise<void> {
    await this.revisionRequestBusinessService.평가기간_직원_평가자로_재작성완료_응답을_제출한다(
      evaluationPeriodId,
      employeeId,
      evaluatorId,
      queryDto.step as any,
      dto.responseComment,
    );
  }
}
