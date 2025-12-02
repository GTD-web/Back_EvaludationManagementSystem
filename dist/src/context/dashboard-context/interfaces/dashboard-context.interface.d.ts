export type EvaluationCriteriaStatus = 'complete' | 'in_progress' | 'none';
export type WbsCriteriaStatus = 'complete' | 'in_progress' | 'none';
export type EvaluationLineStatus = 'complete' | 'in_progress' | 'none';
export type PerformanceInputStatus = 'complete' | 'in_progress' | 'none';
export type SelfEvaluationStatus = 'complete' | 'in_progress' | 'none';
export type DownwardEvaluationStatus = 'complete' | 'in_progress' | 'none';
export type PeerEvaluationStatus = 'complete' | 'in_progress' | 'none';
export type FinalEvaluationStatus = 'complete' | 'in_progress' | 'none';
export interface EmployeeEvaluationPeriodStatusDto {
    mappingId: string;
    employeeId: string;
    isEvaluationTarget: boolean;
    evaluationPeriod: {
        id: string;
        name: string;
        status: string;
        currentPhase: string;
        startDate: Date;
        endDate?: Date;
        manualSettings: {
            criteriaSettingEnabled: boolean;
            selfEvaluationSettingEnabled: boolean;
            finalEvaluationSettingEnabled: boolean;
        };
    } | null;
    employee: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentName?: string;
        rankName?: string;
        status?: '재직중' | '휴직중' | '퇴사';
        hireDate?: Date | null;
    } | null;
    exclusionInfo: {
        isExcluded: boolean;
        excludeReason?: string | null;
        excludedAt?: Date | null;
    };
    evaluationCriteria: {
        status: EvaluationCriteriaStatus;
        assignedProjectCount: number;
        assignedWbsCount: number;
    };
    wbsCriteria: {
        status: WbsCriteriaStatus;
        wbsWithCriteriaCount: number;
    };
    evaluationLine: {
        status: EvaluationLineStatus;
        hasPrimaryEvaluator: boolean;
        hasSecondaryEvaluator: boolean;
    };
    criteriaSetup: {
        status: 'none' | 'in_progress' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
        evaluationCriteria: {
            status: EvaluationCriteriaStatus;
            assignedProjectCount: number;
            assignedWbsCount: number;
        };
        wbsCriteria: {
            status: WbsCriteriaStatus;
            wbsWithCriteriaCount: number;
        };
        criteriaSubmission: {
            isSubmitted: boolean;
            submittedAt?: Date | null;
            submittedBy?: string | null;
        };
    };
    performanceInput: {
        status: PerformanceInputStatus;
        totalWbsCount: number;
        inputCompletedCount: number;
    };
    selfEvaluation: {
        status: SelfEvaluationStatus | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
        totalMappingCount: number;
        completedMappingCount: number;
        isSubmittedToEvaluator: boolean;
        isSubmittedToManager: boolean;
        totalScore: number | null;
        grade: string | null;
    };
    downwardEvaluation: {
        primary: {
            evaluator: {
                id: string;
                name: string;
                employeeNumber: string;
                email: string;
                departmentName?: string;
                rankName?: string;
            } | null;
            status: DownwardEvaluationStatus | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
            assignedWbsCount: number;
            completedEvaluationCount: number;
            isSubmitted: boolean;
            totalScore: number | null;
            grade: string | null;
        };
        secondary: {
            status: DownwardEvaluationStatus | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
            evaluators: Array<{
                evaluator: {
                    id: string;
                    name: string;
                    employeeNumber: string;
                    email: string;
                    departmentName?: string;
                    rankName?: string;
                };
                status: DownwardEvaluationStatus | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
                assignedWbsCount: number;
                completedEvaluationCount: number;
                isSubmitted: boolean;
            }>;
            isSubmitted: boolean;
            totalScore: number | null;
            grade: string | null;
        };
    };
    peerEvaluation: {
        status: PeerEvaluationStatus;
        totalRequestCount: number;
        completedRequestCount: number;
    };
    finalEvaluation: {
        status: FinalEvaluationStatus;
        evaluationGrade: string | null;
        jobGrade: string | null;
        jobDetailedGrade: string | null;
        isConfirmed: boolean;
        confirmedAt: Date | null;
    };
    stepApproval: {
        criteriaSettingStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
        criteriaSettingApprovedBy: string | null;
        criteriaSettingApprovedAt: Date | null;
        selfEvaluationStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
        selfEvaluationApprovedBy: string | null;
        selfEvaluationApprovedAt: Date | null;
        primaryEvaluationStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
        primaryEvaluationApprovedBy: string | null;
        primaryEvaluationApprovedAt: Date | null;
        secondaryEvaluationStatuses: {
            evaluatorId: string;
            evaluatorName: string;
            evaluatorEmployeeNumber: string;
            evaluatorEmail: string;
            status: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
            approvedBy: string | null;
            approvedAt: Date | null;
            revisionRequestId: string | null;
            revisionComment: string | null;
            isRevisionCompleted: boolean;
            revisionCompletedAt: Date | null;
            responseComment: string | null;
        }[];
        secondaryEvaluationStatus: 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
        secondaryEvaluationApprovedBy: string | null;
        secondaryEvaluationApprovedAt: Date | null;
    };
}
export interface IDashboardContext {
    직원의_평가기간_현황을_조회한다(evaluationPeriodId: string, employeeId: string): Promise<EmployeeEvaluationPeriodStatusDto | null>;
    평가기간의_모든_피평가자_현황을_조회한다(evaluationPeriodId: string): Promise<EmployeeEvaluationPeriodStatusDto[]>;
    내가_담당하는_평가대상자_현황을_조회한다(evaluationPeriodId: string, evaluatorId: string): Promise<MyEvaluationTargetStatusDto[]>;
}
export interface MyDownwardEvaluationStatus {
    isPrimary: boolean;
    isSecondary: boolean;
    status: 'none' | 'in_progress' | 'complete';
    primaryStatus: {
        status: 'none' | 'in_progress' | 'complete';
        assignedWbsCount: number;
        completedEvaluationCount: number;
        totalScore: number | null;
        grade: string | null;
    } | null;
    secondaryStatus: {
        status: 'none' | 'in_progress' | 'complete';
        assignedWbsCount: number;
        completedEvaluationCount: number;
        totalScore: number | null;
        grade: string | null;
    } | null;
}
export interface MyEvaluationTargetStatusDto {
    employeeId: string;
    isEvaluationTarget: boolean;
    exclusionInfo: {
        isExcluded: boolean;
        excludeReason: string | null;
        excludedAt: Date | null;
    };
    evaluationCriteria: {
        status: EvaluationCriteriaStatus;
        assignedProjectCount: number;
        assignedWbsCount: number;
    };
    wbsCriteria: {
        status: WbsCriteriaStatus;
        wbsWithCriteriaCount: number;
    };
    evaluationLine: {
        status: EvaluationLineStatus;
        hasPrimaryEvaluator: boolean;
        hasSecondaryEvaluator: boolean;
    };
    setup: {
        status: 'none' | 'in_progress' | 'pending' | 'approved' | 'revision_requested' | 'revision_completed';
    };
    performanceInput: {
        status: PerformanceInputStatus;
        totalWbsCount: number;
        inputCompletedCount: number;
    };
    myEvaluatorTypes: string[];
    selfEvaluation: {
        status: SelfEvaluationStatus;
        totalMappingCount: number;
        completedMappingCount: number;
        totalSelfEvaluations: number;
        submittedToEvaluatorCount: number;
        isSubmittedToEvaluator: boolean;
        submittedToManagerCount: number;
        isSubmittedToManager: boolean;
        totalScore: number | null;
        grade: string | null;
    };
    downwardEvaluation: MyDownwardEvaluationStatus;
}
