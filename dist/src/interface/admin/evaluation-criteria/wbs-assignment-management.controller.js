"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsAssignmentManagementController = void 0;
const wbs_assignment_business_service_1 = require("../../../business/wbs-assignment/wbs-assignment-business.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const wbs_assignment_api_decorators_1 = require("../../common/decorators/evaluation-criteria/wbs-assignment-api.decorators");
const wbs_assignment_dto_1 = require("../../common/dto/evaluation-criteria/wbs-assignment.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let WbsAssignmentManagementController = class WbsAssignmentManagementController {
    wbsAssignmentBusinessService;
    constructor(wbsAssignmentBusinessService) {
        this.wbsAssignmentBusinessService = wbsAssignmentBusinessService;
    }
    async createWbsAssignment(createDto, user) {
        const assignedBy = user.id;
        return await this.wbsAssignmentBusinessService.WBS를_할당한다({
            employeeId: createDto.employeeId,
            wbsItemId: createDto.wbsItemId,
            projectId: createDto.projectId,
            periodId: createDto.periodId,
            assignedBy: assignedBy,
        });
    }
    async cancelWbsAssignmentByWbs(wbsItemId, bodyDto, user) {
        const cancelledBy = user.id;
        return await this.wbsAssignmentBusinessService.WBS_할당을_WBS_ID로_취소한다({
            employeeId: bodyDto.employeeId,
            wbsItemId: wbsItemId,
            projectId: bodyDto.projectId,
            periodId: bodyDto.periodId,
            cancelledBy,
        });
    }
    async getWbsAssignmentList(filter) {
        return await this.wbsAssignmentBusinessService.WBS_할당_목록을_조회한다({
            periodId: filter.periodId,
            employeeId: filter.employeeId,
            wbsItemId: filter.wbsItemId,
            projectId: filter.projectId,
            page: filter.page,
            limit: filter.limit,
            orderBy: filter.orderBy,
            orderDirection: filter.orderDirection,
        });
    }
    async getEmployeeWbsAssignments(employeeId, periodId) {
        const wbsAssignments = await this.wbsAssignmentBusinessService.특정_평가기간에_직원에게_할당된_WBS를_조회한다(employeeId, periodId);
        return { wbsAssignments };
    }
    async getProjectWbsAssignments(projectId, periodId) {
        const wbsAssignments = await this.wbsAssignmentBusinessService.특정_평가기간에_프로젝트의_WBS_할당을_조회한다(projectId, periodId);
        return { wbsAssignments };
    }
    async getWbsItemAssignments(wbsItemId, periodId) {
        const wbsAssignments = await this.wbsAssignmentBusinessService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId, periodId);
        return { wbsAssignments };
    }
    async getUnassignedWbsItems(queryDto) {
        const wbsItems = await this.wbsAssignmentBusinessService.특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(queryDto.projectId, queryDto.periodId, queryDto.employeeId);
        return { wbsItems };
    }
    async getWbsAssignmentDetail(employeeId, wbsItemId, projectId, periodId) {
        const result = await this.wbsAssignmentBusinessService.WBS_할당_상세를_조회한다(employeeId, wbsItemId, projectId, periodId);
        if (!result) {
            throw new common_1.NotFoundException('WBS 할당을 찾을 수 없습니다.');
        }
        return result;
    }
    async bulkCreateWbsAssignments(bulkCreateDto, user) {
        const assignedBy = user.id;
        return await this.wbsAssignmentBusinessService.WBS를_대량으로_할당한다({
            assignments: bulkCreateDto.assignments.map((assignment) => ({
                employeeId: assignment.employeeId,
                wbsItemId: assignment.wbsItemId,
                projectId: assignment.projectId,
                periodId: assignment.periodId,
                assignedBy,
            })),
            assignedBy,
        });
    }
    async resetPeriodWbsAssignments(periodId, user) {
        const resetBy = user.id;
        return await this.wbsAssignmentBusinessService.평가기간의_WBS_할당을_초기화한다({
            periodId,
            resetBy,
        });
    }
    async resetProjectWbsAssignments(projectId, periodId, user) {
        const resetBy = user.id;
        return await this.wbsAssignmentBusinessService.프로젝트의_WBS_할당을_초기화한다({
            projectId,
            periodId,
            resetBy,
        });
    }
    async resetEmployeeWbsAssignments(employeeId, periodId, user) {
        const resetBy = user.id;
        return await this.wbsAssignmentBusinessService.직원의_WBS_할당을_초기화한다({
            employeeId,
            periodId,
            resetBy,
        });
    }
    async changeWbsAssignmentOrderByWbs(wbsItemId, bodyDto, user) {
        const updatedBy = user.id;
        return await this.wbsAssignmentBusinessService.WBS_할당_순서를_WBS_ID로_변경한다({
            employeeId: bodyDto.employeeId,
            wbsItemId: wbsItemId,
            projectId: bodyDto.projectId,
            periodId: bodyDto.periodId,
            direction: bodyDto.direction,
            updatedBy,
        });
    }
    async createAndAssignWbs(createDto, user) {
        const createdBy = user.id;
        return await this.wbsAssignmentBusinessService.WBS를_생성하고_할당한다({
            title: createDto.title,
            projectId: createDto.projectId,
            employeeId: createDto.employeeId,
            periodId: createDto.periodId,
            createdBy: createdBy,
        });
    }
    async createAndAssignWbsBetween(previousWbsItemId, nextWbsItemId, createDto, user) {
        const createdBy = user.id;
        const previousId = previousWbsItemId === 'none' ? undefined : previousWbsItemId;
        const nextId = nextWbsItemId === 'none' ? undefined : nextWbsItemId;
        return await this.wbsAssignmentBusinessService.WBS를_사이에_생성하고_할당한다({
            title: createDto.title,
            projectId: createDto.projectId,
            employeeId: createDto.employeeId,
            periodId: createDto.periodId,
            previousWbsItemId: previousId,
            nextWbsItemId: nextId,
            createdBy: createdBy,
        });
    }
    async updateWbsItemTitle(wbsItemId, updateDto, user) {
        const updatedBy = user.id;
        return await this.wbsAssignmentBusinessService.WBS_항목_이름을_수정한다({
            wbsItemId: wbsItemId,
            title: updateDto.title,
            updatedBy: updatedBy,
        });
    }
};
exports.WbsAssignmentManagementController = WbsAssignmentManagementController;
__decorate([
    (0, wbs_assignment_api_decorators_1.CreateWbsAssignment)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_assignment_dto_1.CreateWbsAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "createWbsAssignment", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.CancelWbsAssignmentByWbs)(),
    __param(0, (0, common_1.Param)('wbsItemId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_assignment_dto_1.CancelWbsAssignmentByWbsDto, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "cancelWbsAssignmentByWbs", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.GetWbsAssignmentList)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_assignment_dto_1.WbsAssignmentFilterDto]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "getWbsAssignmentList", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.GetEmployeeWbsAssignments)(),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "getEmployeeWbsAssignments", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.GetProjectWbsAssignments)(),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "getProjectWbsAssignments", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.GetWbsItemAssignments)(),
    __param(0, (0, common_1.Param)('wbsItemId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "getWbsItemAssignments", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.GetUnassignedWbsItems)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_assignment_dto_1.GetUnassignedWbsItemsDto]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "getUnassignedWbsItems", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.GetWbsAssignmentDetail)(),
    __param(0, (0, common_1.Query)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('wbsItemId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)('projectId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Query)('periodId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "getWbsAssignmentDetail", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.BulkCreateWbsAssignments)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_assignment_dto_1.BulkCreateWbsAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "bulkCreateWbsAssignments", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.ResetPeriodWbsAssignments)(),
    __param(0, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "resetPeriodWbsAssignments", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.ResetProjectWbsAssignments)(),
    __param(0, (0, common_1.Param)('projectId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "resetProjectWbsAssignments", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.ResetEmployeeWbsAssignments)(),
    __param(0, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "resetEmployeeWbsAssignments", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.ChangeWbsAssignmentOrderByWbs)(),
    __param(0, (0, common_1.Param)('wbsItemId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_assignment_dto_1.ChangeWbsAssignmentOrderByWbsDto, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "changeWbsAssignmentOrderByWbs", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.CreateAndAssignWbs)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_assignment_dto_1.CreateAndAssignWbsDto, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "createAndAssignWbs", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.CreateAndAssignWbsBetween)(),
    __param(0, (0, common_1.Param)('previousWbsItemId')),
    __param(1, (0, common_1.Param)('nextWbsItemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, wbs_assignment_dto_1.CreateAndAssignWbsBetweenDto, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "createAndAssignWbsBetween", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.UpdateWbsItemTitle)(),
    __param(0, (0, common_1.Param)('wbsItemId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_assignment_dto_1.UpdateWbsItemTitleDto, Object]),
    __metadata("design:returntype", Promise)
], WbsAssignmentManagementController.prototype, "updateWbsItemTitle", null);
exports.WbsAssignmentManagementController = WbsAssignmentManagementController = __decorate([
    (0, swagger_1.ApiTags)('B-2. 관리자 - 평가 설정 - WBS 할당'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/evaluation-criteria/wbs-assignments'),
    __metadata("design:paramtypes", [wbs_assignment_business_service_1.WbsAssignmentBusinessService])
], WbsAssignmentManagementController);
//# sourceMappingURL=wbs-assignment-management.controller.js.map