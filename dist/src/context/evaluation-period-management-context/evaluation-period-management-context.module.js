"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodManagementContextModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const evaluation_period_module_1 = require("../../domain/core/evaluation-period/evaluation-period.module");
const evaluation_period_employee_mapping_module_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.module");
const evaluation_project_assignment_module_1 = require("../../domain/core/evaluation-project-assignment/evaluation-project-assignment.module");
const evaluation_wbs_assignment_module_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module");
const evaluation_line_mapping_module_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module");
const evaluation_period_entity_1 = require("../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../domain/common/department/department.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const evaluation_project_assignment_entity_1 = require("../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_wbs_assignment_entity_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const project_entity_1 = require("../../domain/common/project/project.entity");
const wbs_item_entity_1 = require("../../domain/common/wbs-item/wbs-item.entity");
const wbs_evaluation_criteria_entity_1 = require("../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const evaluation_line_entity_1 = require("../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_period_management_service_1 = require("./evaluation-period-management.service");
const handlers_1 = require("./handlers");
let EvaluationPeriodManagementContextModule = class EvaluationPeriodManagementContextModule {
};
exports.EvaluationPeriodManagementContextModule = EvaluationPeriodManagementContextModule;
exports.EvaluationPeriodManagementContextModule = EvaluationPeriodManagementContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            typeorm_1.TypeOrmModule.forFeature([
                evaluation_period_entity_1.EvaluationPeriod,
                employee_entity_1.Employee,
                department_entity_1.Department,
                evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping,
                evaluation_project_assignment_entity_1.EvaluationProjectAssignment,
                evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment,
                evaluation_line_mapping_entity_1.EvaluationLineMapping,
                project_entity_1.Project,
                wbs_item_entity_1.WbsItem,
                wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria,
                evaluation_line_entity_1.EvaluationLine,
            ]),
            evaluation_period_module_1.EvaluationPeriodModule,
            evaluation_period_employee_mapping_module_1.EvaluationPeriodEmployeeMappingModule,
            evaluation_project_assignment_module_1.EvaluationProjectAssignmentModule,
            evaluation_wbs_assignment_module_1.EvaluationWbsAssignmentModule,
            evaluation_line_mapping_module_1.EvaluationLineMappingModule,
        ],
        providers: [
            evaluation_period_management_service_1.EvaluationPeriodManagementContextService,
            ...handlers_1.COMMAND_HANDLERS,
            ...handlers_1.QUERY_HANDLERS,
        ],
        exports: [evaluation_period_management_service_1.EvaluationPeriodManagementContextService],
    })
], EvaluationPeriodManagementContextModule);
//# sourceMappingURL=evaluation-period-management-context.module.js.map