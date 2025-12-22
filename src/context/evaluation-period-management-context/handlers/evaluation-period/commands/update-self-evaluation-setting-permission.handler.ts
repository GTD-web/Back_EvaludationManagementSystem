import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateSelfEvaluationSettingPermissionDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 자기 평가 설정 수동 허용 변경 커맨드
 */
export class UpdateSelfEvaluationSettingPermissionCommand {
  constructor(
    public readonly periodId: string,
    public readonly permissionData: UpdateSelfEvaluationSettingPermissionDto,
    public readonly changedBy: string,
  ) {}
}

/**
 * 자기 평가 설정 수동 허용 변경 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateSelfEvaluationSettingPermissionCommand)
export class UpdateSelfEvaluationSettingPermissionCommandHandler
  implements
    ICommandHandler<
      UpdateSelfEvaluationSettingPermissionCommand,
      EvaluationPeriodDto
    >
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateSelfEvaluationSettingPermissionCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod =
      await this.evaluationPeriodService.수동허용설정_변경한다(
        command.periodId,
        undefined,
        command.permissionData.enabled,
        undefined,
        command.changedBy,
      );

    return updatedPeriod.DTO로_변환한다();
  }
}
