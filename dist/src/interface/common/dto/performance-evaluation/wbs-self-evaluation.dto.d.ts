export declare class CreateWbsSelfEvaluationBodyDto {
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    subProject?: string;
    createdBy?: string;
}
export declare class UpdateWbsSelfEvaluationDto {
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
}
export declare class SubmitWbsSelfEvaluationDto {
}
export declare class WbsSelfEvaluationFilterDto {
    periodId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
}
export declare class WbsSelfEvaluationBasicDto {
    id: string;
    periodId: string;
    employeeId: string;
    wbsItemId: string;
    assignedBy: string;
    assignedDate: Date;
    submittedToEvaluator: boolean;
    submittedToEvaluatorAt?: Date;
    submittedToManager: boolean;
    submittedToManagerAt?: Date;
    evaluationDate: Date;
    performanceResult?: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    subProject?: string | null;
    createdAt: Date;
    updatedAt: Date;
    version: number;
}
export declare class WbsSelfEvaluationResponseDto extends WbsSelfEvaluationBasicDto {
}
export declare class WbsSelfEvaluationDetailResponseDto {
    id: string;
    periodId: string;
    employeeId: string;
    wbsItemId: string;
    assignedBy: string;
    assignedDate: Date;
    submittedToEvaluator: boolean;
    submittedToEvaluatorAt?: Date;
    submittedToManager: boolean;
    submittedToManagerAt?: Date;
    evaluationDate: Date;
    performanceResult?: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    subProject?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    evaluationPeriod?: {
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
        status: string;
        description?: string;
    };
    employee?: {
        id: string;
        employeeNumber: string;
        name: string;
        email: string;
        departmentId: string;
    };
    wbsItem?: {
        id: string;
        wbsCode: string;
        title: string;
        startDate?: Date;
        endDate?: Date;
        status: string;
        progressPercentage?: number;
        projectId: string;
    };
}
export declare class EmployeeSelfEvaluationsResponseDto {
    evaluations: WbsSelfEvaluationBasicDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class SubmittedWbsSelfEvaluationDetailDto {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    submittedToManagerAt?: Date;
    submittedToEvaluatorAt?: Date;
}
export declare class FailedWbsSelfEvaluationDto {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
}
export declare class SubmitAllWbsSelfEvaluationsResponseDto {
    submittedCount: number;
    failedCount: number;
    totalCount: number;
    completedEvaluations: SubmittedWbsSelfEvaluationDetailDto[];
    failedEvaluations: FailedWbsSelfEvaluationDto[];
}
export declare class ResetWbsSelfEvaluationDetailDto {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    wasSubmittedToManager: boolean;
}
export declare class FailedResetWbsSelfEvaluationDto {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
}
export declare class ResetAllWbsSelfEvaluationsResponseDto {
    resetCount: number;
    failedCount: number;
    totalCount: number;
    resetEvaluations: ResetWbsSelfEvaluationDetailDto[];
    failedResets: FailedResetWbsSelfEvaluationDto[];
}
export declare class SubmittedWbsSelfEvaluationByProjectDetailDto {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    submittedToManagerAt?: Date;
    submittedToEvaluatorAt?: Date;
}
export declare class FailedWbsSelfEvaluationByProjectDto {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
}
export declare class SubmitWbsSelfEvaluationsByProjectResponseDto {
    submittedCount: number;
    failedCount: number;
    totalCount: number;
    completedEvaluations: SubmittedWbsSelfEvaluationByProjectDetailDto[];
    failedEvaluations: FailedWbsSelfEvaluationByProjectDto[];
}
export declare class ResetWbsSelfEvaluationByProjectDetailDto {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    wasSubmittedToManager: boolean;
}
export declare class FailedResetWbsSelfEvaluationByProjectDto {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
}
export declare class ResetWbsSelfEvaluationsByProjectResponseDto {
    resetCount: number;
    failedCount: number;
    totalCount: number;
    resetEvaluations: ResetWbsSelfEvaluationByProjectDetailDto[];
    failedResets: FailedResetWbsSelfEvaluationByProjectDto[];
}
export declare class ClearedWbsSelfEvaluationDetailDto {
    id: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
}
export declare class ClearAllWbsSelfEvaluationsResponseDto {
    employeeId: string;
    periodId: string;
    clearedCount: number;
    clearedEvaluations: ClearedWbsSelfEvaluationDetailDto[];
}
export declare class ClearWbsSelfEvaluationsByProjectResponseDto {
    employeeId: string;
    periodId: string;
    projectId: string;
    clearedCount: number;
    clearedEvaluations: ClearedWbsSelfEvaluationDetailDto[];
}
