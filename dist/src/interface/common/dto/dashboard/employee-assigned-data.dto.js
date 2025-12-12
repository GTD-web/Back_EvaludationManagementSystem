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
exports.EvaluatorAssignedEmployeesDataResponseDto = exports.EvaluateeAssignedDataDto = exports.EmployeeAssignedDataResponseDto = exports.AssignedProjectWithWbsDto = exports.AssignmentSummaryDto = exports.CriteriaSubmissionInfoDto = exports.SelfEvaluationSummaryDto = exports.SecondaryDownwardEvaluationDto = exports.SecondaryEvaluatorDto = exports.EvaluationScoreDto = exports.ProjectManagerDto = exports.AssignedWbsInfoDto = exports.WbsDownwardEvaluationDto = exports.DeliverableInfoDto = exports.WbsPerformanceDto = exports.WbsEvaluationCriterionDto = exports.EmployeeInfoDto = exports.EvaluationPeriodInfoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class EvaluationPeriodInfoDto {
    id;
    name;
    startDate;
    status;
    currentPhase;
    criteriaSettingEnabled;
    selfEvaluationSettingEnabled;
    finalEvaluationSettingEnabled;
    maxSelfEvaluationRate;
    endDate;
    description;
}
exports.EvaluationPeriodInfoDto = EvaluationPeriodInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간명',
        example: '2024년 상반기 인사평가',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시작일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodInfoDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 상태',
        type: 'string',
        example: 'active',
        enum: ['waiting', 'active', 'completed', 'cancelled'],
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 평가 단계',
        type: 'string',
        example: 'performance',
        enum: ['waiting', 'evaluation-setup', 'performance', 'self-evaluation', 'peer-evaluation', 'closure'],
        nullable: true,
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "currentPhase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기준 설정 수동 허용 여부',
        type: 'boolean',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodInfoDto.prototype, "criteriaSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기 평가 설정 수동 허용 여부',
        type: 'boolean',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodInfoDto.prototype, "selfEvaluationSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향/동료평가 설정 수동 허용 여부',
        type: 'boolean',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodInfoDto.prototype, "finalEvaluationSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 달성률 최대값 (%)',
        example: 120,
        type: 'number',
    }),
    __metadata("design:type", Number)
], EvaluationPeriodInfoDto.prototype, "maxSelfEvaluationRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '종료일',
        type: 'string',
        format: 'date-time',
        example: '2024-06-30T23:59:59.000Z',
        nullable: true,
    }),
    __metadata("design:type", Date)
], EvaluationPeriodInfoDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 설명',
        type: 'string',
        example: '2024년 상반기 종합 인사평가 기간입니다.',
        nullable: true,
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "description", void 0);
class EmployeeInfoDto {
    id;
    employeeNumber;
    name;
    email;
    phoneNumber;
    departmentId;
    departmentName;
    status;
    hireDate;
}
exports.EmployeeInfoDto = EmployeeInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 번호',
        example: 'EMP-2024-001',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원명',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'hong.gildong@company.com',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전화번호',
        example: '010-1234-5678',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 ID',
        example: 'DEPT-001',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서명',
        example: '개발팀',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 상태',
        enum: ['재직중', '휴직중', '퇴사'],
        example: '재직중',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '입사일',
        type: 'string',
        format: 'date',
        example: '2024-01-01',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeInfoDto.prototype, "hireDate", void 0);
