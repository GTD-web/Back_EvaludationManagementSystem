import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateAuditLogDto, CreateAuditLogResult, AuditLogFilter, AuditLogListResult, AuditLogStatsResult } from './interfaces/audit-log-context.interface';
import { AuditLogDto } from '@domain/common/audit-log/audit-log.types';
export declare class AuditLogContextService {
    private readonly commandBus;
    private readonly queryBus;
    constructor(commandBus: CommandBus, queryBus: QueryBus);
    audit로그를생성한다(data: CreateAuditLogDto): Promise<CreateAuditLogResult>;
    audit로그목록을_조회한다(filter: AuditLogFilter, page?: number, limit?: number): Promise<AuditLogListResult>;
    audit로그상세를_조회한다(id: string): Promise<AuditLogDto | null>;
    audit로그통계를_조회한다(startDate?: Date, endDate?: Date, interval?: number): Promise<AuditLogStatsResult>;
}
