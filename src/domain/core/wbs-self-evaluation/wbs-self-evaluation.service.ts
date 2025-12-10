import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluation } from './wbs-self-evaluation.entity';
import {
  WbsSelfEvaluationNotFoundException,
  WbsSelfEvaluationValidationException,
  DuplicateWbsSelfEvaluationException,
} from './wbs-self-evaluation.exceptions';
import type {
  CreateWbsSelfEvaluationData,
  UpdateWbsSelfEvaluationData,
  WbsSelfEvaluationFilter,
} from './wbs-self-evaluation.types';

/**
 * WBS 자가평가 서비스
 * WBS 자가평가 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class WbsSelfEvaluationService {
  private readonly logger = new Logger(WbsSelfEvaluationService.name);

  constructor(
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
    private readonly transactionManager: TransactionManagerService,
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
   * WBS 자가평가를 생성한다
   */
  async 생성한다(
    createData: CreateWbsSelfEvaluationData,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      // 유효성 검사
      this.유효성을_검사한다(createData);

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      // 중복 검사
      await this.중복_검사를_수행한다(
        createData.periodId,
        createData.employeeId,
        createData.wbsItemId,
        repository,
      );

      const wbsSelfEvaluation = new WbsSelfEvaluation(createData);
      const saved = await repository.save(wbsSelfEvaluation);

      return saved;
    }, '생성한다');
  }

  /**
   * WBS 자가평가를 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateWbsSelfEvaluationData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      const wbsSelfEvaluation = await repository.findOne({ where: { id } });
      if (!wbsSelfEvaluation) {
        throw new WbsSelfEvaluationNotFoundException(id);
      }

      // 유효성 검사
      if (
        updateData.selfEvaluationScore !== undefined &&
        updateData.selfEvaluationScore !== null
      ) {
        this.점수_유효성을_검사한다(updateData.selfEvaluationScore);
      }

      // 필드 업데이트
      if (updateData.assignedBy !== undefined) {
        wbsSelfEvaluation.assignedBy = updateData.assignedBy;
      }

      if (updateData.submittedToEvaluator !== undefined) {
        if (updateData.submittedToEvaluator) {
          wbsSelfEvaluation.피평가자가_1차평가자에게_제출한다();
        } else {
          wbsSelfEvaluation.피평가자_제출을_취소한다();
        }
      }

      if (updateData.submittedToManager !== undefined) {
        if (updateData.submittedToManager) {
          wbsSelfEvaluation.일차평가자가_관리자에게_제출한다();
        } else {
          // 재작성 요청 생성 시 submittedToManagerAt도 초기화
          if (updateData.resetSubmittedToManagerAt) {
            wbsSelfEvaluation.일차평가자_제출을_완전히_초기화한다();
          } else {
            wbsSelfEvaluation.일차평가자_제출을_취소한다();
          }
        }
      }

      // 자가평가 내용/점수/결과 수정 (선택적)
      if (
        updateData.selfEvaluationContent !== undefined ||
        updateData.selfEvaluationScore !== undefined ||
        updateData.performanceResult !== undefined
      ) {
        wbsSelfEvaluation.자가평가를_수정한다(
          updateData.selfEvaluationContent,
          updateData.selfEvaluationScore,
          updateData.performanceResult,
          updatedBy,
        );
      }

      const saved = await repository.save(wbsSelfEvaluation);

      return saved;
    }, '수정한다');
  }

  /**
   * 피평가자가 1차 평가자에게 제출한다
   * 엔티티를 파라미터로 받아 처리합니다.
   */
  async 피평가자가_1차평가자에게_제출한다(
    wbsSelfEvaluation: WbsSelfEvaluation,
    submittedBy: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(
        `피평가자가 1차 평가자에게 자기평가 제출 시작 - ID: ${wbsSelfEvaluation.id}`,
      );

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      // 피평가자가 1차 평가자에게 제출
      wbsSelfEvaluation.피평가자가_1차평가자에게_제출한다();
      // 메타데이터 업데이트 (updatedBy 설정, updatedAt은 @UpdateDateColumn이 자동 처리)
      wbsSelfEvaluation.수정자를_설정한다(submittedBy);

      // TypeORM 변경 감지를 위해 명시적으로 저장
      const saved = await repository.save(wbsSelfEvaluation);

      this.logger.log(
        `피평가자가 1차 평가자에게 자기평가 제출 완료 - ID: ${wbsSelfEvaluation.id}`,
      );
      return saved;
    }, '피평가자가_1차평가자에게_제출한다');
  }

  /**
   * 1차 평가자가 관리자에게 제출한다
   * 엔티티를 파라미터로 받아 처리합니다.
   * 관리자에게 제출할 때는 평가자에게도 자동으로 제출한 것으로 처리됩니다.
   */
  async 일차평가자가_관리자에게_제출한다(
    wbsSelfEvaluation: WbsSelfEvaluation,
    submittedBy: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(
        `1차 평가자가 관리자에게 자기평가 제출 시작 - ID: ${wbsSelfEvaluation.id}`,
      );

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      // 1차 평가자가 관리자에게 제출
      // (관리자에게 제출할 때는 평가자에게도 자동으로 제출한 것으로 처리됨)
      wbsSelfEvaluation.일차평가자가_관리자에게_제출한다();
      // 메타데이터 업데이트 (updatedBy 설정, updatedAt은 @UpdateDateColumn이 자동 처리)
      wbsSelfEvaluation.수정자를_설정한다(submittedBy);

      // TypeORM 변경 감지를 위해 명시적으로 저장
      const saved = await repository.save(wbsSelfEvaluation);

      this.logger.log(
        `1차 평가자가 관리자에게 자기평가 제출 완료 - ID: ${wbsSelfEvaluation.id}`,
      );
      return saved;
    }, '일차평가자가_관리자에게_제출한다');
  }

  /**
   * 피평가자가 1차 평가자에게 제출한 것을 취소한다
   */
  async 피평가자가_1차평가자에게_제출한_것을_취소한다(
    id: string,
    resetBy: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(
        `피평가자가 1차 평가자에게 제출한 것을 취소 시작 - ID: ${id}`,
      );

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      const wbsSelfEvaluation = await repository.findOne({ where: { id } });
      if (!wbsSelfEvaluation) {
        throw new WbsSelfEvaluationNotFoundException(id);
      }

      // 이미 미제출 상태면 에러
      if (!wbsSelfEvaluation.피평가자가_1차평가자에게_제출했는가()) {
        throw new WbsSelfEvaluationValidationException(
          '이미 1차 평가자에게 미제출 상태인 자기평가입니다.',
        );
      }

      // 피평가자 제출 취소
      wbsSelfEvaluation.피평가자_제출을_취소한다();
      wbsSelfEvaluation.메타데이터를_업데이트한다(resetBy);

      const saved = await repository.save(wbsSelfEvaluation);

      this.logger.log(
        `피평가자가 1차 평가자에게 제출한 것을 취소 완료 - ID: ${id}`,
      );
      return saved;
    }, '피평가자가_1차평가자에게_제출한_것을_취소한다');
  }

  /**
   * WBS 자가평가를 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(`WBS 자가평가 삭제 시작 - ID: ${id}`);

      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      const wbsSelfEvaluation = await repository.findOne({ where: { id } });
      if (!wbsSelfEvaluation) {
        throw new WbsSelfEvaluationNotFoundException(id);
      }

      wbsSelfEvaluation.메타데이터를_업데이트한다(deletedBy);
      wbsSelfEvaluation.삭제한다();

      await repository.save(wbsSelfEvaluation);

      this.logger.log(`WBS 자가평가 삭제 완료 - ID: ${id}`);
    }, '삭제한다');
  }

  /**
   * WBS 자가평가를 조회한다
   */
  async 조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      return await repository.findOne({ where: { id } });
    }, '조회한다');
  }

  /**
   * 필터로 WBS 자가평가 목록을 조회한다
   */
  async 필터_조회한다(
    filter: WbsSelfEvaluationFilter,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        WbsSelfEvaluation,
        this.wbsSelfEvaluationRepository,
        manager,
      );

      let queryBuilder = repository.createQueryBuilder('evaluation');

      // Soft Delete 필터 (삭제되지 않은 항목만 조회)
      queryBuilder.andWhere('evaluation.deletedAt IS NULL');

      // 필터 적용
      if (filter.periodId) {
        queryBuilder.andWhere('evaluation.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.employeeId) {
        queryBuilder.andWhere('evaluation.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.wbsItemId) {
        queryBuilder.andWhere('evaluation.wbsItemId = :wbsItemId', {
          wbsItemId: filter.wbsItemId,
        });
      }

      if (filter.assignedBy) {
        queryBuilder.andWhere('evaluation.assignedBy = :assignedBy', {
          assignedBy: filter.assignedBy,
        });
      }

      if (filter.submittedToEvaluatorOnly) {
        queryBuilder.andWhere(
          'evaluation.submittedToEvaluator = :submittedToEvaluator',
          {
            submittedToEvaluator: true,
          },
        );
      }

      if (filter.notSubmittedToEvaluatorOnly) {
        queryBuilder.andWhere(
          'evaluation.submittedToEvaluator = :submittedToEvaluator',
          {
            submittedToEvaluator: false,
          },
        );
      }

      if (filter.submittedToManagerOnly) {
        queryBuilder.andWhere(
          'evaluation.submittedToManager = :submittedToManager',
          {
            submittedToManager: true,
          },
        );
      }

      if (filter.notSubmittedToManagerOnly) {
        queryBuilder.andWhere(
          'evaluation.submittedToManager = :submittedToManager',
          {
            submittedToManager: false,
          },
        );
      }

      if (filter.assignedDateFrom) {
        queryBuilder.andWhere('evaluation.assignedDate >= :assignedDateFrom', {
          assignedDateFrom: filter.assignedDateFrom,
        });
      }

      if (filter.assignedDateTo) {
        queryBuilder.andWhere('evaluation.assignedDate <= :assignedDateTo', {
          assignedDateTo: filter.assignedDateTo,
        });
      }

      if (filter.submittedToEvaluatorDateFrom) {
        queryBuilder.andWhere(
          'evaluation.submittedToEvaluatorAt >= :submittedToEvaluatorDateFrom',
          {
            submittedToEvaluatorDateFrom: filter.submittedToEvaluatorDateFrom,
          },
        );
      }

      if (filter.submittedToEvaluatorDateTo) {
        queryBuilder.andWhere(
          'evaluation.submittedToEvaluatorAt <= :submittedToEvaluatorDateTo',
          {
            submittedToEvaluatorDateTo: filter.submittedToEvaluatorDateTo,
          },
        );
      }

      if (filter.submittedToManagerDateFrom) {
        queryBuilder.andWhere(
          'evaluation.submittedToManagerAt >= :submittedToManagerDateFrom',
          {
            submittedToManagerDateFrom: filter.submittedToManagerDateFrom,
          },
        );
      }

      if (filter.submittedToManagerDateTo) {
        queryBuilder.andWhere(
          'evaluation.submittedToManagerAt <= :submittedToManagerDateTo',
          {
            submittedToManagerDateTo: filter.submittedToManagerDateTo,
          },
        );
      }

      if (filter.evaluationDateFrom) {
        queryBuilder.andWhere(
          'evaluation.evaluationDate >= :evaluationDateFrom',
          {
            evaluationDateFrom: filter.evaluationDateFrom,
          },
        );
      }

      if (filter.evaluationDateTo) {
        queryBuilder.andWhere(
          'evaluation.evaluationDate <= :evaluationDateTo',
          {
            evaluationDateTo: filter.evaluationDateTo,
          },
        );
      }

      if (filter.scoreFrom !== undefined) {
        queryBuilder.andWhere('evaluation.selfEvaluationScore >= :scoreFrom', {
          scoreFrom: filter.scoreFrom,
        });
      }

      if (filter.scoreTo !== undefined) {
        queryBuilder.andWhere('evaluation.selfEvaluationScore <= :scoreTo', {
          scoreTo: filter.scoreTo,
        });
      }

      // 정렬
      const orderBy = filter.orderBy || 'evaluationDate';
      const orderDirection = filter.orderDirection || 'DESC';
      queryBuilder.orderBy(`evaluation.${orderBy}`, orderDirection);

      // 페이지네이션
      if (filter.page && filter.limit) {
        const offset = (filter.page - 1) * filter.limit;
        queryBuilder.skip(offset).take(filter.limit);
      }

      return await queryBuilder.getMany();
    }, '필터_조회한다');
  }

  /**
   * 평가기간별 WBS 자가평가 목록을 조회한다
   */
  async 평가기간별_조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation[]> {
    return this.필터_조회한다({ periodId }, manager);
  }

  /**
   * 직원별 WBS 자가평가 목록을 조회한다
   */
  async 직원별_조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation[]> {
    return this.필터_조회한다({ employeeId }, manager);
  }

  /**
   * WBS 항목별 자가평가 목록을 조회한다
   */
  async WBS항목별_조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation[]> {
    return this.필터_조회한다({ wbsItemId }, manager);
  }

  /**
   * 중복 검사를 수행한다
   */
  private async 중복_검사를_수행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    repository: Repository<WbsSelfEvaluation>,
  ): Promise<void> {
    const existing = await repository.findOne({
      where: {
        periodId,
        employeeId,
        wbsItemId,
      },
    });

    if (existing) {
      throw new DuplicateWbsSelfEvaluationException(
        periodId,
        employeeId,
        wbsItemId,
      );
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateWbsSelfEvaluationData): void {
    if (!data.periodId?.trim()) {
      throw new WbsSelfEvaluationValidationException(
        '평가 기간 ID는 필수입니다.',
      );
    }

    if (!data.employeeId?.trim()) {
      throw new WbsSelfEvaluationValidationException('직원 ID는 필수입니다.');
    }

    if (!data.wbsItemId?.trim()) {
      throw new WbsSelfEvaluationValidationException(
        'WBS 항목 ID는 필수입니다.',
      );
    }

    if (!data.assignedBy?.trim()) {
      throw new WbsSelfEvaluationValidationException('할당자 ID는 필수입니다.');
    }

    // selfEvaluationContent와 selfEvaluationScore는 선택사항
    // 점수가 제공된 경우에만 유효성 검사
    if (
      data.selfEvaluationScore !== undefined &&
      data.selfEvaluationScore !== null
    ) {
      this.점수_유효성을_검사한다(data.selfEvaluationScore);
    }
  }

  /**
   * 점수 유효성을 검사한다 (최소값만 검증, 최대값은 Command Handler에서 검증)
   */
  private 점수_유효성을_검사한다(score: number): void {
    if (score < 0) {
      throw new WbsSelfEvaluationValidationException(
        '자가평가 점수는 0 이상이어야 합니다.',
      );
    }
  }

  /**
   * WBS 자가평가 내용을 초기화한다 (단일)
   */
  async 내용을_초기화한다(
    evaluationId: string,
    updatedBy?: string,
    manager?: EntityManager,
  ): Promise<WbsSelfEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.log(`WBS 자가평가 내용 초기화 시작: ${evaluationId}`);

      const repository = manager
        ? manager.getRepository(WbsSelfEvaluation)
        : this.wbsSelfEvaluationRepository;

      const evaluation = await repository.findOne({
        where: { id: evaluationId },
      });

      if (!evaluation) {
        throw new WbsSelfEvaluationNotFoundException(evaluationId);
      }

      evaluation.자가평가_내용을_초기화한다(updatedBy);

      const saved = await repository.save(evaluation);

      this.logger.log(`WBS 자가평가 내용 초기화 완료: ${evaluationId}`);
      return saved;
    }, 'WBS 자가평가 내용 초기화');
  }
}
