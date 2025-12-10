import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { EmployeeDto, EmployeeFilter, EmployeeListOptions, EmployeeStatistics, EmployeeStatus, EmployeeGender } from './employee.types';
export declare class EmployeeService {
    private readonly employeeRepository;
    constructor(employeeRepository: Repository<Employee>);
    ID로_조회한다(id: string): Promise<EmployeeDto | null>;
    직원번호로_조회한다(employeeNumber: string): Promise<EmployeeDto | null>;
    이메일로_조회한다(email: string): Promise<EmployeeDto | null>;
    필터_조회한다(filter: EmployeeFilter): Promise<EmployeeDto[]>;
    목록_조회한다(options?: EmployeeListOptions): Promise<{
        employees: EmployeeDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    전체_조회한다(includeExcluded?: boolean): Promise<EmployeeDto[]>;
    부서별_조회한다(departmentId: string, includeExcluded?: boolean): Promise<EmployeeDto[]>;
    매니저별_조회한다(managerId: string, includeExcluded?: boolean): Promise<EmployeeDto[]>;
    재직중_조회한다(includeExcluded?: boolean): Promise<EmployeeDto[]>;
    존재하는가(id: string): Promise<boolean>;
    직원번호가_존재하는가(employeeNumber: string): Promise<boolean>;
    이메일이_존재하는가(email: string): Promise<boolean>;
    조회에서_제외한다(id: string, excludeReason: string, excludedBy: string): Promise<EmployeeDto | null>;
    조회에_포함한다(id: string, updatedBy: string): Promise<EmployeeDto | null>;
    조회에서_제외되었는가(id: string): Promise<boolean>;
    사번으로_관리자권한있는가(employeeNumber: string): Promise<boolean>;
    관리자권한있는가(id: string): Promise<boolean>;
    관리자권한변경한다(id: string, isAdmin: boolean, updatedBy: string): Promise<EmployeeDto | null>;
    여러직원관리자권한변경한다(ids: string[], isAdmin: boolean, updatedBy: string): Promise<{
        totalProcessed: number;
        succeeded: number;
        failed: number;
        failedIds: string[];
        errors: string[];
    }>;
    findById(id: string): Promise<Employee | null>;
    findByEmployeeNumber(employeeNumber: string): Promise<Employee | null>;
    create(data: Partial<Employee>): Promise<Employee>;
    update(id: string, data: Partial<Employee>): Promise<Employee | null>;
    updateRoles(id: string, roles: string[]): Promise<Employee | null>;
    findByExternalId(externalId: string): Promise<Employee | null>;
    findAll(includeExcluded?: boolean): Promise<Employee[]>;
    findByFilter(filter: EmployeeFilter): Promise<Employee[]>;
    save(employee: Employee): Promise<Employee>;
    saveMany(employees: Employee[]): Promise<Employee[]>;
    findByEmail(email: string): Promise<Employee | null>;
    findByDepartmentId(departmentId: string): Promise<Employee[]>;
    findByStatus(status: EmployeeStatus, options?: {
        includeExcluded?: boolean;
    }): Promise<Employee[]>;
    findByGender(gender: EmployeeGender): Promise<Employee[]>;
    findByPositionId(positionId: string): Promise<Employee[]>;
    findByRankId(rankId: string): Promise<Employee[]>;
    findActiveEmployees(): Promise<Employee[]>;
    searchByName(searchTerm: string): Promise<Employee[]>;
    getEmployeeStats(): Promise<EmployeeStatistics>;
}
