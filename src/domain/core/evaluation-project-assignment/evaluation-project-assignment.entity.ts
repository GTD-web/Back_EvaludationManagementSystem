import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationProjectAssignment } from './interfaces/evaluation-project-assignment.interface';
import type {
  EvaluationProjectAssignmentDto,
  CreateEvaluationProjectAssignmentData,
} from './evaluation-project-assignment.types';

/**
 * 평가 프로젝트 할당 엔티티
 * 특정 평가기간에 직원에게 할당된 프로젝트를 관리합니다.
 */
@Entity('evaluation_project_assignment')
@Index(['periodId', 'employeeId'])
@Index(['periodId', 'projectId'])
@Index(['employeeId', 'projectId'])
@Index(['assignedDate'])
@Index(['periodId', 'employeeId', 'displayOrder'])
export class EvaluationProjectAssignment
  extends BaseEntity<EvaluationProjectAssignmentDto>
  implements IEvaluationProjectAssignment
{
  @Column({
    type: 'uuid',
    comment: '평가 기간 ID',
  })
  periodId: string;

  @Column({
    type: 'uuid',
    comment: '직원 ID',
  })
  employeeId: string;

  @Column({
    type: 'uuid',
    comment: '프로젝트 ID',
  })
  projectId: string;

  @Column({
    type: 'timestamp with time zone',
    comment: '할당일',
  })
  assignedDate: Date;

  @Column({
    type: 'uuid',
    comment: '할당자 ID',
  })
  assignedBy: string;

  @Column({
    type: 'int',
    comment: '표시 순서 (같은 직원-평가기간 내에서의 순서)',
    default: 0,
  })
  displayOrder: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '프로젝트 시작일',
  })
  projectStartDate?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '프로젝트 종료일',
  })
  projectEndDate?: Date;

  constructor(data?: CreateEvaluationProjectAssignmentData) {
    super();
    if (data) {
      this.periodId = data.periodId;
      this.employeeId = data.employeeId;
      this.projectId = data.projectId;
      this.assignedBy = data.assignedBy;
      this.assignedDate = new Date();
      this.displayOrder = data.displayOrder ?? 0;
      this.projectStartDate = data.projectStartDate;
      this.projectEndDate = data.projectEndDate;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.assignedBy);
    }
  }

  /**
   * 특정 평가기간에 속하는지 확인한다
   */
  평가기간과_일치하는가(periodId: string): boolean {
    return this.periodId === periodId;
  }

  /**
   * 특정 직원의 할당인지 확인한다
   */
  해당_직원의_할당인가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 특정 프로젝트 할당인지 확인한다
   */
  해당_프로젝트_할당인가(projectId: string): boolean {
    return this.projectId === projectId;
  }

  /**
   * 순서를 변경한다
   */
  순서를_변경한다(newOrder: number): void {
    if (newOrder < 0) {
      throw new Error('표시 순서는 0 이상이어야 합니다.');
    }
    this.displayOrder = newOrder;
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): EvaluationProjectAssignmentDto {
    return {
      id: this.id,
      periodId: this.periodId,
      employeeId: this.employeeId,
      projectId: this.projectId,
      assignedDate: this.assignedDate,
      assignedBy: this.assignedBy,
      displayOrder: this.displayOrder,
      projectStartDate: this.projectStartDate,
      projectEndDate: this.projectEndDate,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      version: this.version,
    };
  }
}
