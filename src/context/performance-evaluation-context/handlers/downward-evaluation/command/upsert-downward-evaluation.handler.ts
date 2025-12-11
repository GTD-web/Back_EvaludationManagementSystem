import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 하향평가 Upsert 커맨드
 */
export class UpsertDownwardEvaluationCommand {
  constructor(
    public readonly evaluatorId: string,
    public readonly evaluateeId: string,
    public readonly periodId: string,
    public readonly wbsId: string,
    public readonly selfEvaluationId?: string,
    public readonly evaluationType: string = 'primary',
    public readonly downwardEvaluationContent?: string,
    public readonly downwardEvaluationScore?: number,
    public readonly actionBy: string = '시스템',
  ) {}
}

/**
 * 하향평가 Upsert 핸들러
 * 기존 하향평가가 있으면 수정, 없으면 생성합니다.
 */
@Injectable()
@CommandHandler(UpsertDownwardEvaluationCommand)
export class UpsertDownwardEvaluationHandler
  implements ICommandHandler<UpsertDownwardEvaluationCommand>
{
  private readonly logger = new Logger(UpsertDownwardEvaluationHandler.name);

  constructor(
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpsertDownwardEvaluationCommand): Promise<string> {
    const {
      evaluatorId,
      evaluateeId,
      periodId,
      wbsId,
      selfEvaluationId,
      evaluationType,
      downwardEvaluationContent,
      downwardEvaluationScore,
      actionBy,
    } = command;

    this.logger.log('하향평가 Upsert 핸들러 실행', {
      evaluatorId,
      evaluateeId,
      periodId,
      wbsId,
      evaluationType,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 기존 하향평가 조회
      // evaluatorId 없이 조회하여 잘못된 evaluatorId로 저장된 평가도 찾을 수 있도록 함
      const existingEvaluations =
        await this.downwardEvaluationService.필터_조회한다({
          employeeId: evaluateeId,
          periodId,
          wbsId,
          evaluationType: evaluationType as DownwardEvaluationType,
        });

      const existingEvaluation =
        existingEvaluations.length > 0 ? existingEvaluations[0] : null;

      if (existingEvaluation) {
        // 기존 하향평가 수정
        this.logger.log('기존 하향평가 수정', {
          evaluationId: existingEvaluation.id,
          oldEvaluatorId: existingEvaluation.evaluatorId,
          newEvaluatorId: evaluatorId,
        });

        await this.downwardEvaluationService.수정한다(
          existingEvaluation.id,
          {
            evaluatorId:
              evaluatorId !== existingEvaluation.evaluatorId
                ? evaluatorId
                : undefined,
            downwardEvaluationContent,
            downwardEvaluationScore,
            selfEvaluationId:
              selfEvaluationId !== existingEvaluation.selfEvaluationId
                ? selfEvaluationId
                : undefined,
          },
          actionBy,
        );

        return existingEvaluation.id;
      } else {
        // 새로운 하향평가 생성
        this.logger.log('새로운 하향평가 생성', {
          evaluatorId,
          evaluateeId,
          evaluationType,
        });

        const evaluation = await this.downwardEvaluationService.생성한다({
          employeeId: evaluateeId,
          evaluatorId,
          wbsId,
          periodId,
          selfEvaluationId,
          downwardEvaluationContent,
          downwardEvaluationScore,
          evaluationDate: new Date(),
          evaluationType: evaluationType as DownwardEvaluationType,
          isCompleted: false,
          createdBy: actionBy,
        });

        this.logger.log('하향평가 생성 완료', { evaluationId: evaluation.id });
        return evaluation.id;
      }
    });
  }
}
