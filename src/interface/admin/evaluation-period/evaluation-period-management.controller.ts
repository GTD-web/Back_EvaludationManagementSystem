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
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { EvaluationLineService } from '@domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
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
import { Roles } from '@interface/common/decorators';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import {
  ChangeEvaluationPeriodPhase,
  CompleteEvaluationPeriod,
  CopyEvaluationPeriod,
  CopyPreviousPeriodData,
  CreateEvaluationPeriod,
  DeleteEvaluationPeriod,
  GetActiveEvaluationPeriods,
  GetDefaultGradeRanges,
  GetEmployeePeriodAssignments,
  GetEvaluationPeriodDetail,
  GetEvaluationPeriodForCopy,
  GetEvaluationPeriods,
  SetApprovalDocumentId,
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
  CopyPreviousPeriodDataApiDto,
  CopyPreviousPeriodDataResponseDto,
  CreateEvaluationPeriodApiDto,
  ManualPermissionSettingDto,
  PaginationQueryDto,
  SetApprovalDocumentIdApiDto,
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
import type { GradeRangeResponseDto } from '@interface/common/dto/evaluation-period/evaluation-period-response.dto';
import type { EmployeePeriodAssignmentsResponseDto } from '@interface/common/dto/evaluation-period/employee-period-assignments.dto';
import { SystemSettingService } from '@domain/common/system-setting/system-setting.service';

/**
 * 관리자용 평가 관리 컨트롤러
 *
 * 평가 기간의 생성, 수정, 삭제, 상태 관리 등 관리자 권한이 필요한
 * 평가 관리 기능을 제공합니다.
 */
@ApiTags('A-2. 관리자 - 평가기간')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/evaluation-periods')
export class EvaluationPeriodManagementController {
  private readonly logger = new Logger(
    EvaluationPeriodManagementController.name,
  );

  constructor(
    private readonly evaluationPeriodBusinessService: EvaluationPeriodBusinessService,
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService, // 조회용
    private readonly systemSettingService: SystemSettingService,
    private readonly wbsEvaluationCriteriaService: WbsEvaluationCriteriaService,
    private readonly evaluationLineService: EvaluationLineService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
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

    // 기본 등급 구간 업데이트 (DB에 저장)
    const updatedRanges =
      await this.systemSettingService.기본등급구간_변경한다(gradeRanges);

    return updatedRanges as unknown as GradeRangeResponseDto[];
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
   * 평가 기간 복제용 데이터를 조회합니다.
   * (평가 기간 기본 정보, 평가항목, 평가라인 포함)
   */
  @GetEvaluationPeriodForCopy()
  async getEvaluationPeriodForCopy(@ParseId() periodId: string): Promise<{
    evaluationPeriod: EvaluationPeriodDto | null;
    evaluationCriteria: any[];
    evaluationLines: {
      lines: any[];
      mappings: any[];
    };
  }> {
    const evaluationPeriod =
      await this.evaluationPeriodManagementService.평가기간상세_조회한다(
        periodId,
      );

    if (!evaluationPeriod) {
      throw new BadRequestException(
        `평가 기간을 찾을 수 없습니다. (ID: ${periodId})`,
      );
    }

    // 평가라인 및 매핑 조회
    const evaluationLines = await this.evaluationLineService.전체_조회한다();
    const evaluationLineMappings =
      await this.evaluationLineMappingService.필터_조회한다({
        evaluationPeriodId: periodId,
      });

    // 평가항목 조회 (평가라인 매핑에서 사용된 WBS 항목들의 평가 기준)
    const wbsItemIds = [
      ...new Set(
        evaluationLineMappings
          .map((m) => m.wbsItemId)
          .filter((id): id is string => id !== null && id !== undefined),
      ),
    ];

    let evaluationCriteria: any[] = [];
    if (wbsItemIds.length > 0) {
      const criteriaPromises = wbsItemIds.map((wbsItemId) =>
        this.wbsEvaluationCriteriaService.WBS항목별_조회한다(wbsItemId),
      );
      const criteriaResults = await Promise.all(criteriaPromises);
      evaluationCriteria = criteriaResults
        .flat()
        .map((c) => c.DTO로_변환한다());
    }

    return {
      evaluationPeriod,
      evaluationCriteria,
      evaluationLines: {
        lines: evaluationLines.map((line) => line.DTO로_변환한다()),
        mappings: evaluationLineMappings.map((mapping) =>
          mapping.DTO로_변환한다(),
        ),
      },
    };
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

    // sourcePeriodId가 있으면 평가항목과 평가라인 복사
    if (createData.sourcePeriodId) {
      await this.평가항목과_평가라인을_복사한다(
        createData.sourcePeriodId,
        result.evaluationPeriod.id,
        createdBy,
      );
    }

    return result.evaluationPeriod;
  }

  /**
   * 원본 평가기간의 평가항목과 평가라인을 새 평가기간으로 복사합니다.
   */
  private async 평가항목과_평가라인을_복사한다(
    sourcePeriodId: string,
    targetPeriodId: string,
    createdBy: string,
  ): Promise<void> {
    this.logger.log(
      `평가항목과 평가라인 복사 시작 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}`,
    );

    try {
      // 1. 원본 평가기간의 평가라인 매핑 조회
      const sourceLineMappings =
        await this.evaluationLineMappingService.필터_조회한다({
          evaluationPeriodId: sourcePeriodId,
        });

      if (sourceLineMappings.length === 0) {
        this.logger.warn(
          `원본 평가기간에 복사할 평가라인이 없습니다: ${sourcePeriodId}`,
        );
        return;
      }

      this.logger.log(
        `${sourceLineMappings.length}개의 평가라인 매핑을 복사합니다`,
      );

      // 2. WBS ID 추출
      const wbsItemIds = [
        ...new Set(
          sourceLineMappings
            .map((m) => m.wbsItemId)
            .filter((id): id is string => id !== null && id !== undefined),
        ),
      ];

      // 3. WBS별 평가 기준 복사
      let criteriaCopyCount = 0;
      let criteriaSkipCount = 0;

      for (const wbsItemId of wbsItemIds) {
        const sourceCriteria =
          await this.wbsEvaluationCriteriaService.WBS항목별_조회한다(wbsItemId);

        if (sourceCriteria.length > 0) {
          this.logger.log(
            `WBS ${wbsItemId}의 ${sourceCriteria.length}개 평가 기준을 복사합니다`,
          );

          // 평가 기준 복사 (동일한 WBS ID로 복사)
          for (const criteria of sourceCriteria) {
            try {
              await this.wbsEvaluationCriteriaService.생성한다({
                wbsItemId: criteria.wbsItemId,
                criteria: criteria.criteria,
                importance: criteria.importance,
              });
              criteriaCopyCount++;
            } catch (error) {
              // 중복 에러는 무시 (이미 존재하는 평가 기준)
              if (error.code === 'DUPLICATE_WBS_EVALUATION_CRITERIA') {
                this.logger.log(
                  `평가 기준 건너뜀 (이미 존재): WBS=${wbsItemId}, criteria="${criteria.criteria}"`,
                );
                criteriaSkipCount++;
              } else {
                // 다른 에러는 재발생
                throw error;
              }
            }
          }
        }
      }

      // 4. 평가라인 매핑 복사
      let mappingCopyCount = 0;
      let mappingSkipCount = 0;

      for (const mapping of sourceLineMappings) {
        try {
          await this.evaluationLineMappingService.생성한다({
            evaluationPeriodId: targetPeriodId, // 새 평가기간 ID
            evaluationLineId: mapping.evaluationLineId,
            employeeId: mapping.employeeId,
            evaluatorId: mapping.evaluatorId,
            wbsItemId: mapping.wbsItemId,
            createdBy,
          });
          mappingCopyCount++;
        } catch (error) {
          // 중복 에러는 무시 (이미 존재하는 매핑)
          if (error.code === 'EVALUATION_LINE_MAPPING_DUPLICATE') {
            this.logger.log(
              `평가라인 매핑 건너뜀 (이미 존재): employee=${mapping.employeeId}, evaluator=${mapping.evaluatorId}`,
            );
            mappingSkipCount++;
          } else {
            // 다른 에러는 재발생
            throw error;
          }
        }
      }

      this.logger.log(
        `평가항목과 평가라인 복사 완료 - WBS 평가기준: ${criteriaCopyCount}개 복사, ${criteriaSkipCount}개 건너뜀, 평가라인 매핑: ${mappingCopyCount}개 복사, ${mappingSkipCount}개 건너뜀`,
      );
    } catch (error) {
      this.logger.error(
        `평가항목과 평가라인 복사 실패 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}`,
        error.stack,
      );
      throw error;
    }
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
    return await this.evaluationPeriodBusinessService.평가기간기본정보_수정한다(
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
   * 결재 문서 ID를 설정합니다.
   */
  @SetApprovalDocumentId()
  async setApprovalDocumentId(
    @ParseId() periodId: string,
    @Body() approvalData: SetApprovalDocumentIdApiDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationPeriodDto> {
    const setBy = user.id;
    return await this.evaluationPeriodManagementService.결재문서ID_설정한다(
      periodId,
      approvalData.approvalDocumentId,
      setBy,
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

    this.logger.log(
      `이전 평가기간 데이터 복사 요청 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}, 직원: ${employeeId}, 수행자: ${copiedBy}`,
    );

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
