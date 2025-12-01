import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EvaluationProjectAssignment } from './evaluation-project-assignment.entity';
import {
  EvaluationProjectAssignmentBusinessRuleViolationException,
  EvaluationProjectAssignmentDuplicateException,
  EvaluationProjectAssignmentRequiredDataMissingException,
  InvalidEvaluationProjectAssignmentDataFormatException,
} from './evaluation-project-assignment.exceptions';
import {
  CreateEvaluationProjectAssignmentData,
  UpdateEvaluationProjectAssignmentData,
} from './evaluation-project-assignment.types';

/**
 * 평가 프로젝트 할당 유효성 검증 서비스
 * 평가 프로젝트 할당 관련 비즈니스 규칙과 데이터 유효성을 검증합니다.
 */
@Injectable()
export class EvaluationProjectAssignmentValidationService {
  private readonly logger = new Logger(
    EvaluationProjectAssignmentValidationService.name,
  );

  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * 할당 생성 데이터를 검증한다
   */
  async 생성데이터검증한다(
    createData: CreateEvaluationProjectAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 필수 데이터 검증
    this.필수데이터검증한다(createData);

    // 데이터 형식 검증
    this.데이터형식검증한다(createData);

    // 비즈니스 규칙 검증
    await this.생성비즈니스규칙검증한다(createData, manager);
  }

  /**
   * 할당 업데이트 데이터를 검증한다
   */
  async 업데이트데이터검증한다(
    id: string,
    updateData: UpdateEvaluationProjectAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 기존 할당 조회
    const repository = this.transactionManager.getRepository(
      EvaluationProjectAssignment,
      this.evaluationProjectAssignmentRepository,
      manager,
    );
    const existingAssignment = await repository.findOne({ where: { id } });
    if (!existingAssignment) {
      throw new EvaluationProjectAssignmentRequiredDataMissingException(
        '존재하지 않는 평가 프로젝트 할당입니다.',
      );
    }

    // 데이터 형식 검증
    if (updateData.assignedBy !== undefined) {
      this.할당자형식검증한다(updateData.assignedBy);
    }

    // 비즈니스 규칙 검증
    await this.업데이트비즈니스규칙검증한다(
      id,
      updateData,
      existingAssignment,
      manager,
    );
  }

  /**
   * 필수 데이터를 검증한다
   */
  private 필수데이터검증한다(
    createData: CreateEvaluationProjectAssignmentData,
  ): void {
    if (!createData.periodId?.trim()) {
      throw new EvaluationProjectAssignmentRequiredDataMissingException(
        '평가 기간 ID는 필수입니다.',
      );
    }

    if (!createData.employeeId?.trim()) {
      throw new EvaluationProjectAssignmentRequiredDataMissingException(
        '직원 ID는 필수입니다.',
      );
    }

    if (!createData.projectId?.trim()) {
      throw new EvaluationProjectAssignmentRequiredDataMissingException(
        '프로젝트 ID는 필수입니다.',
      );
    }

    if (!createData.assignedBy?.trim()) {
      throw new EvaluationProjectAssignmentRequiredDataMissingException(
        '할당자 ID는 필수입니다.',
      );
    }
  }

  /**
   * 데이터 형식을 검증한다
   */
  private 데이터형식검증한다(
    data:
      | CreateEvaluationProjectAssignmentData
      | UpdateEvaluationProjectAssignmentData,
  ): void {
    if ('periodId' in data && data.periodId !== undefined) {
      this.ID형식검증한다(data.periodId, 'periodId');
    }

    if ('employeeId' in data && data.employeeId !== undefined) {
      this.ID형식검증한다(data.employeeId, 'employeeId');
    }

    if ('projectId' in data && data.projectId !== undefined) {
      this.ID형식검증한다(data.projectId, 'projectId');
    }

    if (data.assignedBy !== undefined) {
      this.할당자형식검증한다(data.assignedBy);
    }
  }

