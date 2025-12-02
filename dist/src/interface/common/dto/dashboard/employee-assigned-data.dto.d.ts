import type { EvaluationPeriodInfo, EmployeeInfo, AssignedProjectWithWbs, AssignedWbsInfo, WbsEvaluationCriterion, WbsPerformance, WbsDownwardEvaluationInfo, EmployeeAssignedDataResult, DeliverableInfo } from '@context/dashboard-context/handlers/queries/get-employee-assigned-data/types';
type AssignmentSummary = EmployeeAssignedDataResult['summary'];
type EvaluationScore = AssignmentSummary['primaryDownwardEvaluation'];
type SelfEvaluationSummary = AssignmentSummary['selfEvaluation'];
export declare class EvaluationPeriodInfoDto implements EvaluationPeriodInfo {
    id: string;
    name: string;
    startDate: Date;
    status: string;
    currentPhase?: string;
    criteriaSettingEnabled: boolean;
    selfEvaluationSettingEnabled: boolean;
    finalEvaluationSettingEnabled: boolean;
    maxSelfEvaluationRate: number;
    endDate?: Date;
    description?: string;
}
export declare class EmployeeInfoDto implements EmployeeInfo {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    phoneNumber?: string;
    departmentId: string;
    departmentName?: string;
    status?: '재직중' | '휴직중' | '퇴사';
    hireDate?: Date | null;
}
export declare class WbsEvaluationCriterionDto implements WbsEvaluationCriterion {
    criterionId: string;
    criteria: string;
    importance: number;
    createdAt: Date;
}
export declare class WbsPerformanceDto implements WbsPerformance {
    performanceResult?: string;
    score?: number;
    isCompleted: boolean;
    completedAt?: Date;
}
export declare class DeliverableInfoDto implements DeliverableInfo {
    id: string;
    name: string;
    description?: string;
    type: string;
    filePath?: string;
    employeeId?: string;
    mappedDate?: Date;
    mappedBy?: string;
    isActive: boolean;
    createdAt: Date;
}
export declare class WbsDownwardEvaluationDto implements WbsDownwardEvaluationInfo {
    evaluatorId?: string;
    evaluatorName?: string;
    evaluationContent?: string;
    score?: number;
    isCompleted: boolean;
    submittedAt?: Date;
}
export declare class AssignedWbsInfoDto implements AssignedWbsInfo {
    wbsId: string;
    wbsName: string;
    wbsCode: string;
    weight: number;
    assignedAt: Date;
    criteria: WbsEvaluationCriterionDto[];
    performance?: WbsPerformanceDto | null;
    primaryDownwardEvaluation?: WbsDownwardEvaluationDto | null;
    secondaryDownwardEvaluation?: WbsDownwardEvaluationDto | null;
    deliverables: DeliverableInfoDto[];
}
export declare class ProjectManagerDto {
    id: string;
    name: string;
}
export declare class EvaluationScoreDto implements EvaluationScore {
    totalScore: number | null;
    grade: string | null;
    isSubmitted: boolean;
}
export declare class SecondaryEvaluatorDto {
    evaluatorId: string;
    evaluatorName: string;
    evaluatorEmployeeNumber: string;
    evaluatorEmail: string;
    assignedWbsCount: number;
    completedEvaluationCount: number;
    isSubmitted: boolean;
}
export declare class SecondaryDownwardEvaluationDto {
    totalScore: number | null;
    grade: string | null;
    isSubmitted: boolean;
    evaluators: SecondaryEvaluatorDto[];
}
export declare class SelfEvaluationSummaryDto implements SelfEvaluationSummary {
    totalScore: number | null;
    grade: string | null;
    totalSelfEvaluations: number;
    submittedToEvaluatorCount: number;
    submittedToManagerCount: number;
    isSubmittedToEvaluator: boolean;
    isSubmittedToManager: boolean;
}
export declare class CriteriaSubmissionInfoDto {
    isSubmitted: boolean;
    submittedAt: Date | null;
    submittedBy: string | null;
}
export declare class AssignmentSummaryDto implements AssignmentSummary {
    totalProjects: number;
    totalWbs: number;
    completedPerformances: number;
    completedSelfEvaluations: number;
    selfEvaluation: SelfEvaluationSummaryDto;
    primaryDownwardEvaluation: EvaluationScoreDto;
    secondaryDownwardEvaluation: SecondaryDownwardEvaluationDto;
    criteriaSubmission: CriteriaSubmissionInfoDto;
}
export declare class AssignedProjectWithWbsDto implements AssignedProjectWithWbs {
    projectId: string;
    projectName: string;
    projectCode: string;
    assignedAt: Date;
    projectManager?: ProjectManagerDto | null;
    wbsList: AssignedWbsInfoDto[];
}
export declare class EmployeeAssignedDataResponseDto implements EmployeeAssignedDataResult {
    evaluationPeriod: EvaluationPeriodInfoDto;
    employee: EmployeeInfoDto;
    projects: AssignedProjectWithWbsDto[];
    summary: AssignmentSummaryDto;
}
export declare class EvaluateeAssignedDataDto {
    employee: EmployeeInfoDto;
    projects: AssignedProjectWithWbsDto[];
    summary: AssignmentSummaryDto;
}
export declare class EvaluatorAssignedEmployeesDataResponseDto {
    evaluationPeriod: EvaluationPeriodInfoDto;
    evaluator: EmployeeInfoDto;
    evaluatee: EvaluateeAssignedDataDto;
}
export {};
