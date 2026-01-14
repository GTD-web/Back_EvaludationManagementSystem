import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { EvaluationCriteriaManagementService } from '../../../evaluation-criteria-management.service';
import type { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

/**
 * 평가기준 제출 초기화 커맨드
 */
export class ResetEvaluationCriteriaCommand {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly updatedBy: string = '시스템',
  ) {}
}

/**
 * 평가기준 제출 초기화 핸들러
 */
@Injectable()
@CommandHandler(ResetEvaluationCriteriaCommand)
export class ResetEvaluationCriteriaHandler
  implements ICommandHandler<ResetEvaluationCriteriaCommand>
{
  private readonly logger = new Logger(ResetEvaluationCriteriaHandler.name);

  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
  ) {}

  async execute(
    command: ResetEvaluationCriteriaCommand,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const { evaluationPeriodId, employeeId, updatedBy } = command;

    this.logger.log('평가기준 제출 초기화 핸들러 실행', {
      evaluationPeriodId,
      employeeId,
      updatedBy,
    });

    return await this.evaluationCriteriaManagementService.평가기준_제출을_초기화한다(
      evaluationPeriodId,
      employeeId,
      updatedBy,
    );
  }
}
