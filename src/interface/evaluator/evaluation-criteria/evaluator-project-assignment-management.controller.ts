import { ProjectAssignmentBusinessService } from '@business/project-assignment/project-assignment-business.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { Roles } from '@interface/common/decorators';
import {
  BulkCreateProjectAssignments,
  CancelProjectAssignmentByProject,
  ChangeProjectAssignmentOrderByProject,
  CreateProjectAssignment,
  GetAvailableProjects,
} from '@interface/common/decorators/evaluation-criteria/project-assignment-api.decorators';
import {
  AvailableProjectsResponseDto,
  BulkCreateProjectAssignmentDto,
  CancelProjectAssignmentByProjectDto,
  ChangeProjectAssignmentOrderByProjectDto,
  CreateProjectAssignmentDto,
  GetAvailableProjectsQueryDto,
  ProjectAssignmentResponseDto,
} from '@interface/common/dto/evaluation-criteria/project-assignment.dto';
import { Body, Controller, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * 프로젝트 할당 관리 컨트롤러
 *
 * 평가기간에 직원을 프로젝트에 할당하는 기능을 제공합니다.
 */
@ApiTags('B-1. 평가자 - 평가 설정 - 프로젝트 할당')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/evaluation-criteria/project-assignments')
export class EvaluatorProjectAssignmentManagementController {
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
   * 주의: 구체적인 경로를 :id 경로보다 먼저 정의해야 함
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
   * 프로젝트 대량 할당
   */
  @BulkCreateProjectAssignments()
  async bulkCreateProjectAssignments(
    @Body() bulkCreateDto: BulkCreateProjectAssignmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any[]> {
    const assignedBy = user.id;

    return await this.projectAssignmentBusinessService.프로젝트를_대량으로_할당한다(
      bulkCreateDto.assignments.map((assignment) => ({
        employeeId: assignment.employeeId,
        projectId: assignment.projectId,
        periodId: assignment.periodId,
        assignedBy,
      })),
      assignedBy,
    );
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
}
