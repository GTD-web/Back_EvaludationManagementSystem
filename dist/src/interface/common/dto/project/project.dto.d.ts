import { ProjectStatus } from '@domain/common/project/project.types';
export declare class ChildProjectInputDto {
    orderLevel: number;
    name: string;
    projectCode?: string;
    managerId?: string;
}
export declare class CreateProjectDto {
    name: string;
    projectCode?: string;
    status: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
    parentProjectId?: string;
    childProjects?: ChildProjectInputDto[];
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
    parentProjectId?: string;
    childProjects?: ChildProjectInputDto[];
}
export declare class GetProjectListQueryDto {
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'projectCode' | 'startDate' | 'endDate' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    status?: ProjectStatus;
    managerId?: string;
    parentProjectId?: string;
    hierarchyLevel?: 'parent' | 'child' | 'all';
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
    search?: string;
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
export declare class SimpleProjectResponseDto {
    id: string;
    name: string;
    projectCode?: string;
    status: ProjectStatus;
    managerId?: string;
    manager?: ManagerInfoDto;
    childProjects?: SimpleProjectResponseDto[];
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
    parentProjectId?: string;
    parentProject?: SimpleProjectResponseDto;
    childProjects?: SimpleProjectResponseDto[];
    childProjectCount?: number;
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
    managerId: string;
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
export declare class AvailableProjectManagerListResponseDto {
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
