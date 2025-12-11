import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EvaluationWbsAssignmentValidationService } from './evaluation-wbs-assignment-validation.service';
import { EvaluationWbsAssignment } from './evaluation-wbs-assignment.entity';
import {
  EvaluationWbsAssignmentNotFoundException,
  EvaluationWbsAssignmentBusinessRuleViolationException,
} from './evaluation-wbs-assignment.exceptions';
import {
  CreateEvaluationWbsAssignmentData,
  UpdateEvaluationWbsAssignmentData,
  EvaluationWbsAssignmentFilter,
  OrderDirection,
} from './evaluation-wbs-assignment.types';
import { IEvaluationWbsAssignment } from './interfaces/evaluation-wbs-assignment.interface';
import { IEvaluationWbsAssignmentService } from './interfaces/evaluation-wbs-assignment.service.interface';

/**
 * 평가 WBS 할당 서비스
 * 평가 WBS 할당의 CRUD 및 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class EvaluationWbsAssignmentService
  implements IEvaluationWbsAssignmentService
{
  private readonly logger = new Logger(EvaluationWbsAssignmentService.name);

  constructor(
    @InjectRepository(EvaluationWbsAssignment)
    private readonly evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly transactionManager: TransactionManagerService,
    private readonly validationService: EvaluationWbsAssignmentValidationService,
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
   * ID로 평가 WBS 할당을 조회한다
   */
  async ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment | null> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignment = await repository.findOne({ where: { id } });
      return assignment || null;
    }, 'ID로_조회한다');
  }

  /**
   * 모든 평가 WBS 할당을 조회한다
   */
  async 전체_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        order: { assignedDate: 'DESC' },
      });
    }, '전체_조회한다');
  }

  /**
   * 평가기간별 할당을 조회한다
   */
  async 평가기간별_조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { periodId },
        order: { assignedDate: 'DESC' },
      });
    }, '평가기간별_조회한다');
  }

  /**
   * 직원별 할당을 조회한다
   */
  async 직원별_조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { employeeId },
        order: { assignedDate: 'DESC' },
      });
    }, '직원별_조회한다');
  }

  /**
   * 프로젝트별 할당을 조회한다
   */
  async 프로젝트별_조회한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { projectId },
        order: { assignedDate: 'DESC' },
      });
    }, '프로젝트별_조회한다');
  }

  /**
   * WBS 항목별 할당을 조회한다
   */
  async WBS항목별_조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { wbsItemId },
        order: { assignedDate: 'DESC' },
      });
    }, 'WBS항목별_조회한다');
  }

  /**
   * 특정 평가기간의 직원별 할당을 조회한다
   */
  async 평가기간_직원별_조회한다(
    periodId: string,
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { periodId, employeeId },
        order: { assignedDate: 'DESC' },
      });
    }, '평가기간_직원별_조회한다');
  }

  /**
   * 특정 프로젝트의 WBS 할당을 조회한다
   */
  async 프로젝트_WBS별_조회한다(
    projectId: string,
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      return await repository.find({
        where: { projectId, wbsItemId },
        order: { assignedDate: 'DESC' },
      });
    }, '프로젝트_WBS별_조회한다');
  }

  /**
   * 필터 조건으로 할당을 조회한다
   */
  async 필터_조회한다(
    filter: EvaluationWbsAssignmentFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment[]> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const queryBuilder = repository.createQueryBuilder('assignment');

      // Soft Delete 필터 (삭제되지 않은 항목만 조회)
      queryBuilder.andWhere('assignment.deletedAt IS NULL');

      // 소프트 딜리트된 프로젝트 할당 제외
      queryBuilder.leftJoin(
        'evaluation_project_assignment',
        'projectAssignment',
        'projectAssignment.projectId = assignment.projectId AND projectAssignment.periodId = assignment.periodId AND projectAssignment.employeeId = assignment.employeeId AND projectAssignment.deletedAt IS NULL',
      );
      queryBuilder.andWhere('projectAssignment.id IS NOT NULL');

      if (filter.periodId) {
        queryBuilder.andWhere('assignment.periodId = :periodId', {
          periodId: filter.periodId,
        });
      }

      if (filter.employeeId) {
        queryBuilder.andWhere('assignment.employeeId = :employeeId', {
          employeeId: filter.employeeId,
        });
      }

      if (filter.projectId) {
        queryBuilder.andWhere('assignment.projectId = :projectId', {
          projectId: filter.projectId,
        });
      }

      if (filter.wbsItemId) {
        queryBuilder.andWhere('assignment.wbsItemId = :wbsItemId', {
          wbsItemId: filter.wbsItemId,
        });
      }

      if (filter.assignedBy) {
        queryBuilder.andWhere('assignment.assignedBy = :assignedBy', {
          assignedBy: filter.assignedBy,
        });
      }

      if (filter.assignedDateFrom) {
        queryBuilder.andWhere('assignment.assignedDate >= :assignedDateFrom', {
          assignedDateFrom: filter.assignedDateFrom,
        });
      }

      if (filter.assignedDateTo) {
        queryBuilder.andWhere('assignment.assignedDate <= :assignedDateTo', {
          assignedDateTo: filter.assignedDateTo,
        });
      }

      return await queryBuilder
        .orderBy('assignment.assignedDate', 'DESC')
        .getMany();
    }, '필터_조회한다');
  }

  /**
   * 평가 WBS 할당을 생성한다
   */
  async 생성한다(
    createData: CreateEvaluationWbsAssignmentData,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;

      // 주의: 비즈니스 규칙 검증은 컨텍스트 레벨에서 수행됩니다.

      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        entityManager,
      );

      // 같은 직원-프로젝트-평가기간의 마지막 displayOrder 조회
      const lastAssignment = await repository.findOne({
        where: {
          periodId: createData.periodId,
          projectId: createData.projectId,
          employeeId: createData.employeeId,
        },
        order: { displayOrder: 'DESC' },
      });

      // 엔티티 생성 (불변성 검증 자동 실행)
      const assignment = new EvaluationWbsAssignment(createData);

      // displayOrder 자동 설정: 마지막 순서 + 1
      assignment.displayOrder = lastAssignment
        ? lastAssignment.displayOrder + 1
        : 0;

      const savedAssignment = await repository.save(assignment);
      this.logger.log(`평가 WBS 할당 생성 완료 - ID: ${savedAssignment.id}`);

      return savedAssignment;
    }, '생성한다');
  }

  /**
   * 평가 WBS 할당을 업데이트한다
   */
  async 업데이트한다(
    id: string,
    updateData: UpdateEvaluationWbsAssignmentData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        entityManager,
      );

      const assignment = await repository.findOne({ where: { id } });
      if (!assignment) {
        throw new EvaluationWbsAssignmentNotFoundException(id);
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
        `평가 WBS 할당 업데이트 완료 - ID: ${id}, 업데이트자: ${updatedBy}`,
      );

      return savedAssignment;
    }, '업데이트한다');
  }

  /**
   * 평가 WBS 할당을 삭제한다 (도메인 레벨 - 순수 삭제만 수행)
   *
   * 참고: 존재 여부 검증은 컨텍스트 레벨에서 수행
   */
  async 삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignment = await repository.findOne({ where: { id } });

      // 할당이 없으면 조용히 종료 (멱등성 보장)
      if (!assignment) {
        this.logger.log(
          `삭제할 할당을 찾을 수 없습니다 - ID: ${id} (이미 삭제되었을 수 있음)`,
        );
        return;
      }

      // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
      await this.validationService.할당삭제비즈니스규칙검증한다(assignment);

      await repository.delete(id);
      this.logger.log(
        `평가 WBS 할당 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`,
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
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const count = await repository.count({
        where: { periodId, employeeId, projectId, wbsItemId },
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
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { periodId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ periodId });
      this.logger.log(
        `평가기간 WBS 할당 전체 삭제 완료 - 평가기간 ID: ${periodId}, 삭제자: ${deletedBy}`,
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
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { employeeId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ employeeId });
      this.logger.log(
        `직원 WBS 할당 전체 삭제 완료 - 직원 ID: ${employeeId}, 삭제자: ${deletedBy}`,
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
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { projectId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ projectId });
      this.logger.log(
        `프로젝트 WBS 할당 전체 삭제 완료 - 프로젝트 ID: ${projectId}, 삭제자: ${deletedBy}`,
      );
    }, '프로젝트_할당_전체삭제한다');
  }

  /**
   * WBS 항목의 모든 할당을 삭제한다
   */
  async WBS항목_할당_전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    return this.executeSafeDomainOperation(async () => {
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        manager,
      );

      const assignments = await repository.find({ where: { wbsItemId } });

      // 각 할당에 대해 비즈니스 규칙 검증
      for (const assignment of assignments) {
        await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
      }

      await repository.delete({ wbsItemId });
      this.logger.log(
        `WBS 항목 할당 전체 삭제 완료 - WBS 항목 ID: ${wbsItemId}, 삭제자: ${deletedBy}`,
      );
    }, 'WBS항목_할당_전체삭제한다');
  }

  /**
   * WBS 할당 순서를 변경한다 (위로 이동 또는 아래로 이동)
   * 같은 프로젝트-평가기간 내에서 순서를 변경한다
   *
   * 참고: 할당 존재 여부 검증은 컨텍스트 레벨에서 수행
   */
  async 순서를_변경한다(
    assignmentId: string,
    direction: OrderDirection,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationWbsAssignment | null> {
    return this.executeSafeDomainOperation(async () => {
      const entityManager = manager || this.dataSource.manager;
      const repository = this.transactionManager.getRepository(
        EvaluationWbsAssignment,
        this.evaluationWbsAssignmentRepository,
        entityManager,
      );

      // 현재 할당 조회
      const currentAssignment = await repository.findOne({
        where: { id: assignmentId },
      });

      // 할당이 없으면 null 반환 (컨텍스트에서 검증)
      if (!currentAssignment) {
        this.logger.log(
          `순서를 변경할 할당을 찾을 수 없습니다 - ID: ${assignmentId}`,
        );
        return null;
      }

      // 같은 직원-프로젝트-평가기간의 모든 할당 조회 (displayOrder 순으로 정렬)
      const allAssignments = await repository.find({
        where: {
          periodId: currentAssignment.periodId,
          projectId: currentAssignment.projectId,
          employeeId: currentAssignment.employeeId,
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
        `WBS 할당 순서 변경 완료 - ID: ${assignmentId}, 방향: ${direction}`,
      );

      return currentAssignment;
    }, '순서를_변경한다');
  }
}
