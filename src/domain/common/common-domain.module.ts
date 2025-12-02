import { Module } from '@nestjs/common';
import { EmployeeModule } from './employee/employee.module';
import { DepartmentModule } from './department/department.module';
import { ProjectModule } from './project/project.module';
import { WbsItemModule } from './wbs-item/wbs-item.module';
import { SSOModule } from './sso/sso.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { SystemSettingModule } from './system-setting/system-setting.module';

/**
 * 외부 도메인 모듈
 *
 * 외부 시스템과 연동되는 공통 엔티티 관련 모든 모듈을 통합하여 제공합니다.
 */
@Module({
  imports: [
    EmployeeModule,
    DepartmentModule,
    ProjectModule,
    WbsItemModule,
    SSOModule,
    AuditLogModule,
    SystemSettingModule,
  ],
  exports: [
    EmployeeModule,
    DepartmentModule,
    ProjectModule,
    WbsItemModule,
    SSOModule,
    AuditLogModule,
    SystemSettingModule,
  ],
})
export class CommonDomainModule {}
