import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationWbsAssignment } from './interfaces/evaluation-wbs-assignment.interface';
import type {
  EvaluationWbsAssignmentDto,
  CreateEvaluationWbsAssignmentData,
} from './evaluation-wbs-assignment.types';

/**
 * 평가 WBS 할당 엔티티
 * 특정 평가기간에 직원에게 할당된 WBS 항목을 관리합니다.
 */
@Entity('evaluation_wbs_assignment')
@Index(['periodId', 'employeeId'])
@Index(['periodId', 'projectId'])
@Index(['employeeId', 'wbsItemId'])
@Index(['projectId', 'wbsItemId'])
@Index(['assignedDate'])
@Index(['periodId', 'projectId', 'displayOrder'])
export class EvaluationWbsAssignment
  extends BaseEntity<EvaluationWbsAssignmentDto>
  implements IEvaluationWbsAssignment
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
    type: 'uuid',
    comment: 'WBS 항목 ID',
  })
  wbsItemId: string;

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
    comment: '표시 순서 (같은 프로젝트-평가기간 내에서의 순서)',
    default: 0,
  })
  displayOrder: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    comment: '가중치 (0~100, 직원별 WBS 중요도 기반 자동 계산)',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : 0),
    },
  })
  weight: number;

  constructor(data?: CreateEvaluationWbsAssignmentData) {
    super();
    if (data) {
      this.periodId = data.periodId;
      this.employeeId = data.employeeId;
      this.projectId = data.projectId;
      this.wbsItemId = data.wbsItemId;
      this.assignedBy = data.assignedBy;
      this.assignedDate = new Date();
      this.displayOrder = 0;
      this.weight = 0; // 초기값, 생성 후 자동 계산됨
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
   * 특정 프로젝트의 WBS 할당인지 확인한다
   */
  해당_프로젝트의_WBS_할당인가(projectId: string): boolean {
    return this.projectId === projectId;
  }

  /**
   * 특정 WBS 항목 할당인지 확인한다
   */
  해당_WBS_항목의_할당인가(wbsItemId: string): boolean {
    return this.wbsItemId === wbsItemId;
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
   * 가중치를 설정한다
   * 
   * 가중치는 평가기간의 maxSelfEvaluationRate를 기준으로 정규화되므로,
   * 0 이상의 값이면 유효합니다. 상한선은 평가기간별로 다를 수 있습니다.
   */
  가중치를_설정한다(weight: number): void {
    if (weight < 0 || !Number.isFinite(weight)) {
      throw new Error('가중치는 0 이상의 유한한 값이어야 합니다.');
    }
    if (Number.isNaN(weight)) {
      throw new Error('가중치는 NaN이 될 수 없습니다.');
    }
    this.weight = weight;
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): EvaluationWbsAssignmentDto {
    return {
      id: this.id,
      periodId: this.periodId,
      employeeId: this.employeeId,
      projectId: this.projectId,
      wbsItemId: this.wbsItemId,
      assignedDate: this.assignedDate,
      assignedBy: this.assignedBy,
      displayOrder: this.displayOrder,
      weight: this.weight,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      version: this.version,
    };
  }
}
