"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardContextModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const dashboard_service_1 = require("./dashboard.service");
const evaluation_period_entity_1 = require("../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../domain/common/department/department.entity");
const project_entity_1 = require("../../domain/common/project/project.entity");
const wbs_item_entity_1 = require("../../domain/common/wbs-item/wbs-item.entity");
const evaluation_project_assignment_entity_1 = require("../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_wbs_assignment_entity_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_evaluation_criteria_entity_1 = require("../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const evaluation_line_entity_1 = require("../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const wbs_self_evaluation_entity_1 = require("../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_entity_1 = require("../../domain/core/downward-evaluation/downward-evaluation.entity");
const peer_evaluation_entity_1 = require("../../domain/core/peer-evaluation/peer-evaluation.entity");
const final_evaluation_entity_1 = require("../../domain/core/final-evaluation/final-evaluation.entity");
const deliverable_entity_1 = require("../../domain/core/deliverable/deliverable.entity");
const evaluation_revision_request_entity_1 = require("../../domain/sub/evaluation-revision-request/evaluation-revision-request.entity");
const evaluation_revision_request_recipient_entity_1 = require("../../domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity");
const secondary_evaluation_step_approval_entity_1 = require("../../domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.entity");
const evaluation_activity_log_entity_1 = require("../../domain/core/evaluation-activity-log/evaluation-activity-log.entity");
const queries_1 = require("./handlers/queries");
const employee_evaluation_step_approval_1 = require("../../domain/sub/employee-evaluation-step-approval");
const secondary_evaluation_step_approval_1 = require("../../domain/sub/secondary-evaluation-step-approval");
const evaluation_activity_log_context_module_1 = require("../evaluation-activity-log-context/evaluation-activity-log-context.module");
let DashboardContextModule = class DashboardContextModule {
};
exports.DashboardContextModule = DashboardContextModule;
exports.DashboardContextModule = DashboardContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            employee_evaluation_step_approval_1.EmployeeEvaluationStepApprovalModule,
            secondary_evaluation_step_approval_1.SecondaryEvaluationStepApprovalModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
            typeorm_1.TypeOrmModule.forFeature([
                evaluation_period_entity_1.EvaluationPeriod,
                evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping,
                employee_entity_1.Employee,
                department_entity_1.Department,
                project_entity_1.Project,
                wbs_item_entity_1.WbsItem,
                evaluation_project_assignment_entity_1.EvaluationProjectAssignment,
                evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment,
                wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria,
                evaluation_line_entity_1.EvaluationLine,
                evaluation_line_mapping_entity_1.EvaluationLineMapping,
                wbs_self_evaluation_entity_1.WbsSelfEvaluation,
                downward_evaluation_entity_1.DownwardEvaluation,
                peer_evaluation_entity_1.PeerEvaluation,
                final_evaluation_entity_1.FinalEvaluation,
                deliverable_entity_1.Deliverable,
                evaluation_revision_request_entity_1.EvaluationRevisionRequest,
                evaluation_revision_request_recipient_entity_1.EvaluationRevisionRequestRecipient,
                secondary_evaluation_step_approval_entity_1.SecondaryEvaluationStepApproval,
                evaluation_activity_log_entity_1.EvaluationActivityLog,
            ]),
        ],
        providers: [dashboard_service_1.DashboardService, ...queries_1.QUERY_HANDLERS],
        exports: [dashboard_service_1.DashboardService],
    })
], DashboardContextModule);
//# sourceMappingURL=dashboard-context.module.js.map