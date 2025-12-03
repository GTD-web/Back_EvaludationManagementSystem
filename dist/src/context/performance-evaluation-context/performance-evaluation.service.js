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
var PerformanceEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const downward_evaluation_exceptions_1 = require("../../domain/core/downward-evaluation/downward-evaluation.exceptions");
const secondary_evaluation_step_approval_service_1 = require("../../domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.service");
const step_approval_context_service_1 = require("../step-approval-context/step-approval-context.service");
const self_evaluation_1 = require("./handlers/self-evaluation");
const evaluation_editable_status_1 = require("./handlers/evaluation-editable-status");
const peer_evaluation_1 = require("./handlers/peer-evaluation");
const downward_evaluation_1 = require("./handlers/downward-evaluation");
const final_evaluation_1 = require("./handlers/final-evaluation");
const command_1 = require("./handlers/deliverable/command");
const query_1 = require("./handlers/deliverable/query");
let PerformanceEvaluationService = PerformanceEvaluationService_1 = class PerformanceEvaluationService {
    commandBus;
    queryBus;
    mappingRepository;
    secondaryStepApprovalService;
    stepApprovalContextService;
    logger = new common_1.Logger(PerformanceEvaluationService_1.name);
    constructor(commandBus, queryBus, mappingRepository, secondaryStepApprovalService, stepApprovalContextService) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.mappingRepository = mappingRepository;
        this.secondaryStepApprovalService = secondaryStepApprovalService;
        this.stepApprovalContextService = stepApprovalContextService;
    }
    async WBS자기평가를_생성한다(periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, performanceResult, createdBy) {
        const command = new self_evaluation_1.CreateWbsSelfEvaluationCommand(periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, performanceResult, createdBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async WBS자기평가를_수정한다(evaluationId, selfEvaluationContent, selfEvaluationScore, performanceResult, updatedBy) {
        const command = new self_evaluation_1.UpdateWbsSelfEvaluationCommand(evaluationId, selfEvaluationContent, selfEvaluationScore, performanceResult, updatedBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async WBS자기평가를_저장한다(periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, performanceResult, actionBy) {
        const command = new self_evaluation_1.UpsertWbsSelfEvaluationCommand(periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, performanceResult, actionBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async WBS자기평가를_제출한다(evaluationId, submittedBy) {
        const command = new self_evaluation_1.SubmitWbsSelfEvaluationCommand(evaluationId, submittedBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 피평가자가_1차평가자에게_자기평가를_제출한다(evaluationId, submittedBy) {
        const command = new self_evaluation_1.SubmitWbsSelfEvaluationToEvaluatorCommand(evaluationId, submittedBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 직원의_전체_WBS자기평가를_제출한다(employeeId, periodId, submittedBy) {
        const command = new self_evaluation_1.SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand(employeeId, periodId, submittedBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 직원의_전체_자기평가를_1차평가자에게_제출한다(employeeId, periodId, submittedBy) {
        const command = new self_evaluation_1.SubmitAllWbsSelfEvaluationsToEvaluatorCommand(employeeId, periodId, submittedBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 직원의_전체_자기평가를_승인시_제출한다(employeeId, periodId, submittedBy) {
        const command = new self_evaluation_1.SubmitAllWbsSelfEvaluationsForApprovalCommand(employeeId, periodId, submittedBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async WBS자기평가를_초기화한다(evaluationId, resetBy) {
        const command = new self_evaluation_1.ResetWbsSelfEvaluationCommand(evaluationId, resetBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 직원의_전체_WBS자기평가를_초기화한다(employeeId, periodId, resetBy) {
        const command = new self_evaluation_1.ResetAllWbsSelfEvaluationsByEmployeePeriodCommand(employeeId, periodId, resetBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 프로젝트별_WBS자기평가를_제출한다(employeeId, periodId, projectId, submittedBy) {
        const command = new self_evaluation_1.SubmitWbsSelfEvaluationsByProjectCommand(employeeId, periodId, projectId, submittedBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 프로젝트별_자기평가를_1차평가자에게_제출한다(employeeId, periodId, projectId, submittedBy) {
        const command = new self_evaluation_1.SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand(employeeId, periodId, projectId, submittedBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 피평가자가_1차평가자에게_제출한_자기평가를_취소한다(evaluationId, resetBy) {
        const command = new self_evaluation_1.ResetWbsSelfEvaluationToEvaluatorCommand(evaluationId, resetBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 직원의_전체_자기평가를_1차평가자_제출_취소한다(employeeId, periodId, resetBy) {
        const command = new self_evaluation_1.ResetAllWbsSelfEvaluationsToEvaluatorCommand(employeeId, periodId, resetBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 프로젝트별_자기평가를_1차평가자_제출_취소한다(employeeId, periodId, projectId, resetBy) {
        const command = new self_evaluation_1.ResetWbsSelfEvaluationsToEvaluatorByProjectCommand(employeeId, periodId, projectId, resetBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 프로젝트별_WBS자기평가를_초기화한다(employeeId, periodId, projectId, resetBy) {
        const command = new self_evaluation_1.ResetWbsSelfEvaluationsByProjectCommand(employeeId, periodId, projectId, resetBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 직원의_자기평가_목록을_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async WBS자기평가_상세정보를_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async 동료평가를_생성한다(evaluatorId, evaluateeId, periodId, projectId, requestDeadline, evaluationContent, score, createdBy) {
        const command = new peer_evaluation_1.CreatePeerEvaluationCommand(evaluatorId, evaluateeId, periodId, projectId, requestDeadline, createdBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 동료평가를_수정한다(evaluationId, evaluationContent, score, updatedBy) {
        const command = new peer_evaluation_1.UpdatePeerEvaluationCommand(evaluationId, updatedBy || '시스템');
        await this.commandBus.execute(command);
    }
    async 동료평가를_취소한다(evaluationId, cancelledBy) {
        const command = new peer_evaluation_1.CancelPeerEvaluationCommand(evaluationId, cancelledBy);
        await this.commandBus.execute(command);
    }
    async 피평가자의_동료평가를_일괄_취소한다(evaluateeId, periodId, cancelledBy) {
        const command = new peer_evaluation_1.CancelPeerEvaluationsByPeriodCommand(evaluateeId, periodId, cancelledBy);
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 동료평가를_제출한다(evaluationId, submittedBy) {
        const command = new peer_evaluation_1.SubmitPeerEvaluationCommand(evaluationId, submittedBy || '시스템');
        await this.commandBus.execute(command);
    }
    async 동료평가_목록을_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async 동료평가_상세정보를_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async 평가자에게_할당된_피평가자_목록을_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async 하향평가를_생성한다(evaluatorId, evaluateeId, periodId, projectId, selfEvaluationId, evaluationType, downwardEvaluationContent, downwardEvaluationScore, createdBy) {
        const command = new downward_evaluation_1.CreateDownwardEvaluationCommand(evaluatorId, evaluateeId, periodId, projectId, selfEvaluationId, evaluationType || 'primary', downwardEvaluationContent, downwardEvaluationScore, createdBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 하향평가를_수정한다(evaluationId, downwardEvaluationContent, downwardEvaluationScore, updatedBy) {
        const command = new downward_evaluation_1.UpdateDownwardEvaluationCommand(evaluationId, downwardEvaluationContent, downwardEvaluationScore, updatedBy || '시스템');
        await this.commandBus.execute(command);
    }
    async 하향평가를_저장한다(evaluatorId, evaluateeId, periodId, wbsId, selfEvaluationId, evaluationType, downwardEvaluationContent, downwardEvaluationScore, actionBy) {
        const command = new downward_evaluation_1.UpsertDownwardEvaluationCommand(evaluatorId, evaluateeId, periodId, wbsId, selfEvaluationId, evaluationType || 'primary', downwardEvaluationContent, downwardEvaluationScore, actionBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 일차_하향평가를_제출한다(evaluateeId, periodId, wbsId, evaluatorId, submittedBy) {
        const actualPrimaryEvaluatorId = await this.stepApprovalContextService.일차평가자를_조회한다(periodId, evaluateeId);
        if (!actualPrimaryEvaluatorId) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(`1차 평가자를 찾을 수 없습니다. (evaluateeId: ${evaluateeId}, periodId: ${periodId})`);
        }
        if (evaluatorId !== actualPrimaryEvaluatorId) {
            this.logger.warn(`⚠️ 전달받은 evaluatorId(${evaluatorId})와 실제 할당된 1차 평가자 ID(${actualPrimaryEvaluatorId})가 다릅니다. 실제 평가자 ID를 사용합니다.`);
        }
        const query = new downward_evaluation_1.GetDownwardEvaluationListQuery(actualPrimaryEvaluatorId, evaluateeId, periodId, wbsId, 'primary', undefined, 1, 1);
        const result = await this.queryBus.execute(query);
        if (!result.evaluations || result.evaluations.length === 0) {
            await this.하향평가를_저장한다(actualPrimaryEvaluatorId, evaluateeId, periodId, wbsId, undefined, 'primary', undefined, undefined, submittedBy);
            const newResult = await this.queryBus.execute(query);
            if (!newResult.evaluations || newResult.evaluations.length === 0) {
                throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(`1차 하향평가 생성 실패 (evaluateeId: ${evaluateeId}, periodId: ${periodId}, wbsId: ${wbsId})`);
            }
            const evaluation = newResult.evaluations[0];
            const command = new downward_evaluation_1.SubmitDownwardEvaluationCommand(evaluation.id, submittedBy);
            await this.commandBus.execute(command);
            return;
        }
        const evaluation = result.evaluations[0];
        const command = new downward_evaluation_1.SubmitDownwardEvaluationCommand(evaluation.id, submittedBy);
        await this.commandBus.execute(command);
    }
    async 이차_하향평가를_제출한다(evaluateeId, periodId, wbsId, evaluatorId, submittedBy) {
        const actualSecondaryEvaluatorId = await this.stepApprovalContextService.이차평가자를_조회한다(periodId, evaluateeId, wbsId);
        if (!actualSecondaryEvaluatorId) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(`2차 평가자를 찾을 수 없습니다. (evaluateeId: ${evaluateeId}, periodId: ${periodId}, wbsId: ${wbsId})`);
        }
        if (evaluatorId !== actualSecondaryEvaluatorId) {
            this.logger.warn(`⚠️ 전달받은 evaluatorId(${evaluatorId})와 실제 할당된 2차 평가자 ID(${actualSecondaryEvaluatorId})가 다릅니다. 실제 평가자 ID를 사용합니다.`);
        }
        const query = new downward_evaluation_1.GetDownwardEvaluationListQuery(actualSecondaryEvaluatorId, evaluateeId, periodId, wbsId, 'secondary', undefined, 1, 1);
        const result = await this.queryBus.execute(query);
        if (!result.evaluations || result.evaluations.length === 0) {
            await this.하향평가를_저장한다(actualSecondaryEvaluatorId, evaluateeId, periodId, wbsId, undefined, 'secondary', undefined, undefined, submittedBy);
            const newResult = await this.queryBus.execute(query);
            if (!newResult.evaluations || newResult.evaluations.length === 0) {
                throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(`2차 하향평가 생성 실패 (evaluateeId: ${evaluateeId}, periodId: ${periodId}, wbsId: ${wbsId})`);
            }
            const evaluation = newResult.evaluations[0];
            const command = new downward_evaluation_1.SubmitDownwardEvaluationCommand(evaluation.id, submittedBy);
            await this.commandBus.execute(command);
            return;
        }
        const evaluation = result.evaluations[0];
        const command = new downward_evaluation_1.SubmitDownwardEvaluationCommand(evaluation.id, submittedBy);
        await this.commandBus.execute(command);
    }
    async 하향평가를_제출한다(evaluationId, submittedBy) {
        const command = new downward_evaluation_1.SubmitDownwardEvaluationCommand(evaluationId, submittedBy || '시스템');
        await this.commandBus.execute(command);
    }
    async 피평가자의_모든_하향평가를_일괄_제출한다(evaluatorId, evaluateeId, periodId, evaluationType, submittedBy, forceSubmit = false) {
        const command = new downward_evaluation_1.BulkSubmitDownwardEvaluationsCommand(evaluatorId, evaluateeId, periodId, evaluationType, submittedBy, forceSubmit);
        return await this.commandBus.execute(command);
    }
    async 피평가자의_모든_하향평가를_일괄_초기화한다(evaluatorId, evaluateeId, periodId, evaluationType, resetBy) {
        const command = new downward_evaluation_1.BulkResetDownwardEvaluationsCommand(evaluatorId, evaluateeId, periodId, evaluationType, resetBy);
        return await this.commandBus.execute(command);
    }
    async 일차_하향평가를_초기화한다(evaluateeId, periodId, wbsId, evaluatorId, resetBy) {
        const query = new downward_evaluation_1.GetDownwardEvaluationListQuery(undefined, evaluateeId, periodId, wbsId, 'primary', undefined, 1, 1);
        const result = await this.queryBus.execute(query);
        if (!result.evaluations || result.evaluations.length === 0) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(`1차 하향평가 (evaluateeId: ${evaluateeId}, periodId: ${periodId}, wbsId: ${wbsId})`);
        }
        const evaluation = result.evaluations[0];
        const command = new downward_evaluation_1.ResetDownwardEvaluationCommand(evaluation.id, resetBy);
        await this.commandBus.execute(command);
    }
    async 이차_하향평가를_초기화한다(evaluateeId, periodId, wbsId, evaluatorId, resetBy) {
        this.logger.log('2차 하향평가 초기화 시작', {
            evaluateeId,
            periodId,
            wbsId,
            evaluatorId,
            resetBy,
        });
        try {
            const query = new downward_evaluation_1.GetDownwardEvaluationListQuery(evaluatorId, evaluateeId, periodId, wbsId, 'secondary', undefined, 1, 1);
            this.logger.debug('2차 하향평가 조회 쿼리 실행', { query });
            const result = await this.queryBus.execute(query);
            this.logger.debug('2차 하향평가 조회 결과', {
                totalCount: result.total,
                evaluationCount: result.evaluations?.length || 0,
            });
            if (result.evaluations && result.evaluations.length > 0) {
                const evaluation = result.evaluations[0];
                if (evaluation.isCompleted) {
                    this.logger.debug('2차 하향평가 초기화 실행', {
                        evaluationId: evaluation.id,
                        isCompleted: evaluation.isCompleted,
                    });
                    const command = new downward_evaluation_1.ResetDownwardEvaluationCommand(evaluation.id, resetBy);
                    await this.commandBus.execute(command);
                    this.logger.log('2차 하향평가 초기화 완료', {
                        evaluationId: evaluation.id,
                    });
                }
                else {
                    this.logger.debug('이미 미제출 상태인 평가 - 초기화 스킵', {
                        evaluationId: evaluation.id,
                    });
                }
            }
            else {
                this.logger.debug('2차 하향평가 레코드 없음 - 초기화 스킵');
            }
            this.logger.debug('승인 상태는 유지됨 (변경하지 않음)', {
                evaluateeId,
                periodId,
                evaluatorId,
            });
            this.logger.log('2차 하향평가 초기화 완료', {
                evaluateeId,
                periodId,
                wbsId,
                evaluatorId,
            });
        }
        catch (error) {
            this.logger.error('2차 하향평가 초기화 실패', error.stack, {
                evaluateeId,
                periodId,
                wbsId,
                evaluatorId,
                resetBy,
                errorName: error.name,
                errorMessage: error.message,
            });
            throw error;
        }
    }
    async 하향평가_목록을_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async 하향평가_상세정보를_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async 최종평가를_생성한다(employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, createdBy) {
        const command = new final_evaluation_1.CreateFinalEvaluationCommand(employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, createdBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 최종평가를_수정한다(id, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, updatedBy) {
        const command = new final_evaluation_1.UpdateFinalEvaluationCommand(id, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, updatedBy || '시스템');
        await this.commandBus.execute(command);
    }
    async 최종평가를_저장한다(employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, actionBy) {
        const command = new final_evaluation_1.UpsertFinalEvaluationCommand(employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, actionBy || '시스템');
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 최종평가를_삭제한다(id, deletedBy) {
        const command = new final_evaluation_1.DeleteFinalEvaluationCommand(id, deletedBy || '시스템');
        await this.commandBus.execute(command);
    }
    async 최종평가를_확정한다(id, confirmedBy) {
        const command = new final_evaluation_1.ConfirmFinalEvaluationCommand(id, confirmedBy);
        await this.commandBus.execute(command);
    }
    async 최종평가_확정을_취소한다(id, updatedBy) {
        const command = new final_evaluation_1.CancelConfirmationFinalEvaluationCommand(id, updatedBy);
        await this.commandBus.execute(command);
    }
    async 최종평가를_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async 최종평가_목록을_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async 직원_평가기간별_최종평가를_조회한다(query) {
        return await this.queryBus.execute(query);
    }
    async 평가기간별_모든_평가_수정_가능_상태를_변경한다(evaluationPeriodId, isSelfEvaluationEditable, isPrimaryEvaluationEditable, isSecondaryEvaluationEditable, updatedBy) {
        const command = new evaluation_editable_status_1.UpdatePeriodAllEvaluationEditableStatusCommand(evaluationPeriodId, isSelfEvaluationEditable, isPrimaryEvaluationEditable, isSecondaryEvaluationEditable, updatedBy);
        const result = await this.commandBus.execute(command);
        return result;
    }
    async WBS자기평가_내용을_초기화한다(data) {
        const command = new self_evaluation_1.ClearWbsSelfEvaluationCommand(data.evaluationId, data.clearedBy);
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 직원의_전체_WBS자기평가_내용을_초기화한다(data) {
        const command = new self_evaluation_1.ClearAllWbsSelfEvaluationsByEmployeePeriodCommand(data.employeeId, data.periodId, data.clearedBy);
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 프로젝트별_WBS자기평가_내용을_초기화한다(data) {
        const command = new self_evaluation_1.ClearWbsSelfEvaluationsByProjectCommand(data.employeeId, data.periodId, data.projectId, data.clearedBy);
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 동료평가에_질문그룹을_추가한다(peerEvaluationId, questionGroupId, startDisplayOrder, createdBy) {
        const command = new peer_evaluation_1.AddQuestionGroupToPeerEvaluationCommand(peerEvaluationId, questionGroupId, startDisplayOrder, createdBy);
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 동료평가에_질문을_추가한다(peerEvaluationId, questionId, displayOrder, questionGroupId, createdBy) {
        const command = new peer_evaluation_1.AddQuestionToPeerEvaluationCommand(peerEvaluationId, questionId, displayOrder, questionGroupId, createdBy);
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 동료평가에_질문을_매핑한다(peerEvaluationId, questionIds, createdBy) {
        const command = new peer_evaluation_1.AddMultipleQuestionsToPeerEvaluationCommand(peerEvaluationId, questionIds, 0, createdBy);
        const result = await this.commandBus.execute(command);
        return result;
    }
    async 동료평가에서_질문을_제거한다(mappingId, deletedBy) {
        const command = new peer_evaluation_1.RemoveQuestionFromPeerEvaluationCommand(mappingId, deletedBy);
        await this.commandBus.execute(command);
    }
    async 동료평가_질문_순서를_변경한다(mappingId, newDisplayOrder, updatedBy) {
        const command = new peer_evaluation_1.UpdatePeerEvaluationQuestionOrderCommand(mappingId, newDisplayOrder, updatedBy);
        await this.commandBus.execute(command);
    }
    async 동료평가의_질문목록을_조회한다(peerEvaluationId) {
        const query = new peer_evaluation_1.GetPeerEvaluationQuestionsQuery(peerEvaluationId);
        const result = await this.queryBus.execute(query);
        return result;
    }
    async 동료평가_답변을_저장한다(peerEvaluationId, answers, answeredBy) {
        const command = new peer_evaluation_1.UpsertPeerEvaluationAnswersCommand(peerEvaluationId, answers, answeredBy);
        const savedCount = await this.commandBus.execute(command);
        return savedCount;
    }
    async 산출물을_생성한다(data) {
        const command = new command_1.CreateDeliverableCommand(data.name, data.type, data.employeeId, data.wbsItemId, data.description, data.filePath, data.createdBy);
        const deliverable = await this.commandBus.execute(command);
        return deliverable;
    }
    async 산출물을_수정한다(data) {
        const command = new command_1.UpdateDeliverableCommand(data.id, data.updatedBy, data.name, data.type, data.description, data.filePath, data.employeeId, data.wbsItemId, data.isActive);
        const deliverable = await this.commandBus.execute(command);
        return deliverable;
    }
    async 산출물을_삭제한다(id, deletedBy) {
        const command = new command_1.DeleteDeliverableCommand(id, deletedBy);
        await this.commandBus.execute(command);
    }
    async 산출물을_벌크_생성한다(data) {
        const command = new command_1.BulkCreateDeliverablesCommand(data.deliverables, data.createdBy);
        const result = await this.commandBus.execute(command);
        return {
            successCount: result.successCount,
            failedCount: result.failedCount,
            createdIds: result.createdIds,
            failedItems: result.failedItems,
        };
    }
    async 산출물을_벌크_삭제한다(data) {
        const command = new command_1.BulkDeleteDeliverablesCommand(data.ids, data.deletedBy);
        const result = await this.commandBus.execute(command);
        return {
            successCount: result.successCount,
            failedCount: result.failedCount,
            failedIds: result.failedIds,
        };
    }
    async 직원별_산출물을_조회한다(employeeId, activeOnly = true) {
        const query = new query_1.GetEmployeeDeliverablesQuery(employeeId, activeOnly);
        const deliverables = await this.queryBus.execute(query);
        return deliverables;
    }
    async WBS항목별_산출물을_조회한다(wbsItemId, activeOnly = true) {
        const query = new query_1.GetWbsDeliverablesQuery(wbsItemId, activeOnly);
        const deliverables = await this.queryBus.execute(query);
        return deliverables;
    }
    async 산출물_상세를_조회한다(id) {
        const query = new query_1.GetDeliverableDetailQuery(id);
        const deliverable = await this.queryBus.execute(query);
        return deliverable;
    }
};
exports.PerformanceEvaluationService = PerformanceEvaluationService;
exports.PerformanceEvaluationService = PerformanceEvaluationService = PerformanceEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus,
        typeorm_2.Repository,
        secondary_evaluation_step_approval_service_1.SecondaryEvaluationStepApprovalService,
        step_approval_context_service_1.StepApprovalContextService])
], PerformanceEvaluationService);
//# sourceMappingURL=performance-evaluation.service.js.map