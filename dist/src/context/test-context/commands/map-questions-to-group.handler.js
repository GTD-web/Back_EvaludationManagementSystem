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
exports.MapQuestionsToGroupHandler = exports.MapQuestionsToGroupCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_group_mapping_entity_1 = require("../../../domain/sub/question-group-mapping/question-group-mapping.entity");
class MapQuestionsToGroupCommand {
    groupId;
    questionIds;
    createdBy;
    constructor(groupId, questionIds, createdBy) {
        this.groupId = groupId;
        this.questionIds = questionIds;
        this.createdBy = createdBy;
    }
}
exports.MapQuestionsToGroupCommand = MapQuestionsToGroupCommand;
let MapQuestionsToGroupHandler = class MapQuestionsToGroupHandler {
    questionGroupMappingRepository;
    constructor(questionGroupMappingRepository) {
        this.questionGroupMappingRepository = questionGroupMappingRepository;
    }
    async execute(command) {
        const { groupId, questionIds, createdBy } = command;
        const mappings = [];
        for (let i = 0; i < questionIds.length; i++) {
            const mapping = new question_group_mapping_entity_1.QuestionGroupMapping({
                groupId,
                questionId: questionIds[i],
                displayOrder: i,
                createdBy,
            });
            mappings.push(mapping);
        }
        const savedMappings = await this.questionGroupMappingRepository.save(mappings);
        console.log(`질문 그룹 매핑 ${savedMappings.length}개 생성 완료 (그룹 ID: ${groupId})`);
        return savedMappings.map((m) => m.DTO로_변환한다());
    }
};
exports.MapQuestionsToGroupHandler = MapQuestionsToGroupHandler;
exports.MapQuestionsToGroupHandler = MapQuestionsToGroupHandler = __decorate([
    (0, cqrs_1.CommandHandler)(MapQuestionsToGroupCommand),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_group_mapping_entity_1.QuestionGroupMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MapQuestionsToGroupHandler);
//# sourceMappingURL=map-questions-to-group.handler.js.map