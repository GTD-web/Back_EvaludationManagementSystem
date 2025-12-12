import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { Roles } from '@interface/common/decorators';
import { GetAvailableProjects } from '@interface/common/decorators/evaluation-criteria/project-assignment-api.decorators';
import {
  AvailableProjectsResponseDto,
  GetAvailableProjectsQueryDto
} from '@interface/common/dto/evaluation-criteria/project-assignment.dto';
import { Controller, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * 사용자 프로젝트 할당 관리 컨트롤러
 *
 * 사용자가 할당 가능한 프로젝트를 조회할 수 있는 기능을 제공합니다.
 */
@ApiTags('A-1. 사용자 - 평가 설정 - 프로젝트 할당')
@ApiBearerAuth('Bearer')
@Roles('user')
@Controller('user/evaluation-criteria/project-assignments')
export class UserProjectAssignmentManagementController {
  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
  ) {}

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
}

