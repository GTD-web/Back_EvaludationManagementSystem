import { ProjectService } from '@domain/common/project/project.service';
import {
  GetProjectList,
  GetProjectDetail,
} from '@interface/common/decorators/project/project-api.decorators';
import {
  GetProjectListQueryDto,
  ProjectResponseDto,
  ProjectListResponseDto,
} from '@interface/common/dto/project/project.dto';
import {
  Controller,
  Param,
  ParseUUIDPipe,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@interface/common/decorators';

/**
 * 평가자 프로젝트 조회 컨트롤러
 *
 * 평가자가 프로젝트 정보를 조회할 수 있는 기능을 제공합니다.
 */
@ApiTags('D-0. 평가자 - 프로젝트 조회')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/projects')
export class EvaluatorProjectManagementController {
  constructor(private readonly projectService: ProjectService) {}

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
}

