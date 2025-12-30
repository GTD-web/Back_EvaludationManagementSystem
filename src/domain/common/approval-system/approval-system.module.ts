import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApprovalSystemService } from './approval-system.service';

/**
 * 결재 시스템 연동 모듈
 *
 * LIAS 결재관리시스템과의 통신을 담당하는 모듈입니다.
 */
@Module({
  imports: [HttpModule],
  providers: [ApprovalSystemService],
  exports: [ApprovalSystemService],
})
export class ApprovalSystemModule {}

