import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * WBS 자기평가 관리 API 클라이언트
 *
 * WBS 자기평가 관련 모든 HTTP 요청을 캡슐화합니다.
 */
export class WbsSelfEvaluationApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  // ==================== 자기평가 저장 (Upsert) ====================

  /**
   * WBS 자기평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  async upsertWbsSelfEvaluation(data: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult?: string;
    subProject?: string | null;
  }) {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/wbs/${data.wbsItemId}/period/${data.periodId}`,
      )
      .send({
        selfEvaluationContent: data.selfEvaluationContent,
        selfEvaluationScore: data.selfEvaluationScore,
        performanceResult: data.performanceResult,
        subProject: data.subProject,
      })
      .expect(200);

    return response.body;
  }

  // ==================== 자기평가 제출 (피평가자 → 1차 평가자) ====================

  /**
   * WBS 자기평가 제출 (피평가자 → 1차 평가자, 단일)
   */
  async submitWbsSelfEvaluationToEvaluator(id: string) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/${id}/submit-to-evaluator`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 직원의 전체 WBS 자기평가 제출 (피평가자 → 1차 평가자)
   */
  async submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(data: {
    employeeId: string;
    periodId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/submit-to-evaluator`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트별 WBS 자기평가 제출 (피평가자 → 1차 평가자)
   */
  async submitWbsSelfEvaluationsToEvaluatorByProject(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/project/${data.projectId}/submit-to-evaluator`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== 자기평가 제출 (1차 평가자 → 관리자) ====================

  /**
   * WBS 자기평가 제출 (1차 평가자 → 관리자, 단일)
   */
  async submitWbsSelfEvaluation(id: string) {
    const response = await this.testSuite
      .request()
      .patch(`/admin/performance-evaluation/wbs-self-evaluations/${id}/submit`)
      .expect(200);

    return response.body;
  }

  /**
   * 직원의 전체 WBS 자기평가 제출 (1차 평가자 → 관리자)
   */
  async submitAllWbsSelfEvaluationsByEmployeePeriod(data: {
    employeeId: string;
    periodId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/submit-all`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트별 WBS 자기평가 제출 (1차 평가자 → 관리자)
   */
  async submitWbsSelfEvaluationsByProject(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/project/${data.projectId}/submit`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== 자기평가 취소 (피평가자 → 1차 평가자 제출 취소) ====================

  /**
   * WBS 자기평가 취소 (피평가자 → 1차 평가자 제출 취소, 단일)
   */
  async resetWbsSelfEvaluationToEvaluator(id: string) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/${id}/reset-to-evaluator`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 직원의 전체 WBS 자기평가 취소 (피평가자 → 1차 평가자 제출 취소)
   */
  async resetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(data: {
    employeeId: string;
    periodId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/reset-to-evaluator`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트별 WBS 자기평가 취소 (피평가자 → 1차 평가자 제출 취소)
   */
  async resetWbsSelfEvaluationsToEvaluatorByProject(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/project/${data.projectId}/reset-to-evaluator`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== 자기평가 미제출 상태로 변경 (1차 평가자 → 관리자 제출 초기화) ====================

  /**
   * WBS 자기평가 미제출 상태로 변경 (1차 평가자 → 관리자 제출 초기화, 단일)
   */
  async resetWbsSelfEvaluation(id: string) {
    const response = await this.testSuite
      .request()
      .patch(`/admin/performance-evaluation/wbs-self-evaluations/${id}/reset`)
      .expect(200);

    return response.body;
  }

  /**
   * 직원의 전체 WBS 자기평가 미제출 상태로 변경 (1차 평가자 → 관리자 제출 초기화)
   */
  async resetAllWbsSelfEvaluationsByEmployeePeriod(data: {
    employeeId: string;
    periodId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/reset`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트별 WBS 자기평가 미제출 상태로 변경 (1차 평가자 → 관리자 제출 초기화)
   */
  async resetWbsSelfEvaluationsByProject(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/project/${data.projectId}/reset`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== 자기평가 내용 초기화 (Clear) ====================

  /**
   * WBS 자기평가 내용 초기화 (단일)
   */
  async clearWbsSelfEvaluation(id: string) {
    const response = await this.testSuite
      .request()
      .patch(`/admin/performance-evaluation/wbs-self-evaluations/${id}/clear`)
      .expect(200);

    return response.body;
  }

  /**
   * 직원의 전체 WBS 자기평가 내용 초기화
   */
  async clearAllWbsSelfEvaluationsByEmployeePeriod(data: {
    employeeId: string;
    periodId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/clear-all`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트별 WBS 자기평가 내용 초기화
   */
  async clearWbsSelfEvaluationsByProject(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }) {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/project/${data.projectId}/clear`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== 자기평가 조회 ====================

  /**
   * 직원의 자기평가 목록 조회
   */
  async getEmployeeSelfEvaluations(
    employeeId: string,
    query: {
      periodId?: string;
      projectId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeId}`,
      )
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 자기평가 상세정보 조회
   */
  async getWbsSelfEvaluationDetail(id: string) {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/wbs-self-evaluations/${id}`)
      .expect(200);

    return response.body;
  }
}
