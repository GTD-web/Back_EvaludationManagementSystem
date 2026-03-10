import { Module } from '@nestjs/common';
import { PeerEvaluationBusinessModule } from './peer-evaluation/peer-evaluation-business.module';
import { WbsAssignmentBusinessModule } from './wbs-assignment/wbs-assignment-business.module';
import { EvaluationPeriodBusinessModule } from './evaluation-period/evaluation-period-business.module';
import { EvaluationTargetBusinessModule } from './evaluation-target/evaluation-target-business.module';
import { DownwardEvaluationBusinessModule } from './downward-evaluation/downward-evaluation-business.module';
import { WbsSelfEvaluationBusinessModule } from './wbs-self-evaluation/wbs-self-evaluation-business.module';
import { StepApprovalBusinessModule } from './step-approval/step-approval-business.module';
import { DeliverableBusinessModule } from './deliverable/deliverable-business.module';
import { RevisionRequestBusinessModule } from './revision-request/revision-request-business.module';
import { EvaluationCriteriaBusinessModule } from './evaluation-criteria/evaluation-criteria-business.module';
import { ProjectAssignmentBusinessModule } from './project-assignment/project-assignment-business.module';
import { EvaluationLineBusinessModule } from './evaluation-line/evaluation-line-business.module';
import { FinalEvaluationBusinessModule } from './final-evaluation/final-evaluation-business.module';
import { EvaluationSubmissionBusinessModule } from './evaluation-submission/evaluation-submission-business.module';

/**
 * 비즈니스 레이어 통합 모듈
 *
 * 비즈니스 로직 오케스트레이션을 담당하는 모든 비즈니스 모듈을 통합합니다.
 */
@Module({
  imports: [
    PeerEvaluationBusinessModule,
    WbsAssignmentBusinessModule,
    DownwardEvaluationBusinessModule,
    EvaluationPeriodBusinessModule,
    EvaluationTargetBusinessModule,
    WbsSelfEvaluationBusinessModule,
    StepApprovalBusinessModule,
    DeliverableBusinessModule,
    RevisionRequestBusinessModule,
    EvaluationCriteriaBusinessModule,
    ProjectAssignmentBusinessModule,
    EvaluationLineBusinessModule,
    FinalEvaluationBusinessModule,
    EvaluationSubmissionBusinessModule,
  ],
  exports: [
    PeerEvaluationBusinessModule,
    WbsAssignmentBusinessModule,
    DownwardEvaluationBusinessModule,
    EvaluationPeriodBusinessModule,
    EvaluationTargetBusinessModule,
    WbsSelfEvaluationBusinessModule,
    StepApprovalBusinessModule,
    DeliverableBusinessModule,
    RevisionRequestBusinessModule,
    EvaluationCriteriaBusinessModule,
    ProjectAssignmentBusinessModule,
    EvaluationLineBusinessModule,
    FinalEvaluationBusinessModule,
    EvaluationSubmissionBusinessModule,
  ],
})
export class BusinessModule {}
