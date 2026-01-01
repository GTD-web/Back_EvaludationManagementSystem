import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { ProjectInfoDto } from '@interface/common/dto/evaluation-criteria/project-assignment.dto';

/**
 * 직원의 프로젝트 할당 조회 쿼리
 */
export class GetEmployeeProjectAssignmentsQuery {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * 직원의 프로젝트 할당 조회 쿼리 핸들러
 */
@QueryHandler(GetEmployeeProjectAssignmentsQuery)
@Injectable()
export class GetEmployeeProjectAssignmentsHandler
  implements IQueryHandler<GetEmployeeProjectAssignmentsQuery>
{
  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  ) {}

  async execute(
    query: GetEmployeeProjectAssignmentsQuery,
  ): Promise<{ projects: ProjectInfoDto[] }> {
    const { employeeId, periodId } = query;

    const results = await this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin(
        Project,
        'project',
        'project.id = assignment.projectId AND project.deletedAt IS NULL',
      )
      .select([
        // 프로젝트 정보만 선택
        'project.id AS project_id',
        'project.name AS project_name',
        'project.projectCode AS project_projectcode',
        'project.grade AS project_grade',
        'project.priority AS project_priority',
        'project.managerId AS project_managerid',
      ])
      .where('assignment.deletedAt IS NULL')
      .andWhere('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .orderBy('assignment.assignedDate', 'DESC')
      .getRawMany();

    const projects: ProjectInfoDto[] = results
      .filter((result) => result.project_id) // null 프로젝트 제외
      .map((result) => ({
        id: result.project_id,
        name: result.project_name,
        projectCode: result.project_projectcode,
        grade: result.project_grade || undefined,
        priority: result.project_priority || undefined,
        managerId: result.project_managerid,
      }));

    return { projects };
  }
}
