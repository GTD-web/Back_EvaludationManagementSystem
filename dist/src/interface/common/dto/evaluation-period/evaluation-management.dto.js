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
exports.ApiResponseDto = exports.ChangeEvaluationPeriodPhaseApiDto = exports.UpdateManualSettingPermissionsApiDto = exports.ManualPermissionSettingDto = exports.UpdateDefaultGradeRangesApiDto = exports.UpdateGradeRangesApiDto = exports.UpdatePeerEvaluationDeadlineApiDto = exports.UpdateSelfEvaluationDeadlineApiDto = exports.UpdatePerformanceDeadlineApiDto = exports.UpdateEvaluationSetupDeadlineApiDto = exports.CopyEvaluationPeriodApiDto = exports.UpdateEvaluationPeriodStartDateApiDto = exports.UpdateEvaluationPeriodScheduleApiDto = exports.UpdateEvaluationPeriodBasicApiDto = exports.CreateEvaluationPeriodApiDto = exports.CreateGradeRangeApiDto = exports.PaginationResponseDto = exports.PaginationQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const date_transform_decorator_1 = require("../../decorators/date-transform.decorator");
class PaginationQueryDto {
    page = 1;
    limit = 10;
}
exports.PaginationQueryDto = PaginationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호',
        example: 1,
        minimum: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '페이지 번호는 숫자여야 합니다.' }),
    (0, class_validator_1.Min)(1, { message: '페이지 번호는 1 이상이어야 합니다.' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 크기',
        example: 10,
        minimum: 1,
        maximum: 100,
        default: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '페이지 크기는 숫자여야 합니다.' }),
    (0, class_validator_1.Min)(1, { message: '페이지 크기는 1 이상이어야 합니다.' }),
    (0, class_validator_1.Max)(100, { message: '페이지 크기는 100 이하여야 합니다.' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], PaginationQueryDto.prototype, "limit", void 0);
