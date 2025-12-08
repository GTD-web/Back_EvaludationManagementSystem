import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  INotificationService,
  SendNotificationParams,
  SendNotificationResult,
  GetNotificationsParams,
  GetNotificationsResult,
  MarkNotificationAsReadParams,
  MarkNotificationAsReadResult,
  MarkAllAsReadParams,
  MarkAllAsReadResult,
  NotificationInfo,
} from './interfaces';

/**
 * 알림 서비스 구현체
 * 메일 서버 API와 연동하여 알림 관련 기능을 제공한다
 */
@Injectable()
export class NotificationServiceImpl
  implements INotificationService, OnModuleInit
{
  private readonly logger = new Logger(NotificationServiceImpl.name);
  private httpClient: AxiosInstance;
  private initialized = false;

  constructor(@Inject('NOTIFICATION_CONFIG') private readonly config: any) {
    this.logger.log(
      `알림 서비스 클라이언트 초기화 중... baseUrl: ${this.config.baseUrl}, timeoutMs: ${this.config.timeoutMs || 30000}`,
    );

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 응답 인터셉터 추가 (에러 핸들링)
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.logger.error(`API 요청 실패: ${error.message}`, error.stack);

        if (error.response) {
          this.logger.error(
            `응답 상태: ${error.response.status}, 데이터: ${JSON.stringify(error.response.data)}`,
          );
        }

        throw error;
      },
    );

    this.logger.log('알림 서비스 클라이언트 인스턴스 생성 완료');
  }

  async onModuleInit(): Promise<void> {
    await this.초기화한다();
  }

  /**
   * 알림 서비스를 초기화한다
   */
  async 초기화한다(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.logger.log(
        `알림 서비스 초기화 시작... baseUrl: ${this.config.baseUrl}`,
      );
      const startTime = Date.now();

      // 헬스체크 엔드포인트가 있다면 호출 (선택사항)
      // await this.httpClient.get('/health');

      const elapsedTime = Date.now() - startTime;
      this.initialized = true;
      this.logger.log(`알림 서비스 초기화 완료 (소요 시간: ${elapsedTime}ms)`);
    } catch (error) {
      this.logger.error(
        `알림 서비스 초기화 실패: ${error.message}`,
        error.stack,
      );
      this.logger.warn(
        '알림 서비스 초기화 실패했지만, 서비스는 계속 사용 가능합니다.',
      );
      // 초기화 실패해도 서비스는 사용 가능하도록 설정
      this.initialized = true;
    }
  }

  private 초기화확인(): void {
    if (!this.initialized) {
      throw new Error(
        '알림 서비스가 초기화되지 않았습니다. 먼저 초기화한다()를 호출하세요.',
      );
    }
  }

  /**
   * 알림을 전송한다
   */
  async 알림을전송한다(
    params: SendNotificationParams,
  ): Promise<SendNotificationResult> {
    this.초기화확인();

    try {
      this.logger.log(
        `알림 전송 요청: 제목=${params.title}, 수신자 수=${params.recipients.length}`,
      );

      const response = await this.httpClient.post<any>(
        '/api/portal/notifications/send',
        params,
      );

      // 알림 서버 응답 정규화
      // 서버가 notificationIds (배열)로 반환하면 첫 번째 값을 notificationId로 변환
      const responseData = response.data;
      const notificationId =
        responseData.notificationId ||
        (responseData.notificationIds && responseData.notificationIds[0]) ||
        undefined;

      // 응답 데이터 상세 로깅
      this.logger.log(`알림 전송 성공: notificationId=${notificationId}`);
      this.logger.debug(`알림 서버 응답 상세: ${JSON.stringify(responseData)}`);

      // 정규화된 응답 반환
      return {
        success: responseData.success,
        message: responseData.message,
        notificationId: notificationId,
        error: responseData.error,
        // 추가 정보 보존
        ...(responseData.successCount !== undefined && {
          successCount: responseData.successCount,
          failureCount: responseData.failureCount,
        }),
      } as SendNotificationResult;
    } catch (error) {
      this.logger.error('알림 전송 실패', error);

      // 에러 응답을 반환
      return {
        success: false,
        message: '알림 전송 실패',
        error: error.message || '알 수 없는 오류',
      };
    }
  }

  /**
   * 알림 목록을 조회한다
   */
  async 알림목록을조회한다(
    params: GetNotificationsParams,
  ): Promise<GetNotificationsResult> {
    this.초기화확인();

    try {
      this.logger.log(
        `알림 목록 조회 요청: recipientId=${params.recipientId}, isRead=${params.isRead}, skip=${params.skip}, take=${params.take}`,
      );

      const queryParams: any = {
        // EMS 시스템에서는 항상 sourceSystem='EMS'인 알림만 조회
        sourceSystem: 'EMS',
      };
      
      if (params.isRead !== undefined) {
        queryParams.isRead = params.isRead;
      }
      if (params.skip !== undefined) {
        queryParams.skip = params.skip;
      }
      if (params.take !== undefined) {
        queryParams.take = params.take;
      }

      this.logger.debug(
        `알림 서버로 전송할 쿼리 파라미터 (sourceSystem='EMS' 자동 적용): ${JSON.stringify(queryParams)}`,
      );

      const response = await this.httpClient.get(
        `/api/portal/notifications/${params.recipientId}`,
        { params: queryParams },
      );

      this.logger.log(
        `알림 서버 응답: 알림 수=${response.data.notifications?.length || 0}, 전체=${response.data.total || 0}, 미읽음=${response.data.unreadCount || 0}`,
      );

      // 알림 서버 응답을 EMS 형식으로 변환
      const notifications: NotificationInfo[] = (
        response.data.notifications || []
      ).map((notification: any) => ({
        id: notification.id,
        sender: notification.sender || 'system',
        recipientId: notification.recipient, // recipient → recipientId 매핑
        title: notification.title,
        content: notification.content,
        isRead: notification.isRead,
        sourceSystem: notification.sourceSystem,
        linkUrl: notification.linkUrl,
        metadata: notification.metadata,
        createdAt: new Date(notification.createdAt),
        readAt: notification.readAt ? new Date(notification.readAt) : undefined,
      }));

      // sourceSystem 통계 로깅 (디버깅용)
      const sourceSystemStats = notifications.reduce((acc, n) => {
        acc[n.sourceSystem] = (acc[n.sourceSystem] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      this.logger.warn(
        `⚠️ 알림 서버 응답에 포함된 sourceSystem 통계: ${JSON.stringify(sourceSystemStats)}`,
      );

      // EMS가 아닌 알림 필터링 (알림 서버에서 필터링하지 않은 경우 대비)
      const filteredNotifications = notifications.filter(
        (n) => n.sourceSystem === 'EMS',
      );

      if (filteredNotifications.length < notifications.length) {
        this.logger.warn(
          `⚠️ 알림 서버가 sourceSystem 필터링을 하지 않아 백엔드에서 필터링: 원본 ${notifications.length}개 → 필터링 후 ${filteredNotifications.length}개`,
        );
      }

      // unreadCount: 현재 가져온 notifications 배열에서 읽지 않은 알림 개수
      const unreadCount = filteredNotifications.filter((n) => !n.isRead).length;

      this.logger.log(
        `알림 목록 조회 완료: 조회=${filteredNotifications.length}개, 전체=${response.data.total || 0}개, 미읽음=${unreadCount}개`,
      );

      // total은 메일 서버에서 받은 값 사용 (필터 조건에 맞는 전체 개수)
      // take 값에 상관없이 필터 조건(isRead)에 해당하는 총 알림 개수를 반환
      // unreadCount는 현재 페이지(notifications)에서 읽지 않은 알림 개수
      return {
        notifications: filteredNotifications,
        total: response.data.total || filteredNotifications.length,
        unreadCount,
      };
    } catch (error) {
      this.logger.error('알림 목록 조회 실패', error);

      // 에러 상세 로그 추가
      if (error.response) {
        this.logger.error(
          `API 응답 에러: 상태=${error.response.status}, 데이터=${JSON.stringify(error.response.data)}`,
        );
      }

      // 빈 목록 반환
      return {
        notifications: [],
        total: 0,
        unreadCount: 0,
      };
    }
  }

  /**
   * 알림을 읽음 처리한다
   */
  async 알림을읽음처리한다(
    params: MarkNotificationAsReadParams,
  ): Promise<MarkNotificationAsReadResult> {
    this.초기화확인();

    try {
      this.logger.log(
        `알림 읽음 처리 요청: notificationId=${params.notificationId}`,
      );

      const response =
        await this.httpClient.patch<MarkNotificationAsReadResult>(
          `/api/portal/notifications/${params.notificationId}/read`,
        );

      this.logger.log(
        `알림 읽음 처리 성공: notificationId=${params.notificationId}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('알림 읽음 처리 실패', error);

      return {
        success: false,
        message: '알림 읽음 처리 실패',
      };
    }
  }

  /**
   * 수신자의 모든 알림을 읽음 처리한다
   */
  async 전체알림을읽음처리한다(
    params: MarkAllAsReadParams,
  ): Promise<MarkAllAsReadResult> {
    this.초기화확인();

    try {
      this.logger.log(
        `전체 알림 읽음 처리 요청: recipientId=${params.recipientId}`,
      );

      const response = await this.httpClient.patch<MarkAllAsReadResult>(
        `/api/portal/notifications/${params.recipientId}/read-all`,
      );

      this.logger.log(
        `전체 알림 읽음 처리 성공: recipientId=${params.recipientId}, updatedCount=${response.data.updatedCount}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error('전체 알림 읽음 처리 실패', error);

      return {
        success: false,
        message: '전체 알림 읽음 처리 실패',
        updatedCount: 0,
      };
    }
  }
}
