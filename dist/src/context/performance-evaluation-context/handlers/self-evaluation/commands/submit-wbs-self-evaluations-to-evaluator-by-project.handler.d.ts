import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
export declare class SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly projectId: string;
    readonly submittedBy: string;
    constructor(employeeId: string, periodId: string, projectId: string, submittedBy?: string);
}
export interface SubmittedWbsSelfEvaluationToEvaluatorByProjectDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    submittedToEvaluatorAt: Date;
}
export interface FailedWbsSelfEvaluationToEvaluatorByProject {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
}
export interface MissingFieldInfoByProject {
    evaluationId: string;
    wbsItemId: string;
    wbsItemName?: string;
    missingFields: {
        performanceResult: boolean;
        selfEvaluationContent: boolean;
        selfEvaluationScore: boolean;
    };
}
export interface SubmitWbsSelfEvaluationsToEvaluatorByProjectResponse {
    submittedCount: number;
    failedCount: number;
    totalCount: number;
    completedEvaluations: SubmittedWbsSelfEvaluationToEvaluatorByProjectDetail[];
    failedEvaluations: FailedWbsSelfEvaluationToEvaluatorByProject[];
}
export declare class SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler implements ICommandHandler<SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationWbsAssignmentService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationWbsAssignmentService: EvaluationWbsAssignmentService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand): Promise<SubmitWbsSelfEvaluationsToEvaluatorByProjectResponse>;
}
