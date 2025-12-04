import { Body, Controller, Query, Logger, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { EvaluationPeriodBusinessService } from '@business/evaluation-period/evaluation-period-business.service';
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
import { ParseId } from '@interface/common/decorators/parse-uuid.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import {
  ChangeEvaluationPeriodPhase,
  CompleteEvaluationPeriod,
  CreateEvaluationPeriod,
  DeleteEvaluationPeriod,
  GetActiveEvaluationPeriods,
  GetDefaultGradeRanges,
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
import { SystemSettingService } from '@domain/common/system-setting/system-setting.service';

/**
 * 관리자용 평가 관리 컨트롤러
 *
 * 평가 기간의 생성, 수정, 삭제, 상태 관리 등 관리자 권한이 필요한
 * 평가 관리 기능을 제공합니다.
 */
@ApiTags('A-2. 평가자 - 평가기간')
@ApiBearerAuth('Bearer')
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
}