class PaginationResponseDto {
    items;
    total;
    page;
    limit;
    totalPages;
    hasNext;
    hasPrev;
    constructor(items, total, page, limit) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.limit = limit;
        this.totalPages = Math.ceil(total / limit);
        this.hasNext = page < this.totalPages;
        this.hasPrev = page > 1;
    }
}
exports.PaginationResponseDto = PaginationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '데이터 목록' }),
    __metadata("design:type", Array)
], PaginationResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전체 데이터 개수' }),
    __metadata("design:type", Number)
], PaginationResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '현재 페이지' }),
    __metadata("design:type", Number)
], PaginationResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '페이지 크기' }),
    __metadata("design:type", Number)
], PaginationResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전체 페이지 수' }),
    __metadata("design:type", Number)
], PaginationResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '다음 페이지 존재 여부' }),
    __metadata("design:type", Boolean)
], PaginationResponseDto.prototype, "hasNext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '이전 페이지 존재 여부' }),
    __metadata("design:type", Boolean)
], PaginationResponseDto.prototype, "hasPrev", void 0);
class CreateGradeRangeApiDto {
    grade;
    minRange;
    maxRange;
}
exports.CreateGradeRangeApiDto = CreateGradeRangeApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '등급',
        example: 'S',
    }),
    (0, class_validator_1.IsString)({ message: '등급은 문자열이어야 합니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '등급은 필수 입력 항목입니다.' }),
    __metadata("design:type", String)
], CreateGradeRangeApiDto.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최소 범위',
        example: 90,
    }),
    (0, class_validator_1.IsNumber)({}, { message: '최소 범위는 숫자여야 합니다.' }),
    (0, class_validator_1.Min)(0, { message: '최소 범위는 0 이상이어야 합니다.' }),
    (0, class_validator_1.Max)(1000, { message: '최소 범위는 1000 이하여야 합니다.' }),
    __metadata("design:type", Number)
], CreateGradeRangeApiDto.prototype, "minRange", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최대 범위',
        example: 100,
    }),
    (0, class_validator_1.IsNumber)({}, { message: '최대 범위는 숫자여야 합니다.' }),
    (0, class_validator_1.Min)(0, { message: '최대 범위는 0 이상이어야 합니다.' }),
    (0, class_validator_1.Max)(1000, { message: '최대 범위는 1000 이하여야 합니다.' }),
    __metadata("design:type", Number)
], CreateGradeRangeApiDto.prototype, "maxRange", void 0);
class CreateEvaluationPeriodApiDto {
    name;
    startDate;
    peerEvaluationDeadline;
    description;
    maxSelfEvaluationRate;
    gradeRanges;
    sourcePeriodId;
}
exports.CreateEvaluationPeriodApiDto = CreateEvaluationPeriodApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간명',
        example: '2024년 상반기 평가',
    }),
    (0, class_validator_1.IsString)({ message: '평가 기간명은 문자열이어야 합니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '평가 기간명은 필수 입력 항목입니다.' }),
    __metadata("design:type", String)
], CreateEvaluationPeriodApiDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간 시작일 (UTC 기준)',
        example: '2024-01-01',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '평가 기간 시작일은 필수 입력 항목입니다.' }),
    (0, date_transform_decorator_1.DateToUTC)(),
    __metadata("design:type", String)
], CreateEvaluationPeriodApiDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향/동료평가 마감일 (UTC 기준)',
        example: '2024-06-30',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '하향/동료평가 마감일은 필수 입력 항목입니다.' }),
    (0, date_transform_decorator_1.DateToUTC)(),
    __metadata("design:type", String)
], CreateEvaluationPeriodApiDto.prototype, "peerEvaluationDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 기간 설명',
        example: '2024년 상반기 직원 평가를 진행합니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvaluationPeriodApiDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 달성률 최대값 (%)',
        example: 120,
        minimum: 100,
        maximum: 200,
        default: 120,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '자기평가 달성률 최대값은 숫자여야 합니다.' }),
    (0, class_validator_1.Min)(100, { message: '자기평가 달성률 최대값은 100% 이상이어야 합니다.' }),
    (0, class_validator_1.Max)(200, { message: '자기평가 달성률 최대값은 200% 이하여야 합니다.' }),
    __metadata("design:type", Number)
], CreateEvaluationPeriodApiDto.prototype, "maxSelfEvaluationRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '등급 구간 설정',
        type: [CreateGradeRangeApiDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: '등급 구간 설정은 배열이어야 합니다.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateGradeRangeApiDto),
    __metadata("design:type", Array)
], CreateEvaluationPeriodApiDto.prototype, "gradeRanges", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '복사할 원본 평가기간 ID (지정 시 원본의 평가항목과 평가라인을 복사)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '원본 평가기간 ID는 문자열이어야 합니다.' }),
    __metadata("design:type", String)
], CreateEvaluationPeriodApiDto.prototype, "sourcePeriodId", void 0);
class UpdateEvaluationPeriodBasicApiDto {
    name;
    description;
    maxSelfEvaluationRate;
}
exports.UpdateEvaluationPeriodBasicApiDto = UpdateEvaluationPeriodBasicApiDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 기간명',
        example: '2024년 상반기 평가 (수정)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '평가 기간명은 문자열이어야 합니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '평가 기간명이 제공된 경우 빈 값일 수 없습니다.' }),
    __metadata("design:type", String)
], UpdateEvaluationPeriodBasicApiDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 기간 설명',
        example: '수정된 평가 기간 설명',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '평가 기간 설명은 문자열이어야 합니다.' }),
    __metadata("design:type", String)
], UpdateEvaluationPeriodBasicApiDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 달성률 최대값 (%)',
        example: 130,
        minimum: 100,
        maximum: 200,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '자기평가 달성률 최대값은 숫자여야 합니다.' }),
    (0, class_validator_1.Min)(100, { message: '자기평가 달성률 최대값은 100% 이상이어야 합니다.' }),
    (0, class_validator_1.Max)(200, { message: '자기평가 달성률 최대값은 200% 이하여야 합니다.' }),
    __metadata("design:type", Number)
], UpdateEvaluationPeriodBasicApiDto.prototype, "maxSelfEvaluationRate", void 0);
class UpdateEvaluationPeriodScheduleApiDto {
    startDate;
    evaluationSetupDeadline;
    performanceDeadline;
    selfEvaluationDeadline;
    peerEvaluationDeadline;
}
exports.UpdateEvaluationPeriodScheduleApiDto = UpdateEvaluationPeriodScheduleApiDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 기간 시작일 (UTC 기준)',
        example: '2024-01-01',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, date_transform_decorator_1.OptionalDateToUTC)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", String)
], UpdateEvaluationPeriodScheduleApiDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 설정 마감일 (UTC 기준)',
        example: '2024-01-15',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, date_transform_decorator_1.OptionalDateToUTC)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", String)
], UpdateEvaluationPeriodScheduleApiDto.prototype, "evaluationSetupDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 입력 마감일 (UTC 기준)',
        example: '2024-05-31',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, date_transform_decorator_1.OptionalDateToUTC)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", String)
], UpdateEvaluationPeriodScheduleApiDto.prototype, "performanceDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 마감일 (UTC 기준)',
        example: '2024-06-15',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, date_transform_decorator_1.OptionalDateToUTC)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", String)
], UpdateEvaluationPeriodScheduleApiDto.prototype, "selfEvaluationDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향/동료평가 마감일 (UTC 기준)',
        example: '2024-06-30',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, date_transform_decorator_1.OptionalDateToUTC)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", String)
], UpdateEvaluationPeriodScheduleApiDto.prototype, "peerEvaluationDeadline", void 0);
class UpdateEvaluationPeriodStartDateApiDto {
    startDate;
}
exports.UpdateEvaluationPeriodStartDateApiDto = UpdateEvaluationPeriodStartDateApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간 시작일 (UTC 기준)',
        example: '2024-01-01',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '평가 기간 시작일은 필수 입력 항목입니다.' }),
    (0, date_transform_decorator_1.DateToUTC)(),
    __metadata("design:type", String)
], UpdateEvaluationPeriodStartDateApiDto.prototype, "startDate", void 0);
class CopyEvaluationPeriodApiDto {
    sourceEvaluationPeriodId;
}
exports.CopyEvaluationPeriodApiDto = CopyEvaluationPeriodApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '복사할 소스 평가기간 ID (이 평가기간의 설정을 복사)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsString)({ message: '소스 평가기간 ID는 문자열이어야 합니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '소스 평가기간 ID는 필수 입력 항목입니다.' }),
    __metadata("design:type", String)
], CopyEvaluationPeriodApiDto.prototype, "sourceEvaluationPeriodId", void 0);
class UpdateEvaluationSetupDeadlineApiDto {
    evaluationSetupDeadline;
}
exports.UpdateEvaluationSetupDeadlineApiDto = UpdateEvaluationSetupDeadlineApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가설정 단계 마감일 (UTC 기준)',
        example: '2024-01-15',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '평가설정 단계 마감일은 필수 입력 항목입니다.' }),
    (0, date_transform_decorator_1.DateToUTC)(),
    __metadata("design:type", String)
], UpdateEvaluationSetupDeadlineApiDto.prototype, "evaluationSetupDeadline", void 0);
class UpdatePerformanceDeadlineApiDto {
    performanceDeadline;
}
exports.UpdatePerformanceDeadlineApiDto = UpdatePerformanceDeadlineApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '업무 수행 단계 마감일 (UTC 기준)',
        example: '2024-05-31',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '업무 수행 단계 마감일은 필수 입력 항목입니다.' }),
    (0, date_transform_decorator_1.DateToUTC)(),
    __metadata("design:type", String)
], UpdatePerformanceDeadlineApiDto.prototype, "performanceDeadline", void 0);
class UpdateSelfEvaluationDeadlineApiDto {
    selfEvaluationDeadline;
}
exports.UpdateSelfEvaluationDeadlineApiDto = UpdateSelfEvaluationDeadlineApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기 평가 단계 마감일 (UTC 기준)',
        example: '2024-06-15',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '자기 평가 단계 마감일은 필수 입력 항목입니다.' }),
    (0, date_transform_decorator_1.DateToUTC)(),
    __metadata("design:type", String)
], UpdateSelfEvaluationDeadlineApiDto.prototype, "selfEvaluationDeadline", void 0);
class UpdatePeerEvaluationDeadlineApiDto {
    peerEvaluationDeadline;
}
exports.UpdatePeerEvaluationDeadlineApiDto = UpdatePeerEvaluationDeadlineApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향/동료평가 단계 마감일 (UTC 기준)',
        example: '2024-06-30',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: '하향/동료평가 단계 마감일은 필수 입력 항목입니다.' }),
    (0, date_transform_decorator_1.DateToUTC)(),
    __metadata("design:type", String)
], UpdatePeerEvaluationDeadlineApiDto.prototype, "peerEvaluationDeadline", void 0);
class UpdateGradeRangesApiDto {
    gradeRanges;
}
exports.UpdateGradeRangesApiDto = UpdateGradeRangesApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '등급 구간 목록',
        type: [CreateGradeRangeApiDto],
    }),
    (0, class_validator_1.IsArray)({ message: '등급 구간 목록은 배열이어야 합니다.' }),
    (0, class_validator_1.ArrayNotEmpty)({ message: '등급 구간 목록은 최소 1개 이상이어야 합니다.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateGradeRangeApiDto),
    __metadata("design:type", Array)
], UpdateGradeRangesApiDto.prototype, "gradeRanges", void 0);
class UpdateDefaultGradeRangesApiDto {
    gradeRanges;
}
exports.UpdateDefaultGradeRangesApiDto = UpdateDefaultGradeRangesApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '기본 등급 구간 목록',
        type: [CreateGradeRangeApiDto],
    }),
    (0, class_validator_1.IsArray)({ message: '등급 구간 목록은 배열이어야 합니다.' }),
    (0, class_validator_1.ArrayNotEmpty)({ message: '등급 구간 목록은 최소 1개 이상이어야 합니다.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateGradeRangeApiDto),
    __metadata("design:type", Array)
], UpdateDefaultGradeRangesApiDto.prototype, "gradeRanges", void 0);
class ManualPermissionSettingDto {
    allowManualSetting;
}
exports.ManualPermissionSettingDto = ManualPermissionSettingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수동 허용 여부 (true: 허용, false: 비허용)',
        example: true,
        type: 'boolean',
    }),
    (0, class_validator_1.IsBoolean)({ message: '수동 허용 여부는 불린 값(true/false)이어야 합니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '수동 허용 여부는 필수 입력 항목입니다.' }),
    __metadata("design:type", Boolean)
], ManualPermissionSettingDto.prototype, "allowManualSetting", void 0);
class UpdateManualSettingPermissionsApiDto {
    allowCriteriaManualSetting;
    allowSelfEvaluationManualSetting;
    allowFinalEvaluationManualSetting;
}
exports.UpdateManualSettingPermissionsApiDto = UpdateManualSettingPermissionsApiDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 기준 설정 수동 허용',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: '평가 기준 설정 수동 허용은 불린 값(true/false)이어야 합니다.',
    }),
    __metadata("design:type", Boolean)
], UpdateManualSettingPermissionsApiDto.prototype, "allowCriteriaManualSetting", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 설정 수동 허용',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: '자기평가 설정 수동 허용은 불린 값(true/false)이어야 합니다.',
    }),
    __metadata("design:type", Boolean)
], UpdateManualSettingPermissionsApiDto.prototype, "allowSelfEvaluationManualSetting", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최종평가 설정 수동 허용',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: '최종평가 설정 수동 허용은 불린 값(true/false)이어야 합니다.',
    }),
    __metadata("design:type", Boolean)
], UpdateManualSettingPermissionsApiDto.prototype, "allowFinalEvaluationManualSetting", void 0);
class ChangeEvaluationPeriodPhaseApiDto {
    targetPhase;
}
exports.ChangeEvaluationPeriodPhaseApiDto = ChangeEvaluationPeriodPhaseApiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '변경할 단계',
        example: 'performance',
        enum: [
            'waiting',
            'evaluation-setup',
            'performance',
            'self-evaluation',
            'peer-evaluation',
            'closure',
        ],
    }),
    (0, class_validator_1.IsString)({ message: '단계는 문자열이어야 합니다.' }),
    (0, class_validator_1.IsNotEmpty)({ message: '단계는 필수 입력 항목입니다.' }),
    __metadata("design:type", String)
], ChangeEvaluationPeriodPhaseApiDto.prototype, "targetPhase", void 0);
class ApiResponseDto {
    success;
    message;
    data;
    error;
    constructor(success, message, data, error) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
    }
}
exports.ApiResponseDto = ApiResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '성공 여부' }),
    __metadata("design:type", Boolean)
], ApiResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '응답 메시지' }),
    __metadata("design:type", String)
], ApiResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '응답 데이터' }),
    __metadata("design:type", Object)
], ApiResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '오류 정보' }),
    __metadata("design:type", Object)
], ApiResponseDto.prototype, "error", void 0);
//# sourceMappingURL=evaluation-management.dto.js.map