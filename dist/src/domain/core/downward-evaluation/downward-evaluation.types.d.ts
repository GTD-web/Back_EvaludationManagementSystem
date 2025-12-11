export declare enum DownwardEvaluationType {
    PRIMARY = "primary",
    SECONDARY = "secondary"
}
export interface CreateDownwardEvaluationData {
    employeeId: string;
    evaluatorId: string;
    wbsId: string;
    periodId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    evaluationType: DownwardEvaluationType;
    evaluationDate?: Date;
    isCompleted?: boolean;
    createdBy: string;
}
export interface UpdateDownwardEvaluationData {
    evaluatorId?: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    isCompleted?: boolean;
}
export interface DownwardEvaluationDto {
    id: string;
    employeeId: string;
    evaluatorId: string;
    wbsId: string;
    periodId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    evaluationDate: Date;
    evaluationType: DownwardEvaluationType;
    isCompleted: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export interface DownwardEvaluationFilter {
    employeeId?: string;
    evaluatorId?: string;
    wbsId?: string;
    periodId?: string;
    selfEvaluationId?: string;
    evaluationType?: DownwardEvaluationType;
    completedOnly?: boolean;
    uncompletedOnly?: boolean;
    withSelfEvaluation?: boolean;
    withoutSelfEvaluation?: boolean;
    scoreFrom?: number;
    scoreTo?: number;
    evaluationDateFrom?: Date;
    evaluationDateTo?: Date;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
export interface DownwardEvaluationStatistics {
    totalEvaluations: number;
    evaluationsByType: Record<DownwardEvaluationType, number>;
    completedEvaluations: number;
    averageDownwardScore: number;
    maxScore: number;
    minScore: number;
}
