import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DownwardEvaluationApiClient } from '../../api-clients/downward-evaluation.api-client';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';
import { WbsSelfEvaluationScenario } from '../wbs-self-evaluation/wbs-self-evaluation.scenario';

/**
 * 하향평가 시나리오
 *
 * 하향평가 관련 모든 시나리오를 제공합니다.
 * 시나리오 문서를 기반으로 작성되었습니다.
 */
export class DownwardEvaluationScenario {
  private apiClient: DownwardEvaluationApiClient;
  private dashboardApiClient: DashboardApiClient;
  private wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new DownwardEvaluationApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
    this.wbsSelfEvaluationScenario = new WbsSelfEvaluationScenario(testSuite);
  }

  // ==================== 1차 하향평가 ====================

  /**
   * 1차 하향평가를 저장한다 (Upsert)
   */
  async 일차하향평가를_저장한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
  }): Promise<any> {
    return await this.apiClient.upsertPrimary(config);
  }

  /**
   * 1차 하향평가를 제출한다
   */
  async 일차하향평가를_제출한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<void> {
    await this.apiClient.submitPrimary(config);
  }

  /**
   * 1차 하향평가를 초기화한다 (미제출 상태로 변경)
   */
  async 일차하향평가를_초기화한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<{ message: string }> {
    return await this.apiClient.resetPrimary(config);
  }

  // ==================== 2차 하향평가 ====================

  /**
   * 2차 하향평가를 저장한다 (Upsert)
   */
  async 이차하향평가를_저장한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
  }): Promise<any> {
    return await this.apiClient.upsertSecondary(config);
  }

  /**
   * 2차 하향평가를 제출한다
   */
  async 이차하향평가를_제출한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<void> {
    await this.apiClient.submitSecondary(config);
  }

  /**
   * 2차 하향평가를 초기화한다 (미제출 상태로 변경)
   */
  async 이차하향평가를_초기화한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<{ message: string }> {
    return await this.apiClient.resetSecondary(config);
  }

  // ==================== 일괄 처리 ====================

  /**
   * 피평가자의 모든 하향평가를 일괄 제출한다
   */
  async 피평가자의_모든_하향평가를_일괄_제출한다(config: {
    evaluateeId: string;
    periodId: string;
    evaluatorId: string;
    evaluationType: 'primary' | 'secondary';
  }): Promise<{
    submittedCount: number;
    skippedCount: number;
    failedCount: number;
    submittedIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    return await this.apiClient.bulkSubmit(config);
  }

  /**
   * 피평가자의 모든 하향평가를 일괄 초기화한다
   */
  async 피평가자의_모든_하향평가를_일괄_초기화한다(config: {
    evaluateeId: string;
    periodId: string;
    evaluatorId: string;
    evaluationType: 'primary' | 'secondary';
  }): Promise<{
    resetCount: number;
    skippedCount: number;
    failedCount: number;
    resetIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/bulk-reset`,
      )
      .query({
        evaluationType: config.evaluationType,
      })
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(200);

    return response.body;
  }

  // ==================== 조회 API ====================

  /**
   * 평가자의 하향평가 목록을 조회한다
   */
  async 평가자의_하향평가_목록을_조회한다(config: {
    evaluatorId: string;
    evaluateeId?: string;
    periodId?: string;
    wbsId?: string;
    evaluationType?: 'primary' | 'secondary';
    isCompleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    return await this.apiClient.getByEvaluator(config);
  }

  // ==================== 대시보드 API ====================

  /**
   * 개별 직원의 평가기간 현황을 조회한다
   */
  async 직원의_평가기간_현황을_조회한다(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    return await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus(
      config,
    );
  }

  /**
   * 직원 할당 데이터를 조회한다
   */
  async 직원_할당_데이터를_조회한다(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    return await this.dashboardApiClient.getEmployeeAssignedData(config);
  }

  /**
   * 평가자 관점에서 피평가자 할당 데이터를 조회한다
   */
  async 평가자_관점_피평가자_할당_데이터를_조회한다(config: {
    periodId: string;
    evaluatorId: string;
    employeeId: string;
  }): Promise<any> {
    return await this.dashboardApiClient.getEvaluatorEmployeeAssignedData(
      config,
    );
  }

  /**
   * 전체 직원 현황을 조회한다
   */
  async 전체_직원_현황을_조회한다(
    periodId: string,
    includeUnregistered: boolean = false,
  ): Promise<any> {
    return await this.dashboardApiClient.getEmployeesStatus(
      periodId,
      includeUnregistered,
    );
  }

  // ==================== 선행 조건 ====================

  /**
   * 하향평가를 위한 자기평가를 작성하고 제출한다
   */
  async 하향평가를_위한_자기평가_완료(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult: string;
  }): Promise<{ selfEvaluationId: string }> {
    // 1. 자기평가 저장
    const 자기평가저장 =
      await this.wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        periodId: config.periodId,
        selfEvaluationContent: config.selfEvaluationContent,
        selfEvaluationScore: config.selfEvaluationScore,
        performanceResult: config.performanceResult,
      });

    // 2. 자기평가 제출 (1차 평가자 → 관리자)
    await this.wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
      자기평가저장.id,
    );

    return { selfEvaluationId: 자기평가저장.id };
  }
}
