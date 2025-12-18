import { WbsAssignmentBusinessService } from '@business/wbs-assignment/wbs-assignment-business.service';
import { WbsAssignmentListResult } from '@context/evaluation-criteria-management-context/handlers/wbs-assignment/queries/get-wbs-assignment-list.handler';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { BulkCreateWbsAssignmentDto, CancelWbsAssignmentByWbsDto, ChangeWbsAssignmentOrderByWbsDto, CreateAndAssignWbsDto, CreateAndAssignWbsBetweenDto, CreateWbsAssignmentDto, EmployeeWbsAssignmentsResponseDto, GetUnassignedWbsItemsDto, ProjectWbsAssignmentsResponseDto, UnassignedWbsItemsResponseDto, UpdateWbsItemTitleDto, WbsAssignmentDetailResponseDto, WbsAssignmentFilterDto, WbsItemAssignmentsResponseDto } from '@interface/common/dto/evaluation-criteria/wbs-assignment.dto';
export declare class WbsAssignmentManagementController {
    private readonly wbsAssignmentBusinessService;
    constructor(wbsAssignmentBusinessService: WbsAssignmentBusinessService);
    createWbsAssignment(createDto: CreateWbsAssignmentDto, user: AuthenticatedUser): Promise<any>;
    cancelWbsAssignmentByWbs(wbsItemId: string, bodyDto: CancelWbsAssignmentByWbsDto, user: AuthenticatedUser): Promise<void>;
    getWbsAssignmentList(filter: WbsAssignmentFilterDto): Promise<WbsAssignmentListResult>;
    getEmployeeWbsAssignments(employeeId: string, periodId: string): Promise<EmployeeWbsAssignmentsResponseDto>;
    getProjectWbsAssignments(projectId: string, periodId: string): Promise<ProjectWbsAssignmentsResponseDto>;
    getWbsItemAssignments(wbsItemId: string, periodId: string): Promise<WbsItemAssignmentsResponseDto>;
    getUnassignedWbsItems(queryDto: GetUnassignedWbsItemsDto): Promise<UnassignedWbsItemsResponseDto>;
    getWbsAssignmentDetail(employeeId: string, wbsItemId: string, projectId: string, periodId: string): Promise<WbsAssignmentDetailResponseDto>;
    bulkCreateWbsAssignments(bulkCreateDto: BulkCreateWbsAssignmentDto, user: AuthenticatedUser): Promise<any[]>;
    resetPeriodWbsAssignments(periodId: string, user: AuthenticatedUser): Promise<void>;
    resetProjectWbsAssignments(projectId: string, periodId: string, user: AuthenticatedUser): Promise<void>;
    resetEmployeeWbsAssignments(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<void>;
    changeWbsAssignmentOrderByWbs(wbsItemId: string, bodyDto: ChangeWbsAssignmentOrderByWbsDto, user: AuthenticatedUser): Promise<any>;
    createAndAssignWbs(createDto: CreateAndAssignWbsDto, user: AuthenticatedUser): Promise<any>;
    createAndAssignWbsBetween(previousWbsItemId: string, nextWbsItemId: string, createDto: CreateAndAssignWbsBetweenDto, user: AuthenticatedUser): Promise<any>;
    updateWbsItemTitle(wbsItemId: string, updateDto: UpdateWbsItemTitleDto, user: AuthenticatedUser): Promise<any>;
}
