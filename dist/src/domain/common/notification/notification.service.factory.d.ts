import { ConfigService } from '@nestjs/config';
import { INotificationService } from './interfaces';
export declare class NotificationServiceFactory {
    private readonly config;
    private readonly configService;
    private readonly logger;
    private serviceInstance;
    constructor(config: any, configService: ConfigService);
    create(): INotificationService;
    initialize(): Promise<void>;
}
