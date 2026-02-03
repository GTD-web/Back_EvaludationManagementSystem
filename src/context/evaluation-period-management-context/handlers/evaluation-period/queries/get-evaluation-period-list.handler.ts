import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';

/**
 * 평가 기간 목록 조회 쿼리
 */
export class GetEvaluationPeriodListQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
  ) {}
}

/**
 * 평가 기간 목록 조회 결과 DTO
 */
export interface EvaluationPeriodListResult {
  items: EvaluationPeriodDto[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 평가 기간 목록 조회 쿼리 핸들러
 */
@Injectable()
@QueryHandler(GetEvaluationPeriodListQuery)
export class GetEvaluationPeriodListQueryHandler
  implements
    IQueryHandler<GetEvaluationPeriodListQuery, EvaluationPeriodListResult>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    query: GetEvaluationPeriodListQuery,
  ): Promise<EvaluationPeriodListResult> {
    // TODO: 구현 예정 - 페이징 처리가 포함된 목록 조회
    // 현재는 전체 조회만 가능하므로 임시로 전체 조회 후 페이징 처리
    const allPeriods = await this.evaluationPeriodService.전체_조회한다();

    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const items = allPeriods.slice(startIndex, endIndex);

    return {
      items: items.map((p) => p.DTO로_변환한다()),
      total: allPeriods.length,
      page: query.page,
      limit: query.limit,
    };
  }
}
