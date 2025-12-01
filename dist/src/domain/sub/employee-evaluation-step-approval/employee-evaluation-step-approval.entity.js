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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeEvaluationStepApproval = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const employee_evaluation_step_approval_types_1 = require("./employee-evaluation-step-approval.types");
let EmployeeEvaluationStepApproval = class EmployeeEvaluationStepApproval extends base_entity_1.BaseEntity {
    evaluationPeriodEmployeeMappingId;
    criteriaSettingStatus;
    criteriaSettingApprovedBy;
    criteriaSettingApprovedAt;
    selfEvaluationStatus;
    selfEvaluationApprovedBy;
    selfEvaluationApprovedAt;
    primaryEvaluationStatus;
    primaryEvaluationApprovedBy;
    primaryEvaluationApprovedAt;
    secondaryEvaluationStatus;
    secondaryEvaluationApprovedBy;
    secondaryEvaluationApprovedAt;
    constructor(data) {
        super();
        if (data) {
            this.evaluationPeriodEmployeeMappingId =
                data.evaluationPeriodEmployeeMappingId;
            this.criteriaSettingStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
            this.criteriaSettingApprovedBy = null;
            this.criteriaSettingApprovedAt = null;
            this.selfEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
            this.selfEvaluationApprovedBy = null;
            this.selfEvaluationApprovedAt = null;
            this.primaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
            this.primaryEvaluationApprovedBy = null;
            this.primaryEvaluationApprovedAt = null;
            this.secondaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
            this.secondaryEvaluationApprovedBy = null;
            this.secondaryEvaluationApprovedAt = null;
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    평가기준설정_확인한다(approvedBy) {
        this.criteriaSettingStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED;
        this.criteriaSettingApprovedBy = approvedBy;
        this.criteriaSettingApprovedAt = new Date();
        this.메타데이터를_업데이트한다(approvedBy);
    }
    평가기준설정_대기로_변경한다(updatedBy) {
        this.criteriaSettingStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
        this.criteriaSettingApprovedBy = null;
        this.criteriaSettingApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    평가기준설정_재작성요청상태로_변경한다(updatedBy) {
        console.log(`[DEBUG] 평가기준설정_재작성요청상태로_변경한다 호출 - 이전 상태: ${this.criteriaSettingStatus}, ID: ${this.id}`);
        this.criteriaSettingStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED;
        this.criteriaSettingApprovedBy = null;
        this.criteriaSettingApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
        console.log(`[DEBUG] 평가기준설정_재작성요청상태로_변경한다 완료 - 새 상태: ${this.criteriaSettingStatus}, approvedBy: ${this.criteriaSettingApprovedBy}`);
    }
    평가기준설정_재작성완료상태로_변경한다(updatedBy) {
        this.criteriaSettingStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED;
        this.criteriaSettingApprovedBy = null;
        this.criteriaSettingApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    자기평가_확인한다(approvedBy) {
        this.selfEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED;
        this.selfEvaluationApprovedBy = approvedBy;
        this.selfEvaluationApprovedAt = new Date();
        this.메타데이터를_업데이트한다(approvedBy);
    }
    자기평가_대기로_변경한다(updatedBy) {
        this.selfEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
        this.selfEvaluationApprovedBy = null;
        this.selfEvaluationApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    자기평가_재작성요청상태로_변경한다(updatedBy) {
        console.log(`[DEBUG] 자기평가_재작성요청상태로_변경한다 호출 - 이전 상태: ${this.selfEvaluationStatus}, ID: ${this.id}`);
        this.selfEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED;
        this.selfEvaluationApprovedBy = null;
        this.selfEvaluationApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
        console.log(`[DEBUG] 자기평가_재작성요청상태로_변경한다 완료 - 새 상태: ${this.selfEvaluationStatus}, approvedBy: ${this.selfEvaluationApprovedBy}`);
    }
    자기평가_재작성완료상태로_변경한다(updatedBy) {
        this.selfEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED;
        this.selfEvaluationApprovedBy = null;
        this.selfEvaluationApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    일차평가_확인한다(approvedBy) {
        this.primaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED;
        this.primaryEvaluationApprovedBy = approvedBy;
        this.primaryEvaluationApprovedAt = new Date();
        this.메타데이터를_업데이트한다(approvedBy);
    }
    일차평가_대기로_변경한다(updatedBy) {
        this.primaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
        this.primaryEvaluationApprovedBy = null;
        this.primaryEvaluationApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    일차평가_재작성요청상태로_변경한다(updatedBy) {
        this.primaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED;
        this.primaryEvaluationApprovedBy = null;
        this.primaryEvaluationApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    일차평가_재작성완료상태로_변경한다(updatedBy) {
        this.primaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED;
        this.primaryEvaluationApprovedBy = null;
        this.primaryEvaluationApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    이차평가_확인한다(approvedBy) {
        this.secondaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED;
        this.secondaryEvaluationApprovedBy = approvedBy;
        this.secondaryEvaluationApprovedAt = new Date();
        this.메타데이터를_업데이트한다(approvedBy);
    }
    이차평가_대기로_변경한다(updatedBy) {
        this.secondaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING;
        this.secondaryEvaluationApprovedBy = null;
        this.secondaryEvaluationApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    이차평가_재작성요청상태로_변경한다(updatedBy) {
        this.secondaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_REQUESTED;
        this.secondaryEvaluationApprovedBy = null;
        this.secondaryEvaluationApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    이차평가_재작성완료상태로_변경한다(updatedBy) {
        this.secondaryEvaluationStatus = employee_evaluation_step_approval_types_1.StepApprovalStatus.REVISION_COMPLETED;
        this.secondaryEvaluationApprovedBy = null;
        this.secondaryEvaluationApprovedAt = null;
        this.메타데이터를_업데이트한다(updatedBy);
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            evaluationPeriodEmployeeMappingId: this.evaluationPeriodEmployeeMappingId,
            criteriaSettingStatus: this.criteriaSettingStatus,
            criteriaSettingApprovedBy: this.criteriaSettingApprovedBy,
            criteriaSettingApprovedAt: this.criteriaSettingApprovedAt,
            selfEvaluationStatus: this.selfEvaluationStatus,
            selfEvaluationApprovedBy: this.selfEvaluationApprovedBy,
            selfEvaluationApprovedAt: this.selfEvaluationApprovedAt,
            primaryEvaluationStatus: this.primaryEvaluationStatus,
            primaryEvaluationApprovedBy: this.primaryEvaluationApprovedBy,
            primaryEvaluationApprovedAt: this.primaryEvaluationApprovedAt,
            secondaryEvaluationStatus: this.secondaryEvaluationStatus,
            secondaryEvaluationApprovedBy: this.secondaryEvaluationApprovedBy,
            secondaryEvaluationApprovedAt: this.secondaryEvaluationApprovedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
        };
    }
};
exports.EmployeeEvaluationStepApproval = EmployeeEvaluationStepApproval;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        unique: true,
        comment: '평가기간-직원 맵핑 ID',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationStepApproval.prototype, "evaluationPeriodEmployeeMappingId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: employee_evaluation_step_approval_types_1.StepApprovalStatus,
        enumName: 'step_approval_status_enum',
        default: employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING,
        comment: '평가기준 설정 상태',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationStepApproval.prototype, "criteriaSettingStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '평가기준 설정 승인자 ID',
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationStepApproval.prototype, "criteriaSettingApprovedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '평가기준 설정 승인 일시',
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationStepApproval.prototype, "criteriaSettingApprovedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: employee_evaluation_step_approval_types_1.StepApprovalStatus,
        enumName: 'step_approval_status_enum',
        default: employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING,
        comment: '자기평가 상태',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationStepApproval.prototype, "selfEvaluationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '자기평가 승인자 ID',
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationStepApproval.prototype, "selfEvaluationApprovedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '자기평가 승인 일시',
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationStepApproval.prototype, "selfEvaluationApprovedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: employee_evaluation_step_approval_types_1.StepApprovalStatus,
        enumName: 'step_approval_status_enum',
        default: employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING,
        comment: '1차 하향평가 상태',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationStepApproval.prototype, "primaryEvaluationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '1차 하향평가 승인자 ID',
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationStepApproval.prototype, "primaryEvaluationApprovedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '1차 하향평가 승인 일시',
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationStepApproval.prototype, "primaryEvaluationApprovedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: employee_evaluation_step_approval_types_1.StepApprovalStatus,
        enumName: 'step_approval_status_enum',
        default: employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING,
        comment: '2차 하향평가 상태',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationStepApproval.prototype, "secondaryEvaluationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '2차 하향평가 승인자 ID',
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationStepApproval.prototype, "secondaryEvaluationApprovedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '2차 하향평가 승인 일시',
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationStepApproval.prototype, "secondaryEvaluationApprovedAt", void 0);
exports.EmployeeEvaluationStepApproval = EmployeeEvaluationStepApproval = __decorate([
    (0, typeorm_1.Entity)('employee_evaluation_step_approval'),
    (0, typeorm_1.Index)(['evaluationPeriodEmployeeMappingId'], { unique: true }),
    __metadata("design:paramtypes", [Object])
], EmployeeEvaluationStepApproval);
//# sourceMappingURL=employee-evaluation-step-approval.entity.js.map