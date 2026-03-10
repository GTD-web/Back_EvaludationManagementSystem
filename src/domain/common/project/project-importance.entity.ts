import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { ProjectImportanceDto } from './project-importance.types';

/**
 * 프로젝트 중요도 엔티티
 * 
 * 프로젝트에 할당할 수 있는 중요도 값들을 관리합니다.
 * 예: 1A, 1B, 2A, 2B, 3A
 */
@Entity('project_importance')
export class ProjectImportance extends BaseEntity<ProjectImportanceDto> {
  /**
   * 중요도 코드 (예: 1A, 1B, 2A, 2B, 3A)
   */
  @Column({ type: 'varchar', length: 10, unique: true, comment: '중요도 코드' })
  code: string;

  /**
   * 중요도 이름 (설명)
   */
  @Column({ type: 'varchar', length: 100, nullable: true, comment: '중요도 이름' })
  name?: string;

  /**
   * 표시 순서
   */
  @Column({ type: 'int', default: 0, comment: '표시 순서' })
  displayOrder: number;

  /**
   * 활성 여부
   */
  @Column({ type: 'boolean', default: true, comment: '활성 여부' })
  isActive: boolean;

  /**
   * ProjectImportance 엔티티를 생성합니다.
   */
  static 생성한다(
    data: {
      code: string;
      name?: string;
      displayOrder?: number;
      isActive?: boolean;
    },
    createdBy: string,
  ): ProjectImportance {
    const importance = new ProjectImportance();
    importance.code = data.code;
    importance.name = data.name;
    importance.displayOrder = data.displayOrder ?? 0;
    importance.isActive = data.isActive ?? true;
    importance.createdBy = createdBy;
    return importance;
  }

  /**
   * ProjectImportance 엔티티를 업데이트합니다.
   */
  업데이트한다(
    data: {
      code?: string;
      name?: string;
      displayOrder?: number;
      isActive?: boolean;
    },
    updatedBy: string,
  ): void {
    if (data.code !== undefined) this.code = data.code;
    if (data.name !== undefined) this.name = data.name;
    if (data.displayOrder !== undefined) this.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) this.isActive = data.isActive;
    this.updatedBy = updatedBy;
  }

  /**
   * DTO로 변환합니다.
   */
  DTO로_변환한다(): ProjectImportanceDto {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      displayOrder: this.displayOrder,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}

