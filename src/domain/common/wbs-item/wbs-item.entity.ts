import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import {
  WbsItemStatus,
  WbsItemDto,
  CreateWbsItemDto,
  UpdateWbsItemDto,
} from './wbs-item.types';
import { IWbsItem } from './wbs-item.interface';

/**
 * WBS 항목 엔티티 (평가 시스템 전용)
 *
 * 평가 시스템에서 사용하는 WBS 항목 정보만 관리합니다.
 * 외부 시스템 연동 없이 독립적으로 운영됩니다.
 */
@Entity('wbs_item')
@Index(['projectId'])
@Index(['parentWbsId'])
@Index(['assignedToId'])
export class WbsItem extends BaseEntity<WbsItemDto> implements IWbsItem {
  @Column({
    type: 'text',
    comment: 'WBS 코드',
  })
  wbsCode: string;

  @Column({
    type: 'text',
    comment: 'WBS 제목',
  })
  title: string;

  @Column({
    type: 'enum',
    enum: [...Object.values(WbsItemStatus)],
    default: WbsItemStatus.PENDING,
    comment: 'WBS 상태',
  })
  status: WbsItemStatus;

  @Column({
    type: 'date',
    nullable: true,
    comment: '시작일',
  })
  startDate?: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: '종료일',
  })
  endDate?: Date;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: '진행률 (%)',
  })
  progressPercentage?: number;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '담당자 ID',
  })
  assignedToId?: string;

  @Column({
    type: 'uuid',
    comment: '프로젝트 ID',
  })
  projectId: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '상위 WBS 항목 ID',
  })
  parentWbsId?: string;

  @Column({
    type: 'int',
    comment: 'WBS 레벨 (1: 최상위)',
  })
  level: number;

  constructor(
    wbsCode?: string,
    title?: string,
    status?: WbsItemStatus,
    startDate?: Date,
    endDate?: Date,
    progressPercentage?: number,
    assignedToId?: string,
    projectId?: string,
    parentWbsId?: string,
    level?: number,
  ) {
    super();
    if (wbsCode) this.wbsCode = wbsCode;
    if (title) this.title = title;
    if (status) this.status = status;
    if (startDate) this.startDate = startDate;
    if (endDate) this.endDate = endDate;
    if (progressPercentage !== undefined)
      this.progressPercentage = progressPercentage;
    if (assignedToId) this.assignedToId = assignedToId;
    if (projectId) this.projectId = projectId;
    if (parentWbsId) this.parentWbsId = parentWbsId;
    if (level !== undefined) this.level = level;
    this.status = status || WbsItemStatus.PENDING;
    this.level = level || 1;
  }

  /**
   * WbsItem 엔티티를 DTO로 변환한다 (평가 시스템 전용)
   */
  DTO로_변환한다(): WbsItemDto {
    return {
      // BaseEntity 필드들
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,

      // WbsItem 엔티티 필드들 (평가 시스템 전용)
      wbsCode: this.wbsCode,
      title: this.title,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      progressPercentage: this.progressPercentage,
      assignedToId: this.assignedToId,
      projectId: this.projectId,
      parentWbsId: this.parentWbsId,
      level: this.level,

      // 계산된 필드들
      get isDeleted() {
        return this.deletedAt !== null && this.deletedAt !== undefined;
      },
      get isInProgress() {
        return this.status === WbsItemStatus.IN_PROGRESS;
      },
      get isCompleted() {
        return this.status === WbsItemStatus.COMPLETED;
      },
      get isCancelled() {
        return this.status === WbsItemStatus.CANCELLED;
      },
      get isPending() {
        return this.status === WbsItemStatus.PENDING;
      },
      get isOverdue() {
        if (
          !this.endDate ||
          this.status === WbsItemStatus.COMPLETED ||
          this.status === WbsItemStatus.CANCELLED
        ) {
          return false;
        }
        return new Date() > this.endDate;
      },
    };
  }

  /**
   * 새로운 WBS 항목을 생성한다
   * @param data WBS 항목 생성 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 WBS 항목 엔티티
   */
  static 생성한다(data: CreateWbsItemDto, createdBy: string): WbsItem {
    const wbsItem = new WbsItem();
    Object.assign(wbsItem, data);
    wbsItem.생성자를_설정한다(createdBy);
    return wbsItem;
  }

  /**
   * WBS 항목 정보를 업데이트한다
   * @param data 업데이트할 데이터
   * @param updatedBy 수정자 ID
   */
  업데이트한다(data: UpdateWbsItemDto, updatedBy: string): void {
    // undefined 값 제외하고 실제 변경된 값만 할당
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );
    Object.assign(this, filteredData);
    this.수정자를_설정한다(updatedBy);
  }

  /**
   * WBS 항목을 삭제한다 (소프트 삭제)
   * @param deletedBy 삭제자 ID
   */
  삭제한다(deletedBy: string): void {
    this.deletedAt = new Date();
    this.수정자를_설정한다(deletedBy);
  }
}
