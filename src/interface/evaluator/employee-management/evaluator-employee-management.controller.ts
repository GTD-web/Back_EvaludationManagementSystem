import {
  DepartmentHierarchyDto,
  DepartmentHierarchyWithEmployeesDto,
} from '@context/organization-management-context/interfaces/organization-management-context.interface';
import { OrganizationManagementService } from '@context/organization-management-context/organization-management.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import {
  GetAllEmployees,
  GetDepartmentHierarchy,
  GetDepartmentHierarchyWithEmployees,
} from '@interface/common/decorators/employee-management/employee-management-api.decorators';
import { GetEmployeesQueryDto } from '@interface/common/dto/employee-management/employee-management.dto';
import { Roles } from '@interface/common/decorators';
import { Controller, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * 평가자용 직원 관리 컨트롤러
 *
 * 직원 조회 제외/포함 설정 등 평가자 권한이 필요한
 * 직원 관리 기능을 제공합니다.
 */
@ApiTags('A-1. 평가자 - 조직 관리')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/employees')
export class EvaluatorEmployeeManagementController {
  constructor(
    private readonly organizationManagementService: OrganizationManagementService,
  ) {}

  // ==================== GET: 조회 ====================

  /**
   * 부서 하이라키 구조를 조회합니다.
   */
  @GetDepartmentHierarchy()
  async getDepartmentHierarchy(): Promise<DepartmentHierarchyDto[]> {
    return await this.organizationManagementService.부서하이라키조회();
  }

  /**
   * 직원 목록을 포함한 부서 하이라키 구조를 조회합니다.
   */
  @GetDepartmentHierarchyWithEmployees()
  async getDepartmentHierarchyWithEmployees(): Promise<
    DepartmentHierarchyWithEmployeesDto[]
  > {
    return await this.organizationManagementService.부서하이라키_직원포함_조회();
  }

  /**
   * 전체 직원 목록을 조회합니다.
   */
  @GetAllEmployees()
  async getAllEmployees(
    @Query() query: GetEmployeesQueryDto,
  ): Promise<EmployeeDto[]> {
    // departmentId와 includeExcluded 옵션을 전달하여 조회
    return await this.organizationManagementService.전체직원목록조회(
      query.includeExcluded || false,
      query.departmentId,
    );
  }
}
