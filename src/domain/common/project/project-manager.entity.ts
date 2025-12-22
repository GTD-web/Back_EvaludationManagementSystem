import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { ProjectManagerDto } from './project-manager.types';

/**
 * 프로젝트 매니저 엔티티
 *
 * PM으로 지정 가능한 직원 목록을 관리합니다.
 * SSO의 직원 정보와 연동하여 사용됩니다.
 */
@Entity('project_manager')
export class ProjectManager extends BaseEntity<ProjectManagerDto> {
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: 'SSO의 매니저 ID (externalId)',
  })
  @Index()
  managerId: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '매니저 이름',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '이메일',
  })
  email?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '사번',
  })
  employeeNumber?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '부서명',
  })
  departmentName?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: '활성 상태',
  })
  isActive: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: '비고',
  })
  note?: string;

  constructor(
    managerId?: string,
    name?: string,
    email?: string,
    employeeNumber?: string,
    departmentName?: string,
    isActive: boolean = true,
  ) {
    super();
    if (managerId) this.managerId = managerId;
    if (name) this.name = name;
    if (email) this.email = email;
    if (employeeNumber) this.employeeNumber = employeeNumber;
    if (departmentName) this.departmentName = departmentName;
    this.isActive = isActive;
  }

  /**
   * ProjectManager 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): ProjectManagerDto {
    return {
      id: this.id,
      managerId: this.managerId,
      name: this.name,
      email: this.email,
      employeeNumber: this.employeeNumber,
      departmentName: this.departmentName,
      isActive: this.isActive,
      note: this.note,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * ProjectManager를 생성한다
   */
  static 생성한다(
    data: {
      managerId: string;
      name: string;
      email?: string;
      employeeNumber?: string;
      departmentName?: string;
      isActive?: boolean;
      note?: string;
    },
    createdBy: string,
  ): ProjectManager {
    const manager = new ProjectManager();
    Object.assign(manager, data);
    manager.생성자를_설정한다(createdBy);
    return manager;
  }

  /**
   * ProjectManager 정보를 업데이트한다
   */
  업데이트한다(
    data: {
      name?: string;
      email?: string;
      employeeNumber?: string;
      departmentName?: string;
      isActive?: boolean;
      note?: string;
    },
    updatedBy: string,
  ): void {
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );
    Object.assign(this, filteredData);
    this.수정자를_설정한다(updatedBy);
  }
}
