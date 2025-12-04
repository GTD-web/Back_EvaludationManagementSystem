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
exports.UserRevisionRequestController = void 0;
const revision_request_business_service_1 = require("../../../business/revision-request/revision-request-business.service");
const revision_request_context_1 = require("../../../context/revision-request-context");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const revision_request_api_decorators_1 = require("../../common/decorators/revision-request/revision-request-api.decorators");
const complete_revision_request_dto_1 = require("../../common/dto/revision-request/complete-revision-request.dto");
const get_revision_requests_query_dto_1 = require("../../common/dto/revision-request/get-revision-requests-query.dto");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let UserRevisionRequestController = class UserRevisionRequestController {
    revisionRequestBusinessService;
    revisionRequestContextService;
    constructor(revisionRequestBusinessService, revisionRequestContextService) {
        this.revisionRequestBusinessService = revisionRequestBusinessService;
        this.revisionRequestContextService = revisionRequestContextService;
    }
    async getMyRevisionRequests(query, recipientId) {
        const requests = await this.revisionRequestContextService.내_재작성요청목록을_조회한다(recipientId, {
            evaluationPeriodId: query.evaluationPeriodId,
            employeeId: query.employeeId,
            isRead: query.isRead ?? false,
            isCompleted: query.isCompleted ?? false,
            step: query.step,
        });
        return requests.map((req) => ({
            requestId: req.request.id,
            evaluationPeriod: req.evaluationPeriod,
            employee: req.employee,
            step: req.request.step,
            comment: req.request.comment,
            requestedBy: req.request.requestedBy,
            requestedAt: req.request.requestedAt,
            recipientId: req.recipientInfo.recipientId,
            recipientType: req.recipientInfo.recipientType,
            isRead: req.recipientInfo.isRead,
            readAt: req.recipientInfo.readAt,
            isCompleted: req.recipientInfo.isCompleted,
            completedAt: req.recipientInfo.completedAt,
            responseComment: req.recipientInfo.responseComment,
            approvalStatus: req.approvalStatus,
        }));
    }
    async getMyUnreadCount(recipientId) {
        const count = await this.revisionRequestContextService.읽지않은_재작성요청수를_조회한다(recipientId);
        return { unreadCount: count };
    }
    async markAsRead(requestId, recipientId) {
        await this.revisionRequestContextService.재작성요청을_읽음처리한다(requestId, recipientId);
    }
    async completeRevisionRequest(requestId, dto, recipientId) {
        await this.revisionRequestBusinessService.재작성완료_응답을_제출한다(requestId, recipientId, dto.responseComment);
    }
};
exports.UserRevisionRequestController = UserRevisionRequestController;
__decorate([
    (0, revision_request_api_decorators_1.GetMyRevisionRequests)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_revision_requests_query_dto_1.GetRevisionRequestsQueryDto, String]),
    __metadata("design:returntype", Promise)
], UserRevisionRequestController.prototype, "getMyRevisionRequests", null);
__decorate([
    (0, revision_request_api_decorators_1.GetMyUnreadCount)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserRevisionRequestController.prototype, "getMyUnreadCount", null);
__decorate([
    (0, revision_request_api_decorators_1.MarkRevisionRequestAsRead)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserRevisionRequestController.prototype, "markAsRead", null);
__decorate([
    (0, revision_request_api_decorators_1.CompleteRevisionRequest)(),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, complete_revision_request_dto_1.CompleteRevisionRequestDto, String]),
    __metadata("design:returntype", Promise)
], UserRevisionRequestController.prototype, "completeRevisionRequest", null);
exports.UserRevisionRequestController = UserRevisionRequestController = __decorate([
    (0, swagger_1.ApiTags)('A-0-4. 사용자 - 재작성 요청'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('user/revision-requests'),
    __metadata("design:paramtypes", [revision_request_business_service_1.RevisionRequestBusinessService,
        revision_request_context_1.RevisionRequestContextService])
], UserRevisionRequestController);
//# sourceMappingURL=user-revision-request.controller.js.map