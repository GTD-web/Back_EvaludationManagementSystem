/**
 * 하향 평가 유형
 */
export enum DownwardEvaluationType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

/**
 * 하향평가 생성 데이터
 */
export interface CreateDownwardEvaluationData {
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** WBS ID */
  wbsId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 자기평가 ID */
  selfEvaluationId?: string;
  /** 하향평가 내용 */
  downwardEvaluationContent?: string;
  /** 하향평가 점수 */
  downwardEvaluationScore?: number;
  /** 평가 유형 */
  evaluationType: DownwardEvaluationType;
  /** 평가일 */
  evaluationDate?: Date;
  /** 평가 완료 여부 */
  isCompleted?: boolean;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * 하향평가 수정 데이터
 */
export interface UpdateDownwardEvaluationData {
  /** 평가자 ID (잘못된 평가자 ID 수정용) */
  evaluatorId?: string;
  /** 자기평가 ID */
  selfEvaluationId?: string;
  /** 하향평가 내용 */
  downwardEvaluationContent?: string;
  /** 하향평가 점수 */
  downwardEvaluationScore?: number;
  /** 평가 완료 여부 */
  isCompleted?: boolean;
}

/**
 * 하향평가 DTO
 */
export interface DownwardEvaluationDto {
  /** 하향평가 고유 식별자 */
  id: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** WBS ID */
  wbsId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 자기평가 ID */
  selfEvaluationId?: string;
  /** 하향평가 내용 */
  downwardEvaluationContent?: string;
  /** 하향평가 점수 */
  downwardEvaluationScore?: number;
  /** 평가일 */
  evaluationDate: Date;
  /** 평가 유형 */
  evaluationType: DownwardEvaluationType;
  /** 평가 완료 여부 */
  isCompleted: boolean;
  /** 평가 완료일 */
  completedAt?: Date;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
  /** 삭제일시 */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 */
  version: number;
}

/**
 * 하향평가 필터
 */
export interface DownwardEvaluationFilter {
  /** 피평가자 ID */
  employeeId?: string;
  /** 평가자 ID */
  evaluatorId?: string;
  /** WBS ID */
  wbsId?: string;
  /** 평가 기간 ID */
  periodId?: string;
  /** 자기평가 ID */
  selfEvaluationId?: string;
  /** 평가 유형 */
  evaluationType?: DownwardEvaluationType;
  /** 완료된 평가만 조회 */
  completedOnly?: boolean;
  /** 미완료 평가만 조회 */
  uncompletedOnly?: boolean;
  /** 자기평가가 연결된 평가만 조회 */
  withSelfEvaluation?: boolean;
  /** 자기평가가 연결되지 않은 평가만 조회 */
  withoutSelfEvaluation?: boolean;
  /** 점수 범위 필터 - 최소 */
  scoreFrom?: number;
  /** 점수 범위 필터 - 최대 */
  scoreTo?: number;
  /** 평가일 범위 - 시작 */
  evaluationDateFrom?: Date;
  /** 평가일 범위 - 종료 */
  evaluationDateTo?: Date;
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
 * 하향 평가 통계
 */
export interface DownwardEvaluationStatistics {
  /** 전체 하향 평가 수 */
  totalEvaluations: number;
  /** 평가 유형별 통계 */
  evaluationsByType: Record<DownwardEvaluationType, number>;
  /** 완료된 평가 수 */
  completedEvaluations: number;
  /** 평균 하향평가 점수 */
  averageDownwardScore: number;
  /** 최고 점수 */
  maxScore: number;
  /** 최저 점수 */
  minScore: number;
}
