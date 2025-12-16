import { EvaluationCriteriaBusinessService } from '@business/evaluation-criteria/evaluation-criteria-business.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import { Body, Controller, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  EvaluationCriteriaSubmissionResponseDto,
  SubmitEvaluationCriteriaDto,
  UpsertWbsEvaluationCriteriaBodyDto,
  WbsEvaluationCriteriaDetailDto,
  WbsEvaluationCriteriaDto,
  WbsEvaluationCriteriaFilterDto,
  WbsEvaluationCriteriaListResponseDto,
  WbsItemEvaluationCriteriaResponseDto,
} from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';
import {
  DeleteWbsEvaluationCriteria,
  DeleteWbsItemEvaluationCriteria,
  GetWbsEvaluationCriteriaDetail,
  GetWbsEvaluationCriteriaList,
  GetWbsItemEvaluationCriteria,
  ResetEvaluationCriteriaSubmission,
  SubmitEvaluationCriteria,
  UpsertWbsEvaluationCriteria,
} from '@interface/common/decorators/evaluation-criteria/wbs-evaluation-criteria-api.decorators';

/**
 * WBS 평가기준 관리 컨트롤러
 *
 * WBS 평가기준 생성, 조회, 수정, 삭제 기능을 제공합니다.
 */
@ApiTags('B-3. 관리자 - 평가 설정 - WBS 평가기준')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/evaluation-criteria/wbs-evaluation-criteria')
export class WbsEvaluationCriteriaManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly evaluationCriteriaBusinessService: EvaluationCriteriaBusinessService,
  ) {}

  /**
   * WBS 평가기준 목록 조회
   */
  @GetWbsEvaluationCriteriaList()
  async getWbsEvaluationCriteriaList(
    @Query() filter: WbsEvaluationCriteriaFilterDto,
  ): Promise<WbsEvaluationCriteriaListResponseDto> {
    return await this.evaluationCriteriaManagementService.WBS_평가기준_목록을_조회한다(
      {
        wbsItemId: filter.wbsItemId,
        criteriaSearch: filter.criteriaSearch,
        criteriaExact: filter.criteriaExact,
      },
    );
  }

  /**
   * WBS 평가기준 상세 조회
   */
  @GetWbsEvaluationCriteriaDetail()
  async getWbsEvaluationCriteriaDetail(
    @Param('id') id: string,
  ): Promise<WbsEvaluationCriteriaDetailDto | null> {
    return await this.evaluationCriteriaManagementService.WBS_평가기준_상세를_조회한다(
      id,
    );
  }

  /**
   * WBS 항목별 평가기준 조회
   */
  @GetWbsItemEvaluationCriteria()
  async getWbsItemEvaluationCriteria(
    @Param('wbsItemId') wbsItemId: string,
  ): Promise<WbsItemEvaluationCriteriaResponseDto> {
    const criteria =
      await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(
        wbsItemId,
      );

    return {
      wbsItemId,
      criteria,
    };
  }

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
      actionBy,
    );
  }

  /**
   * WBS 평가기준 삭제
   */
  @DeleteWbsEvaluationCriteria()
  async deleteWbsEvaluationCriteria(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    const deletedBy = user.id;
    const success =
      await this.evaluationCriteriaManagementService.WBS_평가기준을_삭제한다(
        id,
        deletedBy,
      );
    return { success };
  }

  /**
   * WBS 항목 평가기준 전체 삭제
   */
  @DeleteWbsItemEvaluationCriteria()
  async deleteWbsItemEvaluationCriteria(
    @Param('wbsItemId') wbsItemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    const deletedBy = user.id;
    const success =
      await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
        wbsItemId,
        deletedBy,
      );
    return { success };
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

  /**
   * 평가기준 제출 초기화
   */
  @ResetEvaluationCriteriaSubmission()
  async resetEvaluationCriteriaSubmission(
    @Body() dto: SubmitEvaluationCriteriaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationCriteriaSubmissionResponseDto> {
    const updatedBy = user.id;
    const result =
      await this.evaluationCriteriaManagementService.평가기준_제출을_초기화한다(
        dto.evaluationPeriodId,
        dto.employeeId,
        updatedBy,
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
