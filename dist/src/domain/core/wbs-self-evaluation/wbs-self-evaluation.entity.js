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
exports.WbsSelfEvaluation = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let WbsSelfEvaluation = class WbsSelfEvaluation extends base_entity_1.BaseEntity {
    periodId;
    employeeId;
    wbsItemId;
    assignedBy;
    assignedDate;
    submittedToEvaluator;
    submittedToEvaluatorAt;
    submittedToManager;
    submittedToManagerAt;
    evaluationDate;
    performanceResult;
    selfEvaluationContent;
    selfEvaluationScore;
    subProject;
    constructor(data) {
        super();
        if (data) {
            this.periodId = data.periodId;
            this.employeeId = data.employeeId;
            this.wbsItemId = data.wbsItemId;
            this.assignedBy = data.assignedBy;
            this.assignedDate = new Date();
            this.submittedToEvaluator = false;
            this.submittedToManager = false;
            this.performanceResult = data.performanceResult;
            this.selfEvaluationContent = data.selfEvaluationContent;
            this.selfEvaluationScore = data.selfEvaluationScore;
            this.subProject = data.subProject;
            this.evaluationDate = new Date();
            this.메타데이터를_업데이트한다(data.createdBy);
        }
    }
    평가기간과_일치하는가(periodId) {
        return this.periodId === periodId;
    }
    해당_직원의_자가평가인가(employeeId) {
        return this.employeeId === employeeId;
    }
    해당_WBS항목의_자가평가인가(wbsItemId) {
        return this.wbsItemId === wbsItemId;
    }
    피평가자가_1차평가자에게_제출한다() {
        this.submittedToEvaluator = true;
        this.submittedToEvaluatorAt = new Date();
    }
    일차평가자가_관리자에게_제출한다() {
        if (!this.submittedToEvaluator) {
            this.submittedToEvaluator = true;
            this.submittedToEvaluatorAt = new Date();
        }
        this.submittedToManager = true;
        this.submittedToManagerAt = new Date();
    }
    피평가자_제출을_취소한다() {
        this.submittedToEvaluator = false;
    }
    피평가자_제출을_완전히_초기화한다() {
        this.submittedToEvaluator = false;
        this.submittedToEvaluatorAt = null;
    }
    일차평가자_제출을_취소한다() {
        this.submittedToManager = false;
    }
    일차평가자_제출을_완전히_초기화한다() {
        this.submittedToManager = false;
        this.submittedToManagerAt = null;
    }
    피평가자가_1차평가자에게_제출했는가() {
        return this.submittedToEvaluator;
    }
    일차평가자가_관리자에게_제출했는가() {
        return this.submittedToManager;
    }
    점수가_유효한가(maxScore) {
        if (this.selfEvaluationScore === undefined ||
            this.selfEvaluationScore === null) {
            return true;
        }
        return (this.selfEvaluationScore >= 0 && this.selfEvaluationScore <= maxScore);
    }
    자가평가를_수정한다(content, score, performanceResult, subProject, updatedBy) {
        if (content !== undefined) {
            this.selfEvaluationContent = content;
        }
        if (score !== undefined) {
            this.selfEvaluationScore = score;
        }
        if (performanceResult !== undefined) {
            this.performanceResult = performanceResult;
        }
        if (subProject !== undefined) {
            this.subProject = subProject;
        }
        this.evaluationDate = new Date();
        if (updatedBy) {
            this.메타데이터를_업데이트한다(updatedBy);
        }
    }
    자가평가_내용을_초기화한다(updatedBy) {
        this.selfEvaluationContent = '';
        this.selfEvaluationScore = 0;
        this.performanceResult = null;
        this.submittedToEvaluator = false;
        this.submittedToEvaluatorAt = null;
        this.submittedToManager = false;
        this.submittedToManagerAt = null;
        this.evaluationDate = new Date();
        if (updatedBy) {
            this.메타데이터를_업데이트한다(updatedBy);
        }
    }
    삭제한다() {
        this.deletedAt = new Date();
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            periodId: this.periodId,
            employeeId: this.employeeId,
            wbsItemId: this.wbsItemId,
            assignedBy: this.assignedBy,
            assignedDate: this.assignedDate,
            submittedToEvaluator: this.submittedToEvaluator,
            submittedToEvaluatorAt: this.submittedToEvaluatorAt,
            submittedToManager: this.submittedToManager,
            submittedToManagerAt: this.submittedToManagerAt,
            evaluationDate: this.evaluationDate,
            performanceResult: this.performanceResult,
            selfEvaluationContent: this.selfEvaluationContent,
            selfEvaluationScore: this.selfEvaluationScore,
            subProject: this.subProject,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            version: this.version,
        };
    }
};
exports.WbsSelfEvaluation = WbsSelfEvaluation;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '평가 기간 ID',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluation.prototype, "periodId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '직원 ID',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluation.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: 'WBS 항목 ID',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluation.prototype, "wbsItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '할당자 ID',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluation.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        comment: '할당일',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluation.prototype, "assignedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '피평가자가 1차 평가자에게 제출한 여부',
    }),
    __metadata("design:type", Boolean)
], WbsSelfEvaluation.prototype, "submittedToEvaluator", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '1차 평가자에게 제출한 일시',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluation.prototype, "submittedToEvaluatorAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '1차 평가자가 관리자에게 제출한 여부',
    }),
    __metadata("design:type", Boolean)
], WbsSelfEvaluation.prototype, "submittedToManager", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        nullable: true,
        comment: '관리자에게 제출한 일시',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluation.prototype, "submittedToManagerAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        comment: '평가일',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluation.prototype, "evaluationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '성과 입력 (실제 달성한 성과 및 결과)',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluation.prototype, "performanceResult", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '자가평가 내용',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluation.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'integer',
        nullable: true,
        comment: '자가평가 점수',
    }),
    __metadata("design:type", Number)
], WbsSelfEvaluation.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '세부 프로젝트 (서브 프로젝트)',
    }),
    __metadata("design:type", Object)
], WbsSelfEvaluation.prototype, "subProject", void 0);
exports.WbsSelfEvaluation = WbsSelfEvaluation = __decorate([
    (0, typeorm_1.Entity)('wbs_self_evaluation'),
    (0, typeorm_1.Index)(['evaluationDate']),
    (0, typeorm_1.Index)(['periodId', 'employeeId']),
    (0, typeorm_1.Index)(['periodId', 'wbsItemId']),
    (0, typeorm_1.Index)(['employeeId', 'wbsItemId']),
    (0, typeorm_1.Index)(['assignedDate']),
    __metadata("design:paramtypes", [Object])
], WbsSelfEvaluation);
//# sourceMappingURL=wbs-self-evaluation.entity.js.map