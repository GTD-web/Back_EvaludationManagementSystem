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
var AddQuestionToGroupHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddQuestionToGroupHandler = exports.AddQuestionToGroupCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_group_mapping_service_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.service");
const question_group_mapping_entity_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.entity");
const question_group_entity_1 = require("../../../../../domain/sub/question-group/question-group.entity");
const evaluation_question_entity_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.entity");
class AddQuestionToGroupCommand {
    data;
    createdBy;
    constructor(data, createdBy) {
        this.data = data;
        this.createdBy = createdBy;
    }
}
exports.AddQuestionToGroupCommand = AddQuestionToGroupCommand;
let AddQuestionToGroupHandler = AddQuestionToGroupHandler_1 = class AddQuestionToGroupHandler {
    questionGroupMappingService;
    questionGroupMappingRepository;
    questionGroupRepository;
    evaluationQuestionRepository;
    logger = new common_1.Logger(AddQuestionToGroupHandler_1.name);
    constructor(questionGroupMappingService, questionGroupMappingRepository, questionGroupRepository, evaluationQuestionRepository) {
        this.questionGroupMappingService = questionGroupMappingService;
        this.questionGroupMappingRepository = questionGroupMappingRepository;
        this.questionGroupRepository = questionGroupRepository;
        this.evaluationQuestionRepository = evaluationQuestionRepository;
    }
    async execute(command) {
        this.logger.log('그룹에 질문 추가 시작', command);
        const { data, createdBy } = command;
        const group = await this.questionGroupRepository
            .createQueryBuilder('group')
            .where('group.id = :groupId', { groupId: data.groupId })
            .andWhere('group.deletedAt IS NULL')
            .getOne();
        if (!group) {
            throw new common_1.NotFoundException(`질문 그룹을 찾을 수 없습니다. (id: ${data.groupId})`);
        }
        const question = await this.evaluationQuestionRepository
            .createQueryBuilder('question')
            .where('question.id = :questionId', { questionId: data.questionId })
            .andWhere('question.deletedAt IS NULL')
            .getOne();
        if (!question) {
            throw new common_1.NotFoundException(`평가 질문을 찾을 수 없습니다. (id: ${data.questionId})`);
        }
        let displayOrder;
        if (data.displayOrder === undefined || data.displayOrder === null) {
            const maxOrderMapping = await this.questionGroupMappingRepository
                .createQueryBuilder('mapping')
                .where('mapping.groupId = :groupId', { groupId: data.groupId })
                .andWhere('mapping.deletedAt IS NULL')
                .orderBy('mapping.displayOrder', 'DESC')
                .getOne();
            displayOrder = maxOrderMapping ? maxOrderMapping.displayOrder + 1 : 0;
            this.logger.log(`displayOrder 자동 설정 - 그룹 ID: ${data.groupId}, 순서: ${displayOrder}`);
        }
        else {
            displayOrder = data.displayOrder;
        }
        const mapping = await this.questionGroupMappingService.생성한다({
            ...data,
            displayOrder,
        }, createdBy);
        this.logger.log(`그룹에 질문 추가 완료 - 매핑 ID: ${mapping.id}, 그룹: ${data.groupId}, 질문: ${data.questionId}, 순서: ${displayOrder}`);
        return mapping.id;
    }
};
exports.AddQuestionToGroupHandler = AddQuestionToGroupHandler;
exports.AddQuestionToGroupHandler = AddQuestionToGroupHandler = AddQuestionToGroupHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(AddQuestionToGroupCommand),
    __param(1, (0, typeorm_1.InjectRepository)(question_group_mapping_entity_1.QuestionGroupMapping)),
    __param(2, (0, typeorm_1.InjectRepository)(question_group_entity_1.QuestionGroup)),
    __param(3, (0, typeorm_1.InjectRepository)(evaluation_question_entity_1.EvaluationQuestion)),
    __metadata("design:paramtypes", [question_group_mapping_service_1.QuestionGroupMappingService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AddQuestionToGroupHandler);
//# sourceMappingURL=add-question-to-group.handler.js.map