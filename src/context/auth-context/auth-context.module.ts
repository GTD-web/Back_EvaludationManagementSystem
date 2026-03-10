import { Module } from '@nestjs/common';
import { CommonDomainModule } from '@domain/common/common-domain.module';
import { AuthService } from './auth.service';
import {
  VerifyAndSyncUserHandler,
  GetUserWithRolesHandler,
  LoginHandler,
  RefreshTokenHandler,
} from './handlers';

/**
 * 인증 컨텍스트 모듈
 *
 * 인증 및 사용자 정보 동기화를 담당합니다.
 * JWT 토큰 검증 시 Employee 정보를 최신으로 유지합니다.
 */
@Module({
  imports: [CommonDomainModule],
  providers: [
    AuthService,
    VerifyAndSyncUserHandler,
    GetUserWithRolesHandler,
    LoginHandler,
    RefreshTokenHandler,
  ],
  exports: [AuthService],
})
export class AuthContextModule {}
