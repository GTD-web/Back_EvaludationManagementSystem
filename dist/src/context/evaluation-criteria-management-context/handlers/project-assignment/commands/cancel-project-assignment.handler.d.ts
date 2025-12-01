import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '@domain/common/project/project.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
export declare class CancelProjectAssignmentCommand {
    readonly id: string;
    readonly cancelledBy: string;
    constructor(id: string, cancelledBy: string);
}
export declare class CancelProjectAssignmentHandler implements ICommandHandler<CancelProjectAssignmentCommand> {
    private readonly projectAssignmentService;
    private readonly projectService;
    private readonly evaluationPeriodService;
    private readonly wbsAssignmentService;
    private readonly wbsSelfEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(projectAssignmentService: EvaluationProjectAssignmentService, projectService: ProjectService, evaluationPeriodService: EvaluationPeriodService, wbsAssignmentService: EvaluationWbsAssignmentService, wbsSelfEvaluationService: WbsSelfEvaluationService, transactionManager: TransactionManagerService);
    execute(command: CancelProjectAssignmentCommand): Promise<void>;
}
