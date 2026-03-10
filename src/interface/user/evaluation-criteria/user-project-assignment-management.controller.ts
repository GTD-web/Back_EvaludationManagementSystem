import { ProjectAssignmentBusinessService } from '@business/project-assignment/project-assignment-business.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import {
  CancelProjectAssignmentByProject,
  ChangeProjectAssignmentOrderByProject,
  CreateProjectAssignment,
  GetAvailableProjects,
  UpdateProjectAssignment,
} from '@interface/common/decorators/evaluation-criteria/project-assignment-api.decorators';
import {
  AvailableProjectsResponseDto,
  CancelProjectAssignmentByProjectDto,
  ChangeProjectAssignmentOrderByProjectDto,
  CreateProjectAssignmentDto,
  GetAvailableProjectsQueryDto,
  ProjectAssignmentResponseDto,
  UpdateProjectAssignmentDto,
} from '@interface/common/dto/evaluation-criteria/project-assignment.dto';
import { Body, Controller, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * 사용자 프로젝트 할당 관리 컨트롤러
 *
 * 사용자가 프로젝트 할당을 생성하고 할당 가능한 프로젝트를 조회할 수 있는 기능을 제공합니다.
 */
@ApiTags('A-1. 사용자 - 평가 설정 - 프로젝트 할당')
@ApiBearerAuth('Bearer')
@Roles('user')
@Controller('user/evaluation-criteria/project-assignments')
export class UserProjectAssignmentManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly projectAssignmentBusinessService: ProjectAssignmentBusinessService,
  ) {}

  /**
   * 프로젝트 할당 생성
   */
  @CreateProjectAssignment()
  async createProjectAssignment(
    @Body() createDto: CreateProjectAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    const assignedBy = user.id;
    return await this.projectAssignmentBusinessService.프로젝트를_할당한다(
      {
        employeeId: createDto.employeeId,
        projectId: createDto.projectId,
        periodId: createDto.periodId,
        assignedBy: assignedBy,
      },
      assignedBy,
    );
  }

  /**
   * 할당 가능한 프로젝트 목록 조회 (매니저 정보 포함, 검색/페이징/정렬 지원)
   */
  @GetAvailableProjects()
  async getAvailableProjects(
    @Query() query: GetAvailableProjectsQueryDto,
  ): Promise<AvailableProjectsResponseDto> {
    const result =
      await this.evaluationCriteriaManagementService.할당_가능한_프로젝트_목록을_조회한다(
        query.periodId,
        {
          status: query.status,
          search: query.search,
          page: query.page,
          limit: query.limit,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        },
      );

    return {
      periodId: result.periodId,
      projects: result.projects,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      search: result.search,
      sortBy: result.sortBy,
      sortOrder: result.sortOrder,
    };
  }

  /**
   * 프로젝트 할당 취소 (프로젝트 ID 기반)
   */
  @CancelProjectAssignmentByProject()
  async cancelProjectAssignmentByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() bodyDto: CancelProjectAssignmentByProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const cancelledBy = user.id;
    return await this.projectAssignmentBusinessService.프로젝트_할당을_프로젝트_ID로_취소한다(
      bodyDto.employeeId,
      projectId,
      bodyDto.periodId,
      cancelledBy,
    );
  }

  /**
   * 프로젝트 할당 순서 변경 (프로젝트 ID 기반)
   */
  @ChangeProjectAssignmentOrderByProject()
  async changeProjectAssignmentOrderByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() bodyDto: ChangeProjectAssignmentOrderByProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectAssignmentResponseDto> {
    const updatedBy = user.id;
    return await this.evaluationCriteriaManagementService.프로젝트_할당_순서를_프로젝트_ID로_변경한다(
      bodyDto.employeeId,
      projectId,
      bodyDto.periodId,
      bodyDto.direction,
      updatedBy,
    );
  }

  /**
   * 프로젝트 할당 기간 수정
   */
  @UpdateProjectAssignment()
  async updateProjectAssignment(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('periodId', ParseUUIDPipe) periodId: string,
    @Body() updateDto: UpdateProjectAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectAssignmentResponseDto> {
    const updatedBy = user.id;
    return await this.evaluationCriteriaManagementService.프로젝트_할당을_직원과_프로젝트로_수정한다(
      employeeId,
      projectId,
      periodId,
      {
        projectStartDate: updateDto.projectStartDate,
        projectEndDate: updateDto.projectEndDate,
      },
      updatedBy,
    );
  }
}
