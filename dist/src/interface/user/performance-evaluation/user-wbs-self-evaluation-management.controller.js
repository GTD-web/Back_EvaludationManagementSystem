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
exports.UserWbsSelfEvaluationManagementController = void 0;
const wbs_self_evaluation_business_service_1 = require("../../../business/wbs-self-evaluation/wbs-self-evaluation-business.service");
const performance_evaluation_service_1 = require("../../../context/performance-evaluation-context/performance-evaluation.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wbs_self_evaluation_api_decorators_1 = require("../../common/decorators/performance-evaluation/wbs-self-evaluation-api.decorators");
const wbs_self_evaluation_dto_1 = require("../../common/dto/performance-evaluation/wbs-self-evaluation.dto");
let UserWbsSelfEvaluationManagementController = class UserWbsSelfEvaluationManagementController {
    performanceEvaluationService;
    wbsSelfEvaluationBusinessService;
    constructor(performanceEvaluationService, wbsSelfEvaluationBusinessService) {
        this.performanceEvaluationService = performanceEvaluationService;
        this.wbsSelfEvaluationBusinessService = wbsSelfEvaluationBusinessService;
    }
    async upsertWbsSelfEvaluation(employeeId, wbsItemId, periodId, dto, user) {
        const actionBy = user.id;
        return await this.performanceEvaluationService.WBS자기평가를_저장한다(periodId, employeeId, wbsItemId, dto.selfEvaluationContent, dto.selfEvaluationScore, dto.performanceResult, dto.subProject, actionBy);
    }
    async submitWbsSelfEvaluationToEvaluator(id, user) {
        const submittedBy = user.id;
        return await this.performanceEvaluationService.피평가자가_1차평가자에게_자기평가를_제출한다(id, submittedBy);
    }
    async submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(employeeId, periodId, user) {
        const submittedBy = user.id;
        return await this.wbsSelfEvaluationBusinessService.직원의_전체_자기평가를_1차평가자에게_제출한다(employeeId, periodId, submittedBy);
    }
    async submitWbsSelfEvaluationsToEvaluatorByProject(employeeId, periodId, projectId, user) {
        const submittedBy = user.id;
        const result = await this.performanceEvaluationService.프로젝트별_자기평가를_1차평가자에게_제출한다(employeeId, periodId, projectId, submittedBy);
        return {
            ...result,
            completedEvaluations: result.completedEvaluations.map((e) => {
                const { submittedToEvaluatorAt, ...rest } = e;
                return {
                    ...rest,
                    submittedToEvaluatorAt,
                };
            }),
        };
    }
    async clearWbsSelfEvaluation(id, user) {
        const clearedBy = user.id;
        return await this.performanceEvaluationService.WBS자기평가_내용을_초기화한다({
            evaluationId: id,
            clearedBy,
        });
    }
    async clearAllWbsSelfEvaluationsByEmployeePeriod(employeeId, periodId, user) {
        const clearedBy = user.id;
        return await this.performanceEvaluationService.직원의_전체_WBS자기평가_내용을_초기화한다({
            employeeId,
            periodId,
            clearedBy,
        });
    }
    async clearWbsSelfEvaluationsByProject(employeeId, periodId, projectId, user) {
        const clearedBy = user.id;
        return await this.performanceEvaluationService.프로젝트별_WBS자기평가_내용을_초기화한다({
            employeeId,
            periodId,
            projectId,
            clearedBy,
        });
    }
};
exports.UserWbsSelfEvaluationManagementController = UserWbsSelfEvaluationManagementController;
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.UpsertWbsSelfEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('wbsItemId')),
    __param(2, (0, decorators_1.ParseUUID)('periodId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, wbs_self_evaluation_dto_1.CreateWbsSelfEvaluationBodyDto, Object]),
    __metadata("design:returntype", Promise)
], UserWbsSelfEvaluationManagementController.prototype, "upsertWbsSelfEvaluation", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.SubmitWbsSelfEvaluationToEvaluator)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserWbsSelfEvaluationManagementController.prototype, "submitWbsSelfEvaluationToEvaluator", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.SubmitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserWbsSelfEvaluationManagementController.prototype, "submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.SubmitWbsSelfEvaluationsToEvaluatorByProject)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('projectId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], UserWbsSelfEvaluationManagementController.prototype, "submitWbsSelfEvaluationsToEvaluatorByProject", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ClearWbsSelfEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserWbsSelfEvaluationManagementController.prototype, "clearWbsSelfEvaluation", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ClearAllWbsSelfEvaluationsByEmployeePeriod)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserWbsSelfEvaluationManagementController.prototype, "clearAllWbsSelfEvaluationsByEmployeePeriod", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ClearWbsSelfEvaluationsByProject)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('projectId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], UserWbsSelfEvaluationManagementController.prototype, "clearWbsSelfEvaluationsByProject", null);
exports.UserWbsSelfEvaluationManagementController = UserWbsSelfEvaluationManagementController = __decorate([
    (0, swagger_1.ApiTags)('A-6. 사용자 - 성과평가 - WBS 자기평가'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('user'),
    (0, common_1.Controller)('user/performance-evaluation/wbs-self-evaluations'),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        wbs_self_evaluation_business_service_1.WbsSelfEvaluationBusinessService])
], UserWbsSelfEvaluationManagementController);
//# sourceMappingURL=user-wbs-self-evaluation-management.controller.js.map