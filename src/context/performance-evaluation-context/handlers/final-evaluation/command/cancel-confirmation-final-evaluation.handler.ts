import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';

/**
 * 최종평가 확정 취소 커맨드
 */
export class CancelConfirmationFinalEvaluationCommand {
  constructor(
    public readonly id: string,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 최종평가 확정 취소 핸들러
 */
@Injectable()
@CommandHandler(CancelConfirmationFinalEvaluationCommand)
export class CancelConfirmationFinalEvaluationHandler
  implements ICommandHandler<CancelConfirmationFinalEvaluationCommand>
{
  private readonly logger = new Logger(
    CancelConfirmationFinalEvaluationHandler.name,
  );

  constructor(
    private readonly finalEvaluationService: FinalEvaluationService,
    private readonly transactionManager: TransactionManagerService,
    private readonly activityLogService: EvaluationActivityLogContextService,
  ) {}

  async execute(
    command: CancelConfirmationFinalEvaluationCommand,
  ): Promise<void> {
    const { id, updatedBy } = command;

    this.logger.log('최종평가 확정 취소 핸들러 실행', { id, updatedBy });

    await this.transactionManager.executeTransaction(async (manager) => {
      // 확정 취소 전 최종평가 정보 조회
      const repository = manager.getRepository(FinalEvaluation);
      const finalEvaluation = await repository.findOne({ where: { id } });

      // 최종평가 확정 취소
      await this.finalEvaluationService.확정_취소한다(id, updatedBy, manager);

      // 활동 로그 기록
      if (finalEvaluation) {
        await this.activityLogService.활동내역을_기록한다({
          periodId: finalEvaluation.periodId,
          employeeId: finalEvaluation.employeeId,
          activityType: 'final_evaluation',
          activityAction: 'confirmation_cancelled',
          activityTitle: '최종평가 확정 취소',
          activityDescription: `최종평가 확정이 취소되었습니다.`,
          relatedEntityType: 'FinalEvaluation',
          relatedEntityId: id,
          performedBy: updatedBy,
          activityMetadata: {
            evaluationGrade: finalEvaluation.evaluationGrade,
            jobGrade: finalEvaluation.jobGrade,
            jobDetailedGrade: finalEvaluation.jobDetailedGrade,
            finalComments: finalEvaluation.finalComments,
          },
        });
      }

      this.logger.log('최종평가 확정 취소 완료', { id });
    });
  }
}
