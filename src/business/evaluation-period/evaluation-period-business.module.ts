import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluationPeriodBusinessService } from './evaluation-period-business.service';
import { DomainContextModule } from '../../context/domain-context.module';
import { EvaluationPeriodModule } from '../../domain/core/evaluation-period/evaluation-period.module';

/**
 * 평가기간 비즈니스 모듈
 * 
 * 평가기간 관련 비즈니스 로직의 오케스트레이션을 담당하는 모듈입니다.
 * Context 레이어의 서비스들을 조합하여 비즈니스 로직을 제공합니다.
 */
@Module({
  imports: [
    DomainContextModule,
    CqrsModule,
    EvaluationPeriodModule,
  ],
  providers: [EvaluationPeriodBusinessService],
  exports: [EvaluationPeriodBusinessService],
})
export class EvaluationPeriodBusinessModule {}
