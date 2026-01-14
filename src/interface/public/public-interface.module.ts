import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { OrganizationManagementContextModule } from '@context/organization-management-context';
import { EvaluationCriteriaManagementContextModule } from '../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationLineMappingModule } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { CronController } from './cron.controller';
import { MappingAnalysisController } from './mapping-analysis.controller';
import { EvaluatorMappingDiagnosisController } from './evaluator-mapping-diagnosis.controller';
import { MappingConflictAnalysisController } from './mapping-conflict-analysis.controller';
import { MappingConflictFixController } from './mapping-conflict-fix.controller';
import { EvaluationPeriod } from '@/domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@/domain/common/employee/employee.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { ProjectManager } from '@domain/common/project/project-manager.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

/**
 * Public 인터페이스 모듈
 *
 * 인증이 필요 없는 공개 API 엔드포인트들을 제공합니다.
 * - 크론 작업 엔드포인트
 * - 헬스 체크 등
 */
@Module({
  imports: [
    ConfigModule,
    EvaluationPeriodModule, // EvaluationPeriodAutoPhaseService 사용
    OrganizationManagementContextModule, // EmployeeSyncService, DepartmentSyncService 사용
    EvaluationCriteriaManagementContextModule, // EvaluationCriteriaManagementService 사용
    EvaluationLineMappingModule, // EvaluationLineMappingService 사용
    TypeOrmModule.forFeature([
      EvaluationLineMapping,
      DownwardEvaluation,
      EvaluationLine,
      Employee,
      EvaluationPeriod,
      EvaluationPeriodEmployeeMapping,
      EvaluationWbsAssignment,
      Project,
      ProjectManager,
      WbsItem,
    ]), // 통계 조회용 Repository
  ],
  controllers: [
    CronController,
    MappingAnalysisController,
    EvaluatorMappingDiagnosisController,
    MappingConflictAnalysisController,
    MappingConflictFixController,
  ],
  providers: [],
  exports: [],
})
export class PublicInterfaceModule {}

