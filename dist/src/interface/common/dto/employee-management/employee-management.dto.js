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
exports.PartLeadersResponseDto = exports.GetPartLeadersQueryDto = exports.EmployeeResponseDto = exports.GetEmployeesQueryDto = exports.UpdateEmployeeAdminQueryDto = exports.IncludeEmployeeInListDto = exports.ExcludeEmployeeFromListDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../decorators");
class ExcludeEmployeeFromListDto {
    excludeReason;
}
exports.ExcludeEmployeeFromListDto = ExcludeEmployeeFromListDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '조회 제외 사유',
        example: '퇴사 예정',
        maxLength: 500,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ExcludeEmployeeFromListDto.prototype, "excludeReason", void 0);
class IncludeEmployeeInListDto {
}
exports.IncludeEmployeeInListDto = IncludeEmployeeInListDto;
class UpdateEmployeeAdminQueryDto {
    isAdmin;
}
exports.UpdateEmployeeAdminQueryDto = UpdateEmployeeAdminQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '관리자 권한 여부 (가능값: "true", "false", "1", "0")',
        example: 'true',
        type: String,
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'isAdmin 쿼리 파라미터는 필수입니다.' }),
    (0, decorators_1.ToBooleanStrict)(undefined, 'isAdmin'),
    __metadata("design:type", String)
], UpdateEmployeeAdminQueryDto.prototype, "isAdmin", void 0);
class GetEmployeesQueryDto {
    departmentId;
    includeExcluded;
}
exports.GetEmployeesQueryDto = GetEmployeesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetEmployeesQueryDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외된 직원 포함 여부 (기본값: false)',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], GetEmployeesQueryDto.prototype, "includeExcluded", void 0);
class EmployeeResponseDto {
    id;
    employeeNumber;
    name;
    email;
    rankName;
    rankCode;
    rankLevel;
    departmentName;
    departmentCode;
    isActive;
    isExcludedFromList;
    excludeReason;
    excludedBy;
    excludedAt;
    createdAt;
    updatedAt;
    isAccessible;
}
exports.EmployeeResponseDto = EmployeeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID (UUID 형식)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 번호 (사번)',
        example: 'EMP001',
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'hong.gildong@example.com',
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '부장',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "rankName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책 코드',
        example: 'RANK_04',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "rankCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책 레벨 (숫자가 클수록 높은 직책)',
        example: 4,
        nullable: true,
    }),
    __metadata("design:type", Number)
], EmployeeResponseDto.prototype, "rankLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '소속 부서명',
        example: '기술본부',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '소속 부서 코드',
        example: 'TECH',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "departmentCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '재직 여부 (true: 재직, false: 퇴사)',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EmployeeResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '목록 조회 제외 여부 (true: 제외됨, false: 포함됨)',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EmployeeResponseDto.prototype, "isExcludedFromList", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '조회 제외 사유 (제외된 경우에만 값 존재)',
        example: '퇴사 예정',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "excludeReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '조회 제외 설정자 ID (제외된 경우에만 값 존재)',
        example: 'admin-user-id',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeResponseDto.prototype, "excludedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '조회 제외 설정 일시 (제외된 경우에만 값 존재, ISO 8601 형식)',
        example: '2024-01-15T09:30:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Date)
], EmployeeResponseDto.prototype, "excludedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시 (ISO 8601 형식)',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EmployeeResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시 (ISO 8601 형식)',
        example: '2024-01-15T09:30:00.000Z',
    }),
    __metadata("design:type", Date)
], EmployeeResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시스템 접근 가능 여부 (관리자 기능 접근 가능 여부)',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EmployeeResponseDto.prototype, "isAccessible", void 0);
class GetPartLeadersQueryDto {
    forceRefresh;
}
exports.GetPartLeadersQueryDto = GetPartLeadersQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'SSO에서 강제로 최신 데이터를 가져올지 여부 (기본값: false)',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], GetPartLeadersQueryDto.prototype, "forceRefresh", void 0);
class PartLeadersResponseDto {
    partLeaders;
    count;
}
exports.PartLeadersResponseDto = PartLeadersResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '파트장 목록',
        type: [EmployeeResponseDto],
    }),
    __metadata("design:type", Array)
], PartLeadersResponseDto.prototype, "partLeaders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '파트장 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], PartLeadersResponseDto.prototype, "count", void 0);
//# sourceMappingURL=employee-management.dto.js.map