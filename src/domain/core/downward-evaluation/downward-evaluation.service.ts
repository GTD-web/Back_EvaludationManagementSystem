import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from './downward-evaluation.entity';
import {
  DownwardEvaluationNotFoundException,
  DownwardEvaluationValidationException,
  DownwardEvaluationDuplicateException,
} from './downward-evaluation.exceptions';
import type {
  CreateDownwardEvaluationData,
  UpdateDownwardEvaluationData,
  DownwardEvaluationFilter,
} from './downward-evaluation.types';
import { DownwardEvaluationType } from './downward-evaluation.types';

/**
 * 하향평가 서비스
 * 하향평가 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class DownwardEvaluationService {
  private readonly logger = new Logger(DownwardEvaluationService.name);

  constructor(
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
  ) {}

  /**
   * 하향평가를 생성한다
   */
  async 생성한다(
    createData: CreateDownwardEvaluationData,
  ): Promise<DownwardEvaluation> {
    this.logger.log(
      `하향평가 생성 시작 - 피평가자: ${createData.employeeId}, 평가자: ${createData.evaluatorId}, 유형: ${createData.evaluationType}`,
    );

    // 중복 검사 (wbsId 포함)
    await this.중복_검사를_수행한다(
      createData.employeeId,
      createData.evaluatorId,
      createData.periodId,
      createData.evaluationType,
      createData.wbsId,
    );

    // 유효성 검사
    this.유효성을_검사한다(createData);

    try {
      const downwardEvaluation = new DownwardEvaluation(createData);
      const saved =
        await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 생성 완료 - ID: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `하향평가 생성 실패 - 유형: ${createData.evaluationType}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 하향평가를 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateDownwardEvaluationData,
    updatedBy: string,
  ): Promise<DownwardEvaluation> {
    this.logger.log(`하향평가 수정 시작 - ID: ${id}`);

    const downwardEvaluation = await this.조회한다(id);
    if (!downwardEvaluation) {
      throw new DownwardEvaluationNotFoundException(id);
    }

    try {
      // 평가자 ID 수정 (잘못된 평가자 ID 수정용)
      if (updateData.evaluatorId !== undefined) {
        downwardEvaluation.evaluatorId = updateData.evaluatorId;
        downwardEvaluation.메타데이터를_업데이트한다(updatedBy);
      }

      downwardEvaluation.하향평가를_수정한다(
        updateData.downwardEvaluationContent,
        updateData.downwardEvaluationScore,
        updatedBy,
      );

      // 완료 상태 변경 처리
      if (updateData.isCompleted !== undefined) {
        if (updateData.isCompleted) {
          downwardEvaluation.평가를_완료한다(updatedBy);
        } else {
          downwardEvaluation.isCompleted = false;
          downwardEvaluation.completedAt = undefined;
          downwardEvaluation.메타데이터를_업데이트한다(updatedBy);
        }
      }

      // 자기평가 연결/해제 처리
      if (updateData.selfEvaluationId !== undefined) {
        if (updateData.selfEvaluationId) {
          downwardEvaluation.자기평가를_연결한다(
            updateData.selfEvaluationId,
            updatedBy,
          );
        } else {
          downwardEvaluation.자기평가_연결을_해제한다(updatedBy);
        }
      }

      const saved =
        await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 수정 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`하향평가 수정 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 하향평가를 삭제한다 (soft delete)
   */
  async 삭제한다(id: string, deletedBy: string): Promise<void> {
    this.logger.log(`하향평가 삭제 시작 - ID: ${id}`);

    const downwardEvaluation = await this.조회한다(id);
    if (!downwardEvaluation) {
      throw new DownwardEvaluationNotFoundException(id);
    }

    try {
      downwardEvaluation.메타데이터를_업데이트한다(deletedBy);
      downwardEvaluation.삭제한다();

      await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`하향평가 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 하향평가를 완전히 제거한다 (hard delete)
   * 평가자 변경 시 기존 평가자의 하향평가를 완전히 제거하는 용도로 사용
   */
  async 완전_삭제한다(id: string): Promise<void> {
    this.logger.log(`하향평가 완전 삭제 시작 - ID: ${id}`);

    try {
      const result = await this.downwardEvaluationRepository.delete(id);

      if (result.affected === 0) {
        this.logger.warn(`하향평가를 찾을 수 없음 - ID: ${id}`);
        return;
      }

      this.logger.log(`하향평가 완전 삭제 완료 - ID: ${id}`);
    } catch (error) {
      this.logger.error(`하향평가 완전 삭제 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 하향평가를 조회한다
   */
  async 조회한다(id: string): Promise<DownwardEvaluation | null> {
    this.logger.debug(`하향평가 조회 - ID: ${id}`);

    try {
      // soft delete를 고려하지 않고 조회 (삭제 작업 등에 필요)
      return await this.downwardEvaluationRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`하향평가 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 삭제되지 않은 하향평가만 조회한다
   */
  async 활성_조회한다(id: string): Promise<DownwardEvaluation | null> {
    this.logger.debug(`활성 하향평가 조회 - ID: ${id}`);

    try {
      return await this.downwardEvaluationRepository.findOne({
        where: { id, deletedAt: null as any },
      });
    } catch (error) {
      this.logger.error(`활성 하향평가 조회 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 필터로 하향평가 목록을 조회한다
   */
  async 필터_조회한다(
    filter: DownwardEvaluationFilter,
  ): Promise<DownwardEvaluation[]> {
    this.logger.debug(`하향평가 필터 조회 - 필터: ${JSON.stringify(filter)}`);

    try {
      let queryBuilder =
        this.downwardEvaluationRepository.createQueryBuilder('evaluation');

      // Soft delete 필터링 - 삭제되지 않은 데이터만 조회
      queryBuilder.andWhere('evaluation.deletedAt IS NULL');

      // 필터 적용
      if (filter.employeeId) {
        queryBuilder.andWhere('evaluation.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.evaluatorId) {
        queryBuilder.andWhere('evaluation.evaluatorId = :evaluatorId', {
          evaluatorId: filter.evaluatorId,
        });
      }

      if (filter.wbsId) {
        queryBuilder.andWhere('evaluation.wbsId = :wbsId', {
          wbsId: filter.wbsId,
        });
      }

      if (filter.periodId) {
        queryBuilder.andWhere('evaluation.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.selfEvaluationId) {
        queryBuilder.andWhere(
          'evaluation.selfEvaluationId = :selfEvaluationId',
          {
            selfEvaluationId: filter.selfEvaluationId,
          },
        );
      }

      if (filter.evaluationType) {
        queryBuilder.andWhere('evaluation.evaluationType = :evaluationType', {
          evaluationType: filter.evaluationType,
        });
      }

      if (filter.withSelfEvaluation) {
        queryBuilder.andWhere('evaluation.selfEvaluationId IS NOT NULL');
      }

      if (filter.withoutSelfEvaluation) {
        queryBuilder.andWhere('evaluation.selfEvaluationId IS NULL');
      }

      if (filter.completedOnly) {
        queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
          isCompleted: true,
        });
      }

      if (filter.uncompletedOnly) {
        queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
          isCompleted: false,
        });
      }

      if (filter.scoreFrom !== undefined) {
        queryBuilder.andWhere(
          'evaluation.downwardEvaluationScore >= :scoreFrom',
          {
            scoreFrom: filter.scoreFrom,
          },
        );
      }

      if (filter.scoreTo !== undefined) {
        queryBuilder.andWhere(
          'evaluation.downwardEvaluationScore <= :scoreTo',
          {
            scoreTo: filter.scoreTo,
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
    } catch (error) {
      this.logger.error(
        `하향평가 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 하향평가를 완료로 표시한다
   */
  async 완료한다(id: string, completedBy: string): Promise<DownwardEvaluation> {
    this.logger.log(`하향평가 완료 처리 시작 - ID: ${id}`);

    const downwardEvaluation = await this.조회한다(id);
    if (!downwardEvaluation) {
      throw new DownwardEvaluationNotFoundException(id);
    }

    try {
      downwardEvaluation.평가를_완료한다(completedBy);

      const saved =
        await this.downwardEvaluationRepository.save(downwardEvaluation);

      this.logger.log(`하향평가 완료 처리 완료 - ID: ${id}`);
      return saved;
    } catch (error) {
      this.logger.error(`하향평가 완료 처리 실패 - ID: ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * 특정 피평가자의 하향평가 목록을 조회한다
   */
  async 피평가자별_조회한다(employeeId: string): Promise<DownwardEvaluation[]> {
    this.logger.debug(`피평가자별 하향평가 조회 - 피평가자: ${employeeId}`);

    try {
      return await this.필터_조회한다({ employeeId });
    } catch (error) {
      this.logger.error(
        `피평가자별 하향평가 조회 실패 - 피평가자: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가자의 하향평가 목록을 조회한다
   */
  async 평가자별_조회한다(evaluatorId: string): Promise<DownwardEvaluation[]> {
    this.logger.debug(`평가자별 하향평가 조회 - 평가자: ${evaluatorId}`);

    try {
      return await this.필터_조회한다({ evaluatorId });
    } catch (error) {
      this.logger.error(
        `평가자별 하향평가 조회 실패 - 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 WBS의 하향평가 목록을 조회한다
   */
  async WBS별_조회한다(wbsId: string): Promise<DownwardEvaluation[]> {
    this.logger.debug(`WBS별 하향평가 조회 - WBS: ${wbsId}`);

    try {
      return await this.필터_조회한다({ wbsId });
    } catch (error) {
      this.logger.error(
        `WBS별 하향평가 조회 실패 - WBS: ${wbsId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 특정 평가기간의 하향평가 목록을 조회한다
   */
  async 평가기간별_조회한다(periodId: string): Promise<DownwardEvaluation[]> {
    this.logger.debug(`평가기간별 하향평가 조회 - 기간: ${periodId}`);

    try {
      return await this.필터_조회한다({ periodId });
    } catch (error) {
      this.logger.error(
        `평가기간별 하향평가 조회 실패 - 기간: ${periodId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 중복 검사를 수행한다
   * 같은 피평가자, 평가자, 기간, WBS, 평가 유형에 대해 중복 평가를 방지한다
   */
  private async 중복_검사를_수행한다(
    employeeId: string,
    evaluatorId: string,
    periodId: string,
    evaluationType: DownwardEvaluationType,
    wbsId?: string,
  ): Promise<void> {
    const whereCondition: any = {
      employeeId,
      evaluatorId,
      periodId,
      evaluationType,
    };

    // wbsId가 있으면 중복 검사 조건에 포함
    if (wbsId) {
      whereCondition.wbsId = wbsId;
    }

    const existing = await this.downwardEvaluationRepository.findOne({
      where: whereCondition,
    });

    if (existing) {
      throw new DownwardEvaluationDuplicateException(
        employeeId,
        evaluatorId,
        periodId,
      );
    }
  }

  /**
   * 유효성을 검사한다
   */
  private 유효성을_검사한다(data: CreateDownwardEvaluationData): void {
    if (!data.employeeId) {
      throw new DownwardEvaluationValidationException(
        '피평가자 ID는 필수입니다.',
      );
    }

    if (!data.evaluatorId) {
      throw new DownwardEvaluationValidationException(
        '평가자 ID는 필수입니다.',
      );
    }

    if (!data.wbsId) {
      throw new DownwardEvaluationValidationException('WBS ID는 필수입니다.');
    }

    if (!data.periodId) {
      throw new DownwardEvaluationValidationException(
        '평가 기간 ID는 필수입니다.',
      );
    }

    if (!data.evaluationType) {
      throw new DownwardEvaluationValidationException(
        '평가 유형은 필수입니다.',
      );
    }
  }
}
