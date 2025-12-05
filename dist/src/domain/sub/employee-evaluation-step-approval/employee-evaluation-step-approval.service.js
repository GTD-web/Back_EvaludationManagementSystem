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
var EmployeeEvaluationStepApprovalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeEvaluationStepApprovalService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_evaluation_step_approval_entity_1 = require("./employee-evaluation-step-approval.entity");
const employee_evaluation_step_approval_exceptions_1 = require("./employee-evaluation-step-approval.exceptions");
const employee_evaluation_step_approval_types_1 = require("./employee-evaluation-step-approval.types");
let EmployeeEvaluationStepApprovalService = EmployeeEvaluationStepApprovalService_1 = class EmployeeEvaluationStepApprovalService {
    stepApprovalRepository;
    logger = new common_1.Logger(EmployeeEvaluationStepApprovalService_1.name);
    constructor(stepApprovalRepository) {
        this.stepApprovalRepository = stepApprovalRepository;
    }
    async ID로_조회한다(id) {
        return await this.stepApprovalRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 맵핑ID로_조회한다(mappingId) {
        return await this.stepApprovalRepository.findOne({
            where: {
                evaluationPeriodEmployeeMappingId: mappingId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
    }
    async 생성한다(data) {
        this.logger.log(`단계 승인 생성 - 맵핑 ID: ${data.evaluationPeriodEmployeeMappingId}`);
        try {
            const stepApproval = new employee_evaluation_step_approval_entity_1.EmployeeEvaluationStepApproval(data);
            const saved = await this.stepApprovalRepository.save(stepApproval);
            this.logger.log(`단계 승인 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`단계 승인 생성 실패 - 맵핑 ID: ${data.evaluationPeriodEmployeeMappingId}`, error.stack);
            throw error;
        }
    }
    async 저장한다(stepApproval) {
        this.logger.log(`[DEBUG] 단계 승인 저장 시작 - ID: ${stepApproval.id}, criteriaSettingStatus: ${stepApproval.criteriaSettingStatus}, selfEvaluationStatus: ${stepApproval.selfEvaluationStatus}`);
        const saved = await this.stepApprovalRepository.save(stepApproval);
        this.logger.log(`[DEBUG] 단계 승인 저장 완료 - ID: ${saved.id}, criteriaSettingStatus: ${saved.criteriaSettingStatus}, selfEvaluationStatus: ${saved.selfEvaluationStatus}`);
        return saved;
    }
    단계_상태를_변경한다(stepApproval, step, status, updatedBy) {
        this.logger.log(`단계 상태 변경 시작 - 단계: ${step}, 상태: ${status}, ID: ${stepApproval.id}`);
        this.logger.log(`[DEBUG] 변경 전 - criteriaSettingStatus: ${stepApproval.criteriaSettingStatus}, selfEvaluationStatus: ${stepApproval.selfEvaluationStatus}`);
        switch (step) {
            case 'criteria':
                this._평가기준설정_상태변경(stepApproval, status, updatedBy);
                break;
            case 'self':
                this._자기평가_상태변경(stepApproval, status, updatedBy);
                break;
            case 'primary':
                this._일차평가_상태변경(stepApproval, status, updatedBy);
                break;
            case 'secondary':
                this._이차평가_상태변경(stepApproval, status, updatedBy);
                break;
            default:
                throw new employee_evaluation_step_approval_exceptions_1.InvalidStepTypeException(step);
        }
        this.logger.log(`[DEBUG] 변경 후 - criteriaSettingStatus: ${stepApproval.criteriaSettingStatus}, selfEvaluationStatus: ${stepApproval.selfEvaluationStatus}`);
        this.logger.log(`단계 상태 변경 완료 - 단계: ${step}, 새 상태: ${status}`);
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`단계 승인 삭제 - ID: ${id}`);
        const stepApproval = await this.ID로_조회한다(id);
        if (!stepApproval) {
            throw new employee_evaluation_step_approval_exceptions_1.EmployeeEvaluationStepApprovalNotFoundException(id);
        }
        try {
            stepApproval.deletedAt = new Date();
            stepApproval.메타데이터를_업데이트한다(deletedBy);
            await this.stepApprovalRepository.save(stepApproval);
            this.logger.log(`단계 승인 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`단계 승인 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    _평가기준설정_상태변경(stepApproval, status, updatedBy) {
        switch (status) {
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED:
                stepApproval.평가기준설정_확인한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING:
                stepApproval.평가기준설정_대기로_변경한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED:
                stepApproval.평가기준설정_재작성요청상태로_변경한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED:
                stepApproval.평가기준설정_재작성완료상태로_변경한다(updatedBy);
                break;
        }
    }
    _자기평가_상태변경(stepApproval, status, updatedBy) {
        switch (status) {
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED:
                stepApproval.자기평가_확인한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING:
                stepApproval.자기평가_대기로_변경한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED:
                stepApproval.자기평가_재작성요청상태로_변경한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED:
                stepApproval.자기평가_재작성완료상태로_변경한다(updatedBy);
                break;
        }
    }
    _일차평가_상태변경(stepApproval, status, updatedBy) {
        switch (status) {
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED:
                stepApproval.일차평가_확인한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING:
                stepApproval.일차평가_대기로_변경한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED:
                stepApproval.일차평가_재작성요청상태로_변경한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED:
                stepApproval.일차평가_재작성완료상태로_변경한다(updatedBy);
                break;
        }
    }
    _이차평가_상태변경(stepApproval, status, updatedBy) {
        switch (status) {
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED:
                stepApproval.이차평가_확인한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING:
                stepApproval.이차평가_대기로_변경한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED:
                stepApproval.이차평가_재작성요청상태로_변경한다(updatedBy);
                break;
            case employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED:
                stepApproval.이차평가_재작성완료상태로_변경한다(updatedBy);
                break;
        }
    }
};
exports.EmployeeEvaluationStepApprovalService = EmployeeEvaluationStepApprovalService;
exports.EmployeeEvaluationStepApprovalService = EmployeeEvaluationStepApprovalService = EmployeeEvaluationStepApprovalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_evaluation_step_approval_entity_1.EmployeeEvaluationStepApproval)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmployeeEvaluationStepApprovalService);
//# sourceMappingURL=employee-evaluation-step-approval.service.js.map