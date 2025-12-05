import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationActivityLog } from './evaluation-activity-log.entity';
import type {
  EvaluationActivityLogDto,
  CreateEvaluationActivityLogData,
  EvaluationActivityLogFilter,
} from './evaluation-activity-log.types';

/**
 * 평가 활동 내역 도메인 서비스
 * 평가 활동 내역 엔티티의 데이터베이스 접근을 담당합니다.
 */
@Injectable()
export class EvaluationActivityLogService {
  private readonly logger = new Logger(EvaluationActivityLogService.name);

  constructor(
    @InjectRepository(EvaluationActivityLog)
    private readonly activityLogRepository: Repository<EvaluationActivityLog>,
  ) {}

  /**
   * 활동 내역을 생성한다
   */
  async 생성한다(
    data: CreateEvaluationActivityLogData,
  ): Promise<EvaluationActivityLogDto> {
    const activityLog = new EvaluationActivityLog(data);
    const saved = await this.activityLogRepository.save(activityLog);

    return saved.DTO로_변환한다();
  }

  /**
   * 평가기간 피평가자 기준 활동 내역을 조회한다
   */
  async 평가기간_피평가자_활동내역을_조회한다(params: {
    periodId: string;
    employeeId: string;
    activityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    items: EvaluationActivityLogDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log('평가기간 피평가자 활동 내역 조회 시작', {
      periodId: params.periodId,
      employeeId: params.employeeId,
    });

    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .where('log.periodId = :periodId', { periodId: params.periodId })
      .andWhere('log.employeeId = :employeeId', {
        employeeId: params.employeeId,
      })
      .andWhere('log.deletedAt IS NULL');

    if (params.activityType) {
      queryBuilder.andWhere('log.activityType = :activityType', {
        activityType: params.activityType,
      });
    }

    if (params.startDate) {
      queryBuilder.andWhere('log.activityDate >= :startDate', {
        startDate: params.startDate,
      });
    }

    if (params.endDate) {
      queryBuilder.andWhere('log.activityDate <= :endDate', {
        endDate: params.endDate,
      });
    }

    queryBuilder
      .orderBy('log.activityDate', 'DESC')
      .addOrderBy('log.createdAt', 'DESC');

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    this.logger.log('평가기간 피평가자 활동 내역 조회 완료', {
      total,
      page,
      limit,
    });

    return {
      items: items.map((item) => item.DTO로_변환한다()),
      total,
      page,
      limit,
    };
  }
}
