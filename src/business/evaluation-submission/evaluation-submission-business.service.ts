import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { SubmitEvaluationCriteriaCommand } from '@context/evaluation-criteria-management-context/handlers/evaluation-criteria-submission';
import { ResetEvaluationCriteriaCommand } from '@context/evaluation-criteria-management-context/handlers/evaluation-criteria-submission';
import { SubmitAllWbsSelfEvaluationsForApprovalCommand } from '@context/performance-evaluation-context/handlers/self-evaluation';
import { ResetAllWbsSelfEvaluationsByEmployeePeriodCommand } from '@context/performance-evaluation-context/handlers/self-evaluation';
import { BulkSubmitDownwardEvaluationsCommand } from '@context/performance-evaluation-context/handlers/downward-evaluation';
import { BulkResetDownwardEvaluationsCommand } from '@context/performance-evaluation-context/handlers/downward-evaluation';
import { GetDownwardEvaluationListQuery } from '@context/performance-evaluation-context/handlers/downward-evaluation';

/**
 * 평가 제출 여부 변경 비즈니스 서비스
 *
 * 평가기준, 자기평가, 1차평가, 2차평가의 제출 여부를 변경합니다.
 * 승인 상태 변경 없이 제출 여부만 변경합니다.
 */
@Injectable()
export class EvaluationSubmissionBusinessService {
  private readonly logger = new Logger(
    EvaluationSubmissionBusinessService.name,
  );

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 평가기준 제출 여부를 변경한다
   */
  async 평가기준_제출여부를_변경한다(
    periodId: string,
    employeeId: string,
    isSubmitted: boolean,
    updatedBy: string,
  ): Promise<number> {
    this.logger.log(
      `평가기준 제출 여부 변경 시작 - 직원: ${employeeId}, 평가기간: ${periodId}, 제출여부: ${isSubmitted}`,
    );

    try {
      if (isSubmitted) {
        await this.commandBus.execute(
          new SubmitEvaluationCriteriaCommand(periodId, employeeId, updatedBy),
        );
      } else {
        await this.commandBus.execute(
          new ResetEvaluationCriteriaCommand(periodId, employeeId, updatedBy),
        );
      }

      this.logger.log(
        `평가기준 제출 여부 변경 완료 - 직원: ${employeeId}, 평가기간: ${periodId}, 제출여부: ${isSubmitted}`,
      );

      return 1; // 단일 맵핑 엔티티만 업데이트
    } catch (error) {
      this.logger.error(
        `평가기준 제출 여부 변경 실패 - 직원: ${employeeId}, 평가기간: ${periodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 자기평가 제출 여부를 변경한다
   * submittedToEvaluator와 submittedToManager를 모두 변경합니다.
   */
  async 자기평가_제출여부를_변경한다(
    periodId: string,
    employeeId: string,
    isSubmitted: boolean,
    updatedBy: string,
  ): Promise<number> {
    this.logger.log(
      `자기평가 제출 여부 변경 시작 - 직원: ${employeeId}, 평가기간: ${periodId}, 제출여부: ${isSubmitted}`,
    );

    try {
      let result;
      if (isSubmitted) {
        result = await this.commandBus.execute(
          new SubmitAllWbsSelfEvaluationsForApprovalCommand(
            employeeId,
            periodId,
            updatedBy,
          ),
        );
      } else {
        result = await this.commandBus.execute(
          new ResetAllWbsSelfEvaluationsByEmployeePeriodCommand(
            employeeId,
            periodId,
            updatedBy,
          ),
        );
      }

      const updatedCount = result.resetCount || result.submittedCount || 0;

      this.logger.log(
        `자기평가 제출 여부 변경 완료 - 직원: ${employeeId}, 평가기간: ${periodId}, 제출여부: ${isSubmitted}, 변경된 항목 수: ${updatedCount}`,
      );

      return updatedCount;
    } catch (error) {
      this.logger.error(
        `자기평가 제출 여부 변경 실패 - 직원: ${employeeId}, 평가기간: ${periodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 1차 하향평가 제출 여부를 변경한다
   * 모든 WBS에 대해 일괄 처리합니다.
   */
  async 일차하향평가_제출여부를_변경한다(
    periodId: string,
    employeeId: string,
    isSubmitted: boolean,
    updatedBy: string,
  ): Promise<number> {
    this.logger.log(
      `1차 하향평가 제출 여부 변경 시작 - 직원: ${employeeId}, 평가기간: ${periodId}, 제출여부: ${isSubmitted}`,
    );

    try {
      // 1차 하향평가 목록 조회하여 evaluatorId 추출
      const queryResult = await this.queryBus.execute(
        new GetDownwardEvaluationListQuery(
          undefined, // evaluatorId
          employeeId,
          periodId,
          undefined, // wbsId
          'primary',
          undefined, // isCompleted
          1,
          1,
        ),
      );

      if (queryResult.evaluations.length === 0) {
        this.logger.warn(
          `1차 하향평가를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${periodId}`,
        );
        return 0;
      }

      // 첫 번째 평가에서 evaluatorId 추출
      const evaluatorId = queryResult.evaluations[0].evaluatorId;
      if (!evaluatorId) {
        throw new BadRequestException(
          `1차 하향평가의 평가자 ID를 찾을 수 없습니다. (직원: ${employeeId}, 평가기간: ${periodId})`,
        );
      }

      let result;
      if (isSubmitted) {
        result = await this.commandBus.execute(
          new BulkSubmitDownwardEvaluationsCommand(
            evaluatorId,
            employeeId,
            periodId,
            DownwardEvaluationType.PRIMARY,
            updatedBy,
            false, // forceSubmit
            false, // approveAllBelow
          ),
        );
      } else {
        result = await this.commandBus.execute(
          new BulkResetDownwardEvaluationsCommand(
            evaluatorId,
            employeeId,
            periodId,
            DownwardEvaluationType.PRIMARY,
            updatedBy,
          ),
        );
      }

      const updatedCount = result.resetCount || result.submittedCount || 0;

      this.logger.log(
        `1차 하향평가 제출 여부 변경 완료 - 직원: ${employeeId}, 평가기간: ${periodId}, 제출여부: ${isSubmitted}, 변경된 항목 수: ${updatedCount}`,
      );

      return updatedCount;
    } catch (error) {
      this.logger.error(
        `1차 하향평가 제출 여부 변경 실패 - 직원: ${employeeId}, 평가기간: ${periodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 2차 하향평가 제출 여부를 변경한다
   * 해당 평가자가 담당하는 WBS만 자동으로 처리합니다.
   */
  async 이차하향평가_제출여부를_변경한다(
    periodId: string,
    employeeId: string,
    evaluatorId: string,
    isSubmitted: boolean,
    updatedBy: string,
  ): Promise<number> {
    this.logger.log(
      `2차 하향평가 제출 여부 변경 시작 - 직원: ${employeeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}, 제출여부: ${isSubmitted}`,
    );

    try {
      // BulkSubmitDownwardEvaluationsCommand와 BulkResetDownwardEvaluationsCommand는
      // 이미 평가라인 매핑을 확인하여 할당된 WBS만 처리하므로, 직접 호출하면 됩니다.
      let result;
      if (isSubmitted) {
        result = await this.commandBus.execute(
          new BulkSubmitDownwardEvaluationsCommand(
            evaluatorId,
            employeeId,
            periodId,
            DownwardEvaluationType.SECONDARY,
            updatedBy,
            false, // forceSubmit
            false, // approveAllBelow
          ),
        );
      } else {
        result = await this.commandBus.execute(
          new BulkResetDownwardEvaluationsCommand(
            evaluatorId,
            employeeId,
            periodId,
            DownwardEvaluationType.SECONDARY,
            updatedBy,
          ),
        );
      }

      const updatedCount = result.resetCount || result.submittedCount || 0;

      this.logger.log(
        `2차 하향평가 제출 여부 변경 완료 - 직원: ${employeeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}, 제출여부: ${isSubmitted}, 변경된 항목 수: ${updatedCount}`,
      );

      return updatedCount;
    } catch (error) {
      this.logger.error(
        `2차 하향평가 제출 여부 변경 실패 - 직원: ${employeeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }
}
