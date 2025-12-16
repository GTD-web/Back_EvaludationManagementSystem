import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { SSOService } from '@domain/common/sso';
import type { ISSOService } from '@domain/common/sso/interfaces';
import { EmployeeService } from '@domain/common/employee/employee.service';
import {
  LoginCommand,
  LoginResult,
  AuthenticatedUserInfo,
} from '../interfaces/auth-context.interface';

/**
 * 로그인 핸들러
 *
 * 1. SSO 서버에 로그인 (이메일, 패스워드)
 * 2. Employee 존재 여부 확인 (없으면 로그인 거부)
 * 3. 사용자 정보 및 토큰 반환
 */
@Injectable()
export class LoginHandler {
  private readonly logger = new Logger(LoginHandler.name);

  constructor(
    @Inject(SSOService) private readonly ssoService: ISSOService,
    private readonly employeeService: EmployeeService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const { email, password } = command;
    this.logger.log(`로그인 시도: ${email}`);
    // 1. SSO 로그인 (권한 검증 없이 인증만 수행)
    let loginResult;
    try {
      loginResult = await this.ssoService.로그인한다(email, password);
      this.logger.log(`로그인 성공: ${email}`);
    } catch (error) {
      // 외부 서버에서 던진 에러 메시지 추출
      const errorMessage =
        error?.message ||
        error?.details ||
        '로그인 처리 중 오류가 발생했습니다.';
      const errorCode = error?.code;
      const errorStatus = error?.status;

      // SSO SDK 에러를 적절한 HTTP 예외로 변환
      if (errorCode) {
        switch (errorCode) {
          case 'NOT_FOUND':
          case 'AUTHENTICATION_FAILED':
          case 'INVALID_CREDENTIALS':
          case 'AUTHENTICATION_ERROR':
            // 외부 서버에서 온 에러 메시지를 사용하거나 기본 메시지 사용
            const authErrorMessage =
              errorMessage &&
              errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
                ? errorMessage
                : '이메일 또는 패스워드가 올바르지 않습니다.';
            this.logger.warn(`로그인 실패: ${email} - ${authErrorMessage}`);
            throw new UnauthorizedException(authErrorMessage);

          default:
            this.logger.error(
              `예상치 못한 SSO 에러: ${errorCode} (status: ${errorStatus})`,
              error,
            );
            throw new InternalServerErrorException(
              errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
                ? errorMessage
                : '로그인 처리 중 오류가 발생했습니다.',
            );
        }
      }

      // status 코드가 있는 경우 (외부 서버에서 직접 던진 에러)
      if (errorStatus) {
        if (errorStatus === 401) {
          const authErrorMessage =
            errorMessage &&
            errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
              ? errorMessage
              : '이메일 또는 패스워드가 올바르지 않습니다.';
          this.logger.warn(`로그인 실패: ${email} - ${authErrorMessage}`);
          throw new UnauthorizedException(authErrorMessage);
        }
        // 403 에러 처리 제거: 권한과 관계없이 로그인 허용
      }

      // 기타 예외
      this.logger.error('알 수 없는 SSO 에러:', error);
      throw new InternalServerErrorException(
        errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
          ? errorMessage
          : '로그인 처리 중 오류가 발생했습니다.',
      );
    }

    this.logger.log(
      `로그인 성공: ${loginResult.email} (${loginResult.employeeNumber})`,
    );

    // 2. Employee 조회 (없어도 로그인 허용)
    const employee = await this.employeeService.findByEmployeeNumber(
      loginResult.employeeNumber,
    );

    // Employee가 없으면 경고 로그만 남기고 로그인 허용
    if (!employee) {
      this.logger.warn(
        `시스템에 등록되지 않은 직원의 로그인: ${loginResult.employeeNumber} (${loginResult.email}) - 로그인은 허용하지만 SSO 정보만 사용`,
      );

      // SSO에서 받은 정보로 사용자 정보 생성
      const roles: string[] = loginResult.systemRoles?.['EMS-PROD'] || [];

      const userInfo: AuthenticatedUserInfo = {
        id: '', // Employee가 없으므로 빈 문자열
        externalId: loginResult.id || '',
        email: loginResult.email,
        name: loginResult.name,
        employeeNumber: loginResult.employeeNumber,
        roles: roles,
        status: 'ACTIVE', // 기본값
      };

      return {
        user: userInfo,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
      };
    }

    // 3. 역할 정보 추출 (systemRoles['EMS-PROD'])
    const roles: string[] = loginResult.systemRoles?.['EMS-PROD'] || [];
    this.logger.log(
      `로그인 결과의 systemRoles: ${JSON.stringify(loginResult.systemRoles)}`,
    );
    this.logger.log(`추출된 EMS-PROD roles: [${roles.join(', ')}]`);

    // 3-1. isAccessible 체크 제거: 권한과 관계없이 로그인 허용
    // if (roles.includes('admin') && !employee.isAccessible) {
    //   this.logger.warn(
    //     `접근 권한이 없는 관리자의 로그인 시도: ${employee.employeeNumber} (${employee.email})`,
    //   );
    //   throw new ForbiddenException(
    //     '시스템 접근 권한이 없습니다. 관리자에게 문의하세요.',
    //   );
    // }

    // 4. Employee의 roles 업데이트
    try {
      await this.employeeService.updateRoles(employee.id, roles);
      this.logger.log(
        `직원 ${employee.employeeNumber}의 역할 정보를 업데이트했습니다.`,
      );
    } catch (error) {
      // roles 업데이트 실패는 로그인을 막지 않음 (로그만 기록)
      this.logger.error(
        `직원 ${employee.employeeNumber}의 역할 업데이트 실패:`,
        error.message,
      );
    }

    // 5. 결과 반환 (업데이트된 역할 정보 포함)
    const userInfo: AuthenticatedUserInfo = {
      id: employee.id,
      externalId: employee.externalId,
      email: employee.email,
      name: employee.name,
      employeeNumber: employee.employeeNumber,
      roles: roles, // 로그인 시 받은 최신 roles 사용
      status: employee.status,
    };

    return {
      user: userInfo,
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
    };
  }
}
