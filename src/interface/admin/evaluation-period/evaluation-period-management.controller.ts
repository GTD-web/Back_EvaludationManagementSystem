import {
  BadRequestException,
  Body,
  Controller,
  Query,
  Logger,
  Post,
} from '@nestjs/common';
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
import type { EvaluationPeriodDto } from '../../../domain/core/evaluation-period/evaluation-period.types';
import {
  ParseId,
  ParseUUID,
} from '@interface/common/decorators/parse-uuid.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import {
  ChangeEvaluationPeriodPhase,
  CompleteEvaluationPeriod,
  CopyEvaluationPeriod,
  CreateEvaluationPeriod,
  DeleteEvaluationPeriod,
  GetActiveEvaluationPeriods,
  GetDefaultGradeRanges,
  GetEvaluationPeriodDetail,
  GetEvaluationPeriods,
  StartEvaluationPeriod,
  UpdateCriteriaSettingPermission,
  UpdateDefaultGradeRanges,
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
  UpdateDefaultGradeRangesApiDto,
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
import {
  getDefaultGradeRanges,
  setDefaultGradeRanges,
} from '@interface/common/dto/evaluation-period/grade-ranges.store';
import type { GradeRangeResponseDto } from '@interface/common/dto/evaluation-period/evaluation-period-response.dto';

/**
 * 관리자용 평가 관리 컨트롤러
 *
 * 평가 기간의 생성, 수정, 삭제, 상태 관리 등 관리자 권한이 필요한
 * 평가 관리 기능을 제공합니다.
 */
@ApiTags('A-2. 관리자 - 평가기간')
@ApiBearerAuth('Bearer')
@Controller('admin/evaluation-periods')
export class EvaluationPeriodManagementController {
  private readonly logger = new Logger(
    EvaluationPeriodManagementController.name,
  );

  constructor(
    private readonly evaluationPeriodBusinessService: EvaluationPeriodBusinessService,
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService, // 조회용
  ) {}

  // ==================== GET: 조회 ====================

  /**
   * 기본 등급 구간을 조회합니다.
   */
  @GetDefaultGradeRanges()
  async getDefaultGradeRanges(): Promise<GradeRangeResponseDto[]> {
    return getDefaultGradeRanges() as unknown as GradeRangeResponseDto[];
  }

  /**
   * 기본 등급 구간을 변경합니다.
   */
  @UpdateDefaultGradeRanges()
  async updateDefaultGradeRanges(
    @Body() updateData: UpdateDefaultGradeRangesApiDto,
  ): Promise<GradeRangeResponseDto[]> {
    // 등급 구간 유효성 검증
    const gradeRanges = updateData.gradeRanges.map((range) => ({
      grade: range.grade,
      minRange: range.minRange,
      maxRange: range.maxRange,
    }));

    // 중복 등급 검증
    const grades = gradeRanges.map((r) => r.grade);
    const uniqueGrades = new Set(grades);
    if (grades.length !== uniqueGrades.size) {
      throw new BadRequestException('중복된 등급이 있습니다.');
    }

    // 범위 검증 (0-1000)
    for (const range of gradeRanges) {
      if (range.minRange < 0 || range.minRange > 1000) {
        throw new BadRequestException('최소 범위는 0-1000 사이여야 합니다.');
      }
      if (range.maxRange < 0 || range.maxRange > 1000) {
        throw new BadRequestException('최대 범위는 0-1000 사이여야 합니다.');
      }
      if (range.minRange >= range.maxRange) {
        throw new BadRequestException(
          '최소 범위는 최대 범위보다 작아야 합니다.',
        );
      }
    }

    // 범위 겹침 검증
    const sortedRanges = [...gradeRanges].sort(
      (a, b) => a.minRange - b.minRange,
    );
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      const current = sortedRanges[i];
      const next = sortedRanges[i + 1];
      if (current.maxRange > next.minRange) {
        throw new BadRequestException('등급 구간이 겹칩니다.');
      }
    }

    // 기본 등급 구간 업데이트
    setDefaultGradeRanges(gradeRanges);

    return getDefaultGradeRanges() as unknown as GradeRangeResponseDto[];
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

  // ==================== POST: 생성 및 상태 변경 ====================

  /**
   * 새로운 평가 기간을 생성합니다.
   */
  @CreateEvaluationPeriod()
  async createEvaluationPeriod(
    @Body() createData: CreateEvaluationPeriodApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const createdBy = user.id;
    const contextDto: CreateEvaluationPeriodMinimalDto = {
      name: createData.name,
      startDate: createData.startDate as unknown as Date,
      peerEvaluationDeadline:
        createData.peerEvaluationDeadline as unknown as Date,
      description: createData.description,
      maxSelfEvaluationRate: createData.maxSelfEvaluationRate || 120,
      gradeRanges:
        createData.gradeRanges?.map((range) => ({
          grade: range.grade,
          minRange: range.minRange,
          maxRange: range.maxRange,
        })) || [],
    };
    const result =
      await this.evaluationPeriodBusinessService.평가기간을_생성한다(
        contextDto,
        createdBy,
      );
    return result.evaluationPeriod;
  }

