import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
export declare class DeleteWbsSelfEvaluationsByAssignmentCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly wbsItemId: string;
    readonly deletedBy: string;
    constructor(employeeId: string, periodId: string, wbsItemId: string, deletedBy: string);
}
export interface DeletedWbsSelfEvaluationDetail {
    evaluationId: string;
    wbsItemId: string;
}
export interface DeleteWbsSelfEvaluationsByAssignmentResponse {
    deletedCount: number;
    deletedEvaluations: DeletedWbsSelfEvaluationDetail[];
}
export declare class DeleteWbsSelfEvaluationsByAssignmentHandler implements ICommandHandler<DeleteWbsSelfEvaluationsByAssignmentCommand, DeleteWbsSelfEvaluationsByAssignmentResponse> {
    private readonly wbsSelfEvaluationService;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService);
    execute(command: DeleteWbsSelfEvaluationsByAssignmentCommand): Promise<DeleteWbsSelfEvaluationsByAssignmentResponse>;
}
