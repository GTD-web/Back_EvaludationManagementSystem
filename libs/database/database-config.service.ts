import { fa } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * 데이터베이스 설정 서비스
 *
 * 환경 변수를 기반으로 TypeORM 설정을 생성합니다.
 * 개발/운영 환경에 따른 다른 설정을 지원합니다.
 */
@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    return {
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'lumir_admin'),
      password: this.configService.get<string>(
        'DB_PASSWORD',
        'lumir_password_2024',
      ),
      database: this.configService.get<string>(
        'DB_DATABASE',
        'lumir_project_management',
      ),

      // 마이그레이션 설정
      migrations: ['dist/migrations/*{.ts,.js}'],
      migrationsRun: false, // 애플리케이션 시작 시 자동 마이그레이션 실행 여부

      // 개발 환경 설정
      // synchronize: isDevelopment, // 개발 환경에서만 스키마 자동 동기화
      synchronize: false, // 개발 환경에서만 스키마 자동 동기화
      logging: isDevelopment ? ['query', 'error', 'warn'] : ['error'],

      // 연결 풀 설정
      extra: {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
      },

      // 캐시 설정 (Redis 연동 시 사용)
      cache: {
        type: 'database',
        duration: 30000, // 30초
      },

      // 트랜잭션 격리 레벨은 개별 트랜잭션에서 설정

      // 타임존은 PostgreSQL 서버에서 설정

      // SSL 설정 (운영 환경)
      ssl: isProduction ? { rejectUnauthorized: false } : false,

      // 연결 재시도 설정
      retryAttempts: 3,
      retryDelay: 3000,

      // 자동 로드 팩토리 (Lazy Loading 지원)
      autoLoadEntities: true,

      // 스키마 드롭 (개발 환경에서만)
      dropSchema: false,

      // 네이밍 전략 (기본 스네이크 케이스 사용)
      // 향후 필요시 커스텀 네이밍 전략 클래스를 별도로 구현
    };
  }
}
