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
var ResetWbsSelfEvaluationsToEvaluatorByProjectHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetWbsSelfEvaluationsToEvaluatorByProjectHandler = exports.ResetWbsSelfEvaluationsToEvaluatorByProjectCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const evaluation_wbs_assignment_service_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class ResetWbsSelfEvaluationsToEvaluatorByProjectCommand {
    employeeId;
    periodId;
    projectId;
    resetBy;
    constructor(employeeId, periodId, projectId, resetBy = '시스템') {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.projectId = projectId;
        this.resetBy = resetBy;
    }
}
exports.ResetWbsSelfEvaluationsToEvaluatorByProjectCommand = ResetWbsSelfEvaluationsToEvaluatorByProjectCommand;
let ResetWbsSelfEvaluationsToEvaluatorByProjectHandler = ResetWbsSelfEvaluationsToEvaluatorByProjectHandler_1 = class ResetWbsSelfEvaluationsToEvaluatorByProjectHandler {
    wbsSelfEvaluationService;
    evaluationWbsAssignmentService;
    transactionManager;
    logger = new common_1.Logger(ResetWbsSelfEvaluationsToEvaluatorByProjectHandler_1.name);
    constructor(wbsSelfEvaluationService, evaluationWbsAssignmentService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.evaluationWbsAssignmentService = evaluationWbsAssignmentService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { employeeId, periodId, projectId, resetBy } = command;
        this.logger.log('프로젝트별 WBS 자기평가 취소 시작 (피평가자 → 1차 평가자 제출 취소)', {
            employeeId,
            periodId,
            projectId,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const assignments = await this.evaluationWbsAssignmentService.필터_조회한다({
                employeeId,
                periodId,
                projectId,
            });
            if (assignments.length === 0) {
                throw new common_1.BadRequestException('해당 프로젝트에 할당된 WBS가 존재하지 않습니다.');
            }
            const wbsItemIds = assignments.map((assignment) => assignment.wbsItemId);
            this.logger.debug('할당된 WBS 항목 개수', {
                count: wbsItemIds.length,
                wbsItemIds,
            });
            const evaluations = await this.wbsSelfEvaluationService.필터_조회한다({
                employeeId,
                periodId,
            });
            const projectEvaluations = evaluations.filter((evaluation) => wbsItemIds.includes(evaluation.wbsItemId));
            if (projectEvaluations.length === 0) {
                throw new common_1.BadRequestException('취소할 자기평가가 존재하지 않습니다.');
            }
            this.logger.debug('프로젝트 자기평가 개수', {
                totalEvaluations: evaluations.length,
                projectEvaluations: projectEvaluations.length,
            });
            const resetEvaluations = [];
            const failedResets = [];
            for (const evaluation of projectEvaluations) {
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
                totalCount: projectEvaluations.length,
                resetEvaluations,
                failedResets,
            };
            this.logger.log('프로젝트별 WBS 자기평가 취소 완료 (피평가자 → 1차 평가자 제출 취소)', {
                employeeId,
                periodId,
                projectId,
                resetCount: result.resetCount,
                failedCount: result.failedCount,
            });
            if (resetEvaluations.length === 0) {
                this.logger.warn('취소된 평가 없음 (모두 미제출 상태)', {
                    totalCount: projectEvaluations.length,
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
exports.ResetWbsSelfEvaluationsToEvaluatorByProjectHandler = ResetWbsSelfEvaluationsToEvaluatorByProjectHandler;
exports.ResetWbsSelfEvaluationsToEvaluatorByProjectHandler = ResetWbsSelfEvaluationsToEvaluatorByProjectHandler = ResetWbsSelfEvaluationsToEvaluatorByProjectHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ResetWbsSelfEvaluationsToEvaluatorByProjectCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
        transaction_manager_service_1.TransactionManagerService])
], ResetWbsSelfEvaluationsToEvaluatorByProjectHandler);
//# sourceMappingURL=reset-wbs-self-evaluations-to-evaluator-by-project.handler.js.map