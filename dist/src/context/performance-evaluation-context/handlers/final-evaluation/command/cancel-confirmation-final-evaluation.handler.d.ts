import { ICommandHandler } from '@nestjs/cqrs';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
export declare class CancelConfirmationFinalEvaluationCommand {
    readonly id: string;
    readonly updatedBy: string;
    constructor(id: string, updatedBy: string);
}
export declare class CancelConfirmationFinalEvaluationHandler implements ICommandHandler<CancelConfirmationFinalEvaluationCommand> {
    private readonly finalEvaluationService;
    private readonly transactionManager;
    private readonly activityLogService;
    private readonly logger;
    constructor(finalEvaluationService: FinalEvaluationService, transactionManager: TransactionManagerService, activityLogService: EvaluationActivityLogContextService);
    execute(command: CancelConfirmationFinalEvaluationCommand): Promise<void>;
}
