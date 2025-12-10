export interface DeliverableInfo {
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
export interface AssignedProjectWithWbs {
    projectId: string;
    projectName: string;
    projectCode: string;
    assignedAt: Date;
    projectManager?: {
        id: string;
        name: string;
    } | null;
    wbsList: AssignedWbsInfo[];
}
export interface WbsEvaluationCriterion {
    criterionId: string;
    criteria: string;
    importance: number;
    createdAt: Date;
}
export interface WbsPerformance {
    performanceResult?: string;
    score?: number;
    isCompleted: boolean;
    completedAt?: Date;
}
export interface WbsDownwardEvaluationInfo {
    evaluatorId?: string;
    evaluatorName?: string;
    evaluationContent?: string;
    score?: number;
    isCompleted: boolean;
    submittedAt?: Date;
}
export interface AssignedWbsInfo {
    wbsId: string;
    wbsName: string;
    wbsCode: string;
    weight: number;
    assignedAt: Date;
    criteria: WbsEvaluationCriterion[];
    performance?: WbsPerformance | null;
    primaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
    secondaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
    deliverables: DeliverableInfo[];
}
export interface EvaluationPeriodInfo {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date;
    status: string;
    currentPhase?: string;
    description?: string;
    criteriaSettingEnabled: boolean;
    selfEvaluationSettingEnabled: boolean;
    finalEvaluationSettingEnabled: boolean;
    maxSelfEvaluationRate: number;
}
export interface EmployeeInfo {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    phoneNumber?: string;
    departmentId: string;
    departmentName?: string;
    status?: '재직중' | '휴직중' | '퇴사';
}
export interface EmployeeAssignedDataResult {
    evaluationPeriod: EvaluationPeriodInfo;
    employee: EmployeeInfo;
    projects: AssignedProjectWithWbs[];
    summary: {
        totalProjects: number;
        totalWbs: number;
        completedPerformances: number;
        completedSelfEvaluations: number;
        selfEvaluation: {
            totalScore: number | null;
            grade: string | null;
            totalSelfEvaluations: number;
            submittedToEvaluatorCount: number;
            submittedToManagerCount: number;
            isSubmittedToEvaluator: boolean;
            isSubmittedToManager: boolean;
        };
        primaryDownwardEvaluation: {
            totalScore: number | null;
            grade: string | null;
            isSubmitted: boolean;
        };
        secondaryDownwardEvaluation: {
            totalScore: number | null;
            grade: string | null;
            isSubmitted: boolean;
            evaluators: Array<{
                evaluatorId: string;
                evaluatorName: string;
                evaluatorEmployeeNumber: string;
                evaluatorEmail: string;
                assignedWbsCount: number;
                completedEvaluationCount: number;
                isSubmitted: boolean;
            }>;
        };
        criteriaSubmission: {
            isSubmitted: boolean;
            submittedAt: Date | null;
            submittedBy: string | null;
        };
    };
}
