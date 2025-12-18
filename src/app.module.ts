import { DatabaseModule } from '@libs/database/database.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonDomainModule } from './domain/common/common-domain.module';
import { CoreDomainModule } from './domain/core/core-domain.module';
import { SubDomainModule } from './domain/sub/sub-domain.module';
import { DomainContextModule } from './context/domain-context.module';
import { BackupContextModule } from './context/backup-context/backup-context.module';
import { BusinessModule } from './business/business.module';
import { InterfaceModule } from './interface/interface.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(), // 크론 작업을 위한 스케줄러 모듈
    DatabaseModule,
    CommonDomainModule,
    CoreDomainModule,
    SubDomainModule,
    DomainContextModule,
    BackupContextModule, // 백업 컨텍스트 모듈 (@Global로 설정되어 앱 전체에서 단일 인스턴스 사용)
    BusinessModule, // 비즈니스 레이어 모듈 추가
    InterfaceModule, // API 인터페이스 모듈 추가
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
