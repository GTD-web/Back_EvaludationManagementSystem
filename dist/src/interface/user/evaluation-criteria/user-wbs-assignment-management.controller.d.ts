import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { WbsAssignmentBusinessService } from '../../../business/wbs-assignment/wbs-assignment-business.service';
import { CancelWbsAssignmentByWbsDto, ChangeWbsAssignmentOrderByWbsDto, CreateAndAssignWbsDto, UpdateWbsItemTitleDto } from '@interface/common/dto/evaluation-criteria/wbs-assignment.dto';
export declare class UserWbsAssignmentManagementController {
    private readonly wbsAssignmentBusinessService;
    constructor(wbsAssignmentBusinessService: WbsAssignmentBusinessService);
    cancelWbsAssignmentByWbs(wbsItemId: string, bodyDto: CancelWbsAssignmentByWbsDto, user: AuthenticatedUser): Promise<void>;
    resetEmployeeWbsAssignments(employeeId: string, periodId: string, user: AuthenticatedUser): Promise<void>;
    changeWbsAssignmentOrderByWbs(wbsItemId: string, bodyDto: ChangeWbsAssignmentOrderByWbsDto, user: AuthenticatedUser): Promise<any>;
    createAndAssignWbs(createDto: CreateAndAssignWbsDto, user: AuthenticatedUser): Promise<any>;
    updateWbsItemTitle(wbsItemId: string, updateDto: UpdateWbsItemTitleDto, user: AuthenticatedUser): Promise<any>;
}
