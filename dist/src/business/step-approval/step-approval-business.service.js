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
var StepApprovalBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepApprovalBusinessService = void 0;
const common_1 = require("@nestjs/common");
const performance_evaluation_service_1 = require("../../context/performance-evaluation-context/performance-evaluation.service");
const step_approval_context_service_1 = require("../../context/step-approval-context/step-approval-context.service");
const evaluation_activity_log_context_service_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
const evaluation_criteria_management_service_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const revision_request_context_service_1 = require("../../context/revision-request-context/revision-request-context.service");
const employee_sync_service_1 = require("../../context/organization-management-context/employee-sync.service");
const downward_evaluation_types_1 = require("../../domain/core/downward-evaluation/downward-evaluation.types");
const evaluation_revision_request_1 = require("../../domain/sub/evaluation-revision-request");
const get_employee_self_evaluations_handler_1 = require("../../context/performance-evaluation-context/handlers/self-evaluation/queries/get-employee-self-evaluations.handler");
const wbs_self_evaluation_business_service_1 = require("../wbs-self-evaluation/wbs-self-evaluation-business.service");
const downward_evaluation_business_service_1 = require("../downward-evaluation/downward-evaluation-business.service");
let StepApprovalBusinessService = StepApprovalBusinessService_1 = class StepApprovalBusinessService {
    performanceEvaluationService;
    stepApprovalContextService;
    activityLogContextService;
    evaluationCriteriaManagementService;
    revisionRequestContextService;
    employeeSyncService;
    wbsSelfEvaluationBusinessService;
    downwardEvaluationBusinessService;
    logger = new common_1.Logger(StepApprovalBusinessService_1.name);
    constructor(performanceEvaluationService, stepApprovalContextService, activityLogContextService, evaluationCriteriaManagementService, revisionRequestContextService, employeeSyncService, wbsSelfEvaluationBusinessService, downwardEvaluationBusinessService) {
        this.performanceEvaluationService = performanceEvaluationService;
        this.stepApprovalContextService = stepApprovalContextService;
        this.activityLogContextService = activityLogContextService;
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.revisionRequestContextService = revisionRequestContextService;
        this.employeeSyncService = employeeSyncService;
        this.wbsSelfEvaluationBusinessService = wbsSelfEvaluationBusinessService;
        this.downwardEvaluationBusinessService = downwardEvaluationBusinessService;
    }
    async 자기평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, approvedBy) {
        this.logger.log(`자기평가 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        try {
            await this.performanceEvaluationService.직원의_전체_자기평가를_승인시_제출한다(employeeId, evaluationPeriodId, approvedBy);
            this.logger.log(`자기평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.warn(`자기평가 승인 시 제출 상태 변경 실패 (이미 제출되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`, error);
        }
        try {
            await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(evaluationPeriodId, employeeId, 'self', employeeId, evaluation_revision_request_1.RecipientType.EVALUATEE, '자기평가 승인으로 인한 재작성 완료 처리');
            this.logger.log(`자기평가 승인 시 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.warn('자기평가 승인 시 재작성 요청 완료 처리 실패 (승인은 계속 진행)', {
                employeeId,
                evaluationPeriodId,
                error: error.message,
                errorStack: error.stack,
            });
        }
    }
    async 일차_하향평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, approvedBy) {
        this.logger.log(`1차 하향평가 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        const primaryEvaluatorId = await this.stepApprovalContextService.일차평가자를_조회한다(evaluationPeriodId, employeeId);
        if (!primaryEvaluatorId) {
            this.logger.warn(`1차 평가자를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
            return;
        }
        const result = await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(primaryEvaluatorId, employeeId, evaluationPeriodId, downward_evaluation_types_1.DownwardEvaluationType.PRIMARY, approvedBy, true);
        if (result.submittedCount === 0 && result.skippedCount === 0) {
            this.logger.debug(`1차 하향평가가 없어 제출 상태 변경을 건너뜀 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`);
            return;
        }
        try {
            await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(evaluationPeriodId, employeeId, 'primary', primaryEvaluatorId, evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR, '1차 하향평가 승인으로 인한 재작성 완료 처리');
            this.logger.log(`1차 하향평가 승인 시 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`);
        }
        catch (error) {
            this.logger.warn('1차 하향평가 승인 시 재작성 요청 완료 처리 실패', {
                evaluatorId: primaryEvaluatorId,
                employeeId,
                evaluationPeriodId,
                error: error.message,
            });
        }
        this.logger.log(`1차 하향평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}, 제출: ${result.submittedCount}, 건너뜀: ${result.skippedCount}`);
    }
    async 이차_하향평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, evaluatorId, approvedBy) {
        this.logger.log(`2차 하향평가 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`);
        const result = await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(evaluatorId, employeeId, evaluationPeriodId, downward_evaluation_types_1.DownwardEvaluationType.SECONDARY, approvedBy, true);
        if (result.submittedCount === 0 && result.skippedCount === 0) {
            this.logger.debug(`2차 하향평가가 없어 제출 상태 변경을 건너뜀 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`);
            return;
        }
        try {
            await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(evaluationPeriodId, employeeId, 'secondary', evaluatorId, evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR, '2차 하향평가 승인으로 인한 재작성 완료 처리');
            this.logger.log(`2차 하향평가 승인 시 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`);
        }
        catch (error) {
            this.logger.warn('2차 하향평가 승인 시 재작성 요청 완료 처리 실패', {
                evaluatorId,
                employeeId,
                evaluationPeriodId,
                error: error.message,
            });
        }
        this.logger.log(`2차 하향평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}, 제출: ${result.submittedCount}, 건너뜀: ${result.skippedCount}`);
    }
    async 평가기준설정_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId, employeeId, revisionComment, updatedBy) {
        this.logger.log(`평가기준 설정 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        try {
            await this.evaluationCriteriaManagementService.평가기준_제출을_초기화한다(evaluationPeriodId, employeeId, updatedBy);
            this.logger.log(`평가기준 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.warn(`평가기준 제출 상태 초기화 실패 (이미 초기화되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`, error);
        }
        await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다({
            evaluationPeriodId,
            employeeId,
            status: 'revision_requested',
            revisionComment,
            updatedBy,
        });
        try {
            await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다({
                evaluationPeriodId,
                employeeId,
                step: 'criteria',
                status: 'revision_requested',
                revisionComment,
                updatedBy,
            });
        }
        catch (error) {
            this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
                error: error.message,
            });
        }
        this.logger.log(`평가기준 설정 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
    }
    async 평가기준설정_승인_시_제출상태_변경(evaluationPeriodId, employeeId, approvedBy) {
        this.logger.log(`평가기준 설정 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        try {
            await this.evaluationCriteriaManagementService.평가기준을_제출한다(evaluationPeriodId, employeeId, approvedBy);
            this.logger.log(`평가기준 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.warn(`평가기준 제출 상태 변경 실패 (이미 제출되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`, error);
        }
        try {
            await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(evaluationPeriodId, employeeId, 'criteria', employeeId, evaluation_revision_request_1.RecipientType.EVALUATEE, '평가기준 설정 승인으로 인한 재작성 완료 처리');
            this.logger.log(`평가기준 설정 승인 시 재작성 요청 완료 처리 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.warn('평가기준 설정 승인 시 재작성 요청 완료 처리 실패', {
                employeeId,
                evaluationPeriodId,
                error: error.message,
            });
        }
        this.logger.log(`평가기준 설정 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
    }
    async 평가기준설정_확인상태를_변경한다(params) {
        await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다({
            evaluationPeriodId: params.evaluationPeriodId,
            employeeId: params.employeeId,
            status: params.status,
            revisionComment: params.revisionComment,
            updatedBy: params.updatedBy,
        });
        try {
            await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다({
                evaluationPeriodId: params.evaluationPeriodId,
                employeeId: params.employeeId,
                step: 'criteria',
                status: params.status,
                revisionComment: params.revisionComment,
                updatedBy: params.updatedBy,
            });
        }
        catch (error) {
            this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
                error: error.message,
            });
        }
    }
    async 자기평가_확인상태를_변경한다(params) {
        await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
            evaluationPeriodId: params.evaluationPeriodId,
            employeeId: params.employeeId,
            status: params.status,
            revisionComment: params.revisionComment,
            updatedBy: params.updatedBy,
        });
        try {
            await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다({
                evaluationPeriodId: params.evaluationPeriodId,
                employeeId: params.employeeId,
                step: 'self',
                status: params.status,
                revisionComment: params.revisionComment,
                updatedBy: params.updatedBy,
            });
        }
        catch (error) {
            this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
                error: error.message,
            });
        }
    }
    async 일차하향평가_확인상태를_변경한다(params) {
        this.logger.log(`1차 하향평가 단계 승인 상태를 변경한다 - 직원: ${params.employeeId}, 평가기간: ${params.evaluationPeriodId}, 상태: ${params.status}`);
        await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다({
            evaluationPeriodId: params.evaluationPeriodId,
            employeeId: params.employeeId,
            status: params.status,
            revisionComment: params.revisionComment,
            updatedBy: params.updatedBy,
        });
        try {
            await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다({
                evaluationPeriodId: params.evaluationPeriodId,
                employeeId: params.employeeId,
                step: 'primary',
                status: params.status,
                revisionComment: params.revisionComment,
                updatedBy: params.updatedBy,
            });
        }
        catch (error) {
            this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
                error: error.message,
            });
        }
    }
    async 이차하향평가_확인상태를_변경한다(params) {
        const approval = await this.stepApprovalContextService.이차하향평가_확인상태를_변경한다({
            evaluationPeriodId: params.evaluationPeriodId,
            employeeId: params.employeeId,
            evaluatorId: params.evaluatorId,
            status: params.status,
            revisionComment: params.revisionComment,
            updatedBy: params.updatedBy,
        });
        try {
            await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다({
                evaluationPeriodId: params.evaluationPeriodId,
                employeeId: params.employeeId,
                step: 'secondary',
                status: params.status,
                revisionComment: params.revisionComment,
                updatedBy: params.updatedBy,
                evaluatorId: params.evaluatorId,
            });
        }
        catch (error) {
            this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
                error: error.message,
            });
        }
        return approval;
    }
    async 자기평가_승인_시_하위평가들을_승인한다(evaluationPeriodId, employeeId, updatedBy) {
        this.logger.log(`자기평가 승인 시 하위 평가 자동 승인 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        try {
            await this.일차하향평가_확인상태를_변경한다({
                evaluationPeriodId,
                employeeId,
                status: 'approved',
                updatedBy,
            });
            await this.일차_하향평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, updatedBy);
            this.logger.log(`1차 하향평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
            const secondaryEvaluators = await this.stepApprovalContextService.이차평가자들을_조회한다(evaluationPeriodId, employeeId);
            for (const evaluatorId of secondaryEvaluators) {
                try {
                    await this.이차하향평가_확인상태를_변경한다({
                        evaluationPeriodId,
                        employeeId,
                        evaluatorId,
                        status: 'approved',
                        updatedBy,
                    });
                    await this.이차_하향평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, evaluatorId, updatedBy);
                    this.logger.log(`2차 하향평가 자동 승인 완료 - 직원: ${employeeId}, 평가자: ${evaluatorId}, 평가기간: ${evaluationPeriodId}`);
                }
                catch (error) {
                    this.logger.warn(`2차 하향평가 자동 승인 실패 - 직원: ${employeeId}, 평가자: ${evaluatorId}`, error);
                }
            }
            this.logger.log(`자기평가 승인 시 하위 평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.error(`자기평가 승인 시 하위 평가 자동 승인 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`, error);
            throw error;
        }
    }
    async 일차하향평가_승인_시_하위평가들을_승인한다(evaluationPeriodId, employeeId, updatedBy) {
        this.logger.log(`1차 하향평가 승인 시 하위 평가 자동 승인 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        try {
            const secondaryEvaluators = await this.stepApprovalContextService.이차평가자들을_조회한다(evaluationPeriodId, employeeId);
            for (const evaluatorId of secondaryEvaluators) {
                try {
                    await this.이차하향평가_확인상태를_변경한다({
                        evaluationPeriodId,
                        employeeId,
                        evaluatorId,
                        status: 'approved',
                        updatedBy,
                    });
                    await this.이차_하향평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, evaluatorId, updatedBy);
                    this.logger.log(`2차 하향평가 자동 승인 완료 - 직원: ${employeeId}, 평가자: ${evaluatorId}, 평가기간: ${evaluationPeriodId}`);
                }
                catch (error) {
                    this.logger.warn(`2차 하향평가 자동 승인 실패 - 직원: ${employeeId}, 평가자: ${evaluatorId}`, error);
                }
            }
            this.logger.log(`1차 하향평가 승인 시 하위 평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.error(`1차 하향평가 승인 시 하위 평가 자동 승인 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`, error);
            throw error;
        }
    }
    async 일차하향평가_승인_시_상위평가를_승인한다(evaluationPeriodId, employeeId, updatedBy) {
        this.logger.log(`1차 하향평가 승인 시 상위 평가 자동 승인 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        try {
            const approver = await this.employeeSyncService.getEmployeeById(updatedBy);
            const approverName = approver?.name || '관리자';
            const wbsAssignments = await this.evaluationCriteriaManagementService.특정_평가기간에_직원에게_할당된_WBS를_조회한다(employeeId, evaluationPeriodId);
            const existingSelfEvaluationsQuery = new get_employee_self_evaluations_handler_1.GetEmployeeSelfEvaluationsQuery(employeeId, evaluationPeriodId, undefined, 1, 1000);
            const existingSelfEvaluationsResult = await this.performanceEvaluationService.직원의_자기평가_목록을_조회한다(existingSelfEvaluationsQuery);
            const existingWbsItemIds = new Set(existingSelfEvaluationsResult.evaluations.map((e) => e.wbsItemId));
            for (const assignment of wbsAssignments) {
                if (!existingWbsItemIds.has(assignment.wbsItemId)) {
                    const approvalMessage = `${approverName}님에 따라 자기평가가 승인 처리되었습니다.`;
                    await this.performanceEvaluationService.WBS자기평가를_생성한다(evaluationPeriodId, employeeId, assignment.wbsItemId, approvalMessage, 0, undefined, updatedBy);
                    this.logger.log(`자기평가 자동 생성 완료 - 직원: ${employeeId}, WBS: ${assignment.wbsItemId}, 평가기간: ${evaluationPeriodId}`);
                }
            }
            await this.자기평가_확인상태를_변경한다({
                evaluationPeriodId,
                employeeId,
                status: 'approved',
                updatedBy,
            });
            await this.자기평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, updatedBy);
            this.logger.log(`자기평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.error(`1차 하향평가 승인 시 상위 평가 자동 승인 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`, error);
            throw error;
        }
    }
    async 이차하향평가_승인_시_상위평가들을_승인한다(evaluationPeriodId, employeeId, updatedBy) {
        this.logger.log(`2차 하향평가 승인 시 상위 평가 자동 승인 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        try {
            await this.일차하향평가_확인상태를_변경한다({
                evaluationPeriodId,
                employeeId,
                status: 'approved',
                updatedBy,
            });
            await this.일차_하향평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, updatedBy);
            this.logger.log(`1차 하향평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
            await this.자기평가_확인상태를_변경한다({
                evaluationPeriodId,
                employeeId,
                status: 'approved',
                updatedBy,
            });
            await this.자기평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, updatedBy);
            this.logger.log(`자기평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
            this.logger.log(`2차 하향평가 승인 시 상위 평가 자동 승인 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        catch (error) {
            this.logger.error(`2차 하향평가 승인 시 상위 평가 자동 승인 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`, error);
            throw error;
        }
    }
};
exports.StepApprovalBusinessService = StepApprovalBusinessService;
exports.StepApprovalBusinessService = StepApprovalBusinessService = StepApprovalBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => wbs_self_evaluation_business_service_1.WbsSelfEvaluationBusinessService))),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => downward_evaluation_business_service_1.DownwardEvaluationBusinessService))),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        step_approval_context_service_1.StepApprovalContextService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService,
        evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        revision_request_context_service_1.RevisionRequestContextService,
        employee_sync_service_1.EmployeeSyncService,
        wbs_self_evaluation_business_service_1.WbsSelfEvaluationBusinessService,
        downward_evaluation_business_service_1.DownwardEvaluationBusinessService])
], StepApprovalBusinessService);
//# sourceMappingURL=step-approval-business.service.js.map