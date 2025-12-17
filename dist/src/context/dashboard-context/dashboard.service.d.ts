import { QueryBus } from '@nestjs/cqrs';
import { IDashboardContext, EmployeeEvaluationPeriodStatusDto, MyEvaluationTargetStatusDto } from './interfaces/dashboard-context.interface';
import { EmployeeAssignedDataResult, EvaluatorAssignedEmployeesDataResult, FinalEvaluationByPeriodResult, FinalEvaluationByEmployeeResult, AllEmployeesFinalEvaluationResult } from './handlers/queries';
import type { DepartmentHierarchyWithEmployeesDto } from '@context/organization-management-context';
export declare class DashboardService implements IDashboardContext {
    private readonly queryBus;
    constructor(queryBus: QueryBus);
    직원의_평가기간_현황을_조회한다(evaluationPeriodId: string, employeeId: string): Promise<EmployeeEvaluationPeriodStatusDto | null>;
    평가기간의_모든_피평가자_현황을_조회한다(evaluationPeriodId: string, includeUnregistered?: boolean): Promise<EmployeeEvaluationPeriodStatusDto[]>;
    내가_담당하는_평가대상자_현황을_조회한다(evaluationPeriodId: string, evaluatorId: string): Promise<MyEvaluationTargetStatusDto[]>;
    사용자_할당_정보를_조회한다(evaluationPeriodId: string, employeeId: string, viewerId?: string): Promise<EmployeeAssignedDataResult>;
    담당자의_피평가자_할당_정보를_조회한다(evaluationPeriodId: string, evaluatorId: string, employeeId: string): Promise<EvaluatorAssignedEmployeesDataResult>;
    평가기간별_최종평가_목록을_조회한다(evaluationPeriodId: string): Promise<FinalEvaluationByPeriodResult[]>;
    직원별_최종평가_목록을_조회한다(employeeId: string, startDate?: Date, endDate?: Date): Promise<FinalEvaluationByEmployeeResult[]>;
    전체_직원별_최종평가_목록을_조회한다(startDate?: Date, endDate?: Date): Promise<AllEmployeesFinalEvaluationResult[]>;
    직원_현황을_엑셀로_생성한다(data: EmployeeEvaluationPeriodStatusDto[], periodName: string, departmentHierarchy: DepartmentHierarchyWithEmployeesDto[]): Promise<Buffer>;
}
