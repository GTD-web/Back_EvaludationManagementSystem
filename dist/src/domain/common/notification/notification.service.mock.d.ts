import { INotificationService, SendNotificationParams, SendNotificationResult, GetNotificationsParams, GetNotificationsResult, MarkNotificationAsReadParams, MarkNotificationAsReadResult, MarkAllAsReadParams, MarkAllAsReadResult } from './interfaces';
export declare class MockNotificationService implements INotificationService {
    private readonly logger;
    private mockNotifications;
    private notificationIdCounter;
    초기화한다(): Promise<void>;
    알림을전송한다(params: SendNotificationParams): Promise<SendNotificationResult>;
    알림목록을조회한다(params: GetNotificationsParams): Promise<GetNotificationsResult>;
    알림을읽음처리한다(params: MarkNotificationAsReadParams): Promise<MarkNotificationAsReadResult>;
    전체알림을읽음처리한다(params: MarkAllAsReadParams): Promise<MarkAllAsReadResult>;
}
