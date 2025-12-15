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
exports.EvaluationCriteriaSubmissionResponseDto = exports.SubmitEvaluationCriteriaDto = exports.WbsItemEvaluationCriteriaResponseDto = exports.WbsEvaluationCriteriaDetailDto = exports.WbsEvaluationCriteriaListResponseDto = exports.WbsEvaluationCriteriaDto = exports.EvaluationPeriodManualSettingsDto = exports.WbsEvaluationCriteriaFilterDto = exports.UpdateWbsEvaluationCriteriaDto = exports.UpsertWbsEvaluationCriteriaBodyDto = exports.CreateWbsEvaluationCriteriaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateWbsEvaluationCriteriaDto {
    wbsItemId;
    criteria;
    importance;
}
exports.CreateWbsEvaluationCriteriaDto = CreateWbsEvaluationCriteriaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWbsEvaluationCriteriaDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 내용',
        example: '코드 품질 및 성능 최적화',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWbsEvaluationCriteriaDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '중요도 (1~10)',
        example: 5,
        minimum: 1,
        maximum: 10,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateWbsEvaluationCriteriaDto.prototype, "importance", void 0);
class UpsertWbsEvaluationCriteriaBodyDto {
    criteria;
    importance;
    subProject;
}
exports.UpsertWbsEvaluationCriteriaBodyDto = UpsertWbsEvaluationCriteriaBodyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 내용 (빈 문자열 허용)',
        example: '코드 품질 및 성능 최적화',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertWbsEvaluationCriteriaBodyDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '중요도 (1~10)',
        example: 5,
        minimum: 1,
        maximum: 10,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], UpsertWbsEvaluationCriteriaBodyDto.prototype, "importance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '세부 프로젝트 (서브 프로젝트)',
        example: '모바일 앱 개발',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertWbsEvaluationCriteriaBodyDto.prototype, "subProject", void 0);
class UpdateWbsEvaluationCriteriaDto {
    criteria;
    importance;
    subProject;
}
exports.UpdateWbsEvaluationCriteriaDto = UpdateWbsEvaluationCriteriaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기준 내용',
        example: '코드 품질 및 성능 최적화',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWbsEvaluationCriteriaDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '중요도 (1~10)',
        example: 5,
        minimum: 1,
        maximum: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], UpdateWbsEvaluationCriteriaDto.prototype, "importance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '세부 프로젝트 (서브 프로젝트)',
        example: '모바일 앱 개발',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWbsEvaluationCriteriaDto.prototype, "subProject", void 0);
class WbsEvaluationCriteriaFilterDto {
    wbsItemId;
    criteriaSearch;
    criteriaExact;
}
exports.WbsEvaluationCriteriaFilterDto = WbsEvaluationCriteriaFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WbsEvaluationCriteriaFilterDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '기준 내용 검색 (부분 일치)',
        example: '코드 품질',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WbsEvaluationCriteriaFilterDto.prototype, "criteriaSearch", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '기준 내용 완전 일치',
        example: '코드 품질 및 성능 최적화',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WbsEvaluationCriteriaFilterDto.prototype, "criteriaExact", void 0);
