import { Module } from '@nestjs/common';
import { BusinessModule } from '../../business/business.module';
import { AuditLogContextModule } from '../../context/audit-log-context/audit-log-context.module';
import { AuthContextModule } from '../../context/auth-context/auth-context.module';
import { DashboardContextModule } from '../../context/dashboard-context/dashboard-context.module';
import { DomainContextModule } from '../../context/domain-context.module';
import { EvaluationCriteriaManagementContextModule } from '../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationPeriodManagementContextModule } from '../../context/evaluation-period-management-context/evaluation-period-management-context.module';
import { EvaluationQuestionManagementContextModule } from '../../context/evaluation-question-management-context/evaluation-question-management-context.module';
import { OrganizationManagementContextModule } from '../../context/organization-management-context/organization-management-context.module';
import { PerformanceEvaluationContextModule } from '../../context/performance-evaluation-context/performance-evaluation-context.module';
import { RevisionRequestContextModule } from '../../context/revision-request-context/revision-request-context.module';
import { SeedDataContextModule } from '../../context/seed-data-context/seed-data-context.module';
import { StepApprovalContextModule } from '../../context/step-approval-context/step-approval-context.module';
import { EmployeeModule } from '../../domain/common/employee/employee.module';
import { NotificationModule } from '../../domain/common/notification';
import { ProjectModule } from '../../domain/common/project/project.module';
import { SystemSettingModule } from '../../domain/common/system-setting/system-setting.module';
import { EvaluationPeriodModule } from '../../domain/core/evaluation-period/evaluation-period.module';
import { EvaluatorAuthController } from './auth/evaluator-auth.controller';
import { EvaluatorProjectManagementController } from './project/evaluator-project-management.controller';
import { EvaluatorDashboardController } from './dashboard/evaluator-dashboard.controller';
import { EvaluatorEmployeeManagementController } from './employee-management/evaluator-employee-management.controller';
import { EvaluatorEvaluationActivityLogController } from './evaluation-activity-log/evaluator-evaluation-activity-log.controller';
import { EvaluatorEvaluationLineManagementController } from './evaluation-criteria/evaluator-evaluation-line-management.controller';
import { EvaluatorProjectAssignmentManagementController } from './evaluation-criteria/evaluator-project-assignment-management.controller';
import { EvaluatorWbsAssignmentManagementController } from './evaluation-criteria/evaluator-wbs-assignment-management.controller';
import { EvaluatorWbsEvaluationCriteriaManagementController } from './evaluation-criteria/evaluator-wbs-evaluation-criteria-management.controller';
import { EvaluatorEvaluationPeriodManagementController } from './evaluation-period/evaluator-evaluation-period-management.controller';
import { EvaluatorDeliverableManagementController } from './performance-evaluation/evaluator-deliverable-management.controller';
import { EvaluatorDownwardEvaluationManagementController } from './performance-evaluation/evaluator-downward-evaluation-management.controller';
import { EvaluatorPeerEvaluationManagementController } from './performance-evaluation/evaluator-peer-evaluation-management.controller';
import { EvaluatorWbsSelfEvaluationManagementController } from './performance-evaluation/evaluator-wbs-self-evaluation-management.controller';
import { EvaluatorRevisionRequestController } from './revision-request/evaluator-revision-request.controller';
import { NotificationController } from '../common/controllers/notification.controller';
import { EvaluatorAuditLogController } from './audit-log/evaluator-audit-log.controller';

/**
 * 평가자 인터페이스 모듈
 *
 * 평가자 권한이 필요한 API 엔드포인트들을 제공합니다.
 * 도메인 컨텍스트를 주입받아 비즈니스 로직을 처리합니다.
 */
@Module({
  imports: [
    DomainContextModule, // 도메인 컨텍스트 모듈 주입
    AuthContextModule, // 인증 컨텍스트 모듈 주입
    EvaluationPeriodManagementContextModule, // 평가 기간 관리 컨텍스트 모듈 주입
    EvaluationCriteriaManagementContextModule, // 평가기준 관리 컨텍스트 모듈 주입
    PerformanceEvaluationContextModule, // 성과평가 컨텍스트 모듈 주입
    OrganizationManagementContextModule, // 조직 관리 컨텍스트 모듈 주입
    DashboardContextModule, // 대시보드 컨텍스트 모듈 주입
    EvaluationQuestionManagementContextModule, // 평가 질문 관리 컨텍스트 모듈 주입
    SeedDataContextModule, // 시드 데이터 컨텍스트 모듈 주입
    StepApprovalContextModule, // 단계 승인 컨텍스트 모듈 주입
    RevisionRequestContextModule, // 재작성 요청 컨텍스트 모듈 주입
    AuditLogContextModule, // Audit 로그 컨텍스트 모듈 주입
    BusinessModule, // 비즈니스 레이어 모듈 주입
    EvaluationPeriodModule, // 평가 기간 모듈 주입
    EmployeeModule, // 직원 모듈 주입
    NotificationModule, // 알림 모듈 주입
    ProjectModule, // 프로젝트 모듈 주입
    SystemSettingModule, // 시스템 설정 모듈 주입
  ],
  controllers: [
    EvaluatorAuthController,
    EvaluatorDashboardController,
    EvaluatorEmployeeManagementController,
    EvaluatorEvaluationActivityLogController,
    EvaluatorEvaluationLineManagementController,
    EvaluatorProjectAssignmentManagementController,
    EvaluatorProjectManagementController,
    EvaluatorWbsAssignmentManagementController,
    EvaluatorWbsEvaluationCriteriaManagementController,
    EvaluatorEvaluationPeriodManagementController,
    EvaluatorDeliverableManagementController,
    EvaluatorDownwardEvaluationManagementController,
    EvaluatorPeerEvaluationManagementController,
    EvaluatorWbsSelfEvaluationManagementController,
    EvaluatorRevisionRequestController,
    EvaluatorAuditLogController,
    NotificationController,
  ],
  providers: [],
  exports: [],
})
export class EvaluatorInterfaceModule {}
