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
exports.AvailableProjectsResponseDto = exports.AvailableProjectInfoDto = exports.ProjectManagerInfoDto = exports.GetAvailableProjectsQueryDto = exports.ProjectAssignmentListResponseDto = exports.UnassignedEmployeesResponseDto = exports.GetUnassignedEmployeesQueryDto = exports.ProjectEmployeesResponseDto = exports.EmployeeProjectsResponseDto = exports.ProjectAssignmentDetailResponseDto = exports.ProjectInfoDto = exports.EmployeeInfoDto = exports.EvaluationPeriodInfoDto = exports.ProjectAssignmentResponseDto = exports.ProjectAssignmentFilterDto = exports.ChangeProjectAssignmentOrderByProjectDto = exports.CancelProjectAssignmentByProjectDto = exports.ChangeProjectAssignmentOrderBodyDto = exports.ChangeProjectAssignmentOrderQueryDto = exports.BulkCreateProjectAssignmentDto = exports.CreateProjectAssignmentDto = void 0;
const evaluation_project_assignment_types_1 = require("../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateProjectAssignmentDto {
    employeeId;
    projectId;
    periodId;
}
exports.CreateProjectAssignmentDto = CreateProjectAssignmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProjectAssignmentDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProjectAssignmentDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProjectAssignmentDto.prototype, "periodId", void 0);
class BulkCreateProjectAssignmentDto {
    assignments;
}
exports.BulkCreateProjectAssignmentDto = BulkCreateProjectAssignmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 할당 목록',
        type: [CreateProjectAssignmentDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: '할당 목록은 최소 1개 이상이어야 합니다.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateProjectAssignmentDto),
    __metadata("design:type", Array)
], BulkCreateProjectAssignmentDto.prototype, "assignments", void 0);
class ChangeProjectAssignmentOrderQueryDto {
    direction;
}
exports.ChangeProjectAssignmentOrderQueryDto = ChangeProjectAssignmentOrderQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이동 방향 (up: 위로, down: 아래로)',
        example: evaluation_project_assignment_types_1.OrderDirection.UP,
        enum: evaluation_project_assignment_types_1.OrderDirection,
        enumName: 'OrderDirection',
    }),
    (0, class_validator_1.IsEnum)(evaluation_project_assignment_types_1.OrderDirection, { message: '이동 방향은 up 또는 down이어야 합니다.' }),
    __metadata("design:type", String)
], ChangeProjectAssignmentOrderQueryDto.prototype, "direction", void 0);
class ChangeProjectAssignmentOrderBodyDto {
}
exports.ChangeProjectAssignmentOrderBodyDto = ChangeProjectAssignmentOrderBodyDto;
class CancelProjectAssignmentByProjectDto {
    employeeId;
    periodId;
}
exports.CancelProjectAssignmentByProjectDto = CancelProjectAssignmentByProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID (UUID 형식)',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CancelProjectAssignmentByProjectDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID (UUID 형식)',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CancelProjectAssignmentByProjectDto.prototype, "periodId", void 0);
class ChangeProjectAssignmentOrderByProjectDto {
    employeeId;
    periodId;
    direction;
}
exports.ChangeProjectAssignmentOrderByProjectDto = ChangeProjectAssignmentOrderByProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID (UUID 형식)',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeProjectAssignmentOrderByProjectDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID (UUID 형식)',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeProjectAssignmentOrderByProjectDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이동 방향 (up: 위로, down: 아래로)',
        example: evaluation_project_assignment_types_1.OrderDirection.UP,
        enum: evaluation_project_assignment_types_1.OrderDirection,
        enumName: 'OrderDirection',
    }),
    (0, class_validator_1.IsEnum)(evaluation_project_assignment_types_1.OrderDirection, { message: '이동 방향은 up 또는 down이어야 합니다.' }),
    __metadata("design:type", String)
], ChangeProjectAssignmentOrderByProjectDto.prototype, "direction", void 0);
class ProjectAssignmentFilterDto {
    employeeId;
    projectId;
    periodId;
    page = 1;
    limit = 10;
    orderBy = 'assignedDate';
    orderDirection = 'DESC';
}
exports.ProjectAssignmentFilterDto = ProjectAssignmentFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ProjectAssignmentFilterDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ProjectAssignmentFilterDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ProjectAssignmentFilterDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ProjectAssignmentFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 크기',
        example: 10,
        default: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], ProjectAssignmentFilterDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '정렬 기준',
        example: 'assignedDate',
        default: 'assignedDate',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjectAssignmentFilterDto.prototype, "orderBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '정렬 방향',
        example: 'DESC',
        default: 'DESC',
        enum: ['ASC', 'DESC'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], ProjectAssignmentFilterDto.prototype, "orderDirection", void 0);
