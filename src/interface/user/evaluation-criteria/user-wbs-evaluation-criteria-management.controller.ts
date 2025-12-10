import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import { Body, Controller, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpsertWbsEvaluationCriteria } from '@interface/common/decorators/evaluation-criteria/wbs-evaluation-criteria-api.decorators';
import {
  UpsertWbsEvaluationCriteriaBodyDto,
  WbsEvaluationCriteriaDto,
} from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';

/**
 * WBS 평가기준 관리 컨트롤러
 *
 * WBS 평가기준 생성, 조회, 수정, 삭제 기능을 제공합니다.
 */
@ApiTags('A-5. 사용자 - 평가 설정 - WBS 평가기준')
@ApiBearerAuth('Bearer')
@Roles('user')
@Controller('user/evaluation-criteria/wbs-evaluation-criteria')
export class UserWbsEvaluationCriteriaManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
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
      actionBy,
    );
  }
}
