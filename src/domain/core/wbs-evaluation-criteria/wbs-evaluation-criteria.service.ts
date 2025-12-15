import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WbsEvaluationCriteriaValidationService } from './wbs-evaluation-criteria-validation.service';
import { WbsEvaluationCriteria } from './wbs-evaluation-criteria.entity';
import { WbsEvaluationCriteriaNotFoundException } from './wbs-evaluation-criteria.exceptions';
import {
  CreateWbsEvaluationCriteriaData,
  WbsEvaluationCriteriaFilter,
  UpdateWbsEvaluationCriteriaData,
} from './wbs-evaluation-criteria.types';
import { IWbsEvaluationCriteria } from './interfaces/wbs-evaluation-criteria.interface';
import { IWbsEvaluationCriteriaService } from './interfaces/wbs-evaluation-criteria.service.interface';

/**
 * WBS 평가 기준 서비스 (MVP 버전)
 * WBS 평가 기준의 CRUD 및 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class WbsEvaluationCriteriaService
  implements IWbsEvaluationCriteriaService
{
  private readonly logger = new Logger(WbsEvaluationCriteriaService.name);

  constructor(
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>,
    private readonly transactionManager: TransactionManagerService,
    private readonly validationService: WbsEvaluationCriteriaValidationService,
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
   * ID로 WBS 평가 기준을 조회한다
   */
  async ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsEvaluationCriteria,
        this.wbsEvaluationCriteriaRepository,
        manager,
      );

      const criteria = await repository.findOne({
        where: { id },
      });

      this.logger.debug(`WBS 평가 기준 조회 완료 - ID: ${id}`);
      return criteria;
    }, 'ID로_조회한다');
  }

  /**
   * 모든 WBS 평가 기준을 조회한다
   */
  async 전체_조회한다(
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsEvaluationCriteria,
        this.wbsEvaluationCriteriaRepository,
        manager,
      );

      const criteriaList = await repository.find({
        order: { createdAt: 'DESC' },
      });

      this.logger.debug(
        `전체 WBS 평가 기준 조회 완료 - 개수: ${criteriaList.length}`,
      );
      return criteriaList;
    }, '전체_조회한다');
  }

  /**
   * WBS 항목별 평가 기준을 조회한다
   */
  async WBS항목별_조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsEvaluationCriteria,
        this.wbsEvaluationCriteriaRepository,
        manager,
      );

      const criteriaList = await repository.find({
        where: { wbsItemId },
        order: { createdAt: 'DESC' },
      });

      this.logger.debug(
        `WBS 항목별 평가 기준 조회 완료 - WBS 항목 ID: ${wbsItemId}, 개수: ${criteriaList.length}`,
      );
      return criteriaList;
    }, 'WBS항목별_조회한다');
  }

  /**
   * 필터 조건으로 WBS 평가 기준을 조회한다
   */
  async 필터_조회한다(
    filter: WbsEvaluationCriteriaFilter,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsEvaluationCriteria,
        this.wbsEvaluationCriteriaRepository,
        manager,
      );

      let queryBuilder = repository.createQueryBuilder('criteria');

      // 필터 적용
      if (filter.wbsItemId) {
        queryBuilder.andWhere('criteria.wbsItemId = :wbsItemId', {
          wbsItemId: filter.wbsItemId,
        });
      }

      if (filter.criteriaSearch) {
        queryBuilder.andWhere('criteria.criteria LIKE :criteriaSearch', {
          criteriaSearch: `%${filter.criteriaSearch}%`,
        });
      }

      if (filter.criteriaExact) {
        queryBuilder.andWhere('TRIM(criteria.criteria) = :criteriaExact', {
          criteriaExact: filter.criteriaExact.trim(),
        });
      }

      queryBuilder.orderBy('criteria.createdAt', 'DESC');

      const criteriaList = await queryBuilder.getMany();

      this.logger.debug(
        `필터 조건 WBS 평가 기준 조회 완료 - 개수: ${criteriaList.length}`,
      );
      return criteriaList;
    }, '필터_조회한다');
  }

  /**
   * WBS 평가 기준을 생성한다
   */
  async 생성한다(
    createData: CreateWbsEvaluationCriteriaData,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria> {
    return this.executeSafeDomainOperation(async () => {
      // 유효성 검증
      await this.validationService.생성데이터검증한다(createData, manager);

      const repository = this.transactionManager.getRepository(
        WbsEvaluationCriteria,
        this.wbsEvaluationCriteriaRepository,
        manager,
      );

      const criteria = repository.create({
        wbsItemId: createData.wbsItemId,
        criteria: createData.criteria,
        importance: createData.importance,
        subProject: createData.subProject,
      });

      const savedCriteria = await repository.save(criteria);

      this.logger.log(
        `WBS 평가 기준 생성 완료 - ID: ${savedCriteria.id}, WBS 항목: ${savedCriteria.wbsItemId}`,
      );

      return savedCriteria;
    }, '생성한다');
  }

  /**
   * WBS 평가 기준을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateData: UpdateWbsEvaluationCriteriaData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsEvaluationCriteria,
        this.wbsEvaluationCriteriaRepository,
        manager,
      );

      const criteria = await repository.findOne({ where: { id } });
      if (!criteria) {
        throw new WbsEvaluationCriteriaNotFoundException(id);
      }

      // 유효성 검증
      await this.validationService.업데이트데이터검증한다(
        id,
        updateData,
        manager,
      );

      // 업데이트 적용
      if (
        updateData.criteria !== undefined ||
        updateData.importance !== undefined ||
        updateData.subProject !== undefined
      ) {
        // criteria가 undefined가 아닌 경우 (빈 문자열 포함) 업데이트
        const newCriteria =
          updateData.criteria !== undefined
            ? updateData.criteria
            : criteria.criteria;
        const newImportance = updateData.importance ?? criteria.importance;
        const newSubProject =
          updateData.subProject !== undefined
            ? updateData.subProject
            : criteria.subProject;
        criteria.기준내용업데이트한다(
          newCriteria,
          newImportance,
          newSubProject,
          updatedBy,
        );
      }

      const updatedCriteria = await repository.save(criteria);

      this.logger.log(
        `WBS 평가 기준 업데이트 완료 - ID: ${id}, 수정자: ${updatedBy}`,
      );

      return updatedCriteria;
    }, '업데이트한다');
  }

  /**
   * WBS 평가 기준을 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsEvaluationCriteria,
        this.wbsEvaluationCriteriaRepository,
        manager,
      );

      const criteria = await repository.findOne({ where: { id } });
      if (!criteria) {
        throw new WbsEvaluationCriteriaNotFoundException(id);
      }

      // 수정자 정보 먼저 업데이트
      criteria.수정자를_설정한다(deletedBy);
      await repository.save(criteria);

      // TypeORM의 softDelete 메서드를 사용하여 안전하게 삭제
      await repository.softDelete(id);

      this.logger.log(
        `WBS 평가 기준 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`,
      );
    }, '삭제한다');
  }

  /**
   * 특정 평가 기준이 존재하는지 확인한다
   */
  async 평가기준_존재_확인한다(
    wbsItemId: string,
    criteria: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsEvaluationCriteria,
        this.wbsEvaluationCriteriaRepository,
        manager,
      );

      const count = await repository
        .createQueryBuilder('criteria')
        .where('criteria.wbsItemId = :wbsItemId', { wbsItemId })
        .andWhere('TRIM(criteria.criteria) = :criteria', {
          criteria: criteria.trim(),
        })
        .getCount();

      return count > 0;
    }, '평가기준_존재_확인한다');
  }

  /**
   * WBS 항목의 모든 평가 기준을 삭제한다
   */
  async WBS항목_평가기준_전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsEvaluationCriteria,
        this.wbsEvaluationCriteriaRepository,
        manager,
      );

      const criteriaList = await repository.find({
        where: { wbsItemId },
      });

      for (const criteria of criteriaList) {
        // 수정자 정보 먼저 업데이트
        criteria.수정자를_설정한다(deletedBy);
        await repository.save(criteria);

        // TypeORM의 softDelete 메서드를 사용하여 안전하게 삭제
        await repository.softDelete(criteria.id);
      }

      this.logger.log(
        `WBS 항목 평가 기준 전체 삭제 완료 - WBS 항목 ID: ${wbsItemId}, 삭제자: ${deletedBy}, 삭제된 기준 수: ${criteriaList.length}`,
      );
    }, 'WBS항목_평가기준_전체삭제한다');
  }
}
