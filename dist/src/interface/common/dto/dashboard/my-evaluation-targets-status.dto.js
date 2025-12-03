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
exports.MyEvaluationTargetStatusResponseDto = exports.MyTargetSelfEvaluationDto = exports.PerformanceInputDto = exports.SetupStatusDto = exports.MyTargetEvaluationLineDto = exports.MyTargetWbsCriteriaDto = exports.MyTargetEvaluationCriteriaDto = exports.MyTargetExclusionInfoDto = exports.MyDownwardEvaluationStatusDto = exports.MyEvaluationStatusDetailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class MyEvaluationStatusDetailDto {
    status;
    assignedWbsCount;
    completedEvaluationCount;
    totalScore;
    grade;
    primaryEvaluationViewed;
}
exports.MyEvaluationStatusDetailDto = MyEvaluationStatusDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 상태 (할당수 = 완료수 = 0: none, 할당수 > 완료수: in_progress, 할당수 = 완료수 > 0: complete)',
        enum: ['none', 'in_progress', 'complete'],
        example: 'in_progress',
    }),
    __metadata("design:type", String)
], MyEvaluationStatusDetailDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], MyEvaluationStatusDetailDto.prototype, "assignedWbsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], MyEvaluationStatusDetailDto.prototype, "completedEvaluationCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '가중치 기반 하향평가 총점 (0-100점)',
        example: 85.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MyEvaluationStatusDetailDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 등급 기준에 따른 하향평가 등급 (예: S, A, B, C, D, F 등)',
        example: 'B',
        nullable: true,
    }),
    __metadata("design:type", Object)
], MyEvaluationStatusDetailDto.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '2차 평가자가 1차평가 제출을 확인했는지 여부 (2차 평가자인 경우에만 제공)',
        example: false,
        nullable: true,
    }),
    __metadata("design:type", Boolean)
], MyEvaluationStatusDetailDto.prototype, "primaryEvaluationViewed", void 0);
class MyDownwardEvaluationStatusDto {
    isPrimary;
    isSecondary;
    status;
    primaryStatus;
    secondaryStatus;
}
exports.MyDownwardEvaluationStatusDto = MyDownwardEvaluationStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], MyDownwardEvaluationStatusDto.prototype, "isPrimary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], MyDownwardEvaluationStatusDto.prototype, "isSecondary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차와 2차 평가의 통합 상태 (none, in_progress, complete)',
        enum: ['none', 'in_progress', 'complete'],
        example: 'in_progress',
    }),
    __metadata("design:type", String)
], MyDownwardEvaluationStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '1차 평가 현황 (1차 평가자인 경우에만 제공)',
        type: () => MyEvaluationStatusDetailDto,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MyDownwardEvaluationStatusDto.prototype, "primaryStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '2차 평가 현황 (2차 평가자인 경우에만 제공)',
        type: () => MyEvaluationStatusDetailDto,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MyDownwardEvaluationStatusDto.prototype, "secondaryStatus", void 0);
