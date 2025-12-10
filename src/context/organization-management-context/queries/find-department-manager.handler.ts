import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { DepartmentService } from '../../../domain/common/department/department.service';

/**
 * 부서장 조회 쿼리
 */
export class FindDepartmentManagerQuery implements IQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 부서장 조회 쿼리 핸들러
 *
 * 직원의 1차 평가자(부서장)를 찾는다
 * 1. 직원의 부서 조회
 * 2. 부서의 managerId 확인
 * 3. managerId가 없거나 본인인 경우 상위 부서의 managerId 확인 (최대 3단계)
 * 4. managerId가 Employee 테이블에 실제 존재하는지 검증
 * 5. 모두 없으면 null 반환
 */
@QueryHandler(FindDepartmentManagerQuery)
@Injectable()
export class FindDepartmentManagerHandler
  implements IQueryHandler<FindDepartmentManagerQuery, string | null>
{
  private readonly logger = new Logger(FindDepartmentManagerHandler.name);

  constructor(
    private readonly employeeService: EmployeeService,
    private readonly departmentService: DepartmentService,
  ) {}

  async execute(query: FindDepartmentManagerQuery): Promise<string | null> {
    const { employeeId } = query;

    this.logger.log(`부서장 조회 시작 - 직원: ${employeeId}`);

    try {
      // 1. 직원 정보 조회
      const employee = await this.employeeService.findById(employeeId);
      if (!employee) {
        this.logger.warn(`직원을 찾을 수 없습니다: ${employeeId}`);
        return null;
      }

      // 2. 직원의 부서 조회
      if (!employee.departmentId) {
        this.logger.warn(`직원의 부서가 설정되지 않았습니다: ${employeeId}`);
        return null;
      }

      const department = await this.departmentService.findById(
        employee.departmentId,
      );
      if (!department) {
        this.logger.warn(`부서를 찾을 수 없습니다: ${employee.departmentId}`);
        return null;
      }

      // 3. 부서장 찾기 (최대 3단계 상위 부서까지 확인)
      const managerId = await this.부서장을_찾는다(employeeId, department, 0);

      if (managerId) {
        this.logger.log(
          `부서장 찾기 성공 - 직원: ${employeeId}, 부서장: ${managerId}`,
        );
      } else {
        this.logger.warn(`부서장을 찾을 수 없습니다 - 직원: ${employeeId}`);
      }

      return managerId;
    } catch (error) {
      this.logger.error(`부서장 조회 실패 - 직원: ${employeeId}`, error.stack);
      throw error;
    }
  }

  /**
   * 부서장을 찾는다 (재귀적으로 상위 부서까지 확인)
   * @param employeeId 직원 ID
   * @param department 현재 부서
   * @param level 현재 레벨 (최대 3단계)
   * @returns 부서장 ID 또는 null
   */
  private async 부서장을_찾는다(
    employeeId: string,
    department: any,
    level: number,
  ): Promise<string | null> {
    // 최대 3단계까지만 확인
    if (level >= 3) {
      this.logger.warn(
        `최대 레벨(3)에 도달했습니다 - 직원: ${employeeId}, 레벨: ${level}`,
      );
      return null;
    }

    // 부서의 managerId 확인
    if (!department.managerId) {
      this.logger.debug(
        `부서에 managerId가 없습니다 - 부서: ${department.id}, 레벨: ${level}`,
      );

      // 상위 부서가 있으면 상위 부서 확인
      if (department.parentDepartmentId) {
        const parentDepartment = await this.departmentService.findByExternalId(
          department.parentDepartmentId,
        );
        if (parentDepartment) {
          return await this.부서장을_찾는다(
            employeeId,
            parentDepartment,
            level + 1,
          );
        }
      }

      return null;
    }

    // 본인이 부서장인 경우 상위 부서 확인
    if (department.managerId === employeeId) {
      this.logger.debug(
        `본인이 부서장입니다 - 직원: ${employeeId}, 부서: ${department.id}, 레벨: ${level}`,
      );

      // 상위 부서가 있으면 상위 부서의 부서장 확인
      if (department.parentDepartmentId) {
        const parentDepartment = await this.departmentService.findByExternalId(
          department.parentDepartmentId,
        );
        if (parentDepartment) {
          return await this.부서장을_찾는다(
            employeeId,
            parentDepartment,
            level + 1,
          );
        }
      }

      return null;
    }

    // managerId가 실제 직원으로 존재하는지 확인
    const manager = await this.employeeService.findById(department.managerId);
    if (!manager) {
      this.logger.warn(
        `부서장이 Employee 테이블에 존재하지 않습니다 - managerId: ${department.managerId}, 부서: ${department.id}`,
      );

      // 상위 부서가 있으면 상위 부서 확인
      if (department.parentDepartmentId) {
        const parentDepartment = await this.departmentService.findByExternalId(
          department.parentDepartmentId,
        );
        if (parentDepartment) {
          return await this.부서장을_찾는다(
            employeeId,
            parentDepartment,
            level + 1,
          );
        }
      }

      return null;
    }

    // 부서장 찾기 성공
    return department.managerId;
  }
}
