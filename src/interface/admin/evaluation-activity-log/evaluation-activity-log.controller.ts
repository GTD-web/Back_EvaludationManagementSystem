import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { Roles } from '@interface/common/decorators';
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EvaluationActivityLogListResponseDto } from '@interface/common/dto/evaluation-activity-log/evaluation-activity-log-response.dto';
import { GetEvaluationActivityLogListQueryDto } from '@interface/common/dto/evaluation-activity-log/get-evaluation-activity-log-list-query.dto';

/**
 * 평가 활동 내역 관리 컨트롤러
 * 평가기간 피평가자 기준 활동 내역 조회 기능을 제공합니다.
 */
@ApiTags('A-0-6. 관리자 - 평가 활동 내역')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/evaluation-activity-logs')
export class EvaluationActivityLogController {
  constructor(
    private readonly activityLogContextService: EvaluationActivityLogContextService,
  ) {}

  /**
   * 평가기간 피평가자 기준 활동 내역을 조회한다
   */
  @Get('periods/:periodId/employees/:employeeId')
  @ApiOperation({
    summary: '평가기간 피평가자 기준 활동 내역 조회',
    description:
      '특정 평가기간의 특정 피평가자에 대한 모든 활동 내역을 조회합니다.',
  })
  @ApiParam({
    name: 'periodId',
    description: '평가 기간 ID',
    type: String,
    example: 'period-123',
  })
  @ApiParam({
    name: 'employeeId',
    description: '피평가자 ID',
    type: String,
    example: 'employee-456',
  })
  @ApiResponse({
    status: 200,
    description: '활동 내역 목록 조회 성공',
    type: EvaluationActivityLogListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
  })
  async getEvaluationActivityLogs(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query() query: GetEvaluationActivityLogListQueryDto,
  ): Promise<EvaluationActivityLogListResponseDto> {
    // Swagger UI가 example 값을 자동으로 채워넣을 수 있으므로,
    // 빈 문자열이나 특정 기본값을 undefined로 처리
    const startDateValue =
      query.startDate && query.startDate.trim() !== ''
        ? query.startDate
        : undefined;
    const endDateValue =
      query.endDate && query.endDate.trim() !== '' ? query.endDate : undefined;

    const result =
      await this.activityLogContextService.평가기간_피평가자_활동내역을_조회한다(
        {
          periodId,
          employeeId,
          activityType: query.activityType,
          startDate: startDateValue ? new Date(startDateValue) : undefined,
          endDate: endDateValue ? new Date(endDateValue) : undefined,
          page: query.page || 1,
          limit: query.limit || 20,
        },
      );

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