class ProjectAssignmentResponseDto {
    id;
    employeeId;
    projectId;
    periodId;
    assignedDate;
    assignedBy;
    displayOrder;
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    version;
    project;
}
exports.ProjectAssignmentResponseDto = ProjectAssignmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
    }),
    __metadata("design:type", String)
], ProjectAssignmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], ProjectAssignmentResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], ProjectAssignmentResponseDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], ProjectAssignmentResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당일',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectAssignmentResponseDto.prototype, "assignedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당자 ID',
        example: 'admin',
    }),
    __metadata("design:type", String)
], ProjectAssignmentResponseDto.prototype, "assignedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '표시 순서 (같은 직원-평가기간 내에서의 순서)',
        example: 0,
    }),
    __metadata("design:type", Number)
], ProjectAssignmentResponseDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: '123e4567-e89b-12d3-a456-426614174004',
    }),
    __metadata("design:type", String)
], ProjectAssignmentResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: '123e4567-e89b-12d3-a456-426614174005',
    }),
    __metadata("design:type", String)
], ProjectAssignmentResponseDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectAssignmentResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectAssignmentResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], ProjectAssignmentResponseDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 정보',
        type: () => ProjectInfoDto,
    }),
    __metadata("design:type", Object)
], ProjectAssignmentResponseDto.prototype, "project", void 0);
class EvaluationPeriodInfoDto {
    id;
    name;
    startDate;
    endDate;
    status;
    description;
}
exports.EvaluationPeriodInfoDto = EvaluationPeriodInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간명',
        example: '2024년 상반기 평가',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시작일',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodInfoDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '종료일',
        example: '2024-06-30T23:59:59.999Z',
        required: false,
    }),
    __metadata("design:type", Date)
], EvaluationPeriodInfoDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상태',
        example: 'ACTIVE',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '설명',
        example: '2024년 상반기 직원 평가를 진행합니다.',
        required: false,
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "description", void 0);
class EmployeeInfoDto {
    id;
    employeeNumber;
    name;
    email;
    phoneNumber;
    status;
    departmentId;
    departmentName;
}
exports.EmployeeInfoDto = EmployeeInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사번',
        example: 'EMP001',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'hong@company.com',
        required: false,
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전화번호',
        example: '010-1234-5678',
        required: false,
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상태',
        example: 'ACTIVE',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 ID',
        example: 'DEPT001',
        required: false,
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서명',
        example: '개발팀',
        required: false,
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "departmentName", void 0);
class ProjectInfoDto {
    id;
    name;
    projectCode;
    status;
    startDate;
    endDate;
    managerId;
}
exports.ProjectInfoDto = ProjectInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], ProjectInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트명',
        example: '루미르 통합 포털 개발',
    }),
    __metadata("design:type", String)
], ProjectInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 코드',
        example: 'PROJ001',
    }),
    __metadata("design:type", String)
], ProjectInfoDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상태',
        example: 'ACTIVE',
    }),
    __metadata("design:type", String)
], ProjectInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시작일',
        example: '2024-01-01T00:00:00.000Z',
        required: false,
    }),
    __metadata("design:type", Date)
], ProjectInfoDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '종료일',
        example: '2024-12-31T23:59:59.999Z',
        required: false,
    }),
    __metadata("design:type", Date)
], ProjectInfoDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 매니저 ID',
        example: '123e4567-e89b-12d3-a456-426614174005',
        required: false,
    }),
    __metadata("design:type", String)
], ProjectInfoDto.prototype, "managerId", void 0);
class ProjectAssignmentDetailResponseDto {
    id;
    assignedDate;
    createdAt;
    updatedAt;
    deletedAt;
    createdBy;
    updatedBy;
    version;
    evaluationPeriod;
    employee;
    project;
    assignedBy;
}
exports.ProjectAssignmentDetailResponseDto = ProjectAssignmentDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
    }),
    __metadata("design:type", String)
], ProjectAssignmentDetailResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당일',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectAssignmentDetailResponseDto.prototype, "assignedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectAssignmentDetailResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectAssignmentDetailResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제일시',
        example: null,
        required: false,
    }),
    __metadata("design:type", Date)
], ProjectAssignmentDetailResponseDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성자 ID',
        example: '123e4567-e89b-12d3-a456-426614174004',
        required: false,
    }),
    __metadata("design:type", String)
], ProjectAssignmentDetailResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정자 ID',
        example: '123e4567-e89b-12d3-a456-426614174005',
        required: false,
    }),
    __metadata("design:type", String)
], ProjectAssignmentDetailResponseDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], ProjectAssignmentDetailResponseDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 정보',
        type: EvaluationPeriodInfoDto,
    }),
    __metadata("design:type", Object)
], ProjectAssignmentDetailResponseDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 정보',
        type: EmployeeInfoDto,
    }),
    __metadata("design:type", Object)
], ProjectAssignmentDetailResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 정보',
        type: ProjectInfoDto,
    }),
    __metadata("design:type", Object)
], ProjectAssignmentDetailResponseDto.prototype, "project", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '할당자 정보',
        type: EmployeeInfoDto,
    }),
    __metadata("design:type", Object)
], ProjectAssignmentDetailResponseDto.prototype, "assignedBy", void 0);
class EmployeeProjectsResponseDto {
    projects;
}
exports.EmployeeProjectsResponseDto = EmployeeProjectsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 프로젝트 목록',
        type: [ProjectInfoDto],
    }),
    __metadata("design:type", Array)
], EmployeeProjectsResponseDto.prototype, "projects", void 0);
class ProjectEmployeesResponseDto {
    employees;
}
exports.ProjectEmployeesResponseDto = ProjectEmployeesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 직원 목록',
        type: [EmployeeInfoDto],
    }),
    __metadata("design:type", Array)
], ProjectEmployeesResponseDto.prototype, "employees", void 0);
class GetUnassignedEmployeesQueryDto {
    periodId;
    projectId;
}
exports.GetUnassignedEmployeesQueryDto = GetUnassignedEmployeesQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'periodId는 필수 항목입니다.' }),
    (0, class_validator_1.IsUUID)('4', { message: 'periodId는 올바른 UUID 형식이어야 합니다.' }),
    __metadata("design:type", String)
], GetUnassignedEmployeesQueryDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 ID (선택적)',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'projectId는 올바른 UUID 형식이어야 합니다.' }),
    __metadata("design:type", String)
], GetUnassignedEmployeesQueryDto.prototype, "projectId", void 0);
class UnassignedEmployeesResponseDto {
    periodId;
    projectId;
    employees;
}
exports.UnassignedEmployeesResponseDto = UnassignedEmployeesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], UnassignedEmployeesResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID (선택적)',
        example: '550e8400-e29b-41d4-a716-446655440001',
        required: false,
    }),
    __metadata("design:type", String)
], UnassignedEmployeesResponseDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당되지 않은 직원 목록',
        type: [EmployeeInfoDto],
    }),
    __metadata("design:type", Array)
], UnassignedEmployeesResponseDto.prototype, "employees", void 0);
class ProjectAssignmentListResponseDto {
    items;
    total;
    page;
    limit;
    totalPages;
}
exports.ProjectAssignmentListResponseDto = ProjectAssignmentListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 할당 목록',
        type: [ProjectAssignmentResponseDto],
    }),
    __metadata("design:type", Array)
], ProjectAssignmentListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 개수',
        example: 100,
    }),
    __metadata("design:type", Number)
], ProjectAssignmentListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지 번호',
        example: 1,
    }),
    __metadata("design:type", Number)
], ProjectAssignmentListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지 크기',
        example: 10,
    }),
    __metadata("design:type", Number)
], ProjectAssignmentListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 페이지 수',
        example: 10,
    }),
    __metadata("design:type", Number)
], ProjectAssignmentListResponseDto.prototype, "totalPages", void 0);
class GetAvailableProjectsQueryDto {
    periodId;
    status;
    search;
    page = 1;
    limit = 20;
    sortBy = 'name';
    sortOrder = 'ASC';
}
exports.GetAvailableProjectsQueryDto = GetAvailableProjectsQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'periodId는 필수 항목입니다.' }),
    (0, class_validator_1.IsUUID)('4', { message: 'periodId는 올바른 UUID 형식이어야 합니다.' }),
    __metadata("design:type", String)
], GetAvailableProjectsQueryDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 상태 필터',
        example: 'ACTIVE',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetAvailableProjectsQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '검색어 (프로젝트명, 프로젝트코드, 매니저명으로 검색)',
        example: '루미르',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetAvailableProjectsQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호',
        example: 1,
        default: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1, { message: '페이지 번호는 1 이상이어야 합니다.' }),
    __metadata("design:type", Number)
], GetAvailableProjectsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 크기',
        example: 20,
        default: 20,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1, { message: '페이지 크기는 1 이상이어야 합니다.' }),
    __metadata("design:type", Number)
], GetAvailableProjectsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '정렬 기준',
        example: 'name',
        enum: ['name', 'projectCode', 'startDate', 'endDate', 'managerName'],
        default: 'name',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['name', 'projectCode', 'startDate', 'endDate', 'managerName'], {
        message: '정렬 기준은 name, projectCode, startDate, endDate, managerName 중 하나여야 합니다.',
    }),
    __metadata("design:type", String)
], GetAvailableProjectsQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '정렬 방향',
        example: 'ASC',
        enum: ['ASC', 'DESC'],
        default: 'ASC',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], GetAvailableProjectsQueryDto.prototype, "sortOrder", void 0);
