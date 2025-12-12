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
exports.UserProjectManagementController = void 0;
const project_service_1 = require("../../../domain/common/project/project.service");
const project_api_decorators_1 = require("../../common/decorators/project/project-api.decorators");
const project_dto_1 = require("../../common/dto/project/project.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../../common/decorators");
let UserProjectManagementController = class UserProjectManagementController {
    projectService;
    constructor(projectService) {
        this.projectService = projectService;
    }
    async getProjectList(query) {
        const useHierarchy = !query.hierarchyLevel ||
            (query.hierarchyLevel !== 'child' && !query.parentProjectId);
        let result;
        if (useHierarchy) {
            result = await this.projectService.계층구조_목록_조회한다({
                page: query.page,
                limit: query.limit,
                sortBy: query.sortBy,
                sortOrder: query.sortOrder,
                filter: {
                    status: query.status,
                    managerId: query.managerId,
                    startDateFrom: query.startDateFrom,
                    startDateTo: query.startDateTo,
                    endDateFrom: query.endDateFrom,
                    endDateTo: query.endDateTo,
                    search: query.search,
                },
            });
        }
        else {
            result = await this.projectService.목록_조회한다({
                page: query.page,
                limit: query.limit,
                sortBy: query.sortBy,
                sortOrder: query.sortOrder,
                filter: {
                    status: query.status,
                    managerId: query.managerId,
                    startDateFrom: query.startDateFrom,
                    startDateTo: query.startDateTo,
                    endDateFrom: query.endDateFrom,
                    endDateTo: query.endDateTo,
                    parentProjectId: query.parentProjectId,
                    hierarchyLevel: query.hierarchyLevel,
                    search: query.search,
                },
            });
        }
        const totalPages = Math.ceil(result.total / result.limit);
        return {
            projects: result.projects.map((project) => ({
                id: project.id,
                name: project.name,
                projectCode: project.projectCode,
                status: project.status,
                startDate: project.startDate,
                endDate: project.endDate,
                managerId: project.managerId,
                manager: project.manager,
                parentProjectId: project.parentProjectId,
                childProjects: project.childProjects?.map((child) => this.mapProjectToResponseDto(child)),
                childProjectCount: project.childProjectCount,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                deletedAt: project.deletedAt,
                isActive: project.isActive,
                isCompleted: project.isCompleted,
                isCancelled: project.isCancelled,
            })),
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages,
        };
    }
    async getProjectDetail(id) {
        const project = await this.projectService.ID로_조회한다(id, true);
        if (!project) {
            throw new common_1.NotFoundException(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
        }
        const childProjectCount = project.childProjects?.length || 0;
        return {
            id: project.id,
            name: project.name,
            projectCode: project.projectCode,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            managerId: project.managerId,
            manager: project.manager,
            parentProjectId: project.parentProjectId,
            childProjects: project.childProjects?.map((child) => ({
                id: child.id,
                name: child.name,
                projectCode: child.projectCode,
                status: child.status,
                managerId: child.managerId,
                manager: child.manager,
            })),
            childProjectCount,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            deletedAt: project.deletedAt,
            isActive: project.isActive,
            isCompleted: project.isCompleted,
            isCancelled: project.isCancelled,
        };
    }
    mapProjectToResponseDto(project) {
        return {
            id: project.id,
            name: project.name,
            projectCode: project.projectCode,
            status: project.status,
            managerId: project.managerId,
            manager: project.manager,
            childProjects: project.childProjects?.map((child) => this.mapProjectToResponseDto(child)),
        };
    }
};
exports.UserProjectManagementController = UserProjectManagementController;
__decorate([
    (0, project_api_decorators_1.GetProjectList)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_dto_1.GetProjectListQueryDto]),
    __metadata("design:returntype", Promise)
], UserProjectManagementController.prototype, "getProjectList", null);
__decorate([
    (0, project_api_decorators_1.GetProjectDetail)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserProjectManagementController.prototype, "getProjectDetail", null);
exports.UserProjectManagementController = UserProjectManagementController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, swagger_1.ApiTags)('A-0. 사용자 - 프로젝트 조회'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('user'),
    (0, common_1.Controller)('user/projects'),
    __metadata("design:paramtypes", [project_service_1.ProjectService])
], UserProjectManagementController);
//# sourceMappingURL=user-project-management.controller.js.map