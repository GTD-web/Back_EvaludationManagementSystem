"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CreateEvaluationQuestionHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEvaluationQuestionHandler = exports.CreateEvaluationQuestionCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_question_service_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.service");
const add_question_to_group_handler_1 = require("../../question-group-mapping/command/add-question-to-group.handler");
class CreateEvaluationQuestionCommand {
    data;
    createdBy;
    constructor(data, createdBy) {
        this.data = data;
        this.createdBy = createdBy;
    }
}
exports.CreateEvaluationQuestionCommand = CreateEvaluationQuestionCommand;
let CreateEvaluationQuestionHandler = CreateEvaluationQuestionHandler_1 = class CreateEvaluationQuestionHandler {
    evaluationQuestionService;
    commandBus;
    logger = new common_1.Logger(CreateEvaluationQuestionHandler_1.name);
    constructor(evaluationQuestionService, commandBus) {
        this.evaluationQuestionService = evaluationQuestionService;
        this.commandBus = commandBus;
    }
    async execute(command) {
        this.logger.log('평가 질문 생성 시작', command);
        const { data, createdBy } = command;
        const { groupId, displayOrder, ...questionData } = data;
        const evaluationQuestion = await this.evaluationQuestionService.생성한다(questionData, createdBy);
        this.logger.log(`평가 질문 생성 완료 - ID: ${evaluationQuestion.id}, 질문: ${evaluationQuestion.text}`);
        if (groupId) {
            try {
                const mappingId = await this.commandBus.execute(new add_question_to_group_handler_1.AddQuestionToGroupCommand({
                    groupId,
                    questionId: evaluationQuestion.id,
                    displayOrder,
                }, createdBy));
                this.logger.log(`평가 질문이 그룹에 추가됨 - 질문 ID: ${evaluationQuestion.id}, 그룹 ID: ${groupId}, 매핑 ID: ${mappingId}`);
            }
            catch (error) {
                this.logger.warn(`평가 질문은 생성되었으나 그룹 추가 실패 - 질문 ID: ${evaluationQuestion.id}, 그룹 ID: ${groupId}`, error.message);
            }
        }
        return evaluationQuestion.id;
    }
};
exports.CreateEvaluationQuestionHandler = CreateEvaluationQuestionHandler;
exports.CreateEvaluationQuestionHandler = CreateEvaluationQuestionHandler = CreateEvaluationQuestionHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateEvaluationQuestionCommand),
    __metadata("design:paramtypes", [evaluation_question_service_1.EvaluationQuestionService,
        cqrs_1.CommandBus])
], CreateEvaluationQuestionHandler);
//# sourceMappingURL=create-evaluation-question.handler.js.map