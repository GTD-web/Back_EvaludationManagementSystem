export declare class BulkUpdateEmployeeAdminDto {
    employeeIds: string[];
}
export declare class BulkUpdateEmployeeAdminResponseDto {
    success: boolean;
    totalProcessed: number;
    succeeded: number;
    failed: number;
    failedIds: string[];
    errors: string[];
    processedAt: Date;
}
