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
exports.EmployeePeriodAssignmentsResponseDto = exports.AssignedProjectDto = exports.AssignedWbsItemDto = exports.WbsEvaluationCriterionDto = exports.EvaluatorInfoDto = exports.ProjectManagerInfoDto = exports.SimplifiedEmployeeDto = exports.SimplifiedEvaluationPeriodDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class SimplifiedEvaluationPeriodDto {
    id;
    name;
    startDate;
    endDate;
    status;
}
exports.SimplifiedEvaluationPeriodDto = SimplifiedEvaluationPeriodDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], SimplifiedEvaluationPeriodDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간명',
        example: '2024년 상반기 평가',
    }),
    __metadata("design:type", String)
], SimplifiedEvaluationPeriodDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시작일',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], SimplifiedEvaluationPeriodDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '종료일',
        example: '2024-06-30T23:59:59.000Z',
        nullable: true,
    }),
    __metadata("design:type", Date)
], SimplifiedEvaluationPeriodDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 상태',
        example: 'active',
        enum: ['waiting', 'active', 'completed', 'cancelled'],
    }),
    __metadata("design:type", String)
], SimplifiedEvaluationPeriodDto.prototype, "status", void 0);
class SimplifiedEmployeeDto {
    id;
    name;
    employeeNumber;
}
exports.SimplifiedEmployeeDto = SimplifiedEmployeeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], SimplifiedEmployeeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원명',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], SimplifiedEmployeeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 번호',
        example: 'EMP-2024-001',
    }),
    __metadata("design:type", String)
], SimplifiedEmployeeDto.prototype, "employeeNumber", void 0);
class ProjectManagerInfoDto {
    id;
    name;
}
exports.ProjectManagerInfoDto = ProjectManagerInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 매니저 ID',
        example: '123e4567-e89b-12d3-a456-426614174004',
    }),
    __metadata("design:type", String)
], ProjectManagerInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 매니저 이름',
        example: '김상우',
    }),
    __metadata("design:type", String)
], ProjectManagerInfoDto.prototype, "name", void 0);
class EvaluatorInfoDto {
    evaluatorId;
    evaluatorName;
}
exports.EvaluatorInfoDto = EvaluatorInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '123e4567-e89b-12d3-a456-426614174005',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 이름',
        example: '김평가',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "evaluatorName", void 0);
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
        example: '123e4567-e89b-12d3-a456-426614174006',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriterionDto.prototype, "criterionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 내용',
        example: '프론트엔드 개발 품질 및 완성도',
    }),
    __metadata("design:type", String)
], WbsEvaluationCriterionDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '중요도 (1~10)',
        example: 8,
    }),
    __metadata("design:type", Number)
], WbsEvaluationCriterionDto.prototype, "importance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-15T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], WbsEvaluationCriterionDto.prototype, "createdAt", void 0);
class AssignedWbsItemDto {
    wbsId;
    wbsName;
    wbsCode;
    criteria;
    primaryDownwardEvaluation;
    secondaryDownwardEvaluation;
}
exports.AssignedWbsItemDto = AssignedWbsItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], AssignedWbsItemDto.prototype, "wbsId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS명',
        example: '프론트엔드 개발',
    }),
    __metadata("design:type", String)
], AssignedWbsItemDto.prototype, "wbsName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 코드',
        example: 'WBS-001-01',
    }),
    __metadata("design:type", String)
], AssignedWbsItemDto.prototype, "wbsCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 목록',
        type: [WbsEvaluationCriterionDto],
    }),
    (0, class_transformer_1.Type)(() => WbsEvaluationCriterionDto),
    __metadata("design:type", Array)
], AssignedWbsItemDto.prototype, "criteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자 정보',
        type: EvaluatorInfoDto,
        nullable: true,
    }),
    (0, class_transformer_1.Type)(() => EvaluatorInfoDto),
    __metadata("design:type", EvaluatorInfoDto)
], AssignedWbsItemDto.prototype, "primaryDownwardEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 정보',
        type: EvaluatorInfoDto,
        nullable: true,
    }),
    (0, class_transformer_1.Type)(() => EvaluatorInfoDto),
    __metadata("design:type", EvaluatorInfoDto)
], AssignedWbsItemDto.prototype, "secondaryDownwardEvaluation", void 0);
class AssignedProjectDto {
    projectId;
    projectName;
    projectCode;
    projectManager;
    wbsList;
}
exports.AssignedProjectDto = AssignedProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
    }),
    __metadata("design:type", String)
], AssignedProjectDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트명',
        example: '신규 ERP 시스템 개발',
    }),
    __metadata("design:type", String)
], AssignedProjectDto.prototype, "projectName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 코드',
        example: 'PROJ-2024-001',
    }),
    __metadata("design:type", String)
], AssignedProjectDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 매니저 정보',
        type: ProjectManagerInfoDto,
        nullable: true,
    }),
    (0, class_transformer_1.Type)(() => ProjectManagerInfoDto),
    __metadata("design:type", ProjectManagerInfoDto)
], AssignedProjectDto.prototype, "projectManager", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트에 할당된 WBS 목록',
        type: [AssignedWbsItemDto],
    }),
    (0, class_transformer_1.Type)(() => AssignedWbsItemDto),
    __metadata("design:type", Array)
], AssignedProjectDto.prototype, "wbsList", void 0);
class EmployeePeriodAssignmentsResponseDto {
    evaluationPeriod;
    employee;
    projects;
    totalProjects;
    totalWbs;
}
exports.EmployeePeriodAssignmentsResponseDto = EmployeePeriodAssignmentsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: SimplifiedEvaluationPeriodDto,
    }),
    (0, class_transformer_1.Type)(() => SimplifiedEvaluationPeriodDto),
    __metadata("design:type", SimplifiedEvaluationPeriodDto)
], EmployeePeriodAssignmentsResponseDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: SimplifiedEmployeeDto,
    }),
    (0, class_transformer_1.Type)(() => SimplifiedEmployeeDto),
    __metadata("design:type", SimplifiedEmployeeDto)
], EmployeePeriodAssignmentsResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 프로젝트 및 WBS 목록',
        type: [AssignedProjectDto],
    }),
    (0, class_transformer_1.Type)(() => AssignedProjectDto),
    __metadata("design:type", Array)
], EmployeePeriodAssignmentsResponseDto.prototype, "projects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 프로젝트 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], EmployeePeriodAssignmentsResponseDto.prototype, "totalProjects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 WBS 수',
        example: 12,
    }),
    __metadata("design:type", Number)
], EmployeePeriodAssignmentsResponseDto.prototype, "totalWbs", void 0);
//# sourceMappingURL=employee-period-assignments.dto.js.map