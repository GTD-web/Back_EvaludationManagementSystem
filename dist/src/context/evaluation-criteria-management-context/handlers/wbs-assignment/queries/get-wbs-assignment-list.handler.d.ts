import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationWbsAssignmentFilter } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export declare class GetWbsAssignmentListQuery {
    readonly filter: EvaluationWbsAssignmentFilter;
    readonly page?: number | undefined;
    readonly limit?: number | undefined;
    readonly orderBy?: string | undefined;
    readonly orderDirection?: "ASC" | "DESC" | undefined;
    constructor(filter: EvaluationWbsAssignmentFilter, page?: number | undefined, limit?: number | undefined, orderBy?: string | undefined, orderDirection?: "ASC" | "DESC" | undefined);
}
export interface WbsAssignmentListResult {
    assignments: WbsAssignmentListItem[];
    totalCount: number;
    page: number;
    limit: number;
}
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
export declare class GetWbsAssignmentListHandler implements IQueryHandler<GetWbsAssignmentListQuery> {
    private readonly wbsAssignmentRepository;
    constructor(wbsAssignmentRepository: Repository<EvaluationWbsAssignment>);
    execute(query: GetWbsAssignmentListQuery): Promise<WbsAssignmentListResult>;
    private createQueryBuilder;
}
