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
exports.WbsEvaluationCriteria = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let WbsEvaluationCriteria = class WbsEvaluationCriteria extends base_entity_1.BaseEntity {
    wbsItemId;
    criteria;
    importance;
    subProject;
    DTO로_변환한다() {
        return {
            id: this.id,
            wbsItemId: this.wbsItemId,
            criteria: this.criteria,
            importance: this.importance,
            subProject: this.subProject,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
    기준내용업데이트한다(criteria, importance, subProject, updatedBy) {
        this.criteria = criteria;
        this.importance = importance;
        if (subProject !== undefined) {
            this.subProject = subProject;
        }
        this.수정자를_설정한다(updatedBy);
        this.메타데이터를_업데이트한다();
    }
    WBS항목일치하는가(wbsItemId) {
        return this.wbsItemId === wbsItemId;
    }
    유효한가() {
        return (this.wbsItemId !== undefined &&
            this.wbsItemId.trim() !== '' &&
            this.criteria !== undefined);
    }
    기준내용이_유효한가() {
        return this.criteria !== undefined && this.criteria.trim().length > 0;
    }
    WBS항목ID가_유효한가() {
        return this.wbsItemId !== undefined && this.wbsItemId.trim().length > 0;
    }
    동일한_평가기준인가(wbsItemId, criteria) {
        return (this.wbsItemId === wbsItemId && this.criteria.trim() === criteria.trim());
    }
};
exports.WbsEvaluationCriteria = WbsEvaluationCriteria;
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: 'WBS 항목 ID - 평가 기준이 적용되는 WBS 항목 식별자',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriteria.prototype, "wbsItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        comment: '평가 기준 내용 - 실제 평가 기준의 상세 내용',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriteria.prototype, "criteria", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        default: 3,
        comment: '중요도 (1~5, 기본값: 3)',
    }),
    __metadata("design:type", Number)
], WbsEvaluationCriteria.prototype, "importance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '세부 프로젝트 (서브 프로젝트)',
    }),
    __metadata("design:type", Object)
], WbsEvaluationCriteria.prototype, "subProject", void 0);
exports.WbsEvaluationCriteria = WbsEvaluationCriteria = __decorate([
    (0, typeorm_1.Entity)('wbs_evaluation_criteria')
], WbsEvaluationCriteria);
//# sourceMappingURL=wbs-evaluation-criteria.entity.js.map