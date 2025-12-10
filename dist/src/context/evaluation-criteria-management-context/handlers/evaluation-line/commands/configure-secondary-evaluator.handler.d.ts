import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationLineService } from '../../../../../domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { DownwardEvaluationService } from '../../../../../domain/core/downward-evaluation/downward-evaluation.service';
export declare class ConfigureSecondaryEvaluatorCommand {
    readonly employeeId: string;
    readonly wbsItemId: string;
    readonly periodId: string;
    readonly evaluatorId: string;
    readonly createdBy: string;
    constructor(employeeId: string, wbsItemId: string, periodId: string, evaluatorId: string, createdBy: string);
}
export interface ConfigureSecondaryEvaluatorResult {
    message: string;
    createdLines: number;
    createdMappings: number;
    mapping: {
        id: string;
        employeeId: string;
        evaluatorId: string;
        wbsItemId: string;
        evaluationLineId: string;
    };
}
export declare class ConfigureSecondaryEvaluatorHandler implements ICommandHandler<ConfigureSecondaryEvaluatorCommand, ConfigureSecondaryEvaluatorResult> {
    private readonly evaluationLineService;
    private readonly evaluationLineMappingService;
    private readonly downwardEvaluationService;
    private readonly logger;
    constructor(evaluationLineService: EvaluationLineService, evaluationLineMappingService: EvaluationLineMappingService, downwardEvaluationService: DownwardEvaluationService);
    execute(command: ConfigureSecondaryEvaluatorCommand): Promise<ConfigureSecondaryEvaluatorResult>;
}
