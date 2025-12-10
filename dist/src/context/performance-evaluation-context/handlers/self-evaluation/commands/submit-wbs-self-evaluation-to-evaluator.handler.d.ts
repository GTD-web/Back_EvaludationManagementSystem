import { ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { NotificationHelperService } from '@domain/common/notification';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
export declare class SubmitWbsSelfEvaluationToEvaluatorCommand {
    readonly evaluationId: string;
    readonly submittedBy: string;
    constructor(evaluationId: string, submittedBy?: string);
}
export declare class SubmitWbsSelfEvaluationToEvaluatorHandler implements ICommandHandler<SubmitWbsSelfEvaluationToEvaluatorCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly notificationHelper;
    private readonly stepApprovalContext;
    private readonly employeeService;
    private readonly configService;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService, notificationHelper: NotificationHelperService, stepApprovalContext: StepApprovalContextService, employeeService: EmployeeService, configService: ConfigService);
    execute(command: SubmitWbsSelfEvaluationToEvaluatorCommand): Promise<WbsSelfEvaluationDto>;
    private 일차평가자에게_알림을전송한다;
}
