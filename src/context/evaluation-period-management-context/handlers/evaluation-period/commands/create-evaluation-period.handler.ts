import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriod } from '../../../../../domain/core/evaluation-period/evaluation-period.entity';
import {
  EvaluationPeriodNameDuplicateException,
  EvaluationPeriodOverlapException,
} from '../../../../../domain/core/evaluation-period/evaluation-period.exceptions';
import { EvaluationPeriodDto } from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { CreateEvaluationPeriodMinimalDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 평가 기간 생성 커맨드
 */
export class CreateEvaluationPeriodCommand {
  constructor(
    public readonly createData: CreateEvaluationPeriodMinimalDto,
    public readonly createdBy: string,
  ) {}
}

/**
 * 평가 기간 생성 커맨드 핸들러
 */
@Injectable()
@CommandHandler(CreateEvaluationPeriodCommand)
export class CreateEvaluationPeriodCommandHandler
  implements ICommandHandler<CreateEvaluationPeriodCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
  ) {}

  async execute(
    command: CreateEvaluationPeriodCommand,
  ): Promise<EvaluationPeriodDto> {
    const { createData, createdBy } = command;

    // CreateEvaluationPeriodDto 형태로 변환
    const createDto = {
      name: createData.name,
      startDate: createData.startDate,
      description: createData.description,
      peerEvaluationDeadline: createData.peerEvaluationDeadline,
      maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
      gradeRanges: createData.gradeRanges,
    };

    // 컨텍스트 핸들러에서 비즈니스 규칙 검증 수행
    await this.이름중복검증한다(createDto.name);
    await this.기간겹침검증한다(
      createDto.startDate,
      createDto.peerEvaluationDeadline,
    );

    // 도메인 서비스를 통해 평가 기간 생성 (검증은 이미 완료됨)
    const createdPeriod = await this.evaluationPeriodService.생성한다(
      createDto,
      createdBy,
    );

    return createdPeriod.DTO로_변환한다();
  }

  /**
   * 이름 중복을 검증한다
   */
  private async 이름중복검증한다(name: string): Promise<void> {
    const count = await this.evaluationPeriodRepository
      .createQueryBuilder('period')
      .where('period.name = :name', { name })
      .getCount();

    if (count > 0) {
      throw new EvaluationPeriodNameDuplicateException(name);
    }
  }

  /**
   * 기간 겹침을 검증한다
   * peerEvaluationDeadline을 기준으로 검증합니다.
   */
  private async 기간겹침검증한다(
    startDate: Date,
    peerEvaluationDeadline?: Date,
  ): Promise<void> {
    if (!peerEvaluationDeadline) {
      return;
    }

    const conflictingPeriod = await this.evaluationPeriodRepository
      .createQueryBuilder('period')
      .where(
        '(period.startDate <= :peerEvaluationDeadline AND period.peerEvaluationDeadline >= :startDate)',
        { startDate, peerEvaluationDeadline },
      )
      .getOne();

    if (conflictingPeriod) {
      throw new EvaluationPeriodOverlapException(
        startDate,
        peerEvaluationDeadline,
        conflictingPeriod.id,
      );
    }
  }
}
