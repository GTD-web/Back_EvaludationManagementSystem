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
exports.UserProjectAssignmentManagementController = void 0;
const project_assignment_business_service_1 = require("../../../business/project-assignment/project-assignment-business.service");
const evaluation_criteria_management_service_1 = require("../../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const project_assignment_api_decorators_1 = require("../../common/decorators/evaluation-criteria/project-assignment-api.decorators");
const project_assignment_dto_1 = require("../../common/dto/evaluation-criteria/project-assignment.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let UserProjectAssignmentManagementController = class UserProjectAssignmentManagementController {
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
    async cancelProjectAssignmentByProject(projectId, bodyDto, user) {
        const cancelledBy = user.id;
        return await this.projectAssignmentBusinessService.프로젝트_할당을_프로젝트_ID로_취소한다(bodyDto.employeeId, projectId, bodyDto.periodId, cancelledBy);
    }
    async changeProjectAssignmentOrderByProject(projectId, bodyDto, user) {
        const updatedBy = user.id;
        return await this.evaluationCriteriaManagementService.프로젝트_할당_순서를_프로젝트_ID로_변경한다(bodyDto.employeeId, projectId, bodyDto.periodId, bodyDto.direction, updatedBy);
    }
};
exports.UserProjectAssignmentManagementController = UserProjectAssignmentManagementController;
__decorate([
    (0, project_assignment_api_decorators_1.CreateProjectAssignment)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_assignment_dto_1.CreateProjectAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], UserProjectAssignmentManagementController.prototype, "createProjectAssignment", null);
__decorate([
    (0, project_assignment_api_decorators_1.GetAvailableProjects)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_assignment_dto_1.GetAvailableProjectsQueryDto]),
    __metadata("design:returntype", Promise)
], UserProjectAssignmentManagementController.prototype, "getAvailableProjects", null);
__decorate([
    (0, project_assignment_api_decorators_1.CancelProjectAssignmentByProject)(),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_assignment_dto_1.CancelProjectAssignmentByProjectDto, Object]),
    __metadata("design:returntype", Promise)
], UserProjectAssignmentManagementController.prototype, "cancelProjectAssignmentByProject", null);
__decorate([
    (0, project_assignment_api_decorators_1.ChangeProjectAssignmentOrderByProject)(),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_assignment_dto_1.ChangeProjectAssignmentOrderByProjectDto, Object]),
    __metadata("design:returntype", Promise)
], UserProjectAssignmentManagementController.prototype, "changeProjectAssignmentOrderByProject", null);
exports.UserProjectAssignmentManagementController = UserProjectAssignmentManagementController = __decorate([
    (0, swagger_1.ApiTags)('A-1. 사용자 - 평가 설정 - 프로젝트 할당'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('user'),
    (0, common_1.Controller)('user/evaluation-criteria/project-assignments'),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        project_assignment_business_service_1.ProjectAssignmentBusinessService])
], UserProjectAssignmentManagementController);
//# sourceMappingURL=user-project-assignment-management.controller.js.map