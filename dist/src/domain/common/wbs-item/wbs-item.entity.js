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
var WbsItem_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsItem = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const wbs_item_types_1 = require("./wbs-item.types");
let WbsItem = WbsItem_1 = class WbsItem extends base_entity_1.BaseEntity {
    wbsCode;
    title;
    status;
    startDate;
    endDate;
    progressPercentage;
    assignedToId;
    projectId;
    parentWbsId;
    level;
    constructor(wbsCode, title, status, startDate, endDate, progressPercentage, assignedToId, projectId, parentWbsId, level) {
        super();
        if (wbsCode)
            this.wbsCode = wbsCode;
        if (title)
            this.title = title;
        if (status)
            this.status = status;
        if (startDate)
            this.startDate = startDate;
        if (endDate)
            this.endDate = endDate;
        if (progressPercentage !== undefined)
            this.progressPercentage = progressPercentage;
        if (assignedToId)
            this.assignedToId = assignedToId;
        if (projectId)
            this.projectId = projectId;
        if (parentWbsId)
            this.parentWbsId = parentWbsId;
        if (level !== undefined)
            this.level = level;
        this.status = status || wbs_item_types_1.WbsItemStatus.PENDING;
        this.level = level || 1;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            wbsCode: this.wbsCode,
            title: this.title,
            status: this.status,
            startDate: this.startDate,
            endDate: this.endDate,
            progressPercentage: this.progressPercentage,
            assignedToId: this.assignedToId,
            projectId: this.projectId,
            parentWbsId: this.parentWbsId,
            level: this.level,
            get isDeleted() {
                return this.deletedAt !== null && this.deletedAt !== undefined;
            },
            get isInProgress() {
                return this.status === wbs_item_types_1.WbsItemStatus.IN_PROGRESS;
            },
            get isCompleted() {
                return this.status === wbs_item_types_1.WbsItemStatus.COMPLETED;
            },
            get isCancelled() {
                return this.status === wbs_item_types_1.WbsItemStatus.CANCELLED;
            },
            get isPending() {
                return this.status === wbs_item_types_1.WbsItemStatus.PENDING;
            },
            get isOverdue() {
                if (!this.endDate ||
                    this.status === wbs_item_types_1.WbsItemStatus.COMPLETED ||
                    this.status === wbs_item_types_1.WbsItemStatus.CANCELLED) {
                    return false;
                }
                return new Date() > this.endDate;
            },
        };
    }
    static 생성한다(data, createdBy) {
        const wbsItem = new WbsItem_1();
        Object.assign(wbsItem, data);
        wbsItem.생성자를_설정한다(createdBy);
        return wbsItem;
    }
    업데이트한다(data, updatedBy) {
        const filteredData = Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined));
        Object.assign(this, filteredData);
        this.수정자를_설정한다(updatedBy);
    }
    삭제한다(deletedBy) {
        this.deletedAt = new Date();
        this.수정자를_설정한다(deletedBy);
    }
};
exports.WbsItem = WbsItem;
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        comment: 'WBS 코드',
    }),
    __metadata("design:type", String)
], WbsItem.prototype, "wbsCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        comment: 'WBS 제목',
    }),
    __metadata("design:type", String)
], WbsItem.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [...Object.values(wbs_item_types_1.WbsItemStatus)],
        default: wbs_item_types_1.WbsItemStatus.PENDING,
        comment: 'WBS 상태',
    }),
    __metadata("design:type", String)
], WbsItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'date',
        nullable: true,
        comment: '시작일',
    }),
    __metadata("design:type", Date)
], WbsItem.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'date',
        nullable: true,
        comment: '종료일',
    }),
    __metadata("design:type", Date)
], WbsItem.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
        comment: '진행률 (%)',
    }),
    __metadata("design:type", Number)
], WbsItem.prototype, "progressPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '담당자 ID',
    }),
    __metadata("design:type", String)
], WbsItem.prototype, "assignedToId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        comment: '프로젝트 ID',
    }),
    __metadata("design:type", String)
], WbsItem.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '상위 WBS 항목 ID',
    }),
    __metadata("design:type", String)
], WbsItem.prototype, "parentWbsId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        comment: 'WBS 레벨 (1: 최상위)',
    }),
    __metadata("design:type", Number)
], WbsItem.prototype, "level", void 0);
exports.WbsItem = WbsItem = WbsItem_1 = __decorate([
    (0, typeorm_1.Entity)('wbs_item'),
    (0, typeorm_1.Index)(['projectId']),
    (0, typeorm_1.Index)(['parentWbsId']),
    (0, typeorm_1.Index)(['assignedToId']),
    __metadata("design:paramtypes", [String, String, String, Date,
        Date, Number, String, String, String, Number])
], WbsItem);
//# sourceMappingURL=wbs-item.entity.js.map