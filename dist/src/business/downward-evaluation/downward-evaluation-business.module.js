"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownwardEvaluationBusinessModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const downward_evaluation_business_service_1 = require("./downward-evaluation-business.service");
const performance_evaluation_context_module_1 = require("../../context/performance-evaluation-context/performance-evaluation-context.module");
const evaluation_criteria_management_context_module_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module");
const evaluation_period_management_context_module_1 = require("../../context/evaluation-period-management-context/evaluation-period-management-context.module");
const revision_request_context_module_1 = require("../../context/revision-request-context/revision-request-context.module");
const step_approval_context_module_1 = require("../../context/step-approval-context/step-approval-context.module");
const evaluation_activity_log_context_module_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.module");
const wbs_self_evaluation_entity_1 = require("../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_entity_1 = require("../../domain/core/downward-evaluation/downward-evaluation.entity");
const notification_1 = require("../../domain/common/notification");
const core_domain_module_1 = require("../../domain/core/core-domain.module");
let DownwardEvaluationBusinessModule = class DownwardEvaluationBusinessModule {
};
exports.DownwardEvaluationBusinessModule = DownwardEvaluationBusinessModule;
exports.DownwardEvaluationBusinessModule = DownwardEvaluationBusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([wbs_self_evaluation_entity_1.WbsSelfEvaluation, downward_evaluation_entity_1.DownwardEvaluation]),
            core_domain_module_1.CoreDomainModule,
            performance_evaluation_context_module_1.PerformanceEvaluationContextModule,
            evaluation_criteria_management_context_module_1.EvaluationCriteriaManagementContextModule,
            evaluation_period_management_context_module_1.EvaluationPeriodManagementContextModule,
            revision_request_context_module_1.RevisionRequestContextModule,
            step_approval_context_module_1.StepApprovalContextModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
            notification_1.NotificationModule,
        ],
        providers: [downward_evaluation_business_service_1.DownwardEvaluationBusinessService],
        exports: [downward_evaluation_business_service_1.DownwardEvaluationBusinessService],
    })
], DownwardEvaluationBusinessModule);
//# sourceMappingURL=downward-evaluation-business.module.js.map