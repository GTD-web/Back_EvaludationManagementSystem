import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateManualSettingPermissionsDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 전체 수동 허용 설정 변경 커맨드
 */
export class UpdateManualSettingPermissionsCommand {
  constructor(
    public readonly periodId: string,
    public readonly permissionData: UpdateManualSettingPermissionsDto,
    public readonly changedBy: string,
  ) {}
}

/**
 * 전체 수동 허용 설정 변경 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateManualSettingPermissionsCommand)
export class UpdateManualSettingPermissionsCommandHandler
  implements
    ICommandHandler<UpdateManualSettingPermissionsCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateManualSettingPermissionsCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod =
      await this.evaluationPeriodService.수동허용설정_변경한다(
        command.periodId,
        command.permissionData.criteriaSettingEnabled,
        command.permissionData.selfEvaluationSettingEnabled,
        command.permissionData.finalEvaluationSettingEnabled,
        command.changedBy,
      );

    return updatedPeriod.DTO로_변환한다();
  }
}
