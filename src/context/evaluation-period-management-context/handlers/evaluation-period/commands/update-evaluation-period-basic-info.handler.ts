import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import {
  EvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateEvaluationPeriodBasicDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 평가 기간 기본 정보 수정 커맨드
 */
export class UpdateEvaluationPeriodBasicInfoCommand {
  constructor(
    public readonly periodId: string,
    public readonly updateData: UpdateEvaluationPeriodBasicDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 평가 기간 기본 정보 수정 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationPeriodBasicInfoCommand)
export class UpdateEvaluationPeriodBasicInfoCommandHandler
  implements
    ICommandHandler<UpdateEvaluationPeriodBasicInfoCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateEvaluationPeriodBasicInfoCommand,
  ): Promise<EvaluationPeriodDto> {
    const { periodId, updateData, updatedBy } = command;

    // UpdateEvaluationPeriodDto 형태로 변환
    const updateDto: UpdateEvaluationPeriodDto = {
      name: updateData.name,
      description: updateData.description,
      maxSelfEvaluationRate: updateData.maxSelfEvaluationRate,
    };

    // 도메인 서비스를 통해 평가 기간 업데이트
    const updatedPeriod = await this.evaluationPeriodService.업데이트한다(
      periodId,
      updateDto,
      updatedBy,
    );

    return updatedPeriod.DTO로_변환한다();
  }
}
