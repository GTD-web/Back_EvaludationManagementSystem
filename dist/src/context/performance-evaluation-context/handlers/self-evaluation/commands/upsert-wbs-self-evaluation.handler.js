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
var UpsertWbsSelfEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertWbsSelfEvaluationHandler = exports.UpsertWbsSelfEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class UpsertWbsSelfEvaluationCommand {
    periodId;
    employeeId;
    wbsItemId;
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
    actionBy;
    constructor(periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, performanceResult, actionBy = '시스템') {
        this.periodId = periodId;
        this.employeeId = employeeId;
        this.wbsItemId = wbsItemId;
        this.selfEvaluationContent = selfEvaluationContent;
        this.selfEvaluationScore = selfEvaluationScore;
        this.performanceResult = performanceResult;
        this.actionBy = actionBy;
    }
}
exports.UpsertWbsSelfEvaluationCommand = UpsertWbsSelfEvaluationCommand;
let UpsertWbsSelfEvaluationHandler = UpsertWbsSelfEvaluationHandler_1 = class UpsertWbsSelfEvaluationHandler {
    wbsSelfEvaluationService;
    evaluationPeriodService;
    transactionManager;
    logger = new common_1.Logger(UpsertWbsSelfEvaluationHandler_1.name);
    constructor(wbsSelfEvaluationService, evaluationPeriodService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, performanceResult, actionBy, } = command;
        return await this.transactionManager.executeTransaction(async () => {
            const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(periodId);
            if (!evaluationPeriod) {
                throw new common_1.BadRequestException(`평가기간을 찾을 수 없습니다. (periodId: ${periodId})`);
            }
            const maxScore = evaluationPeriod.자기평가_달성률_최대값();
            if (selfEvaluationScore !== undefined && selfEvaluationScore !== null) {
                if (selfEvaluationScore < 0 || selfEvaluationScore > maxScore) {
                    throw new common_1.BadRequestException(`자기평가 점수는 0 ~ ${maxScore} 사이여야 합니다. (입력값: ${selfEvaluationScore})`);
                }
            }
            const existingEvaluations = await this.wbsSelfEvaluationService.필터_조회한다({
                periodId,
                employeeId,
                wbsItemId,
            });
            let evaluation;
            if (existingEvaluations.length > 0) {
                const existing = existingEvaluations[0];
                evaluation = await this.wbsSelfEvaluationService.수정한다(existing.id, {
                    selfEvaluationContent,
                    selfEvaluationScore,
                    performanceResult,
                }, actionBy);
            }
            else {
                evaluation = await this.wbsSelfEvaluationService.생성한다({
                    periodId,
                    employeeId,
                    wbsItemId,
                    assignedBy: actionBy,
                    selfEvaluationContent,
                    selfEvaluationScore,
                    performanceResult,
                    createdBy: actionBy,
                });
            }
            return evaluation.DTO로_변환한다();
        });
    }
};
exports.UpsertWbsSelfEvaluationHandler = UpsertWbsSelfEvaluationHandler;
exports.UpsertWbsSelfEvaluationHandler = UpsertWbsSelfEvaluationHandler = UpsertWbsSelfEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpsertWbsSelfEvaluationCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        evaluation_period_service_1.EvaluationPeriodService,
        transaction_manager_service_1.TransactionManagerService])
], UpsertWbsSelfEvaluationHandler);
//# sourceMappingURL=upsert-wbs-self-evaluation.handler.js.map