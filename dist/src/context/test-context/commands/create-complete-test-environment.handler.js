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
exports.CreateCompleteTestEnvironmentHandler = exports.CreateCompleteTestEnvironmentCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_test_service_1 = require("../../../domain/common/department/department-test.service");
const employee_test_service_1 = require("../../../domain/common/employee/employee-test.service");
const project_test_service_1 = require("../../../domain/common/project/project-test.service");
const wbs_item_test_service_1 = require("../../../domain/common/wbs-item/wbs-item-test.service");
const evaluation_period_entity_1 = require("../../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const evaluation_project_assignment_entity_1 = require("../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_line_entity_1 = require("../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_mapping_entity_1 = require("../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_period_types_1 = require("../../../domain/core/evaluation-period/evaluation-period.types");
const evaluation_line_types_1 = require("../../../domain/core/evaluation-line/evaluation-line.types");
class CreateCompleteTestEnvironmentCommand {
}
exports.CreateCompleteTestEnvironmentCommand = CreateCompleteTestEnvironmentCommand;
let CreateCompleteTestEnvironmentHandler = class CreateCompleteTestEnvironmentHandler {
    departmentTestService;
    employeeTestService;
    projectTestService;
    wbsItemTestService;
    evaluationPeriodRepository;
    evaluationWbsAssignmentRepository;
    evaluationProjectAssignmentRepository;
    evaluationLineRepository;
    evaluationLineMappingRepository;
    constructor(departmentTestService, employeeTestService, projectTestService, wbsItemTestService, evaluationPeriodRepository, evaluationWbsAssignmentRepository, evaluationProjectAssignmentRepository, evaluationLineRepository, evaluationLineMappingRepository) {
        this.departmentTestService = departmentTestService;
        this.employeeTestService = employeeTestService;
        this.projectTestService = projectTestService;
        this.wbsItemTestService = wbsItemTestService;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.evaluationWbsAssignmentRepository = evaluationWbsAssignmentRepository;
        this.evaluationProjectAssignmentRepository = evaluationProjectAssignmentRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
    }
    async execute(command) {
        const departments = await this.departmentTestService.테스트용_목데이터를_생성한다();
        const employees = await this.employeeTestService.직원_데이터를_확인하고_생성한다(5);
        const projects = await this.projectTestService.테스트용_목데이터를_생성한다();
        const firstProject = projects[0];
        const wbsItems = firstProject
            ? await this.wbsItemTestService.테스트용_목데이터를_생성한다(firstProject.id)
            : [];
        const periods = await this.createEvaluationPeriods();
        const wbsAssignments = await this.createWbsAssignments(employees, projects, wbsItems, periods);
        const evaluationLines = await this.createEvaluationLines();
        await this.createEvaluationLineMappings(employees, wbsItems, evaluationLines);
        console.log(`완전한 테스트 환경 생성 완료: 부서 ${departments.length}, 직원 ${employees.length}, 프로젝트 ${projects.length}, WBS ${wbsItems.length}, 평가기간 ${periods.length}, WBS할당 ${wbsAssignments.length}, 평가라인 ${evaluationLines.length}`);
        return {
            departments,
            employees,
            projects,
            wbsItems,
            periods,
            wbsAssignments,
        };
    }
    async createEvaluationPeriods() {
        const timestamp = Date.now();
        const periods = [];
        const inProgressPeriod = this.evaluationPeriodRepository.create({
            name: `테스트 평가기간 (진행중) ${timestamp}`,
            startDate: new Date('2024-01-01'),
            peerEvaluationDeadline: new Date('2024-12-31'),
            description: '테스트용 진행 중인 평가기간',
            maxSelfEvaluationRate: 120,
            status: evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS,
        });
        periods.push(inProgressPeriod);
        const waitingPeriod = this.evaluationPeriodRepository.create({
            name: `테스트 평가기간 (대기) ${timestamp + 1}`,
            startDate: new Date('2025-01-01'),
            peerEvaluationDeadline: new Date('2025-12-31'),
            description: '테스트용 대기 중인 평가기간',
            maxSelfEvaluationRate: 120,
            status: evaluation_period_types_1.EvaluationPeriodStatus.WAITING,
        });
        periods.push(waitingPeriod);
        const completedPeriod = this.evaluationPeriodRepository.create({
            name: `테스트 평가기간 (완료) ${timestamp + 2}`,
            startDate: new Date('2023-01-01'),
            peerEvaluationDeadline: new Date('2023-12-31'),
            description: '테스트용 완료된 평가기간',
            maxSelfEvaluationRate: 120,
            status: evaluation_period_types_1.EvaluationPeriodStatus.COMPLETED,
        });
        periods.push(completedPeriod);
        const savedPeriods = await this.evaluationPeriodRepository.save(periods);
        return savedPeriods.map((p) => p);
    }
    async createWbsAssignments(employees, projects, wbsItems, periods) {
        if (employees.length === 0 ||
            projects.length === 0 ||
            wbsItems.length === 0 ||
            periods.length === 0) {
            return [];
        }
        const inProgressPeriod = periods.find((p) => p.status === evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS);
        if (!inProgressPeriod) {
            return [];
        }
        const firstProject = projects[0];
        const assignedBy = employees[0].id;
        const projectAssignments = [];
        for (const employee of employees) {
            const projectAssignment = this.evaluationProjectAssignmentRepository.create({
                periodId: inProgressPeriod.id,
                employeeId: employee.id,
                projectId: firstProject.id,
                assignedBy: assignedBy,
                assignedDate: new Date(),
            });
            projectAssignments.push(projectAssignment);
        }
        await this.evaluationProjectAssignmentRepository.save(projectAssignments);
        const assignments = [];
        for (const employee of employees) {
            for (let i = 0; i < wbsItems.length; i++) {
                const wbsItem = wbsItems[i];
                const assignment = this.evaluationWbsAssignmentRepository.create({
                    periodId: inProgressPeriod.id,
                    employeeId: employee.id,
                    projectId: firstProject.id,
                    wbsItemId: wbsItem.id,
                    assignedBy: assignedBy,
                    assignedDate: new Date(),
                    displayOrder: i,
                });
                assignments.push(assignment);
            }
        }
        const savedAssignments = await this.evaluationWbsAssignmentRepository.save(assignments);
        return savedAssignments.map((a) => a.DTO로_변환한다());
    }
    async createEvaluationLines() {
        const lines = [];
        const primaryLine = this.evaluationLineRepository.create({
            evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
            order: 1,
            isRequired: true,
            isAutoAssigned: false,
        });
        lines.push(primaryLine);
        const secondaryLine = this.evaluationLineRepository.create({
            evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
            order: 2,
            isRequired: false,
            isAutoAssigned: false,
        });
        lines.push(secondaryLine);
        return await this.evaluationLineRepository.save(lines);
    }
    async createEvaluationLineMappings(employees, wbsItems, evaluationLines) {
        if (employees.length === 0 ||
            wbsItems.length === 0 ||
            evaluationLines.length === 0) {
            return;
        }
        const primaryLine = evaluationLines.find((l) => l.evaluatorType === evaluation_line_types_1.EvaluatorType.PRIMARY);
        const secondaryLine = evaluationLines.find((l) => l.evaluatorType === evaluation_line_types_1.EvaluatorType.SECONDARY);
        if (!primaryLine || !secondaryLine) {
            console.warn('평가라인을 찾을 수 없습니다. 평가라인 매핑을 건너뜁니다.');
            return;
        }
        const batchSize = 500;
        const mappings = [];
        for (const evaluatee of employees) {
            for (const wbsItem of wbsItems) {
                for (const evaluator of employees) {
                    if (evaluatee.id === evaluator.id) {
                        continue;
                    }
                    const primaryMapping = this.evaluationLineMappingRepository.create({
                        employeeId: evaluatee.id,
                        evaluationLineId: primaryLine.id,
                        evaluatorId: evaluator.id,
                        wbsItemId: wbsItem.id,
                    });
                    mappings.push(primaryMapping);
                    const secondaryMapping = this.evaluationLineMappingRepository.create({
                        employeeId: evaluatee.id,
                        evaluationLineId: secondaryLine.id,
                        evaluatorId: evaluator.id,
                        wbsItemId: wbsItem.id,
                    });
                    mappings.push(secondaryMapping);
                    if (mappings.length >= batchSize) {
                        console.log(`평가라인 매핑 배치 저장: ${mappings.length}개`);
                        await this.evaluationLineMappingRepository.save(mappings);
                        mappings.length = 0;
                    }
                }
            }
        }
        if (mappings.length > 0) {
            console.log(`평가라인 매핑 최종 저장: ${mappings.length}개`);
            await this.evaluationLineMappingRepository.save(mappings);
        }
        console.log('평가라인 매핑 생성 완료');
    }
};
exports.CreateCompleteTestEnvironmentHandler = CreateCompleteTestEnvironmentHandler;
exports.CreateCompleteTestEnvironmentHandler = CreateCompleteTestEnvironmentHandler = __decorate([
    (0, cqrs_1.CommandHandler)(CreateCompleteTestEnvironmentCommand),
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(5, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(6, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(7, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(8, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __metadata("design:paramtypes", [department_test_service_1.DepartmentTestService,
        employee_test_service_1.EmployeeTestService,
        project_test_service_1.ProjectTestService,
        wbs_item_test_service_1.WbsItemTestService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CreateCompleteTestEnvironmentHandler);
//# sourceMappingURL=create-complete-test-environment.handler.js.map