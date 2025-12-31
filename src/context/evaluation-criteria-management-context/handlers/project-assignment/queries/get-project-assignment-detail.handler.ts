import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentDetailDto } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { Department } from '@domain/common/department/department.entity';

/**
 * 프로젝트 할당 상세 조회 쿼리
 */
export class GetProjectAssignmentDetailQuery {
  constructor(public readonly assignmentId: string) {}
}

/**
 * 프로젝트 할당 상세 조회 쿼리 핸들러
 */
@QueryHandler(GetProjectAssignmentDetailQuery)
@Injectable()
export class GetProjectAssignmentDetailHandler
  implements IQueryHandler<GetProjectAssignmentDetailQuery>
{
  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  ) {}

  async execute(
    query: GetProjectAssignmentDetailQuery,
  ): Promise<EvaluationProjectAssignmentDetailDto | null> {
    const { assignmentId } = query;

    const result = await this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin(
        EvaluationPeriod,
        'period',
        'period.id = assignment.periodId AND period.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'employee',
        'employee.id = assignment.employeeId AND employee.deletedAt IS NULL',
      )
      .leftJoin(
        Project,
        'project',
        'project.id = assignment.projectId AND project.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'assignedByEmployee',
        'assignedByEmployee.id = assignment.assignedBy AND assignedByEmployee.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'employeeDept',
        '"employeeDept"."externalId" = "employee"."departmentId" AND "employeeDept"."deletedAt" IS NULL',
      )
      .leftJoin(
        Department,
        'assignedByDept',
        '"assignedByDept"."externalId" = "assignedByEmployee"."departmentId" AND "assignedByDept"."deletedAt" IS NULL',
      )
      .select([
        // 할당 정보
        'assignment.id AS assignment_id',
        'assignment.assignedDate AS assignment_assigneddate',
        'assignment.createdAt AS assignment_createdat',
        'assignment.updatedAt AS assignment_updatedat',
        'assignment.deletedAt AS assignment_deletedat',
        'assignment.createdBy AS assignment_createdby',
        'assignment.updatedBy AS assignment_updatedby',
        'assignment.version AS assignment_version',
        // 평가기간 정보
        'period.id AS period_id',
        'period.name AS period_name',
        'period.startDate AS period_startdate',
        'period.status AS period_status',
        'period.description AS period_description',
        // 직원 정보
        'employee.id AS employee_id',
        'employee.employeeNumber AS employee_employeenumber',
        'employee.name AS employee_name',
        'employee.email AS employee_email',
        'employee.phoneNumber AS employee_phonenumber',
        'employee.status AS employee_status',
        'employee.departmentId AS employee_departmentid',
        'employeeDept.name AS employeedept_name',
        // 프로젝트 정보
        'project.id AS project_id',
        'project.name AS project_name',
        'project.projectCode AS project_projectcode',
        'project.grade AS project_grade',
        'project.priority AS project_priority',
        'project.managerId AS project_managerid',
        // 할당자 정보
        'assignedByEmployee.id AS assignedbyemployee_id',
        'assignedByEmployee.employeeNumber AS assignedbyemployee_employeenumber',
        'assignedByEmployee.name AS assignedbyemployee_name',
        'assignedByEmployee.email AS assignedbyemployee_email',
        'assignedByEmployee.departmentId AS assignedbyemployee_departmentid',
        'assignedByDept.name AS assignedbydept_name',
      ])
      .where('assignment.id = :assignmentId', { assignmentId })
      .andWhere('assignment.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id: result.assignment_id,
      assignedDate: result.assignment_assigneddate || new Date(), // null인 경우 현재 시간으로 설정
      createdAt: result.assignment_createdat,
      updatedAt: result.assignment_updatedat,
      deletedAt: result.assignment_deletedat,
      createdBy: result.assignment_createdby,
      updatedBy: result.assignment_updatedby,
      version: result.assignment_version,
      evaluationPeriod: result.period_id
        ? {
            id: result.period_id,
            name: result.period_name,
            startDate: result.period_startdate,
            status: result.period_status,
            description: result.period_description,
          }
        : null,
      employee: result.employee_id
        ? {
            id: result.employee_id,
            employeeNumber: result.employee_employeenumber,
            name: result.employee_name,
            email: result.employee_email,
            phoneNumber: result.employee_phonenumber,
            status: result.employee_status,
            departmentId: result.employee_departmentid,
            departmentName: result.employeedept_name,
          }
        : null,
      project: result.project_id
        ? {
            id: result.project_id,
            name: result.project_name,
            projectCode: result.project_projectcode,
            grade: result.project_grade || undefined,
            priority: result.project_priority || undefined,
            managerId: result.project_managerid,
          }
        : null,
      assignedBy: result.assignedbyemployee_id
        ? {
            id: result.assignedbyemployee_id,
            employeeNumber: result.assignedbyemployee_employeenumber,
            name: result.assignedbyemployee_name,
            email: result.assignedbyemployee_email,
            departmentId: result.assignedbyemployee_departmentid,
            departmentName: result.assignedbydept_name,
          }
        : null,
    };
  }
}
