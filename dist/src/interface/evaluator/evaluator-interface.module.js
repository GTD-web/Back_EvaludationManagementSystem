"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluatorInterfaceModule = void 0;
const common_1 = require("@nestjs/common");
const business_module_1 = require("../../business/business.module");
const audit_log_context_module_1 = require("../../context/audit-log-context/audit-log-context.module");
const auth_context_module_1 = require("../../context/auth-context/auth-context.module");
const dashboard_context_module_1 = require("../../context/dashboard-context/dashboard-context.module");
const domain_context_module_1 = require("../../context/domain-context.module");
const evaluation_criteria_management_context_module_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module");
const evaluation_period_management_context_module_1 = require("../../context/evaluation-period-management-context/evaluation-period-management-context.module");
const evaluation_question_management_context_module_1 = require("../../context/evaluation-question-management-context/evaluation-question-management-context.module");
const organization_management_context_module_1 = require("../../context/organization-management-context/organization-management-context.module");
const performance_evaluation_context_module_1 = require("../../context/performance-evaluation-context/performance-evaluation-context.module");
const revision_request_context_module_1 = require("../../context/revision-request-context/revision-request-context.module");
const seed_data_context_module_1 = require("../../context/seed-data-context/seed-data-context.module");
const step_approval_context_module_1 = require("../../context/step-approval-context/step-approval-context.module");
const employee_module_1 = require("../../domain/common/employee/employee.module");
const notification_1 = require("../../domain/common/notification");
const system_setting_module_1 = require("../../domain/common/system-setting/system-setting.module");
const evaluation_period_module_1 = require("../../domain/core/evaluation-period/evaluation-period.module");
const evaluator_auth_controller_1 = require("./auth/evaluator-auth.controller");
const evaluator_dashboard_controller_1 = require("./dashboard/evaluator-dashboard.controller");
const evaluator_employee_management_controller_1 = require("./employee-management/evaluator-employee-management.controller");
const evaluator_evaluation_activity_log_controller_1 = require("./evaluation-activity-log/evaluator-evaluation-activity-log.controller");
const evaluator_evaluation_line_management_controller_1 = require("./evaluation-criteria/evaluator-evaluation-line-management.controller");
const evaluator_project_assignment_management_controller_1 = require("./evaluation-criteria/evaluator-project-assignment-management.controller");
const evaluator_wbs_assignment_management_controller_1 = require("./evaluation-criteria/evaluator-wbs-assignment-management.controller");
const evaluator_wbs_evaluation_criteria_management_controller_1 = require("./evaluation-criteria/evaluator-wbs-evaluation-criteria-management.controller");
const evaluator_evaluation_period_management_controller_1 = require("./evaluation-period/evaluator-evaluation-period-management.controller");
const evaluator_deliverable_management_controller_1 = require("./performance-evaluation/evaluator-deliverable-management.controller");
const evaluator_downward_evaluation_management_controller_1 = require("./performance-evaluation/evaluator-downward-evaluation-management.controller");
const evaluator_peer_evaluation_management_controller_1 = require("./performance-evaluation/evaluator-peer-evaluation-management.controller");
const evaluator_wbs_self_evaluation_management_controller_1 = require("./performance-evaluation/evaluator-wbs-self-evaluation-management.controller");
const evaluator_revision_request_controller_1 = require("./revision-request/evaluator-revision-request.controller");
const notification_controller_1 = require("../common/controllers/notification.controller");
let EvaluatorInterfaceModule = class EvaluatorInterfaceModule {
};
exports.EvaluatorInterfaceModule = EvaluatorInterfaceModule;
exports.EvaluatorInterfaceModule = EvaluatorInterfaceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            domain_context_module_1.DomainContextModule,
            auth_context_module_1.AuthContextModule,
            evaluation_period_management_context_module_1.EvaluationPeriodManagementContextModule,
            evaluation_criteria_management_context_module_1.EvaluationCriteriaManagementContextModule,
            performance_evaluation_context_module_1.PerformanceEvaluationContextModule,
            organization_management_context_module_1.OrganizationManagementContextModule,
            dashboard_context_module_1.DashboardContextModule,
            evaluation_question_management_context_module_1.EvaluationQuestionManagementContextModule,
            seed_data_context_module_1.SeedDataContextModule,
            step_approval_context_module_1.StepApprovalContextModule,
            revision_request_context_module_1.RevisionRequestContextModule,
            audit_log_context_module_1.AuditLogContextModule,
            business_module_1.BusinessModule,
            evaluation_period_module_1.EvaluationPeriodModule,
            employee_module_1.EmployeeModule,
            notification_1.NotificationModule,
            system_setting_module_1.SystemSettingModule,
        ],
        controllers: [
            evaluator_auth_controller_1.EvaluatorAuthController,
            evaluator_dashboard_controller_1.EvaluatorDashboardController,
            evaluator_employee_management_controller_1.EvaluatorEmployeeManagementController,
            evaluator_evaluation_activity_log_controller_1.EvaluatorEvaluationActivityLogController,
            evaluator_evaluation_line_management_controller_1.EvaluatorEvaluationLineManagementController,
            evaluator_project_assignment_management_controller_1.EvaluatorProjectAssignmentManagementController,
            evaluator_wbs_assignment_management_controller_1.EvaluatorWbsAssignmentManagementController,
            evaluator_wbs_evaluation_criteria_management_controller_1.EvaluatorWbsEvaluationCriteriaManagementController,
            evaluator_evaluation_period_management_controller_1.EvaluatorEvaluationPeriodManagementController,
            evaluator_deliverable_management_controller_1.EvaluatorDeliverableManagementController,
            evaluator_downward_evaluation_management_controller_1.EvaluatorDownwardEvaluationManagementController,
            evaluator_peer_evaluation_management_controller_1.EvaluatorPeerEvaluationManagementController,
            evaluator_wbs_self_evaluation_management_controller_1.EvaluatorWbsSelfEvaluationManagementController,
            evaluator_revision_request_controller_1.EvaluatorRevisionRequestController,
            notification_controller_1.NotificationController,
        ],
        providers: [],
        exports: [],
    })
], EvaluatorInterfaceModule);
//# sourceMappingURL=evaluator-interface.module.js.map