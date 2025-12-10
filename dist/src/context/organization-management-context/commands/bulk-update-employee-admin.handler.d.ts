import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
export declare class BulkUpdateEmployeeAdminCommand implements ICommand {
    readonly employeeIds: string[];
    readonly isAdmin: boolean;
    readonly updatedBy: string;
    constructor(employeeIds: string[], isAdmin: boolean, updatedBy: string);
}
export declare class BulkUpdateEmployeeAdminHandler implements ICommandHandler<BulkUpdateEmployeeAdminCommand> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(command: BulkUpdateEmployeeAdminCommand): Promise<{
        totalProcessed: number;
        succeeded: number;
        failed: number;
        failedIds: string[];
        errors: string[];
    }>;
}
