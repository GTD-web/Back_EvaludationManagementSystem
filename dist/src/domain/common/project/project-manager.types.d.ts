export interface ProjectManagerDto {
    id: string;
    managerId: string;
    name: string;
    email?: string;
    employeeNumber?: string;
    departmentName?: string;
    isActive: boolean;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface CreateProjectManagerDto {
    managerId: string;
    name: string;
    email?: string;
    employeeNumber?: string;
    departmentName?: string;
    isActive?: boolean;
    note?: string;
}
export interface UpdateProjectManagerDto {
    name?: string;
    email?: string;
    employeeNumber?: string;
    departmentName?: string;
    isActive?: boolean;
    note?: string;
}
export interface ProjectManagerFilter {
    isActive?: boolean;
    search?: string;
}
export interface ProjectManagerListOptions {
    page?: number;
    limit?: number;
    filter?: ProjectManagerFilter;
}
