import type { ISSOService } from '../sso/interfaces';
import type { INotificationService, SendNotificationResult } from './interfaces';
export declare const NOTIFICATION_SERVICE_TOKEN = "NotificationService";
export declare class NotificationHelperService {
    private readonly ssoService;
    private readonly notificationService;
    private readonly logger;
    constructor(ssoService: ISSOService, notificationService: INotificationService);
    직원들에게_알림을_전송한다(params: {
        sender: string;
        title: string;
        content: string;
        employeeNumbers: string[];
        sourceSystem: string;
        linkUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<SendNotificationResult>;
    직원에게_알림을_전송한다(params: {
        sender: string;
        title: string;
        content: string;
        employeeNumber: string;
        sourceSystem: string;
        linkUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<SendNotificationResult>;
    Portal사용자에게_알림을_전송한다(params: {
        sender: string;
        title: string;
        content: string;
        sourceSystem: string;
        linkUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<SendNotificationResult>;
}
