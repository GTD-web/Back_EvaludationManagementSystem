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
exports.EvaluatorEmployeeManagementController = void 0;
const organization_management_service_1 = require("../../../context/organization-management-context/organization-management.service");
const employee_management_api_decorators_1 = require("../../common/decorators/employee-management/employee-management-api.decorators");
const employee_management_dto_1 = require("../../common/dto/employee-management/employee-management.dto");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let EvaluatorEmployeeManagementController = class EvaluatorEmployeeManagementController {
    organizationManagementService;
    constructor(organizationManagementService) {
        this.organizationManagementService = organizationManagementService;
    }
    async getDepartmentHierarchy() {
        return await this.organizationManagementService.부서하이라키조회();
    }
    async getDepartmentHierarchyWithEmployees() {
        return await this.organizationManagementService.부서하이라키_직원포함_조회();
    }
    async getAllEmployees(query) {
        return await this.organizationManagementService.전체직원목록조회(query.includeExcluded || false, query.departmentId);
    }
};
exports.EvaluatorEmployeeManagementController = EvaluatorEmployeeManagementController;
__decorate([
    (0, employee_management_api_decorators_1.GetDepartmentHierarchy)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluatorEmployeeManagementController.prototype, "getDepartmentHierarchy", null);
__decorate([
    (0, employee_management_api_decorators_1.GetDepartmentHierarchyWithEmployees)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluatorEmployeeManagementController.prototype, "getDepartmentHierarchyWithEmployees", null);
__decorate([
    (0, employee_management_api_decorators_1.GetAllEmployees)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_management_dto_1.GetEmployeesQueryDto]),
    __metadata("design:returntype", Promise)
], EvaluatorEmployeeManagementController.prototype, "getAllEmployees", null);
exports.EvaluatorEmployeeManagementController = EvaluatorEmployeeManagementController = __decorate([
    (0, swagger_1.ApiTags)('A-1. 평가자 - 조직 관리'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('evaluator'),
    (0, common_1.Controller)('evaluator/employees'),
    __metadata("design:paramtypes", [organization_management_service_1.OrganizationManagementService])
], EvaluatorEmployeeManagementController);
//# sourceMappingURL=evaluator-employee-management.controller.js.map