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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const queries_1 = require("./handlers/queries");
let DashboardService = class DashboardService {
    queryBus;
    constructor(queryBus) {
        this.queryBus = queryBus;
    }
    async 직원의_평가기간_현황을_조회한다(evaluationPeriodId, employeeId) {
        const query = new queries_1.GetEmployeeEvaluationPeriodStatusQuery(evaluationPeriodId, employeeId);
        return await this.queryBus.execute(query);
    }
    async 평가기간의_모든_피평가자_현황을_조회한다(evaluationPeriodId, includeUnregistered = false) {
        const query = new queries_1.GetAllEmployeesEvaluationPeriodStatusQuery(evaluationPeriodId, includeUnregistered);
        return await this.queryBus.execute(query);
    }
    async 내가_담당하는_평가대상자_현황을_조회한다(evaluationPeriodId, evaluatorId) {
        const query = new queries_1.GetMyEvaluationTargetsStatusQuery(evaluationPeriodId, evaluatorId);
        return await this.queryBus.execute(query);
    }
    async 사용자_할당_정보를_조회한다(evaluationPeriodId, employeeId, viewerId) {
        const query = new queries_1.GetEmployeeAssignedDataQuery(evaluationPeriodId, employeeId, viewerId);
        return await this.queryBus.execute(query);
    }
    async 담당자의_피평가자_할당_정보를_조회한다(evaluationPeriodId, evaluatorId, employeeId) {
        const query = new queries_1.GetEvaluatorAssignedEmployeesDataQuery(evaluationPeriodId, evaluatorId, employeeId);
        return await this.queryBus.execute(query);
    }
    async 평가기간별_최종평가_목록을_조회한다(evaluationPeriodId) {
        const query = new queries_1.GetFinalEvaluationsByPeriodQuery(evaluationPeriodId);
        return await this.queryBus.execute(query);
    }
    async 직원별_최종평가_목록을_조회한다(employeeId, startDate, endDate) {
        const query = new queries_1.GetFinalEvaluationsByEmployeeQuery(employeeId, startDate, endDate);
        return await this.queryBus.execute(query);
    }
    async 전체_직원별_최종평가_목록을_조회한다(startDate, endDate) {
        const query = new queries_1.GetAllEmployeesFinalEvaluationsQuery(startDate, endDate);
        return await this.queryBus.execute(query);
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.QueryBus])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map