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
exports.ClearWbsSelfEvaluationsByProjectResponseDto = exports.ClearAllWbsSelfEvaluationsResponseDto = exports.ClearedWbsSelfEvaluationDetailDto = exports.ResetWbsSelfEvaluationsByProjectResponseDto = exports.FailedResetWbsSelfEvaluationByProjectDto = exports.ResetWbsSelfEvaluationByProjectDetailDto = exports.SubmitWbsSelfEvaluationsByProjectResponseDto = exports.FailedWbsSelfEvaluationByProjectDto = exports.SubmittedWbsSelfEvaluationByProjectDetailDto = exports.ResetAllWbsSelfEvaluationsResponseDto = exports.FailedResetWbsSelfEvaluationDto = exports.ResetWbsSelfEvaluationDetailDto = exports.SubmitAllWbsSelfEvaluationsResponseDto = exports.FailedWbsSelfEvaluationDto = exports.SubmittedWbsSelfEvaluationDetailDto = exports.EmployeeSelfEvaluationsResponseDto = exports.WbsSelfEvaluationDetailResponseDto = exports.WbsSelfEvaluationResponseDto = exports.WbsSelfEvaluationBasicDto = exports.WbsSelfEvaluationFilterDto = exports.SubmitWbsSelfEvaluationDto = exports.UpdateWbsSelfEvaluationDto = exports.CreateWbsSelfEvaluationBodyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateWbsSelfEvaluationBodyDto {
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
    subProject;
    createdBy;
}
exports.CreateWbsSelfEvaluationBodyDto = CreateWbsSelfEvaluationBodyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용',
        example: '이번 분기 목표를 성공적으로 달성했습니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWbsSelfEvaluationBodyDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (달성률 %, 0 ~ 평가기간의 maxSelfEvaluationRate)',
        example: 100,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateWbsSelfEvaluationBodyDto.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 입력 (실제 달성한 성과 및 결과)',
        example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWbsSelfEvaluationBodyDto.prototype, "performanceResult", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '세부 프로젝트 (서브 프로젝트)',
        example: '모바일 앱 개발',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWbsSelfEvaluationBodyDto.prototype, "subProject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWbsSelfEvaluationBodyDto.prototype, "createdBy", void 0);
class UpdateWbsSelfEvaluationDto {
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
}
exports.UpdateWbsSelfEvaluationDto = UpdateWbsSelfEvaluationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용',
        example: '수정된 자기평가 내용입니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWbsSelfEvaluationDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (달성률 %, 0 ~ 평가기간의 maxSelfEvaluationRate)',
        example: 100,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateWbsSelfEvaluationDto.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 입력 (실제 달성한 성과 및 결과)',
        example: 'WBS 항목 B를 완료하였으며, 목표 대비 120% 달성했습니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWbsSelfEvaluationDto.prototype, "performanceResult", void 0);
class SubmitWbsSelfEvaluationDto {
}
exports.SubmitWbsSelfEvaluationDto = SubmitWbsSelfEvaluationDto;
class WbsSelfEvaluationFilterDto {
    periodId;
    projectId;
    page;
    limit;
}
exports.WbsSelfEvaluationFilterDto = WbsSelfEvaluationFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WbsSelfEvaluationFilterDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 ID',
        example: '550e8400-e29b-41d4-a716-446655440004',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WbsSelfEvaluationFilterDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호 (1부터 시작)',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], WbsSelfEvaluationFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 크기',
        example: 10,
        default: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], WbsSelfEvaluationFilterDto.prototype, "limit", void 0);