class ProjectManagerInfoDto {
    managerId;
    employeeId;
    name;
    email;
    phoneNumber;
    departmentName;
}
exports.ProjectManagerInfoDto = ProjectManagerInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 ID (SSO의 직원 ID)',
        example: '123e4567-e89b-12d3-a456-426614174005',
    }),
    __metadata("design:type", String)
], ProjectManagerInfoDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '로컬 Employee ID (로컬 DB의 직원 ID)',
        example: '234e5678-f90c-23d4-b567-537725285111',
    }),
    __metadata("design:type", String)
], ProjectManagerInfoDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 이름',
        example: '김매니저',
    }),
    __metadata("design:type", String)
], ProjectManagerInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 이메일',
        example: 'manager@company.com',
        required: false,
    }),
    __metadata("design:type", String)
], ProjectManagerInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 전화번호',
        example: '010-1234-5678',
        required: false,
    }),
    __metadata("design:type", String)
], ProjectManagerInfoDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 부서명',
        example: '개발팀',
        required: false,
    }),
    __metadata("design:type", String)
], ProjectManagerInfoDto.prototype, "departmentName", void 0);
class AvailableProjectInfoDto {
    id;
    name;
    projectCode;
    status;
    startDate;
    endDate;
    manager;
}
exports.AvailableProjectInfoDto = AvailableProjectInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], AvailableProjectInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트명',
        example: '루미르 통합 포털 개발',
    }),
    __metadata("design:type", String)
], AvailableProjectInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 코드',
        example: 'PROJ001',
        required: false,
    }),
    __metadata("design:type", String)
], AvailableProjectInfoDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상태',
        example: 'ACTIVE',
    }),
    __metadata("design:type", String)
], AvailableProjectInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시작일',
        example: '2024-01-01T00:00:00.000Z',
        required: false,
    }),
    __metadata("design:type", Date)
], AvailableProjectInfoDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '종료일',
        example: '2024-12-31T23:59:59.999Z',
        required: false,
    }),
    __metadata("design:type", Date)
], AvailableProjectInfoDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 정보',
        type: ProjectManagerInfoDto,
    }),
    __metadata("design:type", Object)
], AvailableProjectInfoDto.prototype, "manager", void 0);
class AvailableProjectsResponseDto {
    periodId;
    projects;
    total;
    page;
    limit;
    totalPages;
    search;
    sortBy;
    sortOrder;
}
exports.AvailableProjectsResponseDto = AvailableProjectsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], AvailableProjectsResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당 가능한 프로젝트 목록',
        type: [AvailableProjectInfoDto],
    }),
    __metadata("design:type", Array)
], AvailableProjectsResponseDto.prototype, "projects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 개수',
        example: 15,
    }),
    __metadata("design:type", Number)
], AvailableProjectsResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지 번호',
        example: 1,
    }),
    __metadata("design:type", Number)
], AvailableProjectsResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지 크기',
        example: 20,
    }),
    __metadata("design:type", Number)
], AvailableProjectsResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 페이지 수',
        example: 1,
    }),
    __metadata("design:type", Number)
], AvailableProjectsResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '검색어',
        example: '루미르',
        required: false,
    }),
    __metadata("design:type", String)
], AvailableProjectsResponseDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '정렬 기준',
        example: 'name',
    }),
    __metadata("design:type", String)
], AvailableProjectsResponseDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '정렬 방향',
        example: 'ASC',
    }),
    __metadata("design:type", String)
], AvailableProjectsResponseDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=project-assignment.dto.js.map