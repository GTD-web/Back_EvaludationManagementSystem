import { ICommandHandler } from '@nestjs/cqrs';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
export declare class ConfirmFinalEvaluationCommand {
    readonly id: string;
    readonly confirmedBy: string;
    constructor(id: string, confirmedBy: string);
}
export declare class ConfirmFinalEvaluationHandler implements ICommandHandler<ConfirmFinalEvaluationCommand> {
    private readonly finalEvaluationService;
    private readonly transactionManager;
    private readonly activityLogService;
    private readonly logger;
    constructor(finalEvaluationService: FinalEvaluationService, transactionManager: TransactionManagerService, activityLogService: EvaluationActivityLogContextService);
    execute(command: ConfirmFinalEvaluationCommand): Promise<void>;
}
