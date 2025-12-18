export interface EvaluationWbsAssignmentDto {
    id: string;
    periodId: string;
    employeeId: string;
    projectId: string;
    wbsItemId: string;
    assignedDate: Date;
    assignedBy: string;
    displayOrder: number;
    weight: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    periodName?: string;
    employeeName?: string;
    projectName?: string;
    wbsItemTitle?: string;
    wbsItemCode?: string;
    assignedByName?: string;
}
export interface CreateEvaluationWbsAssignmentData {
    periodId: string;
    employeeId: string;
    projectId: string;
    wbsItemId: string;
    assignedBy: string;
    displayOrder?: number;
}
export interface UpdateEvaluationWbsAssignmentData {
    assignedBy?: string;
}
export interface EvaluationWbsAssignmentFilter {
    periodId?: string;
    employeeId?: string;
    projectId?: string;
    wbsItemId?: string;
    assignedBy?: string;
    assignedDateFrom?: Date;
    assignedDateTo?: Date;
}
export declare enum OrderDirection {
    UP = "up",
    DOWN = "down"
}
export interface ChangeWbsAssignmentOrderData {
    assignmentId: string;
    direction: OrderDirection;
    updatedBy: string;
}
