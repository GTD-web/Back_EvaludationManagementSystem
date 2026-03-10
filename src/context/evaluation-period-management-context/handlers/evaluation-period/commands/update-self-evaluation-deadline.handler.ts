import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodAutoPhaseService } from '../../../../../domain/core/evaluation-period/evaluation-period-auto-phase.service';
import {
  EvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateSelfEvaluationDeadlineDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 자기 평가 단계 마감일 수정 커맨드
 */
export class UpdateSelfEvaluationDeadlineCommand {
  constructor(
    public readonly periodId: string,
    public readonly deadlineData: UpdateSelfEvaluationDeadlineDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 자기 평가 단계 마감일 수정 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateSelfEvaluationDeadlineCommand)
export class UpdateSelfEvaluationDeadlineCommandHandler
  implements
    ICommandHandler<UpdateSelfEvaluationDeadlineCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService,
  ) {}

  async execute(
    command: UpdateSelfEvaluationDeadlineCommand,
  ): Promise<EvaluationPeriodDto> {
    const { periodId, deadlineData, updatedBy } = command;

    // UpdateEvaluationPeriodDto 형태로 변환
    const updateDto: UpdateEvaluationPeriodDto = {
      selfEvaluationDeadline: deadlineData.selfEvaluationDeadline,
    };

    // 도메인 서비스를 통해 평가 기간 업데이트
    const updatedPeriod = await this.evaluationPeriodService.업데이트한다(
      periodId,
      updateDto,
      updatedBy,
    );

    // 마감일 수정 후 상태와 단계 자동 조정
    const adjustedPeriod =
      await this.evaluationPeriodAutoPhaseService.adjustStatusAndPhaseAfterScheduleUpdate(
        periodId,
        updatedBy,
      );

    return (adjustedPeriod || updatedPeriod).DTO로_변환한다();
  }
}
