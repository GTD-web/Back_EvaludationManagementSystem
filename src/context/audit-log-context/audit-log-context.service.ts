import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateAuditLogCommand } from './handlers/commands/create-audit-log.handler';
import { GetAuditLogListQuery } from './handlers/queries/get-audit-log-list.handler';
import { GetAuditLogDetailQuery } from './handlers/queries/get-audit-log-detail.handler';
import { GetAuditLogStatsQuery } from './handlers/queries/get-audit-log-stats.handler';
import {
  CreateAuditLogDto,
  CreateAuditLogResult,
  AuditLogFilter,
  AuditLogListResult,
  AuditLogStatsResult,
} from './interfaces/audit-log-context.interface';
import { AuditLogDto } from '@domain/common/audit-log/audit-log.types';

/**
 * Audit 로그 컨텍스트 서비스
 *
 * Audit 로그 생성 및 조회 비즈니스 로직을 담당합니다.
 */
@Injectable()
export class AuditLogContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Audit 로그를 생성한다
   */
  async audit로그를생성한다(
    data: CreateAuditLogDto,
  ): Promise<CreateAuditLogResult> {
    const command = new CreateAuditLogCommand(data);
    return await this.commandBus.execute(command);
  }

  /**
   * Audit 로그 목록을 조회한다
   */
  async audit로그목록을_조회한다(
    filter: AuditLogFilter,
    page: number = 1,
    limit: number = 10,
  ): Promise<AuditLogListResult> {
    const query = new GetAuditLogListQuery(filter, page, limit);
    return await this.queryBus.execute(query);
  }

  /**
   * Audit 로그 상세 정보를 조회한다
   */
  async audit로그상세를_조회한다(id: string): Promise<AuditLogDto | null> {
    const query = new GetAuditLogDetailQuery(id);
    return await this.queryBus.execute(query);
  }

  /**
   * Audit 로그 시간대별 통계를 조회한다
   */
  async audit로그통계를_조회한다(
    startDate?: Date,
    endDate?: Date,
    interval: number = 60,
  ): Promise<AuditLogStatsResult> {
    const query = new GetAuditLogStatsQuery(startDate, endDate, interval);
    return await this.queryBus.execute(query);
  }
}
