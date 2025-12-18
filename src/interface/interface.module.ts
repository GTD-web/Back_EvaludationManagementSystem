import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AdminInterfaceModule } from './admin/admin-interface.module';
import { CommonDomainModule } from '@domain/common/common-domain.module';
import { AuthContextModule } from '@context/auth-context';
import { AuditLogContextModule } from '@context/audit-log-context/audit-log-context.module';
import { OrganizationManagementContextModule } from '@context/organization-management-context';
import { DomainContextModule } from '@context/domain-context.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard, ROLES_GUARD_OPTIONS } from './common/guards';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { UserInterfaceModule } from './user/user-interface.module';
import { EvaluatorInterfaceModule } from './evaluator/evaluator-interface.module';
import { PublicInterfaceModule } from './public/public-interface.module';

/**
 * 인터페이스 모듈
 *
 * 모든 API 인터페이스 모듈들을 통합 관리합니다.
 * - 관리자 인터페이스
 * - 사용자 인터페이스
 * - 평가자 인터페이스
 * - Public 인터페이스 (인증 불필요)
 *
 * JWT 인증 가드와 Audit 로그 인터셉터를 전역으로 적용합니다.
 */
@Module({
  imports: [
    CommonDomainModule, // SSO 서비스 및 알림 서비스 사용을 위한 도메인 모듈
    AuthContextModule, // Auth Context 모듈 (JWT 인증 가드에서 사용)
    AuditLogContextModule, // Audit 로그 컨텍스트 모듈
    OrganizationManagementContextModule, // 조직 관리 컨텍스트 모듈 (RolesGuard에서 사용)
    DomainContextModule, // 도메인 컨텍스트 모듈
    AdminInterfaceModule, // 관리자 인터페이스 모듈
    UserInterfaceModule, // 사용자 인터페이스 모듈
    EvaluatorInterfaceModule, // 평가자 인터페이스 모듈
    PublicInterfaceModule, // Public 인터페이스 모듈 (크론 작업 등)
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // JWT 인증 가드를 전역으로 적용
    },
    {
      provide: ROLES_GUARD_OPTIONS,
      useValue: {
        // admin 역할만 isAccessible 체크 수행
        // evaluator, user 역할은 isAccessible 체크 하지 않음
        rolesRequiringAccessibilityCheck: ['admin'],
      },
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 역할 기반 접근 제어 가드를 전역으로 적용
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor, // Audit 로그 인터셉터를 전역으로 적용
    },
  ],
  exports: [],
})
export class InterfaceModule {}
