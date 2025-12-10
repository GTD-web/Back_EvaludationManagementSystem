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
exports.WbsEvaluationCriteriaManagementController = void 0;
const evaluation_criteria_business_service_1 = require("../../../business/evaluation-criteria/evaluation-criteria-business.service");
const evaluation_criteria_management_service_1 = require("../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wbs_evaluation_criteria_dto_1 = require("../../common/dto/evaluation-criteria/wbs-evaluation-criteria.dto");
const wbs_evaluation_criteria_api_decorators_1 = require("../../common/decorators/evaluation-criteria/wbs-evaluation-criteria-api.decorators");
let WbsEvaluationCriteriaManagementController = class WbsEvaluationCriteriaManagementController {
    evaluationCriteriaManagementService;
    evaluationCriteriaBusinessService;
    constructor(evaluationCriteriaManagementService, evaluationCriteriaBusinessService) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.evaluationCriteriaBusinessService = evaluationCriteriaBusinessService;
    }
    async getWbsEvaluationCriteriaList(filter) {
        return await this.evaluationCriteriaManagementService.WBS_평가기준_목록을_조회한다({
            wbsItemId: filter.wbsItemId,
            criteriaSearch: filter.criteriaSearch,
            criteriaExact: filter.criteriaExact,
        });
    }
    async getWbsEvaluationCriteriaDetail(id) {
        return await this.evaluationCriteriaManagementService.WBS_평가기준_상세를_조회한다(id);
    }
    async getWbsItemEvaluationCriteria(wbsItemId) {
        const criteria = await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(wbsItemId);
        return {
            wbsItemId,
            criteria,
        };
    }
    async upsertWbsEvaluationCriteria(wbsItemId, dto, user) {
        const actionBy = user.id;
        return await this.evaluationCriteriaManagementService.WBS_평가기준을_저장한다(wbsItemId, dto.criteria, dto.importance, actionBy);
    }
    async deleteWbsEvaluationCriteria(id, user) {
        const deletedBy = user.id;
        const success = await this.evaluationCriteriaManagementService.WBS_평가기준을_삭제한다(id, deletedBy);
        return { success };
    }
    async deleteWbsItemEvaluationCriteria(wbsItemId, user) {
        const deletedBy = user.id;
        const success = await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(wbsItemId, deletedBy);
        return { success };
    }
    async submitEvaluationCriteria(dto, user) {
        const submittedBy = user.id;
        const result = await this.evaluationCriteriaBusinessService.평가기준을_제출하고_재작성요청을_완료한다(dto.evaluationPeriodId, dto.employeeId, submittedBy);
        return {
            id: result.id,
            evaluationPeriodId: result.evaluationPeriodId,
            employeeId: result.employeeId,
            isCriteriaSubmitted: result.isCriteriaSubmitted,
            criteriaSubmittedAt: result.criteriaSubmittedAt,
            criteriaSubmittedBy: result.criteriaSubmittedBy,
        };
    }
    async resetEvaluationCriteriaSubmission(dto, user) {
        const updatedBy = user.id;
        const result = await this.evaluationCriteriaManagementService.평가기준_제출을_초기화한다(dto.evaluationPeriodId, dto.employeeId, updatedBy);
        return {
            id: result.id,
            evaluationPeriodId: result.evaluationPeriodId,
            employeeId: result.employeeId,
            isCriteriaSubmitted: result.isCriteriaSubmitted,
            criteriaSubmittedAt: result.criteriaSubmittedAt,
            criteriaSubmittedBy: result.criteriaSubmittedBy,
        };
    }
};
exports.WbsEvaluationCriteriaManagementController = WbsEvaluationCriteriaManagementController;
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.GetWbsEvaluationCriteriaList)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_dto_1.WbsEvaluationCriteriaFilterDto]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "getWbsEvaluationCriteriaList", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.GetWbsEvaluationCriteriaDetail)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "getWbsEvaluationCriteriaDetail", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.GetWbsItemEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('wbsItemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "getWbsItemEvaluationCriteria", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.UpsertWbsEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('wbsItemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_evaluation_criteria_dto_1.UpsertWbsEvaluationCriteriaBodyDto, Object]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "upsertWbsEvaluationCriteria", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.DeleteWbsEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "deleteWbsEvaluationCriteria", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.DeleteWbsItemEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('wbsItemId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "deleteWbsItemEvaluationCriteria", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.SubmitEvaluationCriteria)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_dto_1.SubmitEvaluationCriteriaDto, Object]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "submitEvaluationCriteria", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.ResetEvaluationCriteriaSubmission)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_dto_1.SubmitEvaluationCriteriaDto, Object]),
    __metadata("design:returntype", Promise)
], WbsEvaluationCriteriaManagementController.prototype, "resetEvaluationCriteriaSubmission", null);
exports.WbsEvaluationCriteriaManagementController = WbsEvaluationCriteriaManagementController = __decorate([
    (0, swagger_1.ApiTags)('B-3. 관리자 - 평가 설정 - WBS 평가기준'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/evaluation-criteria/wbs-evaluation-criteria'),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        evaluation_criteria_business_service_1.EvaluationCriteriaBusinessService])
], WbsEvaluationCriteriaManagementController);
//# sourceMappingURL=wbs-evaluation-criteria-management.controller.js.map