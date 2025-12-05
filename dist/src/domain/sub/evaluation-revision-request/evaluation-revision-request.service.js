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
exports.EvaluationRevisionRequestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_revision_request_entity_1 = require("./evaluation-revision-request.entity");
const evaluation_revision_request_recipient_entity_1 = require("./evaluation-revision-request-recipient.entity");
const evaluation_revision_request_exceptions_1 = require("./evaluation-revision-request.exceptions");
let EvaluationRevisionRequestService = class EvaluationRevisionRequestService {
    revisionRequestRepository;
    recipientRepository;
    logger = { log: () => { }, warn: () => { }, error: () => { }, debug: () => { } };
    constructor(revisionRequestRepository, recipientRepository) {
        this.revisionRequestRepository = revisionRequestRepository;
        this.recipientRepository = recipientRepository;
    }
    async ID로_조회한다(id) {
        this.logger.log(`재작성 요청 조회 - ID: ${id}`);
        return await this.revisionRequestRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
            relations: ['recipients'],
        });
    }
    async 필터로_조회한다(filter) {
        this.logger.log('필터로 재작성 요청 조회', filter);
        const queryBuilder = this.revisionRequestRepository
            .createQueryBuilder('request')
            .where('request.deletedAt IS NULL');
        if (filter.evaluationPeriodId) {
            queryBuilder.andWhere('request.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId: filter.evaluationPeriodId,
            });
        }
        if (filter.employeeId) {
            queryBuilder.andWhere('request.employeeId = :employeeId', {
                employeeId: filter.employeeId,
            });
        }
        if (filter.step) {
            queryBuilder.andWhere('request.step = :step', { step: filter.step });
        }
        if (filter.requestedBy) {
            queryBuilder.andWhere('request.requestedBy = :requestedBy', {
                requestedBy: filter.requestedBy,
            });
        }
        queryBuilder
            .leftJoinAndSelect('request.recipients', 'recipients', 'recipients.deletedAt IS NULL')
            .orderBy('request.requestedAt', 'DESC');
        return await queryBuilder.getMany();
    }
    async 생성한다(data) {
        this.logger.log(`재작성 요청 생성 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}, 단계: ${data.step}`);
        try {
            const request = new evaluation_revision_request_entity_1.EvaluationRevisionRequest(data);
            const saved = await this.revisionRequestRepository.save(request);
            this.logger.log(`재작성 요청 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`재작성 요청 생성 실패 - 평가기간: ${data.evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
    async 저장한다(request) {
        this.logger.log(`재작성 요청 저장 - ID: ${request.id}`);
        return await this.revisionRequestRepository.save(request);
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`재작성 요청 삭제 - ID: ${id}`);
        const request = await this.ID로_조회한다(id);
        if (!request) {
            throw new evaluation_revision_request_exceptions_1.EvaluationRevisionRequestNotFoundException(id);
        }
        try {
            request.deletedAt = new Date();
            request.메타데이터를_업데이트한다(deletedBy);
            await this.revisionRequestRepository.save(request);
            this.logger.log(`재작성 요청 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`재작성 요청 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 수신자의_요청목록을_조회한다(recipientId, filter) {
        this.logger.log(`수신자의 재작성 요청 목록 조회 - 수신자 ID: ${recipientId}`);
        const queryBuilder = this.recipientRepository
            .createQueryBuilder('recipient')
            .leftJoinAndSelect('recipient.revisionRequest', 'request', 'request.deletedAt IS NULL')
            .where('recipient.deletedAt IS NULL')
            .andWhere('recipient.recipientId = :recipientId', { recipientId });
        if (filter?.isRead !== undefined) {
            queryBuilder.andWhere('recipient.isRead = :isRead', {
                isRead: filter.isRead,
            });
        }
        if (filter?.isCompleted !== undefined) {
            queryBuilder.andWhere('recipient.isCompleted = :isCompleted', {
                isCompleted: filter.isCompleted,
            });
        }
        if (filter?.evaluationPeriodId) {
            queryBuilder.andWhere('(request.id IS NULL OR request.evaluationPeriodId = :evaluationPeriodId)', {
                evaluationPeriodId: filter.evaluationPeriodId,
            });
        }
        if (filter?.employeeId) {
            queryBuilder.andWhere('(request.id IS NULL OR request.employeeId = :employeeId)', {
                employeeId: filter.employeeId,
            });
        }
        if (filter?.step) {
            queryBuilder.andWhere('(request.id IS NULL OR request.step = :step)', {
                step: filter.step,
            });
        }
        queryBuilder.orderBy('COALESCE(request.requestedAt, recipient.createdAt)', 'DESC');
        return await queryBuilder.getMany();
    }
    async 수신자를_조회한다(requestId, recipientId) {
        this.logger.log(`재작성 요청 수신자 조회 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`);
        return await this.recipientRepository.findOne({
            where: {
                revisionRequestId: requestId,
                recipientId: recipientId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            relations: ['revisionRequest'],
        });
    }
    async 수신자를_저장한다(recipient) {
        this.logger.log(`재작성 요청 수신자 저장 - ID: ${recipient.id}, 수신자 ID: ${recipient.recipientId}`);
        return await this.recipientRepository.save(recipient);
    }
    async 읽지않은_요청수를_조회한다(recipientId) {
        this.logger.log(`읽지 않은 재작성 요청 수 조회 - 수신자 ID: ${recipientId}`);
        return await this.recipientRepository
            .createQueryBuilder('recipient')
            .leftJoin('recipient.revisionRequest', 'request')
            .where('recipient.deletedAt IS NULL')
            .andWhere('recipient.recipientId = :recipientId', { recipientId })
            .andWhere('recipient.isRead = :isRead', { isRead: false })
            .andWhere('request.deletedAt IS NULL')
            .getCount();
    }
};
exports.EvaluationRevisionRequestService = EvaluationRevisionRequestService;
exports.EvaluationRevisionRequestService = EvaluationRevisionRequestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_revision_request_entity_1.EvaluationRevisionRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_revision_request_recipient_entity_1.EvaluationRevisionRequestRecipient)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EvaluationRevisionRequestService);
//# sourceMappingURL=evaluation-revision-request.service.js.map