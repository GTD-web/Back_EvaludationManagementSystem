// 자기평가
import { CreateWbsSelfEvaluationHandler } from './self-evaluation/commands/create-wbs-self-evaluation.handler';
import { UpdateWbsSelfEvaluationHandler } from './self-evaluation/commands/update-wbs-self-evaluation.handler';
import { UpsertWbsSelfEvaluationHandler } from './self-evaluation/commands/upsert-wbs-self-evaluation.handler';
import { SubmitWbsSelfEvaluationHandler } from './self-evaluation/commands/submit-wbs-self-evaluation.handler';
import { SubmitWbsSelfEvaluationToEvaluatorHandler } from './self-evaluation/commands/submit-wbs-self-evaluation-to-evaluator.handler';
import { SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler } from './self-evaluation/commands/submit-all-wbs-self-evaluations.handler';
import { SubmitAllWbsSelfEvaluationsToEvaluatorHandler } from './self-evaluation/commands/submit-all-wbs-self-evaluations-to-evaluator.handler';
import { SubmitAllWbsSelfEvaluationsForApprovalHandler } from './self-evaluation/commands/submit-all-wbs-self-evaluations-for-approval.handler';
import { ResetWbsSelfEvaluationHandler } from './self-evaluation/commands/reset-wbs-self-evaluation.handler';
import { ResetWbsSelfEvaluationToEvaluatorHandler } from './self-evaluation/commands/reset-wbs-self-evaluation-to-evaluator.handler';
import { ResetAllWbsSelfEvaluationsByEmployeePeriodHandler } from './self-evaluation/commands/reset-all-wbs-self-evaluations.handler';
import { ResetAllWbsSelfEvaluationsToEvaluatorHandler } from './self-evaluation/commands/reset-all-wbs-self-evaluations-to-evaluator.handler';
import { SubmitWbsSelfEvaluationsByProjectHandler } from './self-evaluation/commands/submit-wbs-self-evaluations-by-project.handler';
import { SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler } from './self-evaluation/commands/submit-wbs-self-evaluations-to-evaluator-by-project.handler';
import { ResetWbsSelfEvaluationsByProjectHandler } from './self-evaluation/commands/reset-wbs-self-evaluations-by-project.handler';
import { ResetWbsSelfEvaluationsToEvaluatorByProjectHandler } from './self-evaluation/commands/reset-wbs-self-evaluations-to-evaluator-by-project.handler';
import { ClearWbsSelfEvaluationHandler } from './self-evaluation/commands/clear-wbs-self-evaluation.handler';
import { ClearAllWbsSelfEvaluationsByEmployeePeriodHandler } from './self-evaluation/commands/clear-all-wbs-self-evaluations.handler';
import { ClearWbsSelfEvaluationsByProjectHandler } from './self-evaluation/commands/clear-wbs-self-evaluations-by-project.handler';
import { DeleteWbsSelfEvaluationsByAssignmentHandler } from './self-evaluation/commands/delete-wbs-self-evaluations-by-assignment.handler';

// 동료평가
import {
  CreatePeerEvaluationHandler,
  UpdatePeerEvaluationHandler,
  SubmitPeerEvaluationHandler,
  CancelPeerEvaluationHandler,
  CancelPeerEvaluationsByPeriodHandler,
  AddQuestionGroupToPeerEvaluationHandler,
  AddQuestionToPeerEvaluationHandler,
  AddMultipleQuestionsToPeerEvaluationHandler,
  RemoveQuestionFromPeerEvaluationHandler,
  UpdatePeerEvaluationQuestionOrderHandler,
  UpsertPeerEvaluationAnswersHandler,
} from './peer-evaluation';

// 하향평가
import {
  CreateDownwardEvaluationHandler,
  UpdateDownwardEvaluationHandler,
  UpsertDownwardEvaluationHandler,
  SubmitDownwardEvaluationHandler,
  ResetDownwardEvaluationHandler,
  BulkSubmitDownwardEvaluationsHandler,
  BulkResetDownwardEvaluationsHandler,
} from './downward-evaluation';

