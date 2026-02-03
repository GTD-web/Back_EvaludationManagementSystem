/**
 * 평가 기간 상태 (3단계)
 */
export enum EvaluationPeriodStatus {
  /** 대기 - 평가 기간이 시작되지 않은 상태 */
  WAITING = 'waiting',
  /** 진행 - 평가 기간이 진행 중인 상태 */
  IN_PROGRESS = 'in-progress',
  /** 완료 - 평가 기간이 완료된 상태 */
  COMPLETED = 'completed',
}

/**
 * 결재 상태
 */
export enum ApprovalStatus {
  /** 결재 요청 전 */
  NONE = 'none',
  /** 결재 대기 중 */
  PENDING = 'pending',
  /** 결재 승인됨 */
  APPROVED = 'approved',
  /** 결재 거부됨 */
  REJECTED = 'rejected',
  /** 결재 취소됨 */
  CANCELLED = 'cancelled',
  /** 결재 완료 후 실행됨 */
  IMPLEMENTED = 'implemented',
}

/**
 * 평가 기간 현재 단계 (6단계)
 */
export enum EvaluationPeriodPhase {
  /** 대기 - 평가 기간 시작 전 */
  WAITING = 'waiting',
  /** 평가설정 - 평가 기준 및 설정 단계 */
  EVALUATION_SETUP = 'evaluation-setup',
  /** 업무 수행 - 실제 업무 수행 단계 */
  PERFORMANCE = 'performance',
  /** 자기 평가 - 자기 평가 단계 */
  SELF_EVALUATION = 'self-evaluation',
  /** 하향/동료 평가 - 상급자 및 동료 평가 단계 */
  PEER_EVALUATION = 'peer-evaluation',
  /** 종결 - 평가 완료 및 결과 확정 단계 */
  CLOSURE = 'closure',
}

/**
 * 평가 기간 생성 DTO
 */
export interface CreateEvaluationPeriodDto {
  /** 평가 기간명 */
  name: string;
  /** 평가 기간 시작일 */
  startDate: Date;
  /** 평가 기간 설명 */
  description?: string;
  /** 평가설정 단계 마감일 */
  evaluationSetupDeadline?: Date;
  /** 업무 수행 단계 마감일 */
  performanceDeadline?: Date;
  /** 자기 평가 단계 마감일 */
  selfEvaluationDeadline?: Date;
  /** 하향/동료평가 단계 마감일 */
  peerEvaluationDeadline?: Date;
  /** 자기평가 달성률 최대값 (%) */
  maxSelfEvaluationRate?: number;
  /** 등급 구간 설정 */
  gradeRanges?: CreateGradeRangeDto[];
}

/**
 * 평가 기간 업데이트 DTO
 */
export interface UpdateEvaluationPeriodDto {
  /** 평가 기간명 */
  name?: string;
  /** 평가 기간 시작일 */
  startDate?: Date;
  /** 평가 기간 설명 */
  description?: string;
  /** 평가설정 단계 마감일 */
  evaluationSetupDeadline?: Date;
  /** 업무 수행 단계 마감일 */
  performanceDeadline?: Date;
  /** 자기 평가 단계 마감일 */
  selfEvaluationDeadline?: Date;
  /** 하향/동료평가 단계 마감일 */
  peerEvaluationDeadline?: Date;
  /** 자기평가 달성률 최대값 (%) */
  maxSelfEvaluationRate?: number;
  /** 등급 구간 설정 */
  gradeRanges?: CreateGradeRangeDto[];
}

/**
 * 평가 기간 DTO
 */
export interface EvaluationPeriodDto {
  /** 평가 기간 고유 식별자 */
  id: string;
  /** 평가 기간명 */
  name: string;
  /** 평가 기간 시작일 */
  startDate: Date;
  /** 평가 기간 설명 */
  description?: string;
  /** 평가 기간 상태 */
  status: EvaluationPeriodStatus;
  /** 현재 진행 단계 */
  currentPhase?: EvaluationPeriodPhase;

