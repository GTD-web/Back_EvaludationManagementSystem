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
exports.EvaluationTargetController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_period_management_service_1 = require("../../../context/evaluation-period-management-context/evaluation-period-management.service");
const evaluation_target_business_service_1 = require("../../../business/evaluation-target/evaluation-target-business.service");
const parse_uuid_decorator_1 = require("../../common/decorators/parse-uuid.decorator");
const decorators_1 = require("../../common/decorators");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const evaluation_target_api_decorators_1 = require("../../common/decorators/evaluation-period/evaluation-target-api.decorators");
const evaluation_target_dto_1 = require("../../common/dto/evaluation-period/evaluation-target.dto");
let EvaluationTargetController = class EvaluationTargetController {
    evaluationPeriodManagementService;
    evaluationTargetBusinessService;
    constructor(evaluationPeriodManagementService, evaluationTargetBusinessService) {
        this.evaluationPeriodManagementService = evaluationPeriodManagementService;
        this.evaluationTargetBusinessService = evaluationTargetBusinessService;
    }
    async registerBulkEvaluationTargets(evaluationPeriodId, dto, user) {
        const results = await this.evaluationTargetBusinessService.평가대상자를_대량_등록한다(evaluationPeriodId, dto.employeeIds, user.id);
        return results.map((result) => result.mapping);
    }
    async registerEvaluationTarget(evaluationPeriodId, employeeId, user) {
        const result = await this.evaluationTargetBusinessService.평가대상자를_등록한다(evaluationPeriodId, employeeId, user.id);
        return result.mapping;
    }
    async excludeEvaluationTarget(evaluationPeriodId, employeeId, dto, user) {
        return await this.evaluationPeriodManagementService.평가대상에서_제외한다(evaluationPeriodId, employeeId, dto.excludeReason, user.id);
    }
    async includeEvaluationTarget(evaluationPeriodId, employeeId, user) {
        return await this.evaluationPeriodManagementService.평가대상에_포함한다(evaluationPeriodId, employeeId, user.id);
    }
    async getEvaluationTargets(evaluationPeriodId, includeExcluded = false) {
        const targets = await this.evaluationPeriodManagementService.평가기간의_평가대상자_조회한다(evaluationPeriodId, includeExcluded);
        return {
            evaluationPeriodId,
            targets: targets.map((target) => {
                const { evaluationPeriodId: _, employeeId: __, ...rest } = target;
                return rest;
            }),
        };
    }
    async getExcludedEvaluationTargets(evaluationPeriodId) {
        const targets = await this.evaluationPeriodManagementService.평가기간의_제외된_대상자_조회한다(evaluationPeriodId);
        return {
            evaluationPeriodId,
            targets: targets.map((target) => {
                const { evaluationPeriodId: _, employeeId: __, ...rest } = target;
                return rest;
            }),
        };
    }
    async getEmployeeEvaluationPeriods(employeeId) {
        const mappings = await this.evaluationPeriodManagementService.직원의_평가기간_맵핑_조회한다(employeeId);
        const employee = mappings.length > 0
            ? mappings[0].employee
            : {
                id: employeeId,
                employeeNumber: '',
                name: '알 수 없음',
                email: '',
                status: '',
            };
        return {
            employee,
            mappings: mappings.map((mapping) => {
                const { employee: _, employeeId: __, ...rest } = mapping;
                return rest;
            }),
        };
    }
    async checkEvaluationTarget(evaluationPeriodId, employeeId) {
        return await this.evaluationPeriodManagementService.평가대상_여부_확인한다(evaluationPeriodId, employeeId);
    }
    async getUnregisteredEmployees(evaluationPeriodId) {
        return await this.evaluationPeriodManagementService.평가기간에_등록되지_않은_직원_목록을_조회한다(evaluationPeriodId);
    }
    async unregisterEvaluationTarget(evaluationPeriodId, employeeId, user) {
        const result = await this.evaluationTargetBusinessService.평가대상자_등록_해제한다(evaluationPeriodId, employeeId, user.id);
        return { success: result };
    }
    async unregisterAllEvaluationTargets(evaluationPeriodId) {
        const deletedCount = await this.evaluationPeriodManagementService.평가기간의_모든_대상자_해제한다(evaluationPeriodId);
        return { deletedCount };
    }
};
exports.EvaluationTargetController = EvaluationTargetController;
__decorate([
    (0, evaluation_target_api_decorators_1.RegisterBulkEvaluationTargets)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_target_dto_1.RegisterBulkEvaluationTargetsDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "registerBulkEvaluationTargets", null);
__decorate([
    (0, evaluation_target_api_decorators_1.RegisterEvaluationTarget)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "registerEvaluationTarget", null);
__decorate([
    (0, evaluation_target_api_decorators_1.ExcludeEvaluationTarget)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, evaluation_target_dto_1.ExcludeEvaluationTargetDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "excludeEvaluationTarget", null);
__decorate([
    (0, evaluation_target_api_decorators_1.IncludeEvaluationTarget)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "includeEvaluationTarget", null);
__decorate([
    (0, evaluation_target_api_decorators_1.GetEvaluationTargets)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, common_1.Query)('includeExcluded', new common_1.ParseBoolPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "getEvaluationTargets", null);
__decorate([
    (0, evaluation_target_api_decorators_1.GetExcludedEvaluationTargets)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "getExcludedEvaluationTargets", null);
__decorate([
    (0, evaluation_target_api_decorators_1.GetEmployeeEvaluationPeriods)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "getEmployeeEvaluationPeriods", null);
__decorate([
    (0, evaluation_target_api_decorators_1.CheckEvaluationTarget)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "checkEvaluationTarget", null);
__decorate([
    (0, evaluation_target_api_decorators_1.GetUnregisteredEmployees)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "getUnregisteredEmployees", null);
__decorate([
    (0, evaluation_target_api_decorators_1.UnregisterEvaluationTarget)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "unregisterEvaluationTarget", null);
__decorate([
    (0, evaluation_target_api_decorators_1.UnregisterAllEvaluationTargets)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluationPeriodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationTargetController.prototype, "unregisterAllEvaluationTargets", null);
exports.EvaluationTargetController = EvaluationTargetController = __decorate([
    (0, swagger_1.ApiTags)('A-3. 관리자 - 평가 대상'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/evaluation-periods'),
    __metadata("design:paramtypes", [evaluation_period_management_service_1.EvaluationPeriodManagementContextService,
        evaluation_target_business_service_1.EvaluationTargetBusinessService])
], EvaluationTargetController);
//# sourceMappingURL=evaluation-target.controller.js.map