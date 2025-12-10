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
exports.EvaluatorWbsEvaluationCriteriaManagementController = void 0;
const evaluation_criteria_business_service_1 = require("../../../business/evaluation-criteria/evaluation-criteria-business.service");
const evaluation_criteria_management_service_1 = require("../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const wbs_evaluation_criteria_api_decorators_1 = require("../../common/decorators/evaluation-criteria/wbs-evaluation-criteria-api.decorators");
const wbs_evaluation_criteria_dto_1 = require("../../common/dto/evaluation-criteria/wbs-evaluation-criteria.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let EvaluatorWbsEvaluationCriteriaManagementController = class EvaluatorWbsEvaluationCriteriaManagementController {
    evaluationCriteriaManagementService;
    evaluationCriteriaBusinessService;
    constructor(evaluationCriteriaManagementService, evaluationCriteriaBusinessService) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.evaluationCriteriaBusinessService = evaluationCriteriaBusinessService;
    }
    async upsertWbsEvaluationCriteria(wbsItemId, dto, user) {
        const actionBy = user.id;
        return await this.evaluationCriteriaManagementService.WBS_평가기준을_저장한다(wbsItemId, dto.criteria, dto.importance, actionBy);
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
};
exports.EvaluatorWbsEvaluationCriteriaManagementController = EvaluatorWbsEvaluationCriteriaManagementController;
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.UpsertWbsEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('wbsItemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_evaluation_criteria_dto_1.UpsertWbsEvaluationCriteriaBodyDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorWbsEvaluationCriteriaManagementController.prototype, "upsertWbsEvaluationCriteria", null);
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.SubmitEvaluationCriteria)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_dto_1.SubmitEvaluationCriteriaDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorWbsEvaluationCriteriaManagementController.prototype, "submitEvaluationCriteria", null);
exports.EvaluatorWbsEvaluationCriteriaManagementController = EvaluatorWbsEvaluationCriteriaManagementController = __decorate([
    (0, swagger_1.ApiTags)('B-3. 평가자 - 평가 설정 - WBS 평가기준'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('evaluator'),
    (0, common_1.Controller)('evaluator/evaluation-criteria/wbs-evaluation-criteria'),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        evaluation_criteria_business_service_1.EvaluationCriteriaBusinessService])
], EvaluatorWbsEvaluationCriteriaManagementController);
//# sourceMappingURL=evaluator-wbs-evaluation-criteria-management.controller.js.map