class WbsEvaluationCriterionDto {
    criterionId;
    criteria;
    importance;
    createdAt;
}
exports.WbsEvaluationCriterionDto = WbsEvaluationCriterionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 ID',
        example: '123e4567-e89b-12d3-a456-426614174012',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriterionDto.prototype, "criterionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 내용',
        example: '계획된 일정 내에 작업을 완료하고 품질 기준을 충족함',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriterionDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '중요도 (1~10)',
        example: 5,
        minimum: 1,
        maximum: 10,
    }),
    __metadata("design:type", Number)
], WbsEvaluationCriterionDto.prototype, "importance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], WbsEvaluationCriterionDto.prototype, "createdAt", void 0);
class WbsPerformanceDto {
    performanceResult;
    score;
    isCompleted;
    completedAt;
}
exports.WbsPerformanceDto = WbsPerformanceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과 내용',
        example: 'ERD 40개 테이블 설계 완료, 정규화 3단계까지 적용',
        nullable: true,
    }),
    __metadata("design:type", String)
], WbsPerformanceDto.prototype, "performanceResult", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '성과달성률 점수 (0 ~ maxSelfEvaluationRate)',
        example: 100,
        nullable: true,
    }),
    __metadata("design:type", Number)
], WbsPerformanceDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], WbsPerformanceDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료일',
        type: 'string',
        format: 'date-time',
        example: '2024-03-15T14:30:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Date)
], WbsPerformanceDto.prototype, "completedAt", void 0);
class DeliverableInfoDto {
    id;
    name;
    description;
    type;
    filePath;
    employeeId;
    mappedDate;
    mappedBy;
    isActive;
    createdAt;
}
exports.DeliverableInfoDto = DeliverableInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '산출물 ID',
        example: '123e4567-e89b-12d3-a456-426614174020',
    }),
    __metadata("design:type", String)
], DeliverableInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '산출물명',
        example: 'ERD 설계서',
    }),
    __metadata("design:type", String)
], DeliverableInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '산출물 설명',
        example: '데이터베이스 스키마 설계 문서',
        nullable: true,
    }),
    __metadata("design:type", String)
], DeliverableInfoDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '산출물 유형',
        example: 'document',
        enum: ['document', 'code', 'design', 'report', 'presentation', 'other'],
    }),
    __metadata("design:type", String)
], DeliverableInfoDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '파일 경로',
        example: '/uploads/erd_schema_v1.pdf',
        nullable: true,
    }),
    __metadata("design:type", String)
], DeliverableInfoDto.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '담당 직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
        nullable: true,
    }),
    __metadata("design:type", String)
], DeliverableInfoDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '매핑일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-05T09:00:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Date)
], DeliverableInfoDto.prototype, "mappedDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '매핑자 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
        nullable: true,
    }),
    __metadata("design:type", String)
], DeliverableInfoDto.prototype, "mappedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활성 상태',
        example: true,
    }),
    __metadata("design:type", Boolean)
], DeliverableInfoDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-05T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], DeliverableInfoDto.prototype, "createdAt", void 0);
class WbsDownwardEvaluationDto {
    evaluatorId;
    evaluatorName;
    evaluationContent;
    score;
    isCompleted;
    submittedAt;
}
exports.WbsDownwardEvaluationDto = WbsDownwardEvaluationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
        nullable: true,
    }),
    __metadata("design:type", String)
], WbsDownwardEvaluationDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자명',
        example: '김평가',
        nullable: true,
    }),
    __metadata("design:type", String)
], WbsDownwardEvaluationDto.prototype, "evaluatorName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향평가 내용',
        example: '프로젝트를 훌륭하게 수행하였습니다.',
        nullable: true,
    }),
    __metadata("design:type", String)
], WbsDownwardEvaluationDto.prototype, "evaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향평가 점수 (1-5)',
        example: 5,
        nullable: true,
    }),
    __metadata("design:type", Number)
], WbsDownwardEvaluationDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 완료 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], WbsDownwardEvaluationDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '제출일',
        type: 'string',
        format: 'date-time',
        example: '2024-06-25T14:00:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Date)
], WbsDownwardEvaluationDto.prototype, "submittedAt", void 0);
class AssignedWbsInfoDto {
    wbsId;
    wbsName;
    wbsCode;
    weight;
    assignedAt;
    subProject;
    criteria;
    performance;
    primaryDownwardEvaluation;
    secondaryDownwardEvaluation;
    deliverables;
}
exports.AssignedWbsInfoDto = AssignedWbsInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS ID',
        example: '123e4567-e89b-12d3-a456-426614174011',
    }),
    __metadata("design:type", String)
], AssignedWbsInfoDto.prototype, "wbsId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS명',
        example: 'DB 스키마 설계',
    }),
    __metadata("design:type", String)
], AssignedWbsInfoDto.prototype, "wbsName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 코드',
        example: 'WBS-001',
    }),
    __metadata("design:type", String)
], AssignedWbsInfoDto.prototype, "wbsCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '가중치 (%)',
        example: 20,
    }),
    __metadata("design:type", Number)
], AssignedWbsInfoDto.prototype, "weight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '배정일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], AssignedWbsInfoDto.prototype, "assignedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '세부 프로젝트 (서브 프로젝트)',
        example: '모바일 앱 개발',
        nullable: true,
    }),
    __metadata("design:type", Object)
], AssignedWbsInfoDto.prototype, "subProject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS에 할당된 평가기준 목록',
        type: [WbsEvaluationCriterionDto],
    }),
    (0, class_transformer_1.Type)(() => WbsEvaluationCriterionDto),
    __metadata("design:type", Array)
], AssignedWbsInfoDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 성과 정보',
        type: WbsPerformanceDto,
        nullable: true,
    }),
    (0, class_transformer_1.Type)(() => WbsPerformanceDto),
    __metadata("design:type", Object)
], AssignedWbsInfoDto.prototype, "performance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 1차 하향평가 정보 (PRIMARY 평가자가 작성)',
        type: WbsDownwardEvaluationDto,
        nullable: true,
    }),
    (0, class_transformer_1.Type)(() => WbsDownwardEvaluationDto),
    __metadata("design:type", Object)
], AssignedWbsInfoDto.prototype, "primaryDownwardEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 2차 하향평가 정보 (SECONDARY 평가자가 작성)',
        type: WbsDownwardEvaluationDto,
        nullable: true,
    }),
    (0, class_transformer_1.Type)(() => WbsDownwardEvaluationDto),
    __metadata("design:type", Object)
], AssignedWbsInfoDto.prototype, "secondaryDownwardEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS에 연결된 산출물 목록',
        type: [DeliverableInfoDto],
    }),
    (0, class_transformer_1.Type)(() => DeliverableInfoDto),
    __metadata("design:type", Array)
], AssignedWbsInfoDto.prototype, "deliverables", void 0);
class ProjectManagerDto {
    id;
    name;
}
exports.ProjectManagerDto = ProjectManagerDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PM 직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174015',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PM 이름',
        example: '박프로',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "name", void 0);
