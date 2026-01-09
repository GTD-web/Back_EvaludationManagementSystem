import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateFinalEvaluationSettingPermissionDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 최종 평가 설정 수동 허용 변경 커맨드
 */
export class UpdateFinalEvaluationSettingPermissionCommand {
  constructor(
    public readonly periodId: string,
    public readonly permissionData: UpdateFinalEvaluationSettingPermissionDto,
    public readonly changedBy: string,
  ) {}
}

/**
 * 최종 평가 설정 수동 허용 변경 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateFinalEvaluationSettingPermissionCommand)
export class UpdateFinalEvaluationSettingPermissionCommandHandler
  implements
    ICommandHandler<
      UpdateFinalEvaluationSettingPermissionCommand,
      EvaluationPeriodDto
    >
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateFinalEvaluationSettingPermissionCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod =
      await this.evaluationPeriodService.수동허용설정_변경한다(
        command.periodId,
        undefined,
        undefined,
        command.permissionData.enabled,
        command.changedBy,
      );

    return updatedPeriod.DTO로_변환한다();
  }
}
