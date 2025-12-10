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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectAssignmentManagementController = void 0;
const project_assignment_business_service_1 = require("../../../business/project-assignment/project-assignment-business.service");
const evaluation_criteria_management_service_1 = require("../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const project_assignment_api_decorators_1 = require("../../common/decorators/evaluation-criteria/project-assignment-api.decorators");
const project_assignment_dto_1 = require("../../common/dto/evaluation-criteria/project-assignment.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let ProjectAssignmentManagementController = class ProjectAssignmentManagementController {
    evaluationCriteriaManagementService;
    projectAssignmentBusinessService;
    constructor(evaluationCriteriaManagementService, projectAssignmentBusinessService) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.projectAssignmentBusinessService = projectAssignmentBusinessService;
    }
    async createProjectAssignment(createDto, user) {
        const assignedBy = user.id;
        return await this.projectAssignmentBusinessService.프로젝트를_할당한다({
            employeeId: createDto.employeeId,
            projectId: createDto.projectId,
            periodId: createDto.periodId,
            assignedBy: assignedBy,
        }, assignedBy);
    }
    async getProjectAssignmentList(filter) {
        return await this.evaluationCriteriaManagementService.프로젝트_할당_목록을_조회한다({
            periodId: filter.periodId,
            employeeId: filter.employeeId,
            projectId: filter.projectId,
            page: filter.page,
            limit: filter.limit,
            orderBy: filter.orderBy,
            orderDirection: filter.orderDirection,
        });
    }
    async getEmployeeProjectAssignments(employeeId, periodId) {
        return await this.evaluationCriteriaManagementService.특정_평가기간에_직원에게_할당된_프로젝트를_조회한다(employeeId, periodId);
    }
    async getProjectAssignedEmployees(projectId, periodId) {
        return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트에_할당된_직원을_조회한다(projectId, periodId);
    }
    async getUnassignedEmployees(query) {
        const result = await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트가_할당되지_않은_직원_목록을_조회한다(query.periodId, query.projectId);
        return {
            periodId: query.periodId,
            projectId: query.projectId,
            employees: result.employees,
        };
    }
    async getAvailableProjects(query) {
        const result = await this.evaluationCriteriaManagementService.할당_가능한_프로젝트_목록을_조회한다(query.periodId, {
            status: query.status,
            search: query.search,
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        });
        return {
            periodId: result.periodId,
            projects: result.projects,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            search: result.search,
            sortBy: result.sortBy,
            sortOrder: result.sortOrder,
        };
    }
    async getProjectAssignmentDetail(id) {
        return await this.evaluationCriteriaManagementService.프로젝트_할당_상세를_조회한다(id);
    }
    async bulkCreateProjectAssignments(bulkCreateDto, user) {
        const assignedBy = user.id;
        return await this.projectAssignmentBusinessService.프로젝트를_대량으로_할당한다(bulkCreateDto.assignments.map((assignment) => ({
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
            periodId: assignment.periodId,
            assignedBy,
        })), assignedBy);
    }
    async cancelProjectAssignmentByProject(projectId, bodyDto, user) {
        const cancelledBy = user.id;
        return await this.projectAssignmentBusinessService.프로젝트_할당을_프로젝트_ID로_취소한다(bodyDto.employeeId, projectId, bodyDto.periodId, cancelledBy);
    }
    async changeProjectAssignmentOrderByProject(projectId, bodyDto, user) {
        const updatedBy = user.id;
        return await this.evaluationCriteriaManagementService.프로젝트_할당_순서를_프로젝트_ID로_변경한다(bodyDto.employeeId, projectId, bodyDto.periodId, bodyDto.direction, updatedBy);
    }
};
exports.ProjectAssignmentManagementController = ProjectAssignmentManagementController;
__decorate([
    (0, project_assignment_api_decorators_1.CreateProjectAssignment)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_assignment_dto_1.CreateProjectAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "createProjectAssignment", null);
__decorate([
    (0, project_assignment_api_decorators_1.GetProjectAssignmentList)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_assignment_dto_1.ProjectAssignmentFilterDto]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "getProjectAssignmentList", null);
__decorate([
    (0, project_assignment_api_decorators_1.GetEmployeeProjectAssignments)(),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "getEmployeeProjectAssignments", null);
__decorate([
    (0, project_assignment_api_decorators_1.GetProjectAssignedEmployees)(),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "getProjectAssignedEmployees", null);
__decorate([
    (0, project_assignment_api_decorators_1.GetUnassignedEmployees)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_assignment_dto_1.GetUnassignedEmployeesQueryDto]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "getUnassignedEmployees", null);
__decorate([
    (0, project_assignment_api_decorators_1.GetAvailableProjects)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_assignment_dto_1.GetAvailableProjectsQueryDto]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "getAvailableProjects", null);
__decorate([
    (0, project_assignment_api_decorators_1.GetProjectAssignmentDetail)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "getProjectAssignmentDetail", null);
__decorate([
    (0, project_assignment_api_decorators_1.BulkCreateProjectAssignments)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_assignment_dto_1.BulkCreateProjectAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "bulkCreateProjectAssignments", null);
__decorate([
    (0, project_assignment_api_decorators_1.CancelProjectAssignmentByProject)(),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_assignment_dto_1.CancelProjectAssignmentByProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "cancelProjectAssignmentByProject", null);
__decorate([
    (0, project_assignment_api_decorators_1.ChangeProjectAssignmentOrderByProject)(),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_assignment_dto_1.ChangeProjectAssignmentOrderByProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectAssignmentManagementController.prototype, "changeProjectAssignmentOrderByProject", null);
exports.ProjectAssignmentManagementController = ProjectAssignmentManagementController = __decorate([
    (0, swagger_1.ApiTags)('B-1. 관리자 - 평가 설정 - 프로젝트 할당'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/evaluation-criteria/project-assignments'),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        project_assignment_business_service_1.ProjectAssignmentBusinessService])
], ProjectAssignmentManagementController);
//# sourceMappingURL=project-assignment-management.controller.js.map