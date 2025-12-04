import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
import { NotificationHelperService } from '@domain/common/notification';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
export declare class SubmitDownwardEvaluationCommand {
    readonly evaluationId: string;
    readonly submittedBy: string;
    constructor(evaluationId: string, submittedBy?: string);
}
export declare class SubmitDownwardEvaluationHandler implements ICommandHandler<SubmitDownwardEvaluationCommand> {
    private readonly downwardEvaluationService;
    private readonly transactionManager;
    private readonly mappingRepository;
    private readonly stepApprovalService;
    private readonly notificationHelper;
    private readonly evaluationPeriodService;
    private readonly stepApprovalContext;
    private readonly logger;
    constructor(downwardEvaluationService: DownwardEvaluationService, transactionManager: TransactionManagerService, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, stepApprovalService: EmployeeEvaluationStepApprovalService, notificationHelper: NotificationHelperService, evaluationPeriodService: EvaluationPeriodService, stepApprovalContext: StepApprovalContextService);
    execute(command: SubmitDownwardEvaluationCommand): Promise<void>;
    private 이차평가자에게_알림을전송한다;
}