class EvaluationScoreDto {
    totalScore;
    grade;
    isSubmitted;
}
exports.EvaluationScoreDto = EvaluationScoreDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총점 (0-100 범위, 미완료 시 null)',
        example: 75.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationScoreDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '등급 (S, A, B, C, D 등, 미완료 시 null)',
        example: 'C',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationScoreDto.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 하향평가가 제출되었는지 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationScoreDto.prototype, "isSubmitted", void 0);
class SecondaryEvaluatorDto {
    evaluatorId;
    evaluatorName;
    evaluatorEmployeeNumber;
    evaluatorEmail;
    assignedWbsCount;
    completedEvaluationCount;
    isSubmitted;
}
exports.SecondaryEvaluatorDto = SecondaryEvaluatorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '123e4567-e89b-12d3-a456-426614174015',
    }),
    __metadata("design:type", String)
], SecondaryEvaluatorDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 이름',
        example: '김평가',
    }),
    __metadata("design:type", String)
], SecondaryEvaluatorDto.prototype, "evaluatorName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 사번',
        example: 'EMP-001',
    }),
    __metadata("design:type", String)
], SecondaryEvaluatorDto.prototype, "evaluatorEmployeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 이메일',
        example: 'evaluator@example.com',
    }),
    __metadata("design:type", String)
], SecondaryEvaluatorDto.prototype, "evaluatorEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], SecondaryEvaluatorDto.prototype, "assignedWbsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], SecondaryEvaluatorDto.prototype, "completedEvaluationCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '해당 평가자의 모든 평가가 제출되었는지 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], SecondaryEvaluatorDto.prototype, "isSubmitted", void 0);
class SecondaryDownwardEvaluationDto {
    totalScore;
    grade;
    isSubmitted;
    evaluators;
}
exports.SecondaryDownwardEvaluationDto = SecondaryDownwardEvaluationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총점 (0-100 범위, 미완료 시 null)',
        example: 75.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryDownwardEvaluationDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '등급 (S, A, B, C, D 등, 미완료 시 null)',
        example: 'C',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryDownwardEvaluationDto.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 2차 평가자가 제출했는지 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SecondaryDownwardEvaluationDto.prototype, "isSubmitted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 목록',
        type: [SecondaryEvaluatorDto],
    }),
    (0, class_transformer_1.Type)(() => SecondaryEvaluatorDto),
    __metadata("design:type", Array)
], SecondaryDownwardEvaluationDto.prototype, "evaluators", void 0);
class SelfEvaluationSummaryDto {
    totalScore;
    grade;
    totalSelfEvaluations;
    submittedToEvaluatorCount;
    submittedToManagerCount;
    isSubmittedToEvaluator;
    isSubmittedToManager;
}
exports.SelfEvaluationSummaryDto = SelfEvaluationSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총점 (0-100 범위, 미완료 시 null)',
        example: 75.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SelfEvaluationSummaryDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '등급 (S, A, B, C, D 등, 미완료 시 null)',
        example: 'C',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SelfEvaluationSummaryDto.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 WBS 자기평가 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], SelfEvaluationSummaryDto.prototype, "totalSelfEvaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자에게 제출된 자기평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], SelfEvaluationSummaryDto.prototype, "submittedToEvaluatorCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '관리자에게 제출된 자기평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], SelfEvaluationSummaryDto.prototype, "submittedToManagerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 자기평가가 1차 평가자에게 제출되었는지 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], SelfEvaluationSummaryDto.prototype, "isSubmittedToEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 자기평가가 관리자에게 제출되었는지 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SelfEvaluationSummaryDto.prototype, "isSubmittedToManager", void 0);
