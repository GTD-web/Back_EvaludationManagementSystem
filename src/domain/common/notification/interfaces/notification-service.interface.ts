import {
  SendNotificationParams,
  SendNotificationResult,
  GetNotificationsParams,
  GetNotificationsResult,
  MarkNotificationAsReadParams,
  MarkNotificationAsReadResult,
  MarkAllAsReadParams,
  MarkAllAsReadResult,
} from './notification.interface';

/**
 * 알림 서비스 인터페이스
 * 모든 알림 관련 기능을 제공하는 통합 인터페이스
 */
export interface INotificationService {
  /**
   * 알림 서비스를 초기화한다
   */
  초기화한다(): Promise<void>;

  /**
   * 알림을 전송한다
   */
  알림을전송한다(params: SendNotificationParams): Promise<SendNotificationResult>;

  /**
   * 알림 목록을 조회한다
   */
  알림목록을조회한다(params: GetNotificationsParams): Promise<GetNotificationsResult>;

  /**
   * 알림을 읽음 처리한다
   */
  알림을읽음처리한다(params: MarkNotificationAsReadParams): Promise<MarkNotificationAsReadResult>;

  /**
   * 수신자의 모든 알림을 읽음 처리한다
   */
  전체알림을읽음처리한다(params: MarkAllAsReadParams): Promise<MarkAllAsReadResult>;
}

