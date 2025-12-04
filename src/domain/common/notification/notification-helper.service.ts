import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISSOService } from '../sso/interfaces';
import { SSOService } from '../sso';
import type {
  INotificationService,
  SendNotificationParams,
  SendNotificationResult,
} from './interfaces';

// NotificationService Symbol을 직접 정의하지 않고 주입 시 사용
export const NOTIFICATION_SERVICE_TOKEN = 'NotificationService';

/**
 * 알림 헬퍼 서비스
 * SSO와 Notification 서비스를 통합하여 알림 전송을 편리하게 처리
 */
@Injectable()
export class NotificationHelperService {
  private readonly logger = new Logger(NotificationHelperService.name);

  constructor(
    @Inject(SSOService)
    private readonly ssoService: ISSOService,
    @Inject(NOTIFICATION_SERVICE_TOKEN)
    private readonly notificationService: INotificationService,
  ) {}

  /**
   * 직원 번호로 알림을 전송한다
   * SSO에서 FCM 토큰을 조회한 후 알림 서버로 전송
   */
  async 직원들에게_알림을_전송한다(params: {
    sender: string;
    title: string;
    content: string;
    employeeNumbers: string[];
    sourceSystem: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<SendNotificationResult> {
    const {
      employeeNumbers,
      sender,
      title,
      content,
      sourceSystem,
      linkUrl,
      metadata,
    } = params;

    this.logger.log(
      `알림 전송 시작: 제목="${title}", 수신자 수=${employeeNumbers.length}`,
    );

    try {
      // 1. SSO에서 FCM 토큰 조회
      this.logger.debug(`FCM 토큰 조회 중: ${employeeNumbers.join(', ')}`);

      const fcmTokensInfo = await this.ssoService.여러직원의FCM토큰을조회한다({
        employeeNumbers,
      });

      // 2. FCM 토큰이 있는 직원만 필터링
      const recipients = fcmTokensInfo.byEmployee
        .filter((emp) => emp.tokens.length > 0)
        .map((emp) => ({
          employeeNumber: emp.employeeNumber,
          tokens: emp.tokens.map((t) => t.fcmToken),
        }));

      if (recipients.length === 0) {
        this.logger.warn(
          `FCM 토큰이 있는 수신자가 없습니다. 요청된 직원: ${employeeNumbers.join(', ')}`,
        );
        return {
          success: false,
          message: 'FCM 토큰이 있는 수신자가 없습니다.',
        };
      }

      this.logger.debug(
        `FCM 토큰 조회 완료: ${recipients.length}명의 수신자, 총 ${fcmTokensInfo.totalTokens}개 토큰`,
      );

      // 3. 알림 전송
      const notificationParams: SendNotificationParams = {
        sender,
        title,
        content,
        recipients,
        sourceSystem,
        linkUrl,
        metadata,
      };

      const result =
        await this.notificationService.알림을전송한다(notificationParams);

      if (result.success) {
        this.logger.log(
          `알림 전송 성공: notificationId=${result.notificationId}, 수신자=${recipients.length}명`,
        );
      } else {
        this.logger.error(`알림 전송 실패: ${result.error || result.message}`);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `알림 전송 중 오류 발생: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: '알림 전송 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  /**
   * 단일 직원에게 알림을 전송한다
   */
  async 직원에게_알림을_전송한다(params: {
    sender: string;
    title: string;
    content: string;
    employeeNumber: string;
    sourceSystem: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<SendNotificationResult> {
    return this.직원들에게_알림을_전송한다({
      ...params,
      employeeNumbers: [params.employeeNumber],
    });
  }

  /**
   * Portal 사용자(직원 번호)에게 알림을 전송한다
   * process.env.MAIL_NOTIFICATION_SSO에서 사번을 가져와 FCM 토큰 조회
   * deviceType에 'portal'이 포함된 토큰만 필터링하여 전송
   */
  async Portal사용자에게_알림을_전송한다(params: {
    sender: string;
    title: string;
    content: string;
    sourceSystem: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<SendNotificationResult> {
    const { sender, title, content, sourceSystem, linkUrl, metadata } = params;

    this.logger.log(`Portal 알림 전송 시작: 제목="${title}"`);

    try {
      // 1. 환경변수에서 사번 가져오기
      const employeeNumber = process.env.MAIL_NOTIFICATION_SSO;

      if (!employeeNumber) {
        this.logger.warn(
          'MAIL_NOTIFICATION_SSO 환경변수가 설정되지 않았습니다.',
        );
        return {
          success: false,
          message: 'MAIL_NOTIFICATION_SSO 환경변수가 설정되지 않았습니다.',
        };
      }

      this.logger.debug(`알림 수신 대상 사번: ${employeeNumber}`);

      // 2. SSO에서 FCM 토큰 조회
      const fcmTokenInfo = await this.ssoService.FCM토큰을조회한다({
        employeeNumber,
      });

      // 3. deviceType에 'portal'이 포함된 토큰만 필터링
      const portalTokens = fcmTokenInfo.tokens
        .filter((token) => token.deviceType.toLowerCase().includes('portal'))
        .map((token) => token.fcmToken);

      if (portalTokens.length === 0) {
        this.logger.warn(
          `Portal FCM 토큰이 없습니다. 직원번호: ${employeeNumber}`,
        );
        return {
          success: false,
          message: 'Portal FCM 토큰이 없습니다.',
        };
      }

      this.logger.debug(
        `Portal FCM 토큰 조회 완료: ${portalTokens.length}개 토큰`,
      );

      // 4. 알림 전송
      const notificationParams: SendNotificationParams = {
        sender,
        title,
        content,
        recipients: [
          {
            employeeNumber,
            tokens: portalTokens,
          },
        ],
        sourceSystem,
        linkUrl,
        metadata,
      };

      const result =
        await this.notificationService.알림을전송한다(notificationParams);

      if (result.success) {
        this.logger.log(
          `Portal 알림 전송 성공: notificationId=${result.notificationId}, 토큰=${portalTokens.length}개`,
        );
      } else {
        this.logger.error(
          `Portal 알림 전송 실패: ${result.error || result.message}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Portal 알림 전송 중 오류 발생: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        message: 'Portal 알림 전송 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
}
