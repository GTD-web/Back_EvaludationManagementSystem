import { AuditLogContextService } from '@context/audit-log-context/audit-log-context.service';
import { AuditLogListResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';
import { GetAuditLogListQueryDto } from '@interface/common/dto/audit-log/get-audit-log-list-query.dto';
import { AuditLogResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';
import { GetAuditLogStatsQueryDto } from '@interface/common/dto/audit-log/get-audit-log-stats-query.dto';
import { AuditLogStatsResponseDto } from '@interface/common/dto/audit-log/audit-log-stats-response.dto';
export declare class AuditLogController {
    private readonly auditLogContextService;
    constructor(auditLogContextService: AuditLogContextService);
    getAuditLogStats(query: GetAuditLogStatsQueryDto): Promise<AuditLogStatsResponseDto>;
    getAuditLogs(query: GetAuditLogListQueryDto): Promise<AuditLogListResponseDto>;
    getAuditLogDetail(id: string): Promise<AuditLogResponseDto>;
}
