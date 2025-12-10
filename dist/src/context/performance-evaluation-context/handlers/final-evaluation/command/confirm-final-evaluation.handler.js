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
var ConfirmFinalEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmFinalEvaluationHandler = exports.ConfirmFinalEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const final_evaluation_service_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.service");
const final_evaluation_entity_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.entity");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_activity_log_context_service_1 = require("../../../../evaluation-activity-log-context/evaluation-activity-log-context.service");
class ConfirmFinalEvaluationCommand {
    id;
    confirmedBy;
    constructor(id, confirmedBy) {
        this.id = id;
        this.confirmedBy = confirmedBy;
    }
}
exports.ConfirmFinalEvaluationCommand = ConfirmFinalEvaluationCommand;
let ConfirmFinalEvaluationHandler = ConfirmFinalEvaluationHandler_1 = class ConfirmFinalEvaluationHandler {
    finalEvaluationService;
    transactionManager;
    activityLogService;
    logger = new common_1.Logger(ConfirmFinalEvaluationHandler_1.name);
    constructor(finalEvaluationService, transactionManager, activityLogService) {
        this.finalEvaluationService = finalEvaluationService;
        this.transactionManager = transactionManager;
        this.activityLogService = activityLogService;
    }
    async execute(command) {
        const { id, confirmedBy } = command;
        this.logger.log('최종평가 확정 핸들러 실행', { id, confirmedBy });
        await this.transactionManager.executeTransaction(async (manager) => {
            const repository = manager.getRepository(final_evaluation_entity_1.FinalEvaluation);
            const finalEvaluation = await repository.findOne({ where: { id } });
            await this.finalEvaluationService.확정한다(id, confirmedBy, manager);
            if (finalEvaluation) {
                await this.activityLogService.활동내역을_기록한다({
                    periodId: finalEvaluation.periodId,
                    employeeId: finalEvaluation.employeeId,
                    activityType: 'final_evaluation',
                    activityAction: 'confirmed',
                    activityTitle: '최종평가 확정',
                    activityDescription: `최종평가가 확정되었습니다. (평가등급: ${finalEvaluation.evaluationGrade}, 직무등급: ${finalEvaluation.jobGrade}, 세부등급: ${finalEvaluation.jobDetailedGrade})`,
                    relatedEntityType: 'FinalEvaluation',
                    relatedEntityId: id,
                    performedBy: confirmedBy,
                    activityMetadata: {
                        evaluationGrade: finalEvaluation.evaluationGrade,
                        jobGrade: finalEvaluation.jobGrade,
                        jobDetailedGrade: finalEvaluation.jobDetailedGrade,
                        finalComments: finalEvaluation.finalComments,
                    },
                });
            }
            this.logger.log('최종평가 확정 완료', { id });
        });
    }
};
exports.ConfirmFinalEvaluationHandler = ConfirmFinalEvaluationHandler;
exports.ConfirmFinalEvaluationHandler = ConfirmFinalEvaluationHandler = ConfirmFinalEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ConfirmFinalEvaluationCommand),
    __metadata("design:paramtypes", [final_evaluation_service_1.FinalEvaluationService,
        transaction_manager_service_1.TransactionManagerService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService])
], ConfirmFinalEvaluationHandler);
//# sourceMappingURL=confirm-final-evaluation.handler.js.map