import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import type { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { CopyPreviousPeriodDataApiDto, CopyPreviousPeriodDataResponseDto, PaginationQueryDto } from '@interface/common/dto/evaluation-period/evaluation-management.dto';
import type { EmployeePeriodAssignmentsResponseDto } from '@interface/common/dto/evaluation-period/employee-period-assignments.dto';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
export declare class UserEvaluationPeriodManagementController {
    private readonly evaluationPeriodManagementService;
    constructor(evaluationPeriodManagementService: EvaluationPeriodManagementContextService);
    getActiveEvaluationPeriods(): Promise<EvaluationPeriodDto[]>;
    getEvaluationPeriods(query: PaginationQueryDto): Promise<{
        items: EvaluationPeriodDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getEvaluationPeriodDetail(periodId: string): Promise<EvaluationPeriodDto | null>;
    getMyPeriodAssignments(periodId: string, user: AuthenticatedUser): Promise<EmployeePeriodAssignmentsResponseDto>;
    copyMyPreviousPeriodData(targetPeriodId: string, sourcePeriodId: string, body: CopyPreviousPeriodDataApiDto, user: AuthenticatedUser): Promise<CopyPreviousPeriodDataResponseDto>;
}
