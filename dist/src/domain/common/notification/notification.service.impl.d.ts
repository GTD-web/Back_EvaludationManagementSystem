import { OnModuleInit } from '@nestjs/common';
import { INotificationService, SendNotificationParams, SendNotificationResult, GetNotificationsParams, GetNotificationsResult, MarkNotificationAsReadParams, MarkNotificationAsReadResult, MarkAllAsReadParams, MarkAllAsReadResult } from './interfaces';
export declare class NotificationServiceImpl implements INotificationService, OnModuleInit {
    private readonly config;
    private readonly logger;
    private httpClient;
    private initialized;
    constructor(config: any);
    onModuleInit(): Promise<void>;
    초기화한다(): Promise<void>;
    private 초기화확인;
    알림을전송한다(params: SendNotificationParams): Promise<SendNotificationResult>;
    알림목록을조회한다(params: GetNotificationsParams): Promise<GetNotificationsResult>;
    알림을읽음처리한다(params: MarkNotificationAsReadParams): Promise<MarkNotificationAsReadResult>;
    전체알림을읽음처리한다(params: MarkAllAsReadParams): Promise<MarkAllAsReadResult>;
}
