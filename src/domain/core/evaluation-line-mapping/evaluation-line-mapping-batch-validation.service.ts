import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { EvaluationLineMapping } from './evaluation-line-mapping.entity';
import { EvaluationLine } from '../evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '../evaluation-line/evaluation-line.types';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 평가라인 매핑 배치 검증 결과
 */
export interface ValidationResult {
  totalChecked: number;
  invalidCount: number;
  cleanedCount: number;
  invalidMappings: Array<{
    id: string;
    employeeId: string;
    evaluatorId: string;
    evaluationLineId: string;
    evaluationPeriodId: string;
    wbsItemId: string | null;
    reason: string;
    action: 'kept' | 'deleted';
  }>;
  summary: {
    noEvaluatorInEmployee: number;
    wbsAssignmentDeleted: number;
    projectAssignmentDeleted: number;
    duplicatePrimaryEvaluator: number;
    evaluationLineNotFound: number;
  };
}

/**
 * 평가라인 매핑 배치 검증 서비스
 */
@Injectable()
export class EvaluationLineMappingBatchValidationService {
  private readonly logger = new Logger(
    EvaluationLineMappingBatchValidationService.name,
  );

  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly lineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly lineRepository: Repository<EvaluationLine>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async 평가라인_매핑을_검증하고_정리한다(
    periodId: string,
    performCleanup = false,
    performedBy?: string,
    manager?: EntityManager,
  ): Promise<ValidationResult> {
    return this.transactionManager.executeSafeOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.lineMappingRepository,
        manager,
      );

      this.logger.log(
        `평가라인 매핑 검증 시작 - 평가기간: ${periodId}, 정리 수행: ${performCleanup}`,
      );

      const allMappings = await repository.find({
        where: {
          evaluationPeriodId: periodId,
          deletedAt: IsNull(),
        },
      });

      this.logger.log(
        `검증 대상 매핑 수: ${allMappings.length} (평가기간: ${periodId})`,
      );

      const invalidMappings: ValidationResult['invalidMappings'] = [];
      const summary: ValidationResult['summary'] = {
        noEvaluatorInEmployee: 0,
        wbsAssignmentDeleted: 0,
        projectAssignmentDeleted: 0,
        duplicatePrimaryEvaluator: 0,
        evaluationLineNotFound: 0,
      };

      for (const mapping of allMappings) {
        const mappingDto = mapping.DTO로_변환한다();
        const issues: string[] = [];

        const evaluatorExists = await this.평가자_존재_확인(
          mappingDto.evaluatorId,
          manager,
        );
        if (!evaluatorExists) {
          issues.push('평가자가 직원 테이블에 존재하지 않음');
          summary.noEvaluatorInEmployee++;
        }

        const evaluationLineExists = await this.평가라인_존재_확인(
          mappingDto.evaluationLineId,
          manager,
        );
        if (!evaluationLineExists) {
          issues.push('평가라인이 존재하지 않음');
          summary.evaluationLineNotFound++;
        }

        if (mappingDto.wbsItemId) {
          const wbsAssignmentExists = await this.WBS할당_존재_확인(
            periodId,
            mappingDto.employeeId,
            mappingDto.wbsItemId,
            manager,
          );
          if (!wbsAssignmentExists) {
            issues.push('WBS 할당이 삭제되었거나 존재하지 않음');
            summary.wbsAssignmentDeleted++;
          }

          const projectAssignmentExists = await this.프로젝트_할당_존재_확인(
            periodId,
            mappingDto.employeeId,
            mappingDto.wbsItemId,
            manager,
          );
          if (!projectAssignmentExists) {
            issues.push('프로젝트 할당이 삭제되었거나 존재하지 않음');
            summary.projectAssignmentDeleted++;
          }
        }

        if (issues.length > 0) {
          let action: 'kept' | 'deleted' = 'kept';

          if (performCleanup && performedBy) {
            await repository.delete(mappingDto.id);
            action = 'deleted';
            this.logger.log(
              `무효한 매핑 삭제 - ID: ${mappingDto.id}, 사유: ${issues.join(', ')}`,
            );
          }

          invalidMappings.push({
            id: mappingDto.id,
            employeeId: mappingDto.employeeId,
            evaluatorId: mappingDto.evaluatorId,
            evaluationLineId: mappingDto.evaluationLineId,
            evaluationPeriodId: mappingDto.evaluationPeriodId,
            wbsItemId: mappingDto.wbsItemId || null,
            reason: issues.join('; '),
            action,
          });
        }
      }

      const duplicatePrimary = await this.중복된_일차평가자_검증(
        periodId,
        performCleanup,
        performedBy,
        manager,
      );
      summary.duplicatePrimaryEvaluator = duplicatePrimary.length;
      invalidMappings.push(...duplicatePrimary);

      const cleanedCount = performCleanup
        ? invalidMappings.filter((m) => m.action === 'deleted').length
        : 0;

      const result: ValidationResult = {
        totalChecked: allMappings.length,
        invalidCount: invalidMappings.length,
        cleanedCount,
        invalidMappings,
        summary,
      };

