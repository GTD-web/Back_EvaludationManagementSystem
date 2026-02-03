import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { ProjectService } from '@domain/common/project/project.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';

/**
 * 할당 가능한 프로젝트 목록 조회 쿼리
 */
export class GetAvailableProjectsQuery implements IQuery {
  constructor(
    public readonly periodId: string,
    public readonly options: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ) {}
}

/**
 * 할당 가능한 프로젝트 목록 조회 결과
 */
export interface AvailableProjectsResult {
  periodId: string;
  projects: Array<{
    id: string;
    name: string;
    projectCode?: string;
    manager?: {
      managerId: string;
      employeeId?: string;
      name: string;
      email?: string;
      phoneNumber?: string;
      departmentName?: string;
    } | null;
    realPM?: string | null;
    grade?: '1A' | '1B' | '2A' | '2B' | '3A' | '3B';
    priority?: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  search?: string;
  sortBy: string;
  sortOrder: string;
}

@Injectable()
@QueryHandler(GetAvailableProjectsQuery)
export class GetAvailableProjectsHandler
  implements IQueryHandler<GetAvailableProjectsQuery, AvailableProjectsResult>
{
  private readonly logger = new Logger(GetAvailableProjectsHandler.name);

  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly projectService: ProjectService,
    private readonly employeeService: EmployeeService,
  ) {}

  async execute(query: GetAvailableProjectsQuery): Promise<AvailableProjectsResult> {
    const { periodId, options } = query;
    const {
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = options;

    // 평가기간 존재 여부 검증
    const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(
      periodId,
    );
    if (!evaluationPeriod) {
      throw new BadRequestException(
        `평가기간 ID ${periodId}에 해당하는 평가기간을 찾을 수 없습니다.`,
      );
    }

    // 프로젝트 목록 조회
    const allProjects = await this.projectService.필터_조회한다({});

    // 프로젝트 목록에 매니저 정보 포함 (이미 service에서 join되어 있음)
    let projectsWithManager = allProjects.map((project) => ({
      id: project.id,
      name: project.name,
      projectCode: project.projectCode,
      manager: project.manager || null,
      realPM: project.realPM || null,
      grade: project.grade || undefined,
      priority: project.priority || undefined,
    }));

    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      projectsWithManager = projectsWithManager.filter((project) => {
        return (
          project.name.toLowerCase().includes(searchLower) ||
          (project.projectCode && project.projectCode.toLowerCase().includes(searchLower)) ||
          (project.manager && project.manager.name.toLowerCase().includes(searchLower))
        );
      });
    }

    // 정렬 기준 검증 및 정규화
    const validSortBy = ['name', 'projectCode', 'managerName'];
    const normalizedSortBy = validSortBy.includes(sortBy) ? sortBy : 'name';

    // 정렬
    projectsWithManager.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (normalizedSortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'projectCode':
          aValue = a.projectCode || '';
          bValue = b.projectCode || '';
          break;
        case 'managerName':
          aValue = a.manager?.name || '';
          bValue = b.manager?.name || '';
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    // 페이징
    const total = projectsWithManager.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedProjects = projectsWithManager.slice(offset, offset + limit);

    return {
      periodId,
      projects: paginatedProjects,
      total,
      page,
      limit,
      totalPages,
      search,
      sortBy: normalizedSortBy,
      sortOrder,
    };
  }
}