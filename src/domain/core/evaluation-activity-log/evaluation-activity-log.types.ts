/**
 * 평가 활동 내역 관련 타입 정의
 */

/**
 * 활동 유형
 */
export type EvaluationActivityType =
  | 'wbs_self_evaluation'
  | 'downward_evaluation'
  | 'peer_evaluation'
  | 'additional_evaluation'
  | 'deliverable'
  | 'evaluation_status'
  | 'step_approval'
  | 'revision_request'
  | 'final_evaluation';

/**
 * 활동 액션
 */
export type EvaluationActivityAction =
  | 'created'
  | 'updated'
  | 'submitted'
  | 'completed'
  | 'cancelled'
  | 'deleted'
  | 'assigned'
  | 'unassigned'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'revision_completed'
  | 'viewed'
  | 'confirmed'
  | 'confirmation_cancelled';

/**
 * 평가 활동 내역 DTO
 */
export interface EvaluationActivityLogDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 활동 유형 */
  activityType: EvaluationActivityType;
  /** 활동 액션 */
  activityAction: EvaluationActivityAction;
  /** 활동 제목 */
  activityTitle?: string;
  /** 활동 설명 */
  activityDescription?: string;
  /** 관련 엔티티 유형 */
  relatedEntityType?: string;
  /** 관련 엔티티 ID */
  relatedEntityId?: string;
  /** 활동 수행자 ID */
  performedBy: string;
  /** 활동 수행자 이름 */
  performedByName?: string;
  /** 활동 메타데이터 */
  activityMetadata?: Record<string, any>;
  /** 활동 일시 */
  activityDate: Date;
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
 * 평가 활동 내역 생성 데이터
 */
export interface CreateEvaluationActivityLogData {
  /** 평가 기간 ID */
  periodId: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 활동 유형 */
  activityType: EvaluationActivityType;
  /** 활동 액션 */
  activityAction: EvaluationActivityAction;
  /** 활동 제목 */
  activityTitle?: string;
  /** 활동 설명 */
  activityDescription?: string;
  /** 관련 엔티티 유형 */
  relatedEntityType?: string;
  /** 관련 엔티티 ID */
  relatedEntityId?: string;
  /** 활동 수행자 ID */
  performedBy: string;
  /** 활동 수행자 이름 */
  performedByName?: string;
  /** 활동 메타데이터 */
  activityMetadata?: Record<string, any>;
  /** 활동 일시 */
  activityDate?: Date;
  /** 생성자 ID */
  createdBy?: string;
}

/**
 * 평가 활동 내역 필터
 */
export interface EvaluationActivityLogFilter {
  /** 평가 기간 ID */
  periodId?: string;
  /** 피평가자 ID */
  employeeId?: string;
  /** 활동 유형 */
  activityType?: EvaluationActivityType;
  /** 활동 액션 */
  activityAction?: EvaluationActivityAction;
  /** 활동 시작일 */
  startDate?: Date;
  /** 활동 종료일 */
  endDate?: Date;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지 크기 */
  limit?: number;
}
