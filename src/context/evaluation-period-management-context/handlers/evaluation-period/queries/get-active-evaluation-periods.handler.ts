import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';

/**
 * 활성 평가 기간 조회 쿼리
 */
export class GetActiveEvaluationPeriodsQuery {
  constructor() {}
}

/**
 * 활성 평가 기간 조회 쿼리 핸들러
 */
@Injectable()
@QueryHandler(GetActiveEvaluationPeriodsQuery)
export class GetActiveEvaluationPeriodsQueryHandler
  implements
    IQueryHandler<GetActiveEvaluationPeriodsQuery, EvaluationPeriodDto[]>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    query: GetActiveEvaluationPeriodsQuery,
  ): Promise<EvaluationPeriodDto[]> {
    const activePeriods =
      await this.evaluationPeriodService.활성화된_평가기간_조회한다();
    return activePeriods.map((p) => p.DTO로_변환한다());
  }
}
