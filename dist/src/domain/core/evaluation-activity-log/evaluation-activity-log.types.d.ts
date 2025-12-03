export type EvaluationActivityType = 'wbs_self_evaluation' | 'downward_evaluation' | 'peer_evaluation' | 'additional_evaluation' | 'deliverable' | 'evaluation_status' | 'step_approval' | 'revision_request';
export type EvaluationActivityAction = 'created' | 'updated' | 'submitted' | 'completed' | 'cancelled' | 'deleted' | 'assigned' | 'unassigned' | 'approved' | 'rejected' | 'revision_requested' | 'revision_completed' | 'viewed';
export interface EvaluationActivityLogDto {
    id: string;
    periodId: string;
    employeeId: string;
    activityType: EvaluationActivityType;
    activityAction: EvaluationActivityAction;
    activityTitle?: string;
    activityDescription?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    performedBy: string;
    performedByName?: string;
    activityMetadata?: Record<string, any>;
    activityDate: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export interface CreateEvaluationActivityLogData {
    periodId: string;
    employeeId: string;
    activityType: EvaluationActivityType;
    activityAction: EvaluationActivityAction;
    activityTitle?: string;
    activityDescription?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    performedBy: string;
    performedByName?: string;
    activityMetadata?: Record<string, any>;
    activityDate?: Date;
    createdBy?: string;
}
export interface EvaluationActivityLogFilter {
    periodId?: string;
    employeeId?: string;
    activityType?: EvaluationActivityType;
    activityAction?: EvaluationActivityAction;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}
