import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonDomainModule } from '@domain/common/common-domain.module';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogContextService } from './audit-log-context.service';
import {
  CreateAuditLogHandler,
  GetAuditLogListHandler,
  GetAuditLogDetailHandler,
  GetAuditLogStatsHandler,
} from './handlers';

/**
 * Audit 로그 컨텍스트 모듈
 *
 * Audit 로그 생성 및 조회 비즈니스 로직을 담당합니다.
 */
@Module({
  imports: [
    CqrsModule,
    CommonDomainModule,
    TypeOrmModule.forFeature([AuditLog]),
  ],
  providers: [
    AuditLogContextService,
    CreateAuditLogHandler,
    GetAuditLogListHandler,
    GetAuditLogDetailHandler,
    GetAuditLogStatsHandler,
  ],
  exports: [AuditLogContextService],
})
export class AuditLogContextModule {}
