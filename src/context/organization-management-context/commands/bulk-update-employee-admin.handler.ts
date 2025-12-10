import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';

/**
 * 여러 직원의 관리자 권한 여부를 일괄 변경하는 커맨드
 */
export class BulkUpdateEmployeeAdminCommand implements ICommand {
  constructor(
    public readonly employeeIds: string[],
    public readonly isAdmin: boolean,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 여러 직원 관리자 권한 일괄 변경 핸들러
 */
@CommandHandler(BulkUpdateEmployeeAdminCommand)
export class BulkUpdateEmployeeAdminHandler
  implements ICommandHandler<BulkUpdateEmployeeAdminCommand>
{
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(command: BulkUpdateEmployeeAdminCommand): Promise<{
    totalProcessed: number;
    succeeded: number;
    failed: number;
    failedIds: string[];
    errors: string[];
  }> {
    const { employeeIds, isAdmin, updatedBy } = command;

    return await this.employeeService.여러직원관리자권한변경한다(
      employeeIds,
      isAdmin,
      updatedBy,
    );
  }
}

