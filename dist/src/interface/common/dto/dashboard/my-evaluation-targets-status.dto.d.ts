export declare class MyEvaluationStatusDetailDto {
    status: 'none' | 'in_progress' | 'complete';
    assignedWbsCount: number;
    completedEvaluationCount: number;
    totalScore: number | null;
    grade: string | null;
    primaryEvaluationViewed?: boolean;
}
export declare class MyDownwardEvaluationStatusDto {
    isPrimary: boolean;
    isSecondary: boolean;
    status: 'none' | 'in_progress' | 'complete';
    primaryStatus: MyEvaluationStatusDetailDto | null;
    secondaryStatus: MyEvaluationStatusDetailDto | null;
}
export declare class MyTargetExclusionInfoDto {
    isExcluded: boolean;
    excludeReason: string | null;
    excludedAt: Date | null;
}
export declare class MyTargetEvaluationCriteriaDto {
    status: 'complete' | 'in_progress' | 'none';
    assignedProjectCount: number;
    assignedWbsCount: number;
}
export declare class MyTargetWbsCriteriaDto {
    status: 'complete' | 'in_progress' | 'none';
    wbsWithCriteriaCount: number;
}
export declare class MyTargetEvaluationLineDto {
    status: 'complete' | 'in_progress' | 'none';
    hasPrimaryEvaluator: boolean;
    hasSecondaryEvaluator: boolean;
}
export declare class SetupStatusDto {
    status: 'none' | 'in_progress' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
}
export declare class PerformanceInputDto {
    status: 'complete' | 'in_progress' | 'none';
    totalWbsCount: number;
    inputCompletedCount: number;
}
export declare class MyTargetSelfEvaluationDto {
    status: 'complete' | 'in_progress' | 'none';
    totalMappingCount: number;
    completedMappingCount: number;
    totalSelfEvaluations: number;
    submittedToEvaluatorCount: number;
    isSubmittedToEvaluator: boolean;
    submittedToManagerCount: number;
    isSubmittedToManager: boolean;
    totalScore: number | null;
    grade: string | null;
    viewedByPrimaryEvaluator?: boolean;
    viewedBySecondaryEvaluator?: boolean;
}
export declare class MyEvaluationTargetStatusResponseDto {
    employeeId: string;
    isEvaluationTarget: boolean;
    exclusionInfo: MyTargetExclusionInfoDto;
    evaluationCriteria: MyTargetEvaluationCriteriaDto;
    wbsCriteria: MyTargetWbsCriteriaDto;
    evaluationLine: MyTargetEvaluationLineDto;
    setup: SetupStatusDto;
    performanceInput: PerformanceInputDto;
    myEvaluatorTypes: string[];
    selfEvaluation: MyTargetSelfEvaluationDto;
    downwardEvaluation: MyDownwardEvaluationStatusDto;
}
