import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, IsNull } from 'typeorm';
import { EvaluationProjectAssignmentValidationService } from './evaluation-project-assignment-validation.service';
import { EvaluationProjectAssignment } from './evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentNotFoundException } from './evaluation-project-assignment.exceptions';
import {
  CreateEvaluationProjectAssignmentData,
  UpdateEvaluationProjectAssignmentData,
  EvaluationProjectAssignmentFilter,
  OrderDirection,
} from './evaluation-project-assignment.types';
import { IEvaluationProjectAssignment } from './interfaces/evaluation-project-assignment.interface';
import { IEvaluationProjectAssignmentService } from './interfaces/evaluation-project-assignment.service.interface';

/**
 * 평가 프로젝트 할당 서비스
 * 평가 프로젝트 할당의 CRUD 및 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EvaluationProjectAssignmentService
  implements IEvaluationProjectAssignmentService
{
  private readonly logger = new Logger(EvaluationProjectAssignmentService.name);

  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly transactionManager: TransactionManagerService,
    private readonly validationService: EvaluationProjectAssignmentValidationService,
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
   * ID로 평가 프로젝트 할당을 조회한다
   * 커맨드 핸들러에서 검증 목적으로 사용
   */
  async ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignment = await repository.findOne({ where: { id } });
      return assignment || null;
    }, 'ID로_조회한다');
  }

  /**
   * 직원 ID, 프로젝트 ID, 평가기간 ID로 평가 프로젝트 할당을 조회한다
   */
  async 직원과_프로젝트와_평가기간으로_조회한다(
    employeeId: string,
    projectId: string,
    periodId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignment = await repository.findOne({
        where: {
          employeeId,
          projectId,
          periodId,
          deletedAt: IsNull(),
        },
      });
      return assignment || null;
    }, '직원과_프로젝트와_평가기간으로_조회한다');
  }

  /**
   * 평가 프로젝트 할당을 생성한다
   */
  async 생성한다(
    createData: CreateEvaluationProjectAssignmentData,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당생성비즈니스규칙검증한다(
        createData,
        entityManager,
      );

      // displayOrder가 지정되지 않은 경우 자동으로 다음 순서 계산
      if (createData.displayOrder === undefined) {
        const maxOrder = await this.최대_순서를_조회한다(
          createData.periodId,
          createData.employeeId,
          entityManager,
        );
        createData.displayOrder = maxOrder + 1;
      }

      // 엔티티 생성 (불변성 검증 자동 실행)
      const assignment = new EvaluationProjectAssignment(createData);

      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        entityManager,
      );

      const savedAssignment = await repository.save(assignment);
      this.logger.log(
        `평가 프로젝트 할당 생성 완료 - ID: ${savedAssignment.id}`,
      );

      return savedAssignment;
    }, '생성한다');
  }

  /**
   * 평가 프로젝트 할당을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateData: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        entityManager,
      );

      const assignment = await repository.findOne({ where: { id } });
      if (!assignment) {
        throw new EvaluationProjectAssignmentNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당업데이트비즈니스규칙검증한다(
        id,
        updateData,
        entityManager,
      );

      // 엔티티 업데이트 (undefined 값 제외하고 실제 변경된 값만 할당)
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined),
      );
      Object.assign(assignment, filteredUpdateData, {
        updatedBy,
        updatedAt: new Date(),
      });

      const savedAssignment = await repository.save(assignment);
      this.logger.log(
        `평가 프로젝트 할당 업데이트 완료 - ID: ${id}, 업데이트자: ${updatedBy}`,
      );

      return savedAssignment;
    }, '업데이트한다');
  }

  /**
   * 평가 프로젝트 할당을 삭제한다
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignment = await repository.findOne({ where: { id } });
      if (!assignment) {
        throw new EvaluationProjectAssignmentNotFoundException(id);
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당삭제비즈니스규칙검증한다(assignment);

      // 소프트 삭제 수행 및 삭제자 정보 업데이트
      assignment.메타데이터를_업데이트한다(deletedBy);
      await repository.softDelete(id);

      this.logger.log(
        `평가 프로젝트 할당 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`,
      );
    }, '삭제한다');
  }

  /**
   * 특정 할당이 존재하는지 확인한다
   */
  async 할당_존재_확인한다(
    periodId: string,
    employeeId: string,
    projectId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const count = await repository.count({
        where: { periodId, employeeId, projectId },
      });

      return count > 0;
    }, '할당_존재_확인한다');
  }

  /**
   * 평가기간의 모든 할당을 삭제한다
   */
  async 평가기간_할당_전체삭제한다(
    periodId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { periodId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ periodId });
      this.logger.log(
        `평가기간 할당 전체 삭제 완료 - 평가기간 ID: ${periodId}, 삭제자: ${deletedBy}`,
      );
    }, '평가기간_할당_전체삭제한다');
  }

  /**
   * 직원의 모든 할당을 삭제한다
   */
  async 직원_할당_전체삭제한다(
    employeeId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { employeeId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ employeeId });
      this.logger.log(
        `직원 할당 전체 삭제 완료 - 직원 ID: ${employeeId}, 삭제자: ${deletedBy}`,
      );
    }, '직원_할당_전체삭제한다');
  }

  /**
   * 프로젝트의 모든 할당을 삭제한다
   */
  async 프로젝트_할당_전체삭제한다(
    projectId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { projectId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ projectId });
      this.logger.log(
        `프로젝트 할당 전체 삭제 완료 - 프로젝트 ID: ${projectId}, 삭제자: ${deletedBy}`,
      );
    }, '프로젝트_할당_전체삭제한다');
  }

  /**
   * 특정 직원-평가기간의 최대 순서를 조회한다
   */
  public async 최대_순서를_조회한다(
    periodId: string,
    employeeId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repository = this.transactionManager.getRepository(
      EvaluationProjectAssignment,
      this.evaluationProjectAssignmentRepository,
      manager,
    );

    const result = await repository
      .createQueryBuilder('assignment')
      .select('MAX(assignment.displayOrder)', 'maxOrder')
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .getRawOne();

    return result?.maxOrder ?? -1;
  }

  /**
   * 프로젝트 할당 순서를 변경한다 (위로 이동 또는 아래로 이동)
   */
  async 순서를_변경한다(
    assignmentId: string,
    direction: OrderDirection,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationProjectAssignment> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        entityManager,
      );

      // 현재 할당 조회
      const currentAssignment = await repository.findOne({
        where: { id: assignmentId },
      });
      if (!currentAssignment) {
        throw new EvaluationProjectAssignmentNotFoundException(assignmentId);
      }

      const currentOrder = currentAssignment.displayOrder;

      // 같은 직원-평가기간의 모든 할당 조회 (displayOrder 순으로 정렬)
      // 삭제되지 않은 항목만 조회
      const allAssignments = await repository.find({
        where: {
          periodId: currentAssignment.periodId,
          employeeId: currentAssignment.employeeId,
          deletedAt: IsNull(),
        },
        order: { displayOrder: 'ASC' },
      });

      // 현재 위치 찾기
      const currentIndex = allAssignments.findIndex(
        (a) => a.id === assignmentId,
      );

      // 이동 가능 여부 확인
      if (direction === 'up' && currentIndex === 0) {
        this.logger.warn(`이미 첫 번째 항목입니다 - ID: ${assignmentId}`);
        return currentAssignment;
      }

      if (direction === 'down' && currentIndex === allAssignments.length - 1) {
        this.logger.warn(`이미 마지막 항목입니다 - ID: ${assignmentId}`);
        return currentAssignment;
      }

      // 교환할 항목 찾기
      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const targetAssignment = allAssignments[targetIndex];

      // 순서 교환
      const tempOrder = currentAssignment.displayOrder;
      currentAssignment.순서를_변경한다(targetAssignment.displayOrder);
      targetAssignment.순서를_변경한다(tempOrder);

      // 메타데이터 업데이트
      currentAssignment.메타데이터를_업데이트한다(updatedBy);
      targetAssignment.메타데이터를_업데이트한다(updatedBy);

      // 저장
      await repository.save([currentAssignment, targetAssignment]);

      this.logger.log(
        `프로젝트 할당 순서 변경 완료 - ID: ${assignmentId}, 방향: ${direction}`,
      );

      return currentAssignment;
    }, '순서를_변경한다');
  }

  /**
   * 특정 직원-평가기간의 프로젝트 할당 순서를 재정렬한다
   * 모든 할당의 displayOrder를 0부터 순차적으로 재설정한다
   */
  async 순서를_재정렬한다(
    periodId: string,
    employeeId: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationProjectAssignment,
        this.evaluationProjectAssignmentRepository,
        manager,
      );

      // 같은 직원-평가기간의 모든 할당 조회 (현재 순서대로 정렬)
      // 삭제되지 않은 항목만 조회
      const assignments = await repository.find({
        where: { periodId, employeeId, deletedAt: IsNull() },
        order: { displayOrder: 'ASC', assignedDate: 'DESC' },
      });

      // 순서 재정렬
      assignments.forEach((assignment, index) => {
        assignment.순서를_변경한다(index);
        assignment.메타데이터를_업데이트한다(updatedBy);
      });

      // 저장
      await repository.save(assignments);

      this.logger.log(
        `프로젝트 할당 순서 재정렬 완료 - 평가기간 ID: ${periodId}, 직원 ID: ${employeeId}, 항목 수: ${assignments.length}`,
      );
    }, '순서를_재정렬한다');
  }
}
