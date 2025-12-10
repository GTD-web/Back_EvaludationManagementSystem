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
exports.EvaluationQuestionManagementController = void 0;
const evaluation_question_management_service_1 = require("../../../context/evaluation-question-management-context/evaluation-question-management.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_question_api_decorators_1 = require("../../common/decorators/performance-evaluation/evaluation-question-api.decorators");
const evaluation_question_dto_1 = require("../../common/dto/performance-evaluation/evaluation-question.dto");
let EvaluationQuestionManagementController = class EvaluationQuestionManagementController {
    evaluationQuestionManagementService;
    constructor(evaluationQuestionManagementService) {
        this.evaluationQuestionManagementService = evaluationQuestionManagementService;
    }
    async createQuestionGroup(dto, user) {
        const createdBy = user.id;
        const groupId = await this.evaluationQuestionManagementService.질문그룹을_생성한다({
            name: dto.name,
            isDefault: dto.isDefault,
        }, createdBy);
        return {
            id: groupId,
            message: '질문 그룹이 성공적으로 생성되었습니다.',
        };
    }
    async updateQuestionGroup(id, dto, user) {
        const updatedBy = user.id;
        await this.evaluationQuestionManagementService.질문그룹을_수정한다(id, {
            name: dto.name,
            isDefault: dto.isDefault,
        }, updatedBy);
        return {
            id,
            message: '질문 그룹이 성공적으로 수정되었습니다.',
        };
    }
    async deleteQuestionGroup(id, user) {
        const deletedBy = user.id;
        await this.evaluationQuestionManagementService.질문그룹을_삭제한다(id, deletedBy);
    }
    async getQuestionGroups() {
        return await this.evaluationQuestionManagementService.질문그룹목록을_조회한다();
    }
    async getDefaultQuestionGroup() {
        return await this.evaluationQuestionManagementService.기본질문그룹을_조회한다();
    }
    async getQuestionGroup(id) {
        return await this.evaluationQuestionManagementService.질문그룹을_조회한다(id);
    }
    async createEvaluationQuestion(dto, user) {
        const createdBy = user.id;
        const questionId = await this.evaluationQuestionManagementService.평가질문을_생성한다({
            text: dto.text,
            minScore: dto.minScore,
            maxScore: dto.maxScore,
            groupId: dto.groupId,
            displayOrder: dto.displayOrder,
        }, createdBy);
        return {
            id: questionId,
            message: '평가 질문이 성공적으로 생성되었습니다.',
        };
    }
    async updateEvaluationQuestion(id, dto, user) {
        const updatedBy = user.id;
        await this.evaluationQuestionManagementService.평가질문을_수정한다(id, {
            text: dto.text,
            minScore: dto.minScore,
            maxScore: dto.maxScore,
        }, updatedBy);
        return {
            id,
            message: '평가 질문이 성공적으로 수정되었습니다.',
        };
    }
    async deleteEvaluationQuestion(id, user) {
        const deletedBy = user.id;
        await this.evaluationQuestionManagementService.평가질문을_삭제한다(id, deletedBy);
    }
    async getEvaluationQuestion(id) {
        return await this.evaluationQuestionManagementService.평가질문을_조회한다(id);
    }
    async getEvaluationQuestions() {
        return await this.evaluationQuestionManagementService.평가질문목록을_조회한다();
    }
    async copyEvaluationQuestion(id, user) {
        const copiedBy = user.id;
        const newQuestionId = await this.evaluationQuestionManagementService.평가질문을_복사한다(id, copiedBy);
        return {
            id: newQuestionId,
            message: '평가 질문이 성공적으로 복사되었습니다.',
        };
    }
    async addQuestionToGroup(dto, user) {
        const createdBy = user.id;
        const mappingId = await this.evaluationQuestionManagementService.그룹에_질문을_추가한다({
            groupId: dto.groupId,
            questionId: dto.questionId,
            displayOrder: dto.displayOrder,
        }, createdBy);
        return {
            id: mappingId,
            message: '그룹에 질문이 성공적으로 추가되었습니다.',
        };
    }
    async addMultipleQuestionsToGroup(dto, user) {
        const createdBy = user.id;
        const mappingIds = await this.evaluationQuestionManagementService.그룹에_여러_질문을_추가한다(dto.groupId, dto.questionIds, dto.startDisplayOrder ?? 0, createdBy);
        return {
            ids: mappingIds,
            message: '그룹에 여러 질문이 성공적으로 추가되었습니다.',
            successCount: mappingIds.length,
            totalCount: dto.questionIds.length,
        };
    }
    async reorderGroupQuestions(dto, user) {
        const updatedBy = user.id;
        await this.evaluationQuestionManagementService.그룹내_질문순서를_재정의한다(dto.groupId, dto.questionIds, updatedBy);
        return {
            id: dto.groupId,
            message: '그룹 내 질문 순서가 성공적으로 재정의되었습니다.',
        };
    }
    async removeQuestionFromGroup(mappingId, user) {
        const deletedBy = user.id;
        await this.evaluationQuestionManagementService.그룹에서_질문을_제거한다(mappingId, deletedBy);
    }
    async moveQuestionUp(mappingId, user) {
        const updatedBy = user.id;
        await this.evaluationQuestionManagementService.질문순서를_위로_이동한다(mappingId, updatedBy);
        return {
            id: mappingId,
            message: '질문 순서가 성공적으로 위로 이동되었습니다.',
        };
    }
    async moveQuestionDown(mappingId, user) {
        const updatedBy = user.id;
        await this.evaluationQuestionManagementService.질문순서를_아래로_이동한다(mappingId, updatedBy);
        return {
            id: mappingId,
            message: '질문 순서가 성공적으로 아래로 이동되었습니다.',
        };
    }
    async getGroupQuestions(groupId) {
        return await this.evaluationQuestionManagementService.그룹의_질문목록을_조회한다(groupId);
    }
    async getQuestionGroupsByQuestion(questionId) {
        return await this.evaluationQuestionManagementService.질문이_속한_그룹목록을_조회한다(questionId);
    }
};
exports.EvaluationQuestionManagementController = EvaluationQuestionManagementController;
__decorate([
    (0, evaluation_question_api_decorators_1.CreateQuestionGroup)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluation_question_dto_1.CreateQuestionGroupDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "createQuestionGroup", null);
__decorate([
    (0, evaluation_question_api_decorators_1.UpdateQuestionGroup)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_question_dto_1.UpdateQuestionGroupDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "updateQuestionGroup", null);
__decorate([
    (0, evaluation_question_api_decorators_1.DeleteQuestionGroup)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "deleteQuestionGroup", null);
__decorate([
    (0, evaluation_question_api_decorators_1.GetQuestionGroups)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "getQuestionGroups", null);
__decorate([
    (0, evaluation_question_api_decorators_1.GetDefaultQuestionGroup)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "getDefaultQuestionGroup", null);
__decorate([
    (0, evaluation_question_api_decorators_1.GetQuestionGroup)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "getQuestionGroup", null);
__decorate([
    (0, evaluation_question_api_decorators_1.CreateEvaluationQuestion)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluation_question_dto_1.CreateEvaluationQuestionDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "createEvaluationQuestion", null);
__decorate([
    (0, evaluation_question_api_decorators_1.UpdateEvaluationQuestion)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_question_dto_1.UpdateEvaluationQuestionDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "updateEvaluationQuestion", null);
__decorate([
    (0, evaluation_question_api_decorators_1.DeleteEvaluationQuestion)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "deleteEvaluationQuestion", null);
__decorate([
    (0, evaluation_question_api_decorators_1.GetEvaluationQuestion)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "getEvaluationQuestion", null);
__decorate([
    (0, evaluation_question_api_decorators_1.GetEvaluationQuestions)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "getEvaluationQuestions", null);
__decorate([
    (0, evaluation_question_api_decorators_1.CopyEvaluationQuestion)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "copyEvaluationQuestion", null);
__decorate([
    (0, evaluation_question_api_decorators_1.AddQuestionToGroup)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluation_question_dto_1.AddQuestionToGroupDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "addQuestionToGroup", null);
__decorate([
    (0, evaluation_question_api_decorators_1.AddMultipleQuestionsToGroup)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluation_question_dto_1.AddMultipleQuestionsToGroupDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "addMultipleQuestionsToGroup", null);
__decorate([
    (0, evaluation_question_api_decorators_1.ReorderGroupQuestions)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluation_question_dto_1.ReorderGroupQuestionsDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "reorderGroupQuestions", null);
__decorate([
    (0, evaluation_question_api_decorators_1.RemoveQuestionFromGroup)(),
    __param(0, (0, common_1.Param)('mappingId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "removeQuestionFromGroup", null);
__decorate([
    (0, evaluation_question_api_decorators_1.MoveQuestionUp)(),
    __param(0, (0, common_1.Param)('mappingId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "moveQuestionUp", null);
__decorate([
    (0, evaluation_question_api_decorators_1.MoveQuestionDown)(),
    __param(0, (0, common_1.Param)('mappingId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "moveQuestionDown", null);
__decorate([
    (0, evaluation_question_api_decorators_1.GetGroupQuestions)(),
    __param(0, (0, common_1.Param)('groupId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "getGroupQuestions", null);
__decorate([
    (0, evaluation_question_api_decorators_1.GetQuestionGroupsByQuestion)(),
    __param(0, (0, common_1.Param)('questionId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationQuestionManagementController.prototype, "getQuestionGroupsByQuestion", null);
exports.EvaluationQuestionManagementController = EvaluationQuestionManagementController = __decorate([
    (0, swagger_1.ApiTags)('C-4. 관리자 - 성과평가 - 평가 질문 관리'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/performance-evaluation/evaluation-questions'),
    __metadata("design:paramtypes", [evaluation_question_management_service_1.EvaluationQuestionManagementService])
], EvaluationQuestionManagementController);
//# sourceMappingURL=evaluation-question-management.controller.js.map