  /**
   * 평가 기간을 시작합니다.
   */
  @StartEvaluationPeriod()
  async startEvaluationPeriod(
    @ParseId() periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    const startedBy = user.id;
    const result =
      await this.evaluationPeriodManagementService.평가기간_시작한다(
        periodId,
        startedBy,
      );

    // NestJS boolean 직렬화 문제 해결을 위해 객체로 래핑
    return { success: Boolean(result) };
  }

  /**
   * 평가 기간을 완료합니다.
   */
  @CompleteEvaluationPeriod()
  async completeEvaluationPeriod(
    @ParseId() periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    const completedBy = user.id;
    const result =
      await this.evaluationPeriodManagementService.평가기간_완료한다(
        periodId,
        completedBy,
      );

    // NestJS boolean 직렬화 문제 해결을 위해 객체로 래핑
    return { success: Boolean(result) };
  }

  // ==================== PATCH: 부분 수정 ====================

  /**
   * 평가 기간 기본 정보를 수정합니다.
   */
  @UpdateEvaluationPeriodBasicInfo()
  async updateEvaluationPeriodBasicInfo(
    @ParseId() periodId: string,
    @Body() updateData: UpdateEvaluationPeriodBasicApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = user.id;
    const contextDto: UpdateEvaluationPeriodBasicDto = {
      name: updateData.name,
      description: updateData.description,
      maxSelfEvaluationRate: updateData.maxSelfEvaluationRate,
    };
    return await this.evaluationPeriodManagementService.평가기간기본정보_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가 기간 일정을 수정합니다.
   */
  @UpdateEvaluationPeriodSchedule()
  async updateEvaluationPeriodSchedule(
    @ParseId() periodId: string,
    @Body() scheduleData: UpdateEvaluationPeriodScheduleApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = user.id;
    const contextDto: UpdateEvaluationPeriodScheduleDto = {
      startDate: scheduleData.startDate as unknown as Date,
      evaluationSetupDeadline:
        scheduleData.evaluationSetupDeadline as unknown as Date,
      performanceDeadline: scheduleData.performanceDeadline as unknown as Date,
      selfEvaluationDeadline:
        scheduleData.selfEvaluationDeadline as unknown as Date,
      peerEvaluationDeadline:
        scheduleData.peerEvaluationDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.평가기간일정_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가 기간 시작일을 수정합니다.
   */
  @UpdateEvaluationPeriodStartDate()
  async updateEvaluationPeriodStartDate(
    @ParseId() periodId: string,
    @Body() startDateData: UpdateEvaluationPeriodStartDateApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = user.id;
    const contextDto: UpdateEvaluationPeriodStartDateDto = {
      startDate: startDateData.startDate as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.평가기간시작일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가설정 단계 마감일을 수정합니다.
   */
  @UpdateEvaluationSetupDeadline()
  async updateEvaluationSetupDeadline(
    @ParseId() periodId: string,
    @Body() deadlineData: UpdateEvaluationSetupDeadlineApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = user.id;
    const contextDto: UpdateEvaluationSetupDeadlineDto = {
      evaluationSetupDeadline:
        deadlineData.evaluationSetupDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.평가설정단계마감일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 업무 수행 단계 마감일을 수정합니다.
   */
  @UpdatePerformanceDeadline()
  async updatePerformanceDeadline(
    @ParseId() periodId: string,
    @Body() deadlineData: UpdatePerformanceDeadlineApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = user.id;
    const contextDto: UpdatePerformanceDeadlineDto = {
      performanceDeadline: deadlineData.performanceDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.업무수행단계마감일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 자기 평가 단계 마감일을 수정합니다.
   */
  @UpdateSelfEvaluationDeadline()
  async updateSelfEvaluationDeadline(
    @ParseId() periodId: string,
    @Body() deadlineData: UpdateSelfEvaluationDeadlineApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = user.id;
    const contextDto: UpdateSelfEvaluationDeadlineDto = {
      selfEvaluationDeadline:
        deadlineData.selfEvaluationDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.자기평가단계마감일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 하향/동료평가 단계 마감일을 수정합니다.
   */
  @UpdatePeerEvaluationDeadline()
  async updatePeerEvaluationDeadline(
    @ParseId() periodId: string,
    @Body() deadlineData: UpdatePeerEvaluationDeadlineApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = user.id;
    const contextDto: UpdatePeerEvaluationDeadlineDto = {
      peerEvaluationDeadline:
        deadlineData.peerEvaluationDeadline as unknown as Date,
    };
    return await this.evaluationPeriodManagementService.하향동료평가단계마감일_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가 기간 등급 구간을 수정합니다.
   */
  @UpdateEvaluationPeriodGradeRanges()
  async updateEvaluationPeriodGradeRanges(
    @ParseId() periodId: string,
    @Body() gradeData: UpdateGradeRangesApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = user.id;
    const contextDto: UpdateGradeRangesDto = {
      gradeRanges: gradeData.gradeRanges.map((range) => ({
        grade: range.grade,
        minRange: range.minRange,
        maxRange: range.maxRange,
      })),
    };
    return await this.evaluationPeriodManagementService.평가기간등급구간_수정한다(
      periodId,
      contextDto,
      updatedBy,
    );
  }

  /**
   * 평가 기준 설정 수동 허용을 변경합니다.
   */
  @UpdateCriteriaSettingPermission()
  async updateCriteriaSettingPermission(
    @ParseId() periodId: string,
    @Body() permissionData: ManualPermissionSettingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const changedBy = user.id;
    const contextDto: UpdateCriteriaSettingPermissionDto = {
      enabled: permissionData.allowManualSetting,
    };
    return await this.evaluationPeriodManagementService.평가기준설정수동허용_변경한다(
      periodId,
      contextDto,
      changedBy,
    );
  }

  /**
   * 자기 평가 설정 수동 허용을 변경합니다.
   */
  @UpdateSelfEvaluationSettingPermission()
  async updateSelfEvaluationSettingPermission(
    @ParseId() periodId: string,
    @Body() permissionData: ManualPermissionSettingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const changedBy = user.id;
    const contextDto: UpdateSelfEvaluationSettingPermissionDto = {
      enabled: permissionData.allowManualSetting,
    };
    return await this.evaluationPeriodManagementService.자기평가설정수동허용_변경한다(
      periodId,
      contextDto,
      changedBy,
    );
  }

  /**
   * 최종 평가 설정 수동 허용을 변경합니다.
   */
  @UpdateFinalEvaluationSettingPermission()
  async updateFinalEvaluationSettingPermission(
    @ParseId() periodId: string,
    @Body() permissionData: ManualPermissionSettingDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const changedBy = user.id;
    const contextDto: UpdateFinalEvaluationSettingPermissionDto = {
      enabled: permissionData.allowManualSetting,
    };
    return await this.evaluationPeriodManagementService.최종평가설정수동허용_변경한다(
      periodId,
      contextDto,
      changedBy,
    );
  }

  /**
   * 전체 수동 허용 설정을 변경합니다.
   */
  @UpdateManualSettingPermissions()
  async updateManualSettingPermissions(
    @ParseId() periodId: string,
    @Body() permissionData: UpdateManualSettingPermissionsApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const changedBy = user.id;
    const contextDto: UpdateManualSettingPermissionsDto = {
      criteriaSettingEnabled: permissionData.allowCriteriaManualSetting,
      selfEvaluationSettingEnabled:
        permissionData.allowSelfEvaluationManualSetting,
      finalEvaluationSettingEnabled:
        permissionData.allowFinalEvaluationManualSetting,
    };
    return await this.evaluationPeriodManagementService.전체수동허용설정_변경한다(
      periodId,
      contextDto,
      changedBy,
    );
  }

  /**
   * 평가 기간 설정을 복제합니다.
   */
  @CopyEvaluationPeriod()
  async copyEvaluationPeriod(
    @ParseUUID('targetId') targetPeriodId: string,
    @ParseUUID('sourceId') sourcePeriodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const updatedBy = user.id;
    return await this.evaluationPeriodManagementService.평가기간_복제한다(
      targetPeriodId,
      sourcePeriodId,
      updatedBy,
    );
  }

  // ==================== DELETE: 삭제 ====================

  /**
   * 평가 기간을 삭제합니다.
   */
  @DeleteEvaluationPeriod()
  async deleteEvaluationPeriod(
    @ParseId() periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    const deletedBy = user.id;
    const result =
      await this.evaluationPeriodManagementService.평가기간_삭제한다(
        periodId,
        deletedBy,
      );
    return { success: result };
  }

  /**
   * 평가기간 단계를 변경합니다.
   */
  @ChangeEvaluationPeriodPhase()
  async changeEvaluationPeriodPhase(
    @ParseId() periodId: string,
    @Body() changePhaseDto: ChangeEvaluationPeriodPhaseApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const changedBy = user.id;
    const targetPhase = changePhaseDto.targetPhase as any; // 타입 변환

    const result = await this.evaluationPeriodBusinessService.단계_변경한다(
      periodId,
      targetPhase,
      changedBy,
    );

    return result;
  }

  /**
   * 자동 단계 전이를 수동으로 트리거합니다.
   */
  @Post('auto-phase-transition')
  async triggerAutoPhaseTransition(): Promise<{
    success: boolean;
    transitionedCount: number;
    message: string;
  }> {
    const result =
      await this.evaluationPeriodBusinessService.자동_단계_전이를_실행한다();

    return {
      success: true,
      transitionedCount: result,
      message: `${result}개의 평가기간이 자동 단계 전이되었습니다.`,
    };
  }
}
