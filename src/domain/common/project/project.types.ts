/**
 * 프로젝트 관련 타입 정의 (평가 시스템용 간소화 버전)
 */

// 프로젝트 상태 enum
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * 프로젝트 매니저 정보
 */
export interface ManagerInfo {
  /** 매니저 ID (SSO의 직원 ID) */
  managerId: string;
  /** 로컬 Employee ID (로컬 DB의 직원 ID) */
  employeeId?: string;
  /** 매니저 이름 */
  name: string;
  /** 이메일 */
  email?: string;
  /** 전화번호 */
  phoneNumber?: string;
  /** 부서명 */
  departmentName?: string;
  /** 직책명 */
  rankName?: string;
}

/**
 * 프로젝트 DTO (평가 시스템용 간소화 버전)
 * 평가에 필요한 핵심 프로젝트 정보만 포함
 *
 * 계층 구조:
 * - parentProjectId가 없는 경우: 상위 프로젝트 (PM 관리)
 * - parentProjectId가 있는 경우: 하위 프로젝트 (기본적으로 최상단 프로젝트의 PM으로 설정)
 */
export interface ProjectDto {
  // BaseEntity 필드들
  /** 고유 식별자 (UUID) */
  id: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 (소프트 삭제) */
  deletedAt?: Date;

  // Project 엔티티 필드들 (평가 시스템 전용)
  /** 프로젝트명 */
  name: string;
  /** 프로젝트 코드 */
  projectCode?: string;
  /** 프로젝트 상태 */
  status: ProjectStatus;
  /** 시작일 */
  startDate?: Date;
  /** 종료일 */
  endDate?: Date;

  // 조인된 정보 필드들
  /** 프로젝트 매니저 ID (하위 프로젝트는 기본적으로 최상단 프로젝트의 PM으로 설정) */
  managerId?: string;
  /** 프로젝트 매니저 정보 */
  manager?: ManagerInfo;

  // 계층 구조 필드들
  /** 상위 프로젝트 ID (하위 프로젝트인 경우) */
  parentProjectId?: string;
  /** 상위 프로젝트 정보 */
  parentProject?: ProjectDto;
  /** 하위 프로젝트 목록 */
  childProjects?: ProjectDto[];
  /** 하위 프로젝트 개수 */
  childProjectCount?: number;

  // 계산된 필드들 (읽기 전용)
  /** 삭제된 상태 여부 */
  readonly isDeleted: boolean;
  /** 활성 상태 여부 */
  readonly isActive: boolean;
  /** 완료된 상태 여부 */
  readonly isCompleted: boolean;
  /** 취소된 상태 여부 */
  readonly isCancelled: boolean;
}

/**
 * 하위 프로젝트 입력 데이터
 * 같은 orderLevel의 프로젝트들은 같은 부모를 가집니다 (형제 관계)
 * 하위 프로젝트의 매니저는 항상 최상단 프로젝트의 PM으로 자동 설정됩니다.
 */
export interface ChildProjectInput {
  /** 계층 레벨 (1~10, 같은 레벨은 형제 관계) */
  orderLevel: number;
  /** 하위 프로젝트명 */
  name: string;
  /** 하위 프로젝트 코드 (미입력 시 자동 생성) */
  projectCode?: string;
  /** 하위 프로젝트 매니저 ID (사용되지 않음, 항상 최상단 프로젝트의 PM으로 설정됨) */
  managerId?: string;
}

// 프로젝트 생성 DTO (평가 시스템 전용)
export interface CreateProjectDto {
  name: string;
  projectCode?: string;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  managerId?: string;
  /** 상위 프로젝트 ID (하위 프로젝트 생성 시) */
  parentProjectId?: string;
  /** 하위 프로젝트 목록 (평면 구조, orderLevel로 재귀 체인 생성) */
  childProjects?: ChildProjectInput[];
}

// 프로젝트 업데이트 DTO (평가 시스템 전용)
export interface UpdateProjectDto {
  name?: string;
  projectCode?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  managerId?: string;
  /** 상위 프로젝트 ID (하위 프로젝트로 변경 또는 상위 프로젝트 변경 시) */
  parentProjectId?: string;
  /** 하위 프로젝트 목록 (기존 하위 삭제 후 재생성, undefined: 변경 없음) */
  childProjects?: ChildProjectInput[];
}

// 프로젝트 조회 필터 (평가 시스템용 간소화 버전)
export interface ProjectFilter {
  status?: ProjectStatus;
  managerId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  /** 상위 프로젝트 ID로 필터링 (하위 프로젝트 조회 시) */
  parentProjectId?: string;
  /** 계층 레벨 필터 (null: 상위 프로젝트만, 'all': 전체) */
  hierarchyLevel?: 'parent' | 'child' | 'all';
  /** 프로젝트명 검색 (부분 일치) */
  search?: string;
}

// 프로젝트 통계 (평가 시스템용 간소화 버전)
export interface ProjectStatistics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  projectsByStatus: Record<string, number>;
  projectsByManager: Record<string, number>;
  lastSyncAt?: Date;
}

// 프로젝트 목록 조회 옵션
export interface ProjectListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'projectCode' | 'startDate' | 'endDate' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  filter?: ProjectFilter;
}
