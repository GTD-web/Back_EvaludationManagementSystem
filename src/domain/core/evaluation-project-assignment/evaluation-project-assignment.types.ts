/**
 * 평가 프로젝트 할당 관련 타입 정의
 */

/**
 * 평가 프로젝트 할당 DTO
 */
export interface EvaluationProjectAssignmentDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 할당일 */
  assignedDate: Date;
  /** 할당자 ID */
  assignedBy: string;
  /** 표시 순서 (같은 직원-평가기간 내에서의 순서) */
  displayOrder: number;
  /** 프로젝트 시작일 */
  projectStartDate?: Date;
  /** 프로젝트 종료일 */
  projectEndDate?: Date;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 */
  version: number;

  // 조인된 정보 (선택적)
  /** 평가기간 이름 */
  periodName?: string;
  /** 직원 이름 */
  employeeName?: string;
  /** 프로젝트 이름 */
  projectName?: string;
  /** 할당자 이름 */
  assignedByName?: string;
}

/**
 * 평가 프로젝트 할당 상세 DTO (관련 정보 포함)
 */
export interface EvaluationProjectAssignmentDetailDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 할당일 */
  assignedDate: Date;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 */
  version: number;

  /** 평가기간 정보 */
  evaluationPeriod?: {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date;
    status: string;
    description?: string;
  } | null;

  /** 직원 정보 */
  employee?: {
    id: string;
    employeeNumber: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    status: string;
    departmentId?: string;
    departmentName?: string;
  } | null;

  /** 프로젝트 정보 */
  project?: {
    id: string;
    name: string;
    projectCode: string;
    grade?: '1A' | '1B' | '2A' | '2B' | '3A';
    priority?: number;
    managerId?: string;
  } | null;

  /** 할당자 정보 */
  assignedBy?: {
    id: string;
    employeeNumber: string;
    name: string;
    email?: string;
    departmentId?: string;
    departmentName?: string;
  } | null;
}

/**
 * 평가 프로젝트 할당 생성 데이터
 */
export interface CreateEvaluationProjectAssignmentData {
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 할당자 ID */
  assignedBy: string;
  /** 표시 순서 (선택적, 미지정시 자동 계산) */
  displayOrder?: number;
  /** 프로젝트 시작일 (선택적) */
  projectStartDate?: Date;
  /** 프로젝트 종료일 (선택적) */
  projectEndDate?: Date;
}

/**
 * 평가 프로젝트 할당 수정 데이터
 */
export interface UpdateEvaluationProjectAssignmentData {
  /** 프로젝트 ID (선택적) */
  projectId?: string;
  /** 할당자 ID */
  assignedBy?: string;
  /** 표시 순서 (선택적) */
  displayOrder?: number;
  /** 프로젝트 시작일 (선택적) */
  projectStartDate?: Date;
  /** 프로젝트 종료일 (선택적) */
  projectEndDate?: Date;
}

/**
 * 평가 프로젝트 할당 필터
 */
export interface EvaluationProjectAssignmentFilter {
  /** 평가 기간 ID */
  periodId?: string;
  /** 직원 ID */
  employeeId?: string;
  /** 프로젝트 ID */
  projectId?: string;
  /** 할당자 ID */
  assignedBy?: string;
  /** 할당일 시작 */
  assignedDateFrom?: Date;
  /** 할당일 종료 */
  assignedDateTo?: Date;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지 크기 */
  limit?: number;
  /** 정렬 기준 */
  orderBy?: string;
  /** 정렬 방향 */
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * 순서 변경 방향 Enum
 */
export enum OrderDirection {
  UP = 'up',
  DOWN = 'down',
}

/**
 * 프로젝트 할당 순서 변경 데이터
 */
export interface ChangeProjectAssignmentOrderData {
  /** 할당 ID */
  assignmentId: string;
  /** 이동 방향 */
  direction: OrderDirection;
  /** 변경 수행자 ID */
  updatedBy: string;
}

/**
 * 순서 재정렬 데이터
 */
export interface ReorderProjectAssignmentsData {
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 재정렬 수행자 ID */
  updatedBy: string;
}
