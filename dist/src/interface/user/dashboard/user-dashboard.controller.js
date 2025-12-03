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
exports.UserDashboardController = void 0;
const dashboard_api_decorators_1 = require("../../common/decorators/dashboard/dashboard-api.decorators");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("../../../context/dashboard-context/dashboard.service");
let UserDashboardController = class UserDashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getMyAssignedData(evaluationPeriodId, user) {
        const data = await this.dashboardService.사용자_할당_정보를_조회한다(evaluationPeriodId, user.id, user.id);
        return this.이차_하향평가_정보를_제거한다(data);
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
};
exports.UserDashboardController = UserDashboardController;
__decorate([
    (0, dashboard_api_decorators_1.GetMyAssignedData)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserDashboardController.prototype, "getMyAssignedData", null);
exports.UserDashboardController = UserDashboardController = __decorate([
    (0, swagger_1.ApiTags)('A-0-2. 사용자 - 대시보드'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('user/dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], UserDashboardController);
//# sourceMappingURL=user-dashboard.controller.js.map