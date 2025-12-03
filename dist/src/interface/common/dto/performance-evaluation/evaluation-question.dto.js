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
exports.UpdatePartLeaderQuestionSettingsDto = exports.PartLeaderQuestionSettingsResponseDto = exports.BatchSuccessResponseDto = exports.SuccessResponseDto = exports.QuestionGroupMappingResponseDto = exports.ReorderGroupQuestionsDto = exports.AddMultipleQuestionsToGroupDto = exports.AddQuestionToGroupDto = exports.EvaluationQuestionResponseDto = exports.UpdateEvaluationQuestionDto = exports.CreateEvaluationQuestionDto = exports.QuestionGroupResponseDto = exports.UpdateQuestionGroupDto = exports.CreateQuestionGroupDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateQuestionGroupDto {
    name;
    isDefault;
}
exports.CreateQuestionGroupDto = CreateQuestionGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '그룹명',
        example: '기본 평가 질문',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '기본 그룹 여부',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateQuestionGroupDto.prototype, "isDefault", void 0);
class UpdateQuestionGroupDto {
    name;
    isDefault;
}
exports.UpdateQuestionGroupDto = UpdateQuestionGroupDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '그룹명',
        example: '수정된 평가 질문',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuestionGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '기본 그룹 여부',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateQuestionGroupDto.prototype, "isDefault", void 0);
class QuestionGroupResponseDto {
    id;
    name;
    isDefault;
    isDeletable;
    createdAt;
    updatedAt;
}
exports.QuestionGroupResponseDto = QuestionGroupResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '그룹 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], QuestionGroupResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '그룹명',
        example: '기본 평가 질문',
    }),
    __metadata("design:type", String)
], QuestionGroupResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '기본 그룹 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], QuestionGroupResponseDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제 가능 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], QuestionGroupResponseDto.prototype, "isDeletable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], QuestionGroupResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], QuestionGroupResponseDto.prototype, "updatedAt", void 0);
class CreateEvaluationQuestionDto {
    text;
    minScore;
    maxScore;
    groupId;
    displayOrder;
}
exports.CreateEvaluationQuestionDto = CreateEvaluationQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 내용',
        example: '프로젝트 수행 능력은 어떠한가요?',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvaluationQuestionDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최소 점수',
        example: 1,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEvaluationQuestionDto.prototype, "minScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최대 점수',
        example: 5,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateEvaluationQuestionDto.prototype, "maxScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '그룹 ID (선택사항 - 제공 시 해당 그룹에 자동 추가)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEvaluationQuestionDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '표시 순서 (그룹 추가 시 사용, 생략 시 그룹의 마지막 순서로 자동 배치)',
        example: 1,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateEvaluationQuestionDto.prototype, "displayOrder", void 0);
class UpdateEvaluationQuestionDto {
    text;
    minScore;
    maxScore;
}
exports.UpdateEvaluationQuestionDto = UpdateEvaluationQuestionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '질문 내용',
        example: '업무 수행 능력은 어떠한가요?',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEvaluationQuestionDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최소 점수',
        example: 1,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateEvaluationQuestionDto.prototype, "minScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최대 점수',
        example: 5,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateEvaluationQuestionDto.prototype, "maxScore", void 0);
class EvaluationQuestionResponseDto {
    id;
    text;
    minScore;
    maxScore;
    createdAt;
    updatedAt;
}
exports.EvaluationQuestionResponseDto = EvaluationQuestionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EvaluationQuestionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 내용',
        example: '프로젝트 수행 능력은 어떠한가요?',
    }),
    __metadata("design:type", String)
], EvaluationQuestionResponseDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최소 점수',
        example: 1,
        nullable: true,
    }),
    __metadata("design:type", Number)
], EvaluationQuestionResponseDto.prototype, "minScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최대 점수',
        example: 5,
        nullable: true,
    }),
    __metadata("design:type", Number)
], EvaluationQuestionResponseDto.prototype, "maxScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationQuestionResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationQuestionResponseDto.prototype, "updatedAt", void 0);
class AddQuestionToGroupDto {
    groupId;
    questionId;
    displayOrder;
}
exports.AddQuestionToGroupDto = AddQuestionToGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '그룹 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddQuestionToGroupDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddQuestionToGroupDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '표시 순서 (생략 시 그룹의 마지막 순서로 자동 배치)',
        example: 1,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AddQuestionToGroupDto.prototype, "displayOrder", void 0);