  /**
   * ID 형식을 검증한다
   */
  private ID형식검증한다(id: string, fieldName: string): void {
    if (!id?.trim()) {
      throw new InvalidEvaluationProjectAssignmentDataFormatException(
        fieldName,
        '공백이 아닌 문자열',
        id,
      );
    }

    if (id.length > 255) {
      throw new InvalidEvaluationProjectAssignmentDataFormatException(
        fieldName,
        '255자 이하',
        id,
      );
    }

    // UUID 형식 검증 (선택적)
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      throw new InvalidEvaluationProjectAssignmentDataFormatException(
        fieldName,
        'UUID 형식',
        id,
      );
    }
  }

  /**
   * 할당자 형식을 검증한다
   */
  private 할당자형식검증한다(assignedBy: string): void {
    if (!assignedBy?.trim()) {
      throw new InvalidEvaluationProjectAssignmentDataFormatException(
        'assignedBy',
        '공백이 아닌 문자열',
        assignedBy,
      );
    }

    if (assignedBy.length > 255) {
      throw new InvalidEvaluationProjectAssignmentDataFormatException(
        'assignedBy',
        '255자 이하',
        assignedBy,
      );
    }
  }

  /**
   * 생성 시 비즈니스 규칙을 검증한다
   */
  private async 생성비즈니스규칙검증한다(
    createData: CreateEvaluationProjectAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 중복 할당 검증
    await this.중복할당검증한다(
      createData.periodId,
      createData.employeeId,
      createData.projectId,
      undefined,
      manager,
    );

    // 평가기간 유효성 검증 (실제 구현에서는 평가기간 서비스를 주입받아 검증)
    await this.평가기간유효성검증한다(createData.periodId, manager);

    // 직원 유효성 검증 (실제 구현에서는 직원 서비스를 주입받아 검증)
    await this.직원유효성검증한다(createData.employeeId, manager);

    // 프로젝트 유효성 검증 (실제 구현에서는 프로젝트 서비스를 주입받아 검증)
    await this.프로젝트유효성검증한다(createData.projectId, manager);
  }

  /**
   * 업데이트 시 비즈니스 규칙을 검증한다
   */
  private async 업데이트비즈니스규칙검증한다(
    id: string,
    updateData: UpdateEvaluationProjectAssignmentData,
    existingAssignment: any,
    manager?: EntityManager,
  ): Promise<void> {
    // 현재는 할당자만 업데이트 가능하므로 특별한 비즈니스 규칙 없음
    // 향후 다른 필드 업데이트가 추가되면 해당 규칙 추가

    // 할당자 유효성 검증 (실제 구현에서는 사용자 서비스를 주입받아 검증)
    if (updateData.assignedBy) {
      await this.할당자유효성검증한다(updateData.assignedBy, manager);
    }
  }

  /**
   * 할당 생성 비즈니스 규칙을 검증한다
   */
  async 할당생성비즈니스규칙검증한다(
    createData: CreateEvaluationProjectAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 중복 할당 검증
    await this.중복할당검증한다(
      createData.periodId,
      createData.employeeId,
      createData.projectId,
      undefined,
      manager,
    );

    // 평가기간 상태 검증은 컨텍스트 레벨에서 수행
  }

  /**
   * 할당 업데이트 비즈니스 규칙을 검증한다
   */
  async 할당업데이트비즈니스규칙검증한다(
    id: string,
    updateData: UpdateEvaluationProjectAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    // 기존 할당 조회
    const repository = this.transactionManager.getRepository(
      EvaluationProjectAssignment,
      this.evaluationProjectAssignmentRepository,
      manager,
    );
    const existingAssignment = await repository.findOne({ where: { id } });
    if (!existingAssignment) {
      throw new EvaluationProjectAssignmentRequiredDataMissingException(
        '존재하지 않는 평가 프로젝트 할당입니다.',
      );
    }

    // 평가기간 상태 검증은 컨텍스트 레벨에서 수행

    // 기존 업데이트 비즈니스 규칙 검증
    await this.업데이트비즈니스규칙검증한다(
      id,
      updateData,
      existingAssignment,
      manager,
    );
  }

  /**
   * 할당 삭제 비즈니스 규칙을 검증한다
   */
  async 할당삭제비즈니스규칙검증한다(assignment: any): Promise<void> {
    // 평가기간 상태 검증 - 완료된 평가기간의 할당은 삭제할 수 없음
    // 실제 구현에서는 평가기간 서비스를 주입받아 상태 확인
    // 현재는 기본적인 검증만 수행
  }

  /**
   * 중복 할당을 검증한다
   */
  private async 중복할당검증한다(
    periodId: string,
    employeeId: string,
    projectId: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      EvaluationProjectAssignment,
      this.evaluationProjectAssignmentRepository,
      manager,
    );

    const queryBuilder = repository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.projectId = :projectId', { projectId })
      .andWhere('assignment.deletedAt IS NULL'); // soft delete 된 할당 제외

    if (excludeId) {
      queryBuilder.andWhere('assignment.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    if (count > 0) {
      throw new EvaluationProjectAssignmentDuplicateException(
        periodId,
        employeeId,
        projectId,
      );
    }
  }

  /**
   * 평가기간 유효성을 검증한다
   */
  private async 평가기간유효성검증한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 평가기간 서비스를 주입받아 검증
    // 현재는 기본적인 형식 검증만 수행
    if (!periodId?.trim()) {
      throw new EvaluationProjectAssignmentBusinessRuleViolationException(
        '유효하지 않은 평가기간 ID입니다.',
      );
    }
  }

  /**
   * 직원 유효성을 검증한다
   */
  private async 직원유효성검증한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 직원 서비스를 주입받아 검증
    // 현재는 기본적인 형식 검증만 수행
    if (!employeeId?.trim()) {
      throw new EvaluationProjectAssignmentBusinessRuleViolationException(
        '유효하지 않은 직원 ID입니다.',
      );
    }
  }

  /**
   * 프로젝트 유효성을 검증한다
   */
  private async 프로젝트유효성검증한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 프로젝트 서비스를 주입받아 검증
    // 현재는 기본적인 형식 검증만 수행
    if (!projectId?.trim()) {
      throw new EvaluationProjectAssignmentBusinessRuleViolationException(
        '유효하지 않은 프로젝트 ID입니다.',
      );
    }
  }

  /**
   * 할당자 유효성을 검증한다
   */
  private async 할당자유효성검증한다(
    assignedBy: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 실제 구현에서는 사용자 서비스를 주입받아 검증
    // 현재는 기본적인 형식 검증만 수행
    if (!assignedBy?.trim()) {
      throw new EvaluationProjectAssignmentBusinessRuleViolationException(
        '유효하지 않은 할당자 ID입니다.',
      );
    }
  }
}
