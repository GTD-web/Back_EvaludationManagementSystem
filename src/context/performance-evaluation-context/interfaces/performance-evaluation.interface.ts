// 성과평가 컨텍스트 인터페이스 정의
import {
  EmployeeSelfEvaluationsResponseDto,
  WbsSelfEvaluationBasicDto,
  WbsSelfEvaluationResponseDto,
} from '@interface/common/dto/performance-evaluation/wbs-self-evaluation.dto';
import {
  GetDownwardEvaluationDetailQuery,
  GetDownwardEvaluationListQuery,
} from '../handlers/downward-evaluation';
import {
  GetFinalEvaluationByEmployeePeriodQuery,
  GetFinalEvaluationListQuery,
  GetFinalEvaluationQuery,
} from '../handlers/final-evaluation';
import {
  GetPeerEvaluationDetailQuery,
  GetPeerEvaluationListQuery,
} from '../handlers/peer-evaluation';
import {
  GetEmployeeSelfEvaluationsQuery,
  GetWbsSelfEvaluationDetailQuery,
} from '../handlers/self-evaluation';

/**
 * 성과평가 컨텍스트 서비스 인터페이스
 */
export interface IPerformanceEvaluationService {
  // ==================== 자기평가(성과입력) 관련 메서드 ====================

  /**
   * WBS 자기평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  WBS자기평가를_저장한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    selfEvaluationContent?: string,
    selfEvaluationScore?: number,
    performanceResult?: string,
    subProject?: string,
    actionBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto>;

  /**
   * WBS 자기평가를 생성한다
   */
  WBS자기평가를_생성한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    selfEvaluationContent?: string,
    selfEvaluationScore?: number,
    performanceResult?: string,
    createdBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto>;

  /**
   * WBS 자기평가를 수정한다
   */
  WBS자기평가를_수정한다(
    evaluationId: string,
    selfEvaluationContent?: string,
    selfEvaluationScore?: number,
    performanceResult?: string,
    updatedBy?: string,
  ): Promise<WbsSelfEvaluationBasicDto>;

  /**
   * WBS 자기평가를 제출한다
   */
  WBS자기평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto>;

  /**
   * 직원의 자기평가 목록을 조회한다
   */
  직원의_자기평가_목록을_조회한다(
    query: GetEmployeeSelfEvaluationsQuery,
  ): Promise<EmployeeSelfEvaluationsResponseDto>;

  /**
   * WBS 자기평가 상세정보를 조회한다
   */
  WBS자기평가_상세정보를_조회한다(
    query: GetWbsSelfEvaluationDetailQuery,
  ): Promise<any>;

  /**
   * 직원의 전체 WBS 자기평가를 승인 시 제출한다
   * 승인 시 submittedToEvaluator와 submittedToManager를 모두 true로 설정합니다.
   */
  직원의_전체_자기평가를_승인시_제출한다(
    employeeId: string,
    periodId: string,
    submittedBy?: string,
  ): Promise<any>;

  // ==================== 동료평가 관련 메서드 ====================

  /**
   * 동료평가를 생성한다
   */
  동료평가를_생성한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    projectId: string,
    requestDeadline?: Date,
    evaluationContent?: string,
    score?: number,
    createdBy?: string,
  ): Promise<string>;

  /**
   * 동료평가를_수정한다
   */
  동료평가를_수정한다(
    evaluationId: string,
    evaluationContent?: string,
    score?: number,
    updatedBy?: string,
  ): Promise<void>;

  /**
   * 동료평가를 제출한다
   */
  동료평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<void>;

  /**
   * 동료평가 목록을 조회한다
   */
  동료평가_목록을_조회한다(query: GetPeerEvaluationListQuery): Promise<any>;

  /**
   * 동료평가 상세정보를 조회한다
   */
  동료평가_상세정보를_조회한다(
    query: GetPeerEvaluationDetailQuery,
  ): Promise<any>;

  // ==================== 하향평가 관련 메서드 ====================

  /**
   * 하향평가를 생성한다
   */
  하향평가를_생성한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    projectId: string,
    selfEvaluationId?: string,
    evaluationType?: string,
    downwardEvaluationContent?: string,
    downwardEvaluationScore?: number,
    createdBy?: string,
  ): Promise<string>;

  /**
   * 하향평가를 수정한다
   */
  하향평가를_수정한다(
    evaluationId: string,
    downwardEvaluationContent?: string,
    downwardEvaluationScore?: number,
    updatedBy?: string,
  ): Promise<void>;

  /**
   * 하향평가를 제출한다
   */
  하향평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<void>;

  /**
   * 1차 하향평가를 제출한다
   */
  일차_하향평가를_제출한다(
    evaluateeId: string,
    periodId: string,
    projectId: string,
    evaluatorId: string,
    submittedBy: string,
    approveAllBelow?: boolean,
  ): Promise<void>;

  /**
   * 2차 하향평가를 제출한다
   */
  이차_하향평가를_제출한다(
    evaluateeId: string,
    periodId: string,
    projectId: string,
    evaluatorId: string,
    submittedBy: string,
    approveAllBelow?: boolean,
  ): Promise<void>;

  /**
   * 하향평가 목록을 조회한다
   */
  하향평가_목록을_조회한다(query: GetDownwardEvaluationListQuery): Promise<any>;

  /**
   * 하향평가 상세정보를 조회한다
   */
  하향평가_상세정보를_조회한다(
    query: GetDownwardEvaluationDetailQuery,
  ): Promise<any>;

  // ==================== 최종평가 관련 메서드 ====================

  /**
   * 최종평가를 생성한다
   */
  최종평가를_생성한다(
    employeeId: string,
    periodId: string,
    evaluationGrade: string,
    jobGrade: any,
    jobDetailedGrade: any,
    finalComments?: string,
    createdBy?: string,
  ): Promise<string>;

  /**
   * 최종평가를 수정한다
   */
  최종평가를_수정한다(
    id: string,
    evaluationGrade?: string,
    jobGrade?: any,
    jobDetailedGrade?: any,
    finalComments?: string,
    updatedBy?: string,
  ): Promise<void>;

  /**
   * 최종평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  최종평가를_저장한다(
    employeeId: string,
    periodId: string,
    evaluationGrade: string,
    jobGrade: any,
    jobDetailedGrade: any,
    finalComments?: string,
    actionBy?: string,
  ): Promise<string>;

  /**
   * 최종평가를 삭제한다
   */
  최종평가를_삭제한다(id: string, deletedBy?: string): Promise<void>;

  /**
   * 최종평가를 확정한다
   */
  최종평가를_확정한다(id: string, confirmedBy: string): Promise<void>;

  /**
   * 최종평가 확정을 취소한다
   */
  최종평가_확정을_취소한다(id: string, updatedBy: string): Promise<void>;

  /**
   * 최종평가를 조회한다
   */
  최종평가를_조회한다(query: GetFinalEvaluationQuery): Promise<any>;

  /**
   * 최종평가 목록을 조회한다
   */
  최종평가_목록을_조회한다(query: GetFinalEvaluationListQuery): Promise<any>;

  /**
   * 직원-평가기간별 최종평가를 조회한다
   */
  직원_평가기간별_최종평가를_조회한다(
    query: GetFinalEvaluationByEmployeePeriodQuery,
  ): Promise<any>;
}