class AddMultipleQuestionsToGroupDto {
    groupId;
    questionIds;
    startDisplayOrder;
}
exports.AddMultipleQuestionsToGroupDto = AddMultipleQuestionsToGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '그룹 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddMultipleQuestionsToGroupDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 ID 배열',
        example: [
            '123e4567-e89b-12d3-a456-426614174001',
            '123e4567-e89b-12d3-a456-426614174002',
            '123e4567-e89b-12d3-a456-426614174003',
        ],
        type: [String],
    }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], AddMultipleQuestionsToGroupDto.prototype, "questionIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작 표시 순서 (첫 질문부터 순차적으로 할당)',
        example: 1,
        minimum: 0,
        default: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AddMultipleQuestionsToGroupDto.prototype, "startDisplayOrder", void 0);
class ReorderGroupQuestionsDto {
    groupId;
    questionIds;
}
exports.ReorderGroupQuestionsDto = ReorderGroupQuestionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '그룹 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReorderGroupQuestionsDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 ID 배열 (배열 순서대로 displayOrder가 0부터 순차 할당됨)',
        example: [
            '123e4567-e89b-12d3-a456-426614174003',
            '123e4567-e89b-12d3-a456-426614174001',
            '123e4567-e89b-12d3-a456-426614174002',
        ],
        type: [String],
    }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], ReorderGroupQuestionsDto.prototype, "questionIds", void 0);
class QuestionGroupMappingResponseDto {
    id;
    groupId;
    questionId;
    displayOrder;
    group;
    question;
    createdAt;
    updatedAt;
}
exports.QuestionGroupMappingResponseDto = QuestionGroupMappingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매핑 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], QuestionGroupMappingResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '그룹 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], QuestionGroupMappingResponseDto.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], QuestionGroupMappingResponseDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '표시 순서',
        example: 1,
    }),
    __metadata("design:type", Number)
], QuestionGroupMappingResponseDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '그룹 정보',
        type: QuestionGroupResponseDto,
    }),
    __metadata("design:type", QuestionGroupResponseDto)
], QuestionGroupMappingResponseDto.prototype, "group", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '질문 정보',
        type: EvaluationQuestionResponseDto,
    }),
    __metadata("design:type", EvaluationQuestionResponseDto)
], QuestionGroupMappingResponseDto.prototype, "question", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], QuestionGroupMappingResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], QuestionGroupMappingResponseDto.prototype, "updatedAt", void 0);
class SuccessResponseDto {
    id;
    message;
}
exports.SuccessResponseDto = SuccessResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성/수정된 리소스 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], SuccessResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '응답 메시지',
        example: '성공적으로 처리되었습니다.',
    }),
    __metadata("design:type", String)
], SuccessResponseDto.prototype, "message", void 0);
class BatchSuccessResponseDto {
    ids;
    message;
    successCount;
    totalCount;
}
exports.BatchSuccessResponseDto = BatchSuccessResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성/수정된 리소스 ID 배열',
        example: [
            '123e4567-e89b-12d3-a456-426614174000',
            '123e4567-e89b-12d3-a456-426614174001',
        ],
        type: [String],
    }),
    __metadata("design:type", Array)
], BatchSuccessResponseDto.prototype, "ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '응답 메시지',
        example: '성공적으로 처리되었습니다.',
    }),
    __metadata("design:type", String)
], BatchSuccessResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 개수',
        example: 2,
    }),
    __metadata("design:type", Number)
], BatchSuccessResponseDto.prototype, "successCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 개수',
        example: 3,
    }),
    __metadata("design:type", Number)
], BatchSuccessResponseDto.prototype, "totalCount", void 0);
class PartLeaderQuestionSettingsResponseDto {
    group;
    questions;
}
exports.PartLeaderQuestionSettingsResponseDto = PartLeaderQuestionSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '파트장 질문 그룹 정보',
        type: QuestionGroupResponseDto,
    }),
    __metadata("design:type", QuestionGroupResponseDto)
], PartLeaderQuestionSettingsResponseDto.prototype, "group", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '파트장 질문 목록 (displayOrder 순)',
        type: [QuestionGroupMappingResponseDto],
    }),
    __metadata("design:type", Array)
], PartLeaderQuestionSettingsResponseDto.prototype, "questions", void 0);
class UpdatePartLeaderQuestionSettingsDto {
    questionIds;
}
exports.UpdatePartLeaderQuestionSettingsDto = UpdatePartLeaderQuestionSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '파트장 평가에 사용할 질문 ID 목록 (순서대로 적용)',
        type: [String],
        example: [
            '123e4567-e89b-12d3-a456-426614174000',
            '123e4567-e89b-12d3-a456-426614174001',
            '123e4567-e89b-12d3-a456-426614174002',
        ],
    }),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], UpdatePartLeaderQuestionSettingsDto.prototype, "questionIds", void 0);
//# sourceMappingURL=evaluation-question.dto.js.map