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
exports.BulkUpdateEmployeeAdminHandler = exports.BulkUpdateEmployeeAdminCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
class BulkUpdateEmployeeAdminCommand {
    employeeIds;
    isAdmin;
    updatedBy;
    constructor(employeeIds, isAdmin, updatedBy) {
        this.employeeIds = employeeIds;
        this.isAdmin = isAdmin;
        this.updatedBy = updatedBy;
    }
}
exports.BulkUpdateEmployeeAdminCommand = BulkUpdateEmployeeAdminCommand;
let BulkUpdateEmployeeAdminHandler = class BulkUpdateEmployeeAdminHandler {
    employeeService;
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    async execute(command) {
        const { employeeIds, isAdmin, updatedBy } = command;
        return await this.employeeService.여러직원관리자권한변경한다(employeeIds, isAdmin, updatedBy);
    }
};
exports.BulkUpdateEmployeeAdminHandler = BulkUpdateEmployeeAdminHandler;
exports.BulkUpdateEmployeeAdminHandler = BulkUpdateEmployeeAdminHandler = __decorate([
    (0, cqrs_1.CommandHandler)(BulkUpdateEmployeeAdminCommand),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], BulkUpdateEmployeeAdminHandler);
//# sourceMappingURL=bulk-update-employee-admin.handler.js.map