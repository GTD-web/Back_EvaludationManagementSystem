import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from './evaluation-period-employee-mapping.entity';
import {
  EvaluationPeriodEmployeeMappingNotFoundException,
  EvaluationPeriodEmployeeMappingValidationException,
  EvaluationPeriodEmployeeMappingDuplicateException,
  AlreadyExcludedEvaluationTargetException,
  NotExcludedEvaluationTargetException,
} from './evaluation-period-employee-mapping.exceptions';
import type {
  CreateEvaluationPeriodEmployeeMappingData,
  EvaluationPeriodEmployeeMappingFilter,
  ExcludeEvaluationTargetData,
  IncludeEvaluationTargetData,
} from './interfaces/evaluation-period-employee-mapping.interface';
import type { EvaluationPeriodEmployeeMappingDto } from './evaluation-period-employee-mapping.types';
import { IEvaluationPeriodEmployeeMappingService } from './interfaces/evaluation-period-employee-mapping-service.interface';

/**
 * 평가기간-직원 맵핑 서비스
 * 평가기간별 평가 대상자 관리 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EvaluationPeriodEmployeeMappingService
  implements IEvaluationPeriodEmployeeMappingService
{
  private readonly logger = new Logger(
    EvaluationPeriodEmployeeMappingService.name,
  );

  constructor(
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly repository: Repository<EvaluationPeriodEmployeeMapping>,
  ) {}

  /**
   * 평가 대상자를 등록한다
   */
  async 평가대상자를_등록한다(
    data: CreateEvaluationPeriodEmployeeMappingData,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    this.logger.log(
      `평가 대상자 등록 시작 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}`,
    );

    // 유효성 검사
    this.유효성을_검사한다(data);

    // 소프트 삭제된 레코드 확인 및 복구
    const softDeletedMapping = await this.repository.findOne({
      where: {
        evaluationPeriodId: data.evaluationPeriodId,
        employeeId: data.employeeId,
      },
      withDeleted: true, // 소프트 삭제된 레코드도 조회
    });

    if (softDeletedMapping && softDeletedMapping.deletedAt) {
      // 소프트 삭제된 레코드가 있으면 복구
      this.logger.log(
        `소프트 삭제된 매핑 복구 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}`,
      );
      // TypeORM의 restore 메서드를 사용하여 복구
      await this.repository.restore(softDeletedMapping.id);
      // 복구 후 엔티티를 다시 조회하여 최신 상태 확인
      const restored = await this.repository.findOne({
        where: { id: softDeletedMapping.id },
      });
      if (!restored) {
        throw new Error(
          `매핑 복구 후 조회 실패 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}`,
        );
      }
      // 메타데이터 업데이트
      restored.메타데이터를_업데이트한다(data.createdBy);
      const saved = await this.repository.save(restored);
      this.logger.log(`평가 대상자 복구 완료 - ID: ${saved.id}`);
      return saved.DTO로_변환한다();
    }

    // 중복 검사 (활성 레코드만 확인)
    await this.중복_검사를_수행한다(data.evaluationPeriodId, data.employeeId);

    try {
      const mapping = new EvaluationPeriodEmployeeMapping(data);
      const saved = await this.repository.save(mapping);

      this.logger.log(`평가 대상자 등록 완료 - ID: ${saved.id}`);
      return saved.DTO로_변환한다();
    } catch (error) {
      this.logger.error(
        `평가 대상자 등록 실패 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가 대상자를 대량 등록한다
   */
  async 평가대상자를_대량_등록한다(
    evaluationPeriodId: string,
    employeeIds: string[],
    createdBy: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    this.logger.log(
      `평가 대상자 대량 등록 시작 - 평가기간: ${evaluationPeriodId}, 직원 수: ${employeeIds.length}`,
    );

    if (!employeeIds || employeeIds.length === 0) {
      throw new EvaluationPeriodEmployeeMappingValidationException(
        '등록할 직원 ID가 없습니다.',
      );
    }

    try {
      // 배열 내 중복 제거
      const uniqueEmployeeIds = Array.from(new Set(employeeIds));

      // 기존 맵핑 조회
      const existingMappings = await this.repository.find({
        where: {
          evaluationPeriodId,
          employeeId: In(uniqueEmployeeIds),
        },
      });

      const existingEmployeeIds = new Set(
        existingMappings.map((m) => m.employeeId),
      );

      // 신규 등록할 직원 ID 필터링
      const newEmployeeIds = uniqueEmployeeIds.filter(
        (id) => !existingEmployeeIds.has(id),
      );

      if (newEmployeeIds.length === 0) {
        this.logger.log('모든 직원이 이미 등록되어 있습니다.');
        return existingMappings.map((m) => m.DTO로_변환한다());
      }

      // 신규 맵핑 생성
      const newMappings = newEmployeeIds.map(
        (employeeId) =>
          new EvaluationPeriodEmployeeMapping({
            evaluationPeriodId,
            employeeId,
            createdBy,
          }),
      );

      const savedMappings = await this.repository.save(newMappings);

      this.logger.log(
        `평가 대상자 대량 등록 완료 - 신규: ${savedMappings.length}개, 기존: ${existingMappings.length}개`,
      );

      return [...existingMappings, ...savedMappings].map((m) =>
        m.DTO로_변환한다(),
      );
    } catch (error) {
      this.logger.error(
        `평가 대상자 대량 등록 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가 대상에서 제외한다
   */
  async 평가대상에서_제외한다(
    evaluationPeriodId: string,
    employeeId: string,
    data: ExcludeEvaluationTargetData,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    this.logger.log(
      `평가 대상 제외 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
    if (!mapping) {
      throw new EvaluationPeriodEmployeeMappingNotFoundException(
        `평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
    }

    if (mapping.제외되었는가()) {
      throw new AlreadyExcludedEvaluationTargetException(
        evaluationPeriodId,
        employeeId,
      );
    }

    try {
      mapping.평가대상에서_제외한다(data.excludeReason, data.excludedBy);
      const saved = await this.repository.save(mapping);

      this.logger.log(
        `평가 대상 제외 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
      return saved.DTO로_변환한다();
    } catch (error) {
      this.logger.error(
        `평가 대상 제외 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가 대상에 포함한다
   */
  async 평가대상에_포함한다(
    evaluationPeriodId: string,
    employeeId: string,
    data: IncludeEvaluationTargetData,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    this.logger.log(
      `평가 대상 포함 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
    if (!mapping) {
      throw new EvaluationPeriodEmployeeMappingNotFoundException(
        `평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
    }

    if (!mapping.제외되었는가()) {
      throw new NotExcludedEvaluationTargetException(
        evaluationPeriodId,
        employeeId,
      );
    }

    try {
      mapping.평가대상에_포함한다(data.updatedBy);
      const saved = await this.repository.save(mapping);

      this.logger.log(
        `평가 대상 포함 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
      return saved.DTO로_변환한다();
    } catch (error) {
      this.logger.error(
        `평가 대상 포함 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가기간의 평가대상자를 조회한다
   */
  async 평가기간의_평가대상자를_조회한다(
    evaluationPeriodId: string,
    includeExcluded: boolean = false,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    this.logger.debug(
      `평가기간 평가대상자 조회 - 평가기간: ${evaluationPeriodId}, 제외자 포함: ${includeExcluded}`,
    );

    try {
      return await this.필터로_평가대상자를_조회한다({
        evaluationPeriodId,
        includeExcluded,
      });
    } catch (error) {
      this.logger.error(
        `평가기간 평가대상자 조회 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가기간의 제외된 대상자를 조회한다
   */
  async 평가기간의_제외된_대상자를_조회한다(
    evaluationPeriodId: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    this.logger.debug(
      `평가기간 제외 대상자 조회 - 평가기간: ${evaluationPeriodId}`,
    );

    try {
      return await this.필터로_평가대상자를_조회한다({
        evaluationPeriodId,
        excludedOnly: true,
      });
    } catch (error) {
      this.logger.error(
        `평가기간 제외 대상자 조회 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 직원의 평가기간 맵핑을 조회한다
   */
  async 직원의_평가기간_맵핑을_조회한다(
    employeeId: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    this.logger.debug(`직원 평가기간 맵핑 조회 - 직원: ${employeeId}`);

    try {
      return await this.필터로_평가대상자를_조회한다({
        employeeId,
        includeExcluded: true, // 제외된 맵핑도 포함하여 조회
      });
    } catch (error) {
      this.logger.error(
        `직원 평가기간 맵핑 조회 실패 - 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가대상 여부를 확인한다
   */
  async 평가대상_여부를_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<boolean> {
    this.logger.debug(
      `평가 대상 여부 확인 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      const mapping = await this.맵핑을_조회한다(
        evaluationPeriodId,
        employeeId,
      );
      return mapping ? mapping.평가대상인가() : false;
    } catch (error) {
      this.logger.error(
        `평가 대상 여부 확인 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가대상자 등록을 해제한다
   */
  async 평가대상자_등록을_해제한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<boolean> {
    this.logger.log(
      `평가 대상자 등록 해제 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
    if (!mapping) {
      throw new EvaluationPeriodEmployeeMappingNotFoundException(
        `평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
    }

    try {
      mapping.삭제한다();
      await this.repository.save(mapping);

      this.logger.log(
        `평가 대상자 등록 해제 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `평가 대상자 등록 해제 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가기간의 모든 대상자를 해제한다
   */
  async 평가기간의_모든_대상자를_해제한다(
    evaluationPeriodId: string,
  ): Promise<number> {
    this.logger.log(
      `평가기간 전체 대상자 해제 시작 - 평가기간: ${evaluationPeriodId}`,
    );

    try {
      const result = await this.repository
        .createQueryBuilder()
        .softDelete()
        .where('evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('deletedAt IS NULL')
        .execute();

      const deletedCount = result.affected || 0;
      this.logger.log(
        `평가기간 전체 대상자 해제 완료 - 평가기간: ${evaluationPeriodId}, 삭제 수: ${deletedCount}`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `평가기간 전체 대상자 해제 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 필터로 평가대상자를 조회한다
   */
  async 필터로_평가대상자를_조회한다(
    filter: EvaluationPeriodEmployeeMappingFilter,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    this.logger.debug(
      `평가 대상자 필터 조회 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      let queryBuilder = this.repository.createQueryBuilder('mapping');

      // 삭제되지 않은 항목만 조회
      queryBuilder.where('mapping.deletedAt IS NULL');

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

      // 제외 여부 필터
      if (filter.excludedOnly) {
        queryBuilder.andWhere('mapping.isExcluded = :isExcluded', {
          isExcluded: true,
        });
      } else if (!filter.includeExcluded) {
        queryBuilder.andWhere('mapping.isExcluded = :isExcluded', {
          isExcluded: false,
        });
      }

      if (filter.excludedBy) {
        queryBuilder.andWhere('mapping.excludedBy = :excludedBy', {
          excludedBy: filter.excludedBy,
        });
      }

      // 제외 일시 필터
      if (filter.excludedAtFrom) {
        queryBuilder.andWhere('mapping.excludedAt >= :excludedAtFrom', {
          excludedAtFrom: filter.excludedAtFrom,
        });
      }

      if (filter.excludedAtTo) {
        queryBuilder.andWhere('mapping.excludedAt <= :excludedAtTo', {
          excludedAtTo: filter.excludedAtTo,
        });
      }

      // 정렬
      const orderBy = filter.orderBy || 'createdAt';
      const orderDirection = filter.orderDirection || 'DESC';
      queryBuilder.orderBy(`mapping.${orderBy}`, orderDirection);

      // 페이지네이션
      if (filter.page && filter.limit) {
        const offset = (filter.page - 1) * filter.limit;
        queryBuilder.skip(offset).take(filter.limit);
      }

      const mappings = await queryBuilder.getMany();
      return mappings.map((m) => m.DTO로_변환한다());
    } catch (error) {
      this.logger.error(
        `평가 대상자 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 맵핑을 조회한다 (private)
   */
  private async 맵핑을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<EvaluationPeriodEmployeeMapping | null> {
    try {
      return await this.repository.findOne({
        where: { evaluationPeriodId, employeeId },
      });
    } catch (error) {
      this.logger.error(
        `맵핑 조회 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가기간별 모든 평가 대상자의 수정 가능 상태를 일괄 변경한다
   *
   * 주의: 엔티티 필드가 삭제되었으므로 이 메서드는 실제로 아무 작업도 수행하지 않습니다.
   * 평가기간별 일괄 변경 기능과의 호환성을 위해 유지됩니다.
   */
  async 평가기간별_모든_평가_수정_가능_상태를_변경한다(
    evaluationPeriodId: string,
    isSelfEvaluationEditable: boolean,
    isPrimaryEvaluationEditable: boolean,
    isSecondaryEvaluationEditable: boolean,
    updatedBy: string,
  ): Promise<number> {
    this.logger.log(
      `평가기간별 모든 평가 수정 가능 상태 일괄 변경 시작 - 평가기간: ${evaluationPeriodId}`,
    );

    try {
      // 엔티티 필드가 삭제되었으므로 실제 작업은 수행하지 않음
      const mappings = await this.repository.find({
        where: { evaluationPeriodId },
      });

      this.logger.log(
        `평가기간별 모든 평가 수정 가능 상태 일괄 변경 완료 - 평가기간: ${evaluationPeriodId}, 변경 수: ${mappings.length} (실제 변경 없음)`,
      );

      return mappings.length;
    } catch (error) {
      this.logger.error(
        `평가기간별 모든 평가 수정 가능 상태 일괄 변경 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 중복 검사를 수행한다
   */
  private async 중복_검사를_수행한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<void> {
    const existing = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);

    if (existing) {
      throw new EvaluationPeriodEmployeeMappingDuplicateException(
        evaluationPeriodId,
        employeeId,
      );
    }
  }

  /**
   * 평가기준을 제출한다
   */
  async 평가기준을_제출한다(
    evaluationPeriodId: string,
    employeeId: string,
    submittedBy: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
    if (!mapping) {
      throw new EvaluationPeriodEmployeeMappingNotFoundException(
        `평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
    }

    if (mapping.평가기준이_제출되었는가()) {
      this.logger.warn(
        `이미 제출된 평가기준 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
      // 이미 제출된 경우에도 성공으로 처리 (멱등성 보장)
      return mapping.DTO로_변환한다();
    }

    try {
      mapping.평가기준을_제출한다(submittedBy);
      const saved = await this.repository.save(mapping);

      return saved.DTO로_변환한다();
    } catch (error) {
      this.logger.error(
        `평가기준 제출 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 평가기준 제출을 초기화한다
   */
  async 평가기준_제출을_초기화한다(
    evaluationPeriodId: string,
    employeeId: string,
    updatedBy: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
    if (!mapping) {
      throw new EvaluationPeriodEmployeeMappingNotFoundException(
        `평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
    }

    if (!mapping.평가기준이_제출되었는가()) {
      this.logger.warn(
        `제출되지 않은 평가기준 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );
      // 제출되지 않은 경우에도 성공으로 처리 (멱등성 보장)
      return mapping.DTO로_변환한다();
    }

    try {
      mapping.평가기준_제출을_초기화한다(updatedBy);
      const saved = await this.repository.save(mapping);

      return saved.DTO로_변환한다();
    } catch (error) {
      this.logger.error(
        `평가기준 제출 초기화 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(
    data: CreateEvaluationPeriodEmployeeMappingData,
  ): void {
    if (!data.evaluationPeriodId) {
      throw new EvaluationPeriodEmployeeMappingValidationException(
        '평가기간 ID는 필수입니다.',
      );
    }

    if (!data.employeeId) {
      throw new EvaluationPeriodEmployeeMappingValidationException(
        '직원 ID는 필수입니다.',
      );
    }

    if (!data.createdBy) {
      throw new EvaluationPeriodEmployeeMappingValidationException(
        '생성자 ID는 필수입니다.',
      );
    }
  }
}
