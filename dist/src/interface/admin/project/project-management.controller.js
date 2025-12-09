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
exports.ProjectManagementController = void 0;
const project_service_1 = require("../../../domain/common/project/project.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const project_api_decorators_1 = require("../../common/decorators/project/project-api.decorators");
const project_dto_1 = require("../../common/dto/project/project.dto");
const generate_child_projects_dto_1 = require("../../common/dto/project/generate-child-projects.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sso_module_1 = require("../../../domain/common/sso/sso.module");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
let ProjectManagementController = class ProjectManagementController {
    projectService;
    ssoService;
    employeeService;
    constructor(projectService, ssoService, employeeService) {
        this.projectService = projectService;
        this.ssoService = ssoService;
        this.employeeService = employeeService;
    }
    async createProject(createDto, user) {
        const createdBy = user.id;
        const project = await this.projectService.생성한다({
            name: createDto.name,
            projectCode: createDto.projectCode,
            status: createDto.status,
            startDate: createDto.startDate,
            endDate: createDto.endDate,
            managerId: createDto.managerId,
            parentProjectId: createDto.parentProjectId,
            childProjects: createDto.childProjects,
        }, createdBy);
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
            childProjects: project.childProjects,
            childProjectCount: project.childProjects?.length,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            deletedAt: project.deletedAt,
            isActive: project.isActive,
            isCompleted: project.isCompleted,
            isCancelled: project.isCancelled,
        };
    }
    async createProjectsBulk(bulkDto, user) {
        const createdBy = user.id;
        const result = await this.projectService.일괄_생성한다(bulkDto.projects, createdBy);
        return {
            success: result.success.map((project) => ({
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
            failed: result.failed,
            successCount: result.success.length,
            failedCount: result.failed.length,
            totalCount: bulkDto.projects.length,
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
    async getProjectManagers(query) {
        const employees = await this.ssoService.여러직원정보를조회한다({
            withDetail: true,
            includeTerminated: false,
        });
        let managers = employees.filter((emp) => emp.position?.hasManagementAuthority === true);
        if (query.departmentId) {
            managers = managers.filter((emp) => emp.department?.id === query.departmentId);
        }
        if (query.search) {
            const searchLower = query.search.toLowerCase();
            managers = managers.filter((emp) => emp.name.toLowerCase().includes(searchLower) ||
                emp.employeeNumber.toLowerCase().includes(searchLower) ||
                emp.email.toLowerCase().includes(searchLower));
        }
        const managerDtos = await Promise.all(managers.map(async (emp) => {
            const employee = await this.employeeService.findByExternalId(emp.id);
            return {
                managerId: emp.id,
                employeeId: employee?.id,
                employeeNumber: emp.employeeNumber,
                name: emp.name,
                email: emp.email,
                departmentName: emp.department?.departmentName,
                departmentCode: emp.department?.departmentCode,
                positionName: emp.position?.positionName,
                positionLevel: emp.position?.positionLevel,
                jobTitleName: emp.jobTitle?.jobTitleName,
                hasManagementAuthority: emp.position?.hasManagementAuthority,
            };
        }));
        return {
            managers: managerDtos,
            total: managerDtos.length,
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
    async updateProject(id, updateDto, user) {
        const updatedBy = user.id;
        const project = await this.projectService.수정한다(id, {
            name: updateDto.name,
            projectCode: updateDto.projectCode,
            status: updateDto.status,
            startDate: updateDto.startDate,
            endDate: updateDto.endDate,
            managerId: updateDto.managerId,
            parentProjectId: updateDto.parentProjectId,
            childProjects: updateDto.childProjects,
        }, updatedBy);
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
            childProjects: project.childProjects,
            childProjectCount: project.childProjects?.length,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            deletedAt: project.deletedAt,
            isActive: project.isActive,
            isCompleted: project.isCompleted,
            isCancelled: project.isCancelled,
        };
    }
    async deleteProject(id, user) {
        const deletedBy = user.id;
        await this.projectService.삭제한다(id, deletedBy);
    }
    async generateChildProjects(dto, user) {
        const startTime = Date.now();
        const createdBy = user.id;
        try {
            const parentProjects = await this.projectService.목록_조회한다({
                page: 1,
                limit: 1000,
                filter: {
                    hierarchyLevel: 'parent',
                },
            });
            let totalChildCreated = 0;
            let skippedCount = 0;
            let failedCount = 0;
            const details = [];
            const errors = [];
            for (const parentProject of parentProjects.projects) {
                const detail = {
                    parentProjectId: parentProject.id,
                    parentProjectName: parentProject.name,
                    childrenCreated: 0,
                    skipped: false,
                    errors: [],
                };
                try {
                    const existingChildren = await this.projectService.하위_프로젝트_목록_조회한다(parentProject.id);
                    if (existingChildren.length > 0 && dto.skipIfExists !== false) {
                        detail.skipped = true;
                        skippedCount++;
                        details.push(detail);
                        continue;
                    }
                    const totalDepth = dto.childCountPerProject || 5;
                    let currentParentId = parentProject.id;
                    const topLevelProjectName = parentProject.name;
                    const topLevelProjectCode = parentProject.projectCode;
                    for (let level = 1; level <= totalDepth; level++) {
                        try {
                            const childProject = await this.projectService.생성한다({
                                name: `${topLevelProjectName} - ${level}차 하위 프로젝트`,
                                projectCode: `${topLevelProjectCode}-SUB${level}`,
                                status: parentProject.status,
                                startDate: parentProject.startDate,
                                endDate: parentProject.endDate,
                                managerId: parentProject.managerId,
                                parentProjectId: currentParentId,
                            }, createdBy);
                            detail.childrenCreated++;
                            totalChildCreated++;
                            currentParentId = childProject.id;
                        }
                        catch (error) {
                            const errorMsg = `${level}차 하위 생성 실패: ${error.message}`;
                            detail.errors = detail.errors || [];
                            detail.errors.push(errorMsg);
                            errors.push(`[${parentProject.name}] ${errorMsg}`);
                            failedCount++;
                            break;
                        }
                    }
                    details.push(detail);
                }
                catch (error) {
                    const errorMsg = `프로젝트 처리 실패: ${error.message}`;
                    detail.errors = [errorMsg];
                    errors.push(`[${parentProject.name}] ${errorMsg}`);
                    details.push(detail);
                }
            }
            const duration = (Date.now() - startTime) / 1000;
            return {
                success: true,
                processedParentProjects: parentProjects.total,
                skippedParentProjects: skippedCount,
                totalChildProjectsCreated: totalChildCreated,
                failedChildProjects: failedCount,
                details,
                errors: errors.length > 0 ? errors : undefined,
                duration,
            };
        }
        catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            return {
                success: false,
                processedParentProjects: 0,
                skippedParentProjects: 0,
                totalChildProjectsCreated: 0,
                failedChildProjects: 0,
                errors: [error.message],
                duration,
            };
        }
    }
};
exports.ProjectManagementController = ProjectManagementController;
__decorate([
    (0, project_api_decorators_1.CreateProject)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_dto_1.CreateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "createProject", null);
__decorate([
    (0, project_api_decorators_1.CreateProjectsBulk)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_dto_1.CreateProjectsBulkDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "createProjectsBulk", null);
__decorate([
    (0, project_api_decorators_1.GetProjectList)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_dto_1.GetProjectListQueryDto]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "getProjectList", null);
__decorate([
    (0, project_api_decorators_1.GetProjectManagers)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_dto_1.GetProjectManagersQueryDto]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "getProjectManagers", null);
__decorate([
    (0, project_api_decorators_1.GetProjectDetail)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "getProjectDetail", null);
__decorate([
    (0, project_api_decorators_1.UpdateProject)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_dto_1.UpdateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "updateProject", null);
__decorate([
    (0, project_api_decorators_1.DeleteProject)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "deleteProject", null);
__decorate([
    (0, project_api_decorators_1.GenerateChildProjects)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_child_projects_dto_1.GenerateChildProjectsDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectManagementController.prototype, "generateChildProjects", null);
exports.ProjectManagementController = ProjectManagementController = __decorate([
    (0, swagger_1.ApiTags)('B-0. 관리자 - 프로젝트 관리'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/projects'),
    __param(1, (0, common_1.Inject)(sso_module_1.SSOService)),
    __metadata("design:paramtypes", [project_service_1.ProjectService, Object, employee_service_1.EmployeeService])
], ProjectManagementController);
//# sourceMappingURL=project-management.controller.js.map