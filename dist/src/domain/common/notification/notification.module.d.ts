import { OnModuleInit } from '@nestjs/common';
import { NotificationServiceFactory } from './notification.service.factory';
export declare const NotificationService = "NotificationService";
export declare class NotificationModule implements OnModuleInit {
    private readonly factory;
    constructor(factory: NotificationServiceFactory);
    onModuleInit(): Promise<void>;
}
