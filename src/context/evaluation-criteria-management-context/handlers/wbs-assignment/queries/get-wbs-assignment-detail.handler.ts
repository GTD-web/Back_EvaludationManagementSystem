import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';

/**
 * WBS 할당 상세 조회 쿼리
 */
export class GetWbsAssignmentDetailQuery {
  constructor(
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly projectId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * WBS 할당 상세 조회 결과
 */
export interface WbsAssignmentDetailResult {
  // 할당 기본 정보
  id: string;
  periodId: string;
  employeeId: string;
  projectId: string;
  wbsItemId: string;
  assignedDate: Date;
  assignedBy: string;
  displayOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | undefined;
  updatedBy: string | undefined;

  // 직원 정보
  employee: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;

  // 부서 정보
  department: {
    id: string;
    name: string;
    code: string;
  } | null;

  // 프로젝트 정보
  project: {
    id: string;
    name: string;
    code: string;
    grade?: '1A' | '1B' | '2A' | '2B' | '3A';
    priority?: number;
  } | null;

  // WBS 항목 정보
  wbsItem: {
    id: string;
    wbsCode: string;
    title: string;
    status: string;
    level: number;
    startDate: Date;
    endDate: Date;
    progressPercentage: string;
  } | null;

  // 평가기간 정보
  period: {
    id: string;
    name: string;
    startDate: Date;
    status: string;
  } | null;

  // 할당자 정보
  assignedByEmployee: {
    id: string;
    name: string;
    employeeNumber: string;
  } | null;
}

/**
 * WBS 할당 상세 조회 핸들러
 */
@QueryHandler(GetWbsAssignmentDetailQuery)
@Injectable()
export class GetWbsAssignmentDetailHandler
  implements IQueryHandler<GetWbsAssignmentDetailQuery>
{
  constructor(
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  ) {}

  async execute(
    query: GetWbsAssignmentDetailQuery,
  ): Promise<WbsAssignmentDetailResult | null> {
    const { employeeId, wbsItemId, projectId, periodId } = query;

    const result = await this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin(
        Employee,
        'employee',
        'employee.id = assignment.employeeId AND employee.deletedAt IS NULL',
      )
      .leftJoin(
        Department,
        'department',
        '"department"."externalId" = "employee"."departmentId" AND "department"."deletedAt" IS NULL',
      )
      .leftJoin(
        Project,
        'project',
        'project.id = assignment.projectId AND project.deletedAt IS NULL',
      )
      .leftJoin(
        WbsItem,
        'wbsItem',
        'wbsItem.id = assignment.wbsItemId AND wbsItem.deletedAt IS NULL',
      )
      .leftJoin(
        EvaluationPeriod,
        'period',
        'period.id = assignment.periodId AND period.deletedAt IS NULL',
      )
      .leftJoin(
        Employee,
        'assignedByEmployee',
        'assignedByEmployee.id = assignment.assignedBy AND assignedByEmployee.deletedAt IS NULL',
      )
      .select([
        // 할당 정보
        'assignment.id AS assignment_id',
        'assignment.periodId AS assignment_periodid',
        'assignment.employeeId AS assignment_employeeid',
        'assignment.projectId AS assignment_projectid',
        'assignment.wbsItemId AS assignment_wbsitemid',
        'assignment.assignedDate AS assignment_assigneddate',
        'assignment.assignedBy AS assignment_assignedby',
        'assignment.displayOrder AS assignment_displayorder',
        'assignment.createdAt AS assignment_createdat',
        'assignment.updatedAt AS assignment_updatedat',
        'assignment.createdBy AS assignment_createdby',
        'assignment.updatedBy AS assignment_updatedby',
        // 직원 정보
        'employee.id AS employee_id',
        'employee.name AS employee_name',
        'employee.employeeNumber AS employee_employeenumber',
        'employee.email AS employee_email',
        'employee.departmentId AS employee_departmentid',
        'employee.status AS employee_status',
        // 부서 정보
        'department.id AS department_id',
        'department.name AS department_name',
        'department.code AS department_code',
        // 프로젝트 정보
        'project.id AS project_id',
        'project.name AS project_name',
        'project.projectCode AS project_code',
        'project.grade AS project_grade',
        'project.priority AS project_priority',
        // WBS 항목 정보
        'wbsItem.id AS wbsitem_id',
        'wbsItem.wbsCode AS wbsitem_wbscode',
        'wbsItem.title AS wbsitem_title',
        'wbsItem.status AS wbsitem_status',
        'wbsItem.level AS wbsitem_level',
        'wbsItem.startDate AS wbsitem_startdate',
        'wbsItem.endDate AS wbsitem_enddate',
        'wbsItem.progressPercentage AS wbsitem_progresspercentage',
        // 평가기간 정보
        'period.id AS period_id',
        'period.name AS period_name',
        'period.startDate AS period_startdate',
        'period.status AS period_status',
        // 할당자 정보
        'assignedByEmployee.id AS assignedbyemployee_id',
        'assignedByEmployee.name AS assignedbyemployee_name',
        'assignedByEmployee.employeeNumber AS assignedbyemployee_employeenumber',
      ])
      .where('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.wbsItemId = :wbsItemId', { wbsItemId })
      .andWhere('assignment.projectId = :projectId', { projectId })
      .andWhere('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.deletedAt IS NULL')
      .getRawOne();

    if (!result) {
      return null;
    }

    return {
      id: result.assignment_id,
      periodId: result.assignment_periodid,
      employeeId: result.assignment_employeeid,
      projectId: result.assignment_projectid,
      wbsItemId: result.assignment_wbsitemid,
      assignedDate: result.assignment_assigneddate || new Date(),
      assignedBy: result.assignment_assignedby,
      displayOrder: result.assignment_displayorder,
      createdAt: result.assignment_createdat,
      updatedAt: result.assignment_updatedat,
      createdBy: result.assignment_createdby,
      updatedBy: result.assignment_updatedby,

      employee: result.employee_id
        ? {
            id: result.employee_id,
            name: result.employee_name,
            employeeNumber: result.employee_employeenumber,
            email: result.employee_email,
            departmentId: result.employee_departmentid,
            status: result.employee_status,
          }
        : null,

      department: result.department_id
        ? {
            id: result.department_id,
            name: result.department_name,
            code: result.department_code,
          }
        : null,

      project: result.project_id
        ? {
            id: result.project_id,
            name: result.project_name,
            code: result.project_code,
            grade: result.project_grade || undefined,
            priority: result.project_priority || undefined,
          }
        : null,

      wbsItem: result.wbsitem_id
        ? {
            id: result.wbsitem_id,
            wbsCode: result.wbsitem_wbscode,
            title: result.wbsitem_title,
            status: result.wbsitem_status,
            level: result.wbsitem_level,
            startDate: result.wbsitem_startdate,
            endDate: result.wbsitem_enddate,
            progressPercentage: result.wbsitem_progresspercentage,
          }
        : null,

      period: result.period_id
        ? {
            id: result.period_id,
            name: result.period_name,
            startDate: result.period_startdate,
            status: result.period_status,
          }
        : null,

      assignedByEmployee: result.assignedbyemployee_id
        ? {
            id: result.assignedbyemployee_id,
            name: result.assignedbyemployee_name,
            employeeNumber: result.assignedbyemployee_employeenumber,
          }
        : null,
    };
  }
}
