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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("../../../context/dashboard-context/dashboard.service");
const decorators_1 = require("../../common/decorators");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const evaluation_period_service_1 = require("../../../domain/core/evaluation-period/evaluation-period.service");
const employee_sync_service_1 = require("../../../context/organization-management-context/employee-sync.service");
const organization_management_context_1 = require("../../../context/organization-management-context");
const get_all_employees_evaluation_period_status_query_dto_1 = require("../../common/dto/dashboard/get-all-employees-evaluation-period-status-query.dto");
const dashboard_api_decorators_1 = require("../../common/decorators/dashboard/dashboard-api.decorators");
const employee_final_evaluation_list_dto_1 = require("../../common/dto/dashboard/employee-final-evaluation-list.dto");
const all_employees_final_evaluations_dto_1 = require("../../common/dto/dashboard/all-employees-final-evaluations.dto");
let DashboardController = class DashboardController {
    dashboardService;
    evaluationPeriodService;
    employeeSyncService;
    organizationManagementService;
    constructor(dashboardService, evaluationPeriodService, employeeSyncService, organizationManagementService) {
        this.dashboardService = dashboardService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.employeeSyncService = employeeSyncService;
        this.organizationManagementService = organizationManagementService;
    }
    async getAllEmployeesEvaluationPeriodStatus(evaluationPeriodId, queryDto) {
        const results = await this.dashboardService.평가기간의_모든_피평가자_현황을_조회한다(evaluationPeriodId, queryDto.includeUnregistered);
        return results.map((result) => {
            const { evaluationCriteria, wbsCriteria, evaluationLine, ...rest } = result;
            return rest;
        });
    }
    async exportAllEmployeesEvaluationPeriodStatusToExcel(evaluationPeriodId, queryDto, res) {
        const period = await this.evaluationPeriodService.ID로_조회한다(evaluationPeriodId);
        if (!period) {
            throw new common_1.NotFoundException(`평가기간을 찾을 수 없습니다. (ID: ${evaluationPeriodId})`);
        }
        const departmentHierarchy = await this.organizationManagementService.부서하이라키_직원포함_조회();
        const results = await this.dashboardService.평가기간의_모든_피평가자_현황을_조회한다(evaluationPeriodId, queryDto.includeUnregistered);
        const buffer = await this.dashboardService.직원_현황을_엑셀로_생성한다(results, period.name, departmentHierarchy);
        const date = new Date().toISOString().split('T')[0];
        const filename = `평가현황_${period.name}_${date}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.send(buffer);
    }
    async getMyEvaluationTargetsStatus(evaluationPeriodId, evaluatorId) {
        return await this.dashboardService.내가_담당하는_평가대상자_현황을_조회한다(evaluationPeriodId, evaluatorId);
    }
    async getEmployeeEvaluationPeriodStatus(evaluationPeriodId, employeeId) {
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
    async getFinalEvaluationsByPeriod(evaluationPeriodId) {
        const period = await this.evaluationPeriodService.ID로_조회한다(evaluationPeriodId);
        if (!period) {
            throw new common_1.NotFoundException(`평가기간을 찾을 수 없습니다. (ID: ${evaluationPeriodId})`);
        }
        const results = await this.dashboardService.평가기간별_최종평가_목록을_조회한다(evaluationPeriodId);
        if (results.length === 0) {
            return {
                period: {
                    id: period.id,
                    name: period.name,
                    startDate: period.startDate,
                },
                evaluations: [],
            };
        }
        const firstResult = results[0];
        const periodInfo = {
            id: firstResult.periodId,
            name: firstResult.periodName,
            startDate: firstResult.periodStartDate,
        };
        const evaluations = results.map((result) => ({
            employee: {
                id: result.employeeId,
                name: result.employeeName,
                employeeNumber: result.employeeNumber,
                email: result.employeeEmail,
                departmentName: result.departmentName,
                rankName: result.rankName,
            },
            evaluation: {
                id: result.id,
                evaluationGrade: result.evaluationGrade,
                jobGrade: result.jobGrade,
                jobDetailedGrade: result.jobDetailedGrade,
                finalComments: result.finalComments,
                isConfirmed: result.isConfirmed,
                confirmedAt: result.confirmedAt,
                confirmedBy: result.confirmedBy,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
            },
        }));
        return {
            period: periodInfo,
            evaluations,
        };
    }
    async getAllEmployeesFinalEvaluations(queryDto) {
        const results = await this.dashboardService.전체_직원별_최종평가_목록을_조회한다(queryDto.startDate, queryDto.endDate);
        const periodMap = new Map();
        for (const result of results) {
            if (!periodMap.has(result.periodId)) {
                periodMap.set(result.periodId, {
                    id: result.periodId,
                    name: result.periodName,
                    startDate: result.periodStartDate,
                });
            }
        }
        const evaluationPeriods = Array.from(periodMap.values()).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
        const employeeMap = new Map();
        for (const result of results) {
            if (!employeeMap.has(result.employeeId)) {
                employeeMap.set(result.employeeId, {
                    employee: {
                        id: result.employeeId,
                        name: result.employeeName,
                        employeeNumber: result.employeeNumber,
                        email: result.employeeEmail,
                        departmentName: result.departmentName,
                        rankName: result.rankName,
                    },
                    finalEvaluationsByPeriod: new Map(),
                });
            }
            employeeMap
                .get(result.employeeId)
                .finalEvaluationsByPeriod.set(result.periodId, {
                id: result.id,
                evaluationGrade: result.evaluationGrade,
                jobGrade: result.jobGrade,
                jobDetailedGrade: result.jobDetailedGrade,
                finalComments: result.finalComments,
                isConfirmed: result.isConfirmed,
                confirmedAt: result.confirmedAt,
                confirmedBy: result.confirmedBy,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
            });
        }
        const employees = Array.from(employeeMap.values())
            .map((data) => ({
            employee: data.employee,
            finalEvaluations: evaluationPeriods.map((period) => {
                const evaluation = data.finalEvaluationsByPeriod.get(period.id);
                return evaluation || null;
            }),
        }))
            .sort((a, b) => a.employee.employeeNumber.localeCompare(b.employee.employeeNumber));
        return {
            evaluationPeriods,
            employees,
        };
    }
    async getFinalEvaluationsByEmployee(employeeId, queryDto) {
        const employee = await this.employeeSyncService.getEmployeeById(employeeId);
        if (!employee) {
            throw new common_1.NotFoundException(`직원을 찾을 수 없습니다. (ID: ${employeeId})`);
        }
        const results = await this.dashboardService.직원별_최종평가_목록을_조회한다(employeeId, queryDto.startDate, queryDto.endDate);
        if (results.length === 0) {
            return {
                employee: {
                    id: employee.id,
                    name: employee.name,
                    employeeNumber: employee.employeeNumber,
                    email: employee.email,
                    departmentName: employee.departmentName ?? null,
                    rankName: employee.rankName ?? null,
                },
                finalEvaluations: [],
            };
        }
        const firstResult = results[0];
        const employeeInfo = {
            id: firstResult.employeeId,
            name: firstResult.employeeName,
            employeeNumber: firstResult.employeeNumber,
            email: firstResult.employeeEmail,
            departmentName: firstResult.departmentName,
            rankName: firstResult.rankName,
        };
        const finalEvaluations = results.map((result) => ({
            id: result.id,
            period: {
                id: result.periodId,
                name: result.periodName,
                startDate: result.periodStartDate,
            },
            evaluationGrade: result.evaluationGrade,
            jobGrade: result.jobGrade,
            jobDetailedGrade: result.jobDetailedGrade,
            finalComments: result.finalComments,
            isConfirmed: result.isConfirmed,
            confirmedAt: result.confirmedAt,
            confirmedBy: result.confirmedBy,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        }));
        return {
            employee: employeeInfo,
            finalEvaluations,
        };
    }
    async getEmployeeCompleteStatus(evaluationPeriodId, employeeId) {
        const [statusData, assignedData] = await Promise.all([
            this.dashboardService.직원의_평가기간_현황을_조회한다(evaluationPeriodId, employeeId),
            this.dashboardService.사용자_할당_정보를_조회한다(evaluationPeriodId, employeeId),
        ]);
        if (!statusData || !assignedData) {
            throw new common_1.NotFoundException(`직원을 찾을 수 없습니다. (평가기간: ${evaluationPeriodId}, 직원: ${employeeId})`);
        }
        return {
            evaluationPeriod: assignedData.evaluationPeriod,
            employee: assignedData.employee,
            isEvaluationTarget: statusData.isEvaluationTarget,
            exclusionInfo: statusData.exclusionInfo,
            evaluationLine: {
                status: statusData.evaluationLine.status,
                hasPrimaryEvaluator: statusData.evaluationLine.hasPrimaryEvaluator,
                hasSecondaryEvaluator: statusData.evaluationLine.hasSecondaryEvaluator,
                primaryEvaluator: statusData.downwardEvaluation.primary.evaluator,
                secondaryEvaluators: statusData.downwardEvaluation.secondary.evaluators.map((e) => e.evaluator),
            },
            wbsCriteria: {
                status: statusData.wbsCriteria.status,
                totalWbsCount: statusData.evaluationCriteria.assignedWbsCount,
                wbsWithCriteriaCount: statusData.wbsCriteria.wbsWithCriteriaCount,
            },
            performance: {
                status: statusData.performanceInput.status,
                totalWbsCount: statusData.performanceInput.totalWbsCount,
                completedCount: statusData.performanceInput.inputCompletedCount,
            },
            selfEvaluation: {
                status: statusData.selfEvaluation.status,
                totalCount: statusData.selfEvaluation.totalMappingCount,
                completedCount: statusData.selfEvaluation.completedMappingCount,
                isSubmittedToEvaluator: statusData.selfEvaluation.isSubmittedToEvaluator,
                isSubmittedToManager: statusData.selfEvaluation.isSubmittedToManager,
                totalScore: statusData.selfEvaluation.totalScore,
                grade: statusData.selfEvaluation.grade,
            },
            primaryDownwardEvaluation: {
                status: statusData.downwardEvaluation.primary.status,
                totalWbsCount: statusData.downwardEvaluation.primary.assignedWbsCount,
                completedCount: statusData.downwardEvaluation.primary.completedEvaluationCount,
                isSubmitted: statusData.downwardEvaluation.primary.isSubmitted,
                totalScore: statusData.downwardEvaluation.primary.totalScore,
                grade: statusData.downwardEvaluation.primary.grade,
            },
            secondaryDownwardEvaluation: {
                status: statusData.downwardEvaluation.secondary.evaluators[0]?.status ||
                    'none',
                totalWbsCount: statusData.downwardEvaluation.secondary.evaluators[0]
                    ?.assignedWbsCount || 0,
                completedCount: statusData.downwardEvaluation.secondary.evaluators[0]
                    ?.completedEvaluationCount || 0,
                isSubmitted: statusData.downwardEvaluation.secondary.isSubmitted,
                totalScore: statusData.downwardEvaluation.secondary.totalScore,
                grade: statusData.downwardEvaluation.secondary.grade,
            },
            peerEvaluation: statusData.peerEvaluation,
            finalEvaluation: statusData.finalEvaluation,
            projects: {
                totalCount: assignedData.summary.totalProjects,
                items: assignedData.projects,
            },
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, dashboard_api_decorators_1.GetAllEmployeesEvaluationPeriodStatus)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_all_employees_evaluation_period_status_query_dto_1.GetAllEmployeesEvaluationPeriodStatusQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAllEmployeesEvaluationPeriodStatus", null);
__decorate([
    (0, dashboard_api_decorators_1.ExportAllEmployeesEvaluationPeriodStatusToExcel)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_all_employees_evaluation_period_status_query_dto_1.GetAllEmployeesEvaluationPeriodStatusQueryDto, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "exportAllEmployeesEvaluationPeriodStatusToExcel", null);
__decorate([
    (0, dashboard_api_decorators_1.GetMyEvaluationTargetsStatus)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('evaluatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMyEvaluationTargetsStatus", null);
__decorate([
    (0, dashboard_api_decorators_1.GetEmployeeEvaluationPeriodStatus)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getEmployeeEvaluationPeriodStatus", null);
__decorate([
    (0, dashboard_api_decorators_1.GetMyAssignedData)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMyAssignedData", null);
__decorate([
    (0, dashboard_api_decorators_1.GetEmployeeAssignedData)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('employeeId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getEmployeeAssignedData", null);
__decorate([
    (0, dashboard_api_decorators_1.GetEvaluatorAssignedEmployeesData)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('evaluatorId')),
    __param(2, (0, decorators_1.ParseUUID)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getEvaluatorAssignedEmployeesData", null);
__decorate([
    (0, dashboard_api_decorators_1.GetFinalEvaluationsByPeriod)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getFinalEvaluationsByPeriod", null);
__decorate([
    (0, dashboard_api_decorators_1.GetAllEmployeesFinalEvaluations)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [all_employees_final_evaluations_dto_1.GetAllEmployeesFinalEvaluationsQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAllEmployeesFinalEvaluations", null);
__decorate([
    (0, dashboard_api_decorators_1.GetFinalEvaluationsByEmployee)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_final_evaluation_list_dto_1.GetEmployeeFinalEvaluationsQueryDto]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getFinalEvaluationsByEmployee", null);
__decorate([
    (0, dashboard_api_decorators_1.GetEmployeeCompleteStatus)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluationPeriodId')),
    __param(1, (0, decorators_1.ParseUUID)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getEmployeeCompleteStatus", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('A-0-2. 관리자 - 대시보드'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        evaluation_period_service_1.EvaluationPeriodService,
        employee_sync_service_1.EmployeeSyncService,
        organization_management_context_1.OrganizationManagementService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map