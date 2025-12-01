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
exports.CreateTestQuestionGroupsHandler = exports.CreateTestQuestionGroupsCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_group_entity_1 = require("../../../domain/sub/question-group/question-group.entity");
class CreateTestQuestionGroupsCommand {
    createdBy;
    constructor(createdBy) {
        this.createdBy = createdBy;
    }
}
exports.CreateTestQuestionGroupsCommand = CreateTestQuestionGroupsCommand;
let CreateTestQuestionGroupsHandler = class CreateTestQuestionGroupsHandler {
    questionGroupRepository;
    constructor(questionGroupRepository) {
        this.questionGroupRepository = questionGroupRepository;
    }
    async execute(command) {
        const { createdBy } = command;
        const timestamp = Date.now();
        const groups = [];
        const defaultGroup = new question_group_entity_1.QuestionGroup({
            name: `기본 질문 그룹 ${timestamp}`,
            isDefault: true,
            isDeletable: false,
            createdBy,
        });
        groups.push(defaultGroup);
        const normalGroup1 = new question_group_entity_1.QuestionGroup({
            name: `동료평가 질문 그룹 ${timestamp}`,
            isDefault: false,
            isDeletable: true,
            createdBy,
        });
        groups.push(normalGroup1);
        const normalGroup2 = new question_group_entity_1.QuestionGroup({
            name: `자기평가 질문 그룹 ${timestamp}`,
            isDefault: false,
            isDeletable: true,
            createdBy,
        });
        groups.push(normalGroup2);
        const savedGroups = await this.questionGroupRepository.save(groups);
        console.log(`질문 그룹 ${savedGroups.length}개 생성 완료`);
        return savedGroups.map((g) => g.DTO로_변환한다());
    }
};
exports.CreateTestQuestionGroupsHandler = CreateTestQuestionGroupsHandler;
exports.CreateTestQuestionGroupsHandler = CreateTestQuestionGroupsHandler = __decorate([
    (0, cqrs_1.CommandHandler)(CreateTestQuestionGroupsCommand),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_group_entity_1.QuestionGroup)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CreateTestQuestionGroupsHandler);
//# sourceMappingURL=create-test-question-groups.handler.js.map