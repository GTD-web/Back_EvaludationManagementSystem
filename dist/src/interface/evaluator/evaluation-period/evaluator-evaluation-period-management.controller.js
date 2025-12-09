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
exports.EvaluatorEvaluationPeriodManagementController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_period_management_service_1 = require("../../../context/evaluation-period-management-context/evaluation-period-management.service");
const evaluation_period_business_service_1 = require("../../../business/evaluation-period/evaluation-period-business.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const parse_uuid_decorator_1 = require("../../common/decorators/parse-uuid.decorator");
const evaluation_period_api_decorators_1 = require("../../common/decorators/evaluation-period/evaluation-period-api.decorators");
const evaluation_management_dto_1 = require("../../common/dto/evaluation-period/evaluation-management.dto");
const system_setting_service_1 = require("../../../domain/common/system-setting/system-setting.service");
let EvaluatorEvaluationPeriodManagementController = class EvaluatorEvaluationPeriodManagementController {
    evaluationPeriodBusinessService;
    evaluationPeriodManagementService;
    systemSettingService;
    constructor(evaluationPeriodBusinessService, evaluationPeriodManagementService, systemSettingService) {
        this.evaluationPeriodBusinessService = evaluationPeriodBusinessService;
        this.evaluationPeriodManagementService = evaluationPeriodManagementService;
        this.systemSettingService = systemSettingService;
    }
    async getDefaultGradeRanges() {
        const gradeRanges = await this.systemSettingService.기본등급구간_조회한다();
        return gradeRanges;
    }
    async getActiveEvaluationPeriods() {
        return await this.evaluationPeriodManagementService.활성평가기간_조회한다();
    }
    async getEvaluationPeriods(query) {
        const { page = 1, limit = 10 } = query;
        return await this.evaluationPeriodManagementService.평가기간목록_조회한다(page, limit);
    }
    async getEvaluationPeriodDetail(periodId) {
        return await this.evaluationPeriodManagementService.평가기간상세_조회한다(periodId);
    }
    async getEmployeePeriodAssignments(periodId, employeeId) {
        return await this.evaluationPeriodManagementService.직원_평가기간별_할당정보_조회한다(periodId, employeeId);
    }
    async copyPreviousPeriodData(targetPeriodId, sourcePeriodId, body, user) {
        const employeeId = user.id;
        const copiedBy = user.id;
        const result = await this.evaluationPeriodManagementService.이전_평가기간_데이터를_복사한다(targetPeriodId, sourcePeriodId, employeeId, copiedBy, body.projects);
        return {
            success: true,
            message: '이전 평가기간 데이터를 성공적으로 복사했습니다.',
            copiedProjectAssignments: result.copiedProjectAssignments,
            copiedWbsAssignments: result.copiedWbsAssignments,
            copiedEvaluationLineMappings: result.copiedEvaluationLineMappings,
            copiedWbsEvaluationCriteria: result.copiedWbsEvaluationCriteria,
        };
    }
};
exports.EvaluatorEvaluationPeriodManagementController = EvaluatorEvaluationPeriodManagementController;
__decorate([
    (0, evaluation_period_api_decorators_1.GetDefaultGradeRanges)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluatorEvaluationPeriodManagementController.prototype, "getDefaultGradeRanges", null);
__decorate([
    (0, evaluation_period_api_decorators_1.GetActiveEvaluationPeriods)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluatorEvaluationPeriodManagementController.prototype, "getActiveEvaluationPeriods", null);
__decorate([
    (0, evaluation_period_api_decorators_1.GetEvaluationPeriods)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluation_management_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], EvaluatorEvaluationPeriodManagementController.prototype, "getEvaluationPeriods", null);
__decorate([
    (0, evaluation_period_api_decorators_1.GetEvaluationPeriodDetail)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluatorEvaluationPeriodManagementController.prototype, "getEvaluationPeriodDetail", null);
__decorate([
    (0, evaluation_period_api_decorators_1.GetEmployeePeriodAssignments)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('periodId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EvaluatorEvaluationPeriodManagementController.prototype, "getEmployeePeriodAssignments", null);
__decorate([
    (0, evaluation_period_api_decorators_1.CopyPreviousPeriodData)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('targetPeriodId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('sourcePeriodId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, evaluation_management_dto_1.CopyPreviousPeriodDataApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorEvaluationPeriodManagementController.prototype, "copyPreviousPeriodData", null);
exports.EvaluatorEvaluationPeriodManagementController = EvaluatorEvaluationPeriodManagementController = __decorate([
    (0, swagger_1.ApiTags)('A-2. 평가자 - 평가기간'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('evaluator/evaluation-periods'),
    __metadata("design:paramtypes", [evaluation_period_business_service_1.EvaluationPeriodBusinessService,
        evaluation_period_management_service_1.EvaluationPeriodManagementContextService,
        system_setting_service_1.SystemSettingService])
], EvaluatorEvaluationPeriodManagementController);
//# sourceMappingURL=evaluator-evaluation-period-management.controller.js.map