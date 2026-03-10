/**
 * 인증된 사용자 정보
 */
export interface AuthenticatedUserInfo {
  id: string; // Employee ID
  externalId: string; // SSO user ID
  email: string;
  name: string;
  employeeNumber: string;
  roles: string[]; // EMS-PROD 시스템 역할
  status: string;
}

/**
 * 토큰 검증 및 동기화 명령
 */
export interface VerifyAndSyncUserCommand {
  accessToken: string;
}

/**
 * 토큰 검증 및 동기화 결과
 */
export interface VerifyAndSyncUserResult {
  user: AuthenticatedUserInfo;
  isSynced: boolean; // Employee 정보가 동기화되었는지 여부
}

/**
 * 역할 포함 사용자 조회 쿼리
 */
export interface GetUserWithRolesQuery {
  employeeNumber: string;
}

/**
 * 역할 포함 사용자 조회 결과
 */
export interface GetUserWithRolesResult {
  user: AuthenticatedUserInfo | null;
}

/**
 * 로그인 명령
 */
export interface LoginCommand {
  email: string;
  password: string;
}

/**
 * 로그인 결과
 */
export interface LoginResult {
  user: AuthenticatedUserInfo;
  accessToken: string;
  refreshToken: string;
}

/**
 * 토큰 갱신 명령
 */
export interface RefreshTokenCommand {
  refreshToken: string;
}
