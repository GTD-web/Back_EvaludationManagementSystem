/**
 * 프로젝트 매니저 관련 타입 정의
 */

/**
 * 프로젝트 매니저 DTO
 */
export interface ProjectManagerDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** SSO의 매니저 ID */
  managerId: string;
  /** 매니저 이름 */
  name: string;
  /** 이메일 */
  email?: string;
  /** 사번 */
  employeeNumber?: string;
  /** 부서명 */
  departmentName?: string;
  /** 활성 상태 */
  isActive: boolean;
  /** 비고 */
  note?: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date;
}

/**
 * 프로젝트 매니저 생성 DTO
 */
export interface CreateProjectManagerDto {
  /** SSO의 매니저 ID */
  managerId: string;
  /** 매니저 이름 */
  name: string;
  /** 이메일 */
  email?: string;
  /** 사번 */
  employeeNumber?: string;
  /** 부서명 */
  departmentName?: string;
  /** 활성 상태 */
  isActive?: boolean;
  /** 비고 */
  note?: string;
}

/**
 * 프로젝트 매니저 수정 DTO
 */
export interface UpdateProjectManagerDto {
  /** 매니저 이름 */
  name?: string;
  /** 이메일 */
  email?: string;
  /** 사번 */
  employeeNumber?: string;
  /** 부서명 */
  departmentName?: string;
  /** 활성 상태 */
  isActive?: boolean;
  /** 비고 */
  note?: string;
}

/**
 * 프로젝트 매니저 필터
 */
export interface ProjectManagerFilter {
  /** 활성 상태로 필터링 */
  isActive?: boolean;
  /** 검색어 (이름, 이메일, 사번) */
  search?: string;
  /** 삭제된 레코드 포함 여부 */
  includeDeleted?: boolean;
}

/**
 * 프로젝트 매니저 목록 조회 옵션
 */
export interface ProjectManagerListOptions {
  /** 페이지 번호 */
  page?: number;
  /** 페이지당 항목 수 */
  limit?: number;
  /** 필터 조건 */
  filter?: ProjectManagerFilter;
}

