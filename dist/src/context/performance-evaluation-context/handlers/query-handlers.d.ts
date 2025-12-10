import { GetEmployeeSelfEvaluationsHandler } from './self-evaluation/queries/get-employee-self-evaluations.handler';
import { GetWbsSelfEvaluationDetailHandler } from './self-evaluation/queries/get-wbs-self-evaluation-detail.handler';
import { GetPeerEvaluationListHandler, GetPeerEvaluationDetailHandler, GetEvaluatorAssignedEvaluateesHandler, GetPeerEvaluationQuestionsHandler } from './peer-evaluation';
import { GetDownwardEvaluationListHandler, GetDownwardEvaluationDetailHandler } from './downward-evaluation';
import { GetFinalEvaluationHandler, GetFinalEvaluationListHandler, GetFinalEvaluationByEmployeePeriodHandler } from './final-evaluation';
import { GetEmployeeDeliverablesHandler, GetWbsDeliverablesHandler, GetDeliverableDetailHandler } from './deliverable';
export declare const QueryHandlers: (typeof GetEmployeeSelfEvaluationsHandler | typeof GetWbsSelfEvaluationDetailHandler | typeof GetPeerEvaluationListHandler | typeof GetPeerEvaluationDetailHandler | typeof GetEvaluatorAssignedEvaluateesHandler | typeof GetPeerEvaluationQuestionsHandler | typeof GetDownwardEvaluationListHandler | typeof GetDownwardEvaluationDetailHandler | typeof GetFinalEvaluationHandler | typeof GetFinalEvaluationListHandler | typeof GetFinalEvaluationByEmployeePeriodHandler | typeof GetEmployeeDeliverablesHandler | typeof GetWbsDeliverablesHandler | typeof GetDeliverableDetailHandler)[];
