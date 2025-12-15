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
exports.DownwardEvaluationDetailResponseDto = exports.DownwardEvaluationListResponseDto = exports.ResetDownwardEvaluationResponseDto = exports.DownwardEvaluationResponseDto = exports.DownwardEvaluationBasicDto = exports.DownwardEvaluationFilterDto = exports.SubmitDownwardEvaluationQueryDto = exports.SubmitDownwardEvaluationDto = exports.UpdateDownwardEvaluationDto = exports.CreateSecondaryDownwardEvaluationBodyDto = exports.CreatePrimaryDownwardEvaluationBodyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const decorators_1 = require("../../decorators");
class CreatePrimaryDownwardEvaluationBodyDto {
    evaluatorId;
    selfEvaluationId;
    downwardEvaluationContent;
    downwardEvaluationScore;
}
exports.CreatePrimaryDownwardEvaluationBodyDto = CreatePrimaryDownwardEvaluationBodyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePrimaryDownwardEvaluationBodyDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePrimaryDownwardEvaluationBodyDto.prototype, "selfEvaluationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 내용',
        example: '팀원의 업무 수행 능력이 우수합니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePrimaryDownwardEvaluationBodyDto.prototype, "downwardEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 점수 (양의 정수만 가능)',
        example: 4,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePrimaryDownwardEvaluationBodyDto.prototype, "downwardEvaluationScore", void 0);
class CreateSecondaryDownwardEvaluationBodyDto {
    evaluatorId;
    selfEvaluationId;
    downwardEvaluationContent;
    downwardEvaluationScore;
}
exports.CreateSecondaryDownwardEvaluationBodyDto = CreateSecondaryDownwardEvaluationBodyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSecondaryDownwardEvaluationBodyDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSecondaryDownwardEvaluationBodyDto.prototype, "selfEvaluationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 내용',
        example: '팀원의 업무 수행 능력이 우수합니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecondaryDownwardEvaluationBodyDto.prototype, "downwardEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 점수 (양의 정수만 가능)',
        example: 4,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSecondaryDownwardEvaluationBodyDto.prototype, "downwardEvaluationScore", void 0);
class UpdateDownwardEvaluationDto {
    downwardEvaluationContent;
    downwardEvaluationScore;
}
exports.UpdateDownwardEvaluationDto = UpdateDownwardEvaluationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 내용',
        example: '수정된 하향평가 내용입니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDownwardEvaluationDto.prototype, "downwardEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 점수 (양의 정수만 가능)',
        example: 5,
        minimum: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateDownwardEvaluationDto.prototype, "downwardEvaluationScore", void 0);
class SubmitDownwardEvaluationDto {
    evaluatorId;
}
exports.SubmitDownwardEvaluationDto = SubmitDownwardEvaluationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitDownwardEvaluationDto.prototype, "evaluatorId", void 0);
class SubmitDownwardEvaluationQueryDto {
    approveAllBelow;
}
exports.SubmitDownwardEvaluationQueryDto = SubmitDownwardEvaluationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하위 단계 자동 승인 여부 (기본값: true)',
        example: true,
        type: Boolean,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SubmitDownwardEvaluationQueryDto.prototype, "approveAllBelow", void 0);
class DownwardEvaluationFilterDto {
    evaluateeId;
    periodId;
    wbsId;
    evaluationType;
    isCompleted;
    page;
    limit;
}
exports.DownwardEvaluationFilterDto = DownwardEvaluationFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DownwardEvaluationFilterDto.prototype, "evaluateeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DownwardEvaluationFilterDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS ID',
        example: '550e8400-e29b-41d4-a716-446655440004',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DownwardEvaluationFilterDto.prototype, "wbsId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 유형',
        example: 'primary',
        enum: ['primary', 'secondary'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['primary', 'secondary']),
    __metadata("design:type", String)
], DownwardEvaluationFilterDto.prototype, "evaluationType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '완료 여부',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(false),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DownwardEvaluationFilterDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호 (1부터 시작)',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DownwardEvaluationFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 크기',
        example: 10,
        default: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], DownwardEvaluationFilterDto.prototype, "limit", void 0);
