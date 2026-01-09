import type {
  ApprovalStatus,
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
  EvaluationPeriodDto,
  GradeRange,
  GradeType,
  ScoreGradeMapping,
} from '../evaluation-period.types';
import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 평가 기간 인터페이스
 * 평가 기간의 생명주기와 상태를 관리하는 인터페이스입니다.
 */
export interface IEvaluationPeriod extends IBaseEntity {
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

  // ==================== 단계별 일정 관리 ====================
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

  /**
   * 평가 기간을 시작한다
   * @param startedBy 시작한 사용자 ID
   * @throws Error 비활성 상태가 아닌 경우
   */
  평가기간_시작한다(startedBy: string): void;

  /**
   * 평가 기간을 완료한다
   * @param completedBy 완료한 사용자 ID
   * @throws Error 진행 중 상태가 아닌 경우
   */
  평가기간_완료한다(completedBy: string): void;

  /**
   * 평가 기간을 대기 상태로 되돌린다
   * @param resetBy 되돌린 사용자 ID
   * @throws Error 진행 상태가 아닌 경우
   */
  평가기간_대기상태로_되돌린다(resetBy: string): void;

  /**
   * 평가설정 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  평가설정_단계로_이동한다(movedBy: string): void;

  /**
   * 업무 수행 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  업무수행_단계로_이동한다(movedBy: string): void;

  /**
   * 자기 평가 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  자기평가_단계로_이동한다(movedBy: string): void;

  /**
   * 하향/동료 평가 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  하향동료평가_단계로_이동한다(movedBy: string): void;

  /**
   * 종결 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  종결_단계로_이동한다(movedBy: string): void;

  /**
   * 평가 기준 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  평가기준설정_수동허용_활성화한다(enabledBy: string): void;

  /**
   * 자기 평가 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  자기평가설정_수동허용_활성화한다(enabledBy: string): void;

  /**
   * 하향/동료평가 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  하향동료평가설정_수동허용_활성화한다(enabledBy: string): void;

  /**
   * 자기평가 달성률 최대값을 설정한다
   * @param maxRate 최대 달성률 (%)
   * @param setBy 설정한 사용자 ID
   */
  자기평가_달성률최대값_설정한다(maxRate: number, setBy: string): void;

  /**
   * 현재 상태가 시작 가능한지 확인한다
   * @returns 시작 가능 여부
   */
  시작_가능한가(): boolean;

  /**
   * 현재 상태가 완료 가능한지 확인한다
   * @returns 완료 가능 여부
   */
  완료_가능한가(): boolean;

  /**
   * 현재 상태가 활성화된 상태인지 확인한다
   * @returns 활성화 상태 여부
   */
  활성화된_상태인가(): boolean;

  /**
   * 현재 상태가 완료된 상태인지 확인한다
   * @returns 완료 상태 여부
   */
  완료된_상태인가(): boolean;

  /**
   * 대기 단계인지 확인한다
   * @returns 대기 단계 여부
   */
  대기_단계인가(): boolean;

  /**
   * 평가설정 단계인지 확인한다
   * @returns 평가설정 단계 여부
   */
  평가설정_단계인가(): boolean;

  /**
   * 업무 수행 단계인지 확인한다
   * @returns 업무 수행 단계 여부
   */
  업무수행_단계인가(): boolean;

  /**
   * 자기 평가 단계인지 확인한다
   * @returns 자기 평가 단계 여부
   */
  자기평가_단계인가(): boolean;

  /**
   * 하향/동료평가 단계인지 확인한다
   * @returns 하향/동료평가 단계 여부
   */
  하향동료평가_단계인가(): boolean;

  /**
   * 종결 단계인지 확인한다
   * @returns 종결 단계 여부
   */
  종결_단계인가(): boolean;

  /**
   * 현재 날짜가 평가 기간 내인지 확인한다
   * @returns 평가 기간 내 여부
   */
  평가기간_내인가(): boolean;

  /**
   * 평가 기간이 만료되었는지 확인한다
   * @returns 만료 여부
   */
  만료된_상태인가(): boolean;

