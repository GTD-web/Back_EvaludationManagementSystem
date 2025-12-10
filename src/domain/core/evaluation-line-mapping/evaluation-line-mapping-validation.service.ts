import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EvaluationLineMapping } from './evaluation-line-mapping.entity';
import {
  EvaluationLineMappingBusinessRuleViolationException,
  EvaluationLineMappingDuplicateException,
  EvaluationLineMappingRequiredDataMissingException,
  InvalidEvaluationLineMappingDataFormatException,
} from './evaluation-line-mapping.exceptions';
import {
  CreateEvaluationLineMappingData,
  UpdateEvaluationLineMappingData,
} from './evaluation-line-mapping.types';

/**
 * 평가 라인 맵핑 유효성 검증 서비스 (MVP 버전)
 * 평가 라인 맵핑 관련 비즈니스 규칙과 데이터 유효성을 검증합니다.
 */
@Injectable()
export class EvaluationLineMappingValidationService {
  private readonly logger = new Logger(
    EvaluationLineMappingValidationService.name,
  );

  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * 평가 라인 맵핑 생성 데이터를 검증한다
   */
  async 생성데이터검증한다(
    createData: CreateEvaluationLineMappingData,
    manager?: EntityManager,
  ): Promise<void> {
    // 필수 데이터 검증
    this.필수데이터검증한다(createData);

    // 데이터 형식 검증
    this.데이터형식검증한다(createData);

    // 비즈니스 규칙 검증
    await this.비즈니스규칙검증한다(createData, manager);

    // 중복 검증
    await this.중복검증한다(createData, manager);

    // 참조 무결성 검증
    await this.참조무결성검증한다(createData, manager);
  }

  /**
   * 평가 라인 맵핑 업데이트 데이터를 검증한다
   */
  async 업데이트데이터검증한다(
    id: string,
    updateData: UpdateEvaluationLineMappingData,
    manager?: EntityManager,
  ): Promise<void> {
    this.logger.debug(`평가 라인 맵핑 업데이트 데이터 검증 시작 - ID: ${id}`);

    // 업데이트할 데이터가 있는지 확인
    if (Object.keys(updateData).length === 0) {
      throw new EvaluationLineMappingRequiredDataMissingException(
        '업데이트할 데이터가 없습니다.',
      );
    }

    // 데이터 형식 검증 (업데이트 데이터만)
    this.업데이트데이터형식검증한다(updateData);

    // 참조 무결성 검증은 외부에서 처리됨 (의존성 제거)
    // 평가 라인 ID가 제공되면 유효한 UUID인지만 확인
    if (updateData.evaluationLineId !== undefined) {
      // UUID 형식 검증은 이미 상위에서 수행됨
    }

    this.logger.debug(`평가 라인 맵핑 업데이트 데이터 검증 완료 - ID: ${id}`);
  }

  /**
   * 필수 데이터를 검증한다
   */
  private 필수데이터검증한다(
    createData: CreateEvaluationLineMappingData,
  ): void {
    if (!createData.evaluationPeriodId) {
      throw new EvaluationLineMappingRequiredDataMissingException(
        '평가기간 ID는 필수입니다.',
      );
    }

    if (!createData.employeeId) {
      throw new EvaluationLineMappingRequiredDataMissingException(
        '피평가자 ID는 필수입니다.',
      );
    }

    if (!createData.evaluatorId) {
      throw new EvaluationLineMappingRequiredDataMissingException(
        '평가자 ID는 필수입니다.',
      );
    }

    if (!createData.evaluationLineId) {
      throw new EvaluationLineMappingRequiredDataMissingException(
        '평가 라인 ID는 필수입니다.',
      );
    }
  }

  /**
   * 데이터 형식을 검증한다
   */
  private 데이터형식검증한다(
    createData: CreateEvaluationLineMappingData,
  ): void {
    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(createData.evaluationPeriodId)) {
      throw new InvalidEvaluationLineMappingDataFormatException(
        '평가기간 ID는 유효한 UUID 형식이어야 합니다.',
      );
    }

    if (!uuidRegex.test(createData.employeeId)) {
      throw new InvalidEvaluationLineMappingDataFormatException(
        '피평가자 ID는 유효한 UUID 형식이어야 합니다.',
      );
    }

