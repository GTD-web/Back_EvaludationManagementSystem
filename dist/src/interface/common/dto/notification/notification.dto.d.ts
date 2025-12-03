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
    isRead?: boolean;
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
