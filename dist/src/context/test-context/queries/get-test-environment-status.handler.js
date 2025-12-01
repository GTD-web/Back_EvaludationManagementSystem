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
exports.GetTestEnvironmentStatusHandler = exports.GetTestEnvironmentStatusQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const employee_test_service_1 = require("../../../domain/common/employee/employee-test.service");
class GetTestEnvironmentStatusQuery {
}
exports.GetTestEnvironmentStatusQuery = GetTestEnvironmentStatusQuery;
let GetTestEnvironmentStatusHandler = class GetTestEnvironmentStatusHandler {
    employeeTestService;
    constructor(employeeTestService) {
        this.employeeTestService = employeeTestService;
    }
    async execute(query) {
        const employeeCount = await this.employeeTestService.현재_직원_수를_조회한다();
        console.log(`현재 테스트 환경 상태 - 직원: ${employeeCount}명`);
        return {
            departmentCount: 0,
            employeeCount,
            projectCount: 0,
            wbsItemCount: 0,
        };
    }
};
exports.GetTestEnvironmentStatusHandler = GetTestEnvironmentStatusHandler;
exports.GetTestEnvironmentStatusHandler = GetTestEnvironmentStatusHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetTestEnvironmentStatusQuery),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employee_test_service_1.EmployeeTestService])
], GetTestEnvironmentStatusHandler);
//# sourceMappingURL=get-test-environment-status.handler.js.map