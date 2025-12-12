import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
export declare class UpsertWbsSelfEvaluationCommand {
    readonly periodId: string;
    readonly employeeId: string;
    readonly wbsItemId: string;
    readonly selfEvaluationContent?: string | undefined;
    readonly selfEvaluationScore?: number | undefined;
    readonly performanceResult?: string | undefined;
    readonly subProject?: string | undefined;
    readonly actionBy: string;
    constructor(periodId: string, employeeId: string, wbsItemId: string, selfEvaluationContent?: string | undefined, selfEvaluationScore?: number | undefined, performanceResult?: string | undefined, subProject?: string | undefined, actionBy?: string);
}
export declare class UpsertWbsSelfEvaluationHandler implements ICommandHandler<UpsertWbsSelfEvaluationCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: UpsertWbsSelfEvaluationCommand): Promise<WbsSelfEvaluationDto>;
}
