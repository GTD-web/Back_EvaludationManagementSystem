"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceEvaluationContextModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const database_module_1 = require("../../../libs/database/database.module");
const core_domain_module_1 = require("../../domain/core/core-domain.module");
const common_domain_module_1 = require("../../domain/common/common-domain.module");
const sub_domain_module_1 = require("../../domain/sub/sub-domain.module");
const step_approval_context_module_1 = require("../step-approval-context/step-approval-context.module");
const evaluation_activity_log_context_module_1 = require("../evaluation-activity-log-context/evaluation-activity-log-context.module");
const wbs_self_evaluation_entity_1 = require("../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_entity_1 = require("../../domain/core/downward-evaluation/downward-evaluation.entity");
const peer_evaluation_entity_1 = require("../../domain/core/peer-evaluation/peer-evaluation.entity");
const peer_evaluation_question_mapping_entity_1 = require("../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.entity");
const final_evaluation_entity_1 = require("../../domain/core/final-evaluation/final-evaluation.entity");
const evaluation_period_entity_1 = require("../../domain/core/evaluation-period/evaluation-period.entity");
const deliverable_entity_1 = require("../../domain/core/deliverable/deliverable.entity");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../domain/common/department/department.entity");
const wbs_item_entity_1 = require("../../domain/common/wbs-item/wbs-item.entity");
const evaluation_question_entity_1 = require("../../domain/sub/evaluation-question/evaluation-question.entity");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_entity_1 = require("../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_wbs_assignment_entity_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const performance_evaluation_service_1 = require("./performance-evaluation.service");
const command_handlers_1 = require("./handlers/command-handlers");
const query_handlers_1 = require("./handlers/query-handlers");
let PerformanceEvaluationContextModule = class PerformanceEvaluationContextModule {
};
exports.PerformanceEvaluationContextModule = PerformanceEvaluationContextModule;
exports.PerformanceEvaluationContextModule = PerformanceEvaluationContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            database_module_1.DatabaseModule,
            core_domain_module_1.CoreDomainModule,
            common_domain_module_1.CommonDomainModule,
            sub_domain_module_1.SubDomainModule,
            step_approval_context_module_1.StepApprovalContextModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
            typeorm_1.TypeOrmModule.forFeature([
                wbs_self_evaluation_entity_1.WbsSelfEvaluation,
                downward_evaluation_entity_1.DownwardEvaluation,
                peer_evaluation_entity_1.PeerEvaluation,
                peer_evaluation_question_mapping_entity_1.PeerEvaluationQuestionMapping,
                final_evaluation_entity_1.FinalEvaluation,
                evaluation_period_entity_1.EvaluationPeriod,
                deliverable_entity_1.Deliverable,
                employee_entity_1.Employee,
                department_entity_1.Department,
                wbs_item_entity_1.WbsItem,
                evaluation_question_entity_1.EvaluationQuestion,
                evaluation_line_mapping_entity_1.EvaluationLineMapping,
                evaluation_line_entity_1.EvaluationLine,
                evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment,
                evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping,
            ]),
        ],
        providers: [
            performance_evaluation_service_1.PerformanceEvaluationService,
            ...command_handlers_1.CommandHandlers,
            ...query_handlers_1.QueryHandlers,
        ],
        exports: [performance_evaluation_service_1.PerformanceEvaluationService],
    })
], PerformanceEvaluationContextModule);
//# sourceMappingURL=performance-evaluation-context.module.js.map