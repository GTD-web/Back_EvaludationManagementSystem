import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupSchedulerService } from './backup-scheduler.service';

/**
 * 백업 컨텍스트 모듈
 * 
 * 데이터베이스 자동 백업 기능을 제공합니다.
 * - 4시간마다 백업 (최근 24시간)
 * - 매일 자정 백업 (30일 보관)
 * - 매주 일요일 백업 (12주 보관)
 * - 매월 1일 백업 (12개월 보관)
 * - 분기말/연말 백업 (3-7년 보관)
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [BackupSchedulerService],
  exports: [BackupSchedulerService],
})
export class BackupContextModule {}

