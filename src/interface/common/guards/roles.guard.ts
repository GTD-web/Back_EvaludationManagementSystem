import { OrganizationManagementService } from '@context/organization-management-context';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * RolesGuard 설정 옵션
 */
export interface RolesGuardOptions {
  /**
   * 접근 가능 여부 확인을 수행할 역할 목록
   * 이 목록에 포함된 역할이 필요한 경우에만 접근 가능 여부 확인을 수행합니다.
   * 기본값: [] (비활성화)
   *
   * @example
   * ```typescript
   * // admin 역할만 접근 가능 여부 확인
   * { rolesRequiringAccessibilityCheck: ['admin'] }
   *
   * // admin과 evaluator 역할에 대해 접근 가능 여부 확인
   * { rolesRequiringAccessibilityCheck: ['admin', 'evaluator'] }
   *
   * // 접근 가능 여부 확인 비활성화
   * { rolesRequiringAccessibilityCheck: [] }
   * ```
   */
  rolesRequiringAccessibilityCheck?: string[];
}

/**
 * RolesGuard 설정 옵션 토큰
 */
export const ROLES_GUARD_OPTIONS = 'ROLES_GUARD_OPTIONS';

/**
 * RBAC 역할 검증 가드
 *
 * @Roles() 데코레이터로 지정된 역할을 검증합니다.
 * EMS-PROD 시스템 역할 배열에 하나라도 매칭되면 통과합니다.
 *
 * 설정된 역할 목록에 포함된 역할의 경우, 추가로 시스템 접근 가능 여부를 확인합니다 (2중 보안).
 * 외부 SSO 시스템에서 역할과 접근 권한을 얻었더라도,
 * 이 시스템에서 별도로 접근 가능한 상태인지 확인합니다.
 *
 * 주의: JwtAuthGuard 이후에 실행되어야 합니다.
 *
 * @example
 * ```typescript
 * // 모듈에서 설정 - admin 역할만 접근 가능 여부 확인
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: RolesGuard,
 *     },
 *     {
 *       provide: ROLES_GUARD_OPTIONS,
 *       useValue: { rolesRequiringAccessibilityCheck: ['admin'] },
 *     },
 *   ],
 * })
 * ```
 *
 * @example
 * ```typescript
 * // 모듈에서 설정 - admin과 evaluator 역할에 대해 접근 가능 여부 확인
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: RolesGuard,
 *     },
 *     {
 *       provide: ROLES_GUARD_OPTIONS,
 *       useValue: { rolesRequiringAccessibilityCheck: ['admin', 'evaluator'] },
 *     },
 *   ],
 * })
 * ```
 *
 * @example
 * ```typescript
 * // 컨트롤러에서 사용
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin', 'user', 'evaluator')
 * @Get('users')
 * getUsers() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  private readonly rolesRequiringAccessibilityCheck: string[];

  constructor(
    private reflector: Reflector,
    private readonly organizationManagementService: OrganizationManagementService,
    @Optional()
    @Inject(ROLES_GUARD_OPTIONS)
    private readonly options?: RolesGuardOptions,
  ) {
    // 옵션이 제공되지 않으면 기본값 사용 (빈 배열 = 비활성화)
    this.rolesRequiringAccessibilityCheck =
      options?.rolesRequiringAccessibilityCheck ?? [];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있는지 확인
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Public() 데코레이터가 있으면 역할 검증을 건너뜀
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    // 사용자 정보가 없으면 (JwtAuthGuard를 거치지 않았으면) 에러
    if (!user) {
      this.logger.error(
        '사용자 정보가 없습니다. JwtAuthGuard가 먼저 실행되어야 합니다.',
      );
      throw new ForbiddenException('인증 정보가 없습니다.');
    }

    // 사용자의 역할 확인
    const userRoles = user.roles || [];

    // @Roles() 데코레이터로 지정된 필요한 역할 확인
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Roles() 데코레이터가 있으면 역할 검증 수행
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        this.logger.warn(
          `접근 거부: 사용자 ${user.email}은(는) 필요한 역할이 없습니다. ` +
            `필요 역할: [${requiredRoles.join(', ')}], ` +
            `보유 역할: [${userRoles.join(', ')}]`,
        );
        throw new ForbiddenException(
          `이 작업을 수행할 권한이 없습니다. 필요한 역할: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // 접근 가능 여부 확인이 필요한 역할인지 확인 (admin에 대한 2중 보안)
    const needsAccessibilityCheck =
      this.rolesRequiringAccessibilityCheck.some((role) =>
        userRoles.includes(role),
      );

    if (needsAccessibilityCheck) {
      // 사번으로 관리자 권한 확인
      const isAccessible =
        await this.organizationManagementService.사번으로_관리자권한있는가(
          user.employeeNumber,
        );

      if (!isAccessible) {
        this.logger.warn(
          `접근 거부: 사용자 ${user.email}(${user.employeeNumber})은(는) ` +
            `역할을 가지고 있지만 관리자 권한이 없습니다. ` +
            `역할: [${userRoles.join(', ')}]`,
        );
        throw new ForbiddenException(
          'EMS 관리자 권한이 없습니다. EMS 관리자에게 문의하세요.',
        );
      }
    }

    return true;
  }
}
