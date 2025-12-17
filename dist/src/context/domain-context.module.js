"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainContextModule = void 0;
const common_1 = require("@nestjs/common");
const auth_context_module_1 = require("./auth-context/auth-context.module");
const evaluation_period_management_context_module_1 = require("./evaluation-period-management-context/evaluation-period-management-context.module");
const organization_management_context_module_1 = require("./organization-management-context/organization-management-context.module");
const evaluation_criteria_management_context_module_1 = require("./evaluation-criteria-management-context/evaluation-criteria-management-context.module");
const performance_evaluation_context_module_1 = require("./performance-evaluation-context/performance-evaluation-context.module");
const test_context_module_1 = require("./test-context/test-context.module");
const dashboard_context_module_1 = require("./dashboard-context/dashboard-context.module");
const evaluation_question_management_context_module_1 = require("./evaluation-question-management-context/evaluation-question-management-context.module");
const seed_data_context_module_1 = require("./seed-data-context/seed-data-context.module");
const step_approval_context_module_1 = require("./step-approval-context/step-approval-context.module");
const revision_request_context_module_1 = require("./revision-request-context/revision-request-context.module");
const audit_log_context_module_1 = require("./audit-log-context/audit-log-context.module");
const evaluation_activity_log_context_module_1 = require("./evaluation-activity-log-context/evaluation-activity-log-context.module");
const project_module_1 = require("../domain/common/project/project.module");
let DomainContextModule = class DomainContextModule {
};
exports.DomainContextModule = DomainContextModule;
exports.DomainContextModule = DomainContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_context_module_1.AuthContextModule,
            evaluation_period_management_context_module_1.EvaluationPeriodManagementContextModule,
            organization_management_context_module_1.OrganizationManagementContextModule,
            evaluation_criteria_management_context_module_1.EvaluationCriteriaManagementContextModule,
            performance_evaluation_context_module_1.PerformanceEvaluationContextModule,
            test_context_module_1.TestContextModule,
            dashboard_context_module_1.DashboardContextModule,
            evaluation_question_management_context_module_1.EvaluationQuestionManagementContextModule,
            seed_data_context_module_1.SeedDataContextModule,
            step_approval_context_module_1.StepApprovalContextModule,
            revision_request_context_module_1.RevisionRequestContextModule,
            audit_log_context_module_1.AuditLogContextModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
            project_module_1.ProjectModule,
        ],
        providers: [],
        exports: [
            auth_context_module_1.AuthContextModule,
            evaluation_period_management_context_module_1.EvaluationPeriodManagementContextModule,
            organization_management_context_module_1.OrganizationManagementContextModule,
            evaluation_criteria_management_context_module_1.EvaluationCriteriaManagementContextModule,
            performance_evaluation_context_module_1.PerformanceEvaluationContextModule,
            test_context_module_1.TestContextModule,
            dashboard_context_module_1.DashboardContextModule,
            evaluation_question_management_context_module_1.EvaluationQuestionManagementContextModule,
            seed_data_context_module_1.SeedDataContextModule,
            step_approval_context_module_1.StepApprovalContextModule,
            revision_request_context_module_1.RevisionRequestContextModule,
            audit_log_context_module_1.AuditLogContextModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
            project_module_1.ProjectModule,
        ],
    })
], DomainContextModule);
//# sourceMappingURL=domain-context.module.js.map