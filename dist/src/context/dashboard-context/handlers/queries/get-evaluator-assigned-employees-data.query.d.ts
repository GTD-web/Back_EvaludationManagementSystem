import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { GetEmployeeAssignedDataHandler, EmployeeAssignedDataResult, EvaluationPeriodInfo, EmployeeInfo } from './get-employee-assigned-data';
export declare class GetEvaluatorAssignedEmployeesDataQuery {
    readonly evaluationPeriodId: string;
    readonly evaluatorId: string;
    readonly employeeId: string;
    constructor(evaluationPeriodId: string, evaluatorId: string, employeeId: string);
}
export interface EvaluatorAssignedEmployeesDataResult {
    evaluationPeriod: EvaluationPeriodInfo;
    evaluator: EmployeeInfo;
    evaluatee: Omit<EmployeeAssignedDataResult, 'evaluationPeriod'>;
}
export declare class GetEvaluatorAssignedEmployeesDataHandler implements IQueryHandler<GetEvaluatorAssignedEmployeesDataQuery, EvaluatorAssignedEmployeesDataResult> {
    private readonly evaluationPeriodRepository;
    private readonly employeeRepository;
    private readonly departmentRepository;
    private readonly lineMappingRepository;
    private readonly evaluationLineRepository;
    private readonly periodEmployeeMappingRepository;
    private readonly employeeAssignedDataHandler;
    private readonly activityLogContextService;
    private readonly logger;
    constructor(evaluationPeriodRepository: Repository<EvaluationPeriod>, employeeRepository: Repository<Employee>, departmentRepository: Repository<Department>, lineMappingRepository: Repository<EvaluationLineMapping>, evaluationLineRepository: Repository<EvaluationLine>, periodEmployeeMappingRepository: Repository<EvaluationPeriodEmployeeMapping>, employeeAssignedDataHandler: GetEmployeeAssignedDataHandler, activityLogContextService: EvaluationActivityLogContextService);
    execute(query: GetEvaluatorAssignedEmployeesDataQuery): Promise<EvaluatorAssignedEmployeesDataResult>;
}
