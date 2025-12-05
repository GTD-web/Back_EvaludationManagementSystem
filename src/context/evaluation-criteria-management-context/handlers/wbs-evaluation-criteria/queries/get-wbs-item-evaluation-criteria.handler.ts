import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';

/**
 * WBS 항목별 평가기준 조회 쿼리
 */
export class GetWbsItemEvaluationCriteriaQuery {
  constructor(public readonly wbsItemId: string) {}
}

/**
 * WBS 항목별 평가기준 조회 쿼리 핸들러
 */
@QueryHandler(GetWbsItemEvaluationCriteriaQuery)
export class GetWbsItemEvaluationCriteriaHandler
  implements IQueryHandler<GetWbsItemEvaluationCriteriaQuery>
{
  private readonly logger = new Logger(
    GetWbsItemEvaluationCriteriaHandler.name,
  );

  constructor(
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>,
  ) {}

  async execute(query: GetWbsItemEvaluationCriteriaQuery) {
    const { wbsItemId } = query;

    try {
      const criteriaList = await this.wbsEvaluationCriteriaRepository.find({
        where: { wbsItemId },
        order: { createdAt: 'DESC' },
      });
      const result = criteriaList.map((criteria) => criteria.DTO로_변환한다());

      return result;
    } catch (error) {
      this.logger.error(
        `WBS 항목별 평가기준 조회 실패 - WBS 항목 ID: ${wbsItemId}`,
        error.stack,
      );
      throw error;
    }
  }
}
