/**
 * 평가 WBS 할당 관련 타입 정의
 */

/**
 * 평가 WBS 할당 DTO
 */
export interface EvaluationWbsAssignmentDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당일 */
  assignedDate: Date;
  /** 할당자 ID */
  assignedBy: string;
  /** 표시 순서 (같은 프로젝트-평가기간 내에서의 순서) */
  displayOrder: number;
  /** 가중치 (0~100, 직원별 WBS 중요도 기반 자동 계산) */
  weight: number;
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
  /** WBS 항목 제목 */
  wbsItemTitle?: string;
  /** WBS 항목 코드 */
  wbsItemCode?: string;
  /** 할당자 이름 */
  assignedByName?: string;
}

/**
 * 평가 WBS 할당 생성 데이터
 */
export interface CreateEvaluationWbsAssignmentData {
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당자 ID */
  assignedBy: string;
  /** 표시 순서 (선택적, 지정하지 않으면 자동 계산) */
  displayOrder?: number;
}

/**
 * 평가 WBS 할당 수정 데이터
 */
export interface UpdateEvaluationWbsAssignmentData {
  /** 할당자 ID */
  assignedBy?: string;
}

/**
 * 평가 WBS 할당 필터
 */
export interface EvaluationWbsAssignmentFilter {
  /** 평가 기간 ID */
  periodId?: string;
  /** 직원 ID */
  employeeId?: string;
  /** 프로젝트 ID */
  projectId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 할당자 ID */
  assignedBy?: string;
  /** 할당일 시작 */
  assignedDateFrom?: Date;
  /** 할당일 종료 */
  assignedDateTo?: Date;
}

/**
 * 순서 변경 방향 Enum
 */
export enum OrderDirection {
  UP = 'up',
  DOWN = 'down',
}

/**
 * WBS 할당 순서 변경 데이터
 */
export interface ChangeWbsAssignmentOrderData {
  /** 할당 ID */
  assignmentId: string;
  /** 이동 방향 */
  direction: OrderDirection;
  /** 변경 수행자 ID */
  updatedBy: string;
}
