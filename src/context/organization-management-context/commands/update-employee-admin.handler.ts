import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
import { NotFoundException } from '@nestjs/common';

/**
 * 직원의 관리자 권한 여부를 변경하는 커맨드
 */
export class UpdateEmployeeAdminCommand implements ICommand {
  constructor(
    public readonly employeeId: string,
    public readonly isAdmin: boolean,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 직원 관리자 권한 변경 핸들러
 */
@CommandHandler(UpdateEmployeeAdminCommand)
export class UpdateEmployeeAdminHandler
  implements ICommandHandler<UpdateEmployeeAdminCommand>
{
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(command: UpdateEmployeeAdminCommand): Promise<EmployeeDto> {
    const { employeeId, isAdmin, updatedBy } = command;

    const result = await this.employeeService.관리자권한변경한다(
      employeeId,
      isAdmin,
      updatedBy,
    );

    if (!result) {
      throw new NotFoundException(`직원을 찾을 수 없습니다. ID: ${employeeId}`);
    }

    return result;
  }
}
