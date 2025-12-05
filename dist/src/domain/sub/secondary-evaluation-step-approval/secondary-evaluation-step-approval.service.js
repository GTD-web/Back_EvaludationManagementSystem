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
var SecondaryEvaluationStepApprovalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecondaryEvaluationStepApprovalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const secondary_evaluation_step_approval_entity_1 = require("./secondary-evaluation-step-approval.entity");
const secondary_evaluation_step_approval_exceptions_1 = require("./secondary-evaluation-step-approval.exceptions");
const employee_evaluation_step_approval_types_1 = require("../employee-evaluation-step-approval/employee-evaluation-step-approval.types");
let SecondaryEvaluationStepApprovalService = SecondaryEvaluationStepApprovalService_1 = class SecondaryEvaluationStepApprovalService {
    secondaryStepApprovalRepository;
    logger = new common_1.Logger(SecondaryEvaluationStepApprovalService_1.name);
    constructor(secondaryStepApprovalRepository) {
        this.secondaryStepApprovalRepository = secondaryStepApprovalRepository;
    }
    async ID로_조회한다(id) {
        return await this.secondaryStepApprovalRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 맵핑ID와_평가자ID로_조회한다(mappingId, evaluatorId) {
        return await this.secondaryStepApprovalRepository.findOne({
            where: {
                evaluationPeriodEmployeeMappingId: mappingId,
                evaluatorId: evaluatorId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
    }
    async 맵핑ID로_모두_조회한다(mappingId) {
        this.logger.log(`2차 평가자별 단계 승인 전체 조회 - 맵핑 ID: ${mappingId}`);
        return await this.secondaryStepApprovalRepository.find({
            where: {
                evaluationPeriodEmployeeMappingId: mappingId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
    }
    async 평가자ID로_조회한다(evaluatorId) {
        return await this.secondaryStepApprovalRepository.find({
            where: {
                evaluatorId: evaluatorId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
    }
    async 생성한다(data) {
        this.logger.log(`2차 평가자별 단계 승인 생성 - 맵핑 ID: ${data.evaluationPeriodEmployeeMappingId}, 평가자 ID: ${data.evaluatorId}`);
        try {
            const approval = new secondary_evaluation_step_approval_entity_1.SecondaryEvaluationStepApproval(data);
            const saved = await this.secondaryStepApprovalRepository.save(approval);
            this.logger.log(`2차 평가자별 단계 승인 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`2차 평가자별 단계 승인 생성 실패 - 맵핑 ID: ${data.evaluationPeriodEmployeeMappingId}, 평가자 ID: ${data.evaluatorId}`, error.stack);
            throw error;
        }
    }
    async 저장한다(approval) {
        this.logger.log(`2차 평가자별 단계 승인 저장 - ID: ${approval.id}`);
        return await this.secondaryStepApprovalRepository.save(approval);
    }
    상태를_변경한다(approval, status, updatedBy, revisionRequestId) {
        this.logger.log(`2차 평가자별 단계 승인 상태 변경 - ID: ${approval.id}, 상태: ${status}`);
        switch (status) {
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED:
                approval.승인한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING:
                approval.대기로_변경한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED:
                if (!revisionRequestId) {
                    throw new Error('재작성 요청 상태로 변경 시 revisionRequestId가 필요합니다.');
                }
                approval.재작성요청상태로_변경한다(updatedBy, revisionRequestId);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED:
                approval.재작성완료상태로_변경한다(updatedBy, revisionRequestId);
                break;
        }
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`2차 평가자별 단계 승인 삭제 - ID: ${id}`);
        const approval = await this.ID로_조회한다(id);
        if (!approval) {
            throw new secondary_evaluation_step_approval_exceptions_1.SecondaryEvaluationStepApprovalNotFoundException(id);
        }
        try {
            approval.deletedAt = new Date();
            approval.메타데이터를_업데이트한다(deletedBy);
            await this.secondaryStepApprovalRepository.save(approval);
            this.logger.log(`2차 평가자별 단계 승인 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`2차 평가자별 단계 승인 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
};
exports.SecondaryEvaluationStepApprovalService = SecondaryEvaluationStepApprovalService;
exports.SecondaryEvaluationStepApprovalService = SecondaryEvaluationStepApprovalService = SecondaryEvaluationStepApprovalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(secondary_evaluation_step_approval_entity_1.SecondaryEvaluationStepApproval)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SecondaryEvaluationStepApprovalService);
//# sourceMappingURL=secondary-evaluation-step-approval.service.js.map