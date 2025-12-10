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
exports.EvaluationLineManagementController = void 0;
const evaluation_criteria_management_service_1 = require("../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const evaluation_line_business_service_1 = require("../../../business/evaluation-line/evaluation-line-business.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_line_dto_1 = require("../../common/dto/evaluation-criteria/evaluation-line.dto");
const evaluation_line_api_decorators_1 = require("../../common/decorators/evaluation-criteria/evaluation-line-api.decorators");
let EvaluationLineManagementController = class EvaluationLineManagementController {
    evaluationCriteriaManagementService;
    evaluationLineBusinessService;
    constructor(evaluationCriteriaManagementService, evaluationLineBusinessService) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.evaluationLineBusinessService = evaluationLineBusinessService;
    }
    async getEvaluatorEmployees(periodId, evaluatorId) {
        return await this.evaluationCriteriaManagementService.특정_평가자가_평가해야_하는_피평가자_목록을_조회한다(periodId, evaluatorId);
    }
    async getEmployeeEvaluationSettings(employeeId, periodId) {
        const settings = await this.evaluationCriteriaManagementService.특정_평가기간에_직원의_평가설정을_통합_조회한다(employeeId, periodId);
        return {
            employeeId,
            periodId,
            ...settings,
        };
    }
    async configurePrimaryEvaluator(employeeId, periodId, dto, user) {
        return await this.evaluationLineBusinessService.일차_평가자를_구성한다(employeeId, periodId, dto.evaluatorId, user.id);
    }
    async configureSecondaryEvaluator(employeeId, wbsItemId, periodId, dto, user) {
        return await this.evaluationLineBusinessService.이차_평가자를_구성한다(employeeId, wbsItemId, periodId, dto.evaluatorId, user.id);
    }
    async getEvaluatorsByPeriod(periodId, query) {
        const type = query.type || 'all';
        return await this.evaluationCriteriaManagementService.평가기간의_평가자_목록을_조회한다(periodId, type);
    }
    async batchConfigurePrimaryEvaluator(periodId, dto, user) {
        return await this.evaluationLineBusinessService.여러_피평가자의_일차_평가자를_일괄_구성한다(periodId, dto.assignments, user.id);
    }
    async batchConfigureSecondaryEvaluator(periodId, dto, user) {
        return await this.evaluationLineBusinessService.여러_피평가자의_이차_평가자를_일괄_구성한다(periodId, dto.assignments, user.id);
    }
};
exports.EvaluationLineManagementController = EvaluationLineManagementController;
__decorate([
    (0, evaluation_line_api_decorators_1.GetEvaluatorEmployees)(),
    __param(0, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('evaluatorId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EvaluationLineManagementController.prototype, "getEvaluatorEmployees", null);
__decorate([
    (0, evaluation_line_api_decorators_1.GetEmployeeEvaluationSettings)(),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EvaluationLineManagementController.prototype, "getEmployeeEvaluationSettings", null);
__decorate([
    (0, evaluation_line_api_decorators_1.ConfigurePrimaryEvaluator)(),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, evaluation_line_dto_1.ConfigurePrimaryEvaluatorDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationLineManagementController.prototype, "configurePrimaryEvaluator", null);
__decorate([
    (0, evaluation_line_api_decorators_1.ConfigureSecondaryEvaluator)(),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('wbsItemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, evaluation_line_dto_1.ConfigureSecondaryEvaluatorDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationLineManagementController.prototype, "configureSecondaryEvaluator", null);
__decorate([
    (0, evaluation_line_api_decorators_1.GetEvaluatorsByPeriod)(),
    __param(0, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_line_dto_1.EvaluatorTypeQueryDto]),
    __metadata("design:returntype", Promise)
], EvaluationLineManagementController.prototype, "getEvaluatorsByPeriod", null);
__decorate([
    (0, evaluation_line_api_decorators_1.BatchConfigurePrimaryEvaluator)(),
    __param(0, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_line_dto_1.BatchConfigurePrimaryEvaluatorDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationLineManagementController.prototype, "batchConfigurePrimaryEvaluator", null);
__decorate([
    (0, evaluation_line_api_decorators_1.BatchConfigureSecondaryEvaluator)(),
    __param(0, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_line_dto_1.BatchConfigureSecondaryEvaluatorDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationLineManagementController.prototype, "batchConfigureSecondaryEvaluator", null);
exports.EvaluationLineManagementController = EvaluationLineManagementController = __decorate([
    (0, swagger_1.ApiTags)('B-4. 관리자 - 평가 설정 - 평가라인'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/evaluation-criteria/evaluation-lines'),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        evaluation_line_business_service_1.EvaluationLineBusinessService])
], EvaluationLineManagementController);
//# sourceMappingURL=evaluation-line-management.controller.js.map