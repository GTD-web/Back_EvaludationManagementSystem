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
exports.WbsSelfEvaluationManagementController = void 0;
const self_evaluation_1 = require("../../../context/performance-evaluation-context/handlers/self-evaluation");
const performance_evaluation_service_1 = require("../../../context/performance-evaluation-context/performance-evaluation.service");
const wbs_self_evaluation_business_service_1 = require("../../../business/wbs-self-evaluation/wbs-self-evaluation-business.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wbs_self_evaluation_api_decorators_1 = require("../../common/decorators/performance-evaluation/wbs-self-evaluation-api.decorators");
const wbs_self_evaluation_dto_1 = require("../../common/dto/performance-evaluation/wbs-self-evaluation.dto");
let WbsSelfEvaluationManagementController = class WbsSelfEvaluationManagementController {
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
    async submitWbsSelfEvaluation(id, user) {
        const submittedBy = user.id;
        return await this.performanceEvaluationService.WBS자기평가를_제출한다(id, submittedBy);
    }
    async submitWbsSelfEvaluationToEvaluator(id, user) {
        const submittedBy = user.id;
        return await this.performanceEvaluationService.피평가자가_1차평가자에게_자기평가를_제출한다(id, submittedBy);
    }
    async submitAllWbsSelfEvaluationsByEmployeePeriod(employeeId, periodId, user) {
        const submittedBy = user.id;
        return await this.wbsSelfEvaluationBusinessService.직원의_전체_WBS자기평가를_제출하고_재작성요청을_완료한다(employeeId, periodId, submittedBy);
    }
    async submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(employeeId, periodId, user) {
        const submittedBy = user.id;
        return await this.wbsSelfEvaluationBusinessService.직원의_전체_자기평가를_1차평가자에게_제출한다(employeeId, periodId, submittedBy);
    }
    async resetWbsSelfEvaluation(id, user) {
        const resetBy = user.id;
        return await this.performanceEvaluationService.WBS자기평가를_초기화한다(id, resetBy);
    }
    async resetAllWbsSelfEvaluationsByEmployeePeriod(employeeId, periodId, user) {
        const resetBy = user.id;
        const result = await this.performanceEvaluationService.직원의_전체_WBS자기평가를_초기화한다(employeeId, periodId, resetBy);
        return {
            resetCount: result.resetCount,
            failedCount: result.failedCount,
            totalCount: result.totalCount,
            resetEvaluations: result.resetEvaluations.map((e) => ({
                evaluationId: e.evaluationId,
                wbsItemId: e.wbsItemId,
                selfEvaluationContent: e.selfEvaluationContent,
                selfEvaluationScore: e.selfEvaluationScore,
                performanceResult: e.performanceResult,
                wasSubmittedToManager: e.wasSubmittedToManager,
            })),
            failedResets: result.failedResets,
        };
    }
    async submitWbsSelfEvaluationsByProject(employeeId, periodId, projectId, user) {
        const submittedBy = user.id;
        return await this.performanceEvaluationService.프로젝트별_WBS자기평가를_제출한다(employeeId, periodId, projectId, submittedBy);
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
    async resetWbsSelfEvaluationsByProject(employeeId, periodId, projectId, user) {
        const resetBy = user.id;
        const result = await this.performanceEvaluationService.프로젝트별_WBS자기평가를_초기화한다(employeeId, periodId, projectId, resetBy);
        return {
            resetCount: result.resetCount,
            failedCount: result.failedCount,
            totalCount: result.totalCount,
            resetEvaluations: result.resetEvaluations.map((e) => ({
                evaluationId: e.evaluationId,
                wbsItemId: e.wbsItemId,
                selfEvaluationContent: e.selfEvaluationContent,
                selfEvaluationScore: e.selfEvaluationScore,
                performanceResult: e.performanceResult,
                wasSubmittedToManager: e.wasSubmittedToManager,
            })),
            failedResets: result.failedResets,
        };
    }
    async resetWbsSelfEvaluationToEvaluator(id, user) {
        const resetBy = user.id;
        return await this.performanceEvaluationService.피평가자가_1차평가자에게_제출한_자기평가를_취소한다(id, resetBy);
    }
    async resetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(employeeId, periodId, user) {
        const resetBy = user.id;
        const result = await this.wbsSelfEvaluationBusinessService.직원의_전체_자기평가를_1차평가자_제출_취소한다(employeeId, periodId, resetBy);
        return {
            resetCount: result.resetCount,
            failedCount: result.failedCount,
            totalCount: result.totalCount,
            resetEvaluations: result.resetEvaluations.map((e) => ({
                evaluationId: e.evaluationId,
                wbsItemId: e.wbsItemId,
                selfEvaluationContent: e.selfEvaluationContent,
                selfEvaluationScore: e.selfEvaluationScore,
                performanceResult: e.performanceResult,
                wasSubmittedToManager: false,
            })),
            failedResets: result.failedResets,
        };
    }
    async resetWbsSelfEvaluationsToEvaluatorByProject(employeeId, periodId, projectId, user) {
        const resetBy = user.id;
        const result = await this.performanceEvaluationService.프로젝트별_자기평가를_1차평가자_제출_취소한다(employeeId, periodId, projectId, resetBy);
        return {
            ...result,
            resetEvaluations: result.resetEvaluations.map((e) => ({
                ...e,
                wasSubmittedToManager: false,
            })),
        };
    }
    async getEmployeeSelfEvaluations(employeeId, filter) {
        const query = new self_evaluation_1.GetEmployeeSelfEvaluationsQuery(employeeId, filter.periodId, filter.projectId, filter.page || 1, filter.limit || 10);
        return await this.performanceEvaluationService.직원의_자기평가_목록을_조회한다(query);
    }
    async getWbsSelfEvaluationDetail(id) {
        const query = new self_evaluation_1.GetWbsSelfEvaluationDetailQuery(id);
        return await this.performanceEvaluationService.WBS자기평가_상세정보를_조회한다(query);
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
exports.WbsSelfEvaluationManagementController = WbsSelfEvaluationManagementController;
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
], WbsSelfEvaluationManagementController.prototype, "upsertWbsSelfEvaluation", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.SubmitWbsSelfEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "submitWbsSelfEvaluation", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.SubmitWbsSelfEvaluationToEvaluator)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "submitWbsSelfEvaluationToEvaluator", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.SubmitAllWbsSelfEvaluationsByEmployeePeriod)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "submitAllWbsSelfEvaluationsByEmployeePeriod", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.SubmitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ResetWbsSelfEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "resetWbsSelfEvaluation", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ResetAllWbsSelfEvaluationsByEmployeePeriod)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "resetAllWbsSelfEvaluationsByEmployeePeriod", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.SubmitWbsSelfEvaluationsByProject)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('projectId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "submitWbsSelfEvaluationsByProject", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.SubmitWbsSelfEvaluationsToEvaluatorByProject)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('projectId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "submitWbsSelfEvaluationsToEvaluatorByProject", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ResetWbsSelfEvaluationsByProject)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('projectId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "resetWbsSelfEvaluationsByProject", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ResetWbsSelfEvaluationToEvaluator)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "resetWbsSelfEvaluationToEvaluator", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ResetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "resetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ResetWbsSelfEvaluationsToEvaluatorByProject)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('projectId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "resetWbsSelfEvaluationsToEvaluatorByProject", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.GetEmployeeSelfEvaluations)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_self_evaluation_dto_1.WbsSelfEvaluationFilterDto]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "getEmployeeSelfEvaluations", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.GetWbsSelfEvaluationDetail)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "getWbsSelfEvaluationDetail", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ClearWbsSelfEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "clearWbsSelfEvaluation", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ClearAllWbsSelfEvaluationsByEmployeePeriod)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "clearAllWbsSelfEvaluationsByEmployeePeriod", null);
__decorate([
    (0, wbs_self_evaluation_api_decorators_1.ClearWbsSelfEvaluationsByProject)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('projectId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsSelfEvaluationManagementController.prototype, "clearWbsSelfEvaluationsByProject", null);
exports.WbsSelfEvaluationManagementController = WbsSelfEvaluationManagementController = __decorate([
    (0, swagger_1.ApiTags)('C-1. 관리자 - 성과평가 - WBS 자기평가'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/performance-evaluation/wbs-self-evaluations'),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        wbs_self_evaluation_business_service_1.WbsSelfEvaluationBusinessService])
], WbsSelfEvaluationManagementController);
//# sourceMappingURL=wbs-self-evaluation-management.controller.js.map