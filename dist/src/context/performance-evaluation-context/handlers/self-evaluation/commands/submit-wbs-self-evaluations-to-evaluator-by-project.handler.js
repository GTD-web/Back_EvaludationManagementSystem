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
var SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler = exports.SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const evaluation_wbs_assignment_service_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand {
    employeeId;
    periodId;
    projectId;
    submittedBy;
    constructor(employeeId, periodId, projectId, submittedBy = '시스템') {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.projectId = projectId;
        this.submittedBy = submittedBy;
    }
}
exports.SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand = SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand;
let SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler = SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler_1 = class SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler {
    wbsSelfEvaluationService;
    evaluationWbsAssignmentService;
    evaluationPeriodService;
    transactionManager;
    logger = new common_1.Logger(SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler_1.name);
    constructor(wbsSelfEvaluationService, evaluationWbsAssignmentService, evaluationPeriodService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.evaluationWbsAssignmentService = evaluationWbsAssignmentService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { employeeId, periodId, projectId, submittedBy } = command;
        this.logger.log('프로젝트별 WBS 자기평가 제출 시작 (피평가자 → 1차 평가자)', {
            employeeId,
            periodId,
            projectId,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(periodId);
            if (!evaluationPeriod) {
                throw new common_1.BadRequestException(`평가기간을 찾을 수 없습니다. (periodId: ${periodId})`);
            }
            const maxScore = evaluationPeriod.자기평가_달성률_최대값();
            const allEvaluations = await this.wbsSelfEvaluationService.필터_조회한다({
                employeeId,
                periodId,
            });
            const projectEvaluations = await this.transactionManager.executeTransaction(async (manager) => {
                const wbsItemIds = allEvaluations.map((e) => e.wbsItemId);
                if (wbsItemIds.length === 0) {
                    return [];
                }
                const validWbsIds = await manager
                    .createQueryBuilder()
                    .select('DISTINCT wbs_assignment.wbsItemId', 'wbsItemId')
                    .from('evaluation_wbs_assignment', 'wbs_assignment')
                    .leftJoin('evaluation_project_assignment', 'project_assignment', 'project_assignment.projectId = wbs_assignment.projectId AND project_assignment.periodId = wbs_assignment.periodId AND project_assignment.employeeId = wbs_assignment.employeeId AND project_assignment.deletedAt IS NULL')
                    .where('wbs_assignment.periodId = :periodId', { periodId })
                    .andWhere('wbs_assignment.employeeId = :employeeId', { employeeId })
                    .andWhere('wbs_assignment.projectId = :projectId', { projectId })
                    .andWhere('wbs_assignment.wbsItemId IN (:...wbsItemIds)', {
                    wbsItemIds,
                })
                    .andWhere('wbs_assignment.deletedAt IS NULL')
                    .andWhere('project_assignment.id IS NOT NULL')
                    .getRawMany();
                const validWbsIdSet = new Set(validWbsIds.map((row) => row.wbsItemId));
                this.logger.debug('프로젝트별 유효한 WBS 항목', {
                    totalWbsCount: wbsItemIds.length,
                    validWbsCount: validWbsIdSet.size,
                    projectId,
                });
                return allEvaluations.filter((e) => validWbsIdSet.has(e.wbsItemId));
            });
            if (projectEvaluations.length === 0) {
                throw new common_1.BadRequestException('해당 프로젝트에 제출할 자기평가가 존재하지 않습니다. (취소된 프로젝트 할당의 WBS는 제외됨)');
            }
            const missingFieldsList = [];
            const notSubmittedYet = projectEvaluations.filter((e) => !e.피평가자가_1차평가자에게_제출했는가());
            for (const evaluation of notSubmittedYet) {
                const missingFields = {
                    performanceResult: !evaluation.performanceResult?.trim(),
                    selfEvaluationContent: !evaluation.selfEvaluationContent?.trim(),
                    selfEvaluationScore: evaluation.selfEvaluationScore === undefined ||
                        evaluation.selfEvaluationScore === null,
                };
                if (missingFields.performanceResult ||
                    missingFields.selfEvaluationContent ||
                    missingFields.selfEvaluationScore) {
                    missingFieldsList.push({
                        evaluationId: evaluation.id,
                        wbsItemId: evaluation.wbsItemId,
                        missingFields,
                    });
                }
                if (!missingFields.selfEvaluationScore &&
                    !evaluation.점수가_유효한가(maxScore)) {
                    throw new common_1.BadRequestException(`평가 점수가 유효하지 않습니다 (WBS ID: ${evaluation.wbsItemId}, 점수: ${evaluation.selfEvaluationScore}, 허용 범위: 0 ~ ${maxScore})`);
                }
            }
            if (missingFieldsList.length > 0) {
                const missingFieldsDetails = missingFieldsList
                    .map((info) => {
                    const fields = [];
                    if (info.missingFields.performanceResult)
                        fields.push('성과');
                    if (info.missingFields.selfEvaluationContent)
                        fields.push('자기평가 내용');
                    if (info.missingFields.selfEvaluationScore)
                        fields.push('자기평가 점수');
                    return `  - WBS ID: ${info.wbsItemId} → 미작성: ${fields.join(', ')}`;
                })
                    .join('\n');
                throw new common_1.BadRequestException(`자기평가를 제출하려면 모든 필수 항목을 작성해야 합니다.\n\n미작성 항목:\n${missingFieldsDetails}\n\n작성해야 할 항목: 성과, 자기평가 내용, 자기평가 점수`);
            }
            const completedEvaluations = [];
            for (const evaluation of projectEvaluations) {
                if (evaluation.피평가자가_1차평가자에게_제출했는가()) {
                    this.logger.debug(`이미 1차 평가자에게 제출된 평가 포함 - ID: ${evaluation.id}`);
                    completedEvaluations.push({
                        evaluationId: evaluation.id,
                        wbsItemId: evaluation.wbsItemId,
                        selfEvaluationContent: evaluation.selfEvaluationContent,
                        selfEvaluationScore: evaluation.selfEvaluationScore,
                        performanceResult: evaluation.performanceResult,
                        submittedToEvaluatorAt: evaluation.submittedToEvaluatorAt,
                    });
                }
            }
            for (const evaluation of notSubmittedYet) {
                await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한다(evaluation, submittedBy);
                const updatedEvaluation = await this.wbsSelfEvaluationService.조회한다(evaluation.id);
                if (!updatedEvaluation) {
                    throw new Error(`제출 후 자기평가를 찾을 수 없습니다. (ID: ${evaluation.id})`);
                }
                completedEvaluations.push({
                    evaluationId: updatedEvaluation.id,
                    wbsItemId: updatedEvaluation.wbsItemId,
                    selfEvaluationContent: updatedEvaluation.selfEvaluationContent,
                    selfEvaluationScore: updatedEvaluation.selfEvaluationScore,
                    performanceResult: updatedEvaluation.performanceResult,
                    submittedToEvaluatorAt: updatedEvaluation.submittedToEvaluatorAt,
                });
                this.logger.debug(`평가 제출 처리 성공 - ID: ${evaluation.id}`);
            }
            const result = {
                submittedCount: notSubmittedYet.length,
                failedCount: 0,
                totalCount: projectEvaluations.length,
                completedEvaluations,
                failedEvaluations: [],
            };
            this.logger.log('프로젝트별 WBS 자기평가 제출 완료 (피평가자 → 1차 평가자)', {
                employeeId,
                periodId,
                projectId,
                submittedCount: result.submittedCount,
                totalEvaluations: result.totalCount,
            });
            return result;
        });
    }
};
exports.SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler = SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler;
exports.SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler = SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler = SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
        evaluation_period_service_1.EvaluationPeriodService,
        transaction_manager_service_1.TransactionManagerService])
], SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler);
//# sourceMappingURL=submit-wbs-self-evaluations-to-evaluator-by-project.handler.js.map