import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';

/**
 * 최종평가 확정 커맨드
 */
export class ConfirmFinalEvaluationCommand {
  constructor(
    public readonly id: string,
    public readonly confirmedBy: string,
  ) {}
}

/**
 * 최종평가 확정 핸들러
 */
@Injectable()
@CommandHandler(ConfirmFinalEvaluationCommand)
export class ConfirmFinalEvaluationHandler
  implements ICommandHandler<ConfirmFinalEvaluationCommand>
{
  constructor(
    private readonly finalEvaluationService: FinalEvaluationService,
    private readonly transactionManager: TransactionManagerService,
    private readonly activityLogService: EvaluationActivityLogContextService,
  ) {}

  async execute(command: ConfirmFinalEvaluationCommand): Promise<void> {
    const { id, confirmedBy } = command;

    await this.transactionManager.executeTransaction(async (manager) => {
      // 확정 전 최종평가 정보 조회
      const repository = manager.getRepository(FinalEvaluation);
      const finalEvaluation = await repository.findOne({ where: { id } });

      // 최종평가 확정
      await this.finalEvaluationService.확정한다(id, confirmedBy, manager);

      // 활동 로그 기록
      if (finalEvaluation) {
        await this.activityLogService.활동내역을_기록한다({
          periodId: finalEvaluation.periodId,
          employeeId: finalEvaluation.employeeId,
          activityType: 'final_evaluation',
          activityAction: 'confirmed',
          activityTitle: '최종평가 확정',
          activityDescription: `최종평가가 확정되었습니다. (평가등급: ${finalEvaluation.evaluationGrade}, 직무등급: ${finalEvaluation.jobGrade}, 세부등급: ${finalEvaluation.jobDetailedGrade})`,
          relatedEntityType: 'FinalEvaluation',
          relatedEntityId: id,
          performedBy: confirmedBy,
          activityMetadata: {
            evaluationGrade: finalEvaluation.evaluationGrade,
            jobGrade: finalEvaluation.jobGrade,
            jobDetailedGrade: finalEvaluation.jobDetailedGrade,
            finalComments: finalEvaluation.finalComments,
          },
        });
      }
    });
  }
}
