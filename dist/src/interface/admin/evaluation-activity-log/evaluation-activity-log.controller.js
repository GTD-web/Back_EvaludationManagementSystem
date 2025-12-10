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
exports.EvaluationActivityLogController = void 0;
const evaluation_activity_log_context_service_1 = require("../../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_activity_log_response_dto_1 = require("../../common/dto/evaluation-activity-log/evaluation-activity-log-response.dto");
const get_evaluation_activity_log_list_query_dto_1 = require("../../common/dto/evaluation-activity-log/get-evaluation-activity-log-list-query.dto");
let EvaluationActivityLogController = class EvaluationActivityLogController {
    activityLogContextService;
    constructor(activityLogContextService) {
        this.activityLogContextService = activityLogContextService;
    }
    async getEvaluationActivityLogs(periodId, employeeId, query) {
        const startDateValue = query.startDate && query.startDate.trim() !== ''
            ? query.startDate
            : undefined;
        const endDateValue = query.endDate && query.endDate.trim() !== '' ? query.endDate : undefined;
        const result = await this.activityLogContextService.평가기간_피평가자_활동내역을_조회한다({
            periodId,
            employeeId,
            activityType: query.activityType,
            startDate: startDateValue ? new Date(startDateValue) : undefined,
            endDate: endDateValue ? new Date(endDateValue) : undefined,
            page: query.page || 1,
            limit: query.limit || 20,
        });
        return {
            items: result.items,
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }
};
exports.EvaluationActivityLogController = EvaluationActivityLogController;
__decorate([
    (0, common_1.Get)('periods/:periodId/employees/:employeeId'),
    (0, swagger_1.ApiOperation)({
        summary: '평가기간 피평가자 기준 활동 내역 조회',
        description: '특정 평가기간의 특정 피평가자에 대한 모든 활동 내역을 조회합니다.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'periodId',
        description: '평가 기간 ID',
        type: String,
        example: 'period-123',
    }),
    (0, swagger_1.ApiParam)({
        name: 'employeeId',
        description: '피평가자 ID',
        type: String,
        example: 'employee-456',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '활동 내역 목록 조회 성공',
        type: evaluation_activity_log_response_dto_1.EvaluationActivityLogListResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '인증 실패',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음',
    }),
    __param(0, (0, common_1.Param)('periodId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, get_evaluation_activity_log_list_query_dto_1.GetEvaluationActivityLogListQueryDto]),
    __metadata("design:returntype", Promise)
], EvaluationActivityLogController.prototype, "getEvaluationActivityLogs", null);
exports.EvaluationActivityLogController = EvaluationActivityLogController = __decorate([
    (0, swagger_1.ApiTags)('A-0-6. 관리자 - 평가 활동 내역'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/evaluation-activity-logs'),
    __metadata("design:paramtypes", [evaluation_activity_log_context_service_1.EvaluationActivityLogContextService])
], EvaluationActivityLogController);
//# sourceMappingURL=evaluation-activity-log.controller.js.map