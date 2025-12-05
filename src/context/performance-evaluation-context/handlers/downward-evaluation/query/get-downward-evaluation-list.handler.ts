import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import type {
  DownwardEvaluationDto,
  DownwardEvaluationType,
} from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * ?�향?��? 목록 조회 쿼리
 */
export class GetDownwardEvaluationListQuery {
  constructor(
    public readonly evaluatorId?: string,
    public readonly evaluateeId?: string,
    public readonly periodId?: string,
    public readonly wbsId?: string,
    public readonly evaluationType?: string,
    public readonly isCompleted?: boolean,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

/**
 * ?�향?��? 목록 조회 ?�들??
 */
@Injectable()
@QueryHandler(GetDownwardEvaluationListQuery)
export class GetDownwardEvaluationListHandler
  implements IQueryHandler<GetDownwardEvaluationListQuery>
{
  private readonly logger = new Logger(GetDownwardEvaluationListHandler.name);

  constructor(
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
  ) {}

  async execute(query: GetDownwardEvaluationListQuery): Promise<{
    evaluations: DownwardEvaluationDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      evaluatorId,
      evaluateeId,
      periodId,
      wbsId,
      evaluationType,
      isCompleted,
      page,
      limit,
    } = query;

    // 하향평가 목록 조회
    const queryBuilder = this.downwardEvaluationRepository
      .createQueryBuilder('evaluation')
      .where('evaluation.deletedAt IS NULL');

    // 필터 조건 적용
    if (evaluatorId) {
      queryBuilder.andWhere('evaluation.evaluatorId = :evaluatorId', {
        evaluatorId,
      });
    }

    if (evaluateeId) {
      queryBuilder.andWhere('evaluation.employeeId = :evaluateeId', {
        evaluateeId,
      });
    }

    if (periodId) {
      queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
    }

    if (wbsId) {
      queryBuilder.andWhere('evaluation.wbsId = :wbsId', { wbsId });
    }

    if (evaluationType) {
      queryBuilder.andWhere('evaluation.evaluationType = :evaluationType', {
        evaluationType: evaluationType as DownwardEvaluationType,
      });
    }

    if (isCompleted !== undefined) {
      queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
        isCompleted,
      });
    }

    // 정렬 및 페이지네이션
    queryBuilder.orderBy('evaluation.createdAt', 'DESC');

    if (page && limit) {
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);
    }

    const evaluations = await queryBuilder.getMany();

    const result = {
      evaluations: evaluations.map((evaluation) => evaluation.DTO로_변환한다()),
      total: evaluations.length,
      page,
      limit,
    };

    return result;
  }
}
