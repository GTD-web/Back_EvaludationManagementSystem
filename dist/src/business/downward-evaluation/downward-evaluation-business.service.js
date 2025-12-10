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
var DownwardEvaluationBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownwardEvaluationBusinessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const performance_evaluation_service_1 = require("../../context/performance-evaluation-context/performance-evaluation.service");
const evaluation_criteria_management_service_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const evaluation_period_management_service_1 = require("../../context/evaluation-period-management-context/evaluation-period-management.service");
const revision_request_context_service_1 = require("../../context/revision-request-context/revision-request-context.service");
const step_approval_context_service_1 = require("../../context/step-approval-context/step-approval-context.service");
const evaluation_activity_log_context_service_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
const downward_evaluation_1 = require("../../context/performance-evaluation-context/handlers/downward-evaluation");
const evaluation_revision_request_1 = require("../../domain/sub/evaluation-revision-request");
const downward_evaluation_types_1 = require("../../domain/core/downward-evaluation/downward-evaluation.types");
const wbs_self_evaluation_entity_1 = require("../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_entity_1 = require("../../domain/core/downward-evaluation/downward-evaluation.entity");
const notification_1 = require("../../domain/common/notification");
const evaluation_period_service_1 = require("../../domain/core/evaluation-period/evaluation-period.service");
let DownwardEvaluationBusinessService = DownwardEvaluationBusinessService_1 = class DownwardEvaluationBusinessService {
    performanceEvaluationService;
    evaluationCriteriaManagementService;
    evaluationPeriodManagementContextService;
    revisionRequestContextService;
    stepApprovalContextService;
    activityLogContextService;
    notificationHelper;
    evaluationPeriodService;
    wbsSelfEvaluationRepository;
    downwardEvaluationRepository;
    logger = new common_1.Logger(DownwardEvaluationBusinessService_1.name);
    constructor(performanceEvaluationService, evaluationCriteriaManagementService, evaluationPeriodManagementContextService, revisionRequestContextService, stepApprovalContextService, activityLogContextService, notificationHelper, evaluationPeriodService, wbsSelfEvaluationRepository, downwardEvaluationRepository) {
        this.performanceEvaluationService = performanceEvaluationService;
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.evaluationPeriodManagementContextService = evaluationPeriodManagementContextService;
        this.revisionRequestContextService = revisionRequestContextService;
        this.stepApprovalContextService = stepApprovalContextService;
        this.activityLogContextService = activityLogContextService;
        this.notificationHelper = notificationHelper;
        this.evaluationPeriodService = evaluationPeriodService;
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
        this.downwardEvaluationRepository = downwardEvaluationRepository;
    }
    async 일차_하향평가를_저장한다(params) {
        if (params.downwardEvaluationScore !== undefined &&
            params.downwardEvaluationScore !== null) {
            await this.evaluationPeriodManagementContextService.평가_점수를_검증한다(params.periodId, params.downwardEvaluationScore);
        }
        const existingEvaluations = await this.performanceEvaluationService.하향평가_목록을_조회한다(new downward_evaluation_1.GetDownwardEvaluationListQuery(params.evaluatorId, params.evaluateeId, params.periodId, params.wbsId, 'primary', undefined, 1, 1));
        const isNewEvaluation = !existingEvaluations || existingEvaluations.items?.length === 0;
        const evaluationId = await this.performanceEvaluationService.하향평가를_저장한다(params.evaluatorId, params.evaluateeId, params.periodId, params.wbsId, params.selfEvaluationId, 'primary', params.downwardEvaluationContent, params.downwardEvaluationScore, params.actionBy);
        if (isNewEvaluation) {
            try {
                await this.activityLogContextService.활동내역을_기록한다({
                    periodId: params.periodId,
                    employeeId: params.evaluateeId,
                    activityType: 'downward_evaluation',
                    activityAction: 'created',
                    activityTitle: '1차 하향평가 생성',
                    relatedEntityType: 'downward_evaluation',
                    relatedEntityId: evaluationId,
                    performedBy: params.actionBy,
                    activityMetadata: {
                        evaluatorId: params.evaluatorId,
                        evaluationType: 'primary',
                        wbsId: params.wbsId,
                    },
                });
            }
            catch (error) {
                this.logger.warn('1차 하향평가 생성 활동 내역 기록 실패', {
                    evaluationId,
                    error: error.message,
                });
            }
        }
        this.logger.log('1차 하향평가 저장 완료', { evaluationId });
        return evaluationId;
    }
    async 이차_하향평가를_저장한다(params) {
        this.logger.log('2차 하향평가 저장 비즈니스 로직 시작', {
            evaluatorId: params.evaluatorId,
            evaluateeId: params.evaluateeId,
            wbsId: params.wbsId,
        });
        if (params.downwardEvaluationScore !== undefined &&
            params.downwardEvaluationScore !== null) {
            await this.evaluationPeriodManagementContextService.평가_점수를_검증한다(params.periodId, params.downwardEvaluationScore);
        }
        const existingEvaluations = await this.performanceEvaluationService.하향평가_목록을_조회한다(new downward_evaluation_1.GetDownwardEvaluationListQuery(params.evaluatorId, params.evaluateeId, params.periodId, params.wbsId, 'secondary', undefined, 1, 1));
        const isNewEvaluation = !existingEvaluations || existingEvaluations.items?.length === 0;
        const evaluationId = await this.performanceEvaluationService.하향평가를_저장한다(params.evaluatorId, params.evaluateeId, params.periodId, params.wbsId, params.selfEvaluationId, 'secondary', params.downwardEvaluationContent, params.downwardEvaluationScore, params.actionBy);
        if (isNewEvaluation) {
            try {
                await this.activityLogContextService.활동내역을_기록한다({
                    periodId: params.periodId,
                    employeeId: params.evaluateeId,
                    activityType: 'downward_evaluation',
                    activityAction: 'created',
                    activityTitle: '2차 하향평가 생성',
                    relatedEntityType: 'downward_evaluation',
                    relatedEntityId: evaluationId,
                    performedBy: params.actionBy,
                    activityMetadata: {
                        evaluatorId: params.evaluatorId,
                        evaluationType: 'secondary',
                        wbsId: params.wbsId,
                    },
                });
            }
            catch (error) {
                this.logger.warn('2차 하향평가 생성 활동 내역 기록 실패', {
                    evaluationId,
                    error: error.message,
                });
            }
        }
        this.logger.log('2차 하향평가 저장 완료', { evaluationId });
        return evaluationId;
    }
    async 일차_하향평가를_제출하고_재작성요청을_완료한다(evaluateeId, periodId, wbsId, evaluatorId, submittedBy, approveAllBelow = false) {
        this.logger.log(`1차 하향평가 제출 및 재작성 요청 완료 처리 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}, 하위승인: ${approveAllBelow}`);
        await this.performanceEvaluationService.일차_하향평가를_제출한다(evaluateeId, periodId, wbsId, evaluatorId, submittedBy);
        await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(periodId, evaluateeId, 'primary', evaluatorId, evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR, '1차 하향평가 제출로 인한 재작성 완료 처리');
        if (approveAllBelow) {
            await this.자기평가를_자동_제출한다(evaluateeId, periodId, wbsId, submittedBy);
        }
        this.피평가자에게_알림을_전송한다(evaluateeId, periodId).catch((error) => {
            this.logger.error('1차 하향평가 제출 알림 전송 실패 (무시됨)', error.stack);
        });
        this.logger.log(`1차 하향평가 제출 및 재작성 요청 완료 처리 완료 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`);
    }
    async 피평가자에게_알림을_전송한다(evaluateeId, periodId) {
        try {
            const period = await this.evaluationPeriodService.ID로_조회한다(periodId);
            if (!period) {
                this.logger.warn(`평가기간을 찾을 수 없어 알림을 전송하지 않습니다. periodId=${periodId}`);
                return;
            }
            await this.notificationHelper.직원에게_알림을_전송한다({
                sender: 'system',
                title: '1차 하향평가 제출 알림',
                content: `${period.name} 평가기간의 1차 하향평가가 제출되었습니다.`,
                employeeNumber: evaluateeId,
                sourceSystem: 'ems',
                linkUrl: '/evaluations/self',
                metadata: {
                    type: 'primary-downward-evaluation-submitted',
                    priority: 'medium',
                    periodId,
                },
            });
            this.logger.log(`1차 하향평가 제출 알림 전송 완료: 피평가자=${evaluateeId}`);
        }
        catch (error) {
            this.logger.error('알림 전송 중 오류 발생', error.stack);
            throw error;
        }
    }
    async 이차_하향평가를_제출하고_재작성요청을_완료한다(evaluateeId, periodId, wbsId, evaluatorId, submittedBy, approveAllBelow = false) {
        this.logger.log(`2차 하향평가 제출 및 재작성 요청 완료 처리 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}, 하위승인: ${approveAllBelow}`);
        await this.performanceEvaluationService.이차_하향평가를_제출한다(evaluateeId, periodId, wbsId, evaluatorId, submittedBy);
        await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(periodId, evaluateeId, 'secondary', evaluatorId, evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR, '2차 하향평가 제출로 인한 재작성 완료 처리');
        if (approveAllBelow) {
            await this.일차_하향평가를_자동_제출한다(evaluateeId, periodId, wbsId, submittedBy);
            await this.자기평가를_자동_제출한다(evaluateeId, periodId, wbsId, submittedBy);
        }
        this.logger.log(`2차 하향평가 제출 및 재작성 요청 완료 처리 완료 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`);
    }
    async 일차_하향평가_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId, employeeId, revisionComment, requestedBy) {
        this.logger.log(`1차 하향평가 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        const primaryEvaluatorId = await this.stepApprovalContextService.일차평가자를_조회한다(evaluationPeriodId, employeeId);
        if (!primaryEvaluatorId) {
            this.logger.warn(`1차 평가자를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
        }
        else {
            try {
                await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_초기화한다(primaryEvaluatorId, employeeId, evaluationPeriodId, downward_evaluation_types_1.DownwardEvaluationType.PRIMARY, requestedBy);
            }
            catch (error) {
                this.logger.warn(`1차 하향평가 초기화 실패 (하향평가가 없을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`, error);
            }
        }
        await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다({
            evaluationPeriodId,
            employeeId,
            status: 'revision_requested',
            revisionComment,
            updatedBy: requestedBy,
        });
        try {
            await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다({
                evaluationPeriodId,
                employeeId,
                step: 'primary',
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
        this.logger.log(`1차 하향평가 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
    }
    async 이차_하향평가_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId, employeeId, evaluatorId, revisionComment, requestedBy) {
        this.logger.log(`2차 하향평가 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`);
        try {
            await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_초기화한다(evaluatorId, employeeId, evaluationPeriodId, downward_evaluation_types_1.DownwardEvaluationType.SECONDARY, requestedBy);
        }
        catch (error) {
            this.logger.warn(`2차 하향평가 초기화 실패 (하향평가가 없을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`, error);
        }
        const approval = await this.stepApprovalContextService.이차하향평가_확인상태를_변경한다({
            evaluationPeriodId,
            employeeId,
            evaluatorId,
            status: 'revision_requested',
            revisionComment,
            updatedBy: requestedBy,
        });
        try {
            await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다({
                evaluationPeriodId,
                employeeId,
                step: 'secondary',
                status: 'revision_requested',
                revisionComment,
                updatedBy: requestedBy,
                evaluatorId,
            });
        }
        catch (error) {
            this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
                error: error.message,
            });
        }
        this.logger.log(`2차 하향평가 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`);
        return approval;
    }
    async 피평가자의_모든_하향평가를_일괄_제출한다(evaluatorId, evaluateeId, periodId, evaluationType, submittedBy) {
        this.logger.log('하향평가 일괄 제출 시작', {
            evaluatorId,
            evaluateeId,
            periodId,
            evaluationType,
        });
        const result = await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(evaluatorId, evaluateeId, periodId, evaluationType, submittedBy);
        const step = evaluationType === downward_evaluation_types_1.DownwardEvaluationType.PRIMARY
            ? 'primary'
            : 'secondary';
        const recipientType = evaluationType === downward_evaluation_types_1.DownwardEvaluationType.PRIMARY
            ? evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR
            : evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR;
        const responseComment = evaluationType === downward_evaluation_types_1.DownwardEvaluationType.PRIMARY
            ? '1차 하향평가 일괄 제출로 인한 재작성 완료 처리'
            : '2차 하향평가 일괄 제출로 인한 재작성 완료 처리';
        try {
            await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(periodId, evaluateeId, step, evaluatorId, recipientType, responseComment);
        }
        catch (error) {
            this.logger.warn('재작성 요청 완료 처리 실패', {
                evaluatorId,
                evaluateeId,
                periodId,
                evaluationType,
                error: error.message,
            });
        }
        if (evaluationType === downward_evaluation_types_1.DownwardEvaluationType.SECONDARY &&
            result.submittedCount > 0) {
            try {
            }
            catch (error) {
                this.logger.warn('2차 평가 개별 승인 상태 설정 실패', {
                    evaluatorId,
                    evaluateeId,
                    periodId,
                    error: error.message,
                });
            }
        }
        try {
            const evaluationTypeText = evaluationType === downward_evaluation_types_1.DownwardEvaluationType.PRIMARY
                ? '1차 하향평가'
                : '2차 하향평가';
            const activityTitle = `${evaluationTypeText} 일괄 제출`;
            await this.activityLogContextService.활동내역을_기록한다({
                periodId,
                employeeId: evaluateeId,
                activityType: 'downward_evaluation',
                activityAction: 'submitted',
                activityTitle,
                relatedEntityType: 'downward_evaluation',
                performedBy: submittedBy,
                activityMetadata: {
                    evaluatorId,
                    evaluationType,
                    submittedCount: result.submittedCount,
                    skippedCount: result.skippedCount,
                    failedCount: result.failedCount,
                    submittedIds: result.submittedIds,
                    bulkOperation: true,
                },
            });
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                evaluatorId,
                evaluateeId,
                periodId,
                error: error.message,
            });
        }
        this.logger.log('하향평가 일괄 제출 완료', {
            submittedCount: result.submittedCount,
            skippedCount: result.skippedCount,
            failedCount: result.failedCount,
        });
        return result;
    }
    async 자기평가를_자동_제출한다(employeeId, periodId, wbsId, submittedBy) {
        try {
            this.logger.log(`자기평가 자동 제출 시작 - 직원: ${employeeId}, 평가기간: ${periodId}, WBS: ${wbsId}`);
            const selfEvaluation = await this.wbsSelfEvaluationRepository.findOne({
                where: {
                    employeeId,
                    periodId,
                    wbsItemId: wbsId,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            if (!selfEvaluation) {
                this.logger.warn(`자기평가를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${periodId}, WBS: ${wbsId}`);
                return;
            }
            if (selfEvaluation.submittedToManager) {
                this.logger.log(`자기평가가 이미 제출되어 있습니다 - 자기평가 ID: ${selfEvaluation.id}`);
                return;
            }
            await this.performanceEvaluationService.WBS자기평가를_제출한다(selfEvaluation.id, submittedBy);
            this.logger.log(`자기평가 자동 제출 완료 - 자기평가 ID: ${selfEvaluation.id}`);
        }
        catch (error) {
            this.logger.error(`자기평가 자동 제출 실패 - 직원: ${employeeId}, 평가기간: ${periodId}, WBS: ${wbsId}`, error);
        }
    }
    async 일차_하향평가를_자동_제출한다(evaluateeId, periodId, wbsId, submittedBy) {
        try {
            this.logger.log(`1차 하향평가 자동 제출 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, WBS: ${wbsId}`);
            const primaryEvaluatorId = await this.stepApprovalContextService.일차평가자를_조회한다(periodId, evaluateeId);
            if (!primaryEvaluatorId) {
                this.logger.warn(`1차 평가자를 찾을 수 없습니다 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}`);
                return;
            }
            const downwardEvaluation = await this.downwardEvaluationRepository.findOne({
                where: {
                    employeeId: evaluateeId,
                    evaluatorId: primaryEvaluatorId,
                    periodId,
                    wbsId,
                    evaluationType: downward_evaluation_types_1.DownwardEvaluationType.PRIMARY,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            if (!downwardEvaluation) {
                this.logger.warn(`1차 하향평가를 찾을 수 없습니다 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, WBS: ${wbsId}`);
                return;
            }
            if (downwardEvaluation.isCompleted) {
                this.logger.log(`1차 하향평가가 이미 제출되어 있습니다 - 하향평가 ID: ${downwardEvaluation.id}`);
                return;
            }
            await this.performanceEvaluationService.일차_하향평가를_제출한다(evaluateeId, periodId, wbsId, primaryEvaluatorId, submittedBy);
            this.logger.log(`1차 하향평가 자동 제출 완료 - 하향평가 ID: ${downwardEvaluation.id}`);
        }
        catch (error) {
            this.logger.error(`1차 하향평가 자동 제출 실패 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, WBS: ${wbsId}`, error);
        }
    }
};
exports.DownwardEvaluationBusinessService = DownwardEvaluationBusinessService;
exports.DownwardEvaluationBusinessService = DownwardEvaluationBusinessService = DownwardEvaluationBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(8, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __param(9, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        evaluation_period_management_service_1.EvaluationPeriodManagementContextService,
        revision_request_context_service_1.RevisionRequestContextService,
        step_approval_context_service_1.StepApprovalContextService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService,
        notification_1.NotificationHelperService,
        evaluation_period_service_1.EvaluationPeriodService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DownwardEvaluationBusinessService);
//# sourceMappingURL=downward-evaluation-business.service.js.map