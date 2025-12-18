import { AuditLogDto } from '@domain/common/audit-log/audit-log.types';
export interface CreateAuditLogDto {
    requestMethod: string;
    requestUrl: string;
    requestPath?: string;
    requestHeaders?: Record<string, string>;
    requestBody?: any;
    requestQuery?: Record<string, any>;
    requestIp?: string;
    responseStatusCode: number;
    responseBody?: any;
    userId?: string;
    userEmail?: string;
    userName?: string;
    employeeNumber?: string;
    requestStartTime: Date;
    requestEndTime: Date;
    duration: number;
    requestId?: string;
}
export interface CreateAuditLogResult {
    id: string;
    createdAt: Date;
}
export interface AuditLogFilter {
    userId?: string;
    userEmail?: string;
    employeeNumber?: string;
    requestMethod?: string;
    requestUrl?: string;
    responseStatusCode?: number;
    startDate?: Date;
    endDate?: Date;
}
export interface AuditLogListResult {
    items: AuditLogDto[];
    total: number;
    page: number;
    limit: number;
}
export interface AuditLogStatsItem {
    time: string;
    timestamp: number;
    success: number;
    errors: number;
    total: number;
}
export interface AuditLogStatsResult {
    stats: AuditLogStatsItem[];
}
