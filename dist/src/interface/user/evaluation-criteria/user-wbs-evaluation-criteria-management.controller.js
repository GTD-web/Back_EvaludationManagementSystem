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
exports.UserWbsEvaluationCriteriaManagementController = void 0;
const evaluation_criteria_management_service_1 = require("../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wbs_evaluation_criteria_api_decorators_1 = require("../../common/decorators/evaluation-criteria/wbs-evaluation-criteria-api.decorators");
const wbs_evaluation_criteria_dto_1 = require("../../common/dto/evaluation-criteria/wbs-evaluation-criteria.dto");
let UserWbsEvaluationCriteriaManagementController = class UserWbsEvaluationCriteriaManagementController {
    evaluationCriteriaManagementService;
    constructor(evaluationCriteriaManagementService) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
    }
    async upsertWbsEvaluationCriteria(wbsItemId, dto, user) {
        const actionBy = user.id;
        return await this.evaluationCriteriaManagementService.WBS_평가기준을_저장한다(wbsItemId, dto.criteria, dto.importance, actionBy);
    }
};
exports.UserWbsEvaluationCriteriaManagementController = UserWbsEvaluationCriteriaManagementController;
__decorate([
    (0, wbs_evaluation_criteria_api_decorators_1.UpsertWbsEvaluationCriteria)(),
    __param(0, (0, common_1.Param)('wbsItemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_evaluation_criteria_dto_1.UpsertWbsEvaluationCriteriaBodyDto, Object]),
    __metadata("design:returntype", Promise)
], UserWbsEvaluationCriteriaManagementController.prototype, "upsertWbsEvaluationCriteria", null);
exports.UserWbsEvaluationCriteriaManagementController = UserWbsEvaluationCriteriaManagementController = __decorate([
    (0, swagger_1.ApiTags)('A-5. 사용자 - 평가 설정 - WBS 평가기준'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('user'),
    (0, common_1.Controller)('user/evaluation-criteria/wbs-evaluation-criteria'),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService])
], UserWbsEvaluationCriteriaManagementController);
//# sourceMappingURL=user-wbs-evaluation-criteria-management.controller.js.map