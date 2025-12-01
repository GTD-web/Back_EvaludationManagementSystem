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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTestQuestionsHandler = exports.CreateTestQuestionsCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_question_entity_1 = require("../../../domain/sub/evaluation-question/evaluation-question.entity");
class CreateTestQuestionsCommand {
    createdBy;
    constructor(createdBy) {
        this.createdBy = createdBy;
    }
}
exports.CreateTestQuestionsCommand = CreateTestQuestionsCommand;
let CreateTestQuestionsHandler = class CreateTestQuestionsHandler {
    evaluationQuestionRepository;
    constructor(evaluationQuestionRepository) {
        this.evaluationQuestionRepository = evaluationQuestionRepository;
    }
    async execute(command) {
        const { createdBy } = command;
        const questions = [];
        questions.push(new evaluation_question_entity_1.EvaluationQuestion({
            text: '동료의 업무 수행 능력을 평가해주세요.',
            minScore: 1,
            maxScore: 5,
            createdBy,
        }));
        questions.push(new evaluation_question_entity_1.EvaluationQuestion({
            text: '동료의 협업 능력을 평가해주세요.',
            minScore: 1,
            maxScore: 5,
            createdBy,
        }));
        questions.push(new evaluation_question_entity_1.EvaluationQuestion({
            text: '동료의 의사소통 능력을 평가해주세요.',
            minScore: 1,
            maxScore: 5,
            createdBy,
        }));
        questions.push(new evaluation_question_entity_1.EvaluationQuestion({
            text: '동료의 문제 해결 능력을 평가해주세요.',
            minScore: 1,
            maxScore: 5,
            createdBy,
        }));
        questions.push(new evaluation_question_entity_1.EvaluationQuestion({
            text: '동료의 책임감을 평가해주세요.',
            minScore: 1,
            maxScore: 5,
            createdBy,
        }));
        const savedQuestions = await this.evaluationQuestionRepository.save(questions);
        console.log(`평가 질문 ${savedQuestions.length}개 생성 완료`);
        return savedQuestions.map((q) => q.DTO로_변환한다());
    }
};
exports.CreateTestQuestionsHandler = CreateTestQuestionsHandler;
exports.CreateTestQuestionsHandler = CreateTestQuestionsHandler = __decorate([
    (0, cqrs_1.CommandHandler)(CreateTestQuestionsCommand),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_question_entity_1.EvaluationQuestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CreateTestQuestionsHandler);
//# sourceMappingURL=create-test-questions.handler.js.map