import { OrderDirection } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
export declare class CreateProjectAssignmentDto {
    employeeId: string;
    projectId: string;
    periodId: string;
}
export declare class BulkCreateProjectAssignmentDto {
    assignments: CreateProjectAssignmentDto[];
}
export declare class ChangeProjectAssignmentOrderQueryDto {
    direction: OrderDirection;
}
export declare class ChangeProjectAssignmentOrderBodyDto {
}
export declare class CancelProjectAssignmentByProjectDto {
    employeeId: string;
    periodId: string;
}
export declare class ChangeProjectAssignmentOrderByProjectDto {
    employeeId: string;
    periodId: string;
    direction: OrderDirection;
}
export declare class ProjectAssignmentFilterDto {
    employeeId?: string;
    projectId?: string;
    periodId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
export declare class ProjectAssignmentResponseDto {
    id: string;
    employeeId: string;
    projectId: string;
    periodId: string;
    assignedDate: Date;
    assignedBy: string;
    displayOrder: number;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    project?: ProjectInfoDto | null;
}
export declare class EvaluationPeriodInfoDto {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date;
    status: string;
    description?: string;
}
export declare class EmployeeInfoDto {
    id: string;
    employeeNumber: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    status: string;
    departmentId?: string;
    departmentName?: string;
}
export declare class ProjectInfoDto {
    id: string;
    name: string;
    projectCode: string;
    status: string;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
}
export declare class ProjectAssignmentDetailResponseDto {
    id: string;
    assignedDate: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    evaluationPeriod?: EvaluationPeriodInfoDto | null;
    employee?: EmployeeInfoDto | null;
    project?: ProjectInfoDto | null;
    assignedBy?: EmployeeInfoDto | null;
}
export declare class EmployeeProjectsResponseDto {
    projects: ProjectInfoDto[];
}
export declare class ProjectEmployeesResponseDto {
    employees: EmployeeInfoDto[];
}
export declare class GetUnassignedEmployeesQueryDto {
    periodId: string;
    projectId?: string;
}
export declare class UnassignedEmployeesResponseDto {
    periodId: string;
    projectId?: string;
    employees: EmployeeInfoDto[];
}
export declare class ProjectAssignmentListResponseDto {
    items: ProjectAssignmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class GetAvailableProjectsQueryDto {
    periodId: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export declare class ProjectManagerInfoDto {
    managerId: string;
    employeeId?: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    departmentName?: string;
}
export declare class AvailableProjectInfoDto {
    id: string;
    name: string;
    projectCode?: string;
    status: string;
    startDate?: Date;
    endDate?: Date;
    manager?: ProjectManagerInfoDto | null;
}
export declare class AvailableProjectsResponseDto {
    periodId: string;
    projects: AvailableProjectInfoDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    search?: string;
    sortBy: string;
    sortOrder: string;
}