    if (!uuidRegex.test(createData.evaluatorId)) {
      throw new InvalidEvaluationLineMappingDataFormatException(
        '평가자 ID는 유효한 UUID 형식이어야 합니다.',
      );
    }

    if (!uuidRegex.test(createData.evaluationLineId)) {
      throw new InvalidEvaluationLineMappingDataFormatException(
        '평가 라인 ID는 유효한 UUID 형식이어야 합니다.',
      );
    }

    if (createData.wbsItemId && !uuidRegex.test(createData.wbsItemId)) {
      throw new InvalidEvaluationLineMappingDataFormatException(
        'WBS 항목 ID는 유효한 UUID 형식이어야 합니다.',
      );
    }
  }

  /**
   * 업데이트 데이터 형식을 검증한다
   */
  private 업데이트데이터형식검증한다(
    updateData: UpdateEvaluationLineMappingData,
  ): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      updateData.evaluationLineId !== undefined &&
      !uuidRegex.test(updateData.evaluationLineId)
    ) {
      throw new InvalidEvaluationLineMappingDataFormatException(
        '평가 라인 ID는 유효한 UUID 형식이어야 합니다.',
      );
    }

    if (
      updateData.wbsItemId !== undefined &&
      updateData.wbsItemId !== null &&
      !uuidRegex.test(updateData.wbsItemId)
    ) {
      throw new InvalidEvaluationLineMappingDataFormatException(
        'WBS 항목 ID는 유효한 UUID 형식이어야 합니다.',
      );
    }
  }

  /**
   * 비즈니스 규칙을 검증한다
   */
  private async 비즈니스규칙검증한다(
    createData: CreateEvaluationLineMappingData,
    manager?: EntityManager,
  ): Promise<void> {
    // 비즈니스 제약 조건 제거: 자기 자신을 평가할 수 있도록 허용
    // if (createData.employeeId === createData.evaluatorId) {
    //   throw new EvaluationLineMappingBusinessRuleViolationException(
    //     '자기 자신을 평가할 수 없습니다.',
    //   );
    // }
    // 추가적인 비즈니스 규칙이 있다면 여기에 추가
  }

  /**
   * 중복을 검증한다
   */
  private async 중복검증한다(
    createData: CreateEvaluationLineMappingData,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      EvaluationLineMapping,
      this.evaluationLineMappingRepository,
      manager,
    );

    let queryBuilder = repository
      .createQueryBuilder('mapping')
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId: createData.evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', {
        employeeId: createData.employeeId,
      })
      .andWhere('mapping.evaluatorId = :evaluatorId', {
        evaluatorId: createData.evaluatorId,
      })
      .andWhere('mapping.evaluationLineId = :evaluationLineId', {
        evaluationLineId: createData.evaluationLineId,
      });

    if (createData.wbsItemId) {
      queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', {
        wbsItemId: createData.wbsItemId,
      });
    } else {
      queryBuilder.andWhere('mapping.wbsItemId IS NULL');
    }

    const existingMapping = await queryBuilder.getOne();

    if (existingMapping) {
      throw new EvaluationLineMappingDuplicateException(
        '동일한 평가 관계가 이미 존재합니다.',
      );
    }
  }

  /**
   * 참조 무결성을 검증한다
   */
  private async 참조무결성검증한다(
    createData: CreateEvaluationLineMappingData,
    manager?: EntityManager,
  ): Promise<void> {
    // 참조 무결성 검증은 외부에서 처리됨 (의존성 제거)
    // 평가 라인 ID는 UUID 형식 검증만 수행됨
  }

  /**
   * 평가 라인 맵핑 존재 여부를 확인한다
   */
  async 맵핑존재확인한다(
    id: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.transactionManager.getRepository(
      EvaluationLineMapping,
      this.evaluationLineMappingRepository,
      manager,
    );

    const count = await repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * 평가 관계 존재 여부를 확인한다
   */
  async 평가관계존재확인한다(
    employeeId: string,
    evaluatorId: string,
    wbsItemId?: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository = this.transactionManager.getRepository(
      EvaluationLineMapping,
      this.evaluationLineMappingRepository,
      manager,
    );

    let queryBuilder = repository
      .createQueryBuilder('mapping')
      .where('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId });

    if (wbsItemId) {
      queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', { wbsItemId });
    } else {
      queryBuilder.andWhere('mapping.wbsItemId IS NULL');
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }
}
