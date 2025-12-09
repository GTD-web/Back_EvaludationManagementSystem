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
exports.ProjectsBulkCreateResponseDto = exports.BulkCreateFailedItemDto = exports.ProjectManagerListResponseDto = exports.ProjectManagerDto = exports.GetProjectManagersQueryDto = exports.ProjectListResponseDto = exports.ProjectResponseDto = exports.SimpleProjectResponseDto = exports.ManagerInfoDto = exports.GetProjectListQueryDto = exports.UpdateProjectDto = exports.CreateProjectsBulkDto = exports.CreateProjectDto = exports.ChildProjectInputDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const decorators_1 = require("../../decorators");
const project_types_1 = require("../../../../domain/common/project/project.types");
class ChildProjectInputDto {
    orderLevel;
    name;
    projectCode;
    managerId;
}
exports.ChildProjectInputDto = ChildProjectInputDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '계층 레벨 (1~10)\n' +
            '• 1: 1차 하위 (상위 프로젝트 직속)\n' +
            '• 2: 2차 하위 (1차 하위의 하위)\n' +
            '• 3: 3차 하위 (2차 하위의 하위)\n' +
            '• 같은 orderLevel은 같은 부모 아래 형제 관계\n' +
            '• 예: orderLevel=1이 3개면 상위 아래 3개 형제',
        example: 1,
        minimum: 1,
        maximum: 10,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], ChildProjectInputDto.prototype, "orderLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하위 프로젝트명',
        example: 'EMS 프로젝트 - 1차 하위 A',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChildProjectInputDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하위 프로젝트 코드\n' +
            '• 미입력 시 자동 생성: {상위코드}-SUB{orderLevel}-{인덱스}',
        example: 'EMS-2024-SUB1-A',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChildProjectInputDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하위 프로젝트 매니저 ID (DPM)\n' +
            '• 각 하위 프로젝트마다 다른 PM 지정 가능\n' +
            '• 필수 입력',
        example: '660e9500-f30c-52e5-b827-557766551111',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'managerId must be a valid UUID format',
    }),
    __metadata("design:type", String)
], ChildProjectInputDto.prototype, "managerId", void 0);
class CreateProjectDto {
    name;
    projectCode;
    status;
    startDate;
    endDate;
    managerId;
    parentProjectId;
    childProjects;
}
exports.CreateProjectDto = CreateProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트명',
        example: 'EMS 프로젝트',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 코드',
        example: 'EMS-2024',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 상태 (ACTIVE: 진행중, COMPLETED: 완료, CANCELLED: 취소)',
        enum: project_types_1.ProjectStatus,
        enumName: 'ProjectStatus',
        example: project_types_1.ProjectStatus.ACTIVE,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(project_types_1.ProjectStatus),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일 (YYYY-MM-DD)',
        example: '2024-01-01',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], CreateProjectDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일 (YYYY-MM-DD)',
        example: '2024-12-31',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], CreateProjectDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 ID (UUID) - 상위 프로젝트: PM, 하위 프로젝트: DPM',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'managerId must be a UUID',
    }),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상위 프로젝트 ID (UUID) - 하위 프로젝트 생성 시 지정',
        example: '660e9500-f30c-52e5-b827-557766551111',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "parentProjectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하위 프로젝트 목록 (평면 구조)\n' +
            '• 같은 orderLevel은 같은 부모 아래 형제 관계\n' +
            '• orderLevel=1: 상위 프로젝트 직속 하위\n' +
            '• orderLevel=2: orderLevel=1 중 마지막 프로젝트의 하위\n' +
            '• orderLevel=3: orderLevel=2 중 마지막 프로젝트의 하위\n' +
            '• 각 하위마다 다른 managerId(PM) 지정 가능',
        type: [ChildProjectInputDto],
        example: [
            {
                orderLevel: 1,
                name: 'EMS 프로젝트 - 1차 하위 A',
                managerId: '550e8400-e29b-41d4-a716-446655440000',
            },
            {
                orderLevel: 1,
                name: 'EMS 프로젝트 - 1차 하위 B',
                managerId: '660e9500-f30c-52e5-b827-557766551111',
            },
            {
                orderLevel: 2,
                name: 'EMS 프로젝트 - 2차 하위',
                managerId: '770ea600-g40d-63f6-c938-668877662222',
            },
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChildProjectInputDto),
    __metadata("design:type", Array)
], CreateProjectDto.prototype, "childProjects", void 0);
class CreateProjectsBulkDto {
    projects;
}
exports.CreateProjectsBulkDto = CreateProjectsBulkDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성할 프로젝트 목록',
        type: [CreateProjectDto],
        example: [
            {
                name: 'EMS 프로젝트',
                projectCode: 'EMS-2024',
                status: 'ACTIVE',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                managerId: '550e8400-e29b-41d4-a716-446655440000',
            },
            {
                name: 'HRM 프로젝트',
                projectCode: 'HRM-2024',
                status: 'COMPLETED',
                startDate: '2024-02-01',
                endDate: '2024-11-30',
                managerId: '550e8400-e29b-41d4-a716-446655440001',
            },
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateProjectDto),
    __metadata("design:type", Array)
], CreateProjectsBulkDto.prototype, "projects", void 0);
class UpdateProjectDto {
    name;
    projectCode;
    status;
    startDate;
    endDate;
    managerId;
    parentProjectId;
    childProjects;
}
exports.UpdateProjectDto = UpdateProjectDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트명',
        example: 'EMS 프로젝트',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 코드',
        example: 'EMS-2024',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 상태 (ACTIVE: 진행중, COMPLETED: 완료, CANCELLED: 취소)',
        enum: project_types_1.ProjectStatus,
        enumName: 'ProjectStatus',
        example: project_types_1.ProjectStatus.ACTIVE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(project_types_1.ProjectStatus),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일 (YYYY-MM-DD)',
        example: '2024-01-01',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], UpdateProjectDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일 (YYYY-MM-DD)',
        example: '2024-12-31',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], UpdateProjectDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 ID (UUID) - 상위 프로젝트: PM, 하위 프로젝트: DPM',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'managerId must be a UUID',
    }),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상위 프로젝트 ID (UUID) - 하위 프로젝트로 변경 또는 상위 프로젝트 변경 시',
        example: '660e9500-f30c-52e5-b827-557766551111',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "parentProjectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하위 프로젝트 목록 (평면 구조)\n' +
            '• 기존 하위 프로젝트를 모두 삭제하고 새로 생성\n' +
            '• 같은 orderLevel은 형제 관계\n' +
            '• 각 하위마다 다른 managerId(PM) 지정\n' +
            '• undefined: 하위 변경 없음\n' +
            '• []: 모든 하위 삭제',
        type: [ChildProjectInputDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ChildProjectInputDto),
    __metadata("design:type", Array)
], UpdateProjectDto.prototype, "childProjects", void 0);
class GetProjectListQueryDto {
    page = 1;
    limit = 20;
    sortBy = 'createdAt';
    sortOrder = 'DESC';
    status;
    managerId;
    parentProjectId;
    hierarchyLevel;
    startDateFrom;
    startDateTo;
    endDateFrom;
    endDateTo;
    search;
}
exports.GetProjectListQueryDto = GetProjectListQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호 (1부터 시작)',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetProjectListQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지당 항목 수',
        example: 20,
        default: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GetProjectListQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '정렬 기준',
        enum: ['name', 'projectCode', 'startDate', 'endDate', 'createdAt'],
        example: 'createdAt',
        default: 'createdAt',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '정렬 방향',
        enum: ['ASC', 'DESC'],
        example: 'DESC',
        default: 'DESC',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 상태 필터 (ACTIVE: 진행중, COMPLETED: 완료, CANCELLED: 취소)',
        enum: project_types_1.ProjectStatus,
        enumName: 'ProjectStatus',
        example: project_types_1.ProjectStatus.ACTIVE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(project_types_1.ProjectStatus),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'managerId must be a UUID',
    }),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상위 프로젝트 ID (UUID) - 특정 상위 프로젝트의 하위 프로젝트만 조회',
        example: '660e9500-f30c-52e5-b827-557766551111',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "parentProjectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '계층 레벨 필터 (parent: 상위 프로젝트만, child: 하위 프로젝트만, all: 전체)',
        enum: ['parent', 'child', 'all'],
        example: 'all',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "hierarchyLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일 범위 시작 (YYYY-MM-DD)',
        example: '2024-01-01',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], GetProjectListQueryDto.prototype, "startDateFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일 범위 끝 (YYYY-MM-DD)',
        example: '2024-12-31',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], GetProjectListQueryDto.prototype, "startDateTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일 범위 시작 (YYYY-MM-DD)',
        example: '2024-01-01',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], GetProjectListQueryDto.prototype, "endDateFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일 범위 끝 (YYYY-MM-DD)',
        example: '2024-12-31',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], GetProjectListQueryDto.prototype, "endDateTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트명 검색 (부분 일치)',
        example: 'EMS',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "search", void 0);