class CriteriaSubmissionInfoDto {
    isSubmitted;
    submittedAt;
    submittedBy;
}
exports.CriteriaSubmissionInfoDto = CriteriaSubmissionInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 제출 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], CriteriaSubmissionInfoDto.prototype, "isSubmitted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 제출 일시',
        type: 'string',
        format: 'date-time',
        example: '2024-03-15T14:30:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], CriteriaSubmissionInfoDto.prototype, "submittedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 제출자 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
        nullable: true,
    }),
    __metadata("design:type", Object)
], CriteriaSubmissionInfoDto.prototype, "submittedBy", void 0);
class AssignmentSummaryDto {
    totalProjects;
    totalWbs;
    completedPerformances;
    completedSelfEvaluations;
    selfEvaluation;
    primaryDownwardEvaluation;
    secondaryDownwardEvaluation;
    criteriaSubmission;
}
exports.AssignmentSummaryDto = AssignmentSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 총 프로젝트 수',
        example: 2,
    }),
    __metadata("design:type", Number)
], AssignmentSummaryDto.prototype, "totalProjects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 총 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], AssignmentSummaryDto.prototype, "totalWbs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 성과 입력 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], AssignmentSummaryDto.prototype, "completedPerformances", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 자기평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], AssignmentSummaryDto.prototype, "completedSelfEvaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 총점, 등급 및 제출 상태',
        type: SelfEvaluationSummaryDto,
    }),
    (0, class_transformer_1.Type)(() => SelfEvaluationSummaryDto),
    __metadata("design:type", SelfEvaluationSummaryDto)
], AssignmentSummaryDto.prototype, "selfEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 하향평가 총점 및 등급',
        type: EvaluationScoreDto,
    }),
    (0, class_transformer_1.Type)(() => EvaluationScoreDto),
    __metadata("design:type", EvaluationScoreDto)
], AssignmentSummaryDto.prototype, "primaryDownwardEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 하향평가 총점 및 등급 (평가자별 정보 포함)',
        type: SecondaryDownwardEvaluationDto,
    }),
    (0, class_transformer_1.Type)(() => SecondaryDownwardEvaluationDto),
    __metadata("design:type", SecondaryDownwardEvaluationDto)
], AssignmentSummaryDto.prototype, "secondaryDownwardEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 제출 상태',
        type: CriteriaSubmissionInfoDto,
    }),
    (0, class_transformer_1.Type)(() => CriteriaSubmissionInfoDto),
    __metadata("design:type", CriteriaSubmissionInfoDto)
], AssignmentSummaryDto.prototype, "criteriaSubmission", void 0);
class AssignedProjectWithWbsDto {
    projectId;
    projectName;
    projectCode;
    assignedAt;
    projectManager;
    wbsList;
}
exports.AssignedProjectWithWbsDto = AssignedProjectWithWbsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '123e4567-e89b-12d3-a456-426614174010',
    }),
    __metadata("design:type", String)
], AssignedProjectWithWbsDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트명',
        example: '신규 ERP 시스템 개발',
    }),
    __metadata("design:type", String)
], AssignedProjectWithWbsDto.prototype, "projectName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 코드',
        example: 'PROJ-2024-001',
    }),
    __metadata("design:type", String)
], AssignedProjectWithWbsDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '배정일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], AssignedProjectWithWbsDto.prototype, "assignedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 매니저 정보',
        type: ProjectManagerDto,
        nullable: true,
    }),
    (0, class_transformer_1.Type)(() => ProjectManagerDto),
    __metadata("design:type", Object)
], AssignedProjectWithWbsDto.prototype, "projectManager", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트에 할당된 WBS 목록',
        type: [AssignedWbsInfoDto],
    }),
    (0, class_transformer_1.Type)(() => AssignedWbsInfoDto),
    __metadata("design:type", Array)
], AssignedProjectWithWbsDto.prototype, "wbsList", void 0);
class EmployeeAssignedDataResponseDto {
    evaluationPeriod;
    employee;
    projects;
    summary;
}
exports.EmployeeAssignedDataResponseDto = EmployeeAssignedDataResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: EvaluationPeriodInfoDto,
    }),
    (0, class_transformer_1.Type)(() => EvaluationPeriodInfoDto),
    __metadata("design:type", EvaluationPeriodInfoDto)
], EmployeeAssignedDataResponseDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: EmployeeInfoDto,
    }),
    (0, class_transformer_1.Type)(() => EmployeeInfoDto),
    __metadata("design:type", EmployeeInfoDto)
], EmployeeAssignedDataResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트별 할당 정보 (WBS, 평가기준, 성과, 자기평가, 하향평가 포함)',
        type: [AssignedProjectWithWbsDto],
    }),
    (0, class_transformer_1.Type)(() => AssignedProjectWithWbsDto),
    __metadata("design:type", Array)
], EmployeeAssignedDataResponseDto.prototype, "projects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '데이터 요약 (프로젝트, WBS 개수, 완료 현황, 평가 점수 및 등급)',
        type: AssignmentSummaryDto,
    }),
    (0, class_transformer_1.Type)(() => AssignmentSummaryDto),
    __metadata("design:type", AssignmentSummaryDto)
], EmployeeAssignedDataResponseDto.prototype, "summary", void 0);
class EvaluateeAssignedDataDto {
    employee;
    projects;
    summary;
}
exports.EvaluateeAssignedDataDto = EvaluateeAssignedDataDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 정보',
        type: EmployeeInfoDto,
    }),
    (0, class_transformer_1.Type)(() => EmployeeInfoDto),
    __metadata("design:type", EmployeeInfoDto)
], EvaluateeAssignedDataDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 프로젝트 및 WBS 목록',
        type: [AssignedProjectWithWbsDto],
    }),
    (0, class_transformer_1.Type)(() => AssignedProjectWithWbsDto),
    __metadata("design:type", Array)
], EvaluateeAssignedDataDto.prototype, "projects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당 데이터 요약 (프로젝트, WBS 개수, 완료 현황, 평가 점수 및 등급)',
        type: AssignmentSummaryDto,
    }),
    (0, class_transformer_1.Type)(() => AssignmentSummaryDto),
    __metadata("design:type", AssignmentSummaryDto)
], EvaluateeAssignedDataDto.prototype, "summary", void 0);
class EvaluatorAssignedEmployeesDataResponseDto {
    evaluationPeriod;
    evaluator;
    evaluatee;
}
exports.EvaluatorAssignedEmployeesDataResponseDto = EvaluatorAssignedEmployeesDataResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: EvaluationPeriodInfoDto,
    }),
    (0, class_transformer_1.Type)(() => EvaluationPeriodInfoDto),
    __metadata("design:type", EvaluationPeriodInfoDto)
], EvaluatorAssignedEmployeesDataResponseDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 정보',
        type: EmployeeInfoDto,
    }),
    (0, class_transformer_1.Type)(() => EmployeeInfoDto),
    __metadata("design:type", EmployeeInfoDto)
], EvaluatorAssignedEmployeesDataResponseDto.prototype, "evaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 할당 정보 (평가기간 제외, 최상위에 이미 존재)',
        type: EvaluateeAssignedDataDto,
    }),
    (0, class_transformer_1.Type)(() => EvaluateeAssignedDataDto),
    __metadata("design:type", EvaluateeAssignedDataDto)
], EvaluatorAssignedEmployeesDataResponseDto.prototype, "evaluatee", void 0);
//# sourceMappingURL=employee-assigned-data.dto.js.map