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
var ProjectManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectManager = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let ProjectManager = ProjectManager_1 = class ProjectManager extends base_entity_1.BaseEntity {
    managerId;
    name;
    email;
    employeeNumber;
    departmentName;
    isActive;
    note;
    constructor(managerId, name, email, employeeNumber, departmentName, isActive = true) {
        super();
        if (managerId)
            this.managerId = managerId;
        if (name)
            this.name = name;
        if (email)
            this.email = email;
        if (employeeNumber)
            this.employeeNumber = employeeNumber;
        if (departmentName)
            this.departmentName = departmentName;
        this.isActive = isActive;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            managerId: this.managerId,
            name: this.name,
            email: this.email,
            employeeNumber: this.employeeNumber,
            departmentName: this.departmentName,
            isActive: this.isActive,
            note: this.note,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
        };
    }
    static 생성한다(data, createdBy) {
        const manager = new ProjectManager_1();
        Object.assign(manager, data);
        manager.생성자를_설정한다(createdBy);
        return manager;
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
exports.ProjectManager = ProjectManager;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        unique: true,
        comment: 'SSO의 매니저 ID (externalId)',
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ProjectManager.prototype, "managerId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        comment: '매니저 이름',
    }),
    __metadata("design:type", String)
], ProjectManager.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '이메일',
    }),
    __metadata("design:type", String)
], ProjectManager.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '사번',
    }),
    __metadata("design:type", String)
], ProjectManager.prototype, "employeeNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '부서명',
    }),
    __metadata("design:type", String)
], ProjectManager.prototype, "departmentName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
        comment: '활성 상태',
    }),
    __metadata("design:type", Boolean)
], ProjectManager.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '비고',
    }),
    __metadata("design:type", String)
], ProjectManager.prototype, "note", void 0);
exports.ProjectManager = ProjectManager = ProjectManager_1 = __decorate([
    (0, typeorm_1.Entity)('project_manager'),
    __metadata("design:paramtypes", [String, String, String, String, String, Boolean])
], ProjectManager);
//# sourceMappingURL=project-manager.entity.js.map