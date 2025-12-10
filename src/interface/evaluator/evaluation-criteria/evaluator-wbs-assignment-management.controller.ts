import { WbsAssignmentBusinessService } from '@business/wbs-assignment/wbs-assignment-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import {
  CancelWbsAssignmentByWbs,
  ChangeWbsAssignmentOrderByWbs,
  CreateAndAssignWbs,
  UpdateWbsItemTitle,
} from '@interface/common/decorators/evaluation-criteria/wbs-assignment-api.decorators';
import {
  CancelWbsAssignmentByWbsDto,
  ChangeWbsAssignmentOrderByWbsDto,
  CreateAndAssignWbsDto,
  UpdateWbsItemTitleDto,
} from '@interface/common/dto/evaluation-criteria/wbs-assignment.dto';
import { Body, Controller, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * WBS 할당 관리 컨트롤러
 *
 * 평가기간에 직원을 WBS 항목에 할당하는 기능을 제공합니다.
 */
@ApiTags('B-2. 평가자 - 평가 설정 - WBS 할당')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/evaluation-criteria/wbs-assignments')
export class EvaluatorWbsAssignmentManagementController {
  constructor(
    private readonly wbsAssignmentBusinessService: WbsAssignmentBusinessService,
  ) {}

  /**
   * WBS 할당 취소 (WBS ID 기반)
   */
  @CancelWbsAssignmentByWbs()
  async cancelWbsAssignmentByWbs(
    @Param('wbsItemId', ParseUUIDPipe) wbsItemId: string,
    @Body() bodyDto: CancelWbsAssignmentByWbsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const cancelledBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS_할당을_WBS_ID로_취소한다(
      {
        employeeId: bodyDto.employeeId,
        wbsItemId: wbsItemId,
        projectId: bodyDto.projectId,
        periodId: bodyDto.periodId,
        cancelledBy,
      },
    );
  }

  /**
   * WBS 할당 순서 변경 (WBS ID 기반)
   */
  @ChangeWbsAssignmentOrderByWbs()
  async changeWbsAssignmentOrderByWbs(
    @Param('wbsItemId', ParseUUIDPipe) wbsItemId: string,
    @Body() bodyDto: ChangeWbsAssignmentOrderByWbsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const updatedBy = user.id;
    // URL 파라미터의 wbsItemId를 사용 (bodyDto의 wbsItemId는 무시)
    return await this.wbsAssignmentBusinessService.WBS_할당_순서를_WBS_ID로_변경한다(
      {
        employeeId: bodyDto.employeeId,
        wbsItemId: wbsItemId, // URL 파라미터 사용
        projectId: bodyDto.projectId,
        periodId: bodyDto.periodId,
        direction: bodyDto.direction,
        updatedBy,
      },
    );
  }

  /**
   * WBS 생성하면서 할당
   */
  @CreateAndAssignWbs()
  async createAndAssignWbs(
    @Body() createDto: CreateAndAssignWbsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const createdBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS를_생성하고_할당한다({
      title: createDto.title,
      projectId: createDto.projectId,
      employeeId: createDto.employeeId,
      periodId: createDto.periodId,
      createdBy: createdBy,
    });
  }

  /**
   * WBS 항목 이름 수정
   */
  @UpdateWbsItemTitle()
  async updateWbsItemTitle(
    @Param('wbsItemId', ParseUUIDPipe) wbsItemId: string,
    @Body() updateDto: UpdateWbsItemTitleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const updatedBy = user.id;
    return await this.wbsAssignmentBusinessService.WBS_항목_이름을_수정한다({
      wbsItemId: wbsItemId,
      title: updateDto.title,
      updatedBy: updatedBy,
    });
  }
}
