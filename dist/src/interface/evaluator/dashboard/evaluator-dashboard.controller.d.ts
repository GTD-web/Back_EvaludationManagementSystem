import { DashboardService } from '@context/dashboard-context/dashboard.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { EmployeeAssignedDataResponseDto, EvaluatorAssignedEmployeesDataResponseDto } from '@interface/common/dto/dashboard/employee-assigned-data.dto';
import { EmployeeEvaluationPeriodStatusResponseDto } from '@interface/common/dto/dashboard/employee-evaluation-period-status.dto';
import { MyEvaluationTargetStatusResponseDto } from '@interface/common/dto/dashboard/my-evaluation-targets-status.dto';
export declare class EvaluatorDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getMyEvaluationTargetsStatus(evaluationPeriodId: string, evaluatorId: string): Promise<MyEvaluationTargetStatusResponseDto[]>;
    getEmployeeEvaluationPeriodStatus(evaluationPeriodId: string, employeeId: string, user: AuthenticatedUser): Promise<EmployeeEvaluationPeriodStatusResponseDto | null>;
    getMyAssignedData(evaluationPeriodId: string, user: AuthenticatedUser): Promise<EmployeeAssignedDataResponseDto>;
    getEmployeeAssignedData(evaluationPeriodId: string, employeeId: string, user: AuthenticatedUser): Promise<EmployeeAssignedDataResponseDto>;
    private 이차_하향평가_정보를_제거한다;
    getEvaluatorAssignedEmployeesData(evaluationPeriodId: string, evaluatorId: string, employeeId: string): Promise<EvaluatorAssignedEmployeesDataResponseDto>;
}
