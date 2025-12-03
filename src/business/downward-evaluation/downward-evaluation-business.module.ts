import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownwardEvaluationBusinessService } from './downward-evaluation-business.service';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationPeriodManagementContextModule } from '@context/evaluation-period-management-context/evaluation-period-management-context.module';
import { RevisionRequestContextModule } from '@context/revision-request-context/revision-request-context.module';
import { StepApprovalContextModule } from '@context/step-approval-context/step-approval-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { NotificationModule } from '@domain/common/notification';
import { CoreDomainModule } from '@domain/core/core-domain.module';

/**
 * 하향평가 비즈니스 모듈
 *
 * 하향평가 관련 비즈니스 로직을 제공합니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([WbsSelfEvaluation, DownwardEvaluation]),
    CoreDomainModule,
    PerformanceEvaluationContextModule,
    EvaluationCriteriaManagementContextModule,
    EvaluationPeriodManagementContextModule,
    RevisionRequestContextModule,
    StepApprovalContextModule,
    EvaluationActivityLogContextModule,
    NotificationModule,
  ],
  providers: [DownwardEvaluationBusinessService],
  exports: [DownwardEvaluationBusinessService],
})
export class DownwardEvaluationBusinessModule {}
