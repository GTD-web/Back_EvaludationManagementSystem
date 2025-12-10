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
exports.EvaluatorWbsAssignmentManagementController = void 0;
const wbs_assignment_business_service_1 = require("../../../business/wbs-assignment/wbs-assignment-business.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const wbs_assignment_api_decorators_1 = require("../../common/decorators/evaluation-criteria/wbs-assignment-api.decorators");
const wbs_assignment_dto_1 = require("../../common/dto/evaluation-criteria/wbs-assignment.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let EvaluatorWbsAssignmentManagementController = class EvaluatorWbsAssignmentManagementController {
    wbsAssignmentBusinessService;
    constructor(wbsAssignmentBusinessService) {
        this.wbsAssignmentBusinessService = wbsAssignmentBusinessService;
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
    async updateWbsItemTitle(wbsItemId, updateDto, user) {
        const updatedBy = user.id;
        return await this.wbsAssignmentBusinessService.WBS_항목_이름을_수정한다({
            wbsItemId: wbsItemId,
            title: updateDto.title,
            updatedBy: updatedBy,
        });
    }
};
exports.EvaluatorWbsAssignmentManagementController = EvaluatorWbsAssignmentManagementController;
__decorate([
    (0, wbs_assignment_api_decorators_1.CancelWbsAssignmentByWbs)(),
    __param(0, (0, common_1.Param)('wbsItemId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_assignment_dto_1.CancelWbsAssignmentByWbsDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorWbsAssignmentManagementController.prototype, "cancelWbsAssignmentByWbs", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.ChangeWbsAssignmentOrderByWbs)(),
    __param(0, (0, common_1.Param)('wbsItemId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_assignment_dto_1.ChangeWbsAssignmentOrderByWbsDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorWbsAssignmentManagementController.prototype, "changeWbsAssignmentOrderByWbs", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.CreateAndAssignWbs)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [wbs_assignment_dto_1.CreateAndAssignWbsDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorWbsAssignmentManagementController.prototype, "createAndAssignWbs", null);
__decorate([
    (0, wbs_assignment_api_decorators_1.UpdateWbsItemTitle)(),
    __param(0, (0, common_1.Param)('wbsItemId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wbs_assignment_dto_1.UpdateWbsItemTitleDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorWbsAssignmentManagementController.prototype, "updateWbsItemTitle", null);
exports.EvaluatorWbsAssignmentManagementController = EvaluatorWbsAssignmentManagementController = __decorate([
    (0, swagger_1.ApiTags)('B-2. 평가자 - 평가 설정 - WBS 할당'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('evaluator'),
    (0, common_1.Controller)('evaluator/evaluation-criteria/wbs-assignments'),
    __metadata("design:paramtypes", [wbs_assignment_business_service_1.WbsAssignmentBusinessService])
], EvaluatorWbsAssignmentManagementController);
//# sourceMappingURL=evaluator-wbs-assignment-management.controller.js.map