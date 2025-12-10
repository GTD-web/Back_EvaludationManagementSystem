import { EmployeeService } from '@domain/common/employee/employee.service';
import { ICommandHandler } from '@nestjs/cqrs';
export declare class SyncAdminPermissionsCommand {
    readonly updatedBy: string;
    constructor(updatedBy: string);
}
export interface SyncAdminPermissionsResult {
    totalProcessed: number;
    updated: number;
    adminEmployees: string[];
    message: string;
}
export declare class SyncAdminPermissionsHandler implements ICommandHandler<SyncAdminPermissionsCommand, SyncAdminPermissionsResult> {
    private readonly employeeService;
    private readonly logger;
    private readonly ADMIN_EMPLOYEE_NAMES;
    constructor(employeeService: EmployeeService);
    execute(command: SyncAdminPermissionsCommand): Promise<SyncAdminPermissionsResult>;
}
