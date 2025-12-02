import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationLineService } from '../../../../../domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { DownwardEvaluationService } from '../../../../../domain/core/downward-evaluation/downward-evaluation.service';
export declare class ConfigurePrimaryEvaluatorCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly evaluatorId: string;
    readonly createdBy: string;
    constructor(employeeId: string, periodId: string, evaluatorId: string, createdBy: string);
}
export interface ConfigurePrimaryEvaluatorResult {
    message: string;
    createdLines: number;
    createdMappings: number;
    mapping: {
        id: string;
        employeeId: string;
        evaluatorId: string;
        wbsItemId: string | null;
        evaluationLineId: string;
    };
}
export declare class ConfigurePrimaryEvaluatorHandler implements ICommandHandler<ConfigurePrimaryEvaluatorCommand, ConfigurePrimaryEvaluatorResult> {
    private readonly evaluationLineService;
    private readonly evaluationLineMappingService;
    private readonly downwardEvaluationService;
    private readonly logger;
    constructor(evaluationLineService: EvaluationLineService, evaluationLineMappingService: EvaluationLineMappingService, downwardEvaluationService: DownwardEvaluationService);
    execute(command: ConfigurePrimaryEvaluatorCommand): Promise<ConfigurePrimaryEvaluatorResult>;
}
