import {
  DepartmentHierarchyDto,
  DepartmentHierarchyWithEmployeesDto,
  EmployeeSyncService,
  OrganizationManagementService,
} from '@context/organization-management-context';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { CurrentUser, ParseId, Roles } from '@interface/common/decorators';
import {
  ExcludeEmployeeFromList,
  GetAllEmployees,
  GetDepartmentHierarchy,
  GetDepartmentHierarchyWithEmployees,
  GetExcludedEmployees,
  GetPartLeaders,
  IncludeEmployeeInList,
  SyncEmployees,
  SyncAdminPermissions,
  UpdateEmployeeAdmin,
  BulkUpdateEmployeeAdmin,
} from '@interface/common/decorators/employee-management/employee-management-api.decorators';
import {
  EmployeeResponseDto,
  ExcludeEmployeeFromListDto,
  GetEmployeesQueryDto,
  GetPartLeadersQueryDto,
  PartLeadersResponseDto,
} from '@interface/common/dto/employee-management/employee-management.dto';
import {
  BulkUpdateEmployeeAdminDto,
  BulkUpdateEmployeeAdminResponseDto,
} from '@interface/common/dto/employee-management/bulk-update-employee-admin.dto';
import type { AuthenticatedUser } from '@interface/common/guards';
import {
  Body,
  Controller,
  DefaultValuePipe,
  ParseBoolPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { EmployeeSyncResult } from '@domain/common/employee/employee.types';

/**
 * 관리자용 직원 관리 컨트롤러
 *
 * 직원 조회 제외/포함 설정 등 관리자 권한이 필요한
 * 직원 관리 기능을 제공합니다.
 */
@ApiTags('A-1. 관리자 - 조직 관리')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/employees')
export class EmployeeManagementController {
  constructor(
    private readonly organizationManagementService: OrganizationManagementService,
    private readonly employeeSyncService: EmployeeSyncService,
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
    @Query('includeExcluded', ParseBoolPipe) includeExcluded: boolean,
  ): Promise<EmployeeDto[]> {
    // departmentId와 includeExcluded 옵션을 전달하여 조회
    return await this.organizationManagementService.전체직원목록조회(
      includeExcluded,
      query.departmentId,
    );
  }

  /**
   * 조회에서 제외된 직원 목록을 조회합니다.
   */
  @GetExcludedEmployees()
  async getExcludedEmployees(): Promise<EmployeeDto[]> {
    // 제외된 직원만 필터링하여 조회 (includeExcluded: true로 전체 조회 후 필터링)
    const allEmployees =
      await this.organizationManagementService.전체직원목록조회(true);
    return allEmployees.filter((employee) => employee.isExcludedFromList);
  }

  /**
   * 파트장 목록을 조회합니다.
   */
  @GetPartLeaders()
  async getPartLeaders(
    @Query() query: GetPartLeadersQueryDto,
  ): Promise<PartLeadersResponseDto> {
    const partLeaders = await this.employeeSyncService.getPartLeaders(
      query.forceRefresh || false,
    );
    const partLeadersDto = partLeaders.map((employee) => {
      const dto = employee.DTO로_변환한다();
      // EmployeeDto를 EmployeeResponseDto로 변환 (null을 undefined로 변환)
      return {
        id: dto.id,
        employeeNumber: dto.employeeNumber,
        name: dto.name,
        email: dto.email,
        rankName: dto.rankName,
        rankCode: dto.rankCode,
        rankLevel: dto.rankLevel,
        departmentName: dto.departmentName,
        departmentCode: dto.departmentCode,
        isActive: dto.isActive,
        isExcludedFromList: dto.isExcludedFromList,
        excludeReason: dto.excludeReason ?? undefined,
        excludedBy: dto.excludedBy ?? undefined,
        excludedAt: dto.excludedAt ?? undefined,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        isAccessible: dto.isAccessible,
      };
    });
    return {
      partLeaders: partLeadersDto as EmployeeResponseDto[],
      count: partLeadersDto.length,
    };
  }

  // ==================== PATCH: 부분 수정 ====================

  /**
   * 직원을 조회 목록에서 제외합니다.
   */
  @ExcludeEmployeeFromList()
  async excludeEmployeeFromList(
    @ParseId() employeeId: string,
    @Body() excludeData: ExcludeEmployeeFromListDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeDto> {
    return await this.organizationManagementService.직원조회제외(
      employeeId,
      excludeData.excludeReason,
      user.id,
    );
  }

  /**
   * 직원을 조회 목록에 포함합니다.
   */
  @IncludeEmployeeInList()
  async includeEmployeeInList(
    @ParseId() employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeDto> {
    return await this.organizationManagementService.직원조회포함(
      employeeId,
      user.id,
    );
  }

  /**
   * 직원의 관리자 권한을 변경합니다.
   */
  @UpdateEmployeeAdmin()
  async updateEmployeeAdmin(
    @ParseId() employeeId: string,
    @Query('isAdmin', new DefaultValuePipe(false), ParseBoolPipe)
    isAdmin: boolean,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeDto> {
    return await this.organizationManagementService.직원관리자권한변경(
      employeeId,
      isAdmin,
      user.id,
    );
  }

  /**
   * 여러 직원의 관리자 권한을 일괄 변경합니다.
   */
  @BulkUpdateEmployeeAdmin()
  async bulkUpdateEmployeeAdmin(
    @Body() bulkUpdateData: BulkUpdateEmployeeAdminDto,
    @Query('isAdmin', new DefaultValuePipe(false), ParseBoolPipe)
    isAdmin: boolean,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BulkUpdateEmployeeAdminResponseDto> {
    const result =
      await this.organizationManagementService.여러직원관리자권한변경(
        bulkUpdateData.employeeIds,
        isAdmin,
        user.id,
      );

    return {
      success: result.failed === 0,
      totalProcessed: result.totalProcessed,
      succeeded: result.succeeded,
      failed: result.failed,
      failedIds: result.failedIds,
      errors: result.errors,
      processedAt: new Date(),
    };
  }

  // ==================== POST: 생성/동기화 ====================

  /**
   * SSO에서 직원 데이터를 동기화합니다.
   */
  @SyncEmployees()
  async syncEmployees(
    @Query('forceSync', new DefaultValuePipe(false), ParseBoolPipe)
    forceSync: boolean,
  ): Promise<EmployeeSyncResult> {
    return await this.employeeSyncService.syncEmployees(forceSync);
  }

  /**
   * 관리자 권한을 동기화합니다.
   * 특정 직원만 isAccessible = true로 설정하고, 나머지는 false로 설정합니다.
   */
  @SyncAdminPermissions()
  async syncAdminPermissions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    totalProcessed: number;
    updated: number;
    adminEmployees: string[];
    message: string;
  }> {
    return await this.organizationManagementService.관리자권한동기화(user.id);
  }
}
