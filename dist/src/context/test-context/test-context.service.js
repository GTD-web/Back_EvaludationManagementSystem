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
exports.TestContextService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const create_complete_test_environment_handler_1 = require("./commands/create-complete-test-environment.handler");
const create_test_question_groups_handler_1 = require("./commands/create-test-question-groups.handler");
const create_test_questions_handler_1 = require("./commands/create-test-questions.handler");
const map_questions_to_group_handler_1 = require("./commands/map-questions-to-group.handler");
const cleanup_test_data_handler_1 = require("./commands/cleanup-test-data.handler");
const cleanup_evaluation_question_data_handler_1 = require("./commands/cleanup-evaluation-question-data.handler");
const get_test_environment_status_handler_1 = require("./queries/get-test-environment-status.handler");
const employee_test_service_1 = require("../../domain/common/employee/employee-test.service");
let TestContextService = class TestContextService {
    commandBus;
    queryBus;
    employeeTestService;
    constructor(commandBus, queryBus, employeeTestService) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.employeeTestService = employeeTestService;
    }
    async 완전한_테스트환경을_생성한다() {
        return await this.commandBus.execute(new create_complete_test_environment_handler_1.CreateCompleteTestEnvironmentCommand());
    }
    async 테스트용_질문그룹을_생성한다(createdBy) {
        return await this.commandBus.execute(new create_test_question_groups_handler_1.CreateTestQuestionGroupsCommand(createdBy));
    }
    async 테스트용_평가질문을_생성한다(createdBy) {
        return await this.commandBus.execute(new create_test_questions_handler_1.CreateTestQuestionsCommand(createdBy));
    }
    async 질문그룹에_질문을_매핑한다(groupId, questionIds, createdBy) {
        return await this.commandBus.execute(new map_questions_to_group_handler_1.MapQuestionsToGroupCommand(groupId, questionIds, createdBy));
    }
    async 테스트_데이터를_정리한다() {
        return await this.commandBus.execute(new cleanup_test_data_handler_1.CleanupTestDataCommand());
    }
    async 평가질문_테스트데이터를_정리한다() {
        return await this.commandBus.execute(new cleanup_evaluation_question_data_handler_1.CleanupEvaluationQuestionDataCommand());
    }
    async 테스트환경_상태를_확인한다() {
        return await this.queryBus.execute(new get_test_environment_status_handler_1.GetTestEnvironmentStatusQuery());
    }
    async 직원_데이터를_확인하고_준비한다(minCount = 3) {
        console.log('=== 직원 데이터 확인 및 준비 ===');
        const employees = await this.employeeTestService.직원_데이터를_확인하고_생성한다(minCount);
        console.log(`준비된 직원 수: ${employees.length}`);
        return employees;
    }
    async 테스트용_평가기간을_생성한다() {
        const result = await this.완전한_테스트환경을_생성한다();
        return result.periods;
    }
    async 부서와_직원을_생성한다() {
        const result = await this.완전한_테스트환경을_생성한다();
        return {
            departments: result.departments,
            employees: result.employees,
        };
    }
    async 프로젝트와_WBS를_생성한다(projectCount = 3) {
        const result = await this.완전한_테스트환경을_생성한다();
        return {
            projects: result.projects,
            wbsItems: result.wbsItems,
        };
    }
    async 특정_부서에_직원을_추가한다(departmentId, employeeCount = 5) {
        return await this.employeeTestService.부서별_직원_테스트데이터를_생성한다(departmentId, employeeCount);
    }
    async 특정_프로젝트에_WBS를_추가한다(projectId, wbsCount = 10) {
        console.warn('특정_프로젝트에_WBS를_추가한다는 레거시 메서드입니다. CQRS 패턴으로 마이그레이션이 필요합니다.');
        return [];
    }
    async 매니저_하위직원_관계를_생성한다(managerCount = 3, employeesPerManager = 3) {
        return await this.employeeTestService.매니저_하위직원_테스트데이터를_생성한다(managerCount, employeesPerManager);
    }
    async 계층구조_WBS를_생성한다(projectId, maxLevel = 3, itemsPerLevel = 2) {
        console.warn('계층구조_WBS를_생성한다는 레거시 메서드입니다. CQRS 패턴으로 마이그레이션이 필요합니다.');
        return [];
    }
    async 평가시스템용_완전한_테스트데이터를_생성한다() {
        const result = await this.완전한_테스트환경을_생성한다();
        return {
            departments: result.departments,
            employees: result.employees,
            projects: result.projects,
            wbsItems: result.wbsItems,
            periods: result.periods,
        };
    }
    async 테스트용_WBS할당을_생성한다(employees, projects, wbsItems, periods) {
        console.warn('테스트용_WBS할당을_생성한다는 레거시 메서드입니다. 완전한_테스트환경을_생성한다를 사용하세요.');
        return [];
    }
    async 평가기간_테스트데이터를_정리한다() {
        const result = await this.테스트_데이터를_정리한다();
        return result.periods;
    }
    async 모든_테스트데이터를_삭제한다() {
        const result = await this.테스트_데이터를_정리한다();
        return {
            departments: result.departments,
            employees: result.employees,
            projects: result.projects,
            wbsItems: result.wbsItems,
        };
    }
};
exports.TestContextService = TestContextService;
exports.TestContextService = TestContextService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus,
        employee_test_service_1.EmployeeTestService])
], TestContextService);
//# sourceMappingURL=test-context.service.js.map