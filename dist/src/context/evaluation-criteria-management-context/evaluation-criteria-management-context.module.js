"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationCriteriaManagementContextModule = void 0;
const department_entity_1 = require("../../domain/common/department/department.entity");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const employee_module_1 = require("../../domain/common/employee/employee.module");
const project_entity_1 = require("../../domain/common/project/project.entity");
const project_module_1 = require("../../domain/common/project/project.module");
const evaluation_line_mapping_module_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_module_1 = require("../../domain/core/evaluation-line/evaluation-line.module");
const evaluation_line_entity_1 = require("../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_period_entity_1 = require("../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_project_assignment_entity_1 = require("../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_project_assignment_module_1 = require("../../domain/core/evaluation-project-assignment/evaluation-project-assignment.module");
const evaluation_wbs_assignment_module_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module");
const wbs_evaluation_criteria_module_1 = require("../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.module");
const transaction_manager_service_1 = require("../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const evaluation_criteria_management_service_1 = require("./evaluation-criteria-management.service");
const project_assignment_1 = require("./handlers/project-assignment");
const wbs_assignment_1 = require("./handlers/wbs-assignment");
const evaluation_line_1 = require("./handlers/evaluation-line");
const wbs_evaluation_criteria_1 = require("./handlers/wbs-evaluation-criteria");
const wbs_item_1 = require("./handlers/wbs-item");
const evaluation_period_module_1 = require("../../domain/core/evaluation-period/evaluation-period.module");
const evaluation_period_employee_mapping_module_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.module");
const evaluation_wbs_assignment_entity_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_evaluation_criteria_entity_1 = require("../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const wbs_item_module_1 = require("../../domain/common/wbs-item/wbs-item.module");
const wbs_assignment_weight_calculation_service_1 = require("./services/wbs-assignment-weight-calculation.service");
const wbs_assignment_validation_service_1 = require("./services/wbs-assignment-validation.service");
const wbs_self_evaluation_module_1 = require("../../domain/core/wbs-self-evaluation/wbs-self-evaluation.module");
let EvaluationCriteriaManagementContextModule = class EvaluationCriteriaManagementContextModule {
};
exports.EvaluationCriteriaManagementContextModule = EvaluationCriteriaManagementContextModule;
exports.EvaluationCriteriaManagementContextModule = EvaluationCriteriaManagementContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            typeorm_1.TypeOrmModule.forFeature([
                evaluation_project_assignment_entity_1.EvaluationProjectAssignment,
                employee_entity_1.Employee,
                department_entity_1.Department,
                project_entity_1.Project,
                evaluation_period_entity_1.EvaluationPeriod,
                evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment,
                wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria,
                evaluation_line_entity_1.EvaluationLine,
                evaluation_line_mapping_entity_1.EvaluationLineMapping,
            ]),
            evaluation_project_assignment_module_1.EvaluationProjectAssignmentModule,
            evaluation_wbs_assignment_module_1.EvaluationWbsAssignmentModule,
            evaluation_line_module_1.EvaluationLineModule,
            evaluation_line_mapping_module_1.EvaluationLineMappingModule,
            wbs_evaluation_criteria_module_1.WbsEvaluationCriteriaModule,
            wbs_self_evaluation_module_1.WbsSelfEvaluationModule,
            project_module_1.ProjectModule,
            employee_module_1.EmployeeModule,
            evaluation_period_module_1.EvaluationPeriodModule,
            evaluation_period_employee_mapping_module_1.EvaluationPeriodEmployeeMappingModule,
            wbs_item_module_1.WbsItemModule,
        ],
        providers: [
            evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
            transaction_manager_service_1.TransactionManagerService,
            wbs_assignment_weight_calculation_service_1.WbsAssignmentWeightCalculationService,
            wbs_assignment_validation_service_1.WbsAssignmentValidationService,
            ...project_assignment_1.PROJECT_ASSIGNMENT_HANDLERS,
            ...wbs_assignment_1.WBS_ASSIGNMENT_HANDLERS,
            ...evaluation_line_1.EVALUATION_LINE_HANDLERS,
            ...wbs_evaluation_criteria_1.WBS_EVALUATION_CRITERIA_HANDLERS,
            ...wbs_item_1.WBS_ITEM_HANDLERS,
        ],
        exports: [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService],
    })
], EvaluationCriteriaManagementContextModule);
//# sourceMappingURL=evaluation-criteria-management-context.module.js.map