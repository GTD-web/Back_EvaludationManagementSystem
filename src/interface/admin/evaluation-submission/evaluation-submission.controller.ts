import {
  Controller,
  Body,
  Param,
  Query,
  BadRequestException,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import {
  UpdateEvaluationSubmission,
  SubmitCriteriaEvaluation,
  SubmitSelfEvaluation,
  SubmitPrimaryDownwardEvaluation,
  SubmitSecondaryDownwardEvaluation,
} from '@interface/common/decorators/evaluation-submission/evaluation-submission-api.decorators';
import { UpdateEvaluationSubmissionDto } from '@interface/common/dto/evaluation-submission/update-evaluation-submission.dto';
import { UpdateEvaluationSubmissionResponseDto } from '@interface/common/dto/evaluation-submission/evaluation-submission-response.dto';
import { EvaluationSubmissionBusinessService } from '@business/evaluation-submission/evaluation-submission-business.service';
import { EvaluationCriteriaBusinessService } from '@business/evaluation-criteria/evaluation-criteria-business.service';
import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import { DownwardEvaluationBusinessService } from '@business/downward-evaluation/downward-evaluation-business.service';
import { SubmitEvaluationCriteriaDto } from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';
import { EvaluationCriteriaSubmissionResponseDto } from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';
import { SubmitDownwardEvaluationDto, SubmitDownwardEvaluationQueryDto } from '@interface/common/dto/performance-evaluation/downward-evaluation.dto';
import { SubmitAllWbsSelfEvaluationsResponseDto } from '@interface/common/dto/performance-evaluation/wbs-self-evaluation.dto';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 평가 제출 관리 컨트롤러
 *
 * 평가기준, 자기평가, 1차평가, 2차평가의 제출 여부를 변경하는 API와 제출 API를 제공합니다.
 * 제출 시 재작성 요청 응답 처리 및 승인 상태 변경이 자동으로 처리됩니다.
 */
@ApiTags('A-0-4. 관리자 - 평가 제출 관리')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/evaluation-submission')
export class EvaluationSubmissionController {
  private readonly logger = new Logger(EvaluationSubmissionController.name);

  constructor(
    private readonly evaluationSubmissionBusinessService: EvaluationSubmissionBusinessService,
    private readonly evaluationCriteriaBusinessService: EvaluationCriteriaBusinessService,
    private readonly wbsSelfEvaluationBusinessService: WbsSelfEvaluationBusinessService,
    private readonly downwardEvaluationBusinessService: DownwardEvaluationBusinessService,
  ) {}

  /**
   * 평가 제출 여부를 변경한다
   * @deprecated 이 엔드포인트는 더 이상 사용되지 않습니다. 대신 각 평가 타입별 제출 엔드포인트를 사용하세요.
   * - 평가기준: POST /admin/evaluation-submission/criteria
   * - 자기평가: POST /admin/evaluation-submission/self-evaluation/:employeeId/:periodId
   * - 1차 하향평가: POST /admin/evaluation-submission/primary-downward/:evaluateeId/:periodId
   * - 2차 하향평가: POST /admin/evaluation-submission/secondary-downward/:evaluateeId/:periodId
   */
  @UpdateEvaluationSubmission()
  async updateEvaluationSubmission(
    @Param('evaluationType') evaluationType: string,
    @Body() dto: UpdateEvaluationSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UpdateEvaluationSubmissionResponseDto> {
    const updatedBy = user.id;

    this.logger.log(
      `평가 제출 여부 변경 요청 - 타입: ${evaluationType}, 직원: ${dto.employeeId}, 평가기간: ${dto.periodId}, 제출여부: ${dto.isSubmitted}`,
    );

    let updatedCount: number;
    let message: string;

    try {
      switch (evaluationType) {
        case 'criteria':
          updatedCount =
            await this.evaluationSubmissionBusinessService.평가기준_제출여부를_변경한다(
              dto.periodId,
              dto.employeeId,
              dto.isSubmitted,
              updatedBy,
            );
          message = `평가기준 제출 여부가 성공적으로 변경되었습니다.`;
          break;

        case 'self-evaluation':
          updatedCount =
            await this.evaluationSubmissionBusinessService.자기평가_제출여부를_변경한다(
              dto.periodId,
              dto.employeeId,
              dto.isSubmitted,
              updatedBy,
            );
          message = `자기평가 제출 여부가 성공적으로 변경되었습니다. (변경된 항목 수: ${updatedCount})`;
          break;

        case 'primary-downward':
          updatedCount =
            await this.evaluationSubmissionBusinessService.일차하향평가_제출여부를_변경한다(
              dto.periodId,
              dto.employeeId,
              dto.isSubmitted,
              updatedBy,
            );
          message = `1차 하향평가 제출 여부가 성공적으로 변경되었습니다. (변경된 항목 수: ${updatedCount})`;
          break;

        case 'secondary-downward':
          if (!dto.evaluatorId) {
            throw new BadRequestException(
              '2차 하향평가의 경우 evaluatorId가 필수입니다.',
            );
          }
          updatedCount =
            await this.evaluationSubmissionBusinessService.이차하향평가_제출여부를_변경한다(
              dto.periodId,
              dto.employeeId,
              dto.evaluatorId,
              dto.isSubmitted,
              updatedBy,
            );
          message = `2차 하향평가 제출 여부가 성공적으로 변경되었습니다. (변경된 항목 수: ${updatedCount})`;
          break;

        default:
          throw new BadRequestException(
            `유효하지 않은 평가 타입입니다: ${evaluationType}. 허용된 값: criteria, self-evaluation, primary-downward, secondary-downward`,
          );
      }

      this.logger.log(
        `평가 제출 여부 변경 완료 - 타입: ${evaluationType}, 변경된 항목 수: ${updatedCount}`,
      );

      return {
        success: true,
        message,
        updatedCount,
      };
    } catch (error) {
      this.logger.error(
        `평가 제출 여부 변경 실패 - 타입: ${evaluationType}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 평가기준 제출
   * 제출 시 재작성 요청이 존재하고 미응답 상태면 자동으로 완료 처리되며, 승인 상태가 자동으로 approved로 변경됩니다.
   */
  @SubmitCriteriaEvaluation()
  async submitCriteriaEvaluation(
    @Body() dto: SubmitEvaluationCriteriaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationCriteriaSubmissionResponseDto> {
    const submittedBy = user.id;
    this.logger.log(
      `평가기준 제출 요청 - 직원: ${dto.employeeId}, 평가기간: ${dto.evaluationPeriodId}`,
    );

    const result =
      await this.evaluationCriteriaBusinessService.평가기준을_제출하고_재작성요청을_완료한다(
        dto.evaluationPeriodId,
        dto.employeeId,
        submittedBy,
      );

    return {
      id: result.id,
      evaluationPeriodId: result.evaluationPeriodId,
      employeeId: result.employeeId,
      isCriteriaSubmitted: result.isCriteriaSubmitted,
      criteriaSubmittedAt: result.criteriaSubmittedAt,
      criteriaSubmittedBy: result.criteriaSubmittedBy,
    };
  }

  /**
   * 자기평가 제출
   * 제출 시 재작성 요청이 존재하고 미응답 상태면 자동으로 완료 처리되며, 승인 상태가 자동으로 approved로 변경됩니다.
   */
  @SubmitSelfEvaluation()
  async submitSelfEvaluation(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubmitAllWbsSelfEvaluationsResponseDto> {
    const submittedBy = user.id;
    this.logger.log(
      `자기평가 제출 요청 - 직원: ${employeeId}, 평가기간: ${periodId}`,
    );

    return await this.wbsSelfEvaluationBusinessService.직원의_전체_WBS자기평가를_제출하고_재작성요청을_완료한다(
      employeeId,
      periodId,
      submittedBy,
    );
  }

  /**
   * 1차 하향평가 제출 (평가자별 일괄)
   * 제출 시 재작성 요청이 존재하고 미응답 상태면 자동으로 완료 처리되며, 승인 상태가 자동으로 approved로 변경됩니다.
   */
  @SubmitPrimaryDownwardEvaluation()
  async submitPrimaryDownwardEvaluation(
    @Param('evaluateeId', ParseUUIDPipe) evaluateeId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Query() queryDto: SubmitDownwardEvaluationQueryDto,
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
    const approveAllBelow = queryDto.approveAllBelow ?? false;

    this.logger.log(
      `1차 하향평가 일괄 제출 요청 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}, 하위승인: ${approveAllBelow}`,
    );

    return await this.downwardEvaluationBusinessService.피평가자의_모든_하향평가를_일괄_제출한다(
      evaluatorId,
      evaluateeId,
      periodId,
      DownwardEvaluationType.PRIMARY,
      submittedBy,
      approveAllBelow,
    );
  }

  /**
   * 2차 하향평가 제출 (평가자별 일괄)
   * 제출 시 재작성 요청이 존재하고 미응답 상태면 자동으로 완료 처리되며, 승인 상태가 자동으로 approved로 변경됩니다.
   */
  @SubmitSecondaryDownwardEvaluation()
  async submitSecondaryDownwardEvaluation(
    @Param('evaluateeId', ParseUUIDPipe) evaluateeId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Query() queryDto: SubmitDownwardEvaluationQueryDto,
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
    const approveAllBelow = queryDto.approveAllBelow ?? false;

    this.logger.log(
      `2차 하향평가 일괄 제출 요청 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}, 하위승인: ${approveAllBelow}`,
    );

    return await this.downwardEvaluationBusinessService.피평가자의_모든_하향평가를_일괄_제출한다(
      evaluatorId,
      evaluateeId,
      periodId,
      DownwardEvaluationType.SECONDARY,
      submittedBy,
      approveAllBelow,
    );
  }
}
