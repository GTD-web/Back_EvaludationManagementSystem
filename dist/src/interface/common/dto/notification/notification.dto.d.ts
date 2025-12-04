export declare class NotificationDto {
    id: string;
    sender: string;
    recipientId: string;
    title: string;
    content: string;
    isRead: boolean;
    sourceSystem: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    readAt?: Date;
}
export declare class GetNotificationsQueryDto {
    isRead?: string;
    skip?: number;
    take?: number;
}
export declare class GetNotificationsResponseDto {
    notifications: NotificationDto[];
    total: number;
    unreadCount: number;
}
export declare class MarkNotificationAsReadResponseDto {
    success: boolean;
    message?: string;
}
export declare class MarkAllAsReadResponseDto {
    success: boolean;
    message: string;
    updatedCount: number;
}
export declare class NotificationRecipientDto {
    employeeNumber: string;
    tokens: string[];
}
export declare class SendNotificationRequestDto {
    sender: string;
    title: string;
    content: string;
    recipients: NotificationRecipientDto[];
    sourceSystem: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
}
export declare class SendSimpleNotificationQueryDto {
    title: string;
    content: string;
    linkUrl?: string;
}
export declare class SendSimpleNotificationBodyDto {
    metadata?: Record<string, any>;
}
export declare class SendNotificationResponseDto {
    success: boolean;
    message: string;
    notificationId?: string;
    error?: string;
}
