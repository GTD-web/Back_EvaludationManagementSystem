"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInterfaceModule = void 0;
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
const project_module_1 = require("../../domain/common/project/project.module");
const evaluation_period_module_1 = require("../../domain/core/evaluation-period/evaluation-period.module");
const user_auth_controller_1 = require("./auth/user-auth.controller");
const user_dashboard_controller_1 = require("./dashboard/user-dashboard.controller");
const user_project_management_controller_1 = require("./project/user-project-management.controller");
const user_wbs_assignment_management_controller_1 = require("./evaluation-criteria/user-wbs-assignment-management.controller");
const user_wbs_evaluation_criteria_management_controller_1 = require("./evaluation-criteria/user-wbs-evaluation-criteria-management.controller");
const user_evaluation_period_management_controller_1 = require("./evaluation-period/user-evaluation-period-management.controller");
const user_deliverable_management_controller_1 = require("./performance-evaluation/user-deliverable-management.controller");
const user_peer_evaluation_management_controller_1 = require("./performance-evaluation/user-peer-evaluation-management.controller");
const user_wbs_self_evaluation_management_controller_1 = require("./performance-evaluation/user-wbs-self-evaluation-management.controller");
const user_revision_request_controller_1 = require("./revision-request/user-revision-request.controller");
const notification_controller_1 = require("../common/controllers/notification.controller");
let UserInterfaceModule = class UserInterfaceModule {
};
exports.UserInterfaceModule = UserInterfaceModule;
exports.UserInterfaceModule = UserInterfaceModule = __decorate([
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
            project_module_1.ProjectModule,
        ],
        controllers: [
            user_dashboard_controller_1.UserDashboardController,
            user_auth_controller_1.UserAuthController,
            user_evaluation_period_management_controller_1.UserEvaluationPeriodManagementController,
            user_project_management_controller_1.UserProjectManagementController,
            user_wbs_assignment_management_controller_1.UserWbsAssignmentManagementController,
            user_wbs_evaluation_criteria_management_controller_1.UserWbsEvaluationCriteriaManagementController,
            user_deliverable_management_controller_1.UserDeliverableManagementController,
            user_peer_evaluation_management_controller_1.UserPeerEvaluationManagementController,
            user_wbs_self_evaluation_management_controller_1.UserWbsSelfEvaluationManagementController,
            user_revision_request_controller_1.UserRevisionRequestController,
            notification_controller_1.NotificationController,
        ],
        providers: [],
        exports: [],
    })
], UserInterfaceModule);
//# sourceMappingURL=user-interface.module.js.map