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
exports.UpdateWbsItemTitleDto = exports.CreateAndAssignWbsBetweenDto = exports.CreateAndAssignWbsDto = exports.ChangeWbsAssignmentOrderBodyDto = exports.ChangeWbsAssignmentOrderByWbsDto = exports.ChangeWbsAssignmentOrderQueryDto = exports.ResetWbsAssignmentsDto = exports.WbsAssignmentDetailResponseDto = exports.UnassignedWbsItemsResponseDto = exports.GetUnassignedWbsItemsDto = exports.WbsItemAssignmentsResponseDto = exports.ProjectWbsAssignmentsResponseDto = exports.EmployeeWbsAssignmentsResponseDto = exports.BulkCreateWbsAssignmentDto = exports.WbsAssignmentFilterDto = exports.CreateWbsAssignmentDto = exports.CancelWbsAssignmentByWbsDto = void 0;
const evaluation_wbs_assignment_types_1 = require("../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CancelWbsAssignmentByWbsDto {
    employeeId;
    projectId;
    periodId;
}
exports.CancelWbsAssignmentByWbsDto = CancelWbsAssignmentByWbsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID (UUID 형식)',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CancelWbsAssignmentByWbsDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID (UUID 형식)',
        example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CancelWbsAssignmentByWbsDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID (UUID 형식)',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CancelWbsAssignmentByWbsDto.prototype, "periodId", void 0);
class CreateWbsAssignmentDto {
    employeeId;
    wbsItemId;
    projectId;
    periodId;
}
exports.CreateWbsAssignmentDto = CreateWbsAssignmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWbsAssignmentDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWbsAssignmentDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWbsAssignmentDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWbsAssignmentDto.prototype, "periodId", void 0);
class WbsAssignmentFilterDto {
    periodId;
    employeeId;
    wbsItemId;
    projectId;
    page;
    limit;
    orderBy;
    orderDirection;
}
exports.WbsAssignmentFilterDto = WbsAssignmentFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WbsAssignmentFilterDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WbsAssignmentFilterDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WbsAssignmentFilterDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 ID',
        example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], WbsAssignmentFilterDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '페이지 번호', example: 1, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], WbsAssignmentFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '페이지 크기', example: 10, default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], WbsAssignmentFilterDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '정렬 기준', example: 'createdAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WbsAssignmentFilterDto.prototype, "orderBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '정렬 방향',
        enum: ['ASC', 'DESC'],
        example: 'DESC',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], WbsAssignmentFilterDto.prototype, "orderDirection", void 0);