class MyTargetExclusionInfoDto {
    isExcluded;
    excludeReason;
    excludedAt;
}
exports.MyTargetExclusionInfoDto = MyTargetExclusionInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 제외 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], MyTargetExclusionInfoDto.prototype, "isExcluded", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 사유',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MyTargetExclusionInfoDto.prototype, "excludeReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 처리 일시',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MyTargetExclusionInfoDto.prototype, "excludedAt", void 0);
class MyTargetEvaluationCriteriaDto {
    status;
    assignedProjectCount;
    assignedWbsCount;
}
exports.MyTargetEvaluationCriteriaDto = MyTargetEvaluationCriteriaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가항목 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], MyTargetEvaluationCriteriaDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 프로젝트 수',
        example: 2,
    }),
    __metadata("design:type", Number)
], MyTargetEvaluationCriteriaDto.prototype, "assignedProjectCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], MyTargetEvaluationCriteriaDto.prototype, "assignedWbsCount", void 0);
class MyTargetWbsCriteriaDto {
    status;
    wbsWithCriteriaCount;
}
exports.MyTargetWbsCriteriaDto = MyTargetWbsCriteriaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 평가기준 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], MyTargetWbsCriteriaDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준이 설정된 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], MyTargetWbsCriteriaDto.prototype, "wbsWithCriteriaCount", void 0);
class MyTargetEvaluationLineDto {
    status;
    hasPrimaryEvaluator;
    hasSecondaryEvaluator;
}
exports.MyTargetEvaluationLineDto = MyTargetEvaluationLineDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], MyTargetEvaluationLineDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PRIMARY 평가자 지정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], MyTargetEvaluationLineDto.prototype, "hasPrimaryEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SECONDARY 평가자 지정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], MyTargetEvaluationLineDto.prototype, "hasSecondaryEvaluator", void 0);
class SetupStatusDto {
    status;
}
exports.SetupStatusDto = SetupStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 설정 통합 상태 (evaluationCriteria, wbsCriteria 상태 + 제출/승인 상태 통합)',
        enum: [
            'none',
            'in_progress',
            'pending',
            'approved',
            'revision_requested',
            'revision_completed',
        ],
        example: 'approved',
    }),
    __metadata("design:type", String)
], SetupStatusDto.prototype, "status", void 0);
class PerformanceInputDto {
    status;
    totalWbsCount;
    inputCompletedCount;
}
exports.PerformanceInputDto = PerformanceInputDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성과 입력 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], PerformanceInputDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], PerformanceInputDto.prototype, "totalWbsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성과가 입력된 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], PerformanceInputDto.prototype, "inputCompletedCount", void 0);
class MyTargetSelfEvaluationDto {
    status;
    totalMappingCount;
    completedMappingCount;
    totalSelfEvaluations;
    submittedToEvaluatorCount;
    isSubmittedToEvaluator;
    submittedToManagerCount;
    isSubmittedToManager;
    totalScore;
    grade;
    viewedByPrimaryEvaluator;
    viewedBySecondaryEvaluator;
}
exports.MyTargetSelfEvaluationDto = MyTargetSelfEvaluationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 진행 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'in_progress',
    }),
    __metadata("design:type", String)
], MyTargetSelfEvaluationDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 WBS 자기평가 매핑 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], MyTargetSelfEvaluationDto.prototype, "totalMappingCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 WBS 자기평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], MyTargetSelfEvaluationDto.prototype, "completedMappingCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 WBS 자기평가 매핑 수 (totalMappingCount와 동일)',
        example: 5,
    }),
    __metadata("design:type", Number)
], MyTargetSelfEvaluationDto.prototype, "totalSelfEvaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자에게 제출된 자기평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], MyTargetSelfEvaluationDto.prototype, "submittedToEvaluatorCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 자기평가가 1차 평가자에게 제출되었는지 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], MyTargetSelfEvaluationDto.prototype, "isSubmittedToEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '관리자에게 제출된 자기평가 수',
        example: 2,
    }),
    __metadata("design:type", Number)
], MyTargetSelfEvaluationDto.prototype, "submittedToManagerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 자기평가가 관리자에게 제출되었는지 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], MyTargetSelfEvaluationDto.prototype, "isSubmittedToManager", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '가중치 기반 자기평가 총점 (0-100)',
        example: 85.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MyTargetSelfEvaluationDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 등급 기준에 따른 자기평가 등급 (예: S+, A-, B 등)',
        example: 'A-',
        nullable: true,
    }),
    __metadata("design:type", Object)
], MyTargetSelfEvaluationDto.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자가 제출된 자기평가를 확인했는지 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], MyTargetSelfEvaluationDto.prototype, "viewedByPrimaryEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자가 제출된 자기평가를 확인했는지 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], MyTargetSelfEvaluationDto.prototype, "viewedBySecondaryEvaluator", void 0);
class MyEvaluationTargetStatusResponseDto {
    employeeId;
    isEvaluationTarget;
    exclusionInfo;
    evaluationCriteria;
    wbsCriteria;
    evaluationLine;
    setup;
    performanceInput;
    myEvaluatorTypes;
    selfEvaluation;
    downwardEvaluation;
}
exports.MyEvaluationTargetStatusResponseDto = MyEvaluationTargetStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], MyEvaluationTargetStatusResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], MyEvaluationTargetStatusResponseDto.prototype, "isEvaluationTarget", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 제외 정보',
        type: () => MyTargetExclusionInfoDto,
    }),
    (0, class_transformer_1.Type)(() => MyTargetExclusionInfoDto),
    __metadata("design:type", MyTargetExclusionInfoDto)
], MyEvaluationTargetStatusResponseDto.prototype, "exclusionInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가항목 설정 정보',
        type: () => MyTargetEvaluationCriteriaDto,
    }),
    (0, class_transformer_1.Type)(() => MyTargetEvaluationCriteriaDto),
    __metadata("design:type", MyTargetEvaluationCriteriaDto)
], MyEvaluationTargetStatusResponseDto.prototype, "evaluationCriteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 평가기준 설정 정보',
        type: () => MyTargetWbsCriteriaDto,
    }),
    (0, class_transformer_1.Type)(() => MyTargetWbsCriteriaDto),
    __metadata("design:type", MyTargetWbsCriteriaDto)
], MyEvaluationTargetStatusResponseDto.prototype, "wbsCriteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 지정 정보',
        type: () => MyTargetEvaluationLineDto,
    }),
    (0, class_transformer_1.Type)(() => MyTargetEvaluationLineDto),
    __metadata("design:type", MyTargetEvaluationLineDto)
], MyEvaluationTargetStatusResponseDto.prototype, "evaluationLine", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 설정 통합 상태 (evaluationCriteria, wbsCriteria, evaluationLine 통합)',
        type: () => SetupStatusDto,
    }),
    (0, class_transformer_1.Type)(() => SetupStatusDto),
    __metadata("design:type", SetupStatusDto)
], MyEvaluationTargetStatusResponseDto.prototype, "setup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성과 입력 정보',
        type: () => PerformanceInputDto,
    }),
    (0, class_transformer_1.Type)(() => PerformanceInputDto),
    __metadata("design:type", PerformanceInputDto)
], MyEvaluationTargetStatusResponseDto.prototype, "performanceInput", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '내가 담당하는 평가자 유형 목록',
        example: ['PRIMARY'],
        isArray: true,
    }),
    __metadata("design:type", Array)
], MyEvaluationTargetStatusResponseDto.prototype, "myEvaluatorTypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 제출 상태',
        type: () => MyTargetSelfEvaluationDto,
    }),
    (0, class_transformer_1.Type)(() => MyTargetSelfEvaluationDto),
    __metadata("design:type", MyTargetSelfEvaluationDto)
], MyEvaluationTargetStatusResponseDto.prototype, "selfEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '내가 담당하는 하향평가 현황',
        type: () => MyDownwardEvaluationStatusDto,
    }),
    (0, class_transformer_1.Type)(() => MyDownwardEvaluationStatusDto),
    __metadata("design:type", MyDownwardEvaluationStatusDto)
], MyEvaluationTargetStatusResponseDto.prototype, "downwardEvaluation", void 0);
//# sourceMappingURL=my-evaluation-targets-status.dto.js.map