import type { INotificationService } from '@domain/common/notification';
import { GetNotificationsQueryDto, GetNotificationsResponseDto, MarkNotificationAsReadResponseDto, MarkAllAsReadResponseDto } from '../dto/notification/notification.dto';
export declare class NotificationController {
    private readonly notificationService;
    private readonly logger;
    constructor(notificationService: INotificationService);
    getNotifications(recipientId: string, query: GetNotificationsQueryDto): Promise<GetNotificationsResponseDto>;
    markAsRead(notificationId: string): Promise<MarkNotificationAsReadResponseDto>;
    markAllAsRead(recipientId: string): Promise<MarkAllAsReadResponseDto>;
}
