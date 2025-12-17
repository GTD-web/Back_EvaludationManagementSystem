"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliverableBusinessModule = void 0;
const common_1 = require("@nestjs/common");
const performance_evaluation_context_module_1 = require("../../context/performance-evaluation-context/performance-evaluation-context.module");
const evaluation_activity_log_context_module_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.module");
const evaluation_criteria_management_context_module_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module");
const deliverable_business_service_1 = require("./deliverable-business.service");
let DeliverableBusinessModule = class DeliverableBusinessModule {
};
exports.DeliverableBusinessModule = DeliverableBusinessModule;
exports.DeliverableBusinessModule = DeliverableBusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            performance_evaluation_context_module_1.PerformanceEvaluationContextModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
            evaluation_criteria_management_context_module_1.EvaluationCriteriaManagementContextModule,
        ],
        providers: [deliverable_business_service_1.DeliverableBusinessService],
        exports: [deliverable_business_service_1.DeliverableBusinessService],
    })
], DeliverableBusinessModule);
//# sourceMappingURL=deliverable-business.module.js.map