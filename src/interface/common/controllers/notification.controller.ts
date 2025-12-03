import { Controller, Inject, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { INotificationService } from '@domain/common/notification';
import { NOTIFICATION_SERVICE_TOKEN } from '@domain/common/notification/notification-helper.service';
import {
  GetNotifications,
  MarkNotificationAsRead,
  MarkAllNotificationsAsRead,
} from '../decorators/notification/notification-api.decorators';
import {
  GetNotificationsQueryDto,
  GetNotificationsResponseDto,
  MarkNotificationAsReadResponseDto,
  MarkAllAsReadResponseDto,
} from '../dto/notification/notification.dto';

/**
 * 알림 컨트롤러
 * 프론트엔드에서 사용하는 알림 관련 API 제공
 */
@ApiTags('공통 - 알림')
@ApiBearerAuth('Bearer')
@Controller('notifications')
export class NotificationController {
  constructor(
    @Inject(NOTIFICATION_SERVICE_TOKEN)
    private readonly notificationService: INotificationService,
  ) {}

  /**
   * 알림 목록 조회
   */
  @GetNotifications()
  async getNotifications(
    @Param('recipientId') recipientId: string,
    @Query() query: GetNotificationsQueryDto,
  ): Promise<GetNotificationsResponseDto> {
    const result = await this.notificationService.알림목록을조회한다({
      recipientId,
      isRead: query.isRead,
      skip: query.skip,
      take: query.take,
    });

    return result;
  }

  /**
   * 알림 읽음 처리
   */
  @MarkNotificationAsRead()
  async markAsRead(
    @Param('notificationId') notificationId: string,
  ): Promise<MarkNotificationAsReadResponseDto> {
    const result = await this.notificationService.알림을읽음처리한다({
      notificationId,
    });

    return result;
  }

  /**
   * 전체 알림 읽음 처리
   */
  @MarkAllNotificationsAsRead()
  async markAllAsRead(
    @Param('recipientId') recipientId: string,
  ): Promise<MarkAllAsReadResponseDto> {
    const result = await this.notificationService.전체알림을읽음처리한다({
      recipientId,
    });

    return result;
  }
}

