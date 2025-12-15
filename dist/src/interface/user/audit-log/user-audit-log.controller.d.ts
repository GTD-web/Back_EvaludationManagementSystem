import { AuditLogContextService } from '@context/audit-log-context/audit-log-context.service';
import { AuditLogListResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';
import { GetAuditLogListQueryDto } from '@interface/common/dto/audit-log/get-audit-log-list-query.dto';
import { AuditLogResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';
export declare class UserAuditLogController {
    private readonly auditLogContextService;
    constructor(auditLogContextService: AuditLogContextService);
    getAuditLogs(query: GetAuditLogListQueryDto): Promise<AuditLogListResponseDto>;
    getAuditLogDetail(id: string): Promise<AuditLogResponseDto>;
}
