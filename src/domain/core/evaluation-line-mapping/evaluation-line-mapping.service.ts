import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { EvaluationLineMappingValidationService } from './evaluation-line-mapping-validation.service';
import { EvaluationLineMapping } from './evaluation-line-mapping.entity';
import { EvaluationLineMappingNotFoundException } from './evaluation-line-mapping.exceptions';
import {
  CreateEvaluationLineMappingData,
  EvaluationLineMappingFilter,
  UpdateEvaluationLineMappingData,
} from './evaluation-line-mapping.types';
import { IEvaluationLineMapping } from './interfaces/evaluation-line-mapping.interface';
import { IEvaluationLineMappingService } from './interfaces/evaluation-line-mapping.service.interface';

/**
 * 평가 라인 맵핑 서비스 (MVP 버전)
 * 평가 라인 맵핑의 CRUD 및 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EvaluationLineMappingService
  implements IEvaluationLineMappingService
{
  private readonly logger = new Logger(EvaluationLineMappingService.name);

  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    private readonly transactionManager: TransactionManagerService,
    private readonly validationService: EvaluationLineMappingValidationService,
  ) {}

  /**
   * 안전한 도메인 작업을 실행한다
   */
  private async executeSafeDomainOperation<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<T> {
    return this.transactionManager.executeSafeOperation(operation, context);
  }

  /**
   * ID로 평가 라인 맵핑을 조회한다
   */
  async ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mapping = await repository.findOne({
        where: { id },
      });

      this.logger.debug(`평가 라인 맵핑 조회 완료 - ID: ${id}`);
      return mapping;
    }, 'ID로_조회한다');
  }

  /**
   * 모든 평가 라인 맵핑을 조회한다
   */
  async 전체_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mappings = await repository.find({
        order: { createdAt: 'DESC' },
      });

      this.logger.debug(
        `전체 평가 라인 맵핑 조회 완료 - 개수: ${mappings.length}`,
      );
      return mappings;
    }, '전체_조회한다');
  }

  /**
   * 직원별 평가 라인 맵핑을 조회한다
   */
  async 직원별_조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mappings = await repository.find({
        where: { employeeId },
        order: { createdAt: 'DESC' },
      });

      this.logger.debug(
        `직원별 평가 라인 맵핑 조회 완료 - 직원 ID: ${employeeId}, 개수: ${mappings.length}`,
      );
      return mappings;
    }, '직원별_조회한다');
  }

  /**
   * 평가자별 평가 라인 맵핑을 조회한다
   */
  async 평가자별_조회한다(
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mappings = await repository.find({
        where: { evaluatorId },
        order: { createdAt: 'DESC' },
      });

      this.logger.debug(
        `평가자별 평가 라인 맵핑 조회 완료 - 평가자 ID: ${evaluatorId}, 개수: ${mappings.length}`,
      );
      return mappings;
    }, '평가자별_조회한다');
  }

  /**
   * WBS 항목별 평가 라인 맵핑을 조회한다
   */
  async WBS항목별_조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mappings = await repository.find({
        where: { wbsItemId },
        order: { createdAt: 'DESC' },
      });

      this.logger.debug(
        `WBS 항목별 평가 라인 맵핑 조회 완료 - WBS 항목 ID: ${wbsItemId}, 개수: ${mappings.length}`,
      );
      return mappings;
    }, 'WBS항목별_조회한다');
  }

  /**
   * 생성자별 평가 라인 맵핑을 조회한다
   */
  async 생성자별_조회한다(
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mappings = await repository.find({
        where: { createdBy },
        order: { createdAt: 'DESC' },
      });

      this.logger.debug(
        `생성자별 평가 라인 맵핑 조회 완료 - 생성자 ID: ${createdBy}, 개수: ${mappings.length}`,
      );
      return mappings;
    }, '생성자별_조회한다');
  }

  /**
   * 수정자별 평가 라인 맵핑을 조회한다
   */
  async 수정자별_조회한다(
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mappings = await repository.find({
        where: { updatedBy },
        order: { updatedAt: 'DESC' },
      });

      this.logger.debug(
        `수정자별 평가 라인 맵핑 조회 완료 - 수정자 ID: ${updatedBy}, 개수: ${mappings.length}`,
      );
      return mappings;
    }, '수정자별_조회한다');
  }

  /**
   * 필터 조건으로 평가 라인 맵핑을 조회한다
   */
  async 필터_조회한다(
    filter: EvaluationLineMappingFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      let queryBuilder = repository.createQueryBuilder('mapping');

      // Soft delete 필터링 - 삭제되지 않은 데이터만 조회
      queryBuilder.andWhere('mapping.deletedAt IS NULL');

      // 필터 적용
      if (filter.evaluationPeriodId) {
        queryBuilder.andWhere(
          'mapping.evaluationPeriodId = :evaluationPeriodId',
          {
            evaluationPeriodId: filter.evaluationPeriodId,
          },
        );
      }

      if (filter.employeeId) {
        queryBuilder.andWhere('mapping.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.evaluatorId) {
        queryBuilder.andWhere('mapping.evaluatorId = :evaluatorId', {
          evaluatorId: filter.evaluatorId,
        });
      }

      if (filter.wbsItemId) {
        queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', {
          wbsItemId: filter.wbsItemId,
        });
      }

      if (filter.evaluationLineId) {
        queryBuilder.andWhere('mapping.evaluationLineId = :evaluationLineId', {
          evaluationLineId: filter.evaluationLineId,
        });
      }

      if (filter.createdBy) {
        queryBuilder.andWhere('mapping.createdBy = :createdBy', {
          createdBy: filter.createdBy,
        });
      }

      if (filter.updatedBy) {
        queryBuilder.andWhere('mapping.updatedBy = :updatedBy', {
          updatedBy: filter.updatedBy,
        });
      }

      if (filter.withWbsItem !== undefined) {
        if (filter.withWbsItem) {
          queryBuilder.andWhere('mapping.wbsItemId IS NOT NULL');
        } else {
          queryBuilder.andWhere('mapping.wbsItemId IS NULL');
        }
      }

      queryBuilder.orderBy('mapping.createdAt', 'DESC');

      const mappings = await queryBuilder.getMany();

      this.logger.debug(
        `필터 조건 평가 라인 맵핑 조회 완료 - 개수: ${mappings.length}`,
      );
      return mappings;
    }, '필터_조회한다');
  }

  /**
   * 평가 라인 맵핑을 생성한다
   */
  async 생성한다(
    createData: CreateEvaluationLineMappingData,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping> {
    return this.executeSafeDomainOperation(async () => {
      // 유효성 검증
      await this.validationService.생성데이터검증한다(createData, manager);

      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mapping = repository.create({
        evaluationPeriodId: createData.evaluationPeriodId,
        employeeId: createData.employeeId,
        evaluatorId: createData.evaluatorId,
        wbsItemId: createData.wbsItemId,
        evaluationLineId: createData.evaluationLineId,
        createdBy: createData.createdBy,
      });

      const savedMapping = await repository.save(mapping);

      this.logger.log(
        `평가 라인 맵핑 생성 완료 - ID: ${savedMapping.id}, 평가기간: ${savedMapping.evaluationPeriodId}, 피평가자: ${savedMapping.employeeId}, 평가자: ${savedMapping.evaluatorId}`,
      );

      return savedMapping;
    }, '생성한다');
  }

  /**
   * 평가 라인 맵핑을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateData: UpdateEvaluationLineMappingData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mapping = await repository.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!mapping) {
        throw new EvaluationLineMappingNotFoundException(id);
      }

      // 유효성 검증
      await this.validationService.업데이트데이터검증한다(
        id,
        updateData,
        manager,
      );

      // 업데이트 적용
      if (updateData.evaluatorId !== undefined) {
        mapping.평가자를_변경한다(updateData.evaluatorId);
      }

      if (updateData.evaluationLineId !== undefined) {
        mapping.평가라인을_변경한다(updateData.evaluationLineId);
      }

      if (updateData.wbsItemId !== undefined) {
        mapping.WBS항목을_변경한다(updateData.wbsItemId);
      }

      // 수정자 설정
      if (updateData.updatedBy) {
        mapping.수정자를_설정한다(updateData.updatedBy);
      }

      const updatedMapping = await repository.save(mapping);

      this.logger.log(
        `평가 라인 맵핑 업데이트 완료 - ID: ${id}, 수정자: ${updatedBy}`,
      );

      return updatedMapping;
    }, '업데이트한다');
  }

  /**
   * 평가 라인 맵핑을 삭제한다 (하드 삭제)
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mapping = await repository.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!mapping) {
        throw new EvaluationLineMappingNotFoundException(id);
      }

      await repository.delete(id);

      this.logger.log(
        `평가 라인 맵핑 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`,
      );
    }, '삭제한다');
  }

  /**
   * 특정 평가 관계가 존재하는지 확인한다
   */
  async 평가관계_존재_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    wbsItemId?: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      let queryBuilder = repository
        .createQueryBuilder('mapping')
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId });

      if (wbsItemId) {
        queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', { wbsItemId });
      } else {
        queryBuilder.andWhere('mapping.wbsItemId IS NULL');
      }

      const count = await queryBuilder.getCount();
      return count > 0;
    }, '평가관계_존재_확인한다');
  }

  /**
   * 직원의 모든 맵핑을 삭제한다 (하드 삭제)
   */
  async 직원_맵핑_전체삭제한다(
    employeeId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mappings = await repository.find({
        where: [{ employeeId }, { evaluatorId: employeeId }],
      });

      for (const mapping of mappings) {
        await repository.delete(mapping.id);
      }

      this.logger.log(
        `직원 맵핑 전체 삭제 완료 - 직원 ID: ${employeeId}, 삭제자: ${deletedBy}, 삭제된 맵핑 수: ${mappings.length}`,
      );
    }, '직원_맵핑_전체삭제한다');
  }

  /**
   * WBS 항목의 모든 맵핑을 삭제한다 (하드 삭제)
   */
  async WBS항목_맵핑_전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationLineMapping,
        this.evaluationLineMappingRepository,
        manager,
      );

      const mappings = await repository.find({
        where: { wbsItemId },
      });

      for (const mapping of mappings) {
        await repository.delete(mapping.id);
      }

      this.logger.log(
        `WBS 항목 맵핑 전체 삭제 완료 - WBS 항목 ID: ${wbsItemId}, 삭제자: ${deletedBy}, 삭제된 맵핑 수: ${mappings.length}`,
      );
    }, 'WBS항목_맵핑_전체삭제한다');
  }
}
