import { ProjectService } from '@domain/common/project/project.service';
import { ProjectManagerService } from '@domain/common/project/project-manager.service';
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
  CreateProjectManager,
  GetProjectManagerDetail,
  UpdateProjectManager,
  DeleteProjectManager,
  BulkRegisterProjectManagers,
} from '@interface/common/decorators/project/project-manager-api.decorators';
import {
  CreateProjectDto,
  CreateProjectsBulkDto,
  UpdateProjectDto,
  GetProjectListQueryDto,
  GetProjectManagersQueryDto,
  ProjectResponseDto,
  ProjectListResponseDto,
  ProjectManagerDto,
  ProjectsBulkCreateResponseDto,
  AvailableProjectManagerListResponseDto,
} from '@interface/common/dto/project/project.dto';
import {
  CreateProjectManagerDto as CreatePMDto,
  UpdateProjectManagerDto as UpdatePMDto,
  GetProjectManagersQueryDto as GetPMQueryDto,
  ProjectManagerResponseDto as PMResponseDto,
  ProjectManagerListResponseDto as PMListResponseDto,
} from '@interface/common/dto/project/project-manager.dto';
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
  Logger,
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
  private readonly logger = new Logger(ProjectManagementController.name);

  constructor(
    private readonly projectService: ProjectService,
    private readonly projectManagerService: ProjectManagerService,
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

    // realPMId가 있으면 Employee 조회하여 이름 가져오기
    let realPMName: string | undefined = undefined;
    if (createDto.realPMId) {
      const realPMEmployee = await this.employeeService.findById(
        createDto.realPMId,
      );
      if (realPMEmployee) {
        realPMName = realPMEmployee.name;
      } else {
        throw new NotFoundException(
          `실 PM ID ${createDto.realPMId}에 해당하는 직원을 찾을 수 없습니다.`,
        );
      }
    }

    const project = await this.projectService.생성한다(
      {
        name: createDto.name,
        projectCode: createDto.projectCode,
        status: createDto.status,
        startDate: createDto.startDate,
        endDate: createDto.endDate,
        managerId: createDto.managerId, // PM/DPM 설정
        realPM: realPMName, // 직원 이름 저장
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

    // 각 프로젝트의 realPMId를 이름으로 변환
    const projectsWithRealPMNames = await Promise.all(
      bulkDto.projects.map(async (projectDto) => {
        let realPMName: string | undefined = undefined;
        if (projectDto.realPMId) {
          const realPMEmployee = await this.employeeService.findById(
            projectDto.realPMId,
          );
          if (realPMEmployee) {
            realPMName = realPMEmployee.name;
          }
          // 일괄 생성에서는 에러를 던지지 않고 null로 처리
        }

        return {
          ...projectDto,
          realPM: realPMName,
        };
      }),
    );

    const result = await this.projectService.일괄_생성한다(
      projectsWithRealPMNames,
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
   * ProjectManager 테이블에 등록된 활성 PM들을 조회합니다.
   * 삭제된 PM은 목록에서 제외됩니다.
   * 주의: 구체적인 경로를 :id 경로보다 먼저 정의해야 함
   */
  @GetProjectManagers()
  async getProjectManagers(
    @Query() query: GetProjectManagersQueryDto,
  ): Promise<AvailableProjectManagerListResponseDto> {
    // 1. ProjectManager 테이블에 등록된 활성 PM들의 managerId 목록 조회
    const registeredPMs = await this.projectManagerService.목록_조회한다({
      page: 1,
      limit: 1000,
    });
    const activeManagerIds = registeredPMs.managers.map((pm) => pm.managerId);
    this.logger.debug(
      `[PM 목록 조회] 활성 PM 수: ${activeManagerIds.length}, IDs: ${JSON.stringify(activeManagerIds)}`,
    );

    // 2. SSO에서 전체 직원 정보 조회 (부서, 직책, 직급 포함)
    const employees = await this.ssoService.여러직원정보를조회한다({
      withDetail: true,
      includeTerminated: false, // 재직중인 직원만
    });
    this.logger.debug(`[PM 목록 조회] SSO 직원 수: ${employees.length}`);

    // 3. ProjectManager에 등록된 활성 PM만 필터링
    let managers = employees.filter((emp) => {
      const isRegisteredActivePM = activeManagerIds.includes(emp.id);

      this.logger.debug(
        `[PM 필터링] ${emp.name}(${emp.id}): active=${isRegisteredActivePM}`,
      );

      return isRegisteredActivePM;
    });

    this.logger.debug(`[PM 목록 조회] 필터링 후 PM 수: ${managers.length}`);

    // 중복 제거 (managerId 기준)
    const uniqueManagers = managers.filter(
      (emp, index, self) => index === self.findIndex((e) => e.id === emp.id),
    );
    managers = uniqueManagers;

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

    // realPMId가 있으면 Employee 조회하여 이름 가져오기
    let realPMName: string | undefined = undefined;
    if (updateDto.realPMId) {
      const realPMEmployee = await this.employeeService.findById(
        updateDto.realPMId,
      );
      if (realPMEmployee) {
        realPMName = realPMEmployee.name;
      } else {
        throw new NotFoundException(
          `실 PM ID ${updateDto.realPMId}에 해당하는 직원을 찾을 수 없습니다.`,
        );
      }
    }

    const project = await this.projectService.수정한다(
      id,
      {
        name: updateDto.name,
        projectCode: updateDto.projectCode,
        status: updateDto.status,
        startDate: updateDto.startDate,
        endDate: updateDto.endDate,
        managerId: updateDto.managerId, // PM/DPM 변경
        realPM: realPMName, // 직원 이름 저장
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
              errors.push(`[${parentProject.name}] ${errorMsg}`);
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

  // ==================== PM 관리 ====================

  /**
   * PM 일괄 등록
   * 하드코딩된 기본 PM 목록을 ProjectManager 테이블에 일괄 등록합니다.
   */
  @BulkRegisterProjectManagers()
  async bulkRegisterProjectManagers(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{
    success: number;
    skipped: number;
    failed: number;
    details: Array<{
      name: string;
      status: 'success' | 'skipped' | 'failed';
      reason?: string;
    }>;
  }> {
    const createdBy = user.id;

    // 하드코딩된 PM 이름 목록
    const HARDCODED_PM_NAMES = [
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
      '김종식',
      '김형중',
    ];

    this.logger.log(`[PM 일괄 등록 시작] 대상: ${HARDCODED_PM_NAMES.length}명`);

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const details: Array<{
      name: string;
      status: 'success' | 'skipped' | 'failed';
      reason?: string;
    }> = [];

    // SSO에서 전체 직원 정보 조회
    const employees = await this.ssoService.여러직원정보를조회한다({
      withDetail: true,
      includeTerminated: false,
    });

    for (const name of HARDCODED_PM_NAMES) {
      try {
        // 이름으로 SSO에서 직원 찾기
        const employee = employees.find((emp) => emp.name === name);

        if (!employee) {
          this.logger.warn(`[PM 일괄 등록] SSO에서 찾을 수 없음: ${name}`);
          failedCount++;
          details.push({
            name,
            status: 'failed',
            reason: 'SSO에서 찾을 수 없음',
          });
          continue;
        }

        // 이미 등록되어 있는지 확인
        const existing = await this.projectManagerService.managerId로_조회한다(
          employee.id,
        );

        if (existing) {
          this.logger.debug(`[PM 일괄 등록] 이미 등록됨: ${name}`);
          skippedCount++;
          details.push({
            name,
            status: 'skipped',
            reason: '이미 등록됨',
          });
          continue;
        }

        // Employee 조회 또는 생성
        let localEmployee = await this.employeeService.findByExternalId(
          employee.id,
        );
        if (!localEmployee) {
          localEmployee = await this.employeeService.create({
            externalId: employee.id,
            name: employee.name,
            email: employee.email,
            employeeNumber: employee.employeeNumber,
            departmentName: employee.department?.departmentName,
          });
        }

        // ProjectManager 등록
        await this.projectManagerService.생성한다(
          {
            managerId: employee.id,
            name: employee.name,
            email: employee.email,
            employeeNumber: employee.employeeNumber,
            departmentName: employee.department?.departmentName,
            isActive: true,
            note: '하드코딩 PM 일괄 등록',
          },
          createdBy,
        );

        this.logger.log(`[PM 일괄 등록] 등록 성공: ${name}`);
        successCount++;
        details.push({
          name,
          status: 'success',
        });
      } catch (error) {
        this.logger.error(
          `[PM 일괄 등록] 등록 실패: ${name}, error: ${error.message}`,
        );
        failedCount++;
        details.push({
          name,
          status: 'failed',
          reason: error.message,
        });
      }
    }

    this.logger.log(
      `[PM 일괄 등록 완료] 성공: ${successCount}, 스킵: ${skippedCount}, 실패: ${failedCount}`,
    );

    return {
      success: successCount,
      skipped: skippedCount,
      failed: failedCount,
      details,
    };
  }

  /**
   * PM 추가
   * PM으로 지정 가능한 직원을 추가합니다.
   */
  @CreateProjectManager()
  async createProjectManager(
    @Body() createDto: CreatePMDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PMResponseDto> {
    const createdBy = user.id;

    // employeeId로 직원 조회
    const employee = await this.employeeService.findById(createDto.employeeId);
    if (!employee) {
      throw new NotFoundException(
        `ID ${createDto.employeeId}에 해당하는 직원을 찾을 수 없습니다.`,
      );
    }

    // Employee 정보로 PM 생성
    const manager = await this.projectManagerService.생성한다(
      {
        managerId: employee.externalId, // SSO의 ID
        name: employee.name,
        email: employee.email,
        employeeNumber: employee.employeeNumber,
        departmentName: employee.departmentName,
        isActive: createDto.isActive,
        note: createDto.note,
      },
      createdBy,
    );
    return manager;
  }

  /**
   * PM 상세 조회
   * managerId(SSO ID)로 PM의 상세 정보를 조회합니다.
   */
  @GetProjectManagerDetail()
  async getProjectManagerDetail(
    @Param('managerId') managerId: string,
  ): Promise<PMResponseDto> {
    const manager =
      await this.projectManagerService.managerId로_조회한다(managerId);

    if (!manager) {
      throw new NotFoundException(
        `매니저 ID ${managerId}에 해당하는 PM을 찾을 수 없습니다.`,
      );
    }

    return manager;
  }

  /**
   * PM 수정
   * managerId(SSO ID)로 PM의 정보를 수정합니다.
   * - ProjectManager에 등록되지 않은 PM은 자동으로 등록 후 수정합니다.
   */
  @UpdateProjectManager()
  async updateProjectManager(
    @Param('managerId') managerId: string,
    @Body() updateDto: UpdatePMDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PMResponseDto> {
    const updatedBy = user.id;

    // 1. ProjectManager에 등록되어 있는지 확인
    const existingManager =
      await this.projectManagerService.managerId로_조회한다(managerId);

    if (!existingManager) {
      // 레코드가 없으면 SSO에서 조회하여 자동 등록
      const ssoEmployee = await this.ssoService.직원정보를조회한다({
        employeeId: managerId,
        withDetail: true,
      });

      if (!ssoEmployee) {
        throw new NotFoundException(
          `매니저 ID ${managerId}에 해당하는 직원을 찾을 수 없습니다.`,
        );
      }

      // Employee 조회 또는 생성
      let employee = await this.employeeService.findByExternalId(managerId);
      if (!employee) {
        employee = await this.employeeService.create({
          externalId: managerId,
          name: ssoEmployee.name,
          email: ssoEmployee.email,
          employeeNumber: ssoEmployee.employeeNumber,
          departmentName: ssoEmployee.department?.departmentName,
        });
      }

      // ProjectManager 자동 등록
      await this.projectManagerService.생성한다(
        {
          managerId: managerId,
          name: ssoEmployee.name,
          email: ssoEmployee.email,
          employeeNumber: ssoEmployee.employeeNumber,
          departmentName: ssoEmployee.department?.departmentName,
          isActive: true,
          note: '자동 등록된 PM',
        },
        updatedBy,
      );
    }

    // 2. 수정
    const manager = await this.projectManagerService.managerId로_수정한다(
      managerId,
      updateDto,
      updatedBy,
    );
    return manager;
  }

  /**
   * PM 삭제 (하드 삭제 - 실제 레코드 제거)
   * managerId(SSO ID)로 PM을 하드 삭제합니다.
   * 하드코딩된 12명 중 ProjectManager에 등록되지 않은 PM은 자동 등록 후 즉시 삭제합니다.
   */
  @DeleteProjectManager()
  async deleteProjectManager(
    @Param('managerId') managerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const deletedBy = user.id;
    this.logger.log(
      `[PM 삭제 시작] managerId: ${managerId}, deletedBy: ${deletedBy}`,
    );

    try {
      // 1. ProjectManager에 등록되어 있는지 확인 (삭제된 레코드 포함)
      // 먼저 하드 삭제를 시도하여 소프트 삭제된 레코드도 완전히 제거
      this.logger.log(`[PM 삭제] 하드 삭제 시도`);

      try {
        await this.projectManagerService.managerId로_하드_삭제한다(managerId);
        this.logger.log(`[PM 삭제 완료] managerId: ${managerId}`);
        return;
      } catch (error) {
        // NotFoundException인 경우 레코드가 없는 것이므로 계속 진행
        if (error instanceof NotFoundException) {
          this.logger.debug(
            `[PM 삭제] ProjectManager에 레코드 없음. 자동 등록 후 삭제 진행`,
          );
        } else {
          throw error;
        }
      }

      // 2. 레코드가 없으면 SSO에서 조회하여 자동 등록 후 즉시 삭제
      this.logger.log(
        `[PM 삭제] ProjectManager에 없음. SSO에서 조회하여 자동 등록 후 삭제`,
      );
      const ssoEmployee = await this.ssoService.직원정보를조회한다({
        employeeId: managerId,
        withDetail: true,
      });

      if (!ssoEmployee) {
        throw new NotFoundException(
          `매니저 ID ${managerId}에 해당하는 직원을 찾을 수 없습니다.`,
        );
      }

      this.logger.debug(`[PM 삭제] SSO 직원 조회 성공: ${ssoEmployee.name}`);

      // Employee 조회 또는 생성
      let employee = await this.employeeService.findByExternalId(managerId);
      if (!employee) {
        this.logger.debug(`[PM 삭제] Employee 생성`);
        employee = await this.employeeService.create({
          externalId: managerId,
          name: ssoEmployee.name,
          email: ssoEmployee.email,
          employeeNumber: ssoEmployee.employeeNumber,
          departmentName: ssoEmployee.department?.departmentName,
        });
      }

      // ProjectManager 자동 등록
      this.logger.log(`[PM 삭제] ProjectManager 자동 등록`);
      await this.projectManagerService.생성한다(
        {
          managerId: managerId,
          name: ssoEmployee.name,
          email: ssoEmployee.email,
          employeeNumber: ssoEmployee.employeeNumber,
          departmentName: ssoEmployee.department?.departmentName,
          isActive: true,
          note: '하드코딩 PM 삭제를 위해 자동 등록',
        },
        deletedBy,
      );

      // 3. 즉시 하드 삭제
      this.logger.log(`[PM 삭제] 자동 등록 후 즉시 하드 삭제 실행`);
      await this.projectManagerService.managerId로_하드_삭제한다(managerId);
      this.logger.log(`[PM 삭제 완료] managerId: ${managerId}`);
    } catch (error) {
      this.logger.error(
        `[PM 삭제 에러] managerId: ${managerId}, error: ${error.message}`,
      );

      // 다른 에러는 그대로 throw
      throw error;
    }
  }
}
