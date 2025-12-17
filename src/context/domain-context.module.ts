import { Module } from '@nestjs/common';
import { AuthContextModule } from './auth-context/auth-context.module';
import { EvaluationPeriodManagementContextModule } from './evaluation-period-management-context/evaluation-period-management-context.module';
import { OrganizationManagementContextModule } from './organization-management-context/organization-management-context.module';
import { EvaluationCriteriaManagementContextModule } from './evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { PerformanceEvaluationContextModule } from './performance-evaluation-context/performance-evaluation-context.module';
import { TestContextModule } from './test-context/test-context.module';
import { DashboardContextModule } from './dashboard-context/dashboard-context.module';
import { EvaluationQuestionManagementContextModule } from './evaluation-question-management-context/evaluation-question-management-context.module';
import { SeedDataContextModule } from './seed-data-context/seed-data-context.module';
import { StepApprovalContextModule } from './step-approval-context/step-approval-context.module';
import { RevisionRequestContextModule } from './revision-request-context/revision-request-context.module';
import { AuditLogContextModule } from './audit-log-context/audit-log-context.module';
import { EvaluationActivityLogContextModule } from './evaluation-activity-log-context/evaluation-activity-log-context.module';
import { ProjectModule } from '../domain/common/project/project.module';

@Module({
  imports: [
    AuthContextModule,
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
    EvaluationCriteriaManagementContextModule,
    PerformanceEvaluationContextModule,
    TestContextModule,
    DashboardContextModule,
    EvaluationQuestionManagementContextModule,
    SeedDataContextModule,
    StepApprovalContextModule,
    RevisionRequestContextModule,
    AuditLogContextModule,
    EvaluationActivityLogContextModule,
    ProjectModule, // 프로젝트 모듈 추가
  ],
  providers: [],
  exports: [
    AuthContextModule,
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
    EvaluationCriteriaManagementContextModule,
    PerformanceEvaluationContextModule,
    TestContextModule,
    DashboardContextModule,
    EvaluationQuestionManagementContextModule,
    SeedDataContextModule,
    StepApprovalContextModule,
    RevisionRequestContextModule,
    AuditLogContextModule,
    EvaluationActivityLogContextModule,
    ProjectModule, // 프로젝트 모듈 export
  ],
})
export class DomainContextModule {}
