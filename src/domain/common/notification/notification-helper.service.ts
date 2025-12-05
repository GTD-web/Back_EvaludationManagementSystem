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

      // 2. deviceType에 'portal'이 포함된 FCM 토큰만 필터링
      const recipients = fcmTokensInfo.byEmployee
        .map((emp) => ({
          employeeNumber: emp.employeeNumber,
          tokens: emp.tokens
            .filter((token) => token.deviceType.toLowerCase().includes('portal'))
            .map((t) => t.fcmToken),
        }))
        .filter((emp) => emp.tokens.length > 0); // portal 토큰이 있는 직원만

      if (recipients.length === 0) {
        this.logger.warn(
          `FCM 토큰이 있는 수신자가 없습니다. 요청된 직원: ${employeeNumbers.join(', ')}`,
        );
        return {
          success: false,
          message: 'FCM 토큰이 있는 수신자가 없습니다.',
        };
      }

      // 토큰 상세 정보 로깅 (portal 토큰만)
      const totalPortalTokens = recipients.reduce((sum, r) => sum + r.tokens.length, 0);
      this.logger.debug(
        `Portal FCM 토큰 조회 완료: ${recipients.length}명의 수신자, 총 ${totalPortalTokens}개 토큰 (전체 ${fcmTokensInfo.totalTokens}개 중)`,
      );
      recipients.forEach((recipient) => {
        const portalTokens = fcmTokensInfo.byEmployee
          .find((emp) => emp.employeeNumber === recipient.employeeNumber)
          ?.tokens.filter((t) => t.deviceType.toLowerCase().includes('portal')) || [];
        
        if (portalTokens.length > 0) {
          this.logger.debug(
            `직원 ${recipient.employeeNumber}: ${portalTokens.length}개 Portal 토큰 - ${portalTokens.map((t) => `${t.deviceType}(${t.fcmToken.substring(0, 20)}...)`).join(', ')}`,
          );
        }
      });

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

      // 알림 전송 결과 로깅
      // successCount가 있으면 부분 성공도 성공으로 처리
      const isSuccess = result.success || (result.successCount && result.successCount > 0) || false;
      
      if (isSuccess) {
        this.logger.log(
          `알림 전송 성공: notificationId=${result.notificationId}, 수신자=${recipients.length}명`,
        );
        
        // 부분 성공/실패 정보가 있으면 표시
        if (result.successCount !== undefined) {
          this.logger.log(
            `알림 전송 상세: 성공 ${result.successCount}건, 실패 ${result.failureCount || 0}건`,
          );
        }
      } else {
        this.logger.error(`알림 전송 실패: ${result.error || result.message}`);
      }

      // 일부 성공도 성공으로 반환
      if (!result.success && result.successCount && result.successCount > 0) {
        return {
          ...result,
          success: true,
        };
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
   * 
   * @deprecated 이 메서드는 더 이상 사용되지 않습니다. 
   * 대신 직원에게_알림을_전송한다() 메서드를 사용하여 특정 직원에게 직접 알림을 전송하세요.
   * 
   * @example
   * // 기존 방식 (deprecated)
   * await notificationHelper.Portal사용자에게_알림을_전송한다({ ... });
   * 
   * // 새로운 방식
   * await notificationHelper.직원에게_알림을_전송한다({
   *   employeeNumber: '25030', // 수신자 직원 번호를 명시적으로 지정
   *   ...
   * });
   */
  async Portal사용자에게_알림을_전송한다(params: {
    sender: string;
    title: string;
    content: string;
    sourceSystem: string;
    linkUrl?: string;
    metadata?: Record<string, any>;
    employeeNumber?: string; // 선택적 파라미터로 변경
  }): Promise<SendNotificationResult> {
    const { sender, title, content, sourceSystem, linkUrl, metadata, employeeNumber } = params;

    this.logger.warn(
      `[DEPRECATED] Portal사용자에게_알림을_전송한다() 메서드는 deprecated되었습니다. ` +
      `직원에게_알림을_전송한다() 메서드를 사용하세요.`
    );

    // 직원 번호가 파라미터로 전달되지 않은 경우 에러 반환
    if (!employeeNumber) {
      this.logger.error(
        'employeeNumber 파라미터가 필요합니다. Portal 알림은 더 이상 환경변수를 사용하지 않습니다.',
      );
      return {
        success: false,
        message: 'employeeNumber 파라미터가 필요합니다.',
      };
    }

    // 직원에게_알림을_전송한다 메서드로 위임
    return this.직원에게_알림을_전송한다({
      sender,
      title,
      content,
      employeeNumber,
      sourceSystem,
      linkUrl,
      metadata,
    });
  }
}