class ManagerInfoDto {
    managerId;
    employeeId;
    name;
    email;
    phoneNumber;
    departmentName;
    rankName;
}
exports.ManagerInfoDto = ManagerInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 ID (SSO의 직원 ID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '로컬 Employee ID (로컬 DB의 직원 ID)',
        example: '660e9500-f30c-52e5-b827-557766551111',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일',
        example: 'hong@example.com',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '전화번호',
        example: '010-1234-5678',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '개발팀',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '팀장',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "rankName", void 0);
class SimpleProjectResponseDto {
    id;
    name;
    projectCode;
    status;
    managerId;
    manager;
    childProjects;
}
exports.SimpleProjectResponseDto = SimpleProjectResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], SimpleProjectResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트명',
        example: 'EMS 프로젝트',
    }),
    __metadata("design:type", String)
], SimpleProjectResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 코드',
        example: 'EMS-2024',
    }),
    __metadata("design:type", String)
], SimpleProjectResponseDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 상태',
        enum: project_types_1.ProjectStatus,
        enumName: 'ProjectStatus',
    }),
    __metadata("design:type", String)
], SimpleProjectResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 ID',
    }),
    __metadata("design:type", String)
], SimpleProjectResponseDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 정보',
        type: ManagerInfoDto,
    }),
    __metadata("design:type", ManagerInfoDto)
], SimpleProjectResponseDto.prototype, "manager", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하위 프로젝트 목록 (재귀 구조)',
        type: [SimpleProjectResponseDto],
    }),
    __metadata("design:type", Array)
], SimpleProjectResponseDto.prototype, "childProjects", void 0);
class ProjectResponseDto {
    id;
    name;
    projectCode;
    status;
    startDate;
    endDate;
    managerId;
    manager;
    parentProjectId;
    parentProject;
    childProjects;
    childProjectCount;
    createdAt;
    updatedAt;
    deletedAt;
    isActive;
    isCompleted;
    isCancelled;
}
exports.ProjectResponseDto = ProjectResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트명',
        example: 'EMS 프로젝트',
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 코드',
        example: 'EMS-2024',
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 상태 (ACTIVE: 진행중, COMPLETED: 완료, CANCELLED: 취소)',
        enum: project_types_1.ProjectStatus,
        enumName: 'ProjectStatus',
        example: project_types_1.ProjectStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일',
        example: '2024-12-31T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 ID (상위: PM, 하위: DPM)',
        example: '11111111-1111-1111-1111-111111111111',
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 정보',
        type: ManagerInfoDto,
    }),
    __metadata("design:type", ManagerInfoDto)
], ProjectResponseDto.prototype, "manager", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상위 프로젝트 ID (하위 프로젝트인 경우)',
        example: '22222222-2222-2222-2222-222222222222',
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "parentProjectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상위 프로젝트 정보 (하위 프로젝트인 경우)',
        type: SimpleProjectResponseDto,
    }),
    __metadata("design:type", SimpleProjectResponseDto)
], ProjectResponseDto.prototype, "parentProject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하위 프로젝트 목록 (상위 프로젝트인 경우)',
        type: [SimpleProjectResponseDto],
    }),
    __metadata("design:type", Array)
], ProjectResponseDto.prototype, "childProjects", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하위 프로젝트 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], ProjectResponseDto.prototype, "childProjectCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활성 상태 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ProjectResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료 상태 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ProjectResponseDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '취소 상태 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ProjectResponseDto.prototype, "isCancelled", void 0);
class ProjectListResponseDto {
    projects;
    total;
    page;
    limit;
    totalPages;
}
exports.ProjectListResponseDto = ProjectListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 목록',
        type: [ProjectResponseDto],
    }),
    __metadata("design:type", Array)
], ProjectListResponseDto.prototype, "projects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 항목 수',
        example: 100,
    }),
    __metadata("design:type", Number)
], ProjectListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지 번호',
        example: 1,
    }),
    __metadata("design:type", Number)
], ProjectListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지당 항목 수',
        example: 20,
    }),
    __metadata("design:type", Number)
], ProjectListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 페이지 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], ProjectListResponseDto.prototype, "totalPages", void 0);
class GetProjectManagersQueryDto {
    departmentId;
    search;
}
exports.GetProjectManagersQueryDto = GetProjectManagersQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서 ID로 필터링',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'departmentId must be a UUID',
    }),
    __metadata("design:type", String)
], GetProjectManagersQueryDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '검색어 (이름, 사번, 이메일)',
        example: '홍길동',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetProjectManagersQueryDto.prototype, "search", void 0);
