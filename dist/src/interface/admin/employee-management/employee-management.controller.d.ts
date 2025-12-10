import { DepartmentHierarchyDto, DepartmentHierarchyWithEmployeesDto, EmployeeSyncService, OrganizationManagementService } from '@context/organization-management-context';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ExcludeEmployeeFromListDto, GetEmployeesQueryDto, GetPartLeadersQueryDto, PartLeadersResponseDto } from '@interface/common/dto/employee-management/employee-management.dto';
import { BulkUpdateEmployeeAdminDto, BulkUpdateEmployeeAdminResponseDto } from '@interface/common/dto/employee-management/bulk-update-employee-admin.dto';
import type { AuthenticatedUser } from '@interface/common/guards';
import type { EmployeeSyncResult } from '@domain/common/employee/employee.types';
export declare class EmployeeManagementController {
    private readonly organizationManagementService;
    private readonly employeeSyncService;
    constructor(organizationManagementService: OrganizationManagementService, employeeSyncService: EmployeeSyncService);
    getDepartmentHierarchy(): Promise<DepartmentHierarchyDto[]>;
    getDepartmentHierarchyWithEmployees(): Promise<DepartmentHierarchyWithEmployeesDto[]>;
    getAllEmployees(query: GetEmployeesQueryDto, includeExcluded: boolean): Promise<EmployeeDto[]>;
    getExcludedEmployees(): Promise<EmployeeDto[]>;
    getPartLeaders(query: GetPartLeadersQueryDto): Promise<PartLeadersResponseDto>;
    excludeEmployeeFromList(employeeId: string, excludeData: ExcludeEmployeeFromListDto, user: AuthenticatedUser): Promise<EmployeeDto>;
    includeEmployeeInList(employeeId: string, user: AuthenticatedUser): Promise<EmployeeDto>;
    updateEmployeeAdmin(employeeId: string, isAdmin: boolean, user: AuthenticatedUser): Promise<EmployeeDto>;
    bulkUpdateEmployeeAdmin(bulkUpdateData: BulkUpdateEmployeeAdminDto, isAdmin: boolean, user: AuthenticatedUser): Promise<BulkUpdateEmployeeAdminResponseDto>;
    syncEmployees(forceSync: boolean): Promise<EmployeeSyncResult>;
    syncAdminPermissions(user: AuthenticatedUser): Promise<{
        totalProcessed: number;
        updated: number;
        adminEmployees: string[];
        message: string;
    }>;
}
