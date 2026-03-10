import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { EvaluationWbsAssignmentFilter } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 목록 조회 쿼리
 */
export class GetWbsAssignmentListQuery {
  constructor(
    public readonly filter: EvaluationWbsAssignmentFilter,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly orderBy?: string,
    public readonly orderDirection?: 'ASC' | 'DESC',
  ) {}
}

/**
 * WBS 할당 목록 결과
 */
export interface WbsAssignmentListResult {
  assignments: WbsAssignmentListItem[];
  totalCount: number;
  page: number;
  limit: number;
}

/**
 * WBS 할당 목록 항목
 */
export interface WbsAssignmentListItem {
  id: string;
  periodId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  projectId: string;
  projectName: string;
  wbsItemId: string;
  wbsItemTitle: string;
  wbsItemCode: string;
  assignedDate: Date;
  assignedBy: string;
  assignedByName: string;
  displayOrder: number;
}

/**
 * WBS 할당 목록 조회 핸들러
 */
@QueryHandler(GetWbsAssignmentListQuery)
@Injectable()
export class GetWbsAssignmentListHandler
  implements IQueryHandler<GetWbsAssignmentListQuery>
{
  constructor(
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  ) {}

  async execute(
    query: GetWbsAssignmentListQuery,
  ): Promise<WbsAssignmentListResult> {
    const { filter, page, limit, orderBy, orderDirection } = query;

    // 쿼리 빌더 생성
    const queryBuilder = this.createQueryBuilder(
      filter,
      orderBy,
      orderDirection,
    );

    // 총 개수 조회
    const totalCount = await queryBuilder.getCount();

    // 페이징 적용
    const currentPage = Math.max(1, page || 1); // 최소 1페이지
    const currentLimit = Math.max(1, limit || 10); // 최소 1개
    const offset = (currentPage - 1) * currentLimit;

    // JOIN 쿼리로 한 번에 모든 정보 조회
    const assignments = await queryBuilder
      .leftJoinAndSelect(
        Employee,
        'employee',
        'employee.id = assignment.employeeId AND employee.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        Department,
        'department',
        '"department"."externalId" = "employee"."departmentId" AND "department"."deletedAt" IS NULL',
      )
      .leftJoinAndSelect(
        Employee,
        'assignedBy',
        'assignedBy.id = assignment.assignedBy AND assignedBy.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        Project,
        'project',
        'project.id = assignment.projectId AND project.deletedAt IS NULL',
      )
      .leftJoinAndSelect(
        WbsItem,
        'wbsItem',
        'wbsItem.id = assignment.wbsItemId AND wbsItem.deletedAt IS NULL',
      )
      .skip(offset)
      .take(currentLimit)
      .getMany();

    // 조인된 정보를 포함한 결과 생성
    const assignmentsWithDetails = assignments.map((assignment) => {
      // 조인된 데이터에서 정보 추출
      const employee = (assignment as any).employee;
      const department = (assignment as any).department;
      const assignedByEmployee = (assignment as any).assignedBy;
      const project = (assignment as any).project;
      const wbsItem = (assignment as any).wbsItem;

      return {
        id: assignment.id,
        periodId: assignment.periodId,
        employeeId: assignment.employeeId,
        employeeName: employee?.name || '',
        departmentName: department?.name || '',
        projectId: assignment.projectId,
        projectName: project?.name || '',
        wbsItemId: assignment.wbsItemId,
        wbsItemTitle: wbsItem?.title || '',
        wbsItemCode: wbsItem?.code || '',
        assignedDate: assignment.assignedDate,
        assignedBy: assignment.assignedBy,
        assignedByName: assignedByEmployee?.name || '',
        displayOrder: assignment.displayOrder,
      };
    });

    return {
      assignments: assignmentsWithDetails,
      totalCount,
      page: currentPage,
      limit: currentLimit,
    };
  }

  private createQueryBuilder(
    filter: EvaluationWbsAssignmentFilter,
    orderBy?: string,
    orderDirection?: 'ASC' | 'DESC',
  ): SelectQueryBuilder<EvaluationWbsAssignment> {
    const queryBuilder = this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.deletedAt IS NULL');

    // 필터 조건 적용
    if (filter.periodId) {
      queryBuilder.andWhere('assignment.periodId = :periodId', {
        periodId: filter.periodId,
      });
    }

    if (filter.employeeId) {
      queryBuilder.andWhere('assignment.employeeId = :employeeId', {
        employeeId: filter.employeeId,
      });
    }

    if (filter.projectId) {
      queryBuilder.andWhere('assignment.projectId = :projectId', {
        projectId: filter.projectId,
      });
    }

    if (filter.wbsItemId) {
      queryBuilder.andWhere('assignment.wbsItemId = :wbsItemId', {
        wbsItemId: filter.wbsItemId,
      });
    }

    if (filter.assignedBy) {
      queryBuilder.andWhere('assignment.assignedBy = :assignedBy', {
        assignedBy: filter.assignedBy,
      });
    }

    if (filter.assignedDateFrom) {
      queryBuilder.andWhere('assignment.assignedDate >= :assignedDateFrom', {
        assignedDateFrom: filter.assignedDateFrom,
      });
    }

    if (filter.assignedDateTo) {
      queryBuilder.andWhere('assignment.assignedDate <= :assignedDateTo', {
        assignedDateTo: filter.assignedDateTo,
      });
    }

    // 정렬
    const sortBy = orderBy || 'assignedDate';
    const sortDirection = orderDirection || 'DESC';
    queryBuilder.orderBy(`assignment.${sortBy}`, sortDirection);

    return queryBuilder;
  }
}
