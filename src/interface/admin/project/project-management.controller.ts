import { ProjectService } from '@domain/common/project/project.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import {
  CreateProject,
  CreateProjectsBulk,
  GetProjectList,
  GetProjectDetail,
  UpdateProject,
  DeleteProject,
  GetProjectManagers,
} from '@interface/common/decorators/project/project-api.decorators';
import {
  CreateProjectDto,
  CreateProjectsBulkDto,
  UpdateProjectDto,
  GetProjectListQueryDto,
  GetProjectManagersQueryDto,
  ProjectResponseDto,
  ProjectListResponseDto,
  ProjectManagerListResponseDto,
  ProjectManagerDto,
  ProjectsBulkCreateResponseDto,
} from '@interface/common/dto/project/project.dto';
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Query,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SSOService } from '@domain/common/sso/sso.module';
import type { ISSOService } from '@domain/common/sso/interfaces';

/**
 * 프로젝트 관리 컨트롤러
 *
 * 프로젝트의 CRUD 기능을 제공합니다.
 * 프로젝트 생성 시 PM(Project Manager)도 함께 설정할 수 있습니다.
 */
@ApiTags('B-0. 관리자 - 프로젝트 관리')
@ApiBearerAuth('Bearer')
@Controller('admin/projects')
export class ProjectManagementController {
  constructor(
    private readonly projectService: ProjectService,
    @Inject(SSOService) private readonly ssoService: ISSOService,
  ) {}

  /**
   * 프로젝트 생성
   * PM(Project Manager)을 함께 설정할 수 있습니다.
   */
  @CreateProject()
  async createProject(
    @Body() createDto: CreateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto> {
    const createdBy = user.id;
    const project = await this.projectService.생성한다(
      {
        name: createDto.name,
        projectCode: createDto.projectCode,
        status: createDto.status,
        startDate: createDto.startDate,
        endDate: createDto.endDate,
        managerId: createDto.managerId, // PM 설정
      },
      createdBy,
    );

    return {
      id: project.id,
      name: project.name,
      projectCode: project.projectCode,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      manager: project.manager,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt,
      isActive: project.isActive,
      isCompleted: project.isCompleted,
      isCancelled: project.isCancelled,
    };
  }

  /**
   * 프로젝트 일괄 생성
   * 여러 프로젝트를 한 번에 생성하며, 각 프로젝트별 PM을 개별 설정할 수 있습니다.
   * 일부 프로젝트 생성 실패 시에도 성공한 프로젝트는 저장됩니다.
   */
  @CreateProjectsBulk()
  async createProjectsBulk(
    @Body() bulkDto: CreateProjectsBulkDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectsBulkCreateResponseDto> {
    const createdBy = user.id;

    const result = await this.projectService.일괄_생성한다(
      bulkDto.projects,
      createdBy,
    );

    return {
      success: result.success.map((project) => ({
        id: project.id,
        name: project.name,
        projectCode: project.projectCode,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        managerId: project.managerId,
        manager: project.manager,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        deletedAt: project.deletedAt,
        isActive: project.isActive,
        isCompleted: project.isCompleted,
        isCancelled: project.isCancelled,
      })),
      failed: result.failed,
      successCount: result.success.length,
      failedCount: result.failed.length,
      totalCount: bulkDto.projects.length,
    };
  }

  /**
   * 프로젝트 목록 조회
   */
  @GetProjectList()
  async getProjectList(
    @Query() query: GetProjectListQueryDto,
  ): Promise<ProjectListResponseDto> {
    const result = await this.projectService.목록_조회한다({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      filter: {
        status: query.status,
        managerId: query.managerId,
        startDateFrom: query.startDateFrom,
        startDateTo: query.startDateTo,
        endDateFrom: query.endDateFrom,
        endDateTo: query.endDateTo,
      },
    });

    const totalPages = Math.ceil(result.total / result.limit);

    return {
      projects: result.projects.map((project) => ({
        id: project.id,
        name: project.name,
        projectCode: project.projectCode,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        manager: project.manager,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        deletedAt: project.deletedAt,
        isActive: project.isActive,
        isCompleted: project.isCompleted,
        isCancelled: project.isCancelled,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages,
    };
  }

  /**
   * PM(프로젝트 매니저) 목록 조회
   * SSO 서비스에서 관리 권한이 있는 직원 목록을 조회합니다.
   * 주의: 구체적인 경로를 :id 경로보다 먼저 정의해야 함
   */
  @GetProjectManagers()
  async getProjectManagers(
    @Query() query: GetProjectManagersQueryDto,
  ): Promise<ProjectManagerListResponseDto> {
    // SSO에서 전체 직원 정보 조회 (부서, 직책, 직급 포함)
    const employees = await this.ssoService.여러직원정보를조회한다({
      withDetail: true,
      includeTerminated: false, // 재직중인 직원만
    });

    // 관리 권한이 있는 직원만 필터링
    let managers = employees.filter(
      (emp) => emp.position?.hasManagementAuthority === true,
    );

    // 부서 필터링
    if (query.departmentId) {
      managers = managers.filter(
        (emp) => emp.department?.id === query.departmentId,
      );
    }

    // 검색어 필터링 (이름, 사번, 이메일)
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      managers = managers.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchLower) ||
          emp.employeeNumber.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower),
      );
    }

    // DTO 변환
    const managerDtos: ProjectManagerDto[] = managers.map((emp) => ({
      id: emp.id,
      employeeNumber: emp.employeeNumber,
      name: emp.name,
      email: emp.email,
      departmentName: emp.department?.departmentName,
      departmentCode: emp.department?.departmentCode,
      positionName: emp.position?.positionName,
      positionLevel: emp.position?.positionLevel,
      jobTitleName: emp.jobTitle?.jobTitleName,
      hasManagementAuthority: emp.position?.hasManagementAuthority,
    }));

    return {
      managers: managerDtos,
      total: managerDtos.length,
    };
  }

  /**
   * 프로젝트 상세 조회
   * 주의: 파라미터 경로(:id)는 구체적인 경로들 뒤에 배치해야 함
   */
  @GetProjectDetail()
  async getProjectDetail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectService.ID로_조회한다(id);

    if (!project) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`,
      );
    }

    return {
      id: project.id,
      name: project.name,
      projectCode: project.projectCode,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: project.managerId,
      manager: project.manager,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt,
      isActive: project.isActive,
      isCompleted: project.isCompleted,
      isCancelled: project.isCancelled,
    };
  }

  /**
   * 프로젝트 수정
   * PM(Project Manager) 변경도 가능합니다.
   */
  @UpdateProject()
  async updateProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectResponseDto> {
    const updatedBy = user.id;

    const project = await this.projectService.수정한다(
      id,
      {
        name: updateDto.name,
        projectCode: updateDto.projectCode,
        status: updateDto.status,
        startDate: updateDto.startDate,
        endDate: updateDto.endDate,
        managerId: updateDto.managerId, // PM 변경
      },
      updatedBy,
    );

    return {
      id: project.id,
      name: project.name,
      projectCode: project.projectCode,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      manager: project.manager,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt,
      isActive: project.isActive,
      isCompleted: project.isCompleted,
      isCancelled: project.isCancelled,
    };
  }

  /**
   * 프로젝트 삭제 (소프트 삭제)
   */
  @DeleteProject()
  async deleteProject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const deletedBy = user.id;
    await this.projectService.삭제한다(id, deletedBy);
  }
}