// 최종평가
import {
  CreateFinalEvaluationHandler,
  UpdateFinalEvaluationHandler,
  UpsertFinalEvaluationHandler,
  DeleteFinalEvaluationHandler,
  ConfirmFinalEvaluationHandler,
  CancelConfirmationFinalEvaluationHandler,
} from './final-evaluation';

// 평가 수정 가능 상태
import { UpdatePeriodAllEvaluationEditableStatusHandler } from './evaluation-editable-status';

// 산출물
import {
  CreateDeliverableHandler,
  UpdateDeliverableHandler,
  DeleteDeliverableHandler,
  BulkCreateDeliverablesHandler,
  BulkDeleteDeliverablesHandler,
} from './deliverable';

export const CommandHandlers = [
  // 자기평가 커맨드 핸들러
  CreateWbsSelfEvaluationHandler,
  UpdateWbsSelfEvaluationHandler,
  UpsertWbsSelfEvaluationHandler,
  SubmitWbsSelfEvaluationHandler,
  SubmitWbsSelfEvaluationToEvaluatorHandler,
  SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler,
  SubmitAllWbsSelfEvaluationsToEvaluatorHandler,
  SubmitAllWbsSelfEvaluationsForApprovalHandler,
  ResetWbsSelfEvaluationHandler,
  ResetWbsSelfEvaluationToEvaluatorHandler,
  ResetAllWbsSelfEvaluationsByEmployeePeriodHandler,
  ResetAllWbsSelfEvaluationsToEvaluatorHandler,
  SubmitWbsSelfEvaluationsByProjectHandler,
  SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler,
  ResetWbsSelfEvaluationsByProjectHandler,
  ResetWbsSelfEvaluationsToEvaluatorByProjectHandler,
  ClearWbsSelfEvaluationHandler,
  ClearAllWbsSelfEvaluationsByEmployeePeriodHandler,
  ClearWbsSelfEvaluationsByProjectHandler,
  DeleteWbsSelfEvaluationsByAssignmentHandler,

  // 동료평가 커맨드 핸들러
  CreatePeerEvaluationHandler,
  UpdatePeerEvaluationHandler,
  SubmitPeerEvaluationHandler,
  CancelPeerEvaluationHandler,
  CancelPeerEvaluationsByPeriodHandler,
  AddQuestionGroupToPeerEvaluationHandler,
  AddQuestionToPeerEvaluationHandler,
  AddMultipleQuestionsToPeerEvaluationHandler,
  RemoveQuestionFromPeerEvaluationHandler,
  UpdatePeerEvaluationQuestionOrderHandler,
  UpsertPeerEvaluationAnswersHandler,

  // 하향평가 커맨드 핸들러
  CreateDownwardEvaluationHandler,
  UpdateDownwardEvaluationHandler,
  UpsertDownwardEvaluationHandler,
  SubmitDownwardEvaluationHandler,
  ResetDownwardEvaluationHandler,
  BulkSubmitDownwardEvaluationsHandler,
  BulkResetDownwardEvaluationsHandler,

  // 최종평가 커맨드 핸들러
  CreateFinalEvaluationHandler,
  UpdateFinalEvaluationHandler,
  UpsertFinalEvaluationHandler,
  DeleteFinalEvaluationHandler,
  ConfirmFinalEvaluationHandler,
  CancelConfirmationFinalEvaluationHandler,

  // 평가 수정 가능 상태 커맨드 핸들러
  UpdatePeriodAllEvaluationEditableStatusHandler,

  // 산출물 커맨드 핸들러
  CreateDeliverableHandler,
  UpdateDeliverableHandler,
  DeleteDeliverableHandler,
  BulkCreateDeliverablesHandler,
  BulkDeleteDeliverablesHandler,
];
