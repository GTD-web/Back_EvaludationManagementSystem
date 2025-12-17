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
  GenerateChildProjects,
} from '@interface/common/decorators/project/project-api.decorators';
import { DeleteChildProjects } from '@interface/common/decorators/project/delete-child-projects-api.decorator';
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
  GenerateChildProjectsDto,
  GenerateChildProjectsResultDto,
  GenerateChildProjectDetailDto,
} from '@interface/common/dto/project/generate-child-projects.dto';
import {
  DeleteChildProjectsDto,
  DeleteChildProjectsResultDto,
} from '@interface/common/dto/project/delete-child-projects.dto';
import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Query,
  NotFoundException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@interface/common/decorators';
import { SSOService } from '@domain/common/sso/sso.module';
import type { ISSOService } from '@domain/common/sso/interfaces';
import { EmployeeService } from '@domain/common/employee/employee.service';

/**
 * 프로젝트 관리 컨트롤러
 *
 * 프로젝트의 CRUD 기능을 제공합니다.
 * 프로젝트 생성 시 PM(Project Manager)도 함께 설정할 수 있습니다.
 */
@ApiTags('B-0. 관리자 - 프로젝트 관리')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/projects')
export class ProjectManagementController {
  constructor(
    private readonly projectService: ProjectService,
    @Inject(SSOService) private readonly ssoService: ISSOService,
    private readonly employeeService: EmployeeService,
  ) {}

  /**
   * 프로젝트 생성
   * PM(Project Manager)을 함께 설정할 수 있습니다.
   * 하위 프로젝트 생성 시 parentProjectId를 지정합니다.
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
        managerId: createDto.managerId, // PM/DPM 설정
        parentProjectId: createDto.parentProjectId, // 하위 프로젝트인 경우
        childProjects: createDto.childProjects, // 하위 프로젝트 목록
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
      managerId: project.managerId,
      manager: project.manager,
      parentProjectId: project.parentProjectId,
      childProjects: project.childProjects, // 하위 프로젝트 포함
      childProjectCount: project.childProjects?.length,
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
        parentProjectId: project.parentProjectId,
        childProjects: project.childProjects?.map((child) =>
          this.mapProjectToResponseDto(child),
        ),
        childProjectCount: project.childProjectCount,
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
   * 프로젝트 DTO를 재귀적으로 매핑하는 헬퍼 함수
   * childProjects를 모든 레벨에서 재귀적으로 매핑합니다.
   */
  private mapProjectToResponseDto(project: any): any {
    return {
      id: project.id,
      name: project.name,
      projectCode: project.projectCode,
      status: project.status,
      managerId: project.managerId,
      manager: project.manager,
      childProjects: project.childProjects?.map((child) =>
        this.mapProjectToResponseDto(child),
      ), // ✅ 재귀 호출
    };
  }

