import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateGradeRangesDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 평가 기간 등급 구간 수정 커맨드
 */
export class UpdateEvaluationPeriodGradeRangesCommand {
  constructor(
    public readonly periodId: string,
    public readonly gradeData: UpdateGradeRangesDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 평가 기간 등급 구간 수정 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationPeriodGradeRangesCommand)
export class UpdateEvaluationPeriodGradeRangesCommandHandler
  implements
    ICommandHandler<
      UpdateEvaluationPeriodGradeRangesCommand,
      EvaluationPeriodDto
    >
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateEvaluationPeriodGradeRangesCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod = await this.evaluationPeriodService.등급구간_설정한다(
      command.periodId,
      command.gradeData.gradeRanges,
      command.updatedBy,
    );

    return updatedPeriod.DTO로_변환한다();
  }
}
