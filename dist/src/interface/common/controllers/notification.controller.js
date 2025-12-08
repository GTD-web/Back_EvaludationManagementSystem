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
var NotificationController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notification_helper_service_1 = require("../../../domain/common/notification/notification-helper.service");
const notification_api_decorators_1 = require("../decorators/notification/notification-api.decorators");
const notification_dto_1 = require("../dto/notification/notification.dto");
let NotificationController = NotificationController_1 = class NotificationController {
    notificationService;
    logger = new common_1.Logger(NotificationController_1.name);
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async getNotifications(recipientId, query) {
        let isRead = undefined;
        if (query.isRead !== undefined) {
            const lowerValue = query.isRead.toLowerCase().trim();
            if (lowerValue === 'true' || lowerValue === '1') {
                isRead = true;
            }
            else if (lowerValue === 'false' || lowerValue === '0') {
                isRead = false;
            }
        }
        this.logger.debug(`🔔 알림 목록 조회 API 호출 - recipientId: ${recipientId}, isRead: ${isRead} (원본: "${query.isRead}", type: ${typeof isRead}), sourceSystem: ${query.sourceSystem}, skip: ${query.skip}, take: ${query.take}`);
        const result = await this.notificationService.알림목록을조회한다({
            recipientId,
            isRead: isRead,
            sourceSystem: query.sourceSystem,
            skip: query.skip,
            take: query.take,
        });
        this.logger.debug(`🔔 알림 목록 조회 응답 - 조회: ${result.notifications.length}개, 전체: ${result.total}개, 미읽음: ${result.unreadCount}개`);
        return result;
    }
    async markAsRead(notificationId) {
        const result = await this.notificationService.알림을읽음처리한다({
            notificationId,
        });
        return result;
    }
    async markAllAsRead(recipientId) {
        const result = await this.notificationService.전체알림을읽음처리한다({
            recipientId,
        });
        return result;
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, notification_api_decorators_1.GetNotifications)(),
    __param(0, (0, common_1.Param)('recipientId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_dto_1.GetNotificationsQueryDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getNotifications", null);
__decorate([
    (0, notification_api_decorators_1.MarkNotificationAsRead)(),
    __param(0, (0, common_1.Param)('notificationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAsRead", null);
__decorate([
    (0, notification_api_decorators_1.MarkAllNotificationsAsRead)(),
    __param(0, (0, common_1.Param)('recipientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAllAsRead", null);
exports.NotificationController = NotificationController = NotificationController_1 = __decorate([
    (0, swagger_1.ApiTags)('공통 - 알림'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('notifications'),
    __param(0, (0, common_1.Inject)(notification_helper_service_1.NOTIFICATION_SERVICE_TOKEN)),
    __metadata("design:paramtypes", [Object])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map