  // ==================== 단계별 마감일 ====================
  /** 평가설정 단계 마감일 */
  evaluationSetupDeadline?: Date;
  /** 업무 수행 단계 마감일 */
  performanceDeadline?: Date;
  /** 자기 평가 단계 마감일 */
  selfEvaluationDeadline?: Date;
  /** 하향/동료평가 단계 마감일 */
  peerEvaluationDeadline?: Date;
  /** 평가 완료일 */
  completedDate?: Date;
  /** 평가 기준 설정 수동 허용 여부 */
  criteriaSettingEnabled: boolean;
  /** 자기 평가 설정 수동 허용 여부 */
  selfEvaluationSettingEnabled: boolean;
  /** 하향/동료평가 설정 수동 허용 여부 */
  finalEvaluationSettingEnabled: boolean;
  /** 자기평가 달성률 최대값 (%) */
  maxSelfEvaluationRate: number;
  /** 등급 구간 설정 */
  gradeRanges: GradeRange[];
  /** 결재 문서 ID */
  approvalDocumentId?: string;
  /** 결재 상태 */
  approvalStatus: ApprovalStatus;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 평가 기간 필터
 */
export interface EvaluationPeriodFilter {
  /** 상태별 필터 */
  status?: EvaluationPeriodStatus;
  /** 현재 단계별 필터 */
  currentPhase?: EvaluationPeriodPhase;
  /** 기간별 필터 - 시작일 */
  startDateFrom?: Date;
  /** 기간별 필터 - 종료일 */
  endDateTo?: Date;
  /** 활성화된 기간만 조회 */
  activeOnly?: boolean;
  /** 자기평가 달성률 최대값 범위 - 최소 */
  maxSelfEvaluationRateFrom?: number;
  /** 자기평가 달성률 최대값 범위 - 최대 */
  maxSelfEvaluationRateTo?: number;
}

/**
 * 단계별 마감일 설정 DTO
 */
export interface PhaseDeadlineDto {
  /** 대상 단계 */
  phase: EvaluationPeriodPhase;
  /** 마감일 */
  deadline: Date;
}

/**
 * 단계별 마감일 현황 DTO
 */
export interface PhaseDeadlineStatusDto {
  /** 평가설정 단계 마감일 */
  evaluationSetupDeadline?: Date;
  /** 업무 수행 단계 마감일 */
  performanceDeadline?: Date;
  /** 자기 평가 단계 마감일 */
  selfEvaluationDeadline?: Date;
  /** 하향/동료평가 단계 마감일 */
  peerEvaluationDeadline?: Date;
  /** 각 단계별 마감 여부 */
  deadlineStatus: {
    evaluationSetupExpired: boolean;
    performanceExpired: boolean;
    selfEvaluationExpired: boolean;
    peerEvaluationExpired: boolean;
  };
}

/**
 * 단계별 마감일 업데이트 DTO
 */
export interface UpdatePhaseDeadlinesDto {
  /** 평가설정 단계 마감일 */
  evaluationSetupDeadline?: Date;
  /** 업무 수행 단계 마감일 */
  performanceDeadline?: Date;
  /** 자기 평가 단계 마감일 */
  selfEvaluationDeadline?: Date;
  /** 하향/동료평가 단계 마감일 */
  peerEvaluationDeadline?: Date;
}

// ==================== 등급 구간 Value Object ====================

/**
 * 등급 타입
 */
export enum GradeType {
  S = 'S',
  A = 'A',
  B = 'B',
  C = 'C',
  F = 'F',
}

/**
 * 세부 등급 타입
 */
export enum SubGradeType {
  PLUS = 'plus',
  NONE = 'none',
  MINUS = 'minus',
}

/**
 * 세부 등급 정보
 */
export interface SubGradeInfo {
  /** 세부 등급 타입 */
  type: SubGradeType;
  /** 최소 범위 */
  minRange: number;
  /** 최대 범위 */
  maxRange: number;
}

/**
 * 등급 구간 Value Object
 */
export interface GradeRange {
  /** 등급 */
  grade: string;
  /** 최소 범위 */
  minRange: number;
  /** 최대 범위 */
  maxRange: number;
  /** 세부 등급 정보 */
  subGrades?: SubGradeInfo[];
}

/**
 * 등급 구간 생성 DTO
 */
export interface CreateGradeRangeDto {
  /** 등급 */
  grade: string;
  /** 최소 범위 */
  minRange: number;
  /** 최대 범위 */
  maxRange: number;
  /** 세부 등급 정보 */
  subGrades?: SubGradeInfo[];
}

/**
 * 점수 등급 매핑 결과
 */
export interface ScoreGradeMapping {
  /** 점수 */
  score: number;
  /** 등급 */
  grade: string;
  /** 세부 등급 */
  subGrade?: SubGradeType;
  /** 최종 등급 문자열 (예: S+, A-, B) */
  finalGrade: string;
}
