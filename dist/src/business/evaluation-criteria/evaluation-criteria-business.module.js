"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationCriteriaBusinessModule = void 0;
const common_1 = require("@nestjs/common");
const evaluation_criteria_management_context_module_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module");
const revision_request_context_module_1 = require("../../context/revision-request-context/revision-request-context.module");
const evaluation_activity_log_context_module_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.module");
const step_approval_context_module_1 = require("../../context/step-approval-context/step-approval-context.module");
const evaluation_criteria_business_service_1 = require("./evaluation-criteria-business.service");
let EvaluationCriteriaBusinessModule = class EvaluationCriteriaBusinessModule {
};
exports.EvaluationCriteriaBusinessModule = EvaluationCriteriaBusinessModule;
exports.EvaluationCriteriaBusinessModule = EvaluationCriteriaBusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            evaluation_criteria_management_context_module_1.EvaluationCriteriaManagementContextModule,
            revision_request_context_module_1.RevisionRequestContextModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
            step_approval_context_module_1.StepApprovalContextModule,
        ],
        providers: [evaluation_criteria_business_service_1.EvaluationCriteriaBusinessService],
        exports: [evaluation_criteria_business_service_1.EvaluationCriteriaBusinessService],
    })
], EvaluationCriteriaBusinessModule);
//# sourceMappingURL=evaluation-criteria-business.module.js.map