import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationLineMapping } from './evaluation-line-mapping.entity';
import { EvaluationLine } from '../evaluation-line/evaluation-line.entity';
import { EvaluationLineMappingService } from './evaluation-line-mapping.service';
import { EvaluationLineMappingValidationService } from './evaluation-line-mapping-validation.service';
import { EvaluationLineMappingBatchValidationService } from './evaluation-line-mapping-batch-validation.service';

/**
 * 평가 라인 맵핑 모듈 (MVP 버전)
 * 평가 라인과 관련 엔티티 간의 관계를 관리하는 도메인 모듈입니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EvaluationLineMapping, EvaluationLine]),
    DatabaseModule,
  ],
  providers: [
    EvaluationLineMappingService,
    EvaluationLineMappingValidationService,
    EvaluationLineMappingBatchValidationService,
  ],
  exports: [
    EvaluationLineMappingService,
    EvaluationLineMappingValidationService,
    EvaluationLineMappingBatchValidationService,
  ],
})
export class EvaluationLineMappingModule {}
