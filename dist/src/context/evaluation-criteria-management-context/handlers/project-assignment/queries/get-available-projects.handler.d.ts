import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { ProjectService } from '@domain/common/project/project.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
export declare class GetAvailableProjectsQuery implements IQuery {
    readonly periodId: string;
    readonly options: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
    constructor(periodId: string, options?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    });
}
export interface AvailableProjectsResult {
    periodId: string;
    projects: Array<{
        id: string;
        name: string;
        projectCode?: string;
        status: string;
        startDate?: Date;
        endDate?: Date;
        manager?: {
            managerId: string;
            employeeId?: string;
            name: string;
            email?: string;
            phoneNumber?: string;
            departmentName?: string;
        } | null;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    search?: string;
    sortBy: string;
    sortOrder: string;
}
export declare class GetAvailableProjectsHandler implements IQueryHandler<GetAvailableProjectsQuery, AvailableProjectsResult> {
    private readonly evaluationPeriodService;
    private readonly projectService;
    private readonly employeeService;
    private readonly logger;
    constructor(evaluationPeriodService: EvaluationPeriodService, projectService: ProjectService, employeeService: EmployeeService);
    execute(query: GetAvailableProjectsQuery): Promise<AvailableProjectsResult>;
}
