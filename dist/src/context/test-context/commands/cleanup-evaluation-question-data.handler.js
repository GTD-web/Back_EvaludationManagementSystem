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
exports.CleanupEvaluationQuestionDataHandler = exports.CleanupEvaluationQuestionDataCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_group_entity_1 = require("../../../domain/sub/question-group/question-group.entity");
const evaluation_question_entity_1 = require("../../../domain/sub/evaluation-question/evaluation-question.entity");
const question_group_mapping_entity_1 = require("../../../domain/sub/question-group-mapping/question-group-mapping.entity");
class CleanupEvaluationQuestionDataCommand {
}
exports.CleanupEvaluationQuestionDataCommand = CleanupEvaluationQuestionDataCommand;
let CleanupEvaluationQuestionDataHandler = class CleanupEvaluationQuestionDataHandler {
    questionGroupRepository;
    evaluationQuestionRepository;
    questionGroupMappingRepository;
    constructor(questionGroupRepository, evaluationQuestionRepository, questionGroupMappingRepository) {
        this.questionGroupRepository = questionGroupRepository;
        this.evaluationQuestionRepository = evaluationQuestionRepository;
        this.questionGroupMappingRepository = questionGroupMappingRepository;
    }
    async execute(command) {
        const mappings = await this.questionGroupMappingRepository.find();
        if (mappings.length > 0) {
            await this.questionGroupMappingRepository.remove(mappings);
        }
        const questions = await this.evaluationQuestionRepository.find();
        if (questions.length > 0) {
            await this.evaluationQuestionRepository.remove(questions);
        }
        const groups = await this.questionGroupRepository.find();
        if (groups.length > 0) {
            await this.questionGroupRepository.remove(groups);
        }
        console.log(`평가 질문 테스트 데이터 정리 완료 - 매핑: ${mappings.length}, 질문: ${questions.length}, 그룹: ${groups.length}`);
        return {
            mappings: mappings.length,
            questions: questions.length,
            groups: groups.length,
        };
    }
};
exports.CleanupEvaluationQuestionDataHandler = CleanupEvaluationQuestionDataHandler;
exports.CleanupEvaluationQuestionDataHandler = CleanupEvaluationQuestionDataHandler = __decorate([
    (0, cqrs_1.CommandHandler)(CleanupEvaluationQuestionDataCommand),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_group_entity_1.QuestionGroup)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_question_entity_1.EvaluationQuestion)),
    __param(2, (0, typeorm_1.InjectRepository)(question_group_mapping_entity_1.QuestionGroupMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CleanupEvaluationQuestionDataHandler);
//# sourceMappingURL=cleanup-evaluation-question-data.handler.js.map