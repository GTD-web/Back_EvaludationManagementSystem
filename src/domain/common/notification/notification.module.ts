import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationServiceFactory } from './notification.service.factory';
import { NotificationClientConfig, INotificationService } from './interfaces';
import { NotificationHelperService, NOTIFICATION_SERVICE_TOKEN } from './notification-helper.service';
import { SSOModule } from '../sso';

/**
 * 알림 서비스 토큰
 */
export const NotificationService = NOTIFICATION_SERVICE_TOKEN;

/**
 * 알림 서비스 모듈
 * 메일 서버 API와 연동하여 알림 관련 기능을 제공한다
 * 팩토리 패턴을 사용하여 환경에 따라 실제 서비스 또는 Mock 서비스를 제공한다
 */
@Module({
  imports: [ConfigModule, SSOModule],
  providers: [
    {
      provide: 'NOTIFICATION_CONFIG',
      useFactory: (configService: ConfigService): NotificationClientConfig => {
        const config: NotificationClientConfig = {
          baseUrl:
            configService.get<string>('MAIL_SERVER_URL') ||
            'http://localhost:3001',
          timeoutMs: configService.get<number>('NOTIFICATION_TIMEOUT_MS') || 30000,
          retries: configService.get<number>('NOTIFICATION_RETRIES') || 2,
          retryDelay: configService.get<number>('NOTIFICATION_RETRY_DELAY') || 1000,
          enableLogging: false,
        };

        // Mock 서비스 사용 시에는 검증 건너뛰기
        const useMockService =
          configService.get<string>('NOTIFICATION_USE_MOCK') === 'true' ||
          configService.get<string>('NODE_ENV') === 'test';

        if (!useMockService && !config.baseUrl) {
          throw new Error('MAIL_SERVER_URL 환경 변수가 필요합니다.');
        }

        return config;
      },
      inject: [ConfigService],
    },
    NotificationServiceFactory,
    {
      provide: NOTIFICATION_SERVICE_TOKEN,
      useFactory: (factory: NotificationServiceFactory): INotificationService => {
        return factory.create();
      },
      inject: [NotificationServiceFactory],
    },
    NotificationHelperService,
  ],
  exports: [
    'NOTIFICATION_CONFIG',
    NOTIFICATION_SERVICE_TOKEN,
    NotificationServiceFactory,
    NotificationHelperService,
  ],
})
export class NotificationModule implements OnModuleInit {
  constructor(private readonly factory: NotificationServiceFactory) {}

  async onModuleInit(): Promise<void> {
    await this.factory.initialize();
  }
}

