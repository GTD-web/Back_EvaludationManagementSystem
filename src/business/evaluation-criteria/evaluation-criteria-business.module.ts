import { Module } from '@nestjs/common';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { RevisionRequestContextModule } from '@context/revision-request-context/revision-request-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { StepApprovalContextModule } from '@context/step-approval-context/step-approval-context.module';
import { EvaluationCriteriaBusinessService } from './evaluation-criteria-business.service';

/**
 * 평가기준 비즈니스 모듈
 *
 * 평가기준 관련 비즈니스 로직을 제공합니다.
 */
@Module({
  imports: [
    EvaluationCriteriaManagementContextModule,
    RevisionRequestContextModule,
    EvaluationActivityLogContextModule,
    StepApprovalContextModule,
  ],
  providers: [EvaluationCriteriaBusinessService],
  exports: [EvaluationCriteriaBusinessService],
})
export class EvaluationCriteriaBusinessModule {}
