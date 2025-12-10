import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationLineBusinessService } from '@business/evaluation-line/evaluation-line-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import { Body, Controller, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BatchConfigurePrimaryEvaluatorDto,
  BatchConfigurePrimaryEvaluatorResponseDto,
  BatchConfigureSecondaryEvaluatorDto,
  BatchConfigureSecondaryEvaluatorResponseDto,
  ConfigureEvaluatorResponseDto,
  ConfigurePrimaryEvaluatorDto,
  ConfigureSecondaryEvaluatorDto,
  EmployeeEvaluationSettingsResponseDto,
  EvaluatorEmployeesResponseDto,
  EvaluatorsByPeriodResponseDto,
  EvaluatorTypeQueryDto,
} from '@interface/common/dto/evaluation-criteria/evaluation-line.dto';
import {
  BatchConfigurePrimaryEvaluator,
  BatchConfigureSecondaryEvaluator,
  ConfigurePrimaryEvaluator,
  ConfigureSecondaryEvaluator,
  GetEmployeeEvaluationSettings,
  GetEvaluatorEmployees,
  GetEvaluatorsByPeriod,
} from '@interface/common/decorators/evaluation-criteria/evaluation-line-api.decorators';

/**
 * 평가라인 관리 컨트롤러
 *
 * 평가라인 구성 및 조회 기능을 제공합니다.
 */
@ApiTags('B-4. 관리자 - 평가 설정 - 평가라인')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/evaluation-criteria/evaluation-lines')
export class EvaluationLineManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly evaluationLineBusinessService: EvaluationLineBusinessService,
  ) {}

  /**
   * 평가자별 피평가자 조회
   */
  @GetEvaluatorEmployees()
  async getEvaluatorEmployees(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Param('evaluatorId', ParseUUIDPipe) evaluatorId: string,
  ): Promise<EvaluatorEmployeesResponseDto> {
    return await this.evaluationCriteriaManagementService.특정_평가자가_평가해야_하는_피평가자_목록을_조회한다(
      periodId,
      evaluatorId,
    );
  }

  /**
   * 직원 평가설정 통합 조회
   */
  @GetEmployeeEvaluationSettings()
  async getEmployeeEvaluationSettings(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ): Promise<EmployeeEvaluationSettingsResponseDto> {
    const settings =
      await this.evaluationCriteriaManagementService.특정_평가기간에_직원의_평가설정을_통합_조회한다(
        employeeId,
        periodId,
      );

    return {
      employeeId,
      periodId,
      ...settings,
    };
  }

  /**
   * 1차 평가자 구성 (직원별 고정 담당자)
   */
  @ConfigurePrimaryEvaluator()
  async configurePrimaryEvaluator(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Body() dto: ConfigurePrimaryEvaluatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConfigureEvaluatorResponseDto> {
    return await this.evaluationLineBusinessService.일차_평가자를_구성한다(
      employeeId,
      periodId,
      dto.evaluatorId,
      user.id,
    );
  }

  /**
   * 2차 평가자 구성
   */
  @ConfigureSecondaryEvaluator()
  async configureSecondaryEvaluator(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('wbsItemId', ParseUUIDPipe) wbsItemId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Body() dto: ConfigureSecondaryEvaluatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConfigureEvaluatorResponseDto> {
    return await this.evaluationLineBusinessService.이차_평가자를_구성한다(
      employeeId,
      wbsItemId,
      periodId,
      dto.evaluatorId,
      user.id,
    );
  }

  /**
   * 평가기간별 평가자 목록 조회
   */
  @GetEvaluatorsByPeriod()
  async getEvaluatorsByPeriod(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Query() query: EvaluatorTypeQueryDto,
  ): Promise<EvaluatorsByPeriodResponseDto> {
    const type = query.type || 'all';
    return await this.evaluationCriteriaManagementService.평가기간의_평가자_목록을_조회한다(
      periodId,
      type,
    );
  }

  /**
   * 여러 피평가자의 1차 평가자 일괄 구성
   */
  @BatchConfigurePrimaryEvaluator()
  async batchConfigurePrimaryEvaluator(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Body() dto: BatchConfigurePrimaryEvaluatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BatchConfigurePrimaryEvaluatorResponseDto> {
    return await this.evaluationLineBusinessService.여러_피평가자의_일차_평가자를_일괄_구성한다(
      periodId,
      dto.assignments,
      user.id,
    );
  }

  /**
   * 여러 피평가자의 2차 평가자 일괄 구성
   */
  @BatchConfigureSecondaryEvaluator()
  async batchConfigureSecondaryEvaluator(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Body() dto: BatchConfigureSecondaryEvaluatorDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BatchConfigureSecondaryEvaluatorResponseDto> {
    return await this.evaluationLineBusinessService.여러_피평가자의_이차_평가자를_일괄_구성한다(
      periodId,
      dto.assignments,
      user.id,
    );
  }
}
