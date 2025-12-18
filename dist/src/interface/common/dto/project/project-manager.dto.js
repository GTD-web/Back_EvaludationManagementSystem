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
exports.ProjectManagerListResponseDto = exports.GetProjectManagersQueryDto = exports.ProjectManagerResponseDto = exports.UpdateProjectManagerDto = exports.CreateProjectManagerDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateProjectManagerDto {
    managerId;
    name;
    email;
    employeeNumber;
    departmentName;
    isActive;
    note;
}
exports.CreateProjectManagerDto = CreateProjectManagerDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SSO의 매니저 ID',
        example: 'ff463c9b-69ba-4df4-9126-997b1a13aa3b',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectManagerDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 이름',
        example: '김철수',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectManagerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일',
        example: 'kim@lumir.space',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateProjectManagerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '사번',
        example: '24001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectManagerDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '연구소',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectManagerDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활성 상태',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProjectManagerDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '비고',
        example: 'PM 역할 추가',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectManagerDto.prototype, "note", void 0);
class UpdateProjectManagerDto {
    name;
    email;
    employeeNumber;
    departmentName;
    isActive;
    note;
}
exports.UpdateProjectManagerDto = UpdateProjectManagerDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '매니저 이름',
        example: '김철수',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProjectManagerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일',
        example: 'kim@lumir.space',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateProjectManagerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '사번',
        example: '24001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProjectManagerDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '연구소',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProjectManagerDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활성 상태',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProjectManagerDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '비고',
        example: 'PM 역할 수정',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProjectManagerDto.prototype, "note", void 0);
class ProjectManagerResponseDto {
    id;
    managerId;
    name;
    email;
    employeeNumber;
    departmentName;
    isActive;
    note;
    createdAt;
    updatedAt;
    deletedAt;
}
exports.ProjectManagerResponseDto = ProjectManagerResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PM ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ProjectManagerResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SSO의 매니저 ID',
        example: 'ff463c9b-69ba-4df4-9126-997b1a13aa3b',
    }),
    __metadata("design:type", String)
], ProjectManagerResponseDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 이름',
        example: '김철수',
    }),
    __metadata("design:type", String)
], ProjectManagerResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일',
        example: 'kim@lumir.space',
    }),
    __metadata("design:type", String)
], ProjectManagerResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '사번',
        example: '24001',
    }),
    __metadata("design:type", String)
], ProjectManagerResponseDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '연구소',
    }),
    __metadata("design:type", String)
], ProjectManagerResponseDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활성 상태',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ProjectManagerResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '비고',
        example: 'PM 역할',
    }),
    __metadata("design:type", String)
], ProjectManagerResponseDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectManagerResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectManagerResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제 일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectManagerResponseDto.prototype, "deletedAt", void 0);
class GetProjectManagersQueryDto {
    page;
    limit;
    isActive;
    search;
}
exports.GetProjectManagersQueryDto = GetProjectManagersQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetProjectManagersQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지당 항목 수',
        example: 20,
        default: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetProjectManagersQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활성 상태 필터',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GetProjectManagersQueryDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '검색어 (이름, 이메일, 사번)',
        example: '김철수',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetProjectManagersQueryDto.prototype, "search", void 0);
class ProjectManagerListResponseDto {
    managers;
    total;
    page;
    limit;
    totalPages;
}
exports.ProjectManagerListResponseDto = ProjectManagerListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PM 목록',
        type: [ProjectManagerResponseDto],
    }),
    __metadata("design:type", Array)
], ProjectManagerListResponseDto.prototype, "managers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 개수',
        example: 10,
    }),
    __metadata("design:type", Number)
], ProjectManagerListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지',
        example: 1,
    }),
    __metadata("design:type", Number)
], ProjectManagerListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지당 항목 수',
        example: 50,
    }),
    __metadata("design:type", Number)
], ProjectManagerListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 페이지 수',
        example: 1,
    }),
    __metadata("design:type", Number)
], ProjectManagerListResponseDto.prototype, "totalPages", void 0);
//# sourceMappingURL=project-manager.dto.js.map