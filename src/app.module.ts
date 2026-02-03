import { DatabaseModule } from '@libs/database/database.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonDomainModule } from './domain/common/common-domain.module';
import { CoreDomainModule } from './domain/core/core-domain.module';
import { SubDomainModule } from './domain/sub/sub-domain.module';
import { DomainContextModule } from './context/domain-context.module';
import { BackupContextModule } from './context/backup-context/backup-context.module';
import { BusinessModule } from './business/business.module';
import { InterfaceModule } from './interface/interface.module';
import { EvaluationLineMappingModule } from './domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationPeriodModule } from './domain/core/evaluation-period/evaluation-period.module';
import { EvaluationPeriod } from './domain/core/evaluation-period/evaluation-period.entity';
import { ApprovalSystemModule } from './domain/common/approval-system/approval-system.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(), // 크론 작업을 위한 스케줄러 모듈
    DatabaseModule,
    TypeOrmModule.forFeature([EvaluationPeriod]), // 결재 동기화 스케줄러용 Repository
    CommonDomainModule, // ApprovalSystemModule이 포함되어 있음
    CoreDomainModule,
    SubDomainModule,
    // DomainContextModule은 InterfaceModule에 이미 포함되어 있으므로 중복 import 제거
    BackupContextModule, // 백업 컨텍스트 모듈 (@Global로 설정되어 앱 전체에서 단일 인스턴스 사용)
    BusinessModule, // 비즈니스 레이어 모듈 추가
    InterfaceModule, // API 인터페이스 모듈 추가 (DomainContextModule 포함, EvaluationPeriodApprovalSyncService 포함)
    EvaluationLineMappingModule, // 평가라인 매핑 모듈 (스케줄러용)
    EvaluationPeriodModule, // 평가기간 모듈 (스케줄러용)
    // ApprovalSystemModule은 CommonDomainModule에 이미 포함되어 있으므로 중복 import 제거
  ],
  controllers: [],
  providers: [
    // EvaluationPeriodApprovalSyncService는 EvaluationPeriodManagementContextModule에 이미 등록되어 있으므로 중복 등록 제거
  ],
})
export class AppModule {}
