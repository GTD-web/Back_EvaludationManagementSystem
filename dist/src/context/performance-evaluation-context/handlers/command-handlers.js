"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandHandlers = void 0;
const create_wbs_self_evaluation_handler_1 = require("./self-evaluation/commands/create-wbs-self-evaluation.handler");
const update_wbs_self_evaluation_handler_1 = require("./self-evaluation/commands/update-wbs-self-evaluation.handler");
const upsert_wbs_self_evaluation_handler_1 = require("./self-evaluation/commands/upsert-wbs-self-evaluation.handler");
const submit_wbs_self_evaluation_handler_1 = require("./self-evaluation/commands/submit-wbs-self-evaluation.handler");
const submit_wbs_self_evaluation_to_evaluator_handler_1 = require("./self-evaluation/commands/submit-wbs-self-evaluation-to-evaluator.handler");
const submit_all_wbs_self_evaluations_handler_1 = require("./self-evaluation/commands/submit-all-wbs-self-evaluations.handler");
const submit_all_wbs_self_evaluations_to_evaluator_handler_1 = require("./self-evaluation/commands/submit-all-wbs-self-evaluations-to-evaluator.handler");
const submit_all_wbs_self_evaluations_for_approval_handler_1 = require("./self-evaluation/commands/submit-all-wbs-self-evaluations-for-approval.handler");
const reset_wbs_self_evaluation_handler_1 = require("./self-evaluation/commands/reset-wbs-self-evaluation.handler");
const reset_wbs_self_evaluation_to_evaluator_handler_1 = require("./self-evaluation/commands/reset-wbs-self-evaluation-to-evaluator.handler");
const reset_all_wbs_self_evaluations_handler_1 = require("./self-evaluation/commands/reset-all-wbs-self-evaluations.handler");
const reset_all_wbs_self_evaluations_to_evaluator_handler_1 = require("./self-evaluation/commands/reset-all-wbs-self-evaluations-to-evaluator.handler");
const submit_wbs_self_evaluations_by_project_handler_1 = require("./self-evaluation/commands/submit-wbs-self-evaluations-by-project.handler");
const submit_wbs_self_evaluations_to_evaluator_by_project_handler_1 = require("./self-evaluation/commands/submit-wbs-self-evaluations-to-evaluator-by-project.handler");
const reset_wbs_self_evaluations_by_project_handler_1 = require("./self-evaluation/commands/reset-wbs-self-evaluations-by-project.handler");
const reset_wbs_self_evaluations_to_evaluator_by_project_handler_1 = require("./self-evaluation/commands/reset-wbs-self-evaluations-to-evaluator-by-project.handler");
const clear_wbs_self_evaluation_handler_1 = require("./self-evaluation/commands/clear-wbs-self-evaluation.handler");
const clear_all_wbs_self_evaluations_handler_1 = require("./self-evaluation/commands/clear-all-wbs-self-evaluations.handler");
const clear_wbs_self_evaluations_by_project_handler_1 = require("./self-evaluation/commands/clear-wbs-self-evaluations-by-project.handler");
const delete_wbs_self_evaluations_by_assignment_handler_1 = require("./self-evaluation/commands/delete-wbs-self-evaluations-by-assignment.handler");
const peer_evaluation_1 = require("./peer-evaluation");
const downward_evaluation_1 = require("./downward-evaluation");
const final_evaluation_1 = require("./final-evaluation");
const evaluation_editable_status_1 = require("./evaluation-editable-status");
const deliverable_1 = require("./deliverable");
exports.CommandHandlers = [
    create_wbs_self_evaluation_handler_1.CreateWbsSelfEvaluationHandler,
    update_wbs_self_evaluation_handler_1.UpdateWbsSelfEvaluationHandler,
    upsert_wbs_self_evaluation_handler_1.UpsertWbsSelfEvaluationHandler,
    submit_wbs_self_evaluation_handler_1.SubmitWbsSelfEvaluationHandler,
    submit_wbs_self_evaluation_to_evaluator_handler_1.SubmitWbsSelfEvaluationToEvaluatorHandler,
    submit_all_wbs_self_evaluations_handler_1.SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler,
    submit_all_wbs_self_evaluations_to_evaluator_handler_1.SubmitAllWbsSelfEvaluationsToEvaluatorHandler,
    submit_all_wbs_self_evaluations_for_approval_handler_1.SubmitAllWbsSelfEvaluationsForApprovalHandler,
    reset_wbs_self_evaluation_handler_1.ResetWbsSelfEvaluationHandler,
    reset_wbs_self_evaluation_to_evaluator_handler_1.ResetWbsSelfEvaluationToEvaluatorHandler,
    reset_all_wbs_self_evaluations_handler_1.ResetAllWbsSelfEvaluationsByEmployeePeriodHandler,
    reset_all_wbs_self_evaluations_to_evaluator_handler_1.ResetAllWbsSelfEvaluationsToEvaluatorHandler,
    submit_wbs_self_evaluations_by_project_handler_1.SubmitWbsSelfEvaluationsByProjectHandler,
    submit_wbs_self_evaluations_to_evaluator_by_project_handler_1.SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler,
    reset_wbs_self_evaluations_by_project_handler_1.ResetWbsSelfEvaluationsByProjectHandler,
    reset_wbs_self_evaluations_to_evaluator_by_project_handler_1.ResetWbsSelfEvaluationsToEvaluatorByProjectHandler,
    clear_wbs_self_evaluation_handler_1.ClearWbsSelfEvaluationHandler,
    clear_all_wbs_self_evaluations_handler_1.ClearAllWbsSelfEvaluationsByEmployeePeriodHandler,
    clear_wbs_self_evaluations_by_project_handler_1.ClearWbsSelfEvaluationsByProjectHandler,
    delete_wbs_self_evaluations_by_assignment_handler_1.DeleteWbsSelfEvaluationsByAssignmentHandler,
    peer_evaluation_1.CreatePeerEvaluationHandler,
    peer_evaluation_1.UpdatePeerEvaluationHandler,
    peer_evaluation_1.SubmitPeerEvaluationHandler,
    peer_evaluation_1.CancelPeerEvaluationHandler,
    peer_evaluation_1.CancelPeerEvaluationsByPeriodHandler,
    peer_evaluation_1.AddQuestionGroupToPeerEvaluationHandler,
    peer_evaluation_1.AddQuestionToPeerEvaluationHandler,
    peer_evaluation_1.AddMultipleQuestionsToPeerEvaluationHandler,
    peer_evaluation_1.RemoveQuestionFromPeerEvaluationHandler,
    peer_evaluation_1.UpdatePeerEvaluationQuestionOrderHandler,
    peer_evaluation_1.UpsertPeerEvaluationAnswersHandler,
    downward_evaluation_1.CreateDownwardEvaluationHandler,
    downward_evaluation_1.UpdateDownwardEvaluationHandler,
    downward_evaluation_1.UpsertDownwardEvaluationHandler,
    downward_evaluation_1.SubmitDownwardEvaluationHandler,
    downward_evaluation_1.ResetDownwardEvaluationHandler,
    downward_evaluation_1.BulkSubmitDownwardEvaluationsHandler,
    downward_evaluation_1.BulkResetDownwardEvaluationsHandler,
    final_evaluation_1.CreateFinalEvaluationHandler,
    final_evaluation_1.UpdateFinalEvaluationHandler,
    final_evaluation_1.UpsertFinalEvaluationHandler,
    final_evaluation_1.DeleteFinalEvaluationHandler,
    final_evaluation_1.ConfirmFinalEvaluationHandler,
    final_evaluation_1.CancelConfirmationFinalEvaluationHandler,
    evaluation_editable_status_1.UpdatePeriodAllEvaluationEditableStatusHandler,
    deliverable_1.CreateDeliverableHandler,
    deliverable_1.UpdateDeliverableHandler,
    deliverable_1.DeleteDeliverableHandler,
    deliverable_1.BulkCreateDeliverablesHandler,
    deliverable_1.BulkDeleteDeliverablesHandler,
];
//# sourceMappingURL=command-handlers.js.map