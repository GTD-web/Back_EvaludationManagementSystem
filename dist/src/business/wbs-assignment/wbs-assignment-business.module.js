"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsAssignmentBusinessModule = void 0;
const common_1 = require("@nestjs/common");
const evaluation_criteria_management_context_module_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module");
const evaluation_activity_log_context_module_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.module");
const employee_module_1 = require("../../domain/common/employee/employee.module");
const project_module_1 = require("../../domain/common/project/project.module");
const evaluation_line_module_1 = require("../../domain/core/evaluation-line/evaluation-line.module");
const evaluation_line_mapping_module_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module");
const evaluation_wbs_assignment_module_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module");
const wbs_self_evaluation_module_1 = require("../../domain/core/wbs-self-evaluation/wbs-self-evaluation.module");
const wbs_assignment_business_service_1 = require("./wbs-assignment-business.service");
let WbsAssignmentBusinessModule = class WbsAssignmentBusinessModule {
};
exports.WbsAssignmentBusinessModule = WbsAssignmentBusinessModule;
exports.WbsAssignmentBusinessModule = WbsAssignmentBusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            evaluation_criteria_management_context_module_1.EvaluationCriteriaManagementContextModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
            employee_module_1.EmployeeModule,
            project_module_1.ProjectModule,
            evaluation_line_module_1.EvaluationLineModule,
            evaluation_line_mapping_module_1.EvaluationLineMappingModule,
            evaluation_wbs_assignment_module_1.EvaluationWbsAssignmentModule,
            wbs_self_evaluation_module_1.WbsSelfEvaluationModule,
        ],
        providers: [wbs_assignment_business_service_1.WbsAssignmentBusinessService],
        exports: [wbs_assignment_business_service_1.WbsAssignmentBusinessService],
    })
], WbsAssignmentBusinessModule);
//# sourceMappingURL=wbs-assignment-business.module.js.map