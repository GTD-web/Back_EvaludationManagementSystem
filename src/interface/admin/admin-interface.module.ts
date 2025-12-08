import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainContextModule } from '../../context/domain-context.module';
import { BusinessModule } from '../../business/business.module';
import { AuthContextModule } from '../../context/auth-context/auth-context.module';
import { EvaluationPeriodManagementContextModule } from '../../context/evaluation-period-management-context/evaluation-period-management-context.module';
import { EvaluationCriteriaManagementContextModule } from '../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { PerformanceEvaluationContextModule } from '../../context/performance-evaluation-context/performance-evaluation-context.module';
import { OrganizationManagementContextModule } from '../../context/organization-management-context/organization-management-context.module';
import { DashboardContextModule } from '../../context/dashboard-context/dashboard-context.module';
import { EvaluationQuestionManagementContextModule } from '../../context/evaluation-question-management-context/evaluation-question-management-context.module';
import { SeedDataContextModule } from '../../context/seed-data-context/seed-data-context.module';
import { EvaluationPeriodModule } from '../../domain/core/evaluation-period/evaluation-period.module';
import { EmployeeModule } from '../../domain/common/employee/employee.module';
import { NotificationModule } from '../../domain/common/notification';
import { DepartmentModule } from '../../domain/common/department/department.module';
import { ProjectModule } from '../../domain/common/project/project.module';
import { SystemSettingModule } from '../../domain/common/system-setting/system-setting.module';
import { WbsEvaluationCriteriaModule } from '../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.module';
import { EvaluationLineModule } from '../../domain/core/evaluation-line/evaluation-line.module';
import { EvaluationLineMappingModule } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { Employee } from '../../domain/common/employee/employee.entity';
import { AuthController } from './auth/auth.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { EvaluationPeriodManagementController } from './evaluation-period/evaluation-period-management.controller';
import { EvaluationTargetController } from './evaluation-period/evaluation-target.controller';
import { ProjectAssignmentManagementController } from './evaluation-criteria/project-assignment-management.controller';
import { WbsAssignmentManagementController } from './evaluation-criteria/wbs-assignment-management.controller';
import { EvaluationLineManagementController } from './evaluation-criteria/evaluation-line-management.controller';
import { WbsEvaluationCriteriaManagementController } from './evaluation-criteria/wbs-evaluation-criteria-management.controller';
import { WbsSelfEvaluationManagementController } from './performance-evaluation/wbs-self-evaluation-management.controller';
import { DownwardEvaluationManagementController } from './performance-evaluation/downward-evaluation-management.controller';
import { PeerEvaluationManagementController } from './performance-evaluation/peer-evaluation-management.controller';
import { FinalEvaluationManagementController } from './performance-evaluation/final-evaluation-management.controller';
import { EvaluationQuestionManagementController } from './performance-evaluation/evaluation-question-management.controller';
import { DeliverableManagementController } from './performance-evaluation/deliverable-management.controller';
import { EmployeeManagementController } from './employee-management/employee-management.controller';
import { SeedDataController } from './seed-data/seed-data.controller';
import { StepApprovalController } from './step-approval/step-approval.controller';
import { RevisionRequestController } from './revision-request/revision-request.controller';
import { StepApprovalContextModule } from '../../context/step-approval-context/step-approval-context.module';
import { RevisionRequestContextModule } from '../../context/revision-request-context/revision-request-context.module';
import { AuditLogContextModule } from '../../context/audit-log-context/audit-log-context.module';
import { AuditLogController } from './audit-log/audit-log.controller';
import { EvaluationActivityLogController } from './evaluation-activity-log/evaluation-activity-log.controller';
import { ProjectManagementController } from './project/project-management.controller';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard, ROLES_GUARD_OPTIONS } from '../common/guards';
import { NotificationController } from '../common/controllers/notification.controller';

/**
 * 관리자 인터페이스 모듈
 *
 * 관리자 권한이 필요한 API 엔드포인트들을 제공합니다.
 * 도메인 컨텍스트를 주입받아 비즈니스 로직을 처리합니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Employee]), // 엔티티 주입
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
    DepartmentModule, // 부서 모듈 주입
    ProjectModule, // 프로젝트 모듈 주입
    SystemSettingModule, // 시스템 설정 모듈 주입
    WbsEvaluationCriteriaModule, // WBS 평가 기준 모듈 주입
    EvaluationLineModule, // 평가 라인 모듈 주입
    EvaluationLineMappingModule, // 평가 라인 맵핑 모듈 주입
  ],
  controllers: [
    AuthController, // 인증 컨트롤러
    DashboardController, // 대시보드 컨트롤러
    EvaluationPeriodManagementController, // 평가 기간 관리 컨트롤러
    EvaluationTargetController, // 평가 대상 관리 컨트롤러
    EmployeeManagementController, // 직원 관리 컨트롤러
    ProjectManagementController, // 프로젝트 관리 컨트롤러
    ProjectAssignmentManagementController, // 프로젝트 할당 관리 컨트롤러
    WbsAssignmentManagementController, // WBS 할당 관리 컨트롤러
    EvaluationLineManagementController, // 평가라인 관리 컨트롤러
    WbsEvaluationCriteriaManagementController, // WBS 평가기준 관리 컨트롤러
    WbsSelfEvaluationManagementController, // WBS 자기평가 관리 컨트롤러
    DownwardEvaluationManagementController, // 하향평가 관리 컨트롤러
    PeerEvaluationManagementController, // 동료평가 관리 컨트롤러
    FinalEvaluationManagementController, // 최종평가 관리 컨트롤러
    EvaluationQuestionManagementController, // 평가 질문 관리 컨트롤러
    DeliverableManagementController, // 산출물 관리 컨트롤러
    SeedDataController, // 시드 데이터 컨트롤러
    StepApprovalController, // 단계 승인 컨트롤러
    RevisionRequestController, // 재작성 요청 컨트롤러
    AuditLogController, // Audit 로그 컨트롤러
    EvaluationActivityLogController, // 평가 활동 내역 컨트롤러
    NotificationController, // 알림 컨트롤러
  ],
  providers: [
    {
      provide: ROLES_GUARD_OPTIONS,
      useValue: {
        // admin 역할에 대해서만 접근 가능 여부 확인 수행
        // user, evaluator 역할은 접근 가능 여부 확인 없이 허용
        rolesRequiringAccessibilityCheck: ['admin'],
      },
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [],
})
export class AdminInterfaceModule {}
