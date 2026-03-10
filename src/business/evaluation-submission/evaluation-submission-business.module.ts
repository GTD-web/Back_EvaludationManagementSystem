import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluationSubmissionBusinessService } from './evaluation-submission-business.service';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';

/**
 * 평가 제출 여부 변경 비즈니스 모듈
 *
 * 평가 제출 여부 변경 관련 비즈니스 로직을 제공합니다.
 * CQRS 패턴을 사용하여 CommandBus와 QueryBus를 통해 Context 레이어와 통신합니다.
 */
@Module({
  imports: [
    CqrsModule,
    PerformanceEvaluationContextModule,
    EvaluationCriteriaManagementContextModule,
  ],
  providers: [EvaluationSubmissionBusinessService],
  exports: [EvaluationSubmissionBusinessService],
})
export class EvaluationSubmissionBusinessModule {}
