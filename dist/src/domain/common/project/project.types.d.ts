export declare enum ProjectStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export interface ManagerInfo {
    managerId: string;
    employeeId?: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    departmentName?: string;
    rankName?: string;
}
export interface ProjectDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    name: string;
    projectCode?: string;
    status: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
    manager?: ManagerInfo;
    parentProjectId?: string;
    parentProject?: ProjectDto;
    childProjects?: ProjectDto[];
    childProjectCount?: number;
    readonly isDeleted: boolean;
    readonly isActive: boolean;
    readonly isCompleted: boolean;
    readonly isCancelled: boolean;
}
export interface ChildProjectInput {
    orderLevel: number;
    name: string;
    projectCode?: string;
    managerId?: string;
}
export interface CreateProjectDto {
    name: string;
    projectCode?: string;
    status: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
    parentProjectId?: string;
    childProjects?: ChildProjectInput[];
}
export interface UpdateProjectDto {
    name?: string;
    projectCode?: string;
    status?: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
    parentProjectId?: string;
    childProjects?: ChildProjectInput[];
}
export interface ProjectFilter {
    status?: ProjectStatus;
    managerId?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
    parentProjectId?: string;
    hierarchyLevel?: 'parent' | 'child' | 'all';
    search?: string;
}
export interface ProjectStatistics {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    cancelledProjects: number;
    projectsByStatus: Record<string, number>;
    projectsByManager: Record<string, number>;
    lastSyncAt?: Date;
}
export interface ProjectListOptions {
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'projectCode' | 'startDate' | 'endDate' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    filter?: ProjectFilter;
}
