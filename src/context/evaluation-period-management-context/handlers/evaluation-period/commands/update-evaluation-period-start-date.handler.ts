import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import {
  EvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from '@domain/core/evaluation-period/evaluation-period.types';
import { UpdateEvaluationPeriodStartDateDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 평가 기간 시작일 수정 커맨드
 */
export class UpdateEvaluationPeriodStartDateCommand {
  constructor(
    public readonly periodId: string,
    public readonly startDateData: UpdateEvaluationPeriodStartDateDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 평가 기간 시작일 수정 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationPeriodStartDateCommand)
export class UpdateEvaluationPeriodStartDateCommandHandler
  implements
    ICommandHandler<UpdateEvaluationPeriodStartDateCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService,
  ) {}

  async execute(
    command: UpdateEvaluationPeriodStartDateCommand,
  ): Promise<EvaluationPeriodDto> {
    const { periodId, startDateData, updatedBy } = command;

    // UpdateEvaluationPeriodDto 형태로 변환
    const updateDto: UpdateEvaluationPeriodDto = {
      startDate: startDateData.startDate,
    };

    // 도메인 서비스를 통해 평가 기간 업데이트
    const updatedPeriod = await this.evaluationPeriodService.업데이트한다(
      periodId,
      updateDto,
      updatedBy,
    );

    // 시작일 수정 후 상태와 단계 자동 조정
    const adjustedPeriod =
      await this.evaluationPeriodAutoPhaseService.adjustStatusAndPhaseAfterScheduleUpdate(
        periodId,
        updatedBy,
      );

    return (adjustedPeriod || updatedPeriod).DTO로_변환한다();
  }
}
