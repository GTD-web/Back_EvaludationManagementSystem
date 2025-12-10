import { ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
import type { CreateEvaluationQuestionDto } from '../../../../../domain/sub/evaluation-question/evaluation-question.types';
export declare class CreateEvaluationQuestionCommand {
    readonly data: CreateEvaluationQuestionDto;
    readonly createdBy: string;
    constructor(data: CreateEvaluationQuestionDto, createdBy: string);
}
export declare class CreateEvaluationQuestionHandler implements ICommandHandler<CreateEvaluationQuestionCommand, string> {
    private readonly evaluationQuestionService;
    private readonly commandBus;
    private readonly logger;
    constructor(evaluationQuestionService: EvaluationQuestionService, commandBus: CommandBus);
    execute(command: CreateEvaluationQuestionCommand): Promise<string>;
}
