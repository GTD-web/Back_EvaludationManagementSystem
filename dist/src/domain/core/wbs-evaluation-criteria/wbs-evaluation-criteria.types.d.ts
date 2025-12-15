export interface CreateWbsEvaluationCriteriaData {
    wbsItemId: string;
    criteria: string;
    importance: number;
    subProject?: string | null;
}
export interface UpdateWbsEvaluationCriteriaData {
    criteria?: string;
    importance?: number;
    subProject?: string | null;
}
export interface WbsEvaluationCriteriaDto {
    id: string;
    wbsItemId: string;
    criteria: string;
    importance: number;
    subProject?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface WbsEvaluationCriteriaFilter {
    wbsItemId?: string;
    criteriaSearch?: string;
    criteriaExact?: string;
}
