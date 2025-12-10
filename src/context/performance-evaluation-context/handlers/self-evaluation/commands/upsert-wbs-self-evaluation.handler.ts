import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';

/**
 * WBS 자기평가 Upsert 커맨드
 */
export class UpsertWbsSelfEvaluationCommand {
  constructor(
    public readonly periodId: string,
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly selfEvaluationContent?: string,
    public readonly selfEvaluationScore?: number,
    public readonly performanceResult?: string,
    public readonly actionBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 Upsert 핸들러
 * 기존 자기평가가 있으면 수정, 없으면 생성합니다.
 */
@Injectable()
@CommandHandler(UpsertWbsSelfEvaluationCommand)
export class UpsertWbsSelfEvaluationHandler
  implements ICommandHandler<UpsertWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(UpsertWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: UpsertWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const {
      periodId,
      employeeId,
      wbsItemId,
      selfEvaluationContent,
      selfEvaluationScore,
      performanceResult,
      actionBy,
    } = command;

    return await this.transactionManager.executeTransaction(async () => {
      // 평가기간 조회 및 점수 범위 검증
      const evaluationPeriod =
        await this.evaluationPeriodService.ID로_조회한다(periodId);

      if (!evaluationPeriod) {
        throw new BadRequestException(
          `평가기간을 찾을 수 없습니다. (periodId: ${periodId})`,
        );
      }

      const maxScore = evaluationPeriod.자기평가_달성률_최대값();

      // 점수가 제공된 경우에만 검증
      if (selfEvaluationScore !== undefined && selfEvaluationScore !== null) {
        if (selfEvaluationScore < 0 || selfEvaluationScore > maxScore) {
          throw new BadRequestException(
            `자기평가 점수는 0 ~ ${maxScore} 사이여야 합니다. (입력값: ${selfEvaluationScore})`,
          );
        }
      }

      // 기존 자기평가 조회
      const existingEvaluations =
        await this.wbsSelfEvaluationService.필터_조회한다({
          periodId,
          employeeId,
          wbsItemId,
        });

      let evaluation;

      if (existingEvaluations.length > 0) {
        // 기존 자기평가 수정
        const existing = existingEvaluations[0];
        evaluation = await this.wbsSelfEvaluationService.수정한다(
          existing.id,
          {
            selfEvaluationContent,
            selfEvaluationScore,
            performanceResult,
          },
          actionBy,
        );
      } else {
        // 새로운 자기평가 생성
        evaluation = await this.wbsSelfEvaluationService.생성한다({
          periodId,
          employeeId,
          wbsItemId,
          assignedBy: actionBy,
          selfEvaluationContent,
          selfEvaluationScore,
          performanceResult,
          createdBy: actionBy,
        });
      }

      return evaluation.DTO로_변환한다();
    });
  }
}
