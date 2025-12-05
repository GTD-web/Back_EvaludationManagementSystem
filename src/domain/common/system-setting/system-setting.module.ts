import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from './system-setting.entity';
import { SystemSettingService } from './system-setting.service';

/**
 * 시스템 설정 모듈
 *
 * 시스템 전역 설정을 관리합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting])],
  providers: [SystemSettingService],
  exports: [SystemSettingService],
})
export class SystemSettingModule {}


