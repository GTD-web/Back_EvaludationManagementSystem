import { ProjectStatus } from '@domain/common/project/project.types';
export declare class CreateProjectDto {
    name: string;
    projectCode?: string;
    status: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
}
export declare class CreateProjectsBulkDto {
    projects: CreateProjectDto[];
}
export declare class UpdateProjectDto {
    name?: string;
    projectCode?: string;
    status?: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
}
export declare class GetProjectListQueryDto {
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'projectCode' | 'startDate' | 'endDate' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    status?: ProjectStatus;
    managerId?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
}
export declare class ManagerInfoDto {
    managerId: string;
    employeeId?: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    departmentName?: string;
    rankName?: string;
}
export declare class ProjectResponseDto {
    id: string;
    name: string;
    projectCode?: string;
    status: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
    manager?: ManagerInfoDto;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    isActive: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
}
export declare class ProjectListResponseDto {
    projects: ProjectResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class GetProjectManagersQueryDto {
    departmentId?: string;
    search?: string;
}
export declare class ProjectManagerDto {
    id: string;
    employeeId?: string;
    employeeNumber: string;
    name: string;
    email: string;
    departmentName?: string;
    departmentCode?: string;
    positionName?: string;
    positionLevel?: number;
    jobTitleName?: string;
    hasManagementAuthority?: boolean;
}
export declare class ProjectManagerListResponseDto {
    managers: ProjectManagerDto[];
    total: number;
}
export declare class BulkCreateFailedItemDto {
    index: number;
    data: CreateProjectDto;
    error: string;
}
export declare class ProjectsBulkCreateResponseDto {
    success: ProjectResponseDto[];
    failed: BulkCreateFailedItemDto[];
    successCount: number;
    failedCount: number;
    totalCount: number;
}
