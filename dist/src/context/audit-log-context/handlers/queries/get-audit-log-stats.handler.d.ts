import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogStatsResult } from '../../interfaces/audit-log-context.interface';
export declare class GetAuditLogStatsQuery {
    readonly startDate?: Date | undefined;
    readonly endDate?: Date | undefined;
    readonly interval: number;
    constructor(startDate?: Date | undefined, endDate?: Date | undefined, interval?: number);
}
export declare class GetAuditLogStatsHandler implements IQueryHandler<GetAuditLogStatsQuery, AuditLogStatsResult> {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    execute(query: GetAuditLogStatsQuery): Promise<AuditLogStatsResult>;
    private 시간대별_통계를_생성한다;
    private 시간을_HHmm_형식으로_변환한다;
}
