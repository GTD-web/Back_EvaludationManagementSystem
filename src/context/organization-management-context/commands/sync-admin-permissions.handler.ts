import { EmployeeService } from '@domain/common/employee/employee.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';

/**
 * 관리자 권한 동기화 Command
 */
export class SyncAdminPermissionsCommand {
  constructor(public readonly updatedBy: string) {}
}

/**
 * 관리자 권한 동기화 결과
 */
export interface SyncAdminPermissionsResult {
  totalProcessed: number;
  updated: number;
  adminEmployees: string[];
  message: string;
}

/**
 * 관리자 권한 동기화 Handler
 *
 * 특정 직원만 isAccessible = true로 설정하고,
 * 나머지 직원은 isAccessible = false로 설정합니다.
 */
@Injectable()
@CommandHandler(SyncAdminPermissionsCommand)
export class SyncAdminPermissionsHandler
  implements
    ICommandHandler<SyncAdminPermissionsCommand, SyncAdminPermissionsResult>
{
  private readonly logger = new Logger(SyncAdminPermissionsHandler.name);

  // 관리자 권한을 가진 직원 이름 목록
  private readonly ADMIN_EMPLOYEE_NAMES = [
    '남명용',
    '이봉은',
    '우은진',
    '전무현',
    '우창욱',
    '김종식',
  ];

  constructor(private readonly employeeService: EmployeeService) {}

  async execute(
    command: SyncAdminPermissionsCommand,
  ): Promise<SyncAdminPermissionsResult> {
    this.logger.log('관리자 권한 동기화를 시작합니다...');

    // 모든 직원 조회 (제외된 직원 포함)
    const allEmployees = await this.employeeService.findAll(true);

    let updated = 0;
    const updatedEmployees: string[] = [];

    for (const employee of allEmployees) {
      const shouldBeAccessible = this.ADMIN_EMPLOYEE_NAMES.includes(
        employee.name,
      );

      // 현재 상태와 다르면 업데이트
      if (employee.isAccessible !== shouldBeAccessible) {
        employee.isAccessible = shouldBeAccessible;
        employee.updatedBy = command.updatedBy;

        await this.employeeService.save(employee);

        updated++;
        updatedEmployees.push(
          `${employee.name} (${employee.employeeNumber}): ${shouldBeAccessible ? '권한 부여' : '권한 제거'}`,
        );

        this.logger.log(
          `직원 ${employee.name} (${employee.employeeNumber}): isAccessible = ${shouldBeAccessible}`,
        );
      }
    }

    const result: SyncAdminPermissionsResult = {
      totalProcessed: allEmployees.length,
      updated,
      adminEmployees: this.ADMIN_EMPLOYEE_NAMES,
      message: `총 ${allEmployees.length}명 중 ${updated}명의 관리자 권한을 업데이트했습니다.`,
    };

    this.logger.log(
      `관리자 권한 동기화 완료: 총 ${allEmployees.length}명 처리, ${updated}명 업데이트`,
    );

    return result;
  }
}

