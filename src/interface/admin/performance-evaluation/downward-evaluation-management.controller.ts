import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { ParseUUID, Roles } from '@interface/common/decorators';
import { Body, Controller, Logger, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  GetDownwardEvaluationDetailQuery,
  GetDownwardEvaluationListQuery,
} from '@context/performance-evaluation-context/handlers/downward-evaluation';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { DownwardEvaluationBusinessService } from '@business/downward-evaluation/downward-evaluation-business.service';
import {
  GetDownwardEvaluationDetail,
  GetEvaluatorDownwardEvaluations,
  ResetPrimaryDownwardEvaluation,
  ResetSecondaryDownwardEvaluation,
  SubmitDownwardEvaluation,
  SubmitPrimaryDownwardEvaluation,
  SubmitSecondaryDownwardEvaluation,
  UpsertPrimaryDownwardEvaluation,
  UpsertSecondaryDownwardEvaluation,
  BulkSubmitDownwardEvaluations,
  BulkResetDownwardEvaluations,
} from '@interface/common/decorators/performance-evaluation/downward-evaluation-api.decorators';
import {
  CreatePrimaryDownwardEvaluationBodyDto,
  CreateSecondaryDownwardEvaluationBodyDto,
  DownwardEvaluationDetailResponseDto,
  DownwardEvaluationFilterDto,
  DownwardEvaluationListResponseDto,
  DownwardEvaluationResponseDto,
  ResetDownwardEvaluationResponseDto,
  SubmitDownwardEvaluationDto,
  SubmitDownwardEvaluationQueryDto,
} from '@interface/common/dto/performance-evaluation/downward-evaluation.dto';
import { BulkSubmitDownwardEvaluationQueryDto } from '@interface/common/dto/performance-evaluation/bulk-submit-downward-evaluation-query.dto';

