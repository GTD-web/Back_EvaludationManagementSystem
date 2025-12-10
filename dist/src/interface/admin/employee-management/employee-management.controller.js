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
exports.EmployeeManagementController = void 0;
const organization_management_context_1 = require("../../../context/organization-management-context");
const decorators_1 = require("../../common/decorators");
const employee_management_api_decorators_1 = require("../../common/decorators/employee-management/employee-management-api.decorators");
const employee_management_dto_1 = require("../../common/dto/employee-management/employee-management.dto");
const bulk_update_employee_admin_dto_1 = require("../../common/dto/employee-management/bulk-update-employee-admin.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let EmployeeManagementController = class EmployeeManagementController {
    organizationManagementService;
    employeeSyncService;
    constructor(organizationManagementService, employeeSyncService) {
        this.organizationManagementService = organizationManagementService;
        this.employeeSyncService = employeeSyncService;
    }
    async getDepartmentHierarchy() {
        return await this.organizationManagementService.부서하이라키조회();
    }
    async getDepartmentHierarchyWithEmployees() {
        return await this.organizationManagementService.부서하이라키_직원포함_조회();
    }
    async getAllEmployees(query, includeExcluded) {
        return await this.organizationManagementService.전체직원목록조회(includeExcluded, query.departmentId);
    }
    async getExcludedEmployees() {
        const allEmployees = await this.organizationManagementService.전체직원목록조회(true);
        return allEmployees.filter((employee) => employee.isExcludedFromList);
    }
    async getPartLeaders(query) {
        const partLeaders = await this.employeeSyncService.getPartLeaders(query.forceRefresh || false);
        const partLeadersDto = partLeaders.map((employee) => {
            const dto = employee.DTO로_변환한다();
            return {
                id: dto.id,
                employeeNumber: dto.employeeNumber,
                name: dto.name,
                email: dto.email,
                rankName: dto.rankName,
                rankCode: dto.rankCode,
                rankLevel: dto.rankLevel,
                departmentName: dto.departmentName,
                departmentCode: dto.departmentCode,
                isActive: dto.isActive,
                isExcludedFromList: dto.isExcludedFromList,
                excludeReason: dto.excludeReason ?? undefined,
                excludedBy: dto.excludedBy ?? undefined,
                excludedAt: dto.excludedAt ?? undefined,
                createdAt: dto.createdAt,
                updatedAt: dto.updatedAt,
                isAccessible: dto.isAccessible,
            };
        });
        return {
            partLeaders: partLeadersDto,
            count: partLeadersDto.length,
        };
    }
    async excludeEmployeeFromList(employeeId, excludeData, user) {
        return await this.organizationManagementService.직원조회제외(employeeId, excludeData.excludeReason, user.id);
    }
    async includeEmployeeInList(employeeId, user) {
        return await this.organizationManagementService.직원조회포함(employeeId, user.id);
    }
    async updateEmployeeAdmin(employeeId, isAdmin, user) {
        return await this.organizationManagementService.직원관리자권한변경(employeeId, isAdmin, user.id);
    }
    async bulkUpdateEmployeeAdmin(bulkUpdateData, isAdmin, user) {
        const result = await this.organizationManagementService.여러직원관리자권한변경(bulkUpdateData.employeeIds, isAdmin, user.id);
        return {
            success: result.failed === 0,
            totalProcessed: result.totalProcessed,
            succeeded: result.succeeded,
            failed: result.failed,
            failedIds: result.failedIds,
            errors: result.errors,
            processedAt: new Date(),
        };
    }
    async syncEmployees(forceSync) {
        return await this.employeeSyncService.syncEmployees(forceSync);
    }
};
exports.EmployeeManagementController = EmployeeManagementController;
__decorate([
    (0, employee_management_api_decorators_1.GetDepartmentHierarchy)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "getDepartmentHierarchy", null);
__decorate([
    (0, employee_management_api_decorators_1.GetDepartmentHierarchyWithEmployees)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "getDepartmentHierarchyWithEmployees", null);
__decorate([
    (0, employee_management_api_decorators_1.GetAllEmployees)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('includeExcluded', common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_management_dto_1.GetEmployeesQueryDto, Boolean]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "getAllEmployees", null);
__decorate([
    (0, employee_management_api_decorators_1.GetExcludedEmployees)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "getExcludedEmployees", null);
__decorate([
    (0, employee_management_api_decorators_1.GetPartLeaders)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_management_dto_1.GetPartLeadersQueryDto]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "getPartLeaders", null);
__decorate([
    (0, employee_management_api_decorators_1.ExcludeEmployeeFromList)(),
    __param(0, (0, decorators_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_management_dto_1.ExcludeEmployeeFromListDto, Object]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "excludeEmployeeFromList", null);
__decorate([
    (0, employee_management_api_decorators_1.IncludeEmployeeInList)(),
    __param(0, (0, decorators_1.ParseId)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "includeEmployeeInList", null);
__decorate([
    (0, employee_management_api_decorators_1.UpdateEmployeeAdmin)(),
    __param(0, (0, decorators_1.ParseId)()),
    __param(1, (0, common_1.Query)('isAdmin', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "updateEmployeeAdmin", null);
__decorate([
    (0, employee_management_api_decorators_1.BulkUpdateEmployeeAdmin)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('isAdmin', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_update_employee_admin_dto_1.BulkUpdateEmployeeAdminDto, Boolean, Object]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "bulkUpdateEmployeeAdmin", null);
__decorate([
    (0, employee_management_api_decorators_1.SyncEmployees)(),
    __param(0, (0, common_1.Query)('forceSync', new common_1.DefaultValuePipe(false), common_1.ParseBoolPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Promise)
], EmployeeManagementController.prototype, "syncEmployees", null);
exports.EmployeeManagementController = EmployeeManagementController = __decorate([
    (0, swagger_1.ApiTags)('A-1. 관리자 - 조직 관리'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/employees'),
    __metadata("design:paramtypes", [organization_management_context_1.OrganizationManagementService,
        organization_management_context_1.EmployeeSyncService])
], EmployeeManagementController);
//# sourceMappingURL=employee-management.controller.js.map