  /**
   * 상태 전이가 유효한지 확인한다
   * @param targetStatus 목표 상태
   * @returns 유효한 전이 여부
   */
  상태전이_유효한가(targetStatus: EvaluationPeriodStatus): boolean;

  /**
   * 단계 전이가 유효한지 확인한다
   * @param targetPhase 목표 단계
   * @returns 유효한 전이 여부
   */
  단계전이_유효한가(targetPhase: EvaluationPeriodPhase): boolean;

  /**
   * 자기평가 달성률이 유효한지 확인한다
   * @param rate 확인할 달성률
   * @returns 유효성 여부
   */
  자기평가_달성률_유효한가(rate: number): boolean;

  /**
   * 자기평가 달성률 최대값을 반환한다
   * @returns 최대 달성률 (%)
   */
  자기평가_달성률_최대값(): number;

  /**
   * 평가 기간 정보를 업데이트한다
   * @param name 새로운 평가 기간명
   * @param description 새로운 설명
   * @param updatedBy 수정자 ID
   */
  정보_업데이트한다(
    name?: string,
    description?: string,
    updatedBy?: string,
  ): void;

  /**
   * 평가 기간 일정을 업데이트한다
   * @param startDate 새로운 시작일
   * @param updatedBy 수정자 ID
   */
  일정_업데이트한다(startDate?: Date, updatedBy?: string): void;

  /**
   * 단계별 마감일을 업데이트한다
   * @param evaluationSetupDeadline 평가설정 단계 마감일
   * @param performanceDeadline 업무 수행 단계 마감일
   * @param selfEvaluationDeadline 자기 평가 단계 마감일
   * @param peerEvaluationDeadline 하향/동료평가 단계 마감일
   * @param updatedBy 수정자 ID
   */
  단계별_마감일_업데이트한다(
    evaluationSetupDeadline?: Date,
    performanceDeadline?: Date,
    selfEvaluationDeadline?: Date,
    peerEvaluationDeadline?: Date,
    updatedBy?: string,
  ): void;

  /**
   * 특정 단계의 마감일을 설정한다
   * @param phase 대상 단계
   * @param deadline 마감일
   * @param setBy 설정자 ID
   */
  단계_마감일_설정한다(
    phase: EvaluationPeriodPhase,
    deadline: Date,
    setBy: string,
  ): void;

  /**
   * 특정 단계의 마감일을 조회한다
   * @param phase 대상 단계
   * @returns 해당 단계의 마감일
   */
  단계_마감일_조회한다(phase: EvaluationPeriodPhase): Date | null;

  /**
   * 특정 단계가 마감되었는지 확인한다
   * @param phase 대상 단계
   * @returns 마감 여부
   */
  단계_마감된_상태인가(phase: EvaluationPeriodPhase): boolean;

  // ==================== 등급 구간 관리 ====================
  /**
   * 등급 구간을 설정한다
   */
  등급구간_설정한다(gradeRanges: GradeRange[], setBy: string): void;

  /**
   * 점수에 해당하는 등급을 조회한다
   */
  점수로_등급_조회한다(score: number): ScoreGradeMapping | null;

  /**
   * 등급 구간이 설정되어 있는지 확인한다
   */
  등급구간_설정됨(): boolean;

  /**
   * 특정 등급의 구간 정보를 조회한다
   */
  등급구간_조회한다(grade: string): GradeRange | null;

  /**
   * 결재 문서 ID를 설정한다
   * @param approvalDocumentId 결재 문서 ID
   * @param setBy 설정한 사용자 ID
   */
  결재문서ID_설정한다(approvalDocumentId: string, setBy: string): void;

  /**
   * 결재 상태를 변경한다
   * @param approvalStatus 결재 상태
   * @param changedBy 변경한 사용자 ID
   */
  결재상태_변경한다(approvalStatus: ApprovalStatus, changedBy: string): void;

  /**
   * 평가 기간을 DTO로 변환한다
   * @returns 평가 기간 DTO 객체
   */
  DTO_변환한다(): EvaluationPeriodDto;
}
