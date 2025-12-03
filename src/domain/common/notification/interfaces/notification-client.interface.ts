/**
 * 알림 서비스 클라이언트 설정
 */
export interface NotificationClientConfig {
  /**
   * 알림 서버 기본 URL
   */
  baseUrl: string;

  /**
   * 타임아웃 시간 (밀리초)
   */
  timeoutMs?: number;

  /**
   * 재시도 횟수
   */
  retries?: number;

  /**
   * 재시도 지연 시간 (밀리초)
   */
  retryDelay?: number;

  /**
   * 로깅 활성화 여부
   */
  enableLogging?: boolean;
}

