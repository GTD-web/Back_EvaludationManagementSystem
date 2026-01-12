import {
  Controller,
  Body,
  Param,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import { UpdateEvaluationSubmission } from '@interface/common/decorators/evaluation-submission/evaluation-submission-api.decorators';
import { UpdateEvaluationSubmissionDto } from '@interface/common/dto/evaluation-submission/update-evaluation-submission.dto';
import { UpdateEvaluationSubmissionResponseDto } from '@interface/common/dto/evaluation-submission/evaluation-submission-response.dto';
import { EvaluationSubmissionBusinessService } from '@business/evaluation-submission/evaluation-submission-business.service';

/**
 * 평가 제출 관리 컨트롤러
 *
 * 평가기준, 자기평가, 1차평가, 2차평가의 제출 여부를 변경하는 API를 제공합니다.
 */
@ApiTags('A-0-4. 관리자 - 평가 제출 관리')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/evaluation-submission')
export class EvaluationSubmissionController {
  private readonly logger = new Logger(EvaluationSubmissionController.name);

  constructor(
    private readonly evaluationSubmissionBusinessService: EvaluationSubmissionBusinessService,
  ) {}

  /**
   * 평가 제출 여부를 변경한다
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
}
