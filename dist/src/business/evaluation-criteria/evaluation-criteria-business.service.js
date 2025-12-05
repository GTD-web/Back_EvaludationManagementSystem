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
var EvaluationCriteriaBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationCriteriaBusinessService = void 0;
const common_1 = require("@nestjs/common");
const evaluation_criteria_management_service_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const revision_request_context_service_1 = require("../../context/revision-request-context/revision-request-context.service");
const evaluation_activity_log_context_service_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
const evaluation_revision_request_1 = require("../../domain/sub/evaluation-revision-request");
let EvaluationCriteriaBusinessService = EvaluationCriteriaBusinessService_1 = class EvaluationCriteriaBusinessService {
    evaluationCriteriaManagementService;
    revisionRequestContextService;
    activityLogContextService;
    logger = new common_1.Logger(EvaluationCriteriaBusinessService_1.name);
    constructor(evaluationCriteriaManagementService, revisionRequestContextService, activityLogContextService) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.revisionRequestContextService = revisionRequestContextService;
        this.activityLogContextService = activityLogContextService;
    }
    async 평가기준을_제출하고_재작성요청을_완료한다(evaluationPeriodId, employeeId, submittedBy) {
        const result = await this.evaluationCriteriaManagementService.평가기준을_제출한다(evaluationPeriodId, employeeId, submittedBy);
        try {
            await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(evaluationPeriodId, employeeId, 'criteria', employeeId, evaluation_revision_request_1.RecipientType.EVALUATEE, '평가기준 제출로 인한 재작성 완료 처리');
            this.logger.log(`재작성 요청 자동 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.debug(`재작성 요청 자동 완료 처리 실패 (재작성 요청이 없거나 이미 완료되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`, error);
        }
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId: evaluationPeriodId,
                employeeId,
                activityType: 'evaluation_criteria',
                activityAction: 'submitted',
                activityTitle: '평가기준 제출',
                relatedEntityType: 'evaluation_criteria',
                performedBy: submittedBy,
            });
        }
        catch (error) {
            this.logger.warn('평가기준 제출 활동 내역 기록 실패', {
                error: error.message,
            });
        }
        return result;
    }
};
exports.EvaluationCriteriaBusinessService = EvaluationCriteriaBusinessService;
exports.EvaluationCriteriaBusinessService = EvaluationCriteriaBusinessService = EvaluationCriteriaBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        revision_request_context_service_1.RevisionRequestContextService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService])
], EvaluationCriteriaBusinessService);
//# sourceMappingURL=evaluation-criteria-business.service.js.map