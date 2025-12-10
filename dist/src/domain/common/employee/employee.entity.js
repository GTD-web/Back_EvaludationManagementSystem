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
exports.Employee = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let Employee = class Employee extends base_entity_1.BaseEntity {
    employeeNumber;
    name;
    email;
    phoneNumber;
    dateOfBirth;
    gender;
    hireDate;
    managerId;
    status;
    departmentId;
    departmentName;
    departmentCode;
    positionId;
    rankId;
    rankName;
    rankCode;
    rankLevel;
    externalId;
    externalCreatedAt;
    externalUpdatedAt;
    lastSyncAt;
    roles;
    isExcludedFromList;
    excludeReason;
    excludedBy;
    excludedAt;
    isAccessible;
    constructor(employeeNumber, name, email, externalId, phoneNumber, dateOfBirth, gender, hireDate, managerId, status, departmentId, departmentName, departmentCode, positionId, rankId, rankName, rankCode, rankLevel, externalCreatedAt, externalUpdatedAt) {
        super();
        if (employeeNumber)
            this.employeeNumber = employeeNumber;
        if (name)
            this.name = name;
        if (email)
            this.email = email;
        if (externalId)
            this.externalId = externalId;
        if (phoneNumber)
            this.phoneNumber = phoneNumber;
        if (dateOfBirth)
            this.dateOfBirth = dateOfBirth;
        if (gender)
            this.gender = gender;
        if (hireDate)
            this.hireDate = hireDate;
        if (managerId)
            this.managerId = managerId;
        if (status)
            this.status = status;
        if (departmentId)
            this.departmentId = departmentId;
        if (departmentName)
            this.departmentName = departmentName;
        if (departmentCode)
            this.departmentCode = departmentCode;
        if (positionId)
            this.positionId = positionId;
        if (rankId)
            this.rankId = rankId;
        if (rankName)
            this.rankName = rankName;
        if (rankCode)
            this.rankCode = rankCode;
        if (rankLevel !== undefined)
            this.rankLevel = rankLevel;
        this.externalCreatedAt = externalCreatedAt || new Date();
        this.externalUpdatedAt = externalUpdatedAt || new Date();
        this.status = status || '재직중';
        this.isExcludedFromList = false;
        this.isAccessible = true;
    }
    DTO로_변환한다() {
        return {
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            version: this.version,
            employeeNumber: this.employeeNumber,
            name: this.name,
            email: this.email,
            phoneNumber: this.phoneNumber,
            dateOfBirth: this.dateOfBirth,
            gender: this.gender,
            hireDate: this.hireDate,
            managerId: this.managerId,
            status: this.status,
            departmentId: this.departmentId,
            departmentName: this.departmentName,
            departmentCode: this.departmentCode,
            positionId: this.positionId,
            rankId: this.rankId,
            rankName: this.rankName,
            rankCode: this.rankCode,
            rankLevel: this.rankLevel,
            externalId: this.externalId,
            externalCreatedAt: this.externalCreatedAt,
            externalUpdatedAt: this.externalUpdatedAt,
            lastSyncAt: this.lastSyncAt,
            roles: this.roles,
            isExcludedFromList: this.isExcludedFromList,
            excludeReason: this.excludeReason,
            excludedBy: this.excludedBy,
            excludedAt: this.excludedAt,
            isAccessible: this.isAccessible,
            get isDeleted() {
                return this.deletedAt !== null && this.deletedAt !== undefined;
            },
            get isNew() {
                return !this.id || this.version === 1;
            },
            get isActive() {
                return this.status === '재직중';
            },
            get isOnLeave() {
                return this.status === '휴직중';
            },
            get isResigned() {
                return this.status === '퇴사';
            },
            get isMale() {
                return this.gender === 'MALE';
            },
            get isFemale() {
                return this.gender === 'FEMALE';
            },
            get yearsOfService() {
                if (!this.hireDate)
                    return 0;
                const now = new Date();
                const hireDate = this.hireDate instanceof Date
                    ? this.hireDate
                    : new Date(this.hireDate);
                const diffTime = Math.abs(now.getTime() - hireDate.getTime());
                return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
            },
            get needsSync() {
                if (!this.lastSyncAt)
                    return true;
                const now = new Date();
                const diffHours = Math.abs(now.getTime() - this.lastSyncAt.getTime()) /
                    (1000 * 60 * 60);
                return diffHours >= 24;
            },
        };
    }
};
exports.Employee = Employee;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        unique: true,
        comment: '직원 번호',
    }),
    __metadata("design:type", String)
], Employee.prototype, "employeeNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 100,
        comment: '직원명',
    }),
    __metadata("design:type", String)
], Employee.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        unique: true,
        comment: '이메일',
    }),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        nullable: true,
        comment: '전화번호',
    }),
    __metadata("design:type", String)
], Employee.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'date',
        nullable: true,
        comment: '생년월일',
    }),
    __metadata("design:type", Date)
], Employee.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['MALE', 'FEMALE'],
        nullable: true,
        comment: '성별',
    }),
    __metadata("design:type", String)
], Employee.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'date',
        nullable: true,
        comment: '입사일',
    }),
    __metadata("design:type", Date)
], Employee.prototype, "hireDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '매니저 ID (외부 시스템)',
    }),
    __metadata("design:type", String)
], Employee.prototype, "managerId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['재직중', '휴직중', '퇴사'],
        default: '재직중',
        comment: '직원 상태',
    }),
    __metadata("design:type", String)
], Employee.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '부서 ID (외부 시스템)',
    }),
    __metadata("design:type", String)
], Employee.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 200,
        nullable: true,
        comment: '부서명',
    }),
    __metadata("design:type", String)
], Employee.prototype, "departmentName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '부서 코드',
    }),
    __metadata("design:type", String)
], Employee.prototype, "departmentCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '직급 ID (외부 시스템)',
    }),
    __metadata("design:type", String)
], Employee.prototype, "positionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '직책 ID (외부 시스템)',
    }),
    __metadata("design:type", String)
], Employee.prototype, "rankId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: '직책명',
    }),
    __metadata("design:type", String)
], Employee.prototype, "rankName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '직책 코드',
    }),
    __metadata("design:type", String)
], Employee.prototype, "rankCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'integer',
        nullable: true,
        comment: '직책 레벨',
    }),
    __metadata("design:type", Number)
], Employee.prototype, "rankLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        unique: true,
        comment: '외부 시스템 ID',
    }),
    __metadata("design:type", String)
], Employee.prototype, "externalId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        comment: '외부 시스템 생성일',
    }),
    __metadata("design:type", Date)
], Employee.prototype, "externalCreatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        comment: '외부 시스템 수정일',
    }),
    __metadata("design:type", Date)
], Employee.prototype, "externalUpdatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '마지막 동기화 시간',
    }),
    __metadata("design:type", Date)
], Employee.prototype, "lastSyncAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        nullable: true,
        comment: 'EMS-PROD 시스템 역할 목록',
    }),
    __metadata("design:type", Array)
], Employee.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: false,
        comment: '목록 조회 제외 여부',
    }),
    __metadata("design:type", Boolean)
], Employee.prototype, "isExcludedFromList", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 500,
        nullable: true,
        comment: '조회 제외 사유',
    }),
    __metadata("design:type", Object)
], Employee.prototype, "excludeReason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 100,
        nullable: true,
        comment: '조회 제외 설정자',
    }),
    __metadata("design:type", Object)
], Employee.prototype, "excludedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        nullable: true,
        comment: '조회 제외 설정 일시',
    }),
    __metadata("design:type", Object)
], Employee.prototype, "excludedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
        comment: '시스템 접근 가능 여부 (관리자 기능 접근 가능 여부)',
    }),
    __metadata("design:type", Boolean)
], Employee.prototype, "isAccessible", void 0);
exports.Employee = Employee = __decorate([
    (0, typeorm_1.Entity)('employee'),
    (0, typeorm_1.Index)(['externalId'], { unique: true }),
    __metadata("design:paramtypes", [String, String, String, String, String, Date, String, Date, String, String, String, String, String, String, String, String, String, Number, Date,
        Date])
], Employee);
//# sourceMappingURL=employee.entity.js.map