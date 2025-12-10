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
var WbsSelfEvaluationBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsSelfEvaluationBusinessService = void 0;
const common_1 = require("@nestjs/common");
const performance_evaluation_service_1 = require("../../context/performance-evaluation-context/performance-evaluation.service");
const revision_request_context_service_1 = require("../../context/revision-request-context/revision-request-context.service");
const step_approval_context_service_1 = require("../../context/step-approval-context/step-approval-context.service");
const evaluation_activity_log_context_service_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
const evaluation_revision_request_1 = require("../../domain/sub/evaluation-revision-request");
const employee_evaluation_step_approval_1 = require("../../domain/sub/employee-evaluation-step-approval");
let WbsSelfEvaluationBusinessService = WbsSelfEvaluationBusinessService_1 = class WbsSelfEvaluationBusinessService {
    performanceEvaluationService;
    revisionRequestContextService;
    stepApprovalContextService;
    activityLogContextService;
    logger = new common_1.Logger(WbsSelfEvaluationBusinessService_1.name);
    constructor(performanceEvaluationService, revisionRequestContextService, stepApprovalContextService, activityLogContextService) {
        this.performanceEvaluationService = performanceEvaluationService;
        this.revisionRequestContextService = revisionRequestContextService;
        this.stepApprovalContextService = stepApprovalContextService;
        this.activityLogContextService = activityLogContextService;
    }
    async 직원의_전체_WBS자기평가를_제출하고_재작성요청을_완료한다(employeeId, periodId, submittedBy) {
        this.logger.log(`직원의 전체 WBS 자기평가 제출 및 재작성 요청 완료 처리 시작 - 직원: ${employeeId}, 평가기간: ${periodId}`);
        const result = await this.performanceEvaluationService.직원의_전체_WBS자기평가를_제출한다(employeeId, periodId, submittedBy);
        await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(periodId, employeeId, 'self', employeeId, evaluation_revision_request_1.RecipientType.EVALUATEE, '자기평가 제출로 인한 재작성 완료 처리');
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId,
                employeeId,
                activityType: 'wbs_self_evaluation',
                activityAction: 'submitted',
                activityTitle: 'WBS 자기평가 제출',
                relatedEntityType: 'wbs_self_evaluation',
                performedBy: submittedBy,
            });
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                employeeId,
                periodId,
                error: error.message,
            });
        }
        this.logger.log(`직원의 전체 WBS 자기평가 제출 및 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${periodId}`);
        return result;
    }
    async 자기평가_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId, employeeId, revisionComment, requestedBy) {
        this.logger.log(`자기평가 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        await this.performanceEvaluationService.직원의_전체_WBS자기평가를_초기화한다(employeeId, evaluationPeriodId, requestedBy);
        await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
            evaluationPeriodId,
            employeeId,
            status: employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_REQUESTED,
            revisionComment,
            updatedBy: requestedBy,
        });
        try {
            await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다({
                evaluationPeriodId,
                employeeId,
                step: 'self',
                status: 'revision_requested',
                revisionComment,
                updatedBy: requestedBy,
            });
        }
        catch (error) {
            this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
                error: error.message,
            });
        }
        this.logger.log(`자기평가 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
    }
    async 직원의_전체_자기평가를_1차평가자에게_제출한다(employeeId, periodId, submittedBy) {
        const result = await this.performanceEvaluationService.직원의_전체_자기평가를_1차평가자에게_제출한다(employeeId, periodId, submittedBy);
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId,
                employeeId,
                activityType: 'wbs_self_evaluation',
                activityAction: 'submitted',
                activityTitle: 'WBS 자기평가 제출 (1차 평가자)',
                relatedEntityType: 'wbs_self_evaluation',
                performedBy: submittedBy,
            });
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                employeeId,
                periodId,
                error: error.message,
            });
        }
        return result;
    }
    async 직원의_전체_자기평가를_1차평가자_제출_취소한다(employeeId, periodId, resetBy) {
        const result = await this.performanceEvaluationService.직원의_전체_자기평가를_1차평가자_제출_취소한다(employeeId, periodId, resetBy);
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId,
                employeeId,
                activityType: 'wbs_self_evaluation',
                activityAction: 'cancelled',
                activityTitle: 'WBS 자기평가 제출 취소 (1차 평가자)',
                relatedEntityType: 'wbs_self_evaluation',
                performedBy: resetBy,
            });
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                employeeId,
                periodId,
                error: error.message,
            });
        }
        return result;
    }
};
exports.WbsSelfEvaluationBusinessService = WbsSelfEvaluationBusinessService;
exports.WbsSelfEvaluationBusinessService = WbsSelfEvaluationBusinessService = WbsSelfEvaluationBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        revision_request_context_service_1.RevisionRequestContextService,
        step_approval_context_service_1.StepApprovalContextService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService])
], WbsSelfEvaluationBusinessService);
//# sourceMappingURL=wbs-self-evaluation-business.service.js.map