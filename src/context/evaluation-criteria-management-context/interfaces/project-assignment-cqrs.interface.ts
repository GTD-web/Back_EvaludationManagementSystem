import {
  EvaluationProjectAssignmentDto,
  CreateEvaluationProjectAssignmentData,
  UpdateEvaluationProjectAssignmentData,
  EvaluationProjectAssignmentFilter,
} from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 커맨드 서비스 인터페이스
 *
 * 데이터 변경 작업을 담당합니다.
 */
export interface IProjectAssignmentCommandService {
  // ==================== 프로젝트 할당 생명주기 커맨드 ====================

  /**
   * 프로젝트를 할당한다
   */
  프로젝트를_할당한다(
    data: CreateEvaluationProjectAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  /**
   * 프로젝트 할당을 수정한다
   */
  프로젝트_할당을_수정한다(
    id: string,
    data: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  /**
   * 프로젝트 할당을 직원 ID, 프로젝트 ID, 평가기간 ID로 수정한다
   */
  프로젝트_할당을_직원과_프로젝트로_수정한다(
    employeeId: string,
    projectId: string,
    periodId: string,
    data: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto>;

  /**
   * 프로젝트 할당을 취소한다
   */
  프로젝트_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;

  // ==================== 대량 처리 커맨드 ====================

  /**
   * 여러 프로젝트를 대량으로 할당한다
   */
  프로젝트를_대량으로_할당한다(
    assignments: CreateEvaluationProjectAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  /**
   * 평가기간의 모든 프로젝트 할당을 초기화한다
   */
  평가기간의_프로젝트_할당을_초기화한다(
    periodId: string,
    resetBy: string,
  ): Promise<void>;
}

/**
 * 프로젝트 할당 쿼리 서비스 인터페이스
 *
 * 데이터 조회 작업을 담당합니다.
 */
export interface IProjectAssignmentQueryService {
  // ==================== 기본 조회 ====================

  /**
   * 프로젝트 할당 목록을 조회한다
   */
  프로젝트_할당_목록을_조회한다(
    filter: EvaluationProjectAssignmentFilter,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  /**
   * 프로젝트 할당 상세를 조회한다
   */
  프로젝트_할당_상세를_조회한다(
    assignmentId: string,
  ): Promise<EvaluationProjectAssignmentDto | null>;

  // ==================== 직원 기준 조회 ====================

  /**
   * 직원의 프로젝트 할당을 조회한다
   */
  직원의_프로젝트_할당을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationProjectAssignmentDto[]>;

  /**
   * 할당되지 않은 직원 목록을 조회한다
   */
  할당되지_않은_직원_목록을_조회한다(
    periodId: string,
    projectId?: string,
  ): Promise<string[]>;

  // ==================== 프로젝트 기준 조회 ====================

  /**
   * 프로젝트에 할당된 직원을 조회한다
   */
  프로젝트에_할당된_직원을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationProjectAssignmentDto[]>;
}

/**
 * 프로젝트 할당 CQRS 서비스 통합 인터페이스
 */
export interface IProjectAssignmentCQRSService
  extends IProjectAssignmentCommandService,
    IProjectAssignmentQueryService {
  // 통합 서비스에서 제공하는 추가 기능들

  /**
   * 프로젝트 할당 유효성을 검증한다
   */
  프로젝트_할당_유효성을_검증한다(
    data: CreateEvaluationProjectAssignmentData,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  /**
   * 프로젝트 할당 권한을 확인한다
   */
  프로젝트_할당_권한을_확인한다(
    userId: string,
    action: 'create' | 'update' | 'delete',
    targetData?: {
      periodId?: string;
      employeeId?: string;
      projectId?: string;
    },
  ): Promise<boolean>;
}
