import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';
import { WbsSelfEvaluationApiClient } from '../../api-clients/wbs-self-evaluation.api-client';

/**
 * WBS 자기평가 관리 시나리오
 *
 * WBS 자기평가 관련 모든 시나리오를 제공합니다.
 */
export class WbsSelfEvaluationScenario {
  private apiClient: WbsSelfEvaluationApiClient;
  private dashboardApiClient: DashboardApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new WbsSelfEvaluationApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
  }

  // ==================== 자기평가 저장 ====================

  /**
   * WBS 자기평가를 저장한다 (신규 생성 또는 수정)
   */
  async WBS자기평가를_저장한다(data: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult?: string;
    subProject?: string | null;
  }) {
    return await this.apiClient.upsertWbsSelfEvaluation(data);
  }

  // ==================== 자기평가 제출 (피평가자 → 1차 평가자) ====================

  /**
   * WBS 자기평가를 1차 평가자에게 제출한다 (피평가자 → 1차 평가자, 단일)
   */
  async WBS자기평가를_1차평가자에게_제출한다(evaluationId: string) {
    return await this.apiClient.submitWbsSelfEvaluationToEvaluator(
      evaluationId,
    );
  }

  /**
   * 직원의 전체 WBS 자기평가를 1차 평가자에게 제출한다
   */
  async 직원의_전체_WBS자기평가를_1차평가자에게_제출한다(data: {
    employeeId: string;
    periodId: string;
  }) {
    return await this.apiClient.submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(
      data,
    );
  }

  /**
   * 프로젝트별 WBS 자기평가를 1차 평가자에게 제출한다
   */
  async 프로젝트별_WBS자기평가를_1차평가자에게_제출한다(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    return await this.apiClient.submitWbsSelfEvaluationsToEvaluatorByProject(
      data,
    );
  }

  // ==================== 자기평가 제출 (1차 평가자 → 관리자) ====================

  /**
   * WBS 자기평가를 관리자에게 제출한다 (1차 평가자 → 관리자, 단일)
   */
  async WBS자기평가를_관리자에게_제출한다(evaluationId: string) {
    return await this.apiClient.submitWbsSelfEvaluation(evaluationId);
  }

  /**
   * 직원의 전체 WBS 자기평가를 관리자에게 제출한다
   */
  async 직원의_전체_WBS자기평가를_관리자에게_제출한다(data: {
    employeeId: string;
    periodId: string;
  }) {
    return await this.apiClient.submitAllWbsSelfEvaluationsByEmployeePeriod(
      data,
    );
  }

  /**
   * 프로젝트별 WBS 자기평가를 관리자에게 제출한다
   */
  async 프로젝트별_WBS자기평가를_관리자에게_제출한다(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    return await this.apiClient.submitWbsSelfEvaluationsByProject(data);
  }

  // ==================== 자기평가 취소 (피평가자 → 1차 평가자 제출 취소) ====================

  /**
   * WBS 자기평가를 1차 평가자 제출 취소한다 (피평가자 → 1차 평가자 제출 취소, 단일)
   */
  async WBS자기평가를_1차평가자_제출_취소한다(evaluationId: string) {
    return await this.apiClient.resetWbsSelfEvaluationToEvaluator(evaluationId);
  }

  /**
   * 직원의 전체 WBS 자기평가를 1차 평가자 제출 취소한다
   */
  async 직원의_전체_WBS자기평가를_1차평가자_제출_취소한다(data: {
    employeeId: string;
    periodId: string;
  }) {
    return await this.apiClient.resetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(
      data,
    );
  }

  /**
   * 프로젝트별 WBS 자기평가를 1차 평가자 제출 취소한다
   */
  async 프로젝트별_WBS자기평가를_1차평가자_제출_취소한다(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    return await this.apiClient.resetWbsSelfEvaluationsToEvaluatorByProject(
      data,
    );
  }

  // ==================== 자기평가 미제출 상태로 변경 (1차 평가자 → 관리자 제출 초기화) ====================

  /**
   * WBS 자기평가를 미제출 상태로 변경한다 (1차 평가자 → 관리자 제출 초기화, 단일)
   */
  async WBS자기평가를_미제출_상태로_변경한다(evaluationId: string) {
    return await this.apiClient.resetWbsSelfEvaluation(evaluationId);
  }

  /**
   * 직원의 전체 WBS 자기평가를 미제출 상태로 변경한다
   */
  async 직원의_전체_WBS자기평가를_미제출_상태로_변경한다(data: {
    employeeId: string;
    periodId: string;
  }) {
    return await this.apiClient.resetAllWbsSelfEvaluationsByEmployeePeriod(
      data,
    );
  }

  /**
   * 프로젝트별 WBS 자기평가를 미제출 상태로 변경한다
   */
  async 프로젝트별_WBS자기평가를_미제출_상태로_변경한다(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    return await this.apiClient.resetWbsSelfEvaluationsByProject(data);
  }

  // ==================== 자기평가 내용 초기화 (Clear) ====================

  /**
   * WBS 자기평가 내용을 초기화한다 (단일)
   */
  async WBS자기평가_내용을_초기화한다(evaluationId: string) {
    return await this.apiClient.clearWbsSelfEvaluation(evaluationId);
  }

  /**
   * 직원의 전체 WBS 자기평가 내용을 초기화한다
   */
  async 직원의_전체_WBS자기평가_내용을_초기화한다(data: {
    employeeId: string;
    periodId: string;
  }) {
    return await this.apiClient.clearAllWbsSelfEvaluationsByEmployeePeriod(
      data,
    );
  }

  /**
   * 프로젝트별 WBS 자기평가 내용을 초기화한다
   */
  async 프로젝트별_WBS자기평가_내용을_초기화한다(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    return await this.apiClient.clearWbsSelfEvaluationsByProject(data);
  }

  // ==================== 자기평가 조회 ====================

  /**
   * 직원의 자기평가 목록을 조회한다
   */
  async 직원의_자기평가_목록을_조회한다(
    employeeId: string,
    query: {
      periodId?: string;
      projectId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return await this.apiClient.getEmployeeSelfEvaluations(employeeId, query);
  }

  /**
   * WBS 자기평가 상세정보를 조회한다
   */
  async WBS자기평가_상세정보를_조회한다(evaluationId: string) {
    return await this.apiClient.getWbsSelfEvaluationDetail(evaluationId);
  }

  // ==================== 대시보드 API 조회 ====================

  /**
   * 직원의 평가기간 현황을 조회한다
   */
  async 직원의_평가기간_현황을_조회한다(data: {
    periodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus(
      data,
    );
  }

  /**
   * 평가자 담당 대상자 현황을 조회한다
   */
  async 평가자_담당_대상자_현황을_조회한다(data: {
    periodId: string;
    evaluatorId: string;
  }) {
    return await this.dashboardApiClient.getEvaluatorTargetsStatus(data);
  }

  /**
   * 직원 할당 데이터를 조회한다
   */
  async 직원_할당_데이터를_조회한다(data: {
    periodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeAssignedData(data);
  }

  /**
   * 나의 할당 데이터를 조회한다 (현재 로그인 사용자)
   */
  async 나의_할당_데이터를_조회한다(periodId: string) {
    return await this.dashboardApiClient.getMyAssignedData(periodId);
  }

  /**
   * 전체 직원 현황을 조회한다
   */
  async 전체_직원_현황을_조회한다(
    periodId: string,
    includeUnregistered: boolean = false,
  ) {
    return await this.dashboardApiClient.getEmployeesStatus(
      periodId,
      includeUnregistered,
    );
  }
}
