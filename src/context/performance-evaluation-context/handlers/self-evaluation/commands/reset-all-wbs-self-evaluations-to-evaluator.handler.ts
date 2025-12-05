import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 직원의 전체 WBS 자기평가 취소 커맨드 (피평가자 → 1차 평가자 제출 취소)
 */
export class ResetAllWbsSelfEvaluationsToEvaluatorCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly resetBy: string = '시스템',
  ) {}
}

/**
 * 취소된 WBS 자기평가 정보
 */
export interface ResetWbsSelfEvaluationToEvaluatorDetail {
  evaluationId: string;
  wbsItemId: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
  performanceResult?: string;
  wasSubmittedToEvaluator: boolean;
}

/**
 * 취소 실패한 WBS 자기평가 정보
 */
export interface FailedResetWbsSelfEvaluationToEvaluator {
  evaluationId: string;
  wbsItemId: string;
  reason: string;
}

/**
 * 직원의 전체 WBS 자기평가 취소 응답 (피평가자 → 1차 평가자 제출 취소)
 */
export interface ResetAllWbsSelfEvaluationsToEvaluatorResponse {
  /** 취소된 평가 개수 */
  resetCount: number;
  /** 취소 실패한 평가 개수 */
  failedCount: number;
  /** 총 평가 개수 */
  totalCount: number;
  /** 취소된 평가 상세 정보 */
  resetEvaluations: ResetWbsSelfEvaluationToEvaluatorDetail[];
  /** 취소 실패한 평가 정보 */
  failedResets: FailedResetWbsSelfEvaluationToEvaluator[];
}

/**
 * 직원의 전체 WBS 자기평가 취소 핸들러 (피평가자 → 1차 평가자 제출 취소)
 * 특정 직원의 특정 평가기간에 대한 모든 1차 평가자 제출 완료된 WBS 자기평가를 취소합니다.
 */
@Injectable()
@CommandHandler(ResetAllWbsSelfEvaluationsToEvaluatorCommand)
export class ResetAllWbsSelfEvaluationsToEvaluatorHandler
  implements ICommandHandler<ResetAllWbsSelfEvaluationsToEvaluatorCommand>
{
  private readonly logger = new Logger(
    ResetAllWbsSelfEvaluationsToEvaluatorHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: ResetAllWbsSelfEvaluationsToEvaluatorCommand,
  ): Promise<ResetAllWbsSelfEvaluationsToEvaluatorResponse> {
    const { employeeId, periodId, resetBy } = command;

    this.logger.log(
      '직원의 전체 WBS 자기평가 취소 시작 (피평가자 → 1차 평가자 제출 취소)',
      {
        employeeId,
        periodId,
      },
    );

    return await this.transactionManager.executeTransaction(async () => {
      // 해당 직원의 해당 기간 모든 자기평가 조회
      const evaluations = await this.wbsSelfEvaluationService.필터_조회한다({
        employeeId,
        periodId,
      });

      if (evaluations.length === 0) {
        throw new BadRequestException('취소할 자기평가가 존재하지 않습니다.');
      }

      const resetEvaluations: ResetWbsSelfEvaluationToEvaluatorDetail[] = [];
      const failedResets: FailedResetWbsSelfEvaluationToEvaluator[] = [];

      // 각 평가를 취소 처리
      for (const evaluation of evaluations) {
        try {
          const wasSubmittedToEvaluator =
            evaluation.피평가자가_1차평가자에게_제출했는가();

          // 이미 1차 평가자에게 미제출 상태면 스킵
          if (!wasSubmittedToEvaluator) {
            this.logger.debug(
              `이미 1차 평가자에게 미제출 상태 스킵 - ID: ${evaluation.id}`,
            );
            continue;
          }

          // 피평가자가 1차 평가자에게 제출한 것을 취소
          await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한_것을_취소한다(
            evaluation.id,
            resetBy,
          );

          resetEvaluations.push({
            evaluationId: evaluation.id,
            wbsItemId: evaluation.wbsItemId,
            selfEvaluationContent: evaluation.selfEvaluationContent,
            selfEvaluationScore: evaluation.selfEvaluationScore,
            performanceResult: evaluation.performanceResult,
            wasSubmittedToEvaluator,
          });
        } catch (error) {
          this.logger.error(`평가 취소 실패 - ID: ${evaluation.id}`, error);
          failedResets.push({
            evaluationId: evaluation.id,
            wbsItemId: evaluation.wbsItemId,
            reason: error.message || '알 수 없는 오류가 발생했습니다.',
          });
        }
      }

      const result: ResetAllWbsSelfEvaluationsToEvaluatorResponse = {
        resetCount: resetEvaluations.length,
        failedCount: failedResets.length,
        totalCount: evaluations.length,
        resetEvaluations,
        failedResets,
      };

      this.logger.log(
        '직원의 전체 WBS 자기평가 취소 완료 (피평가자 → 1차 평가자 제출 취소)',
        {
          employeeId,
          periodId,
          resetCount: result.resetCount,
          failedCount: result.failedCount,
        },
      );

      // 취소된 평가가 없으면 정보 로그
      if (resetEvaluations.length === 0) {
        this.logger.warn('취소된 평가 없음 (모두 미제출 상태)', {
          totalCount: evaluations.length,
        });
      }

      // 실패한 취소가 있으면 경고 로그
      if (failedResets.length > 0) {
        this.logger.warn('일부 평가 취소 실패', {
          failedCount: failedResets.length,
          failures: failedResets,
        });
      }

      return result;
    });
  }
}
