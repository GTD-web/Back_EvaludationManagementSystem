import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INotificationService } from './interfaces';
import { NotificationServiceImpl } from './notification.service.impl';
import { MockNotificationService } from './notification.service.mock';

/**
 * 알림 서비스 팩토리
 * 환경 설정에 따라 실제 알림 서비스 또는 Mock 서비스를 반환한다
 */
@Injectable()
export class NotificationServiceFactory {
  private readonly logger = new Logger(NotificationServiceFactory.name);
  private serviceInstance: INotificationService | null = null;

  constructor(
    @Inject('NOTIFICATION_CONFIG') private readonly config: any,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 환경에 따라 적절한 알림 서비스를 생성한다
   */
  create(): INotificationService {
    if (this.serviceInstance) {
      return this.serviceInstance;
    }

    const useMockService =
      this.configService.get<string>('NOTIFICATION_USE_MOCK') === 'true' ||
      this.configService.get<string>('NODE_ENV') === 'test';

    if (useMockService) {
      this.logger.log('Mock 알림 서비스를 사용합니다');
      this.serviceInstance = new MockNotificationService();
    } else {
      this.logger.log('실제 알림 서비스를 사용합니다 (메일 서버 연동)');
      this.serviceInstance = new NotificationServiceImpl(this.config);
    }

    return this.serviceInstance;
  }

  /**
   * 서비스 인스턴스를 초기화한다
   */
  async initialize(): Promise<void> {
    const service = this.create();
    await service.초기화한다();
  }
}