      this.logger.log(
        `평가라인 매핑 검증 완료 - 총 ${result.totalChecked}개 중 무효 ${result.invalidCount}개 발견${performCleanup ? `, ${cleanedCount}개 정리` : ''}`,
      );

      return result;
    }, '평가라인_매핑을_검증하고_정리한다');
  }

  private async 평가자_존재_확인(
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const employeeRepository = manager
      ? manager.getRepository('Employee')
      : this.lineMappingRepository.manager.getRepository('Employee');

    const count = await employeeRepository
      .createQueryBuilder('employee')
      .where('employee.id = :evaluatorId', { evaluatorId })
      .getCount();

    return count > 0;
  }

  private async 평가라인_존재_확인(
    evaluationLineId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.transactionManager.getRepository(
      EvaluationLine,
      this.lineRepository,
      manager,
    );

    const line = await repository.findOne({
      where: { id: evaluationLineId, deletedAt: IsNull() },
    });

    return !!line;
  }

  private async WBS할당_존재_확인(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const wbsAssignmentRepository = manager
      ? manager.getRepository('EvaluationWbsAssignment')
      : this.lineMappingRepository.manager.getRepository(
          'EvaluationWbsAssignment',
        );

    const count = await wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.wbsItemId = :wbsItemId', { wbsItemId })
      .andWhere('assignment.deletedAt IS NULL')
      .getCount();

    return count > 0;
  }

  private async 프로젝트_할당_존재_확인(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const wbsAssignmentRepository = manager
      ? manager.getRepository('EvaluationWbsAssignment')
      : this.lineMappingRepository.manager.getRepository(
          'EvaluationWbsAssignment',
        );

    const wbsAssignment = await wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.wbsItemId = :wbsItemId', { wbsItemId })
      .andWhere('assignment.deletedAt IS NULL')
      .getOne();

    if (!wbsAssignment) {
      return false;
    }

    const projectAssignmentRepository = manager
      ? manager.getRepository('EvaluationProjectAssignment')
      : this.lineMappingRepository.manager.getRepository(
          'EvaluationProjectAssignment',
        );

    const count = await projectAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.projectId = :projectId', {
        projectId: wbsAssignment.projectId,
      })
      .andWhere('assignment.deletedAt IS NULL')
      .getCount();

    return count > 0;
  }

  private async 중복된_일차평가자_검증(
    periodId: string,
    performCleanup: boolean,
    performedBy: string | undefined,
    manager?: EntityManager,
  ): Promise<ValidationResult['invalidMappings']> {
    const repository = this.transactionManager.getRepository(
      EvaluationLineMapping,
      this.lineMappingRepository,
      manager,
    );

    const lineRepository = this.transactionManager.getRepository(
      EvaluationLine,
      this.lineRepository,
      manager,
    );

    const primaryLines = await lineRepository.find({
      where: {
        evaluatorType: EvaluatorType.PRIMARY,
        deletedAt: IsNull(),
      },
    });

    if (primaryLines.length === 0) {
      return [];
    }

    const primaryLineIds = primaryLines.map((line) =>
      line.DTO로_변환한다().id,
    );

    const mappings = await repository
      .createQueryBuilder('mapping')
      .where('mapping.evaluationPeriodId = :periodId', { periodId })
      .andWhere('mapping.wbsItemId IS NULL')
      .andWhere('mapping.evaluationLineId IN (:...lineIds)', {
        lineIds: primaryLineIds,
      })
      .andWhere('mapping.deletedAt IS NULL')
      .orderBy('mapping.createdAt', 'ASC')
      .getMany();

    const employeeGroups = new Map<string, EvaluationLineMapping[]>();
    for (const mapping of mappings) {
      const employeeId = mapping.employeeId;
      if (!employeeGroups.has(employeeId)) {
        employeeGroups.set(employeeId, []);
      }
      employeeGroups.get(employeeId)!.push(mapping);
    }

    const duplicates: ValidationResult['invalidMappings'] = [];

    for (const [employeeId, employeeMappings] of employeeGroups.entries()) {
      if (employeeMappings.length > 1) {
        for (let i = 1; i < employeeMappings.length; i++) {
          const mapping = employeeMappings[i];
          const mappingDto = mapping.DTO로_변환한다();

          let action: 'kept' | 'deleted' = 'kept';

          if (performCleanup && performedBy) {
            await repository.delete(mappingDto.id);
            action = 'deleted';
            this.logger.log(
              `중복된 1차 평가자 매핑 삭제 - ID: ${mappingDto.id}, 직원: ${employeeId}`,
            );
          }

          duplicates.push({
            id: mappingDto.id,
            employeeId: mappingDto.employeeId,
            evaluatorId: mappingDto.evaluatorId,
            evaluationLineId: mappingDto.evaluationLineId,
            evaluationPeriodId: mappingDto.evaluationPeriodId,
            wbsItemId: null,
            reason: '중복된 1차 평가자 매핑 (직원당 1개만 허용)',
            action,
          });
        }
      }
    }

    return duplicates;
  }
}
