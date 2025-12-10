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
exports.OrganizationManagementService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const employee_service_1 = require("../../domain/common/employee/employee.service");
const queries_1 = require("./queries");
const commands_1 = require("./commands");
const common_2 = require("@nestjs/common");
const sso_1 = require("../../domain/common/sso");
let OrganizationManagementService = class OrganizationManagementService {
    queryBus;
    commandBus;
    ssoService;
    employeeService;
    constructor(queryBus, commandBus, ssoService, employeeService) {
        this.queryBus = queryBus;
        this.commandBus = commandBus;
        this.ssoService = ssoService;
        this.employeeService = employeeService;
    }
    async 전체부서목록조회() {
        return await this.queryBus.execute(new queries_1.GetAllDepartmentsQuery());
    }
    async 부서정보조회(departmentId) {
        return await this.queryBus.execute(new queries_1.GetDepartmentQuery(departmentId));
    }
    async 부서별직원목록조회(departmentId) {
        return await this.queryBus.execute(new queries_1.GetEmployeesByDepartmentQuery(departmentId));
    }
    async 조직도조회() {
        return await this.queryBus.execute(new queries_1.GetOrganizationChartQuery());
    }
    async 전체직원목록조회(includeExcluded = false, departmentId) {
        return await this.queryBus.execute(new queries_1.GetAllEmployeesQuery(includeExcluded, departmentId));
    }
    async 상급자조회(employeeId) {
        return await this.queryBus.execute(new queries_1.GetManagerQuery(employeeId));
    }
    async 하급자목록조회(employeeId) {
        return await this.queryBus.execute(new queries_1.GetSubordinatesQuery(employeeId));
    }
    async 하위부서목록조회(departmentId) {
        return await this.queryBus.execute(new queries_1.GetSubDepartmentsQuery(departmentId));
    }
    async 상위부서조회(departmentId) {
        return await this.queryBus.execute(new queries_1.GetParentDepartmentQuery(departmentId));
    }
    async 활성직원목록조회(includeExcluded = false) {
        return await this.queryBus.execute(new queries_1.GetActiveEmployeesQuery(includeExcluded));
    }
    async 직원조회제외(employeeId, excludeReason, excludedBy) {
        return await this.commandBus.execute(new commands_1.ExcludeEmployeeFromListCommand(employeeId, excludeReason, excludedBy));
    }
    async 직원조회포함(employeeId, updatedBy) {
        return await this.commandBus.execute(new commands_1.IncludeEmployeeInListCommand(employeeId, updatedBy));
    }
    async 직원관리자권한변경(employeeId, isAdmin, updatedBy) {
        return await this.commandBus.execute(new commands_1.UpdateEmployeeAdminCommand(employeeId, isAdmin, updatedBy));
    }
    async 여러직원관리자권한변경(employeeIds, isAdmin, updatedBy) {
        return await this.commandBus.execute(new commands_1.BulkUpdateEmployeeAdminCommand(employeeIds, isAdmin, updatedBy));
    }
    async 부서하이라키조회() {
        return await this.queryBus.execute(new queries_1.GetDepartmentHierarchyQuery());
    }
    async 부서하이라키_직원포함_조회() {
        return await this.queryBus.execute(new queries_1.GetDepartmentHierarchyWithEmployeesQuery());
    }
    async SSO에서_직원정보를_조회한다(includeTerminated = false) {
        return await this.ssoService.여러직원정보를조회한다({
            withDetail: true,
            includeTerminated,
        });
    }
    async SSO에서_사번으로_직원을_조회한다(employeeNumber) {
        return await this.ssoService.사번으로직원을조회한다(employeeNumber);
    }
    async SSO에서_이메일로_직원을_조회한다(email) {
        return await this.ssoService.이메일로직원을조회한다(email);
    }
    async 부서장조회(employeeId) {
        return await this.queryBus.execute(new queries_1.FindDepartmentManagerQuery(employeeId));
    }
    async 사번으로_관리자권한있는가(employeeNumber) {
        return await this.employeeService.사번으로_관리자권한있는가(employeeNumber);
    }
    async 관리자권한동기화(updatedBy) {
        return await this.commandBus.execute(new commands_1.SyncAdminPermissionsCommand(updatedBy));
    }
};
exports.OrganizationManagementService = OrganizationManagementService;
exports.OrganizationManagementService = OrganizationManagementService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_2.Inject)(sso_1.SSOService)),
    __metadata("design:paramtypes", [cqrs_1.QueryBus,
        cqrs_1.CommandBus, Object, employee_service_1.EmployeeService])
], OrganizationManagementService);
//# sourceMappingURL=organization-management.service.js.map