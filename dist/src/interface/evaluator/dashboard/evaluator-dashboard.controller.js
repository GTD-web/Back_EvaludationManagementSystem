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
exports.EvaluatorDashboardController = void 0;
const dashboard_service_1 = require("../../../context/dashboard-context/dashboard.service");
const decorators_1 = require("../../common/decorators");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const dashboard_api_decorators_1 = require("../../common/decorators/dashboard/dashboard-api.decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let EvaluatorDashboardController = class EvaluatorDashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getMyEvaluationTargetsStatus(evaluationPeriodId, evaluatorId) {
        return await this.dashboardService.내가_담당하는_평가대상자_현황을_조회한다(evaluationPeriodId, evaluatorId);
    }
    async getEmployeeEvaluationPeriodStatus(evaluationPeriodId, employeeId, user) {
        const result = await this.dashboardService.직원의_평가기간_현황을_조회한다(evaluationPeriodId, employeeId);
        if (!result) {
            return null;
        }
        const { evaluationCriteria, wbsCriteria, evaluationLine, ...rest } = result;
        return rest;
    }
    async getMyAssignedData(evaluationPeriodId, user) {
        const data = await this.dashboardService.사용자_할당_정보를_조회한다(evaluationPeriodId, user.id, user.id);
        return this.이차_하향평가_정보를_제거한다(data);
    }
    async getEmployeeAssignedData(evaluationPeriodId, employeeId, user) {
        return await this.dashboardService.사용자_할당_정보를_조회한다(evaluationPeriodId, employeeId, user.id);
    }
    이차_하향평가_정보를_제거한다(data) {
        const projectsWithoutSecondaryDownwardEvaluation = data.projects.map((project) => ({
            ...project,
            wbsList: project.wbsList.map((wbs) => ({
                ...wbs,
                secondaryDownwardEvaluation: wbs.secondaryDownwardEvaluation
                    ? {
                        evaluatorId: wbs.secondaryDownwardEvaluation.evaluatorId,
                        evaluatorName: wbs.secondaryDownwardEvaluation.evaluatorName,
                        isCompleted: wbs.secondaryDownwardEvaluation.isCompleted,
                    }
                    : null,
            })),
        }));
        const summaryWithoutSecondaryDownwardEvaluation = {
            ...data.summary,
            secondaryDownwardEvaluation: {
                totalScore: null,
                grade: null,
                isSubmitted: data.summary.secondaryDownwardEvaluation?.isSubmitted || false,
                evaluators: data.summary.secondaryDownwardEvaluation?.evaluators || [],
            },
        };
        return {
            ...data,
            projects: projectsWithoutSecondaryDownwardEvaluation,
            summary: summaryWithoutSecondaryDownwardEvaluation,
        };
    }
    async getEvaluatorAssignedEmployeesData(evaluationPeriodId, evaluatorId, employeeId) {
        return await this.dashboardService.담당자의_피평가자_할당_정보를_조회한다(evaluationPeriodId, evaluatorId, employeeId);
    }
};
exports.EvaluatorDashboardController = EvaluatorDashboardController;
__decorate([
    (0, dashboard_api_decorators_1.GetMyEvaluationTargetsStatus)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('evaluatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EvaluatorDashboardController.prototype, "getMyEvaluationTargetsStatus", null);
__decorate([
    (0, dashboard_api_decorators_1.GetEmployeeEvaluationPeriodStatus)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorDashboardController.prototype, "getEmployeeEvaluationPeriodStatus", null);
__decorate([
    (0, dashboard_api_decorators_1.GetMyAssignedData)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorDashboardController.prototype, "getMyAssignedData", null);
__decorate([
    (0, dashboard_api_decorators_1.GetEmployeeAssignedData)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorDashboardController.prototype, "getEmployeeAssignedData", null);
__decorate([
    (0, dashboard_api_decorators_1.GetEvaluatorAssignedEmployeesData)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('evaluatorId')),
    __param(2, (0, decorators_1.ParseUUID)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EvaluatorDashboardController.prototype, "getEvaluatorAssignedEmployeesData", null);
exports.EvaluatorDashboardController = EvaluatorDashboardController = __decorate([
    (0, swagger_1.ApiTags)('A-0-2. 평가자 - 대시보드'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('evaluator'),
    (0, common_1.Controller)('evaluator/dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], EvaluatorDashboardController);
//# sourceMappingURL=evaluator-dashboard.controller.js.map