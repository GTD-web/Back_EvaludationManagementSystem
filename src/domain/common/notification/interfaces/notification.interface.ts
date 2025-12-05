/**
 * 알림 수신자 정보
 */
export interface NotificationRecipient {
  /**
   * 직원 번호 (사번)
   */
  employeeNumber: string;

  /**
   * FCM 토큰 목록
   */
  tokens: string[];
}

/**
 * 알림 메타데이터
 */
export interface NotificationMetadata {
  /**
   * 알림 타입
   */
  type?: string;

  /**
   * 우선순위
   */
  priority?: string;

  /**
   * 추가 메타데이터
   */
  [key: string]: any;
}

/**
 * 알림 전송 요청
 */
export interface SendNotificationParams {
  /**
   * 발신자 ID
   */
  sender: string;

  /**
   * 알림 제목
   */
  title: string;

  /**
   * 알림 내용
   */
  content: string;

  /**
   * 수신자 목록
   */
  recipients: NotificationRecipient[];

  /**
   * 출처 시스템
   */
  sourceSystem: string;

  /**
   * 링크 URL
   */
  linkUrl?: string;

  /**
   * 메타데이터
   */
  metadata?: NotificationMetadata;
}

/**
 * 알림 전송 응답
 */
export interface SendNotificationResult {
  /**
   * 성공 여부
   */
  success: boolean;

  /**
   * 메시지
   */
  message: string;

  /**
   * 알림 ID
   */
  notificationId?: string;

  /**
   * 에러 메시지
   */
  error?: string;

  /**
   * 성공한 토큰 수 (부분 성공 시)
   */
  successCount?: number;

  /**
   * 실패한 토큰 수 (부분 성공 시)
   */
  failureCount?: number;
}

/**
 * 알림 목록 조회 요청
 */
export interface GetNotificationsParams {
  /**
   * 수신자 ID
   */
  recipientId: string;

  /**
   * 읽음 여부 필터 (true/false)
   */
  isRead?: boolean;

  /**
   * 건너뛸 개수
   */
  skip?: number;

  /**
   * 가져올 개수
   */
  take?: number;
}

/**
 * 알림 정보
 */
export interface NotificationInfo {
  /**
   * 알림 ID
   */
  id: string;

  /**
   * 발신자 ID
   */
  sender: string;

  /**
   * 수신자 ID
   */
  recipientId: string;

  /**
   * 제목
   */
  title: string;

  /**
   * 내용
   */
  content: string;

  /**
   * 읽음 여부
   */
  isRead: boolean;

  /**
   * 출처 시스템
   */
  sourceSystem: string;

  /**
   * 링크 URL
   */
  linkUrl?: string;

  /**
   * 메타데이터
   */
  metadata?: NotificationMetadata;

  /**
   * 생성일시
   */
  createdAt: Date;

  /**
   * 읽은 일시
   */
  readAt?: Date;
}

/**
 * 알림 목록 조회 응답
 */
export interface GetNotificationsResult {
  /**
   * 알림 목록
   */
  notifications: NotificationInfo[];

  /**
   * 전체 개수
   */
  total: number;

  /**
   * 읽지 않은 개수
   */
  unreadCount: number;
}

/**
 * 알림 읽음 처리 요청
 */
export interface MarkNotificationAsReadParams {
  /**
   * 알림 ID
   */
  notificationId: string;
}

/**
 * 알림 읽음 처리 응답
 */
export interface MarkNotificationAsReadResult {
  /**
   * 성공 여부
   */
  success: boolean;

  /**
   * 메시지
   */
  message?: string;
}

/**
 * 전체 읽음 처리 요청
 */
export interface MarkAllAsReadParams {
  /**
   * 수신자 ID
   */
  recipientId: string;
}

/**
 * 전체 읽음 처리 응답
 */
export interface MarkAllAsReadResult {
  /**
   * 성공 여부
   */
  success: boolean;

  /**
   * 메시지
   */
  message: string;

  /**
   * 업데이트된 알림 개수
   */
  updatedCount: number;
}

