import { Module } from '@nestjs/common';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { DeliverableBusinessService } from './deliverable-business.service';

/**
 * 산출물 비즈니스 모듈
 * 
 * Business → Context → Domain 아키텍처를 따름
 * Domain 레이어에 직접 의존하지 않음
 */
@Module({
  imports: [
    PerformanceEvaluationContextModule,
    EvaluationActivityLogContextModule,
    EvaluationCriteriaManagementContextModule,
  ],
  providers: [DeliverableBusinessService],
  exports: [DeliverableBusinessService],
})
export class DeliverableBusinessModule {}
