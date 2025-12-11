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
var UpsertDownwardEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertDownwardEvaluationHandler = exports.UpsertDownwardEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class UpsertDownwardEvaluationCommand {
    evaluatorId;
    evaluateeId;
    periodId;
    wbsId;
    selfEvaluationId;
    evaluationType;
    downwardEvaluationContent;
    downwardEvaluationScore;
    actionBy;
    constructor(evaluatorId, evaluateeId, periodId, wbsId, selfEvaluationId, evaluationType = 'primary', downwardEvaluationContent, downwardEvaluationScore, actionBy = '시스템') {
        this.evaluatorId = evaluatorId;
        this.evaluateeId = evaluateeId;
        this.periodId = periodId;
        this.wbsId = wbsId;
        this.selfEvaluationId = selfEvaluationId;
        this.evaluationType = evaluationType;
        this.downwardEvaluationContent = downwardEvaluationContent;
        this.downwardEvaluationScore = downwardEvaluationScore;
        this.actionBy = actionBy;
    }
}
exports.UpsertDownwardEvaluationCommand = UpsertDownwardEvaluationCommand;
let UpsertDownwardEvaluationHandler = UpsertDownwardEvaluationHandler_1 = class UpsertDownwardEvaluationHandler {
    downwardEvaluationService;
    transactionManager;
    logger = new common_1.Logger(UpsertDownwardEvaluationHandler_1.name);
    constructor(downwardEvaluationService, transactionManager) {
        this.downwardEvaluationService = downwardEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluatorId, evaluateeId, periodId, wbsId, selfEvaluationId, evaluationType, downwardEvaluationContent, downwardEvaluationScore, actionBy, } = command;
        this.logger.log('하향평가 Upsert 핸들러 실행', {
            evaluatorId,
            evaluateeId,
            periodId,
            wbsId,
            evaluationType,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const existingEvaluations = await this.downwardEvaluationService.필터_조회한다({
                employeeId: evaluateeId,
                periodId,
                wbsId,
                evaluationType: evaluationType,
            });
            const existingEvaluation = existingEvaluations.length > 0 ? existingEvaluations[0] : null;
            if (existingEvaluation) {
                this.logger.log('기존 하향평가 수정', {
                    evaluationId: existingEvaluation.id,
                    oldEvaluatorId: existingEvaluation.evaluatorId,
                    newEvaluatorId: evaluatorId,
                });
                await this.downwardEvaluationService.수정한다(existingEvaluation.id, {
                    evaluatorId: evaluatorId !== existingEvaluation.evaluatorId
                        ? evaluatorId
                        : undefined,
                    downwardEvaluationContent,
                    downwardEvaluationScore,
                    selfEvaluationId: selfEvaluationId !== existingEvaluation.selfEvaluationId
                        ? selfEvaluationId
                        : undefined,
                }, actionBy);
                return existingEvaluation.id;
            }
            else {
                this.logger.log('새로운 하향평가 생성', {
                    evaluatorId,
                    evaluateeId,
                    evaluationType,
                });
                const evaluation = await this.downwardEvaluationService.생성한다({
                    employeeId: evaluateeId,
                    evaluatorId,
                    wbsId,
                    periodId,
                    selfEvaluationId,
                    downwardEvaluationContent,
                    downwardEvaluationScore,
                    evaluationDate: new Date(),
                    evaluationType: evaluationType,
                    isCompleted: false,
                    createdBy: actionBy,
                });
                this.logger.log('하향평가 생성 완료', { evaluationId: evaluation.id });
                return evaluation.id;
            }
        });
    }
};
exports.UpsertDownwardEvaluationHandler = UpsertDownwardEvaluationHandler;
exports.UpsertDownwardEvaluationHandler = UpsertDownwardEvaluationHandler = UpsertDownwardEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpsertDownwardEvaluationCommand),
    __metadata("design:paramtypes", [downward_evaluation_service_1.DownwardEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], UpsertDownwardEvaluationHandler);
//# sourceMappingURL=upsert-downward-evaluation.handler.js.map