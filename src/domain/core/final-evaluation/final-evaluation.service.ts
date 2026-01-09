import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FinalEvaluationValidationService } from './final-evaluation-validation.service';
import { FinalEvaluation } from './final-evaluation.entity';
import {
  FinalEvaluationNotFoundException,
  AlreadyConfirmedEvaluationException,
  NotConfirmedEvaluationException,
} from './final-evaluation.exceptions';
import {
  CreateFinalEvaluationData,
  UpdateFinalEvaluationData,
  JobGrade,
  JobDetailedGrade,
} from './final-evaluation.types';
import { IFinalEvaluation } from './interfaces/final-evaluation.interface';
import { IFinalEvaluationService } from './interfaces/final-evaluation-service.interface';

/**
 * 최종평가 서비스
 * 최종평가의 Command(생성, 수정, 삭제, 확정) 로직을 처리합니다.
 * 조회 기능은 별도의 QueryService에서 처리합니다.
 */
@Injectable()
export class FinalEvaluationService implements IFinalEvaluationService {
  private readonly logger = new Logger(FinalEvaluationService.name);

  constructor(
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
    private readonly transactionManager: TransactionManagerService,
    private readonly validationService: FinalEvaluationValidationService,
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
   * 최종평가를 생성한다
   */
  async 생성한다(
    createData: CreateFinalEvaluationData,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      // 유효성 검증
      await this.validationService.생성데이터검증한다(createData, manager);

      const repository = this.transactionManager.getRepository(
        FinalEvaluation,
        this.finalEvaluationRepository,
        manager,
      );

      const finalEvaluation = repository.create({
        employeeId: createData.employeeId,
        periodId: createData.periodId,
        evaluationGrade: createData.evaluationGrade,
        jobGrade: createData.jobGrade,
        jobDetailedGrade: createData.jobDetailedGrade,
        finalComments: createData.finalComments,
        isConfirmed: false,
      });

      finalEvaluation.생성자를_설정한다(createData.createdBy);

      const savedFinalEvaluation = await repository.save(finalEvaluation);

      return savedFinalEvaluation;
    }, '생성한다');
  }

  /**
   * 최종평가를 수정한다
   */
  async 수정한다(
    id: string,
    updateData: UpdateFinalEvaluationData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      // 유효성 검증
      await this.validationService.업데이트데이터검증한다(
        id,
        updateData,
        manager,
      );

      const repository = this.transactionManager.getRepository(
        FinalEvaluation,
        this.finalEvaluationRepository,
        manager,
      );

      const finalEvaluation = await repository.findOne({ where: { id } });
      if (!finalEvaluation) {
        throw new FinalEvaluationNotFoundException(id);
      }

      // 업데이트 적용
      if (updateData.evaluationGrade !== undefined) {
        finalEvaluation.평가등급을_변경한다(
          updateData.evaluationGrade,
          updatedBy,
        );
      }

      if (updateData.jobGrade !== undefined) {
        finalEvaluation.직무등급을_변경한다(updateData.jobGrade, updatedBy);
      }

      if (updateData.jobDetailedGrade !== undefined) {
        finalEvaluation.직무_상세등급을_변경한다(
          updateData.jobDetailedGrade,
          updatedBy,
        );
      }

      if (updateData.finalComments !== undefined) {
        finalEvaluation.최종_평가_의견을_변경한다(
          updateData.finalComments,
          updatedBy,
        );
      }

      const updatedFinalEvaluation = await repository.save(finalEvaluation);

      return updatedFinalEvaluation;
    }, '수정한다');
  }

  /**
   * 최종평가를 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.debug(`최종평가 삭제 시작 - ID: ${id}`);

      const repository = this.transactionManager.getRepository(
        FinalEvaluation,
        this.finalEvaluationRepository,
        manager,
      );

      const finalEvaluation = await repository.findOne({ where: { id } });
      if (!finalEvaluation) {
        throw new FinalEvaluationNotFoundException(id);
      }

      // 확정된 평가는 삭제 불가
      if (finalEvaluation.isConfirmed) {
        throw new AlreadyConfirmedEvaluationException(id);
      }

      finalEvaluation.deletedAt = new Date();
      finalEvaluation.수정자를_설정한다(deletedBy);
      await repository.save(finalEvaluation);

      this.logger.log(`최종평가 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
    }, '삭제한다');
  }

  /**
   * 최종평가를 확정한다
   */
  async 확정한다(
    id: string,
    confirmedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        FinalEvaluation,
        this.finalEvaluationRepository,
        manager,
      );

      const finalEvaluation = await repository.findOne({ where: { id } });
      if (!finalEvaluation) {
        throw new FinalEvaluationNotFoundException(id);
      }

      finalEvaluation.평가를_확정한다(confirmedBy);

      const confirmedFinalEvaluation = await repository.save(finalEvaluation);

      return confirmedFinalEvaluation;
    }, '확정한다');
  }

  /**
   * 최종평가 확정을 취소한다
   */
  async 확정_취소한다(
    id: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        FinalEvaluation,
        this.finalEvaluationRepository,
        manager,
      );

      const finalEvaluation = await repository.findOne({ where: { id } });
      if (!finalEvaluation) {
        throw new FinalEvaluationNotFoundException(id);
      }

      finalEvaluation.평가_확정을_취소한다(updatedBy);

      const updatedFinalEvaluation = await repository.save(finalEvaluation);

      return updatedFinalEvaluation;
    }, '확정_취소한다');
  }

  /**
   * 평가등급을 변경한다
   */
  async 평가등급_변경한다(
    id: string,
    evaluationGrade: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.debug(`평가등급 변경 시작 - ID: ${id}`);

      const repository = this.transactionManager.getRepository(
        FinalEvaluation,
        this.finalEvaluationRepository,
        manager,
      );

      const finalEvaluation = await repository.findOne({ where: { id } });
      if (!finalEvaluation) {
        throw new FinalEvaluationNotFoundException(id);
      }

      finalEvaluation.평가등급을_변경한다(evaluationGrade, updatedBy);

      const updatedFinalEvaluation = await repository.save(finalEvaluation);

      this.logger.log(
        `평가등급 변경 완료 - ID: ${id}, 새 등급: ${evaluationGrade}, 수정자: ${updatedBy}`,
      );

      return updatedFinalEvaluation;
    }, '평가등급_변경한다');
  }

  /**
   * 직무등급을 변경한다
   */
  async 직무등급_변경한다(
    id: string,
    jobGrade: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.debug(`직무등급 변경 시작 - ID: ${id}`);

      const repository = this.transactionManager.getRepository(
        FinalEvaluation,
        this.finalEvaluationRepository,
        manager,
      );

      const finalEvaluation = await repository.findOne({ where: { id } });
      if (!finalEvaluation) {
        throw new FinalEvaluationNotFoundException(id);
      }

      // JobGrade enum 값으로 변환
      const jobGradeEnum = jobGrade as JobGrade;
      finalEvaluation.직무등급을_변경한다(jobGradeEnum, updatedBy);

      const updatedFinalEvaluation = await repository.save(finalEvaluation);

      this.logger.log(
        `직무등급 변경 완료 - ID: ${id}, 새 등급: ${jobGrade}, 수정자: ${updatedBy}`,
      );

      return updatedFinalEvaluation;
    }, '직무등급_변경한다');
  }

  /**
   * 직무 상세등급을 변경한다
   */
  async 직무_상세등급_변경한다(
    id: string,
    jobDetailedGrade: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation> {
    return this.executeSafeDomainOperation(async () => {
      this.logger.debug(`직무 상세등급 변경 시작 - ID: ${id}`);

      const repository = this.transactionManager.getRepository(
        FinalEvaluation,
        this.finalEvaluationRepository,
        manager,
      );

      const finalEvaluation = await repository.findOne({ where: { id } });
      if (!finalEvaluation) {
        throw new FinalEvaluationNotFoundException(id);
      }

      // JobDetailedGrade enum 값으로 변환
      const jobDetailedGradeEnum = jobDetailedGrade as JobDetailedGrade;
      finalEvaluation.직무_상세등급을_변경한다(jobDetailedGradeEnum, updatedBy);

      const updatedFinalEvaluation = await repository.save(finalEvaluation);

      this.logger.log(
        `직무 상세등급 변경 완료 - ID: ${id}, 새 등급: ${jobDetailedGrade}, 수정자: ${updatedBy}`,
      );

      return updatedFinalEvaluation;
    }, '직무_상세등급_변경한다');
  }
}
