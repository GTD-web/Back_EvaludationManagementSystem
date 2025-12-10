import { Body, Controller, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { EvaluationPeriodBusinessService } from '@business/evaluation-period/evaluation-period-business.service';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import type {
  CreateEvaluationPeriodMinimalDto,
  UpdateCriteriaSettingPermissionDto,
  UpdateEvaluationPeriodBasicDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateEvaluationPeriodStartDateDto,
  UpdateEvaluationSetupDeadlineDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateGradeRangesDto,
  UpdateManualSettingPermissionsDto,
  UpdatePeerEvaluationDeadlineDto,
  UpdatePerformanceDeadlineDto,
  UpdateSelfEvaluationDeadlineDto,
  UpdateSelfEvaluationSettingPermissionDto,
} from '@context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import type { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import {
  ParseId,
  ParseUUID,
} from '@interface/common/decorators/parse-uuid.decorator';
import { Roles } from '@interface/common/decorators';
import {
  ChangeEvaluationPeriodPhase,
  CompleteEvaluationPeriod,
  CopyPreviousPeriodData,
  CreateEvaluationPeriod,
  DeleteEvaluationPeriod,
  GetActiveEvaluationPeriods,
  GetDefaultGradeRanges,
  GetEmployeePeriodAssignments,
  GetEvaluationPeriodDetail,
  GetEvaluationPeriods,
  StartEvaluationPeriod,
  UpdateCriteriaSettingPermission,
  UpdateEvaluationPeriodBasicInfo,
  UpdateEvaluationPeriodGradeRanges,
  UpdateEvaluationPeriodSchedule,
  UpdateEvaluationPeriodStartDate,
  UpdateEvaluationSetupDeadline,
  UpdateFinalEvaluationSettingPermission,
  UpdateManualSettingPermissions,
  UpdatePeerEvaluationDeadline,
  UpdatePerformanceDeadline,
  UpdateSelfEvaluationDeadline,
  UpdateSelfEvaluationSettingPermission,
} from '@interface/common/decorators/evaluation-period/evaluation-period-api.decorators';
import {
  ChangeEvaluationPeriodPhaseApiDto,
  CopyPreviousPeriodDataApiDto,
  CopyPreviousPeriodDataResponseDto,
  CreateEvaluationPeriodApiDto,
  ManualPermissionSettingDto,
  PaginationQueryDto,
  UpdateEvaluationPeriodBasicApiDto,
  UpdateEvaluationPeriodScheduleApiDto,
  UpdateEvaluationPeriodStartDateApiDto,
  UpdateEvaluationSetupDeadlineApiDto,
  UpdateGradeRangesApiDto,
  UpdateManualSettingPermissionsApiDto,
  UpdatePeerEvaluationDeadlineApiDto,
  UpdatePerformanceDeadlineApiDto,
  UpdateSelfEvaluationDeadlineApiDto,
} from '@interface/common/dto/evaluation-period/evaluation-management.dto';
import type { GradeRangeResponseDto } from '@interface/common/dto/evaluation-period/evaluation-period-response.dto';
import type { EmployeePeriodAssignmentsResponseDto } from '@interface/common/dto/evaluation-period/employee-period-assignments.dto';
import { SystemSettingService } from '@domain/common/system-setting/system-setting.service';

/**
 * 관리자용 평가 관리 컨트롤러
 *
 * 평가 기간의 생성, 수정, 삭제, 상태 관리 등 관리자 권한이 필요한
 * 평가 관리 기능을 제공합니다.
 */
@ApiTags('A-2. 평가자 - 평가기간')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/evaluation-periods')
export class EvaluatorEvaluationPeriodManagementController {
  constructor(
    private readonly evaluationPeriodBusinessService: EvaluationPeriodBusinessService,
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService,
    private readonly systemSettingService: SystemSettingService,
  ) {}

  // ==================== GET: 조회 ====================

  /**
   * 기본 등급 구간을 조회합니다.
   */
  @GetDefaultGradeRanges()
  async getDefaultGradeRanges(): Promise<GradeRangeResponseDto[]> {
    const gradeRanges = await this.systemSettingService.기본등급구간_조회한다();
    return gradeRanges as unknown as GradeRangeResponseDto[];
  }

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
   * 직원의 평가기간별 할당 정보를 조회합니다.
   */
  @GetEmployeePeriodAssignments()
  async getEmployeePeriodAssignments(
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EmployeePeriodAssignmentsResponseDto> {
    return await this.evaluationPeriodManagementService.직원_평가기간별_할당정보_조회한다(
      periodId,
      employeeId,
    );
  }

  /**
   * 이전 평가기간 데이터를 복사합니다 (지정한 직원).
   */
  @CopyPreviousPeriodData()
  async copyPreviousPeriodData(
    @ParseUUID('targetPeriodId') targetPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('sourcePeriodId') sourcePeriodId: string,
    @Body() body: CopyPreviousPeriodDataApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CopyPreviousPeriodDataResponseDto> {
    const copiedBy = user.id; // 복사 수행자는 현재 로그인한 사용자

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
      copiedWbsAssignments: result.copiedWbsAssignments,
      copiedEvaluationLineMappings: result.copiedEvaluationLineMappings,
      copiedWbsEvaluationCriteria: result.copiedWbsEvaluationCriteria,
    };
  }
}
