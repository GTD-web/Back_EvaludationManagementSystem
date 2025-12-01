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
exports.CleanupTestDataHandler = exports.CleanupTestDataCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_test_service_1 = require("../../../domain/common/department/department-test.service");
const employee_test_service_1 = require("../../../domain/common/employee/employee-test.service");
const project_test_service_1 = require("../../../domain/common/project/project-test.service");
const wbs_item_test_service_1 = require("../../../domain/common/wbs-item/wbs-item-test.service");
const evaluation_period_entity_1 = require("../../../domain/core/evaluation-period/evaluation-period.entity");
class CleanupTestDataCommand {
}
exports.CleanupTestDataCommand = CleanupTestDataCommand;
let CleanupTestDataHandler = class CleanupTestDataHandler {
    departmentTestService;
    employeeTestService;
    projectTestService;
    wbsItemTestService;
    evaluationPeriodRepository;
    constructor(departmentTestService, employeeTestService, projectTestService, wbsItemTestService, evaluationPeriodRepository) {
        this.departmentTestService = departmentTestService;
        this.employeeTestService = employeeTestService;
        this.projectTestService = projectTestService;
        this.wbsItemTestService = wbsItemTestService;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
    }
    async execute(command) {
        const [departmentCount, employeeCount, projectCount, wbsItemCount, periodCount,] = await Promise.all([
            this.departmentTestService.테스트_데이터를_정리한다(),
            this.employeeTestService.테스트_데이터를_정리한다(),
            this.projectTestService.테스트_데이터를_정리한다(),
            this.wbsItemTestService.테스트_데이터를_정리한다(),
            this.cleanupEvaluationPeriods(),
        ]);
        console.log(`테스트 데이터 정리 완료 - 부서: ${departmentCount}, 직원: ${employeeCount}, 프로젝트: ${projectCount}, WBS: ${wbsItemCount}, 평가기간: ${periodCount}`);
        return {
            departments: departmentCount,
            employees: employeeCount,
            projects: projectCount,
            wbsItems: wbsItemCount,
            periods: periodCount,
        };
    }
    async cleanupEvaluationPeriods() {
        const periods = await this.evaluationPeriodRepository.find();
        if (periods.length > 0) {
            await this.evaluationPeriodRepository.remove(periods);
        }
        return periods.length;
    }
};
exports.CleanupTestDataHandler = CleanupTestDataHandler;
exports.CleanupTestDataHandler = CleanupTestDataHandler = __decorate([
    (0, cqrs_1.CommandHandler)(CleanupTestDataCommand),
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __metadata("design:paramtypes", [department_test_service_1.DepartmentTestService,
        employee_test_service_1.EmployeeTestService,
        project_test_service_1.ProjectTestService,
        wbs_item_test_service_1.WbsItemTestService,
        typeorm_2.Repository])
], CleanupTestDataHandler);
//# sourceMappingURL=cleanup-test-data.handler.js.map