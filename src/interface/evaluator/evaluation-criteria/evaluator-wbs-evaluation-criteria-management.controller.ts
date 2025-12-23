import { EvaluationCriteriaBusinessService } from '@business/evaluation-criteria/evaluation-criteria-business.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import {
  SubmitEvaluationCriteria,
  UpsertWbsEvaluationCriteria,
} from '@interface/common/decorators/evaluation-criteria/wbs-evaluation-criteria-api.decorators';
import {
  EvaluationCriteriaSubmissionResponseDto,
  SubmitEvaluationCriteriaDto,
  UpsertWbsEvaluationCriteriaBodyDto,
  WbsEvaluationCriteriaDto,
} from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';
import { Body, Controller, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * WBS 평가기준 관리 컨트롤러
 *
 * WBS 평가기준 생성, 조회, 수정, 삭제 기능을 제공합니다.
 */
@ApiTags('B-3. 평가자 - 평가 설정 - WBS 평가기준')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/evaluation-criteria/wbs-evaluation-criteria')
export class EvaluatorWbsEvaluationCriteriaManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly evaluationCriteriaBusinessService: EvaluationCriteriaBusinessService,
  ) {}

  /**
   * WBS 평가기준 저장 (Upsert: wbsItemId 기준으로 자동 생성/수정)
   */
  @UpsertWbsEvaluationCriteria()
  async upsertWbsEvaluationCriteria(
    @Param('wbsItemId') wbsItemId: string,
    @Body() dto: UpsertWbsEvaluationCriteriaBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WbsEvaluationCriteriaDto> {
    const actionBy = user.id;
    return await this.evaluationCriteriaManagementService.WBS_평가기준을_저장한다(
      wbsItemId,
      dto.criteria,
      dto.importance,
      dto.subProject,
      dto.isAdditional,
      actionBy,
    );
  }

  /**
   * 평가기준 제출
   * 제출 시 재작성 요청이 존재하고 미응답 상태면 자동으로 완료 처리됩니다.
   */
  @SubmitEvaluationCriteria()
  async submitEvaluationCriteria(
    @Body() dto: SubmitEvaluationCriteriaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationCriteriaSubmissionResponseDto> {
    const submittedBy = user.id;
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
}
