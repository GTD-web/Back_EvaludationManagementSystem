import { DepartmentDto } from '../../../domain/common/department/department.types';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
export interface IOrganizationManagementContext {
    전체부서목록조회(): Promise<DepartmentDto[]>;
    부서정보조회(departmentId: string): Promise<DepartmentDto | null>;
    부서별직원목록조회(departmentId: string): Promise<EmployeeDto[]>;
    조직도조회(): Promise<OrganizationChartDto>;
    전체직원목록조회(includeExcluded?: boolean, departmentId?: string): Promise<EmployeeDto[]>;
    상급자조회(employeeId: string): Promise<EmployeeDto | null>;
    하급자목록조회(employeeId: string): Promise<EmployeeDto[]>;
    하위부서목록조회(departmentId: string): Promise<DepartmentDto[]>;
    상위부서조회(departmentId: string): Promise<DepartmentDto | null>;
    부서장조회(employeeId: string): Promise<string | null>;
    활성직원목록조회(): Promise<EmployeeDto[]>;
    부서하이라키조회(): Promise<DepartmentHierarchyDto[]>;
    부서하이라키_직원포함_조회(): Promise<DepartmentHierarchyWithEmployeesDto[]>;
    사번으로_관리자권한있는가(employeeNumber: string): Promise<boolean>;
    직원관리자권한변경(employeeId: string, isAdmin: boolean, updatedBy: string): Promise<EmployeeDto>;
    여러직원관리자권한변경(employeeIds: string[], isAdmin: boolean, updatedBy: string): Promise<{
        totalProcessed: number;
        succeeded: number;
        failed: number;
        failedIds: string[];
        errors: string[];
    }>;
}
export interface OrganizationChartDto {
    departments: DepartmentWithEmployeesDto[];
    totalEmployeeCount: number;
    lastUpdatedAt: Date;
}
export interface DepartmentWithEmployeesDto extends DepartmentDto {
    employees: EmployeeDto[];
    subDepartments: DepartmentWithEmployeesDto[];
}
export interface DepartmentHierarchyDto {
    id: string;
    name: string;
    code: string;
    order: number;
    parentDepartmentId?: string;
    level: number;
    depth: number;
    childrenCount: number;
    totalDescendants: number;
    subDepartments: DepartmentHierarchyDto[];
}
export interface EmployeeSummaryDto {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    rankName?: string;
    rankCode?: string;
    rankLevel?: number;
    isActive: boolean;
}
export interface DepartmentHierarchyWithEmployeesDto {
    id: string;
    name: string;
    code: string;
    order: number;
    parentDepartmentId?: string;
    level: number;
    depth: number;
    childrenCount: number;
    totalDescendants: number;
    employeeCount: number;
    employees: EmployeeSummaryDto[];
    subDepartments: DepartmentHierarchyWithEmployeesDto[];
}