class EvaluationPeriodManualSettingsDto {
    criteriaSettingEnabled;
    selfEvaluationSettingEnabled;
    finalEvaluationSettingEnabled;
}
exports.EvaluationPeriodManualSettingsDto = EvaluationPeriodManualSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기준 설정 수동 허용 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodManualSettingsDto.prototype, "criteriaSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기 평가 설정 수동 허용 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodManualSettingsDto.prototype, "selfEvaluationSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향/동료평가 설정 수동 허용 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodManualSettingsDto.prototype, "finalEvaluationSettingEnabled", void 0);
class WbsEvaluationCriteriaDto {
    id;
    wbsItemId;
    criteria;
    importance;
    subProject;
    createdAt;
    updatedAt;
}
exports.WbsEvaluationCriteriaDto = WbsEvaluationCriteriaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriteriaDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriteriaDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 내용',
        example: '코드 품질 및 성능 최적화',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriteriaDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '중요도 (1~10)',
        example: 5,
    }),
    __metadata("design:type", Number)
], WbsEvaluationCriteriaDto.prototype, "importance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '세부 프로젝트 (서브 프로젝트)',
        example: '모바일 앱 개발',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsEvaluationCriteriaDto.prototype, "subProject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성일시', example: '2024-10-01T09:00:00Z' }),
    __metadata("design:type", Date)
], WbsEvaluationCriteriaDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '수정일시', example: '2024-10-01T09:00:00Z' }),
    __metadata("design:type", Date)
], WbsEvaluationCriteriaDto.prototype, "updatedAt", void 0);
class WbsEvaluationCriteriaListResponseDto {
    criteria;
    evaluationPeriodSettings;
}
exports.WbsEvaluationCriteriaListResponseDto = WbsEvaluationCriteriaListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 목록',
        type: [WbsEvaluationCriteriaDto],
    }),
    __metadata("design:type", Array)
], WbsEvaluationCriteriaListResponseDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 수동 설정 상태 정보',
        type: EvaluationPeriodManualSettingsDto,
    }),
    __metadata("design:type", EvaluationPeriodManualSettingsDto)
], WbsEvaluationCriteriaListResponseDto.prototype, "evaluationPeriodSettings", void 0);
class WbsEvaluationCriteriaDetailDto {
    id;
    criteria;
    importance;
    createdAt;
    updatedAt;
    wbsItem;
}
exports.WbsEvaluationCriteriaDetailDto = WbsEvaluationCriteriaDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriteriaDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 내용',
        example: '코드 품질 및 성능 최적화',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriteriaDetailDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '중요도 (1~10)',
        example: 5,
    }),
    __metadata("design:type", Number)
], WbsEvaluationCriteriaDetailDto.prototype, "importance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성일시', example: '2024-10-01T09:00:00Z' }),
    __metadata("design:type", Date)
], WbsEvaluationCriteriaDetailDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '수정일시', example: '2024-10-01T09:00:00Z' }),
    __metadata("design:type", Date)
], WbsEvaluationCriteriaDetailDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 정보',
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            wbsCode: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'string' },
            level: { type: 'number' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            progressPercentage: { type: 'string' },
        },
    }),
    __metadata("design:type", Object)
], WbsEvaluationCriteriaDetailDto.prototype, "wbsItem", void 0);
class WbsItemEvaluationCriteriaResponseDto {
    wbsItemId;
    criteria;
}
exports.WbsItemEvaluationCriteriaResponseDto = WbsItemEvaluationCriteriaResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    __metadata("design:type", String)
], WbsItemEvaluationCriteriaResponseDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 목록',
        type: [WbsEvaluationCriteriaDto],
    }),
    __metadata("design:type", Array)
], WbsItemEvaluationCriteriaResponseDto.prototype, "criteria", void 0);
class SubmitEvaluationCriteriaDto {
    evaluationPeriodId;
    employeeId;
}
exports.SubmitEvaluationCriteriaDto = SubmitEvaluationCriteriaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitEvaluationCriteriaDto.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitEvaluationCriteriaDto.prototype, "employeeId", void 0);
class EvaluationCriteriaSubmissionResponseDto {
    id;
    evaluationPeriodId;
    employeeId;
    isCriteriaSubmitted;
    criteriaSubmittedAt;
    criteriaSubmittedBy;
}
exports.EvaluationCriteriaSubmissionResponseDto = EvaluationCriteriaSubmissionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '맵핑 ID',
        example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7',
    }),
    __metadata("design:type", String)
], EvaluationCriteriaSubmissionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    __metadata("design:type", String)
], EvaluationCriteriaSubmissionResponseDto.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    __metadata("design:type", String)
], EvaluationCriteriaSubmissionResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 제출 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationCriteriaSubmissionResponseDto.prototype, "isCriteriaSubmitted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기준 제출 일시',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Object)
], EvaluationCriteriaSubmissionResponseDto.prototype, "criteriaSubmittedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기준 제출 처리자 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8',
    }),
    __metadata("design:type", Object)
], EvaluationCriteriaSubmissionResponseDto.prototype, "criteriaSubmittedBy", void 0);
//# sourceMappingURL=wbs-evaluation-criteria.dto.js.map