class WbsSelfEvaluationBasicDto {
    id;
    periodId;
    employeeId;
    wbsItemId;
    assignedBy;
    assignedDate;
    submittedToEvaluator;
    submittedToEvaluatorAt;
    submittedToManager;
    submittedToManagerAt;
    evaluationDate;
    performanceResult;
    selfEvaluationContent;
    selfEvaluationScore;
    subProject;
    createdAt;
    updatedAt;
    version;
}
exports.WbsSelfEvaluationBasicDto = WbsSelfEvaluationBasicDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationBasicDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440005',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationBasicDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationBasicDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationBasicDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당자 ID',
        example: '550e8400-e29b-41d4-a716-446655440004',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationBasicDto.prototype, "assignedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당일',
        example: '2024-01-01T09:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationBasicDto.prototype, "assignedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자가 1차 평가자에게 제출한 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], WbsSelfEvaluationBasicDto.prototype, "submittedToEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '1차 평가자에게 제출한 일시',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationBasicDto.prototype, "submittedToEvaluatorAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자가 관리자에게 제출한 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], WbsSelfEvaluationBasicDto.prototype, "submittedToManager", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '관리자에게 제출한 일시',
        example: '2024-01-15T15:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationBasicDto.prototype, "submittedToManagerAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가일',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationBasicDto.prototype, "evaluationDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 입력 (실제 달성한 성과 및 결과)',
        example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationBasicDto.prototype, "performanceResult", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용',
        example: '이번 분기 목표를 성공적으로 달성했습니다.',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationBasicDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
        example: 100,
    }),
    __metadata("design:type", Number)
], WbsSelfEvaluationBasicDto.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '세부 프로젝트 (서브 프로젝트)',
        example: '모바일 앱 개발',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsSelfEvaluationBasicDto.prototype, "subProject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationBasicDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationBasicDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], WbsSelfEvaluationBasicDto.prototype, "version", void 0);
