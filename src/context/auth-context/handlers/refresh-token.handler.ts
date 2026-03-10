import { Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { SSOService } from '@domain/common/sso';
import type { ISSOService } from '@domain/common/sso/interfaces';
import {
  RefreshTokenCommand,
  LoginResult,
  AuthenticatedUserInfo,
} from '../interfaces/auth-context.interface';
import { VerifyAndSyncUserHandler } from './verify-and-sync-user.handler';

/**
 * 토큰 갱신 핸들러
 *
 * 1. SSO 서버에 refresh token으로 토큰 갱신 (grant_type: refresh_token)
 * 2. 새 access token으로 사용자 정보 조회
 * 3. 사용자 정보 및 새 토큰 반환 (슬라이딩: 새 refresh token 포함)
 */
@Injectable()
export class RefreshTokenHandler {
  private readonly logger = new Logger(RefreshTokenHandler.name);

  constructor(
    @Inject(SSOService) private readonly ssoService: ISSOService,
    private readonly verifyAndSyncUserHandler: VerifyAndSyncUserHandler,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<LoginResult> {
    const { refreshToken } = command;

    try {
      // 1. SSO 토큰 갱신 (슬라이딩: 새 accessToken, refreshToken 반환)
      const refreshResult = await this.ssoService.토큰을갱신한다(refreshToken);
      this.logger.log('토큰 갱신 성공');

      // 2. 새 access token으로 사용자 정보 조회
      const verifyResult = await this.verifyAndSyncUserHandler.execute({
        accessToken: refreshResult.accessToken,
      });

      const userInfo: AuthenticatedUserInfo = {
        id: verifyResult.user.id,
        externalId: verifyResult.user.externalId,
        email: verifyResult.user.email,
        name: verifyResult.user.name,
        employeeNumber: verifyResult.user.employeeNumber,
        roles: verifyResult.user.roles,
        status: verifyResult.user.status,
      };

      return {
        user: userInfo,
        accessToken: refreshResult.accessToken,
        refreshToken: refreshResult.refreshToken,
      };
    } catch (error) {
      this.logger.error('토큰 갱신 실패:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('토큰 갱신에 실패했습니다. 재로그인이 필요합니다.');
    }
  }
}
