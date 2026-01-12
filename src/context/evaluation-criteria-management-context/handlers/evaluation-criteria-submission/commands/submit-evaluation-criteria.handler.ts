import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import type { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

/**
 * 평가기준 제출 커맨드
 */
export class SubmitEvaluationCriteriaCommand {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * 평가기준 제출 핸들러
 */
@Injectable()
@CommandHandler(SubmitEvaluationCriteriaCommand)
export class SubmitEvaluationCriteriaHandler
  implements ICommandHandler<SubmitEvaluationCriteriaCommand>
{
  private readonly logger = new Logger(SubmitEvaluationCriteriaHandler.name);

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: SubmitEvaluationCriteriaCommand,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const { evaluationPeriodId, employeeId, submittedBy } = command;

    this.logger.log('평가기준 제출 핸들러 실행', {
      evaluationPeriodId,
      employeeId,
      submittedBy,
    });

    return await this.transactionManager.executeTransaction(async () => {
      return await this.evaluationPeriodEmployeeMappingService.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        submittedBy,
      );
    });
  }
}
