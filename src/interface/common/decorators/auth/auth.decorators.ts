import {
  applyDecorators,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public, Roles } from '@interface/common/decorators';
import { LoginDto } from '@interface/common/dto/auth/login.dto';
import { LoginResponseDto } from '@interface/common/dto/auth/login-response.dto';
import { UserInfoDto } from '@interface/common/dto/auth/login-response.dto';

/**
 * 로그인 API 데코레이터
 */
export function Login() {
  return applyDecorators(
    Public(), // JWT 인증 우회
    Post('login'),
    HttpCode(HttpStatus.OK), // 로그인은 200 OK 반환
    ApiOperation({
      summary: '이메일/패스워드로 로그인',
      description: `이메일과 패스워드로 SSO 서버에 로그인합니다.

**동작:**
- SSO 서버에 로그인 요청
- EMS-PROD 시스템 역할 자동 검증
- Employee 정보 동기화 (생성/업데이트)
- 역할 정보 저장
- 사용자 정보 및 JWT 토큰 반환

**테스트 케이스:**
- 정상 로그인: 유효한 이메일과 패스워드로 로그인 성공
- 사용자 정보 반환: id, email, name, employeeNumber, roles, status 포함
- 토큰 반환: accessToken, refreshToken 포함
- 역할 검증: EMS-PROD 시스템 역할이 있어야 로그인 가능
- 잘못된 이메일 형식: 400 에러
- 필수 필드 누락: email 또는 password 누락 시 400 에러
- 잘못된 인증 정보: 이메일 또는 패스워드 불일치 시 401 에러 (SSO 서버에서 검증)
- 권한 없음: EMS-PROD 시스템 역할이 없는 경우 403 에러
- admin 역할 접근 제한: admin 역할이 있는 사용자가 isAccessible이 false인 경우 403 에러`,
    }),
    ApiBody({
      type: LoginDto,
      description: '로그인 정보',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '로그인 성공',
      type: LoginResponseDto,
    }),
    ApiBadRequestResponse({
      description: '잘못된 요청 (유효성 검증 실패)',
      schema: {
        example: {
          message: ['이메일은 필수입니다.'],
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: '인증 실패 (이메일 또는 패스워드 불일치)',
      schema: {
        example: {
          message: '이메일 또는 패스워드가 올바르지 않습니다.',
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    }),
    ApiForbiddenResponse({
      description:
        '권한 없음 (EMS-PROD 시스템 역할 없음 또는 admin 역할이 있으나 isAccessible이 false)',
      schema: {
        examples: {
          noSystemRole: {
            summary: 'EMS-PROD 시스템 역할 없음',
            value: {
              message: '이 시스템에 대한 접근 권한이 없습니다.',
              error: 'Forbidden',
              statusCode: 403,
            },
          },
          notAccessible: {
            summary: 'admin 역할이지만 시스템 접근 불가',
            value: {
              message: '시스템 접근 권한이 없습니다. 관리자에게 문의하세요.',
              error: 'Forbidden',
              statusCode: 403,
            },
          },
        },
      },
    }),
  );
}

/**
 * 현재 로그인한 사용자 정보 조회 API 데코레이터
 * @deprecated 역할별 데코레이터 (GetMeAsAdmin, GetMeAsEvaluator, GetMeAsUser)를 사용하세요.
 */
export function GetMe() {
  return applyDecorators(
    ApiBearerAuth('Bearer'),
    Get('me'),
    ApiOperation({
      summary: '현재 로그인한 사용자 정보 조회',
      description: `JWT 토큰으로 인증된 현재 사용자의 정보를 조회합니다.

**동작:**
- JWT 토큰에서 사용자 정보 추출
- 직원 기본 정보 반환 (id, email, name, employeeNumber, roles, status)
- 인증 헤더에 유효한 JWT 토큰이 필요합니다

**테스트 케이스:**
- 정상 조회: 유효한 JWT 토큰으로 사용자 정보 조회 성공 (200)
- 사용자 정보 포함: id, externalId, email, name, employeeNumber, roles, status 필드 반환
- 사번 포함: employeeNumber 필드가 응답에 포함됨
- 역할 정보 포함: EMS-PROD 시스템 역할 배열이 포함됨
- 토큰 없음: Authorization 헤더 없이 요청 시 401 에러
- 잘못된 토큰: 유효하지 않은 JWT 토큰으로 요청 시 401 에러
- 만료된 토큰: 만료된 JWT 토큰으로 요청 시 401 에러`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '사용자 정보 조회 성공',
      type: UserInfoDto,
    }),
    ApiUnauthorizedResponse({
      description: '인증 실패 (토큰 없음, 잘못된 토큰, 만료된 토큰)',
      schema: {
        example: {
          message: '인증이 필요합니다.',
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    }),
  );
}

/**
 * 관리자용 현재 로그인한 사용자 정보 조회 API 데코레이터
 *
 * admin 역할이 필요합니다.
 */
export function GetMeAsAdmin() {
  return applyDecorators(
    Roles('admin'), // admin 역할 필수
    ApiBearerAuth('Bearer'),
    Get('me'),
    ApiOperation({
      summary: '현재 로그인한 관리자 정보 조회',
      description: `JWT 토큰으로 인증된 현재 관리자의 정보를 조회합니다.

**권한:**
- admin 역할이 필요합니다

**동작:**
- JWT 토큰에서 사용자 정보 추출
- admin 역할 검증
- 직원 기본 정보 반환 (id, email, name, employeeNumber, roles, status)

**테스트 케이스:**
- 정상 조회: admin 역할을 가진 사용자의 정보 조회 성공 (200)
- 사용자 정보 포함: id, externalId, email, name, employeeNumber, roles, status 필드 반환
- 토큰 없음: Authorization 헤더 없이 요청 시 401 에러
- 잘못된 토큰: 유효하지 않은 JWT 토큰으로 요청 시 401 에러
- admin 역할 없음: admin 역할이 없는 사용자가 요청 시 403 에러`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '관리자 정보 조회 성공',
      type: UserInfoDto,
    }),
    ApiUnauthorizedResponse({
      description: '인증 실패 (토큰 없음, 잘못된 토큰, 만료된 토큰)',
      schema: {
        example: {
          message: '인증이 필요합니다.',
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    }),
    ApiForbiddenResponse({
      description: '권한 없음 (admin 역할 없음)',
      schema: {
        example: {
          message: '이 작업을 수행할 권한이 없습니다. 필요한 역할: admin',
          error: 'Forbidden',
          statusCode: 403,
        },
      },
    }),
  );
}

/**
 * 평가자용 현재 로그인한 사용자 정보 조회 API 데코레이터
 *
 * evaluator 역할이 필요합니다.
 */
export function GetMeAsEvaluator() {
  return applyDecorators(
    Roles('evaluator'), // evaluator 역할 필수
    ApiBearerAuth('Bearer'),
    Get('me'),
    ApiOperation({
      summary: '현재 로그인한 평가자 정보 조회',
      description: `JWT 토큰으로 인증된 현재 평가자의 정보를 조회합니다.

**권한:**
- evaluator 역할이 필요합니다

**동작:**
- JWT 토큰에서 사용자 정보 추출
- evaluator 역할 검증
- 직원 기본 정보 반환 (id, email, name, employeeNumber, roles, status)

**테스트 케이스:**
- 정상 조회: evaluator 역할을 가진 사용자의 정보 조회 성공 (200)
- 사용자 정보 포함: id, externalId, email, name, employeeNumber, roles, status 필드 반환
- 토큰 없음: Authorization 헤더 없이 요청 시 401 에러
- 잘못된 토큰: 유효하지 않은 JWT 토큰으로 요청 시 401 에러
- evaluator 역할 없음: evaluator 역할이 없는 사용자가 요청 시 403 에러`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '평가자 정보 조회 성공',
      type: UserInfoDto,
    }),
    ApiUnauthorizedResponse({
      description: '인증 실패 (토큰 없음, 잘못된 토큰, 만료된 토큰)',
      schema: {
        example: {
          message: '인증이 필요합니다.',
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    }),
    ApiForbiddenResponse({
      description: '권한 없음 (evaluator 역할 없음)',
      schema: {
        example: {
          message: '이 작업을 수행할 권한이 없습니다. 필요한 역할: evaluator',
          error: 'Forbidden',
          statusCode: 403,
        },
      },
    }),
  );
}

/**
 * 사용자용 현재 로그인한 사용자 정보 조회 API 데코레이터
 *
 * user 역할이 필요합니다.
 */
export function GetMeAsUser() {
  return applyDecorators(
    Roles('user'), // user 역할 필수
    ApiBearerAuth('Bearer'),
    Get('me'),
    ApiOperation({
      summary: '현재 로그인한 사용자 정보 조회',
      description: `JWT 토큰으로 인증된 현재 사용자의 정보를 조회합니다.

**권한:**
- user 역할이 필요합니다

**동작:**
- JWT 토큰에서 사용자 정보 추출
- user 역할 검증
- 직원 기본 정보 반환 (id, email, name, employeeNumber, roles, status)

**테스트 케이스:**
- 정상 조회: user 역할을 가진 사용자의 정보 조회 성공 (200)
- 사용자 정보 포함: id, externalId, email, name, employeeNumber, roles, status 필드 반환
- 토큰 없음: Authorization 헤더 없이 요청 시 401 에러
- 잘못된 토큰: 유효하지 않은 JWT 토큰으로 요청 시 401 에러
- user 역할 없음: user 역할이 없는 사용자가 요청 시 403 에러`,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: '사용자 정보 조회 성공',
      type: UserInfoDto,
    }),
    ApiUnauthorizedResponse({
      description: '인증 실패 (토큰 없음, 잘못된 토큰, 만료된 토큰)',
      schema: {
        example: {
          message: '인증이 필요합니다.',
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    }),
    ApiForbiddenResponse({
      description: '권한 없음 (user 역할 없음)',
      schema: {
        example: {
          message: '이 작업을 수행할 권한이 없습니다. 필요한 역할: user',
          error: 'Forbidden',
          statusCode: 403,
        },
      },
    }),
  );
}
