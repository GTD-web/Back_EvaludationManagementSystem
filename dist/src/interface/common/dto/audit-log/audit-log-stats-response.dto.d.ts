export declare class AuditLogStatsItemDto {
    time: string;
    timestamp: number;
    success: number;
    errors: number;
    total: number;
}
export declare class AuditLogStatsResponseDto {
    stats: AuditLogStatsItemDto[];
}
