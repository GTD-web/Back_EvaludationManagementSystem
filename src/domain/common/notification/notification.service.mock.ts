import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationService,
  SendNotificationParams,
  SendNotificationResult,
  GetNotificationsParams,
  GetNotificationsResult,
  MarkNotificationAsReadParams,
  MarkNotificationAsReadResult,
  MarkAllAsReadParams,
  MarkAllAsReadResult,
  NotificationInfo,
} from './interfaces';

/**
 * Mock 알림 서비스
 * 테스트 및 개발 환경에서 사용하는 Mock 서비스
 */
@Injectable()
export class MockNotificationService implements INotificationService {
  private readonly logger = new Logger(MockNotificationService.name);
  private mockNotifications: Map<string, NotificationInfo[]> = new Map();
  private notificationIdCounter = 1;

  async 초기화한다(): Promise<void> {
    this.logger.log('Mock 알림 서비스 초기화 완료');
    
    // Mock 데이터 초기화
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
        createdAt: new Date(Date.now() - 86400000), // 1일 전
        readAt: new Date(Date.now() - 43200000), // 12시간 전
      },
    ]);
  }

  async 알림을전송한다(params: SendNotificationParams): Promise<SendNotificationResult> {
    this.logger.log(
      `Mock 알림 전송: 제목=${params.title}, 수신자 수=${params.recipients.length}`,
    );

    const notificationId = `notification-${this.notificationIdCounter++}`;

    // 각 수신자에게 알림 추가
    for (const recipient of params.recipients) {
      const notifications = this.mockNotifications.get(recipient.employeeNumber) || [];
      
      const newNotification: NotificationInfo = {
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

  async 알림목록을조회한다(params: GetNotificationsParams): Promise<GetNotificationsResult> {
    this.logger.log(
      `Mock 알림 목록 조회: recipientId=${params.recipientId}`,
    );

    let notifications = this.mockNotifications.get(params.recipientId) || [];

    // 읽음 여부 필터링
    if (params.isRead !== undefined) {
      notifications = notifications.filter(n => n.isRead === params.isRead);
    }

    const total = notifications.length;
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // 페이징 처리
    const skip = params.skip || 0;
    const take = params.take || 20;
    const pagedNotifications = notifications.slice(skip, skip + take);

    return {
      notifications: pagedNotifications,
      total,
      unreadCount,
    };
  }

  async 알림을읽음처리한다(params: MarkNotificationAsReadParams): Promise<MarkNotificationAsReadResult> {
    this.logger.log(
      `Mock 알림 읽음 처리: notificationId=${params.notificationId}`,
    );

    // 모든 수신자의 알림을 검색
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

  async 전체알림을읽음처리한다(params: MarkAllAsReadParams): Promise<MarkAllAsReadResult> {
    this.logger.log(
      `Mock 전체 알림 읽음 처리: recipientId=${params.recipientId}`,
    );

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
}