class ProjectManagerDto {
    managerId;
    employeeId;
    employeeNumber;
    name;
    email;
    departmentName;
    departmentCode;
    positionName;
    positionLevel;
    jobTitleName;
    hasManagementAuthority;
}
exports.ProjectManagerDto = ProjectManagerDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 ID (SSO의 직원 ID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '로컬 Employee ID (로컬 DB의 직원 ID)',
        example: '660e9500-f30c-52e5-b827-557766551111',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사번',
        example: 'E2023001',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'hong@example.com',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '개발팀',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서 코드',
        example: 'DEV',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "departmentCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '팀장',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "positionName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책 레벨',
        example: 3,
    }),
    __metadata("design:type", Number)
], ProjectManagerDto.prototype, "positionLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직급명',
        example: '과장',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "jobTitleName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '관리 권한 보유 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ProjectManagerDto.prototype, "hasManagementAuthority", void 0);
class ProjectManagerListResponseDto {
    managers;
    total;
}
exports.ProjectManagerListResponseDto = ProjectManagerListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PM 목록',
        type: [ProjectManagerDto],
    }),
    __metadata("design:type", Array)
], ProjectManagerListResponseDto.prototype, "managers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 PM 수',
        example: 15,
    }),
    __metadata("design:type", Number)
], ProjectManagerListResponseDto.prototype, "total", void 0);
class BulkCreateFailedItemDto {
    index;
    data;
    error;
}
exports.BulkCreateFailedItemDto = BulkCreateFailedItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 항목의 인덱스 (0부터 시작)',
        example: 0,
    }),
    __metadata("design:type", Number)
], BulkCreateFailedItemDto.prototype, "index", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 프로젝트 데이터',
        type: CreateProjectDto,
    }),
    __metadata("design:type", CreateProjectDto)
], BulkCreateFailedItemDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패 사유',
        example: '프로젝트 코드 EMS-2024는 이미 사용 중입니다.',
    }),
    __metadata("design:type", String)
], BulkCreateFailedItemDto.prototype, "error", void 0);
class ProjectsBulkCreateResponseDto {
    success;
    failed;
    successCount;
    failedCount;
    totalCount;
}
exports.ProjectsBulkCreateResponseDto = ProjectsBulkCreateResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공적으로 생성된 프로젝트 목록',
        type: [ProjectResponseDto],
    }),
    __metadata("design:type", Array)
], ProjectsBulkCreateResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성에 실패한 프로젝트 목록',
        type: [BulkCreateFailedItemDto],
    }),
    __metadata("design:type", Array)
], ProjectsBulkCreateResponseDto.prototype, "failed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공한 항목 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], ProjectsBulkCreateResponseDto.prototype, "successCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 항목 수',
        example: 2,
    }),
    __metadata("design:type", Number)
], ProjectsBulkCreateResponseDto.prototype, "failedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 항목 수',
        example: 7,
    }),
    __metadata("design:type", Number)
], ProjectsBulkCreateResponseDto.prototype, "totalCount", void 0);
//# sourceMappingURL=project.dto.js.map