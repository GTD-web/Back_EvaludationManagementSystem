import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import {
  ParseId,
  ParseUUID,
} from '@interface/common/decorators/parse-uuid.decorator';
import { Body, Controller, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import {
  CopyPreviousPeriodData,
  GetActiveEvaluationPeriods,
  GetEvaluationPeriodDetail,
  GetEvaluationPeriods,
  GetMyPeriodAssignments,
} from '@interface/common/decorators/evaluation-period/evaluation-period-api.decorators';
import {
  CopyPreviousPeriodDataApiDto,
  CopyPreviousPeriodDataResponseDto,
  PaginationQueryDto,
} from '@interface/common/dto/evaluation-period/evaluation-management.dto';
import type { EmployeePeriodAssignmentsResponseDto } from '@interface/common/dto/evaluation-period/employee-period-assignments.dto';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';

/**
 * 사용자용 평가 관리 컨트롤러
 *
 * 평가 기간의 생성, 수정, 삭제, 상태 관리 등 사용자 권한이 필요한
 * 평가 관리 기능을 제공합니다.
 */
@ApiTags('A-2. 사용자 - 평가기간')
@ApiBearerAuth('Bearer')
@Controller('user/evaluation-periods')
export class UserEvaluationPeriodManagementController {
  constructor(
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService, // 조회용
  ) {}

  // ==================== GET: 조회 ====================

  /**
   * 활성화된 평가 기간 목록을 조회합니다.
   */
  @GetActiveEvaluationPeriods()
  async getActiveEvaluationPeriods(): Promise<EvaluationPeriodDto[]> {
    return await this.evaluationPeriodManagementService.활성평가기간_조회한다();
  }

  /**
   * 평가 기간 목록을 페이징으로 조회합니다.
   */
  @GetEvaluationPeriods()
  async getEvaluationPeriods(@Query() query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;
    return await this.evaluationPeriodManagementService.평가기간목록_조회한다(
      page,
      limit,
    );
  }

  /**
   * 평가 기간 상세 정보를 조회합니다.
   */
  @GetEvaluationPeriodDetail()
  async getEvaluationPeriodDetail(
    @ParseId() periodId: string,
  ): Promise<EvaluationPeriodDto | null> {
    return await this.evaluationPeriodManagementService.평가기간상세_조회한다(
      periodId,
    );
  }

  /**
   * 내 평가기간별 할당 정보를 조회합니다.
   */
  @GetMyPeriodAssignments()
  async getMyPeriodAssignments(
    @ParseUUID('periodId') periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeePeriodAssignmentsResponseDto> {
    const employeeId = user.id; // JWT에서 현재 사용자 ID 추출
    return await this.evaluationPeriodManagementService.직원_평가기간별_할당정보_조회한다(
      periodId,
      employeeId,
    );
  }

  /**
   * 내 이전 평가기간 데이터를 복사합니다.
   */
  @CopyPreviousPeriodData()
  async copyMyPreviousPeriodData(
    @ParseUUID('targetPeriodId') targetPeriodId: string,
    @ParseUUID('sourcePeriodId') sourcePeriodId: string,
    @Body() body: CopyPreviousPeriodDataApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CopyPreviousPeriodDataResponseDto> {
    const employeeId = user.id; // JWT에서 현재 사용자 ID 추출
    const copiedBy = user.id;

    const result =
      await this.evaluationPeriodManagementService.이전_평가기간_데이터를_복사한다(
        targetPeriodId,
        sourcePeriodId,
        employeeId,
        copiedBy,
        body.projects,
      );

    return {
      success: true,
      message: '이전 평가기간 데이터를 성공적으로 복사했습니다.',
      copiedProjectAssignments: result.copiedProjectAssignments,
      copiedEvaluationLineMappings: result.copiedEvaluationLineMappings,
    };
  }
}
