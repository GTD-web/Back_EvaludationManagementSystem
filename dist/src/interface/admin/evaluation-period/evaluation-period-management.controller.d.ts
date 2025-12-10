import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { EvaluationPeriodBusinessService } from '@business/evaluation-period/evaluation-period-business.service';
import { WbsEvaluationCriteriaService } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service';
import { EvaluationLineService } from '@domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import type { EvaluationPeriodDto } from '../../../domain/core/evaluation-period/evaluation-period.types';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { ChangeEvaluationPeriodPhaseApiDto, CopyPreviousPeriodDataApiDto, CopyPreviousPeriodDataResponseDto, CreateEvaluationPeriodApiDto, ManualPermissionSettingDto, PaginationQueryDto, UpdateDefaultGradeRangesApiDto, UpdateEvaluationPeriodBasicApiDto, UpdateEvaluationPeriodScheduleApiDto, UpdateEvaluationPeriodStartDateApiDto, UpdateEvaluationSetupDeadlineApiDto, UpdateGradeRangesApiDto, UpdateManualSettingPermissionsApiDto, UpdatePeerEvaluationDeadlineApiDto, UpdatePerformanceDeadlineApiDto, UpdateSelfEvaluationDeadlineApiDto } from '@interface/common/dto/evaluation-period/evaluation-management.dto';
import type { GradeRangeResponseDto } from '@interface/common/dto/evaluation-period/evaluation-period-response.dto';
import type { EmployeePeriodAssignmentsResponseDto } from '@interface/common/dto/evaluation-period/employee-period-assignments.dto';
import { SystemSettingService } from '@domain/common/system-setting/system-setting.service';
export declare class EvaluationPeriodManagementController {
    private readonly evaluationPeriodBusinessService;
    private readonly evaluationPeriodManagementService;
    private readonly systemSettingService;
    private readonly wbsEvaluationCriteriaService;
    private readonly evaluationLineService;
    private readonly evaluationLineMappingService;
    private readonly logger;
    constructor(evaluationPeriodBusinessService: EvaluationPeriodBusinessService, evaluationPeriodManagementService: EvaluationPeriodManagementContextService, systemSettingService: SystemSettingService, wbsEvaluationCriteriaService: WbsEvaluationCriteriaService, evaluationLineService: EvaluationLineService, evaluationLineMappingService: EvaluationLineMappingService);
    getDefaultGradeRanges(): Promise<GradeRangeResponseDto[]>;
    updateDefaultGradeRanges(updateData: UpdateDefaultGradeRangesApiDto): Promise<GradeRangeResponseDto[]>;
    getActiveEvaluationPeriods(): Promise<EvaluationPeriodDto[]>;
    getEvaluationPeriods(query: PaginationQueryDto): Promise<{
        items: EvaluationPeriodDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getEvaluationPeriodDetail(periodId: string): Promise<EvaluationPeriodDto | null>;
    getEmployeePeriodAssignments(periodId: string, employeeId: string): Promise<EmployeePeriodAssignmentsResponseDto>;
    getEvaluationPeriodForCopy(periodId: string): Promise<{
        evaluationPeriod: EvaluationPeriodDto | null;
        evaluationCriteria: any[];
        evaluationLines: {
            lines: any[];
            mappings: any[];
        };
    }>;
    createEvaluationPeriod(createData: CreateEvaluationPeriodApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    private 평가항목과_평가라인을_복사한다;
    startEvaluationPeriod(periodId: string, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    completeEvaluationPeriod(periodId: string, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    updateEvaluationPeriodBasicInfo(periodId: string, updateData: UpdateEvaluationPeriodBasicApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updateEvaluationPeriodSchedule(periodId: string, scheduleData: UpdateEvaluationPeriodScheduleApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updateEvaluationPeriodStartDate(periodId: string, startDateData: UpdateEvaluationPeriodStartDateApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updateEvaluationSetupDeadline(periodId: string, deadlineData: UpdateEvaluationSetupDeadlineApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updatePerformanceDeadline(periodId: string, deadlineData: UpdatePerformanceDeadlineApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updateSelfEvaluationDeadline(periodId: string, deadlineData: UpdateSelfEvaluationDeadlineApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updatePeerEvaluationDeadline(periodId: string, deadlineData: UpdatePeerEvaluationDeadlineApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updateEvaluationPeriodGradeRanges(periodId: string, gradeData: UpdateGradeRangesApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updateCriteriaSettingPermission(periodId: string, permissionData: ManualPermissionSettingDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updateSelfEvaluationSettingPermission(periodId: string, permissionData: ManualPermissionSettingDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updateFinalEvaluationSettingPermission(periodId: string, permissionData: ManualPermissionSettingDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    updateManualSettingPermissions(periodId: string, permissionData: UpdateManualSettingPermissionsApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    copyEvaluationPeriod(targetPeriodId: string, sourcePeriodId: string, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    deleteEvaluationPeriod(periodId: string, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    changeEvaluationPeriodPhase(periodId: string, changePhaseDto: ChangeEvaluationPeriodPhaseApiDto, user: AuthenticatedUser): Promise<EvaluationPeriodDto>;
    triggerAutoPhaseTransition(): Promise<{
        success: boolean;
        transitionedCount: number;
        message: string;
    }>;
    copyPreviousPeriodData(targetPeriodId: string, employeeId: string, sourcePeriodId: string, body: CopyPreviousPeriodDataApiDto, user: AuthenticatedUser): Promise<CopyPreviousPeriodDataResponseDto>;
}
