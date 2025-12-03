export interface NotificationRecipient {
    employeeNumber: string;
    tokens: string[];
}
export interface NotificationMetadata {
    type?: string;
    priority?: string;
    [key: string]: any;
}
export interface SendNotificationParams {
    sender: string;
    title: string;
    content: string;
    recipients: NotificationRecipient[];
    sourceSystem: string;
    linkUrl?: string;
    metadata?: NotificationMetadata;
}
export interface SendNotificationResult {
    success: boolean;
    message: string;
    notificationId?: string;
    error?: string;
}
export interface GetNotificationsParams {
    recipientId: string;
    isRead?: boolean;
    skip?: number;
    take?: number;
}
export interface NotificationInfo {
    id: string;
    sender: string;
    recipientId: string;
    title: string;
    content: string;
    isRead: boolean;
    sourceSystem: string;
    linkUrl?: string;
    metadata?: NotificationMetadata;
    createdAt: Date;
    readAt?: Date;
}
export interface GetNotificationsResult {
    notifications: NotificationInfo[];
    total: number;
    unreadCount: number;
}
export interface MarkNotificationAsReadParams {
    notificationId: string;
}
export interface MarkNotificationAsReadResult {
    success: boolean;
    message?: string;
}
export interface MarkAllAsReadParams {
    recipientId: string;
}
export interface MarkAllAsReadResult {
    success: boolean;
    message: string;
    updatedCount: number;
}
