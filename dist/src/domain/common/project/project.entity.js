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
var Project_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
const project_types_1 = require("./project.types");
let Project = Project_1 = class Project extends base_entity_1.BaseEntity {
    name;
    projectCode;
    status;
    startDate;
    endDate;
    managerId;
    parentProjectId;
    constructor(name, projectCode, status, startDate, endDate, managerId, parentProjectId) {
        super();
        if (name)
            this.name = name;
        if (projectCode)
            this.projectCode = projectCode;
        if (status)
            this.status = status;
        if (startDate)
            this.startDate = startDate;
        if (endDate)
            this.endDate = endDate;
        if (managerId)
            this.managerId = managerId;
        if (parentProjectId)
            this.parentProjectId = parentProjectId;
        this.status = status || project_types_1.ProjectStatus.ACTIVE;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            name: this.name,
            projectCode: this.projectCode,
            status: this.status,
            startDate: this.startDate,
            endDate: this.endDate,
            parentProjectId: this.parentProjectId,
            get isDeleted() {
                return this.deletedAt !== null && this.deletedAt !== undefined;
            },
            get isActive() {
                return this.status === project_types_1.ProjectStatus.ACTIVE;
            },
            get isCompleted() {
                return this.status === project_types_1.ProjectStatus.COMPLETED;
            },
            get isCancelled() {
                return this.status === project_types_1.ProjectStatus.CANCELLED;
            },
        };
    }
    static 생성한다(data, createdBy) {
        const project = new Project_1();
        Object.assign(project, data);
        project.생성자를_설정한다(createdBy);
        return project;
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
exports.Project = Project;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        comment: '프로젝트명',
    }),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '프로젝트 코드',
    }),
    __metadata("design:type", String)
], Project.prototype, "projectCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [...Object.values(project_types_1.ProjectStatus)],
        default: project_types_1.ProjectStatus.ACTIVE,
        comment: '프로젝트 상태',
    }),
    __metadata("design:type", String)
], Project.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'date',
        nullable: true,
        comment: '시작일',
    }),
    __metadata("design:type", Date)
], Project.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'date',
        nullable: true,
        comment: '종료일',
    }),
    __metadata("design:type", Date)
], Project.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '프로젝트 매니저 ID (하위 프로젝트는 기본적으로 최상단 프로젝트의 PM으로 설정)',
    }),
    __metadata("design:type", String)
], Project.prototype, "managerId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'uuid',
        nullable: true,
        comment: '상위 프로젝트 ID (하위 프로젝트인 경우)',
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Project.prototype, "parentProjectId", void 0);
exports.Project = Project = Project_1 = __decorate([
    (0, typeorm_1.Entity)('project'),
    __metadata("design:paramtypes", [String, String, String, Date,
        Date, String, String])
], Project);
//# sourceMappingURL=project.entity.js.map