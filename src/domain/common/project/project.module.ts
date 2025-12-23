import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectTestService } from './project-test.service';
import { ProjectManager } from './project-manager.entity';
import { ProjectManagerService } from './project-manager.service';
import { ProjectImportance } from './project-importance.entity';
import { ProjectImportanceService } from './project-importance.service';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';

/**
 * 프로젝트 모듈 (평가 시스템 전용)
 *
 * 평가 시스템에서 사용하는 프로젝트 관련 엔티티, 리포지토리를 제공합니다.
 * 외부 시스템 연동 없이 독립적으로 운영됩니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectManager,
      ProjectImportance,
      Employee,
      EvaluationProjectAssignment,
    ]),
  ],
  providers: [
    ProjectService,
    ProjectManagerService,
    ProjectImportanceService,
    ProjectTestService,
  ],
  exports: [
    ProjectService,
    ProjectManagerService,
    ProjectImportanceService,
    ProjectTestService,
    TypeOrmModule,
  ],
})
export class ProjectModule {}
