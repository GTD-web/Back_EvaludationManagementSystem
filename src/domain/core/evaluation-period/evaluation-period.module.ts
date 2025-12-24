import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EvaluationPeriod } from './evaluation-period.entity';
import { EvaluationPeriodService } from './evaluation-period.service';
import { EvaluationPeriodValidationService } from './evaluation-period-validation.service';
import { EvaluationPeriodAutoPhaseService } from './evaluation-period-auto-phase.service';
import { EvaluationPeriodApprovalSyncService } from './evaluation-period-approval-sync.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 평가 기간 도메인 모듈
 * 평가 기간의 생명주기와 상태를 관리하는 도메인 모듈입니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationPeriod]), HttpModule],
  providers: [
    EvaluationPeriodService,
    EvaluationPeriodValidationService,
    EvaluationPeriodAutoPhaseService,
    EvaluationPeriodApprovalSyncService,
    TransactionManagerService,
    {
      provide: 'IEvaluationPeriodService',
      useClass: EvaluationPeriodService,
    },
  ],
  exports: [
    EvaluationPeriodService,
    EvaluationPeriodValidationService,
    EvaluationPeriodAutoPhaseService,
    'IEvaluationPeriodService',
  ],
})
export class EvaluationPeriodModule {}
