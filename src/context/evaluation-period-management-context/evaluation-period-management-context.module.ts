import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationPeriodModule } from '../../domain/core/evaluation-period/evaluation-period.module';
import { EvaluationPeriodEmployeeMappingModule } from '../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.module';
import { EvaluationProjectAssignmentModule } from '../../domain/core/evaluation-project-assignment/evaluation-project-assignment.module';
import { EvaluationLineMappingModule } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationPeriod } from '../../domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '../../domain/common/employee/employee.entity';
import { Department } from '../../domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationLineMapping } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { Project } from '../../domain/common/project/project.entity';
import { WbsItem } from '../../domain/common/wbs-item/wbs-item.entity';
import { WbsEvaluationCriteria } from '../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '../../domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationPeriodManagementContextService } from './evaluation-period-management.service';
import { COMMAND_HANDLERS, QUERY_HANDLERS } from './handlers';

/**
 * 평가 기간 관리 컨텍스트 모듈
 *
 * CQRS 패턴을 사용하여 평가 기간의 생성, 수정, 삭제, 상태 관리 및 평가 대상자 관리 기능을 제공합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      EvaluationPeriod,
      Employee,
      Department,
      EvaluationPeriodEmployeeMapping,
      EvaluationProjectAssignment,
      EvaluationLineMapping,
      Project,
      WbsItem,
      WbsEvaluationCriteria,
      EvaluationLine,
    ]),
    EvaluationPeriodModule,
    EvaluationPeriodEmployeeMappingModule,
    EvaluationProjectAssignmentModule,
    EvaluationLineMappingModule,
  ],
  providers: [
    EvaluationPeriodManagementContextService,
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
  ],
  exports: [EvaluationPeriodManagementContextService],
})
export class EvaluationPeriodManagementContextModule {}
