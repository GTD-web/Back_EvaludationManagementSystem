import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationLineBusinessService } from '@business/evaluation-line/evaluation-line-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import {
  ConfigureSecondaryEvaluator,
  GetEvaluatorsByPeriod,
} from '@interface/common/decorators/evaluation-criteria/evaluation-line-api.decorators';
import {
  ConfigureEvaluatorResponseDto,
  ConfigureSecondaryEvaluatorDto,
  EvaluatorsByPeriodResponseDto,
  EvaluatorTypeQueryDto,
} from '@interface/common/dto/evaluation-criteria/evaluation-line.dto';
import { Body, Controller, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * 평가라인 관리 컨트롤러
 *
 * 평가라인 구성 및 조회 기능을 제공합니다.
 */
@ApiTags('B-4. 평가자 - 평가 설정 - 평가라인')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/evaluation-criteria/evaluation-lines')
export class EvaluatorEvaluationLineManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly evaluationLineBusinessService: EvaluationLineBusinessService,
  ) {}

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
}