class WbsSelfEvaluationResponseDto extends WbsSelfEvaluationBasicDto {
}
exports.WbsSelfEvaluationResponseDto = WbsSelfEvaluationResponseDto;
class WbsSelfEvaluationDetailResponseDto {
    id;
    periodId;
    employeeId;
    wbsItemId;
    assignedBy;
    assignedDate;
    submittedToEvaluator;
    submittedToEvaluatorAt;
    submittedToManager;
    submittedToManagerAt;
    evaluationDate;
    performanceResult;
    selfEvaluationContent;
    selfEvaluationScore;
    subProject;
    createdAt;
    updatedAt;
    deletedAt;
    createdBy;
    updatedBy;
    version;
    evaluationPeriod;
    employee;
    wbsItem;
}
exports.WbsSelfEvaluationDetailResponseDto = WbsSelfEvaluationDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationDetailResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440005',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationDetailResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationDetailResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationDetailResponseDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당자 ID',
        example: '550e8400-e29b-41d4-a716-446655440004',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationDetailResponseDto.prototype, "assignedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당일',
        example: '2024-01-01T09:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationDetailResponseDto.prototype, "assignedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자가 1차 평가자에게 제출한 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], WbsSelfEvaluationDetailResponseDto.prototype, "submittedToEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '1차 평가자에게 제출한 일시',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationDetailResponseDto.prototype, "submittedToEvaluatorAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자가 관리자에게 제출한 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], WbsSelfEvaluationDetailResponseDto.prototype, "submittedToManager", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '관리자에게 제출한 일시',
        example: '2024-01-15T15:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationDetailResponseDto.prototype, "submittedToManagerAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가일',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationDetailResponseDto.prototype, "evaluationDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 입력 (실제 달성한 성과 및 결과)',
        example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationDetailResponseDto.prototype, "performanceResult", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용',
        example: '이번 분기 목표를 성공적으로 달성했습니다.',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationDetailResponseDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
        example: 100,
    }),
    __metadata("design:type", Number)
], WbsSelfEvaluationDetailResponseDto.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '세부 프로젝트 (서브 프로젝트)',
        example: '모바일 앱 개발',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsSelfEvaluationDetailResponseDto.prototype, "subProject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationDetailResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationDetailResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제 일시',
        example: '2024-01-15T11:00:00Z',
    }),
    __metadata("design:type", Date)
], WbsSelfEvaluationDetailResponseDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationDetailResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: '550e8400-e29b-41d4-a716-446655440004',
    }),
    __metadata("design:type", String)
], WbsSelfEvaluationDetailResponseDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], WbsSelfEvaluationDetailResponseDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 정보',
        type: 'object',
        properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440005' },
            name: { type: 'string', example: '2024년 1분기 평가' },
            startDate: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T00:00:00Z',
            },
            endDate: {
                type: 'string',
                format: 'date-time',
                example: '2024-03-31T23:59:59Z',
            },
            status: { type: 'string', example: 'ACTIVE' },
            description: { type: 'string', example: '2024년 1분기 성과평가 기간' },
        },
    }),
    __metadata("design:type", Object)
], WbsSelfEvaluationDetailResponseDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 정보',
        type: 'object',
        properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440006' },
            employeeNumber: { type: 'string', example: 'EMP001' },
            name: { type: 'string', example: '김철수' },
            email: { type: 'string', example: 'kim.chulsoo@company.com' },
            departmentId: { type: 'string', example: 'DEPT001' },
        },
    }),
    __metadata("design:type", Object)
], WbsSelfEvaluationDetailResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 정보',
        type: 'object',
        properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440007' },
            wbsCode: { type: 'string', example: 'WBS-001' },
            title: { type: 'string', example: '시스템 개발' },
            startDate: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T09:00:00Z',
            },
            endDate: {
                type: 'string',
                format: 'date-time',
                example: '2024-03-31T18:00:00Z',
            },
            status: { type: 'string', example: 'IN_PROGRESS' },
            progressPercentage: { type: 'number', example: 75 },
            projectId: {
                type: 'string',
                example: '550e8400-e29b-41d4-a716-446655440008',
            },
        },
    }),
    __metadata("design:type", Object)
], WbsSelfEvaluationDetailResponseDto.prototype, "wbsItem", void 0);
class EmployeeSelfEvaluationsResponseDto {
    evaluations;
    total;
    page;
    limit;
}
exports.EmployeeSelfEvaluationsResponseDto = EmployeeSelfEvaluationsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 목록',
        type: [WbsSelfEvaluationBasicDto],
        example: [
            {
                id: '550e8400-e29b-41d4-a716-446655440000',
                periodId: '550e8400-e29b-41d4-a716-446655440005',
                employeeId: '550e8400-e29b-41d4-a716-446655440002',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440003',
                assignedBy: '550e8400-e29b-41d4-a716-446655440004',
                assignedDate: '2024-01-01T09:00:00Z',
                submittedToEvaluator: false,
                submittedToEvaluatorAt: null,
                submittedToManager: false,
                submittedToManagerAt: null,
                evaluationDate: '2024-01-15T09:00:00Z',
                performanceResult: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
                selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
                selfEvaluationScore: 100,
                createdAt: '2024-01-15T09:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z',
                version: 1,
            },
        ],
    }),
    __metadata("design:type", Array)
], EmployeeSelfEvaluationsResponseDto.prototype, "evaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 개수',
        example: 25,
    }),
    __metadata("design:type", Number)
], EmployeeSelfEvaluationsResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지',
        example: 1,
    }),
    __metadata("design:type", Number)
], EmployeeSelfEvaluationsResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지 크기',
        example: 10,
    }),
    __metadata("design:type", Number)
], EmployeeSelfEvaluationsResponseDto.prototype, "limit", void 0);
class SubmittedWbsSelfEvaluationDetailDto {
    evaluationId;
    wbsItemId;
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
    submittedToManagerAt;
    submittedToEvaluatorAt;
}
exports.SubmittedWbsSelfEvaluationDetailDto = SubmittedWbsSelfEvaluationDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], SubmittedWbsSelfEvaluationDetailDto.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440010',
    }),
    __metadata("design:type", String)
], SubmittedWbsSelfEvaluationDetailDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용',
        example: '이번 분기 목표를 성공적으로 달성했습니다.',
    }),
    __metadata("design:type", String)
], SubmittedWbsSelfEvaluationDetailDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
        example: 100,
    }),
    __metadata("design:type", Number)
], SubmittedWbsSelfEvaluationDetailDto.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 입력 (실제 달성한 성과 및 결과)',
        example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
    }),
    __metadata("design:type", String)
], SubmittedWbsSelfEvaluationDetailDto.prototype, "performanceResult", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '관리자에게 제출한 일시 (1차 평가자 → 관리자 제출 시 사용)',
        example: '2024-01-15T15:00:00Z',
    }),
    __metadata("design:type", Date)
], SubmittedWbsSelfEvaluationDetailDto.prototype, "submittedToManagerAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '1차 평가자에게 제출한 일시 (피평가자 → 1차 평가자 제출 시 사용)',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], SubmittedWbsSelfEvaluationDetailDto.prototype, "submittedToEvaluatorAt", void 0);
class FailedWbsSelfEvaluationDto {
    evaluationId;
    wbsItemId;
    reason;
    selfEvaluationContent;
    selfEvaluationScore;
}
exports.FailedWbsSelfEvaluationDto = FailedWbsSelfEvaluationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440005',
    }),
    __metadata("design:type", String)
], FailedWbsSelfEvaluationDto.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440015',
    }),
    __metadata("design:type", String)
], FailedWbsSelfEvaluationDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패 이유',
        example: '평가 내용과 점수가 입력되지 않았습니다.',
    }),
    __metadata("design:type", String)
], FailedWbsSelfEvaluationDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용',
        example: '',
    }),
    __metadata("design:type", String)
], FailedWbsSelfEvaluationDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (1-5)',
        example: null,
    }),
    __metadata("design:type", Number)
], FailedWbsSelfEvaluationDto.prototype, "selfEvaluationScore", void 0);
class SubmitAllWbsSelfEvaluationsResponseDto {
    submittedCount;
    failedCount;
    totalCount;
    completedEvaluations;
    failedEvaluations;
}
exports.SubmitAllWbsSelfEvaluationsResponseDto = SubmitAllWbsSelfEvaluationsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '제출된 평가 개수',
        example: 5,
    }),
    __metadata("design:type", Number)
], SubmitAllWbsSelfEvaluationsResponseDto.prototype, "submittedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '제출 실패한 평가 개수',
        example: 0,
    }),
    __metadata("design:type", Number)
], SubmitAllWbsSelfEvaluationsResponseDto.prototype, "failedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 평가 개수',
        example: 5,
    }),
    __metadata("design:type", Number)
], SubmitAllWbsSelfEvaluationsResponseDto.prototype, "totalCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 평가 상세 정보',
        type: [SubmittedWbsSelfEvaluationDetailDto],
        example: [
            {
                evaluationId: '550e8400-e29b-41d4-a716-446655440001',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
                selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
                selfEvaluationScore: 4,
                performanceResult: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
                submittedToManagerAt: '2024-01-15T15:00:00Z',
            },
        ],
    }),
    __metadata("design:type", Array)
], SubmitAllWbsSelfEvaluationsResponseDto.prototype, "completedEvaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 평가 상세 정보 (비어있으면 모든 평가가 성공)',
        type: [FailedWbsSelfEvaluationDto],
        example: [
            {
                evaluationId: '550e8400-e29b-41d4-a716-446655440005',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440015',
                reason: '평가 내용과 점수가 입력되지 않았습니다.',
                selfEvaluationContent: '',
                selfEvaluationScore: null,
            },
        ],
    }),
    __metadata("design:type", Array)
], SubmitAllWbsSelfEvaluationsResponseDto.prototype, "failedEvaluations", void 0);
class ResetWbsSelfEvaluationDetailDto {
    evaluationId;
    wbsItemId;
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
    wasSubmittedToManager;
}
exports.ResetWbsSelfEvaluationDetailDto = ResetWbsSelfEvaluationDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], ResetWbsSelfEvaluationDetailDto.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440010',
    }),
    __metadata("design:type", String)
], ResetWbsSelfEvaluationDetailDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용',
        example: '이번 분기 목표를 성공적으로 달성했습니다.',
    }),
    __metadata("design:type", String)
], ResetWbsSelfEvaluationDetailDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
        example: 100,
    }),
    __metadata("design:type", Number)
], ResetWbsSelfEvaluationDetailDto.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 입력 (실제 달성한 성과 및 결과)',
        example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
    }),
    __metadata("design:type", String)
], ResetWbsSelfEvaluationDetailDto.prototype, "performanceResult", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화 전 관리자에게 제출 상태였는지 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ResetWbsSelfEvaluationDetailDto.prototype, "wasSubmittedToManager", void 0);
class FailedResetWbsSelfEvaluationDto {
    evaluationId;
    wbsItemId;
    reason;
}
exports.FailedResetWbsSelfEvaluationDto = FailedResetWbsSelfEvaluationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440005',
    }),
    __metadata("design:type", String)
], FailedResetWbsSelfEvaluationDto.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440015',
    }),
    __metadata("design:type", String)
], FailedResetWbsSelfEvaluationDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패 이유',
        example: '알 수 없는 오류가 발생했습니다.',
    }),
    __metadata("design:type", String)
], FailedResetWbsSelfEvaluationDto.prototype, "reason", void 0);
class ResetAllWbsSelfEvaluationsResponseDto {
    resetCount;
    failedCount;
    totalCount;
    resetEvaluations;
    failedResets;
}
exports.ResetAllWbsSelfEvaluationsResponseDto = ResetAllWbsSelfEvaluationsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화된 평가 개수',
        example: 2,
    }),
    __metadata("design:type", Number)
], ResetAllWbsSelfEvaluationsResponseDto.prototype, "resetCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화 실패한 평가 개수',
        example: 1,
    }),
    __metadata("design:type", Number)
], ResetAllWbsSelfEvaluationsResponseDto.prototype, "failedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 평가 개수',
        example: 5,
    }),
    __metadata("design:type", Number)
], ResetAllWbsSelfEvaluationsResponseDto.prototype, "totalCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화된 평가 상세 정보',
        type: [ResetWbsSelfEvaluationDetailDto],
        example: [
            {
                evaluationId: '550e8400-e29b-41d4-a716-446655440001',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
                selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
                selfEvaluationScore: 4,
                performanceResult: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
                wasCompleted: true,
            },
        ],
    }),
    __metadata("design:type", Array)
], ResetAllWbsSelfEvaluationsResponseDto.prototype, "resetEvaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화 실패한 평가 정보 (비어있으면 모든 초기화 성공)',
        type: [FailedResetWbsSelfEvaluationDto],
        example: [
            {
                evaluationId: '550e8400-e29b-41d4-a716-446655440005',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440015',
                reason: '데이터베이스 제약 조건 위반으로 초기화에 실패했습니다.',
            },
        ],
    }),
    __metadata("design:type", Array)
], ResetAllWbsSelfEvaluationsResponseDto.prototype, "failedResets", void 0);
class SubmittedWbsSelfEvaluationByProjectDetailDto {
    evaluationId;
    wbsItemId;
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
    submittedToManagerAt;
    submittedToEvaluatorAt;
}
exports.SubmittedWbsSelfEvaluationByProjectDetailDto = SubmittedWbsSelfEvaluationByProjectDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], SubmittedWbsSelfEvaluationByProjectDetailDto.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440010',
    }),
    __metadata("design:type", String)
], SubmittedWbsSelfEvaluationByProjectDetailDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용',
        example: '이번 분기 목표를 성공적으로 달성했습니다.',
    }),
    __metadata("design:type", String)
], SubmittedWbsSelfEvaluationByProjectDetailDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
        example: 100,
    }),
    __metadata("design:type", Number)
], SubmittedWbsSelfEvaluationByProjectDetailDto.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 입력 (실제 달성한 성과 및 결과)',
        example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
    }),
    __metadata("design:type", String)
], SubmittedWbsSelfEvaluationByProjectDetailDto.prototype, "performanceResult", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '관리자에게 제출한 일시',
        example: '2024-01-15T09:30:00Z',
    }),
    __metadata("design:type", Date)
], SubmittedWbsSelfEvaluationByProjectDetailDto.prototype, "submittedToManagerAt", void 0);
class FailedWbsSelfEvaluationByProjectDto {
    evaluationId;
    wbsItemId;
    reason;
    selfEvaluationContent;
    selfEvaluationScore;
}
exports.FailedWbsSelfEvaluationByProjectDto = FailedWbsSelfEvaluationByProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440005',
    }),
    __metadata("design:type", String)
], FailedWbsSelfEvaluationByProjectDto.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440015',
    }),
    __metadata("design:type", String)
], FailedWbsSelfEvaluationByProjectDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패 이유',
        example: '평가 내용과 점수가 입력되지 않았습니다.',
    }),
    __metadata("design:type", String)
], FailedWbsSelfEvaluationByProjectDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용 (입력된 경우)',
        example: '',
    }),
    __metadata("design:type", String)
], FailedWbsSelfEvaluationByProjectDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (입력된 경우)',
        example: null,
    }),
    __metadata("design:type", Number)
], FailedWbsSelfEvaluationByProjectDto.prototype, "selfEvaluationScore", void 0);
class SubmitWbsSelfEvaluationsByProjectResponseDto {
    submittedCount;
    failedCount;
    totalCount;
    completedEvaluations;
    failedEvaluations;
}
exports.SubmitWbsSelfEvaluationsByProjectResponseDto = SubmitWbsSelfEvaluationsByProjectResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '제출된 평가 개수',
        example: 2,
    }),
    __metadata("design:type", Number)
], SubmitWbsSelfEvaluationsByProjectResponseDto.prototype, "submittedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '제출 실패한 평가 개수',
        example: 1,
    }),
    __metadata("design:type", Number)
], SubmitWbsSelfEvaluationsByProjectResponseDto.prototype, "failedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 평가 개수',
        example: 3,
    }),
    __metadata("design:type", Number)
], SubmitWbsSelfEvaluationsByProjectResponseDto.prototype, "totalCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '제출된 평가 상세 정보',
        type: [SubmittedWbsSelfEvaluationByProjectDetailDto],
        example: [
            {
                evaluationId: '550e8400-e29b-41d4-a716-446655440001',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
                selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
                selfEvaluationScore: 4,
                performanceResult: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
                submittedToManagerAt: '2024-01-15T09:30:00Z',
            },
        ],
    }),
    __metadata("design:type", Array)
], SubmitWbsSelfEvaluationsByProjectResponseDto.prototype, "completedEvaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '제출 실패한 평가 상세 정보 (비어있으면 모든 평가가 성공)',
        type: [FailedWbsSelfEvaluationByProjectDto],
        example: [
            {
                evaluationId: '550e8400-e29b-41d4-a716-446655440005',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440015',
                reason: '평가 내용과 점수가 입력되지 않았습니다.',
                selfEvaluationContent: '',
                selfEvaluationScore: null,
            },
        ],
    }),
    __metadata("design:type", Array)
], SubmitWbsSelfEvaluationsByProjectResponseDto.prototype, "failedEvaluations", void 0);
class ResetWbsSelfEvaluationByProjectDetailDto {
    evaluationId;
    wbsItemId;
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
    wasSubmittedToManager;
}
exports.ResetWbsSelfEvaluationByProjectDetailDto = ResetWbsSelfEvaluationByProjectDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], ResetWbsSelfEvaluationByProjectDetailDto.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440010',
    }),
    __metadata("design:type", String)
], ResetWbsSelfEvaluationByProjectDetailDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 내용',
        example: '이번 분기 목표를 성공적으로 달성했습니다.',
    }),
    __metadata("design:type", String)
], ResetWbsSelfEvaluationByProjectDetailDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
        example: 100,
    }),
    __metadata("design:type", Number)
], ResetWbsSelfEvaluationByProjectDetailDto.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 입력 (실제 달성한 성과 및 결과)',
        example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
    }),
    __metadata("design:type", String)
], ResetWbsSelfEvaluationByProjectDetailDto.prototype, "performanceResult", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화 전 관리자에게 제출 상태였는지 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ResetWbsSelfEvaluationByProjectDetailDto.prototype, "wasSubmittedToManager", void 0);
class FailedResetWbsSelfEvaluationByProjectDto {
    evaluationId;
    wbsItemId;
    reason;
}
exports.FailedResetWbsSelfEvaluationByProjectDto = FailedResetWbsSelfEvaluationByProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440005',
    }),
    __metadata("design:type", String)
], FailedResetWbsSelfEvaluationByProjectDto.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440015',
    }),
    __metadata("design:type", String)
], FailedResetWbsSelfEvaluationByProjectDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패 이유',
        example: '데이터베이스 제약 조건 위반으로 초기화에 실패했습니다.',
    }),
    __metadata("design:type", String)
], FailedResetWbsSelfEvaluationByProjectDto.prototype, "reason", void 0);
class ResetWbsSelfEvaluationsByProjectResponseDto {
    resetCount;
    failedCount;
    totalCount;
    resetEvaluations;
    failedResets;
}
exports.ResetWbsSelfEvaluationsByProjectResponseDto = ResetWbsSelfEvaluationsByProjectResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화된 평가 개수',
        example: 2,
    }),
    __metadata("design:type", Number)
], ResetWbsSelfEvaluationsByProjectResponseDto.prototype, "resetCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화 실패한 평가 개수',
        example: 1,
    }),
    __metadata("design:type", Number)
], ResetWbsSelfEvaluationsByProjectResponseDto.prototype, "failedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 평가 개수',
        example: 3,
    }),
    __metadata("design:type", Number)
], ResetWbsSelfEvaluationsByProjectResponseDto.prototype, "totalCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화된 평가 상세 정보',
        type: [ResetWbsSelfEvaluationByProjectDetailDto],
        example: [
            {
                evaluationId: '550e8400-e29b-41d4-a716-446655440001',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
                selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
                selfEvaluationScore: 4,
                performanceResult: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
                wasCompleted: true,
            },
        ],
    }),
    __metadata("design:type", Array)
], ResetWbsSelfEvaluationsByProjectResponseDto.prototype, "resetEvaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화 실패한 평가 정보 (비어있으면 모든 초기화 성공)',
        type: [FailedResetWbsSelfEvaluationByProjectDto],
        example: [
            {
                evaluationId: '550e8400-e29b-41d4-a716-446655440005',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440015',
                reason: '데이터베이스 제약 조건 위반으로 초기화에 실패했습니다.',
            },
        ],
    }),
    __metadata("design:type", Array)
], ResetWbsSelfEvaluationsByProjectResponseDto.prototype, "failedResets", void 0);
class ClearedWbsSelfEvaluationDetailDto {
    id;
    wbsItemId;
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
}
exports.ClearedWbsSelfEvaluationDetailDto = ClearedWbsSelfEvaluationDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ClearedWbsSelfEvaluationDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440010',
    }),
    __metadata("design:type", String)
], ClearedWbsSelfEvaluationDetailDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '초기화된 자기평가 내용',
        example: '',
    }),
    __metadata("design:type", String)
], ClearedWbsSelfEvaluationDetailDto.prototype, "selfEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '초기화된 자기평가 점수',
        example: 1,
    }),
    __metadata("design:type", Number)
], ClearedWbsSelfEvaluationDetailDto.prototype, "selfEvaluationScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화된 성과 입력 (빈 문자열)',
        example: '',
    }),
    __metadata("design:type", String)
], ClearedWbsSelfEvaluationDetailDto.prototype, "performanceResult", void 0);
class ClearAllWbsSelfEvaluationsResponseDto {
    employeeId;
    periodId;
    clearedCount;
    clearedEvaluations;
}
exports.ClearAllWbsSelfEvaluationsResponseDto = ClearAllWbsSelfEvaluationsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ClearAllWbsSelfEvaluationsResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], ClearAllWbsSelfEvaluationsResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '내용이 초기화된 평가 개수',
        example: 5,
    }),
    __metadata("design:type", Number)
], ClearAllWbsSelfEvaluationsResponseDto.prototype, "clearedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화된 평가 상세 정보',
        type: [ClearedWbsSelfEvaluationDetailDto],
        example: [
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
                selfEvaluationContent: '',
                selfEvaluationScore: 1,
                performanceResult: '',
            },
        ],
    }),
    __metadata("design:type", Array)
], ClearAllWbsSelfEvaluationsResponseDto.prototype, "clearedEvaluations", void 0);
class ClearWbsSelfEvaluationsByProjectResponseDto {
    employeeId;
    periodId;
    projectId;
    clearedCount;
    clearedEvaluations;
}
exports.ClearWbsSelfEvaluationsByProjectResponseDto = ClearWbsSelfEvaluationsByProjectResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ClearWbsSelfEvaluationsByProjectResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], ClearWbsSelfEvaluationsByProjectResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    __metadata("design:type", String)
], ClearWbsSelfEvaluationsByProjectResponseDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '내용이 초기화된 평가 개수',
        example: 3,
    }),
    __metadata("design:type", Number)
], ClearWbsSelfEvaluationsByProjectResponseDto.prototype, "clearedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '초기화된 평가 상세 정보',
        type: [ClearedWbsSelfEvaluationDetailDto],
        example: [
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
                selfEvaluationContent: '',
                selfEvaluationScore: 1,
                performanceResult: '',
            },
        ],
    }),
    __metadata("design:type", Array)
], ClearWbsSelfEvaluationsByProjectResponseDto.prototype, "clearedEvaluations", void 0);
//# sourceMappingURL=wbs-self-evaluation.dto.js.map