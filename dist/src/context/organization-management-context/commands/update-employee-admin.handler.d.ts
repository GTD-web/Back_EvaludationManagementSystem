import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
export declare class UpdateEmployeeAdminCommand implements ICommand {
    readonly employeeId: string;
    readonly isAdmin: boolean;
    readonly updatedBy: string;
    constructor(employeeId: string, isAdmin: boolean, updatedBy: string);
}
export declare class UpdateEmployeeAdminHandler implements ICommandHandler<UpdateEmployeeAdminCommand> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(command: UpdateEmployeeAdminCommand): Promise<EmployeeDto>;
}
