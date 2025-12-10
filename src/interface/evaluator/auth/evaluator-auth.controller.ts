import { Body, Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '@context/auth-context/auth.service';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import {
  LoginResponseDto,
  UserInfoDto,
} from '@interface/common/dto/auth/login-response.dto';
import { LoginDto } from '@interface/common/dto/auth/login.dto';
import {
  GetMeAsEvaluator,
  Login,
} from '@interface/common/decorators/auth/auth.decorators';

/**
 * 인증 컨트롤러
 *
 * 로그인, 토큰 갱신 등 인증 관련 API를 제공합니다.
 */
@ApiTags('A-0-0. 인증')
@Controller('evaluator/auth')
export class EvaluatorAuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 이메일/패스워드로 로그인
   */
  @Login()
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.authService.로그인한다(
      loginDto.email,
      loginDto.password,
    );

    return {
      user: {
        id: result.user.id,
        externalId: result.user.externalId,
        email: result.user.email,
        name: result.user.name,
        employeeNumber: result.user.employeeNumber,
        roles: result.user.roles,
        status: result.user.status,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  /**
   * 현재 로그인한 평가자 정보 조회
   */
  @GetMeAsEvaluator()
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserInfoDto> {
    // JWT 가드를 통해 검증된 사용자 정보 반환
    // AuthenticatedUser는 기본 필드만 포함하므로,
    // 필요한 경우 DB에서 추가 정보 조회 가능
    const userInfo = await this.authService.역할포함사용자조회(
      user.employeeNumber,
    );

    if (!userInfo.user) {
      // 이미 JWT 인증을 통과했으므로 여기 도달할 가능성은 낮음
      // 하지만 방어적으로 처리
      return {
        id: user.id,
        externalId: '', // JWT에는 없는 정보
        email: user.email,
        name: user.name,
        employeeNumber: user.employeeNumber,
        roles: user.roles,
        status: '', // JWT에는 없는 정보
      };
    }

    return {
      id: userInfo.user.id,
      externalId: userInfo.user.externalId,
      email: userInfo.user.email,
      name: userInfo.user.name,
      employeeNumber: userInfo.user.employeeNumber,
      roles: userInfo.user.roles,
      status: userInfo.user.status,
    };
  }
}
