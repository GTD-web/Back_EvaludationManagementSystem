import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { CoreDomainModule } from '../../domain/core/core-domain.module';
import { CommonDomainModule } from '../../domain/common/common-domain.module';
import { SubDomainModule } from '../../domain/sub/sub-domain.module';
import { StepApprovalContextModule } from '../step-approval-context/step-approval-context.module';
import { EvaluationActivityLogContextModule } from '../evaluation-activity-log-context/evaluation-activity-log-context.module';

// 엔티티 imports
import { WbsSelfEvaluation } from '../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '../../domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '../../domain/core/peer-evaluation/peer-evaluation.entity';
import { PeerEvaluationQuestionMapping } from '../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.entity';
import { FinalEvaluation } from '../../domain/core/final-evaluation/final-evaluation.entity';
import { EvaluationPeriod } from '../../domain/core/evaluation-period/evaluation-period.entity';
import { Deliverable } from '../../domain/core/deliverable/deliverable.entity';
import { Employee } from '../../domain/common/employee/employee.entity';
import { Department } from '../../domain/common/department/department.entity';
import { WbsItem } from '../../domain/common/wbs-item/wbs-item.entity';
import { EvaluationQuestion } from '../../domain/sub/evaluation-question/evaluation-question.entity';
import { EvaluationLineMapping } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '../../domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationWbsAssignment } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriodEmployeeMapping } from '../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';

import { PerformanceEvaluationService } from './performance-evaluation.service';

// 핸들러 import
import { CommandHandlers } from './handlers/command-handlers';
import { QueryHandlers } from './handlers/query-handlers';

@Module({
  imports: [
    CqrsModule,
    DatabaseModule,
    CoreDomainModule,
    CommonDomainModule,
    SubDomainModule,
    StepApprovalContextModule,
    EvaluationActivityLogContextModule,
    TypeOrmModule.forFeature([
      WbsSelfEvaluation,
      DownwardEvaluation,
      PeerEvaluation,
      PeerEvaluationQuestionMapping,
      FinalEvaluation,
      EvaluationPeriod,
      Deliverable,
      Employee,
      Department,
      WbsItem,
      EvaluationQuestion,
      EvaluationLineMapping,
      EvaluationLine,
      EvaluationWbsAssignment,
      EvaluationPeriodEmployeeMapping,
    ]),
  ],
  providers: [
    PerformanceEvaluationService,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [PerformanceEvaluationService],
})
export class PerformanceEvaluationContextModule {}
