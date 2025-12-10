import { ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { NotificationHelperService } from '@domain/common/notification/notification-helper.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
export declare class SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly submittedBy: string;
    constructor(employeeId: string, periodId: string, submittedBy?: string);
}
export interface SubmittedWbsSelfEvaluationDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    submittedToManagerAt: Date;
}
export interface FailedWbsSelfEvaluation {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
}
export interface SubmitAllWbsSelfEvaluationsResponse {
    submittedCount: number;
    failedCount: number;
    totalCount: number;
    completedEvaluations: SubmittedWbsSelfEvaluationDetail[];
    failedEvaluations: FailedWbsSelfEvaluation[];
}
export declare class SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler implements ICommandHandler<SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly notificationHelper;
    private readonly stepApprovalContext;
    private readonly employeeService;
    private readonly configService;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService, notificationHelper: NotificationHelperService, stepApprovalContext: StepApprovalContextService, employeeService: EmployeeService, configService: ConfigService);
    execute(command: SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand): Promise<SubmitAllWbsSelfEvaluationsResponse>;
    private 일차평가자에게_알림을전송한다;
}
