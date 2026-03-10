import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';

/**
 * 최종평가 Upsert 커맨드
 * employeeId와 periodId로 기존 평가를 찾아서 있으면 수정, 없으면 생성
 */
export class UpsertFinalEvaluationCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly evaluationGrade: string,
    public readonly jobGrade: JobGrade,
    public readonly jobDetailedGrade: JobDetailedGrade,
    public readonly finalComments?: string,
    public readonly actionBy: string = '시스템',
  ) {}
}

/**
 * 최종평가 Upsert 핸들러
 */
@Injectable()
@CommandHandler(UpsertFinalEvaluationCommand)
export class UpsertFinalEvaluationHandler
  implements ICommandHandler<UpsertFinalEvaluationCommand>
{
  constructor(
    private readonly finalEvaluationService: FinalEvaluationService,
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpsertFinalEvaluationCommand): Promise<string> {
    const {
      employeeId,
      periodId,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      finalComments,
      actionBy,
    } = command;

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 기존 최종평가 확인 (employeeId + periodId 조합으로 유니크)
      // 트랜잭션 내에서 조회하기 위해 manager를 사용한 repository를 사용
      const repository = this.transactionManager.getRepository(
        FinalEvaluation,
        this.finalEvaluationRepository,
        manager,
      );
      const existingEvaluation = await repository.findOne({
        where: {
          employeeId,
          periodId,
        },
      });

      if (existingEvaluation) {
        // 기존 평가가 있으면 수정
        await this.finalEvaluationService.수정한다(
          existingEvaluation.id,
          {
            evaluationGrade,
            jobGrade,
            jobDetailedGrade,
            finalComments,
          },
          actionBy,
          manager,
        );

        return existingEvaluation.id;
      } else {
        // 기존 평가가 없으면 생성
        const newEvaluation = await this.finalEvaluationService.생성한다(
          {
            employeeId,
            periodId,
            evaluationGrade,
            jobGrade,
            jobDetailedGrade,
            finalComments,
            createdBy: actionBy,
          },
          manager,
        );

        return newEvaluation.id;
      }
    });
  }
}