/**
 * 하향평가 관리 컨트롤러
 *
 * 하향평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('C-3. 관리자 - 성과평가 - 하향평가')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/performance-evaluation/downward-evaluations')
export class DownwardEvaluationManagementController {
  private readonly logger = new Logger(
    DownwardEvaluationManagementController.name,
  );

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly downwardEvaluationBusinessService: DownwardEvaluationBusinessService,
  ) {}

  /**
   * 1차 하향평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  @UpsertPrimaryDownwardEvaluation()
  async upsertPrimaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('wbsId') wbsId: string,
    @Body() dto: CreatePrimaryDownwardEvaluationBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DownwardEvaluationResponseDto> {
    const actionBy = user.id;
    const evaluatorId = dto.evaluatorId;

    // 비즈니스 서비스를 통해 평가라인 검증 후 저장
    const evaluationId =
      await this.downwardEvaluationBusinessService.일차_하향평가를_저장한다({
        evaluatorId,
        evaluateeId,
        periodId,
        wbsId,
        selfEvaluationId: dto.selfEvaluationId,
        downwardEvaluationContent: dto.downwardEvaluationContent,
        downwardEvaluationScore: dto.downwardEvaluationScore,
        actionBy,
      });

    return {
      id: evaluationId,
      evaluatorId,
      message: '1차 하향평가가 성공적으로 저장되었습니다.',
    };
  }

  /**
   * 2차 하향평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  @UpsertSecondaryDownwardEvaluation()
  async upsertSecondaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('wbsId') wbsId: string,
    @Body() dto: CreateSecondaryDownwardEvaluationBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DownwardEvaluationResponseDto> {
    const actionBy = user.id;
    const evaluatorId = dto.evaluatorId;

    // 비즈니스 서비스를 통해 평가라인 검증 후 저장
    const evaluationId =
      await this.downwardEvaluationBusinessService.이차_하향평가를_저장한다({
        evaluatorId,
        evaluateeId,
        periodId,
        wbsId,
        selfEvaluationId: dto.selfEvaluationId,
        downwardEvaluationContent: dto.downwardEvaluationContent,
        downwardEvaluationScore: dto.downwardEvaluationScore,
        actionBy,
      });

    return {
      id: evaluationId,
      evaluatorId,
      message: '2차 하향평가가 성공적으로 저장되었습니다.',
    };
  }

  /**
   * 1차 하향평가 제출
   * 해당 평가기간에 발생한 1차 하향평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   */
  @SubmitPrimaryDownwardEvaluation()
  async submitPrimaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('wbsId') wbsId: string,
    @Query() queryDto: SubmitDownwardEvaluationQueryDto,
    @Body() submitDto: SubmitDownwardEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const evaluatorId = submitDto.evaluatorId;
    const submittedBy = user.id;
    const approveAllBelow = queryDto.approveAllBelow || false;

    await this.downwardEvaluationBusinessService.일차_하향평가를_제출하고_재작성요청을_완료한다(
      evaluateeId,
      periodId,
      wbsId,
      evaluatorId,
      submittedBy,
      approveAllBelow,
    );
  }

  /**
   * 2차 하향평가 제출
   * 해당 평가기간에 발생한 2차 하향평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   */
  @SubmitSecondaryDownwardEvaluation()
  async submitSecondaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('wbsId') wbsId: string,
    @Query() queryDto: SubmitDownwardEvaluationQueryDto,
    @Body() submitDto: SubmitDownwardEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const evaluatorId = submitDto.evaluatorId;
    const submittedBy = user.id;
    const approveAllBelow = queryDto.approveAllBelow || false;

    await this.downwardEvaluationBusinessService.이차_하향평가를_제출하고_재작성요청을_완료한다(
      evaluateeId,
      periodId,
      wbsId,
      evaluatorId,
      submittedBy,
      approveAllBelow,
    );
  }

  /**
   * 1차 하향평가 미제출 상태로 변경
   */
  @ResetPrimaryDownwardEvaluation()
  async resetPrimaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('wbsId') wbsId: string,
    @Body() submitDto: SubmitDownwardEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResetDownwardEvaluationResponseDto> {
    const evaluatorId = submitDto.evaluatorId;
    const resetBy = user.id;
    await this.performanceEvaluationService.일차_하향평가를_초기화한다(
      evaluateeId,
      periodId,
      wbsId,
      evaluatorId,
      resetBy,
    );

    return {
      message: '1차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
    };
  }

  /**
   * 2차 하향평가 미제출 상태로 변경
   */
  @ResetSecondaryDownwardEvaluation()
  async resetSecondaryDownwardEvaluation(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('wbsId') wbsId: string,
    @Body() submitDto: SubmitDownwardEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResetDownwardEvaluationResponseDto> {
    const evaluatorId = submitDto.evaluatorId;
    const resetBy = user.id;

    this.logger.log('2차 하향평가 미제출 상태 변경 API 호출', {
      evaluateeId,
      periodId,
      wbsId,
      evaluatorId,
      resetBy,
      userId: user.id,
    });

    try {
      await this.performanceEvaluationService.이차_하향평가를_초기화한다(
        evaluateeId,
        periodId,
        wbsId,
        evaluatorId,
        resetBy,
      );

      this.logger.log('2차 하향평가 미제출 상태 변경 성공', {
        evaluateeId,
        periodId,
        wbsId,
        evaluatorId,
      });

      return {
        message: '2차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
      };
    } catch (error) {
      this.logger.error('2차 하향평가 미제출 상태 변경 실패', error.stack, {
        evaluateeId,
        periodId,
        wbsId,
        evaluatorId,
        resetBy,
        errorName: error.name,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * 하향평가 제출 (ID로 직접)
   */
  @SubmitDownwardEvaluation()
  async submitDownwardEvaluation(
    @ParseUUID('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const submittedBy = user.id;
    await this.performanceEvaluationService.하향평가를_제출한다(
      id,
      submittedBy,
    );
  }

  /**
   * 피평가자의 모든 하향평가 일괄 제출
   */
  @BulkSubmitDownwardEvaluations()
  async bulkSubmitDownwardEvaluations(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @Query() queryDto: BulkSubmitDownwardEvaluationQueryDto,
    @Body() submitDto: SubmitDownwardEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    submittedCount: number;
    skippedCount: number;
    failedCount: number;
    submittedIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    const evaluatorId = submitDto.evaluatorId;
    const submittedBy = user.id;

    return await this.downwardEvaluationBusinessService.피평가자의_모든_하향평가를_일괄_제출한다(
      evaluatorId,
      evaluateeId,
      periodId,
      queryDto.evaluationType,
      submittedBy,
    );
  }

  /**
   * 피평가자의 모든 하향평가 일괄 초기화
   */
  @BulkResetDownwardEvaluations()
  async bulkResetDownwardEvaluations(
    @ParseUUID('evaluateeId') evaluateeId: string,
    @ParseUUID('periodId') periodId: string,
    @Query() queryDto: BulkSubmitDownwardEvaluationQueryDto,
    @Body() submitDto: SubmitDownwardEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    resetCount: number;
    skippedCount: number;
    failedCount: number;
    resetIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    const evaluatorId = submitDto.evaluatorId;
    const resetBy = user.id;

    return await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_초기화한다(
      evaluatorId,
      evaluateeId,
      periodId,
      queryDto.evaluationType,
      resetBy,
    );
  }

  /**
   * 평가자의 하향평가 목록 조회
   */
  @GetEvaluatorDownwardEvaluations()
  async getEvaluatorDownwardEvaluations(
    @ParseUUID('evaluatorId') evaluatorId: string,
    @Query() filter: DownwardEvaluationFilterDto,
  ): Promise<DownwardEvaluationListResponseDto> {
    const query = new GetDownwardEvaluationListQuery(
      evaluatorId,
      filter.evaluateeId,
      filter.periodId,
      filter.wbsId,
      filter.evaluationType,
      filter.isCompleted,
      filter.page || 1,
      filter.limit || 10,
    );
    return await this.performanceEvaluationService.하향평가_목록을_조회한다(
      query,
    );
  }

  /**
   * 하향평가 상세정보 조회
   */
  @GetDownwardEvaluationDetail()
  async getDownwardEvaluationDetail(
    @ParseUUID('id') id: string,
  ): Promise<DownwardEvaluationDetailResponseDto> {
    const query = new GetDownwardEvaluationDetailQuery(id);
    return await this.performanceEvaluationService.하향평가_상세정보를_조회한다(
      query,
    );
  }
}
