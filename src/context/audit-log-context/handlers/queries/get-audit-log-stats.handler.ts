import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import {
  AuditLogStatsResult,
  AuditLogStatsItem,
} from '../../interfaces/audit-log-context.interface';

export class GetAuditLogStatsQuery {
  constructor(
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly interval: number = 60, // 기본값: 60분 (1시간)
  ) {}
}

@Injectable()
@QueryHandler(GetAuditLogStatsQuery)
export class GetAuditLogStatsHandler
  implements IQueryHandler<GetAuditLogStatsQuery, AuditLogStatsResult>
{
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async execute(query: GetAuditLogStatsQuery): Promise<AuditLogStatsResult> {
    const { startDate, endDate, interval } = query;

    // 기본 시간 범위 설정 (최근 24시간)
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 24 * 60 * 60 * 1000);

    // PostgreSQL을 사용한 시간대별 그룹화 쿼리
    const timeGroupExpression = `date_trunc('hour', auditLog.requestStartTime) + 
         (FLOOR(EXTRACT(MINUTE FROM auditLog.requestStartTime) / :interval) * :interval || ' minutes')::INTERVAL`;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .select(timeGroupExpression, 'timeGroup')
      .addSelect(
        `SUM(CASE WHEN auditLog.responseStatusCode >= 200 AND auditLog.responseStatusCode < 400 THEN 1 ELSE 0 END)`,
        'success',
      )
      .addSelect(
        `SUM(CASE WHEN auditLog.responseStatusCode >= 400 THEN 1 ELSE 0 END)`,
        'errors',
      )
      .addSelect('COUNT(*)', 'total')
      .where('auditLog.requestStartTime >= :start', { start })
      .andWhere('auditLog.requestStartTime <= :end', { end })
      .setParameter('interval', interval)
      .groupBy(timeGroupExpression)
      .orderBy('"timeGroup"', 'ASC');

    const rawResults = await queryBuilder.getRawMany();

    // 시간 범위 내의 모든 시간대 생성 (데이터가 없는 시간대도 포함)
    const stats = this.시간대별_통계를_생성한다(
      start,
      end,
      interval,
      rawResults,
    );

    return { stats };
  }

  /**
   * 시간대별 통계를 생성한다
   */
  private 시간대별_통계를_생성한다(
    startDate: Date,
    endDate: Date,
    interval: number,
    rawResults: any[],
  ): AuditLogStatsItem[] {
    const stats: AuditLogStatsItem[] = [];
    const intervalMs = interval * 60 * 1000;
    
    // 시작 시간을 interval에 맞춰 정렬
    const startTime = new Date(
      Math.floor(startDate.getTime() / intervalMs) * intervalMs,
    );

    let currentTime = new Date(startTime);

    while (currentTime <= endDate) {
      const timestamp = currentTime.getTime();
      
      // 현재 시간대에 해당하는 데이터 찾기
      const matchingResult = rawResults.find((result) => {
        const resultTime = new Date(result.timeGroup).getTime();
        return Math.abs(resultTime - timestamp) < intervalMs;
      });

      stats.push({
        time: this.시간을_HHmm_형식으로_변환한다(currentTime),
        timestamp,
        success: matchingResult ? parseInt(matchingResult.success, 10) : 0,
        errors: matchingResult ? parseInt(matchingResult.errors, 10) : 0,
        total: matchingResult ? parseInt(matchingResult.total, 10) : 0,
      });

      currentTime = new Date(currentTime.getTime() + intervalMs);
    }

    return stats;
  }

  /**
   * 시간을 HH:mm 형식으로 변환한다
   */
  private 시간을_HHmm_형식으로_변환한다(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

