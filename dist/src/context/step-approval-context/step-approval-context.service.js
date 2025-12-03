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
var StepApprovalContextService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepApprovalContextService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_evaluation_step_approval_1 = require("../../domain/sub/employee-evaluation-step-approval");
const secondary_evaluation_step_approval_1 = require("../../domain/sub/secondary-evaluation-step-approval");
const evaluation_revision_request_1 = require("../../domain/sub/evaluation-revision-request");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
let StepApprovalContextService = StepApprovalContextService_1 = class StepApprovalContextService {
    stepApprovalService;
    secondaryStepApprovalService;
    revisionRequestService;
    mappingRepository;
    evaluationLineMappingRepository;
    dataSource;
    logger = new common_1.Logger(StepApprovalContextService_1.name);
    constructor(stepApprovalService, secondaryStepApprovalService, revisionRequestService, mappingRepository, evaluationLineMappingRepository, dataSource) {
        this.stepApprovalService = stepApprovalService;
        this.secondaryStepApprovalService = secondaryStepApprovalService;
        this.revisionRequestService = revisionRequestService;
        this.mappingRepository = mappingRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.dataSource = dataSource;
    }
    async 단계별_확인상태를_변경한다(request) {
        this.logger.log(`단계별 확인 상태 변경 시작 - 평가기간: ${request.evaluationPeriodId}, 직원: ${request.employeeId}, 단계: ${request.step}, 상태: ${request.status}`);
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId: request.evaluationPeriodId,
                employeeId: request.employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            throw new common_1.NotFoundException(`평가기간-직원 맵핑을 찾을 수 없습니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId})`);
        }
        let stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
        if (!stepApproval) {
            this.logger.log(`단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}`);
            stepApproval = await this.stepApprovalService.생성한다({
                evaluationPeriodEmployeeMappingId: mapping.id,
                createdBy: request.updatedBy,
            });
        }
        this.stepApprovalService.단계_상태를_변경한다(stepApproval, request.step, request.status, request.updatedBy);
        await this.stepApprovalService.저장한다(stepApproval);
        if (request.status === employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_REQUESTED) {
            if (!request.revisionComment || request.revisionComment.trim() === '') {
                throw new common_1.NotFoundException('재작성 요청 코멘트는 필수입니다.');
            }
            await this.재작성요청을_생성한다(request.evaluationPeriodId, request.employeeId, request.step, request.revisionComment, request.updatedBy);
        }
        this.logger.log(`단계별 확인 상태 변경 완료 - 직원: ${request.employeeId}, 단계: ${request.step}`);
    }
    async 재작성요청을_생성한다(evaluationPeriodId, employeeId, step, comment, requestedBy) {
        this.logger.log(`재작성 요청 생성 시작 - 직원: ${employeeId}, 단계: ${step}`);
        const recipients = await this.재작성요청_수신자를_조회한다(evaluationPeriodId, employeeId, step);
        if (recipients.length === 0) {
            throw new common_1.NotFoundException(`재작성 요청 수신자를 찾을 수 없습니다. 평가라인 설정을 확인해주세요. (직원 ID: ${employeeId}, 단계: ${step})`);
        }
        for (const recipient of recipients) {
            await this.dataSource.transaction(async (manager) => {
                const existingRequests = await manager
                    .createQueryBuilder(evaluation_revision_request_1.EvaluationRevisionRequest, 'request')
                    .where('request.evaluationPeriodId = :evaluationPeriodId', {
                    evaluationPeriodId,
                })
                    .andWhere('request.employeeId = :employeeId', { employeeId })
                    .andWhere('request.step = :step', { step })
                    .andWhere('request.deletedAt IS NULL')
                    .setLock('pessimistic_write')
                    .getMany();
                let existingRequestForRecipient = null;
                for (const request of existingRequests) {
                    const requestRecipients = await manager
                        .createQueryBuilder(evaluation_revision_request_1.EvaluationRevisionRequestRecipient, 'recipient')
                        .where('recipient.revisionRequestId = :requestId', {
                        requestId: request.id,
                    })
                        .andWhere('recipient.deletedAt IS NULL')
                        .getMany();
                    const matchingRecipient = requestRecipients.find((r) => r.recipientId === recipient.recipientId &&
                        r.recipientType === recipient.recipientType &&
                        !r.isCompleted);
                    if (matchingRecipient) {
                        existingRequestForRecipient = request;
                        break;
                    }
                }
                if (existingRequestForRecipient) {
                    this.logger.log(`기존 미완료 재작성 요청 삭제 (수신자별) - 요청 ID: ${existingRequestForRecipient.id}, 수신자: ${recipient.recipientId}`);
                    existingRequestForRecipient.deletedAt = new Date();
                    existingRequestForRecipient.메타데이터를_업데이트한다(requestedBy);
                    await manager.save(evaluation_revision_request_1.EvaluationRevisionRequest, existingRequestForRecipient);
                }
                const newRequest = new evaluation_revision_request_1.EvaluationRevisionRequest({
                    evaluationPeriodId,
                    employeeId,
                    step,
                    comment,
                    requestedBy,
                    recipients: [recipient],
                    createdBy: requestedBy,
                });
                await manager.save(evaluation_revision_request_1.EvaluationRevisionRequest, newRequest);
            });
        }
        this.logger.log(`재작성 요청 생성 완료 - 직원: ${employeeId}, 단계: ${step}`);
    }
    async 재작성요청_수신자를_조회한다(evaluationPeriodId, employeeId, step) {
        const recipients = [];
        switch (step) {
            case 'criteria':
            case 'self':
                recipients.push({
                    recipientId: employeeId,
                    recipientType: evaluation_revision_request_1.RecipientType.EVALUATEE,
                });
                const primaryEvaluator = await this.일차평가자를_조회한다(evaluationPeriodId, employeeId);
                if (primaryEvaluator && primaryEvaluator !== employeeId) {
                    recipients.push({
                        recipientId: primaryEvaluator,
                        recipientType: evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR,
                    });
                }
                break;
            case 'primary':
                const primaryOnly = await this.일차평가자를_조회한다(evaluationPeriodId, employeeId);
                if (primaryOnly) {
                    recipients.push({
                        recipientId: primaryOnly,
                        recipientType: evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR,
                    });
                }
                break;
            case 'secondary':
                const secondaryEvaluators = await this.이차평가자들을_조회한다(evaluationPeriodId, employeeId);
                secondaryEvaluators.forEach((evaluatorId) => {
                    recipients.push({
                        recipientId: evaluatorId,
                        recipientType: evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR,
                    });
                });
                break;
        }
        return recipients;
    }
    async 일차평가자를_조회한다(evaluationPeriodId, employeeId) {
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            return null;
        }
        const lineMapping = await this.evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
            .leftJoin('employee', 'evaluator', '(evaluator.id = "mapping"."evaluatorId" OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: 'primary',
        })
            .andWhere('line.deletedAt IS NULL')
            .select('evaluator.id', 'evaluatorId')
            .getRawOne();
        return lineMapping?.evaluatorId || null;
    }
    async 이차평가자를_조회한다(evaluationPeriodId, employeeId, wbsItemId) {
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            return null;
        }
        const lineMapping = await this.evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
            .leftJoin('employee', 'evaluator', '(evaluator.id = "mapping"."evaluatorId" OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.wbsItemId = :wbsItemId', { wbsItemId })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: 'secondary',
        })
            .andWhere('line.deletedAt IS NULL')
            .select('evaluator.id', 'evaluatorId')
            .getRawOne();
        return lineMapping?.evaluatorId || null;
    }
    async 이차평가자들을_조회한다(evaluationPeriodId, employeeId) {
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            return [];
        }
        const lineMappings = await this.evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
            .leftJoin('employee', 'evaluator', '(evaluator.id = "mapping"."evaluatorId" OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: 'secondary',
        })
            .andWhere('line.deletedAt IS NULL')
            .select('evaluator.id', 'evaluatorId')
            .getRawMany();
        return lineMappings
            .map((mapping) => mapping.evaluatorId)
            .filter((id) => id !== null && id !== undefined);
    }
    async 평가기준설정_확인상태를_변경한다(request) {
        await this.단계별_확인상태를_변경한다({
            evaluationPeriodId: request.evaluationPeriodId,
            employeeId: request.employeeId,
            step: 'criteria',
            status: request.status,
            revisionComment: request.revisionComment,
            updatedBy: request.updatedBy,
        });
    }
    async 자기평가_확인상태를_변경한다(request) {
        await this.단계별_확인상태를_변경한다({
            evaluationPeriodId: request.evaluationPeriodId,
            employeeId: request.employeeId,
            step: 'self',
            status: request.status,
            revisionComment: request.revisionComment,
            updatedBy: request.updatedBy,
        });
    }
    async 일차하향평가_확인상태를_변경한다(request) {
        await this.단계별_확인상태를_변경한다({
            evaluationPeriodId: request.evaluationPeriodId,
            employeeId: request.employeeId,
            step: 'primary',
            status: request.status,
            revisionComment: request.revisionComment,
            updatedBy: request.updatedBy,
        });
    }
    async 이차하향평가_확인상태를_변경한다(request) {
        this.logger.log(`2차 하향평가 확인 상태 변경 시작 - 평가기간: ${request.evaluationPeriodId}, 직원: ${request.employeeId}, 평가자: ${request.evaluatorId}, 상태: ${request.status}`);
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId: request.evaluationPeriodId,
                employeeId: request.employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            throw new common_1.NotFoundException(`평가기간-직원 맵핑을 찾을 수 없습니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId})`);
        }
        const isSecondaryEvaluator = await this.평가자가_2차평가자인지_확인한다(request.evaluationPeriodId, request.employeeId, request.evaluatorId);
        if (!isSecondaryEvaluator) {
            throw new common_1.NotFoundException(`해당 평가자는 2차 평가자가 아닙니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId}, 평가자 ID: ${request.evaluatorId})`);
        }
        let secondaryApproval = await this.secondaryStepApprovalService.맵핑ID와_평가자ID로_조회한다(mapping.id, request.evaluatorId);
        if (!secondaryApproval) {
            this.logger.log(`2차 평가자별 단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}, 평가자 ID: ${request.evaluatorId}`);
            secondaryApproval = await this.secondaryStepApprovalService.생성한다({
                evaluationPeriodEmployeeMappingId: mapping.id,
                evaluatorId: request.evaluatorId,
                status: request.status,
                createdBy: request.updatedBy,
            });
        }
        let revisionRequestId = null;
        if (request.status === employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_REQUESTED) {
            if (!request.revisionComment || request.revisionComment.trim() === '') {
                throw new common_1.NotFoundException('재작성 요청 코멘트는 필수입니다.');
            }
            const revisionRequest = await this.재작성요청을_평가자별로_생성한다(request.evaluationPeriodId, request.employeeId, request.evaluatorId, request.revisionComment, request.updatedBy);
            revisionRequestId = revisionRequest.id;
        }
        this.secondaryStepApprovalService.상태를_변경한다(secondaryApproval, request.status, request.updatedBy, revisionRequestId);
        const savedApproval = await this.secondaryStepApprovalService.저장한다(secondaryApproval);
        this.logger.log(`2차 하향평가 확인 상태 변경 완료 - 직원: ${request.employeeId}, 평가자: ${request.evaluatorId}`);
        return savedApproval;
    }
    async 평가자가_2차평가자인지_확인한다(evaluationPeriodId, employeeId, evaluatorId) {
        const lineMapping = await this.evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
            .leftJoin('employee', 'evaluator', '(evaluator.id = "mapping"."evaluatorId" OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('(evaluator.id::text = :evaluatorId OR evaluator.externalId = :evaluatorId)', { evaluatorId })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: 'secondary',
        })
            .andWhere('line.deletedAt IS NULL')
            .getOne();
        return !!lineMapping;
    }
    async 재작성요청을_평가자별로_생성한다(evaluationPeriodId, employeeId, evaluatorId, comment, requestedBy) {
        this.logger.log(`재작성 요청 생성 시작 (평가자별) - 직원: ${employeeId}, 평가자: ${evaluatorId}`);
        const newRequest = await this.dataSource.transaction(async (manager) => {
            const existingRequests = await manager
                .createQueryBuilder(evaluation_revision_request_1.EvaluationRevisionRequest, 'request')
                .where('request.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('request.employeeId = :employeeId', { employeeId })
                .andWhere('request.step = :step', { step: 'secondary' })
                .andWhere('request.deletedAt IS NULL')
                .setLock('pessimistic_write')
                .getMany();
            for (const request of existingRequests) {
                request.recipients = await manager
                    .createQueryBuilder(evaluation_revision_request_1.EvaluationRevisionRequestRecipient, 'recipient')
                    .where('recipient.revisionRequestId = :requestId', {
                    requestId: request.id,
                })
                    .andWhere('recipient.deletedAt IS NULL')
                    .getMany();
            }
            for (const existingRequest of existingRequests) {
                if (!existingRequest.recipients ||
                    existingRequest.recipients.length === 0) {
                    continue;
                }
                const recipient = existingRequest.recipients.find((r) => !r.deletedAt &&
                    r.recipientId === evaluatorId &&
                    r.recipientType === evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR);
                if (recipient && !recipient.isCompleted) {
                    this.logger.log(`기존 미완료 재작성 요청 삭제 (평가자별) - 요청 ID: ${existingRequest.id}, 평가자: ${evaluatorId}`);
                    existingRequest.deletedAt = new Date();
                    existingRequest.메타데이터를_업데이트한다(requestedBy);
                    await manager.save(evaluation_revision_request_1.EvaluationRevisionRequest, existingRequest);
                    break;
                }
            }
            const recipients = [
                {
                    recipientId: evaluatorId,
                    recipientType: evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR,
                },
            ];
            const request = new evaluation_revision_request_1.EvaluationRevisionRequest({
                evaluationPeriodId,
                employeeId,
                step: 'secondary',
                comment,
                requestedBy,
                recipients,
                createdBy: requestedBy,
            });
            return await manager.save(evaluation_revision_request_1.EvaluationRevisionRequest, request);
        });
        this.logger.log(`재작성 요청 생성 완료 (평가자별) - 직원: ${employeeId}, 평가자: ${evaluatorId}`);
        return newRequest;
    }
};
exports.StepApprovalContextService = StepApprovalContextService;
exports.StepApprovalContextService = StepApprovalContextService = StepApprovalContextService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(5, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [employee_evaluation_step_approval_1.EmployeeEvaluationStepApprovalService,
        secondary_evaluation_step_approval_1.SecondaryEvaluationStepApprovalService,
        evaluation_revision_request_1.EvaluationRevisionRequestService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], StepApprovalContextService);
//# sourceMappingURL=step-approval-context.service.js.map