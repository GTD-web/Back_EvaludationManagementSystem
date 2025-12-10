"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MockNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockNotificationService = void 0;
const common_1 = require("@nestjs/common");
let MockNotificationService = MockNotificationService_1 = class MockNotificationService {
    logger = new common_1.Logger(MockNotificationService_1.name);
    mockNotifications = new Map();
    notificationIdCounter = 1;
    async 초기화한다() {
        this.logger.log('Mock 알림 서비스 초기화 완료');
        this.mockNotifications.set('user001', [
            {
                id: 'notification-1',
                sender: 'system',
                recipientId: 'user001',
                title: '새로운 공지사항',
                content: '새로운 공지사항이 등록되었습니다.',
                isRead: false,
                sourceSystem: 'portal',
                linkUrl: '/portal/announcements/1',
                metadata: { type: 'announcement', priority: 'high' },
                createdAt: new Date(),
            },
            {
                id: 'notification-2',
                sender: 'system',
                recipientId: 'user001',
                title: '평가 기간 안내',
                content: '자기평가 기간이 시작되었습니다.',
                isRead: true,
                sourceSystem: 'ems',
                linkUrl: '/ems/evaluations',
                metadata: { type: 'reminder', priority: 'medium' },
                createdAt: new Date(Date.now() - 86400000),
                readAt: new Date(Date.now() - 43200000),
            },
        ]);
    }
    async 알림을전송한다(params) {
        this.logger.log(`Mock 알림 전송: 제목=${params.title}, 수신자 수=${params.recipients.length}`);
        const notificationId = `notification-${this.notificationIdCounter++}`;
        for (const recipient of params.recipients) {
            const notifications = this.mockNotifications.get(recipient.employeeNumber) || [];
            const newNotification = {
                id: notificationId,
                sender: params.sender,
                recipientId: recipient.employeeNumber,
                title: params.title,
                content: params.content,
                isRead: false,
                sourceSystem: params.sourceSystem,
                linkUrl: params.linkUrl,
                metadata: params.metadata,
                createdAt: new Date(),
            };
            notifications.unshift(newNotification);
            this.mockNotifications.set(recipient.employeeNumber, notifications);
        }
        return {
            success: true,
            message: '포털 알림 전송 완료',
            notificationId,
        };
    }
    async 알림목록을조회한다(params) {
        this.logger.log(`Mock 알림 목록 조회: recipientId=${params.recipientId}`);
        let notifications = this.mockNotifications.get(params.recipientId) || [];
        if (params.isRead !== undefined) {
            notifications = notifications.filter(n => n.isRead === params.isRead);
        }
        const total = notifications.length;
        const unreadCount = notifications.filter(n => !n.isRead).length;
        const skip = params.skip || 0;
        const take = params.take || 20;
        const pagedNotifications = notifications.slice(skip, skip + take);
        return {
            notifications: pagedNotifications,
            total,
            unreadCount,
        };
    }
    async 알림을읽음처리한다(params) {
        this.logger.log(`Mock 알림 읽음 처리: notificationId=${params.notificationId}`);
        for (const [recipientId, notifications] of this.mockNotifications.entries()) {
            const notification = notifications.find(n => n.id === params.notificationId);
            if (notification) {
                notification.isRead = true;
                notification.readAt = new Date();
                return {
                    success: true,
                    message: '알림이 읽음 처리되었습니다.',
                };
            }
        }
        return {
            success: false,
            message: '알림을 찾을 수 없습니다.',
        };
    }
    async 전체알림을읽음처리한다(params) {
        this.logger.log(`Mock 전체 알림 읽음 처리: recipientId=${params.recipientId}`);
        const notifications = this.mockNotifications.get(params.recipientId) || [];
        let updatedCount = 0;
        for (const notification of notifications) {
            if (!notification.isRead) {
                notification.isRead = true;
                notification.readAt = new Date();
                updatedCount++;
            }
        }
        return {
            success: true,
            message: `${updatedCount}건의 알림이 읽음 처리되었습니다.`,
            updatedCount,
        };
    }
};
exports.MockNotificationService = MockNotificationService;
exports.MockNotificationService = MockNotificationService = MockNotificationService_1 = __decorate([
    (0, common_1.Injectable)()
], MockNotificationService);
//# sourceMappingURL=notification.service.mock.js.map