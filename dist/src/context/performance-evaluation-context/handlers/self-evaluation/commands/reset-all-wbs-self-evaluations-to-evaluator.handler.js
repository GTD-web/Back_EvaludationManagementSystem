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
var ResetAllWbsSelfEvaluationsToEvaluatorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetAllWbsSelfEvaluationsToEvaluatorHandler = exports.ResetAllWbsSelfEvaluationsToEvaluatorCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class ResetAllWbsSelfEvaluationsToEvaluatorCommand {
    employeeId;
    periodId;
    resetBy;
    constructor(employeeId, periodId, resetBy = '시스템') {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.resetBy = resetBy;
    }
}
exports.ResetAllWbsSelfEvaluationsToEvaluatorCommand = ResetAllWbsSelfEvaluationsToEvaluatorCommand;
let ResetAllWbsSelfEvaluationsToEvaluatorHandler = ResetAllWbsSelfEvaluationsToEvaluatorHandler_1 = class ResetAllWbsSelfEvaluationsToEvaluatorHandler {
    wbsSelfEvaluationService;
    transactionManager;
    logger = new common_1.Logger(ResetAllWbsSelfEvaluationsToEvaluatorHandler_1.name);
    constructor(wbsSelfEvaluationService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { employeeId, periodId, resetBy } = command;
        this.logger.log('직원의 전체 WBS 자기평가 취소 시작 (피평가자 → 1차 평가자 제출 취소)', {
            employeeId,
            periodId,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluations = await this.wbsSelfEvaluationService.필터_조회한다({
                employeeId,
                periodId,
            });
            if (evaluations.length === 0) {
                throw new common_1.BadRequestException('취소할 자기평가가 존재하지 않습니다.');
            }
            const resetEvaluations = [];
            const failedResets = [];
            for (const evaluation of evaluations) {
                try {
                    const wasSubmittedToEvaluator = evaluation.피평가자가_1차평가자에게_제출했는가();
                    if (!wasSubmittedToEvaluator) {
                        this.logger.debug(`이미 1차 평가자에게 미제출 상태 스킵 - ID: ${evaluation.id}`);
                        continue;
                    }
                    await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한_것을_취소한다(evaluation.id, resetBy);
                    resetEvaluations.push({
                        evaluationId: evaluation.id,
                        wbsItemId: evaluation.wbsItemId,
                        selfEvaluationContent: evaluation.selfEvaluationContent,
                        selfEvaluationScore: evaluation.selfEvaluationScore,
                        performanceResult: evaluation.performanceResult,
                        wasSubmittedToEvaluator,
                    });
                }
                catch (error) {
                    this.logger.error(`평가 취소 실패 - ID: ${evaluation.id}`, error);
                    failedResets.push({
                        evaluationId: evaluation.id,
                        wbsItemId: evaluation.wbsItemId,
                        reason: error.message || '알 수 없는 오류가 발생했습니다.',
                    });
                }
            }
            const result = {
                resetCount: resetEvaluations.length,
                failedCount: failedResets.length,
                totalCount: evaluations.length,
                resetEvaluations,
                failedResets,
            };
            this.logger.log('직원의 전체 WBS 자기평가 취소 완료 (피평가자 → 1차 평가자 제출 취소)', {
                employeeId,
                periodId,
                resetCount: result.resetCount,
                failedCount: result.failedCount,
            });
            if (resetEvaluations.length === 0) {
                this.logger.warn('취소된 평가 없음 (모두 미제출 상태)', {
                    totalCount: evaluations.length,
                });
            }
            if (failedResets.length > 0) {
                this.logger.warn('일부 평가 취소 실패', {
                    failedCount: failedResets.length,
                    failures: failedResets,
                });
            }
            return result;
        });
    }
};
exports.ResetAllWbsSelfEvaluationsToEvaluatorHandler = ResetAllWbsSelfEvaluationsToEvaluatorHandler;
exports.ResetAllWbsSelfEvaluationsToEvaluatorHandler = ResetAllWbsSelfEvaluationsToEvaluatorHandler = ResetAllWbsSelfEvaluationsToEvaluatorHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ResetAllWbsSelfEvaluationsToEvaluatorCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], ResetAllWbsSelfEvaluationsToEvaluatorHandler);
//# sourceMappingURL=reset-all-wbs-self-evaluations-to-evaluator.handler.js.map