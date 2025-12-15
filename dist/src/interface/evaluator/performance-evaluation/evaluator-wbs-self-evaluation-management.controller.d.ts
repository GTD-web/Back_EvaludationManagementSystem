import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { ClearAllWbsSelfEvaluationsResponseDto, ClearWbsSelfEvaluationsByProjectResponseDto, CreateWbsSelfEvaluationBodyDto, ResetAllWbsSelfEvaluationsResponseDto, ResetWbsSelfEvaluationsByProjectResponseDto, SubmitAllWbsSelfEvaluationsResponseDto, SubmitWbsSelfEvaluationsByProjectResponseDto, WbsSelfEvaluationResponseDto } from '@interface/common/dto/performance-evaluation/wbs-self-evaluation.dto';
export declare class EvaluatorWbsSelfEvaluationManagementController {
    private readonly performanceEvaluationService;
    private readonly wbsSelfEvaluationBusinessService;
    constructor(performanceEvaluationService: PerformanceEvaluationService, wbsSelfEvaluationBusinessService: WbsSelfEvaluationBusinessService);
    upsertWbsSelfEvaluation(employeeId: string, wbsItemId: string, periodId: string, dto: CreateWbsSelfEvaluationBodyDto, user: AuthenticatedUser): Promise<WbsSelfEvaluationResponseDto>;
    submitAllWbsSelfEvaluationsByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<SubmitAllWbsSelfEvaluationsResponseDto>;
    submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<SubmitAllWbsSelfEvaluationsResponseDto>;
    submitWbsSelfEvaluationsByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<SubmitWbsSelfEvaluationsByProjectResponseDto>;
    submitWbsSelfEvaluationsToEvaluatorByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<SubmitWbsSelfEvaluationsByProjectResponseDto>;
    resetAllWbsSelfEvaluationsByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<ResetAllWbsSelfEvaluationsResponseDto>;
    resetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<ResetAllWbsSelfEvaluationsResponseDto>;
    resetWbsSelfEvaluationsToEvaluatorByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<ResetWbsSelfEvaluationsByProjectResponseDto>;
    clearAllWbsSelfEvaluationsByEmployeePeriod(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<ClearAllWbsSelfEvaluationsResponseDto>;
    clearWbsSelfEvaluationsByProject(employeeId: string, periodId: string, projectId: string, user: AuthenticatedUser): Promise<ClearWbsSelfEvaluationsByProjectResponseDto>;
}
