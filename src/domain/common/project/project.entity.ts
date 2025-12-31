import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import {
  ProjectGrade,
  getProjectGradePriority,
  ProjectDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './project.types';
import { IProject } from './project.interface';

/**
 * 프로젝트 엔티티 (평가 시스템 전용)
 *
 * 평가 시스템에서 사용하는 프로젝트 정보만 관리합니다.
 * 외부 시스템 연동 없이 독립적으로 운영됩니다.
 *
 * 계층 구조:
 * - 상위 프로젝트: PM(Project Manager)이 관리
 * - 하위 프로젝트: 기본적으로 최상단 프로젝트의 PM으로 설정되며, 별도 지정도 가능
 * - 하나의 상위 프로젝트는 최대 7개의 하위 프로젝트를 가질 수 있음
 */
@Entity('project')
export class Project extends BaseEntity<ProjectDto> implements IProject {
  @Column({
    type: 'varchar',
    length: 255,
    comment: '프로젝트명',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '프로젝트 코드',
  })
  projectCode?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment:
      '프로젝트 매니저 ID (하위 프로젝트는 기본적으로 최상단 프로젝트의 PM으로 설정)',
  })
  managerId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '실 PM',
  })
  realPM?: string;

  // 프로젝트 중요도 ID (FK)
  @Column({
    type: 'uuid',
    nullable: true,
    comment: '프로젝트 중요도 ID',
  })
  @Index()
  importanceId?: string;

  // 프로젝트 등급
  @Column({
    type: 'enum',
    enum: [...Object.values(ProjectGrade)],
    nullable: true,
    comment: '프로젝트 등급 (1A, 1B, 2A, 2B, 3A, 3B)',
  })
  @Index()
  grade?: ProjectGrade;

  // 프로젝트 우선순위 (등급에 따라 자동 설정)
  @Column({
    type: 'int',
    nullable: true,
    comment: '프로젝트 우선순위 (등급에 따라 자동 설정: 1A=6, 1B=5, 2A=4, 2B=3, 3A=2, 3B=1)',
  })
  @Index()
  priority?: number;

  // 상위 프로젝트 ID (FK로 관리, 관계는 서비스 레벨에서 처리)
  @Column({
    type: 'uuid',
    nullable: true,
    comment: '상위 프로젝트 ID (하위 프로젝트인 경우)',
  })
  @Index()
  parentProjectId?: string;

  constructor(
    name?: string,
    projectCode?: string,
    managerId?: string,
    realPM?: string,
    importanceId?: string,
    grade?: ProjectGrade,
    parentProjectId?: string,
  ) {
    super();
    if (name) this.name = name;
    if (projectCode) this.projectCode = projectCode;
    if (managerId) this.managerId = managerId;
    if (realPM) this.realPM = realPM;
    if (importanceId) this.importanceId = importanceId;
    if (grade) {
      this.grade = grade;
      this.priority = getProjectGradePriority(grade);
    }
    if (parentProjectId) this.parentProjectId = parentProjectId;
  }

  /**
   * Project 엔티티를 DTO로 변환한다 (평가 시스템 전용)
   */
  DTO로_변환한다(): ProjectDto {
    return {
      // BaseEntity 필드들
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,

      // Project 엔티티 필드들 (평가 시스템 전용)
      name: this.name,
      projectCode: this.projectCode,
      managerId: this.managerId,
      realPM: this.realPM,
      importanceId: this.importanceId,
      grade: this.grade,
      priority: this.priority,
      parentProjectId: this.parentProjectId,

      // 계산된 필드들
      get isDeleted() {
        return this.deletedAt !== null && this.deletedAt !== undefined;
      },
    };
  }

  /**
   * 새로운 프로젝트를 생성한다
   * @param data 프로젝트 생성 데이터
   * @param createdBy 생성자 ID
   * @returns 생성된 프로젝트 엔티티
   */
  static 생성한다(data: CreateProjectDto, createdBy: string): Project {
    const project = new Project();
    Object.assign(project, data);
    // 등급이 설정되면 우선순위 자동 계산
    if (data.grade) {
      project.priority = getProjectGradePriority(data.grade);
    }
    project.생성자를_설정한다(createdBy);
    return project;
  }

  /**
   * 프로젝트 정보를 업데이트한다
   * @param data 업데이트할 데이터
   * @param updatedBy 수정자 ID
   */
  업데이트한다(data: UpdateProjectDto, updatedBy: string): void {
    // undefined 값 제외하고 실제 변경된 값만 할당
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );
    Object.assign(this, filteredData);
    // 등급이 변경되면 우선순위 자동 업데이트
    if (data.grade !== undefined) {
      if (data.grade) {
        this.priority = getProjectGradePriority(data.grade);
      } else {
        this.priority = undefined;
      }
    }
    this.수정자를_설정한다(updatedBy);
  }

  /**
   * 프로젝트를 삭제한다 (소프트 삭제)
   * @param deletedBy 삭제자 ID
   */
  삭제한다(deletedBy: string): void {
    this.deletedAt = new Date();
    this.수정자를_설정한다(deletedBy);
  }
}
