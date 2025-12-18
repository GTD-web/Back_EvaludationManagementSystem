export declare class CreateProjectManagerDto {
    employeeId: string;
    isActive?: boolean;
    note?: string;
}
export declare class UpdateProjectManagerDto {
    name?: string;
    email?: string;
    employeeNumber?: string;
    departmentName?: string;
    isActive?: boolean;
    note?: string;
}
export declare class ProjectManagerResponseDto {
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
export declare class GetProjectManagersQueryDto {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
}
export declare class ProjectManagerListResponseDto {
    managers: ProjectManagerResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
