import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { OrderDirection } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export declare class CancelWbsAssignmentByWbsDto {
    employeeId: string;
    projectId: string;
    periodId: string;
}
export declare class CreateWbsAssignmentDto {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
}
export declare class WbsAssignmentFilterDto {
    periodId?: string;
    employeeId?: string;
    wbsItemId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
export declare class BulkCreateWbsAssignmentDto {
    assignments: CreateWbsAssignmentDto[];
}
export declare class EmployeeWbsAssignmentsResponseDto {
    wbsAssignments: any[];
}
export declare class ProjectWbsAssignmentsResponseDto {
    wbsAssignments: any[];
}
export declare class WbsItemAssignmentsResponseDto {
    wbsAssignments: any[];
}
export declare class GetUnassignedWbsItemsDto {
    projectId: string;
    periodId: string;
    employeeId?: string;
}
export declare class UnassignedWbsItemsResponseDto {
    wbsItems: WbsItemDto[];
}
export declare class WbsAssignmentDetailResponseDto {
    id: string;
    periodId: string;
    employeeId: string;
    projectId: string;
    wbsItemId: string;
    assignedDate: Date;
    assignedBy: string;
    displayOrder: number | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
    employee: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentId: string;
        status: string;
    } | null;
    department: {
        id: string;
        name: string;
        code: string;
    } | null;
    project: {
        id: string;
        name: string;
        code: string;
        status: string;
        startDate: Date;
        endDate: Date;
    } | null;
    wbsItem: {
        id: string;
        wbsCode: string;
        title: string;
        status: string;
        level: number;
        startDate: Date;
        endDate: Date;
        progressPercentage: string;
    } | null;
    period: {
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
        status: string;
    } | null;
    assignedByEmployee: {
        id: string;
        name: string;
        employeeNumber: string;
    } | null;
}
export declare class ResetWbsAssignmentsDto {
}
export declare class ChangeWbsAssignmentOrderQueryDto {
    direction: OrderDirection;
}
export declare class ChangeWbsAssignmentOrderByWbsDto {
    employeeId: string;
    wbsItemId?: string;
    projectId: string;
    periodId: string;
    direction: OrderDirection;
}
export declare class ChangeWbsAssignmentOrderBodyDto {
    updatedBy?: string;
}
export declare class CreateAndAssignWbsDto {
    title: string;
    projectId: string;
    employeeId: string;
    periodId: string;
}
export declare class CreateAndAssignWbsBetweenDto {
    title: string;
    projectId: string;
    employeeId: string;
    periodId: string;
}
export declare class UpdateWbsItemTitleDto {
    title: string;
}
