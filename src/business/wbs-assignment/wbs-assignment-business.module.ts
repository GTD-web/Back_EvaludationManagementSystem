import { Module } from '@nestjs/common';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { EmployeeModule } from '@domain/common/employee/employee.module';
import { ProjectModule } from '@domain/common/project/project.module';
import { EvaluationLineModule } from '@domain/core/evaluation-line/evaluation-line.module';
import { EvaluationLineMappingModule } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationWbsAssignmentModule } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { WbsSelfEvaluationModule } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.module';
import { WbsAssignmentBusinessService } from './wbs-assignment-business.service';

/**
 * WBS 할당 비즈니스 모듈
 */
@Module({
  imports: [
    EvaluationCriteriaManagementContextModule,
    EvaluationActivityLogContextModule,
    EmployeeModule,
    ProjectModule,
    EvaluationLineModule,
    EvaluationLineMappingModule,
    EvaluationWbsAssignmentModule,
    WbsSelfEvaluationModule,
  ],
  providers: [WbsAssignmentBusinessService],
  exports: [WbsAssignmentBusinessService],
})
export class WbsAssignmentBusinessModule {}
