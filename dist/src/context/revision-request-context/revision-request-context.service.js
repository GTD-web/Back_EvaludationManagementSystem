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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevisionRequestContextService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_revision_request_1 = require("../../domain/sub/evaluation-revision-request");
const employee_evaluation_step_approval_1 = require("../../domain/sub/employee-evaluation-step-approval");
const secondary_evaluation_step_approval_1 = require("../../domain/sub/secondary-evaluation-step-approval");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const evaluation_period_entity_1 = require("../../domain/core/evaluation-period/evaluation-period.entity");
let RevisionRequestContextService = class RevisionRequestContextService {
    revisionRequestService;
    stepApprovalService;
    secondaryStepApprovalService;
    employeeRepository;
    evaluationPeriodRepository;
    mappingRepository;
    logger = { log: () => { }, warn: () => { }, error: () => { }, debug: () => { } };
    constructor(revisionRequestService, stepApprovalService, secondaryStepApprovalService, employeeRepository, evaluationPeriodRepository, mappingRepository) {
        this.revisionRequestService = revisionRequestService;
        this.stepApprovalService = stepApprovalService;
        this.secondaryStepApprovalService = secondaryStepApprovalService;
        this.employeeRepository = employeeRepository;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.mappingRepository = mappingRepository;
    }
    async 전체_재작성요청목록을_조회한다(filter) {
        this.logger.log('전체 재작성 요청 목록 조회');
        const requests = await this.revisionRequestService.필터로_조회한다({
            evaluationPeriodId: filter?.evaluationPeriodId,
            employeeId: filter?.employeeId,
            step: filter?.step,
            requestedBy: filter?.requestedBy,
        });
        const result = [];
        for (const request of requests) {
            const employee = await this.employeeRepository.findOne({
                where: { id: request.employeeId, deletedAt: null },
            });
            if (!employee) {
                this.logger.warn(`피평가자를 찾을 수 없습니다. - 직원 ID: ${request.employeeId}`);
                continue;
            }
            const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
                where: { id: request.evaluationPeriodId, deletedAt: null },
            });
            if (!evaluationPeriod) {
                this.logger.warn(`평가기간을 찾을 수 없습니다. - 평가기간 ID: ${request.evaluationPeriodId}`);
                continue;
            }
            for (const recipient of request.recipients || []) {
                if (recipient.deletedAt) {
                    continue;
                }
                if (filter?.isRead !== undefined &&
                    recipient.isRead !== filter.isRead) {
                    continue;
                }
                if (filter?.isCompleted !== undefined &&
                    recipient.isCompleted !== filter.isCompleted) {
                    continue;
                }
                const approvalStatus = await this.단계_승인_상태를_조회한다(request.evaluationPeriodId, request.employeeId, request.step, recipient.recipientId);
                result.push({
                    request: request.DTO로_변환한다(),
                    recipientInfo: recipient.DTO로_변환한다(),
                    employee: {
                        id: employee.id,
                        name: employee.name,
                        employeeNumber: employee.employeeNumber,
                        email: employee.email,
                        departmentName: employee.departmentName,
                        rankName: employee.rankName,
                    },
                    evaluationPeriod: {
                        id: evaluationPeriod.id,
                        name: evaluationPeriod.name,
                    },
                    approvalStatus,
                });
            }
        }
        this.logger.log(`전체 재작성 요청 목록 조회 완료 - 요청 수: ${result.length}`);
        return result;
    }
    async 내_재작성요청목록을_조회한다(recipientId, filter) {
        this.logger.log(`내 재작성 요청 목록 조회 - 수신자 ID: ${recipientId}`);
        const recipients = await this.revisionRequestService.수신자의_요청목록을_조회한다(recipientId, {
            isRead: filter?.isRead,
            isCompleted: filter?.isCompleted,
            evaluationPeriodId: filter?.evaluationPeriodId,
            employeeId: filter?.employeeId,
            step: filter?.step,
        });
        const result = [];
        for (const recipient of recipients) {
            const request = recipient.revisionRequest;
            if (!request) {
                this.logger.warn(`재작성 요청을 찾을 수 없습니다. - 수신자 ID: ${recipient.recipientId}, 요청 ID: ${recipient.revisionRequestId}`);
                continue;
            }
            const employee = await this.employeeRepository.findOne({
                where: { id: request.employeeId, deletedAt: null },
            });
            if (!employee) {
                this.logger.warn(`피평가자를 찾을 수 없습니다. - 직원 ID: ${request.employeeId}`);
                continue;
            }
            const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
                where: { id: request.evaluationPeriodId, deletedAt: null },
            });
            if (!evaluationPeriod) {
                this.logger.warn(`평가기간을 찾을 수 없습니다. - 평가기간 ID: ${request.evaluationPeriodId}`);
                continue;
            }
            const approvalStatus = await this.단계_승인_상태를_조회한다(request.evaluationPeriodId, request.employeeId, request.step, recipient.recipientId);
            result.push({
                request: request.DTO로_변환한다(),
                recipientInfo: recipient.DTO로_변환한다(),
                employee: {
                    id: employee.id,
                    name: employee.name,
                    employeeNumber: employee.employeeNumber,
                    email: employee.email,
                    departmentName: employee.departmentName,
                    rankName: employee.rankName,
                },
                evaluationPeriod: {
                    id: evaluationPeriod.id,
                    name: evaluationPeriod.name,
                },
                approvalStatus,
            });
        }
        this.logger.log(`내 재작성 요청 목록 조회 완료 - 수신자 ID: ${recipientId}, 요청 수: ${result.length}`);
        return result;
    }
    async 읽지않은_재작성요청수를_조회한다(recipientId) {
        this.logger.log(`읽지 않은 재작성 요청 수 조회 - 수신자 ID: ${recipientId}`);
        const count = await this.revisionRequestService.읽지않은_요청수를_조회한다(recipientId);
        this.logger.log(`읽지 않은 재작성 요청 수 조회 완료 - 수신자 ID: ${recipientId}, 수: ${count}`);
        return count;
    }
    async 재작성요청을_읽음처리한다(requestId, recipientId) {
        this.logger.log(`재작성 요청 읽음 처리 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`);
        const recipient = await this.revisionRequestService.수신자를_조회한다(requestId, recipientId);
        if (!recipient) {
            throw new common_1.NotFoundException(`재작성 요청 수신자를 찾을 수 없습니다. (요청 ID: ${requestId}, 수신자 ID: ${recipientId})`);
        }
        if (!recipient.특정수신자의_요청인가(recipientId)) {
            throw new common_1.ForbiddenException(`해당 재작성 요청에 접근할 권한이 없습니다. (요청 ID: ${requestId})`);
        }
        recipient.읽음처리한다();
        await this.revisionRequestService.수신자를_저장한다(recipient);
        this.logger.log(`재작성 요청 읽음 처리 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`);
    }
    async 재작성완료_응답을_제출한다_내부(requestId, recipientId, responseComment) {
        this.logger.log(`재작성 완료 응답 제출 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`);
        const request = await this.revisionRequestService.ID로_조회한다(requestId);
        if (!request) {
            throw new common_1.NotFoundException(`재작성 요청을 찾을 수 없습니다. (요청 ID: ${requestId})`);
        }
        const recipient = await this.revisionRequestService.수신자를_조회한다(requestId, recipientId);
        if (!recipient) {
            throw new common_1.NotFoundException(`재작성 요청 수신자를 찾을 수 없습니다. (요청 ID: ${requestId}, 수신자 ID: ${recipientId})`);
        }
        if (!recipient.특정수신자의_요청인가(recipientId)) {
            throw new common_1.ForbiddenException(`해당 재작성 요청에 접근할 권한이 없습니다. (요청 ID: ${requestId})`);
        }
        if (!recipient.isRead) {
            recipient.읽음처리한다();
        }
        recipient.재작성완료_응답한다(responseComment);
        await this.revisionRequestService.수신자를_저장한다(recipient);
        if (request.step === 'secondary' &&
            recipient.recipientType === evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR) {
            await this.이차평가자_개별_승인상태를_재작성완료로_변경한다(request.evaluationPeriodId, request.employeeId, recipientId, request.id);
        }
        if (request.step === 'criteria' || request.step === 'self') {
            const currentRecipientType = recipient.recipientType;
            const otherRecipientType = currentRecipientType === evaluation_revision_request_1.RecipientType.EVALUATEE
                ? evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR
                : evaluation_revision_request_1.RecipientType.EVALUATEE;
            const otherRequests = await this.revisionRequestService.필터로_조회한다({
                evaluationPeriodId: request.evaluationPeriodId,
                employeeId: request.employeeId,
                step: request.step,
            });
            for (const otherRequest of otherRequests) {
                if (otherRequest.id === requestId) {
                    continue;
                }
                if (!otherRequest.recipients || otherRequest.recipients.length === 0) {
                    continue;
                }
                const otherRecipient = otherRequest.recipients.find((r) => !r.deletedAt &&
                    r.recipientType === otherRecipientType &&
                    !r.isCompleted);
                if (otherRecipient) {
                    this.logger.log(`다른 수신자에게 보낸 재작성 요청도 함께 완료 처리 - 요청 ID: ${otherRequest.id}, 수신자 ID: ${otherRecipient.recipientId}`);
                    if (!otherRecipient.isRead) {
                        otherRecipient.읽음처리한다();
                    }
                    otherRecipient.재작성완료_응답한다(`연계된 수신자의 재작성 완료로 인한 자동 완료 처리`);
                    await this.revisionRequestService.수신자를_저장한다(otherRecipient);
                }
            }
        }
        let allCompleted;
        if (request.step === 'secondary') {
            allCompleted = await this.모든_2차평가자의_재작성요청이_완료했는가(request.evaluationPeriodId, request.employeeId);
        }
        else {
            allCompleted = await this.모든_수신자가_완료했는가(requestId);
        }
        if (allCompleted) {
            await this.단계_승인_상태를_재작성완료로_변경한다(request.evaluationPeriodId, request.employeeId, request.step, recipientId);
        }
        this.logger.log(`재작성 완료 응답 제출 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`);
        return request;
    }
    async 재작성완료_응답을_제출한다(requestId, recipientId, responseComment) {
        await this.재작성완료_응답을_제출한다_내부(requestId, recipientId, responseComment);
    }
    async 평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부(evaluationPeriodId, employeeId, evaluatorId, step, responseComment) {
        this.logger.log(`재작성 완료 응답 제출 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}, 단계: ${step}`);
        const requests = await this.revisionRequestService.필터로_조회한다({
            evaluationPeriodId,
            employeeId,
            step,
        });
        if (requests.length === 0) {
            throw new common_1.NotFoundException(`재작성 요청을 찾을 수 없습니다. (평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step})`);
        }
        let targetRequest = null;
        let targetRecipient = null;
        for (const request of requests) {
            if (!request.recipients || request.recipients.length === 0) {
                continue;
            }
            const recipient = request.recipients.find((r) => !r.deletedAt &&
                r.recipientId === evaluatorId &&
                (step === 'secondary'
                    ? r.recipientType === evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR
                    : step === 'primary'
                        ? r.recipientType === evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR
                        : true));
            if (recipient) {
                targetRequest = request;
                targetRecipient = recipient;
                break;
            }
        }
        if (!targetRequest || !targetRecipient) {
            throw new common_1.NotFoundException(`재작성 요청 수신자를 찾을 수 없습니다. (평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}, 단계: ${step})`);
        }
        if (!targetRecipient.isRead) {
            targetRecipient.읽음처리한다();
        }
        targetRecipient.재작성완료_응답한다(responseComment);
        await this.revisionRequestService.수신자를_저장한다(targetRecipient);
        if (targetRequest.step === 'secondary' &&
            targetRecipient.recipientType === evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR) {
            await this.이차평가자_개별_승인상태를_재작성완료로_변경한다(targetRequest.evaluationPeriodId, targetRequest.employeeId, evaluatorId, targetRequest.id);
        }
        if (targetRequest.step === 'criteria' || targetRequest.step === 'self') {
            const currentRecipientType = targetRecipient.recipientType;
            const otherRecipientType = currentRecipientType === evaluation_revision_request_1.RecipientType.EVALUATEE
                ? evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR
                : evaluation_revision_request_1.RecipientType.EVALUATEE;
            for (const otherRequest of requests) {
                if (otherRequest.id === targetRequest.id) {
                    continue;
                }
                if (!otherRequest.recipients || otherRequest.recipients.length === 0) {
                    continue;
                }
                const otherRecipient = otherRequest.recipients.find((r) => !r.deletedAt &&
                    r.recipientType === otherRecipientType &&
                    !r.isCompleted);
                if (otherRecipient) {
                    this.logger.log(`다른 수신자에게 보낸 재작성 요청도 함께 완료 처리 - 요청 ID: ${otherRequest.id}, 수신자 ID: ${otherRecipient.recipientId}`);
                    if (!otherRecipient.isRead) {
                        otherRecipient.읽음처리한다();
                    }
                    otherRecipient.재작성완료_응답한다(`연계된 수신자의 재작성 완료로 인한 자동 완료 처리`);
                    await this.revisionRequestService.수신자를_저장한다(otherRecipient);
                }
            }
        }
        let allCompleted;
        if (targetRequest.step === 'secondary') {
            allCompleted = await this.모든_2차평가자의_재작성요청이_완료했는가(targetRequest.evaluationPeriodId, targetRequest.employeeId);
        }
        else {
            allCompleted = await this.모든_수신자가_완료했는가(targetRequest.id);
        }
        if (allCompleted) {
            await this.단계_승인_상태를_재작성완료로_변경한다(targetRequest.evaluationPeriodId, targetRequest.employeeId, targetRequest.step, evaluatorId);
        }
        this.logger.log(`재작성 완료 응답 제출 완료 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}`);
        return targetRequest;
    }
    async 평가기간_직원_평가자로_재작성완료_응답을_제출한다(evaluationPeriodId, employeeId, evaluatorId, step, responseComment) {
        await this.평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부(evaluationPeriodId, employeeId, evaluatorId, step, responseComment);
    }
    async 제출자에게_요청된_재작성요청을_완료처리한다(evaluationPeriodId, employeeId, step, recipientId, recipientType, responseComment) {
        this.logger.log(`제출자에게 요청된 재작성 요청 자동 완료 처리 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step}, 제출자: ${recipientId}, 타입: ${recipientType}`);
        const revisionRequests = await this.revisionRequestService.필터로_조회한다({
            evaluationPeriodId,
            employeeId,
            step,
        });
        if (revisionRequests.length === 0) {
            this.logger.log(`제출자에게 요청된 재작성 요청 없음 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step}, 제출자: ${recipientId}`);
            return;
        }
        this.logger.log(`제출자에게 요청된 재작성 요청 발견 - 요청 수: ${revisionRequests.length}`);
        for (const request of revisionRequests) {
            if (!request.recipients || request.recipients.length === 0) {
                continue;
            }
            const recipient = request.recipients.find((r) => !r.deletedAt &&
                r.recipientId === recipientId &&
                r.recipientType === recipientType &&
                !r.isCompleted);
            if (recipient) {
                try {
                    await this.재작성완료_응답을_제출한다(request.id, recipientId, responseComment);
                    this.logger.log(`제출자에게 요청된 재작성 요청 완료 처리 성공 - 요청 ID: ${request.id}, 수신자 ID: ${recipientId}`);
                }
                catch (error) {
                    this.logger.error(`제출자에게 요청된 재작성 요청 완료 처리 실패 - 요청 ID: ${request.id}, 수신자 ID: ${recipientId}`, error);
                }
            }
        }
        if ((step === 'criteria' || step === 'self') &&
            recipientType === evaluation_revision_request_1.RecipientType.EVALUATEE) {
            for (const request of revisionRequests) {
                if (!request.recipients || request.recipients.length === 0) {
                    continue;
                }
                const primaryEvaluatorRecipient = request.recipients.find((r) => !r.deletedAt &&
                    r.recipientType === evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR &&
                    !r.isCompleted);
                if (primaryEvaluatorRecipient) {
                    try {
                        await this.재작성완료_응답을_제출한다(request.id, primaryEvaluatorRecipient.recipientId, responseComment);
                        this.logger.log(`1차평가자에게 요청된 재작성 요청 완료 처리 성공 - 요청 ID: ${request.id}, 수신자 ID: ${primaryEvaluatorRecipient.recipientId}`);
                    }
                    catch (error) {
                        this.logger.error(`1차평가자에게 요청된 재작성 요청 완료 처리 실패 - 요청 ID: ${request.id}, 수신자 ID: ${primaryEvaluatorRecipient.recipientId}`, error);
                    }
                }
            }
        }
        this.logger.log(`제출자에게 요청된 재작성 요청 자동 완료 처리 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step}, 제출자: ${recipientId}`);
    }
    async 모든_수신자가_완료했는가_내부(requestId) {
        return await this.모든_수신자가_완료했는가(requestId);
    }
    async 모든_수신자가_완료했는가(requestId) {
        const request = await this.revisionRequestService.ID로_조회한다(requestId);
        if (!request || !request.recipients) {
            return false;
        }
        const activeRecipients = request.recipients.filter((r) => !r.deletedAt);
        if (activeRecipients.length === 0) {
            return false;
        }
        return activeRecipients.every((r) => r.isCompleted);
    }
    async 모든_2차평가자의_재작성요청이_완료했는가_내부(evaluationPeriodId, employeeId) {
        return await this.모든_2차평가자의_재작성요청이_완료했는가(evaluationPeriodId, employeeId);
    }
    async 모든_2차평가자의_재작성요청이_완료했는가(evaluationPeriodId, employeeId) {
        const requests = await this.revisionRequestService.필터로_조회한다({
            evaluationPeriodId,
            employeeId,
            step: 'secondary',
        });
        if (requests.length === 0) {
            return false;
        }
        for (const request of requests) {
            if (!request.recipients || request.recipients.length === 0) {
                return false;
            }
            const activeRecipients = request.recipients.filter((r) => !r.deletedAt && r.recipientType === evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR);
            if (activeRecipients.length === 0) {
                return false;
            }
            const allRecipientsCompleted = activeRecipients.every((r) => r.isCompleted);
            if (!allRecipientsCompleted) {
                return false;
            }
        }
        return true;
    }
    async 단계_승인_상태를_조회한다(evaluationPeriodId, employeeId, step, recipientId) {
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            return employee_evaluation_step_approval_1.StepApprovalStatus.PENDING;
        }
        const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
        if (!stepApproval) {
            return employee_evaluation_step_approval_1.StepApprovalStatus.PENDING;
        }
        if (step === 'secondary') {
            const revisionRequests = await this.revisionRequestService.필터로_조회한다({
                evaluationPeriodId,
                employeeId,
                step: 'secondary',
            });
            for (const revisionRequest of revisionRequests) {
                if (!revisionRequest.recipients ||
                    revisionRequest.recipients.length === 0) {
                    continue;
                }
                const recipient = revisionRequest.recipients.find((r) => !r.deletedAt &&
                    r.recipientId === recipientId &&
                    r.recipientType === evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR);
                if (recipient) {
                    if (recipient.isCompleted) {
                        return employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_COMPLETED;
                    }
                    else {
                        return employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_REQUESTED;
                    }
                }
            }
            return stepApproval.secondaryEvaluationStatus;
        }
        switch (step) {
            case 'criteria':
                return stepApproval.criteriaSettingStatus;
            case 'self':
                return stepApproval.selfEvaluationStatus;
            case 'primary':
                return stepApproval.primaryEvaluationStatus;
            default:
                return employee_evaluation_step_approval_1.StepApprovalStatus.PENDING;
        }
    }
    async 단계_승인_상태를_재작성완료로_변경한다(evaluationPeriodId, employeeId, step, updatedBy) {
        this.logger.log(`단계 승인 상태를 재작성 완료로 변경 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 단계: ${step}`);
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            this.logger.warn(`평가기간-직원 맵핑을 찾을 수 없습니다. - 평가기간 ID: ${evaluationPeriodId}, 직원 ID: ${employeeId}`);
            return;
        }
        const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
        if (!stepApproval) {
            this.logger.warn(`단계 승인 정보를 찾을 수 없습니다. - 맵핑 ID: ${mapping.id}`);
            return;
        }
        const stepType = step;
        this.stepApprovalService.단계_상태를_변경한다(stepApproval, stepType, employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_COMPLETED, updatedBy);
        await this.stepApprovalService.저장한다(stepApproval);
        this.logger.log(`단계 승인 상태를 재작성 완료로 변경 완료 - 직원: ${employeeId}, 단계: ${step}`);
    }
    async 이차평가자_개별_승인상태를_재작성완료로_변경한다(evaluationPeriodId, employeeId, evaluatorId, revisionRequestId) {
        this.logger.log(`2차 평가자 개별 승인 상태를 재작성 완료로 변경 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}`);
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            this.logger.warn(`평가기간-직원 맵핑을 찾을 수 없습니다. - 평가기간 ID: ${evaluationPeriodId}, 직원 ID: ${employeeId}`);
            return;
        }
        let secondaryApproval = await this.secondaryStepApprovalService.맵핑ID와_평가자ID로_조회한다(mapping.id, evaluatorId);
        if (!secondaryApproval) {
            this.logger.log(`2차 평가자별 단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}, 평가자 ID: ${evaluatorId}`);
            secondaryApproval = await this.secondaryStepApprovalService.생성한다({
                evaluationPeriodEmployeeMappingId: mapping.id,
                evaluatorId: evaluatorId,
                status: employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_COMPLETED,
                createdBy: evaluatorId,
            });
        }
        this.secondaryStepApprovalService.상태를_변경한다(secondaryApproval, employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_COMPLETED, evaluatorId, revisionRequestId);
        await this.secondaryStepApprovalService.저장한다(secondaryApproval);
        this.logger.log(`2차 평가자 개별 승인 상태를 재작성 완료로 변경 완료 - 직원: ${employeeId}, 평가자: ${evaluatorId}`);
    }
};
exports.RevisionRequestContextService = RevisionRequestContextService;
exports.RevisionRequestContextService = RevisionRequestContextService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(5, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [evaluation_revision_request_1.EvaluationRevisionRequestService,
        employee_evaluation_step_approval_1.EmployeeEvaluationStepApprovalService,
        secondary_evaluation_step_approval_1.SecondaryEvaluationStepApprovalService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RevisionRequestContextService);
//# sourceMappingURL=revision-request-context.service.js.map