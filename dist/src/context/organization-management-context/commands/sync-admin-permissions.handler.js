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
var SyncAdminPermissionsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAdminPermissionsHandler = exports.SyncAdminPermissionsCommand = void 0;
const employee_service_1 = require("../../../domain/common/employee/employee.service");
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
class SyncAdminPermissionsCommand {
    updatedBy;
    constructor(updatedBy) {
        this.updatedBy = updatedBy;
    }
}
exports.SyncAdminPermissionsCommand = SyncAdminPermissionsCommand;
let SyncAdminPermissionsHandler = SyncAdminPermissionsHandler_1 = class SyncAdminPermissionsHandler {
    employeeService;
    logger = new common_1.Logger(SyncAdminPermissionsHandler_1.name);
    ADMIN_EMPLOYEE_NAMES = [
        '남명용',
        '이봉은',
        '우은진',
        '전무현',
        '우창욱',
        '김종식',
    ];
    constructor(employeeService) {
        this.employeeService = employeeService;
    }
    async execute(command) {
        this.logger.log('관리자 권한 동기화를 시작합니다...');
        const allEmployees = await this.employeeService.findAll(true);
        let updated = 0;
        const updatedEmployees = [];
        for (const employee of allEmployees) {
            const shouldBeAccessible = this.ADMIN_EMPLOYEE_NAMES.includes(employee.name);
            if (employee.isAccessible !== shouldBeAccessible) {
                employee.isAccessible = shouldBeAccessible;
                employee.updatedBy = command.updatedBy;
                await this.employeeService.save(employee);
                updated++;
                updatedEmployees.push(`${employee.name} (${employee.employeeNumber}): ${shouldBeAccessible ? '권한 부여' : '권한 제거'}`);
                this.logger.log(`직원 ${employee.name} (${employee.employeeNumber}): isAccessible = ${shouldBeAccessible}`);
            }
        }
        const result = {
            totalProcessed: allEmployees.length,
            updated,
            adminEmployees: this.ADMIN_EMPLOYEE_NAMES,
            message: `총 ${allEmployees.length}명 중 ${updated}명의 관리자 권한을 업데이트했습니다.`,
        };
        this.logger.log(`관리자 권한 동기화 완료: 총 ${allEmployees.length}명 처리, ${updated}명 업데이트`);
        return result;
    }
};
exports.SyncAdminPermissionsHandler = SyncAdminPermissionsHandler;
exports.SyncAdminPermissionsHandler = SyncAdminPermissionsHandler = SyncAdminPermissionsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(SyncAdminPermissionsCommand),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService])
], SyncAdminPermissionsHandler);
//# sourceMappingURL=sync-admin-permissions.handler.js.map