class DownwardEvaluationBasicDto {
    id;
    employeeId;
    evaluatorId;
    wbsId;
    periodId;
    selfEvaluationId;
    evaluationDate;
    downwardEvaluationContent;
    downwardEvaluationScore;
    evaluationType;
    isCompleted;
    completedAt;
    createdAt;
    updatedAt;
    deletedAt;
    createdBy;
    updatedBy;
    version;
}
exports.DownwardEvaluationBasicDto = DownwardEvaluationBasicDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS ID',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "wbsId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440004',
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440005',
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "selfEvaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가일',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationBasicDto.prototype, "evaluationDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 내용',
        example: '팀원의 업무 수행 능력이 우수합니다.',
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "downwardEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 점수 (양의 정수)',
        example: 4,
    }),
    __metadata("design:type", Number)
], DownwardEvaluationBasicDto.prototype, "downwardEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 유형',
        example: 'primary',
        enum: ['primary', 'secondary'],
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "evaluationType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], DownwardEvaluationBasicDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '완료 일시',
        example: '2024-01-15T11:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationBasicDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationBasicDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationBasicDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제 일시',
        example: '2024-01-15T12:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationBasicDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: '550e8400-e29b-41d4-a716-446655440006',
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: '550e8400-e29b-41d4-a716-446655440007',
    }),
    __metadata("design:type", String)
], DownwardEvaluationBasicDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전 번호',
        example: 1,
    }),
    __metadata("design:type", Number)
], DownwardEvaluationBasicDto.prototype, "version", void 0);
class DownwardEvaluationResponseDto {
    id;
    evaluatorId;
    message;
}
exports.DownwardEvaluationResponseDto = DownwardEvaluationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], DownwardEvaluationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], DownwardEvaluationResponseDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '결과 메시지',
        example: '하향평가가 성공적으로 생성되었습니다.',
    }),
    __metadata("design:type", String)
], DownwardEvaluationResponseDto.prototype, "message", void 0);
class ResetDownwardEvaluationResponseDto {
    message;
}
exports.ResetDownwardEvaluationResponseDto = ResetDownwardEvaluationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '결과 메시지',
        example: '1차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
    }),
    __metadata("design:type", String)
], ResetDownwardEvaluationResponseDto.prototype, "message", void 0);
class DownwardEvaluationListResponseDto {
    evaluations;
    total;
    page;
    limit;
}
exports.DownwardEvaluationListResponseDto = DownwardEvaluationListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향평가 목록',
        type: [DownwardEvaluationBasicDto],
    }),
    __metadata("design:type", Array)
], DownwardEvaluationListResponseDto.prototype, "evaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 개수',
        example: 25,
    }),
    __metadata("design:type", Number)
], DownwardEvaluationListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지',
        example: 1,
    }),
    __metadata("design:type", Number)
], DownwardEvaluationListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지 크기',
        example: 10,
    }),
    __metadata("design:type", Number)
], DownwardEvaluationListResponseDto.prototype, "limit", void 0);
class DownwardEvaluationDetailResponseDto {
    id;
    evaluationDate;
    downwardEvaluationContent;
    downwardEvaluationScore;
    evaluationType;
    isCompleted;
    completedAt;
    createdAt;
    updatedAt;
    deletedAt;
    createdBy;
    updatedBy;
    version;
    employee;
    evaluator;
    wbs;
    period;
    selfEvaluation;
}
exports.DownwardEvaluationDetailResponseDto = DownwardEvaluationDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], DownwardEvaluationDetailResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가일',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationDetailResponseDto.prototype, "evaluationDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 내용',
        example: '팀원의 업무 수행 능력이 우수합니다.',
    }),
    __metadata("design:type", String)
], DownwardEvaluationDetailResponseDto.prototype, "downwardEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향평가 점수 (양의 정수)',
        example: 4,
    }),
    __metadata("design:type", Number)
], DownwardEvaluationDetailResponseDto.prototype, "downwardEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 유형',
        example: 'primary',
        enum: ['primary', 'secondary'],
    }),
    __metadata("design:type", String)
], DownwardEvaluationDetailResponseDto.prototype, "evaluationType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], DownwardEvaluationDetailResponseDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '완료 일시',
        example: '2024-01-15T11:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationDetailResponseDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationDetailResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationDetailResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제 일시',
        example: '2024-01-15T12:00:00Z',
    }),
    __metadata("design:type", Date)
], DownwardEvaluationDetailResponseDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: '550e8400-e29b-41d4-a716-446655440006',
    }),
    __metadata("design:type", String)
], DownwardEvaluationDetailResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: '550e8400-e29b-41d4-a716-446655440007',
    }),
    __metadata("design:type", String)
], DownwardEvaluationDetailResponseDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전 번호',
        example: 1,
    }),
    __metadata("design:type", Number)
], DownwardEvaluationDetailResponseDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '피평가자 정보',
        type: 'object',
        properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
            name: { type: 'string', example: '홍길동' },
            employeeNumber: { type: 'string', example: 'EMP001' },
            email: { type: 'string', example: 'hong@example.com' },
            departmentId: { type: 'string', example: 'DEPT001' },
            status: { type: 'string', example: 'ACTIVE' },
        },
    }),
    __metadata("design:type", Object)
], DownwardEvaluationDetailResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가자 정보',
        type: 'object',
        properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' },
            name: { type: 'string', example: '김철수' },
            employeeNumber: { type: 'string', example: 'EMP002' },
            email: { type: 'string', example: 'kim@example.com' },
            departmentId: { type: 'string', example: 'DEPT001' },
            status: { type: 'string', example: 'ACTIVE' },
        },
    }),
    __metadata("design:type", Object)
], DownwardEvaluationDetailResponseDto.prototype, "evaluator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 정보',
        type: 'object',
        properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440003' },
            name: { type: 'string', example: 'API 개발' },
            code: { type: 'string', example: 'WBS001' },
            status: { type: 'string', example: 'IN_PROGRESS' },
            startDate: { type: 'string', example: '2024-01-01T00:00:00Z' },
            endDate: { type: 'string', example: '2024-12-31T23:59:59Z' },
        },
    }),
    __metadata("design:type", Object)
], DownwardEvaluationDetailResponseDto.prototype, "wbs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 정보',
        type: 'object',
        properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440004' },
            name: { type: 'string', example: '2024년 상반기 평가' },
            startDate: { type: 'string', example: '2024-01-01T00:00:00Z' },
            endDate: { type: 'string', example: '2024-06-30T23:59:59Z' },
            status: { type: 'string', example: 'IN_PROGRESS' },
        },
    }),
    __metadata("design:type", Object)
], DownwardEvaluationDetailResponseDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 정보',
        type: 'object',
        properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440005' },
            wbsItemId: {
                type: 'string',
                example: '550e8400-e29b-41d4-a716-446655440010',
            },
            performanceResult: {
                type: 'string',
                example: '프로젝트 성공적으로 완료',
            },
            selfEvaluationContent: {
                type: 'string',
                example: '목표를 초과 달성했습니다.',
            },
            selfEvaluationScore: { type: 'number', example: 5 },
            isCompleted: { type: 'boolean', example: true },
            completedAt: { type: 'string', example: '2024-01-15T10:00:00Z' },
            evaluationDate: { type: 'string', example: '2024-01-15T09:00:00Z' },
        },
    }),
    __metadata("design:type", Object)
], DownwardEvaluationDetailResponseDto.prototype, "selfEvaluation", void 0);
//# sourceMappingURL=downward-evaluation.dto.js.map