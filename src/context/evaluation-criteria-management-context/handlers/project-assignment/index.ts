// Commands
export {
  CreateProjectAssignmentCommand,
  CreateProjectAssignmentHandler,
} from './commands/create-project-assignment.handler';

export {
  CancelProjectAssignmentCommand,
  CancelProjectAssignmentHandler,
} from './commands/cancel-project-assignment.handler';

export {
  BulkCreateProjectAssignmentCommand,
  BulkCreateProjectAssignmentHandler,
} from './commands/bulk-create-project-assignment.handler';

export {
  ChangeProjectAssignmentOrderCommand,
  ChangeProjectAssignmentOrderHandler,
} from './commands/change-project-assignment-order.handler';

export {
  UpdateProjectAssignmentCommand,
  UpdateProjectAssignmentHandler,
  UpdateProjectAssignmentByEmployeeAndProjectCommand,
  UpdateProjectAssignmentByEmployeeAndProjectHandler,
} from './commands/update-project-assignment.handler';

// Queries
export {
  GetProjectAssignmentListQuery,
  GetProjectAssignmentListHandler,
  type ProjectAssignmentListResult,
} from './queries/get-project-assignment-list.handler';

export {
  GetEmployeeProjectAssignmentsQuery,
  GetEmployeeProjectAssignmentsHandler,
} from './queries/get-employee-project-assignments.handler';

export {
  GetProjectAssignedEmployeesQuery,
  GetProjectAssignedEmployeesHandler,
} from './queries/get-project-assigned-employees.handler';

export {
  GetProjectAssignmentDetailQuery,
  GetProjectAssignmentDetailHandler,
} from './queries/get-project-assignment-detail.handler';

export {
  GetUnassignedEmployeesQuery,
  GetUnassignedEmployeesHandler,
} from './queries/get-unassigned-employees.handler';

export {
  GetAvailableProjectsQuery,
  GetAvailableProjectsHandler,
  type AvailableProjectsResult,
} from './queries/get-available-projects.handler';

// Handler 배열 export (Module에서 사용)
import { CreateProjectAssignmentHandler } from './commands/create-project-assignment.handler';
import { CancelProjectAssignmentHandler } from './commands/cancel-project-assignment.handler';
import { BulkCreateProjectAssignmentHandler } from './commands/bulk-create-project-assignment.handler';
import { ChangeProjectAssignmentOrderHandler } from './commands/change-project-assignment-order.handler';
import {
  UpdateProjectAssignmentHandler,
  UpdateProjectAssignmentByEmployeeAndProjectHandler,
} from './commands/update-project-assignment.handler';
import { GetProjectAssignmentListHandler } from './queries/get-project-assignment-list.handler';
import { GetEmployeeProjectAssignmentsHandler } from './queries/get-employee-project-assignments.handler';
import { GetProjectAssignedEmployeesHandler } from './queries/get-project-assigned-employees.handler';
import { GetProjectAssignmentDetailHandler } from './queries/get-project-assignment-detail.handler';
import { GetUnassignedEmployeesHandler } from './queries/get-unassigned-employees.handler';
import { GetAvailableProjectsHandler } from './queries/get-available-projects.handler';

export const PROJECT_ASSIGNMENT_COMMAND_HANDLERS = [
  CreateProjectAssignmentHandler,
  CancelProjectAssignmentHandler,
  BulkCreateProjectAssignmentHandler,
  ChangeProjectAssignmentOrderHandler,
  UpdateProjectAssignmentHandler,
  UpdateProjectAssignmentByEmployeeAndProjectHandler,
];

export const PROJECT_ASSIGNMENT_QUERY_HANDLERS = [
  GetProjectAssignmentListHandler,
  GetEmployeeProjectAssignmentsHandler,
  GetProjectAssignedEmployeesHandler,
  GetProjectAssignmentDetailHandler,
  GetUnassignedEmployeesHandler,
  GetAvailableProjectsHandler,
];

export const PROJECT_ASSIGNMENT_HANDLERS = [
  ...PROJECT_ASSIGNMENT_COMMAND_HANDLERS,
  ...PROJECT_ASSIGNMENT_QUERY_HANDLERS,
];
