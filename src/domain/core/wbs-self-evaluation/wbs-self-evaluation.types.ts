/**
 * WBS 자가평가 관련 타입 정의
 */

/**
 * WBS 자가평가 DTO
 */
export interface WbsSelfEvaluationDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당자 ID */
  assignedBy: string;
  /** 할당일 */
  assignedDate: Date;
  /** 피평가자가 1차 평가자에게 제출한 여부 */
  submittedToEvaluator: boolean;
  /** 1차 평가자에게 제출한 일시 */
  submittedToEvaluatorAt?: Date;
  /** 1차 평가자가 관리자에게 제출한 여부 */
  submittedToManager: boolean;
  /** 관리자에게 제출한 일시 */
  submittedToManagerAt?: Date;
  /** 평가일 */
  evaluationDate: Date;
  /** 성과 입력 (실제 달성한 성과 및 결과) */
  performanceResult?: string;
  /** 자가평가 내용 */
  selfEvaluationContent?: string;
  /** 자가평가 점수 (0 ~ maxSelfEvaluationRate) */
  selfEvaluationScore?: number;
  /** 세부 프로젝트 (서브 프로젝트) */
  subProject?: string | null;
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
}

/**
 * WBS 자가평가 상세 DTO (관련 정보 포함)
 */
export interface WbsSelfEvaluationDetailDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당자 ID */
  assignedBy: string;
  /** 할당일 */
  assignedDate: Date;
  /** 피평가자가 1차 평가자에게 제출한 여부 */
  submittedToEvaluator: boolean;
  /** 1차 평가자에게 제출한 일시 */
  submittedToEvaluatorAt?: Date;
  /** 1차 평가자가 관리자에게 제출한 여부 */
  submittedToManager: boolean;
  /** 관리자에게 제출한 일시 */
  submittedToManagerAt?: Date;
  /** 평가일 */
  evaluationDate: Date;
  /** 성과 입력 (실제 달성한 성과 및 결과) */
  performanceResult?: string;
  /** 자가평가 내용 */
  selfEvaluationContent?: string;
  /** 자가평가 점수 (0 ~ maxSelfEvaluationRate) */
  selfEvaluationScore?: number;
  /** 세부 프로젝트 (서브 프로젝트) */
  subProject?: string | null;
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
}

/**
 * WBS 자가평가 생성 데이터
 */
export interface CreateWbsSelfEvaluationData {
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당자 ID */
  assignedBy: string;
  /** 성과 입력 (실제 달성한 성과 및 결과) */
  performanceResult?: string;
  /** 자가평가 내용 */
  selfEvaluationContent?: string;
  /** 자가평가 점수 (0 ~ maxSelfEvaluationRate) */
  selfEvaluationScore?: number;
  /** 세부 프로젝트 (서브 프로젝트) */
  subProject?: string | null;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * WBS 자가평가 수정 데이터
 */
export interface UpdateWbsSelfEvaluationData {
  /** 할당자 ID */
  assignedBy?: string;
  /** 피평가자가 1차 평가자에게 제출한 여부 */
  submittedToEvaluator?: boolean;
  /** submittedToEvaluator를 false로 설정할 때 submittedToEvaluatorAt도 초기화할지 여부 (재작성 요청 생성 시 사용) */
  resetSubmittedToEvaluatorAt?: boolean;
  /** 1차 평가자가 관리자에게 제출한 여부 */
  submittedToManager?: boolean;
  /** submittedToManager를 false로 설정할 때 submittedToManagerAt도 초기화할지 여부 (재작성 요청 생성 시 사용) */
  resetSubmittedToManagerAt?: boolean;
  /** 성과 입력 (실제 달성한 성과 및 결과) */
  performanceResult?: string;
  /** 자가평가 내용 */
  selfEvaluationContent?: string;
  /** 자가평가 점수 (0 ~ maxSelfEvaluationRate) */
  selfEvaluationScore?: number;
  /** 세부 프로젝트 (서브 프로젝트) */
  subProject?: string | null;
}

/**
 * WBS 자가평가 필터
 */
export interface WbsSelfEvaluationFilter {
  /** 평가 기간 ID */
  periodId?: string;
  /** 직원 ID */
  employeeId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 할당자 ID */
  assignedBy?: string;
  /** 피평가자가 1차 평가자에게 제출한 자기평가만 조회 */
  submittedToEvaluatorOnly?: boolean;
  /** 피평가자가 1차 평가자에게 미제출한 자기평가만 조회 */
  notSubmittedToEvaluatorOnly?: boolean;
  /** 1차 평가자가 관리자에게 제출한 자기평가만 조회 */
  submittedToManagerOnly?: boolean;
  /** 1차 평가자가 관리자에게 미제출한 자기평가만 조회 */
  notSubmittedToManagerOnly?: boolean;
  /** 할당일 시작 */
  assignedDateFrom?: Date;
  /** 할당일 종료 */
  assignedDateTo?: Date;
  /** 1차 평가자 제출일 시작 */
  submittedToEvaluatorDateFrom?: Date;
  /** 1차 평가자 제출일 종료 */
  submittedToEvaluatorDateTo?: Date;
  /** 관리자 제출일 시작 */
  submittedToManagerDateFrom?: Date;
  /** 관리자 제출일 종료 */
  submittedToManagerDateTo?: Date;
  /** 평가일 시작 */
  evaluationDateFrom?: Date;
  /** 평가일 종료 */
  evaluationDateTo?: Date;
  /** 점수 범위 시작 */
  scoreFrom?: number;
  /** 점수 범위 종료 */
  scoreTo?: number;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지 크기 */
  limit?: number;
  /** 정렬 기준 */
  orderBy?: string;
  /** 정렬 방향 */
  orderDirection?: 'ASC' | 'DESC';
}
