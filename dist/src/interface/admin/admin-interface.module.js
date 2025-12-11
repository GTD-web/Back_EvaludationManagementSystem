"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminInterfaceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const domain_context_module_1 = require("../../context/domain-context.module");
const business_module_1 = require("../../business/business.module");
const auth_context_module_1 = require("../../context/auth-context/auth-context.module");
const evaluation_period_management_context_module_1 = require("../../context/evaluation-period-management-context/evaluation-period-management-context.module");
const evaluation_criteria_management_context_module_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module");
const performance_evaluation_context_module_1 = require("../../context/performance-evaluation-context/performance-evaluation-context.module");
const organization_management_context_module_1 = require("../../context/organization-management-context/organization-management-context.module");
const dashboard_context_module_1 = require("../../context/dashboard-context/dashboard-context.module");
const evaluation_question_management_context_module_1 = require("../../context/evaluation-question-management-context/evaluation-question-management-context.module");
const seed_data_context_module_1 = require("../../context/seed-data-context/seed-data-context.module");
const evaluation_period_module_1 = require("../../domain/core/evaluation-period/evaluation-period.module");
const employee_module_1 = require("../../domain/common/employee/employee.module");
const notification_1 = require("../../domain/common/notification");
const department_module_1 = require("../../domain/common/department/department.module");
const project_module_1 = require("../../domain/common/project/project.module");
const system_setting_module_1 = require("../../domain/common/system-setting/system-setting.module");
const wbs_evaluation_criteria_module_1 = require("../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.module");
const evaluation_line_module_1 = require("../../domain/core/evaluation-line/evaluation-line.module");
const evaluation_line_mapping_module_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const auth_controller_1 = require("./auth/auth.controller");
const dashboard_controller_1 = require("./dashboard/dashboard.controller");
const evaluation_period_management_controller_1 = require("./evaluation-period/evaluation-period-management.controller");
const evaluation_target_controller_1 = require("./evaluation-period/evaluation-target.controller");
const project_assignment_management_controller_1 = require("./evaluation-criteria/project-assignment-management.controller");
const wbs_assignment_management_controller_1 = require("./evaluation-criteria/wbs-assignment-management.controller");
const evaluation_line_management_controller_1 = require("./evaluation-criteria/evaluation-line-management.controller");
const wbs_evaluation_criteria_management_controller_1 = require("./evaluation-criteria/wbs-evaluation-criteria-management.controller");
const wbs_self_evaluation_management_controller_1 = require("./performance-evaluation/wbs-self-evaluation-management.controller");
const downward_evaluation_management_controller_1 = require("./performance-evaluation/downward-evaluation-management.controller");
const peer_evaluation_management_controller_1 = require("./performance-evaluation/peer-evaluation-management.controller");
const final_evaluation_management_controller_1 = require("./performance-evaluation/final-evaluation-management.controller");
const evaluation_question_management_controller_1 = require("./performance-evaluation/evaluation-question-management.controller");
const deliverable_management_controller_1 = require("./performance-evaluation/deliverable-management.controller");
const employee_management_controller_1 = require("./employee-management/employee-management.controller");
const seed_data_controller_1 = require("./seed-data/seed-data.controller");
const step_approval_controller_1 = require("./step-approval/step-approval.controller");
const revision_request_controller_1 = require("./revision-request/revision-request.controller");
const step_approval_context_module_1 = require("../../context/step-approval-context/step-approval-context.module");
const revision_request_context_module_1 = require("../../context/revision-request-context/revision-request-context.module");
const audit_log_context_module_1 = require("../../context/audit-log-context/audit-log-context.module");
const audit_log_controller_1 = require("./audit-log/audit-log.controller");
const evaluation_activity_log_controller_1 = require("./evaluation-activity-log/evaluation-activity-log.controller");
const project_management_controller_1 = require("./project/project-management.controller");
const notification_controller_1 = require("../common/controllers/notification.controller");
let AdminInterfaceModule = class AdminInterfaceModule {
};
exports.AdminInterfaceModule = AdminInterfaceModule;
exports.AdminInterfaceModule = AdminInterfaceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([employee_entity_1.Employee]),
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
            department_module_1.DepartmentModule,
            project_module_1.ProjectModule,
            system_setting_module_1.SystemSettingModule,
            wbs_evaluation_criteria_module_1.WbsEvaluationCriteriaModule,
            evaluation_line_module_1.EvaluationLineModule,
            evaluation_line_mapping_module_1.EvaluationLineMappingModule,
        ],
        controllers: [
            auth_controller_1.AuthController,
            dashboard_controller_1.DashboardController,
            evaluation_period_management_controller_1.EvaluationPeriodManagementController,
            evaluation_target_controller_1.EvaluationTargetController,
            employee_management_controller_1.EmployeeManagementController,
            project_management_controller_1.ProjectManagementController,
            project_assignment_management_controller_1.ProjectAssignmentManagementController,
            wbs_assignment_management_controller_1.WbsAssignmentManagementController,
            evaluation_line_management_controller_1.EvaluationLineManagementController,
            wbs_evaluation_criteria_management_controller_1.WbsEvaluationCriteriaManagementController,
            wbs_self_evaluation_management_controller_1.WbsSelfEvaluationManagementController,
            downward_evaluation_management_controller_1.DownwardEvaluationManagementController,
            peer_evaluation_management_controller_1.PeerEvaluationManagementController,
            final_evaluation_management_controller_1.FinalEvaluationManagementController,
            evaluation_question_management_controller_1.EvaluationQuestionManagementController,
            deliverable_management_controller_1.DeliverableManagementController,
            seed_data_controller_1.SeedDataController,
            step_approval_controller_1.StepApprovalController,
            revision_request_controller_1.RevisionRequestController,
            audit_log_controller_1.AuditLogController,
            evaluation_activity_log_controller_1.EvaluationActivityLogController,
            notification_controller_1.NotificationController,
        ],
        providers: [],
        exports: [],
    })
], AdminInterfaceModule);
//# sourceMappingURL=admin-interface.module.js.map