import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateCriteriaSettingPermissionDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 평가 기준 설정 수동 허용 변경 커맨드
 */
export class UpdateCriteriaSettingPermissionCommand {
  constructor(
    public readonly periodId: string,
    public readonly permissionData: UpdateCriteriaSettingPermissionDto,
    public readonly changedBy: string,
  ) {}
}

/**
 * 평가 기준 설정 수동 허용 변경 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateCriteriaSettingPermissionCommand)
export class UpdateCriteriaSettingPermissionCommandHandler
  implements
    ICommandHandler<UpdateCriteriaSettingPermissionCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateCriteriaSettingPermissionCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod =
      await this.evaluationPeriodService.수동허용설정_변경한다(
        command.periodId,
        command.permissionData.enabled,
        undefined,
        undefined,
        command.changedBy,
      );

    return updatedPeriod.DTO로_변환한다();
  }
}
