import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { EvaluationPeriod } from '../../domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { Employee } from '../../domain/common/employee/employee.entity';
import { Department } from '../../domain/common/department/department.entity';
import { Project } from '../../domain/common/project/project.entity';
import { WbsItem } from '../../domain/common/wbs-item/wbs-item.entity';
import { EvaluationProjectAssignment } from '../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '../../domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { WbsSelfEvaluation } from '../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '../../domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '../../domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '../../domain/core/final-evaluation/final-evaluation.entity';
import { Deliverable } from '../../domain/core/deliverable/deliverable.entity';
import { EvaluationRevisionRequest } from '../../domain/sub/evaluation-revision-request/evaluation-revision-request.entity';
import { EvaluationRevisionRequestRecipient } from '../../domain/sub/evaluation-revision-request/evaluation-revision-request-recipient.entity';
import { SecondaryEvaluationStepApproval } from '../../domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.entity';
import { EvaluationActivityLog } from '../../domain/core/evaluation-activity-log/evaluation-activity-log.entity';
import { QUERY_HANDLERS } from './handlers/queries';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { SecondaryEvaluationStepApprovalModule } from '@domain/sub/secondary-evaluation-step-approval';
import { EvaluationActivityLogContextModule } from '../evaluation-activity-log-context/evaluation-activity-log-context.module';

/**
 * 대시보드 컨텍스트 모듈
 *
 * CQRS 패턴을 사용하여 평가 관련 대시보드 정보 조회 기능을 제공합니다.
 * 평가 기간 요약, 부서별 진행 현황, 개인 대시보드 등의 정보를 제공합니다.
 */
@Module({
  imports: [
    CqrsModule,
    EmployeeEvaluationStepApprovalModule,
    SecondaryEvaluationStepApprovalModule,
    EvaluationActivityLogContextModule,
    TypeOrmModule.forFeature([
      EvaluationPeriod,
      EvaluationPeriodEmployeeMapping,
      Employee,
      Department,
      Project,
      WbsItem,
      EvaluationProjectAssignment,
      EvaluationWbsAssignment,
      WbsEvaluationCriteria,
      EvaluationLine,
      EvaluationLineMapping,
      WbsSelfEvaluation,
      DownwardEvaluation,
      PeerEvaluation,
      FinalEvaluation,
      Deliverable,
      EvaluationRevisionRequest,
      EvaluationRevisionRequestRecipient,
      SecondaryEvaluationStepApproval,
      EvaluationActivityLog,
    ]),
  ],
  providers: [DashboardService, ...QUERY_HANDLERS],
  exports: [DashboardService],
})
export class DashboardContextModule {}
