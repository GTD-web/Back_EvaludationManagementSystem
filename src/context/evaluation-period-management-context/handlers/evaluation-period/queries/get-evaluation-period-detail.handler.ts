import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';

/**
 * 평가 기간 상세 정보 조회 쿼리
 */
export class GetEvaluationPeriodDetailQuery {
  constructor(public readonly periodId: string) {}
}

/**
 * 평가 기간 상세 정보 조회 쿼리 핸들러
 */
@Injectable()
@QueryHandler(GetEvaluationPeriodDetailQuery)
export class GetEvaluationPeriodDetailQueryHandler
  implements
    IQueryHandler<GetEvaluationPeriodDetailQuery, EvaluationPeriodDto | null>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    query: GetEvaluationPeriodDetailQuery,
  ): Promise<EvaluationPeriodDto | null> {
    const period = await this.evaluationPeriodService.ID로_조회한다(
      query.periodId,
    );
    return period ? period.DTO로_변환한다() : null;
  }
}