  /**
   * 프로젝트 목록 조회
   * 계층 구조 필터링을 지원합니다.
   * hierarchyLevel이 지정되지 않으면 기본적으로 계층 구조로 반환합니다.
   */
  @GetProjectList()
  async getProjectList(
    @Query() query: GetProjectListQueryDto,
  ): Promise<ProjectListResponseDto> {
    // hierarchyLevel이 'child'이거나 특정 parentProjectId로 필터링하는 경우 flat 조회
    const useHierarchy =
      !query.hierarchyLevel ||
      (query.hierarchyLevel !== 'child' && !query.parentProjectId);

    let result;

    if (useHierarchy) {
      // 계층 구조로 조회 (상위 프로젝트 + 하위 nested)
      result = await this.projectService.계층구조_목록_조회한다({
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
          search: query.search,
        },
      });
    } else {
      // Flat 조회 (하위 프로젝트만 또는 특정 parentProjectId)
      result = await this.projectService.목록_조회한다({
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
          parentProjectId: query.parentProjectId,
          hierarchyLevel: query.hierarchyLevel,
          search: query.search,
        },
      });
    }

    const totalPages = Math.ceil(result.total / result.limit);

    return {
      projects: result.projects.map((project) => ({
        id: project.id,
        name: project.name,
        projectCode: project.projectCode,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        managerId: project.managerId,
        manager: project.manager,
        parentProjectId: project.parentProjectId,
        childProjects: project.childProjects?.map((child) =>
          this.mapProjectToResponseDto(child),
        ), // ✅ 재귀 매핑
        childProjectCount: project.childProjectCount,
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
    // PM으로 지정 가능한 직원 이름 목록
    const ALLOWED_PM_NAMES = [
      '남명용',
      '김경민',
      '홍연창',
      '강남규',
      '전구영',
      '고영훈',
      '박일수',
      '모현민',
      '하태식',
      '정석화',
      '이봉은',
    ];

    // SSO에서 전체 직원 정보 조회 (부서, 직책, 직급 포함)
    const employees = await this.ssoService.여러직원정보를조회한다({
      withDetail: true,
      includeTerminated: false, // 재직중인 직원만
    });

    // 허용된 PM 이름 목록으로 필터링 (관리 권한 무관)
    let managers = employees.filter((emp) =>
      ALLOWED_PM_NAMES.includes(emp.name),
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

    // DTO 변환 (externalId로 Employee 조회하여 employeeId 매핑)
    const managerDtos: ProjectManagerDto[] = await Promise.all(
      managers.map(async (emp) => {
        // SSO의 emp.id(externalId)로 로컬 Employee 조회
        const employee = await this.employeeService.findByExternalId(emp.id);

        return {
          managerId: emp.id, // SSO의 매니저 ID
          employeeId: employee?.id, // 로컬 Employee ID
          employeeNumber: emp.employeeNumber,
          name: emp.name,
          email: emp.email,
          departmentName: emp.department?.departmentName,
          departmentCode: emp.department?.departmentCode,
          positionName: emp.position?.positionName,
          positionLevel: emp.position?.positionLevel,
          jobTitleName: emp.jobTitle?.jobTitleName,
          hasManagementAuthority: emp.position?.hasManagementAuthority,
        };
      }),
    );

    return {
      managers: managerDtos,
      total: managerDtos.length,
    };
  }

  /**
   * 프로젝트 상세 조회
   * 하위 프로젝트 목록을 포함하여 반환합니다.
   * 주의: 파라미터 경로(:id)는 구체적인 경로들 뒤에 배치해야 함
   */
  @GetProjectDetail()
  async getProjectDetail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectService.ID로_조회한다(id, true); // 하위 프로젝트 포함

    if (!project) {
      throw new NotFoundException(
        `ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`,
      );
    }

    // 하위 프로젝트 수 조회
    const childProjectCount = project.childProjects?.length || 0;

    return {
      id: project.id,
      name: project.name,
      projectCode: project.projectCode,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: project.managerId,
      manager: project.manager,
      parentProjectId: project.parentProjectId,
      childProjects: project.childProjects?.map((child) => ({
        id: child.id,
        name: child.name,
        projectCode: child.projectCode,
        status: child.status,
        managerId: child.managerId,
        manager: child.manager,
      })),
      childProjectCount,
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
   * 상위 프로젝트 변경도 가능합니다.
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
        managerId: updateDto.managerId, // PM/DPM 변경
        parentProjectId: updateDto.parentProjectId, // 상위 프로젝트 변경
        childProjects: updateDto.childProjects, // 하위 프로젝트 재생성
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
      managerId: project.managerId,
      manager: project.manager,
      parentProjectId: project.parentProjectId,
      childProjects: project.childProjects, // 하위 프로젝트 포함
      childProjectCount: project.childProjects?.length,
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

  /**
   * 하위 프로젝트 자동 생성
   * 모든 상위 프로젝트에 하위 프로젝트를 일괄 생성합니다.
   */
  @GenerateChildProjects()
  async generateChildProjects(
    @Body() dto: GenerateChildProjectsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GenerateChildProjectsResultDto> {
    const startTime = Date.now();
    const createdBy = user.id;

    try {
      // 1. 모든 상위 프로젝트 조회
      const parentProjects = await this.projectService.목록_조회한다({
        page: 1,
        limit: 1000, // 충분히 큰 수
        filter: {
          hierarchyLevel: 'parent',
        },
      });

      let totalChildCreated = 0;
      let skippedCount = 0;
      let failedCount = 0;
      const details: GenerateChildProjectDetailDto[] = [];
      const errors: string[] = [];

      // 2. 각 상위 프로젝트에 하위 프로젝트 생성
      for (const parentProject of parentProjects.projects) {
        const detail: GenerateChildProjectDetailDto = {
          parentProjectId: parentProject.id,
          parentProjectName: parentProject.name,
          childrenCreated: 0,
          skipped: false,
          errors: [],
        };

        try {
          // 이미 하위 프로젝트가 있는지 확인
          const existingChildren =
            await this.projectService.하위_프로젝트_목록_조회한다(
              parentProject.id,
            );

          if (existingChildren.length > 0 && dto.skipIfExists !== false) {
            detail.skipped = true;
            skippedCount++;
            details.push(detail);
            continue;
          }

          // 재귀적으로 하위 프로젝트 생성 (1차 -> 2차 -> 3차 -> 4차 -> 5차)
          const totalDepth = dto.childCountPerProject || 5; // 기본 5단계
          let currentParentId = parentProject.id;
          const topLevelProjectName = parentProject.name; // ✅ 최상위 이름 저장
          const topLevelProjectCode = parentProject.projectCode; // ✅ 최상위 코드 저장

          // 각 단계별로 1개씩 생성하여 체인 구조 만들기
          for (let level = 1; level <= totalDepth; level++) {
            try {
              const childProject = await this.projectService.생성한다(
                {
                  name: `${topLevelProjectName} - ${level}차 하위 프로젝트`, // ✅ 최상위 이름 사용
                  projectCode: `${topLevelProjectCode}-SUB${level}`, // ✅ 최상위 코드 사용
                  status: parentProject.status,
                  startDate: parentProject.startDate,
                  endDate: parentProject.endDate,
                  managerId: parentProject.managerId,
                  parentProjectId: currentParentId,
                },
                createdBy,
              );

              detail.childrenCreated++;
              totalChildCreated++;

              // 다음 단계의 부모는 현재 생성한 프로젝트의 ID만 업데이트
              currentParentId = childProject.id;
            } catch (error) {
              const errorMsg = `${level}차 하위 생성 실패: ${error.message}`;
              detail.errors = detail.errors || [];
              detail.errors.push(errorMsg);
              errors.push(
                `[${parentProject.name}] ${errorMsg}`,
              );
              failedCount++;
              break; // 실패하면 더 이상 진행하지 않음
            }
          }

          details.push(detail);
        } catch (error) {
          const errorMsg = `프로젝트 처리 실패: ${error.message}`;
          detail.errors = [errorMsg];
          errors.push(`[${parentProject.name}] ${errorMsg}`);
          details.push(detail);
        }
      }

      const duration = (Date.now() - startTime) / 1000;

      return {
        success: true,
        processedParentProjects: parentProjects.total,
        skippedParentProjects: skippedCount,
        totalChildProjectsCreated: totalChildCreated,
        failedChildProjects: failedCount,
        details,
        errors: errors.length > 0 ? errors : undefined,
        duration,
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      return {
        success: false,
        processedParentProjects: 0,
        skippedParentProjects: 0,
        totalChildProjectsCreated: 0,
        failedChildProjects: 0,
        errors: [error.message],
        duration,
      };
    }
  }

  /**
   * 하위 프로젝트 일괄 삭제
   * 자동 생성된 모든 하위 프로젝트를 일괄 삭제합니다.
   */
  @DeleteChildProjects()
  async deleteChildProjects(
    @Body() dto: DeleteChildProjectsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeleteChildProjectsResultDto> {
    const deletedBy = user.id;

    const result = await this.projectService.하위_프로젝트들_일괄_삭제한다(
      dto.forceDelete ?? false,
      dto.hardDelete ?? false,
      deletedBy,
    );

    return result;
  }
}
