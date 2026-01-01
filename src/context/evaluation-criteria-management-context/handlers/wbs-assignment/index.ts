// Commands
export {
  CreateWbsAssignmentCommand,
  CreateWbsAssignmentHandler,
} from './commands/create-wbs-assignment.handler';

export {
  CancelWbsAssignmentCommand,
  CancelWbsAssignmentHandler,
} from './commands/cancel-wbs-assignment.handler';

export {
  BulkCreateWbsAssignmentCommand,
  BulkCreateWbsAssignmentHandler,
} from './commands/bulk-create-wbs-assignment.handler';

export {
  ChangeWbsAssignmentOrderCommand,
  ChangeWbsAssignmentOrderHandler,
} from './commands/change-wbs-assignment-order.handler';

export {
  ResetPeriodWbsAssignmentsCommand,
  ResetPeriodWbsAssignmentsHandler,
} from './commands/reset-period-wbs-assignments.handler';

export {
  ResetProjectWbsAssignmentsCommand,
  ResetProjectWbsAssignmentsHandler,
} from './commands/reset-project-wbs-assignments.handler';

export {
  ResetEmployeeWbsAssignmentsCommand,
  ResetEmployeeWbsAssignmentsHandler,
} from './commands/reset-employee-wbs-assignments.handler';

export {
  RecalculateAllEmployeesWeightForPeriodCommand,
  RecalculateAllEmployeesWeightForPeriodHandler,
} from './commands/recalculate-all-employees-weight-for-period.handler';

// Queries
export {
  GetWbsAssignmentListQuery,
  GetWbsAssignmentListHandler,
  type WbsAssignmentListResult,
} from './queries/get-wbs-assignment-list.handler';

export {
  GetEmployeeWbsAssignmentsQuery,
  GetEmployeeWbsAssignmentsHandler,
} from './queries/get-employee-wbs-assignments.handler';

export {
  GetProjectWbsAssignmentsQuery,
  GetProjectWbsAssignmentsHandler,
} from './queries/get-project-wbs-assignments.handler';

export {
  GetWbsItemAssignmentsQuery,
  GetWbsItemAssignmentsHandler,
} from './queries/get-wbs-item-assignments.handler';

export {
  GetWbsAssignmentDetailQuery,
  GetWbsAssignmentDetailHandler,
  type WbsAssignmentDetailResult,
} from './queries/get-wbs-assignment-detail.handler';

export {
  GetUnassignedWbsItemsQuery,
  GetUnassignedWbsItemsHandler,
} from './queries/get-unassigned-wbs-items.handler';

// Handler 배열 export (Module에서 사용)
import { CreateWbsAssignmentHandler } from './commands/create-wbs-assignment.handler';
import { CancelWbsAssignmentHandler } from './commands/cancel-wbs-assignment.handler';
import { BulkCreateWbsAssignmentHandler } from './commands/bulk-create-wbs-assignment.handler';
import { ChangeWbsAssignmentOrderHandler } from './commands/change-wbs-assignment-order.handler';
import { ResetPeriodWbsAssignmentsHandler } from './commands/reset-period-wbs-assignments.handler';
import { ResetProjectWbsAssignmentsHandler } from './commands/reset-project-wbs-assignments.handler';
import { ResetEmployeeWbsAssignmentsHandler } from './commands/reset-employee-wbs-assignments.handler';
import { RecalculateAllEmployeesWeightForPeriodHandler } from './commands/recalculate-all-employees-weight-for-period.handler';
import { GetWbsAssignmentListHandler } from './queries/get-wbs-assignment-list.handler';
import { GetEmployeeWbsAssignmentsHandler } from './queries/get-employee-wbs-assignments.handler';
import { GetProjectWbsAssignmentsHandler } from './queries/get-project-wbs-assignments.handler';
import { GetWbsItemAssignmentsHandler } from './queries/get-wbs-item-assignments.handler';
import { GetWbsAssignmentDetailHandler } from './queries/get-wbs-assignment-detail.handler';
import { GetUnassignedWbsItemsHandler } from './queries/get-unassigned-wbs-items.handler';

export const WBS_ASSIGNMENT_COMMAND_HANDLERS = [
  CreateWbsAssignmentHandler,
  CancelWbsAssignmentHandler,
  BulkCreateWbsAssignmentHandler,
  ChangeWbsAssignmentOrderHandler,
  ResetPeriodWbsAssignmentsHandler,
  ResetProjectWbsAssignmentsHandler,
  ResetEmployeeWbsAssignmentsHandler,
  RecalculateAllEmployeesWeightForPeriodHandler,
];

export const WBS_ASSIGNMENT_QUERY_HANDLERS = [
  GetWbsAssignmentListHandler,
  GetEmployeeWbsAssignmentsHandler,
  GetProjectWbsAssignmentsHandler,
  GetWbsItemAssignmentsHandler,
  GetWbsAssignmentDetailHandler,
  GetUnassignedWbsItemsHandler,
];

export const WBS_ASSIGNMENT_HANDLERS = [
  ...WBS_ASSIGNMENT_COMMAND_HANDLERS,
  ...WBS_ASSIGNMENT_QUERY_HANDLERS,
];