class BulkCreateWbsAssignmentDto {
    assignments;
}
exports.BulkCreateWbsAssignmentDto = BulkCreateWbsAssignmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 할당 목록',
        type: [CreateWbsAssignmentDto],
        example: [
            {
                employeeId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
                assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
            },
            {
                employeeId: 'a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
                wbsItemId: 'b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
                projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
                assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
            },
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateWbsAssignmentDto),
    __metadata("design:type", Array)
], BulkCreateWbsAssignmentDto.prototype, "assignments", void 0);
class EmployeeWbsAssignmentsResponseDto {
    wbsAssignments;
}
exports.EmployeeWbsAssignmentsResponseDto = EmployeeWbsAssignmentsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 할당 목록',
        type: 'array',
        example: [
            {
                id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
                employeeId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
                assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
                createdAt: '2024-10-01T09:00:00Z',
                updatedAt: '2024-10-01T09:00:00Z',
            },
        ],
    }),
    __metadata("design:type", Array)
], EmployeeWbsAssignmentsResponseDto.prototype, "wbsAssignments", void 0);
class ProjectWbsAssignmentsResponseDto {
    wbsAssignments;
}
exports.ProjectWbsAssignmentsResponseDto = ProjectWbsAssignmentsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 할당 목록',
        type: 'array',
        example: [
            {
                id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
                employeeId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
                assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
                createdAt: '2024-10-01T09:00:00Z',
                updatedAt: '2024-10-01T09:00:00Z',
            },
        ],
    }),
    __metadata("design:type", Array)
], ProjectWbsAssignmentsResponseDto.prototype, "wbsAssignments", void 0);
class WbsItemAssignmentsResponseDto {
    wbsAssignments;
}
exports.WbsItemAssignmentsResponseDto = WbsItemAssignmentsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 할당 목록',
        type: 'array',
        example: [
            {
                id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
                employeeId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
                wbsItemId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                periodId: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
                assignedBy: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
                createdAt: '2024-10-01T09:00:00Z',
                updatedAt: '2024-10-01T09:00:00Z',
            },
        ],
    }),
    __metadata("design:type", Array)
], WbsItemAssignmentsResponseDto.prototype, "wbsAssignments", void 0);
class GetUnassignedWbsItemsDto {
    projectId;
    periodId;
    employeeId;
}
exports.GetUnassignedWbsItemsDto = GetUnassignedWbsItemsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID (필수)',
        example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'projectId는 필수입니다.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)('4', { message: 'projectId는 유효한 UUID 형식이어야 합니다.' }),
    __metadata("design:type", String)
], GetUnassignedWbsItemsDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID (필수)',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'periodId는 필수입니다.' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)('4', { message: 'periodId는 유효한 UUID 형식이어야 합니다.' }),
    __metadata("design:type", String)
], GetUnassignedWbsItemsDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 ID (선택사항)',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)('4', { message: 'employeeId는 유효한 UUID 형식이어야 합니다.' }),
    __metadata("design:type", String)
], GetUnassignedWbsItemsDto.prototype, "employeeId", void 0);
class UnassignedWbsItemsResponseDto {
    wbsItems;
}
exports.UnassignedWbsItemsResponseDto = UnassignedWbsItemsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당되지 않은 WBS 항목 목록 (WBS 항목 전체 정보 포함)',
        type: 'array',
        example: [
            {
                id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
                wbsCode: '1.1',
                title: '요구사항 분석',
                status: 'IN_PROGRESS',
                projectId: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
                parentWbsId: null,
                level: 1,
                startDate: '2024-01-01',
                endDate: '2024-01-31',
                progressPercentage: '0.00',
            },
        ],
    }),
    __metadata("design:type", Array)
], UnassignedWbsItemsResponseDto.prototype, "wbsItems", void 0);
class WbsAssignmentDetailResponseDto {
    id;
    periodId;
    employeeId;
    projectId;
    wbsItemId;
    assignedDate;
    assignedBy;
    displayOrder;
    createdAt;
    updatedAt;
    createdBy;
    updatedBy;
    employee;
    department;
    project;
    wbsItem;
    period;
    assignedByEmployee;
}
exports.WbsAssignmentDetailResponseDto = WbsAssignmentDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 할당 ID',
        example: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    }),
    __metadata("design:type", String)
], WbsAssignmentDetailResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    __metadata("design:type", String)
], WbsAssignmentDetailResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    __metadata("design:type", String)
], WbsAssignmentDetailResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    __metadata("design:type", String)
], WbsAssignmentDetailResponseDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    __metadata("design:type", String)
], WbsAssignmentDetailResponseDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당 날짜',
        example: '2024-10-01T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], WbsAssignmentDetailResponseDto.prototype, "assignedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당자 ID',
        example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    }),
    __metadata("design:type", String)
], WbsAssignmentDetailResponseDto.prototype, "assignedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '표시 순서',
        example: 1,
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsAssignmentDetailResponseDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-10-01T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], WbsAssignmentDetailResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-10-01T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], WbsAssignmentDetailResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    }),
    __metadata("design:type", String)
], WbsAssignmentDetailResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    }),
    __metadata("design:type", String)
], WbsAssignmentDetailResponseDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 정보',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsAssignmentDetailResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서 정보',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsAssignmentDetailResponseDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 정보',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsAssignmentDetailResponseDto.prototype, "project", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 정보',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsAssignmentDetailResponseDto.prototype, "wbsItem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 정보',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsAssignmentDetailResponseDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '할당자 정보',
        nullable: true,
    }),
    __metadata("design:type", Object)
], WbsAssignmentDetailResponseDto.prototype, "assignedByEmployee", void 0);
class ResetWbsAssignmentsDto {
}
exports.ResetWbsAssignmentsDto = ResetWbsAssignmentsDto;
class ChangeWbsAssignmentOrderQueryDto {
    direction;
}
exports.ChangeWbsAssignmentOrderQueryDto = ChangeWbsAssignmentOrderQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이동 방향 (up: 위로, down: 아래로)',
        example: evaluation_wbs_assignment_types_1.OrderDirection.UP,
        enum: evaluation_wbs_assignment_types_1.OrderDirection,
        enumName: 'OrderDirection',
    }),
    (0, class_validator_1.IsEnum)(evaluation_wbs_assignment_types_1.OrderDirection, { message: '이동 방향은 up 또는 down이어야 합니다.' }),
    __metadata("design:type", String)
], ChangeWbsAssignmentOrderQueryDto.prototype, "direction", void 0);
class ChangeWbsAssignmentOrderByWbsDto {
    employeeId;
    wbsItemId;
    projectId;
    periodId;
    direction;
}
exports.ChangeWbsAssignmentOrderByWbsDto = ChangeWbsAssignmentOrderByWbsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID (UUID 형식)',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeWbsAssignmentOrderByWbsDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 ID (UUID 형식, URL 파라미터로 전달되므로 선택적)',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ChangeWbsAssignmentOrderByWbsDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID (UUID 형식)',
        example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeWbsAssignmentOrderByWbsDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID (UUID 형식)',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeWbsAssignmentOrderByWbsDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이동 방향 (up: 위로, down: 아래로)',
        example: evaluation_wbs_assignment_types_1.OrderDirection.UP,
        enum: evaluation_wbs_assignment_types_1.OrderDirection,
        enumName: 'OrderDirection',
    }),
    (0, class_validator_1.IsEnum)(evaluation_wbs_assignment_types_1.OrderDirection, { message: '이동 방향은 up 또는 down이어야 합니다.' }),
    __metadata("design:type", String)
], ChangeWbsAssignmentOrderByWbsDto.prototype, "direction", void 0);
class ChangeWbsAssignmentOrderBodyDto {
    updatedBy;
}
exports.ChangeWbsAssignmentOrderBodyDto = ChangeWbsAssignmentOrderBodyDto;
class CreateAndAssignWbsDto {
    title;
    projectId;
    employeeId;
    periodId;
}
exports.CreateAndAssignWbsDto = CreateAndAssignWbsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 제목',
        example: 'API 개발',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAndAssignWbsDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAndAssignWbsDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAndAssignWbsDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAndAssignWbsDto.prototype, "periodId", void 0);
class CreateAndAssignWbsBetweenDto {
    title;
    projectId;
    employeeId;
    periodId;
}
exports.CreateAndAssignWbsBetweenDto = CreateAndAssignWbsBetweenDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 제목',
        example: 'API 개발',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAndAssignWbsBetweenDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID',
        example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAndAssignWbsBetweenDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAndAssignWbsBetweenDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAndAssignWbsBetweenDto.prototype, "periodId", void 0);
class UpdateWbsItemTitleDto {
    title;
}
exports.UpdateWbsItemTitleDto = UpdateWbsItemTitleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '새로운 WBS 제목',
        example: '수정된 API 개발',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateWbsItemTitleDto.prototype, "title", void 0);
//# sourceMappingURL=wbs-assignment.dto.js.map