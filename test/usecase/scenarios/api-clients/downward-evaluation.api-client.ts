import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 하향평가 API 클라이언트
 *
 * 하향평가 관련 HTTP 요청을 캡슐화합니다.
 * - 1차/2차 하향평가 저장 (Upsert)
 * - 하향평가 제출
 * - 하향평가 초기화
 * - 하향평가 조회 (목록/상세)
 */
export class DownwardEvaluationApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 1차 하향평가 저장 (Upsert)
   */
  async upsertPrimary(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/primary`,
      )
      .send({
        evaluatorId: config.evaluatorId,
        selfEvaluationId: config.selfEvaluationId,
        downwardEvaluationContent: config.downwardEvaluationContent,
        downwardEvaluationScore: config.downwardEvaluationScore,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 2차 하향평가 저장 (Upsert)
   */
  async upsertSecondary(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/secondary`,
      )
      .send({
        evaluatorId: config.evaluatorId,
        selfEvaluationId: config.selfEvaluationId,
        downwardEvaluationContent: config.downwardEvaluationContent,
        downwardEvaluationScore: config.downwardEvaluationScore,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 1차 하향평가 제출
   */
  async submitPrimary(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/primary/submit`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(200);
  }

  /**
   * 2차 하향평가 제출
   */
  async submitSecondary(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/secondary/submit`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(200);
  }

  /**
   * 하향평가 제출 (ID로 직접)
   */
  async submitById(config: { id: string; evaluatorId: string }): Promise<void> {
    await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/${config.id}/submit`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(200);
  }

  /**
   * 피평가자의 모든 하향평가 일괄 제출
   */
  async bulkSubmit(config: {
    evaluateeId: string;
    periodId: string;
    evaluatorId: string;
    evaluationType: 'primary' | 'secondary';
    approveAllBelow?: boolean;
  }): Promise<{
    submittedCount: number;
    skippedCount: number;
    failedCount: number;
    submittedIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    const queryParams: any = {
      evaluationType: config.evaluationType,
    };

    if (config.approveAllBelow !== undefined) {
      queryParams.approveAllBelow = config.approveAllBelow.toString();
    }

    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/bulk-submit`,
      )
      .query(queryParams)
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 1차 하향평가 초기화 (미제출 상태로 변경)
   */
  async resetPrimary(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<{ message: string }> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/primary/reset`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 2차 하향평가 초기화 (미제출 상태로 변경)
   */
  async resetSecondary(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<{ message: string }> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/secondary/reset`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 평가자의 하향평가 목록 조회
   */
  async getByEvaluator(config: {
    evaluatorId: string;
    evaluateeId?: string;
    periodId?: string;
    wbsId?: string;
    evaluationType?: 'primary' | 'secondary';
    isCompleted?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const queryParams: any = {};

    if (config.evaluateeId) {
      queryParams.evaluateeId = config.evaluateeId;
    }
    if (config.periodId) {
      queryParams.periodId = config.periodId;
    }
    if (config.wbsId) {
      queryParams.wbsId = config.wbsId;
    }
    if (config.evaluationType) {
      queryParams.evaluationType = config.evaluationType;
    }
    if (config.isCompleted !== undefined) {
      queryParams.isCompleted = config.isCompleted.toString();
    }
    if (config.page) {
      queryParams.page = config.page.toString();
    }
    if (config.limit) {
      queryParams.limit = config.limit.toString();
    }

    const response = await this.testSuite
      .request()
      .get(
        `/admin/performance-evaluation/downward-evaluations/evaluator/${config.evaluatorId}`,
      )
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 하향평가 상세 조회
   */
  async getDetail(id: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/downward-evaluations/${id}`)
      .expect(200);

    return response.body;
  }

  /**
   * 1차 하향평가 저장 (에러 예상)
   */
  async upsertPrimaryExpectError(
    config: {
      evaluateeId: string;
      periodId: string;
      wbsId: string;
      evaluatorId?: string;
      selfEvaluationId?: string;
      downwardEvaluationContent?: string;
      downwardEvaluationScore?: number;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/primary`,
      )
      .send({
        evaluatorId: config.evaluatorId,
        selfEvaluationId: config.selfEvaluationId,
        downwardEvaluationContent: config.downwardEvaluationContent,
        downwardEvaluationScore: config.downwardEvaluationScore,
      })
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 2차 하향평가 저장 (에러 예상)
   */
  async upsertSecondaryExpectError(
    config: {
      evaluateeId: string;
      periodId: string;
      wbsId: string;
      evaluatorId?: string;
      selfEvaluationId?: string;
      downwardEvaluationContent?: string;
      downwardEvaluationScore?: number;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/secondary`,
      )
      .send({
        evaluatorId: config.evaluatorId,
        selfEvaluationId: config.selfEvaluationId,
        downwardEvaluationContent: config.downwardEvaluationContent,
        downwardEvaluationScore: config.downwardEvaluationScore,
      })
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 1차 하향평가 제출 (에러 예상)
   */
  async submitPrimaryExpectError(
    config: {
      evaluateeId: string;
      periodId: string;
      wbsId: string;
      evaluatorId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/primary/submit`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 2차 하향평가 제출 (에러 예상)
   */
  async submitSecondaryExpectError(
    config: {
      evaluateeId: string;
      periodId: string;
      wbsId: string;
      evaluatorId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/secondary/submit`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 하향평가 제출 (ID로 직접, 에러 예상)
   */
  async submitByIdExpectError(
    config: {
      id: string;
      evaluatorId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/${config.id}/submit`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 1차 하향평가 초기화 (에러 예상)
   */
  async resetPrimaryExpectError(
    config: {
      evaluateeId: string;
      periodId: string;
      wbsId: string;
      evaluatorId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/primary/reset`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 2차 하향평가 초기화 (에러 예상)
   */
  async resetSecondaryExpectError(
    config: {
      evaluateeId: string;
      periodId: string;
      wbsId: string;
      evaluatorId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${config.evaluateeId}/period/${config.periodId}/wbs/${config.wbsId}/secondary/reset`,
      )
      .send({
        evaluatorId: config.evaluatorId,
      })
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 하향평가 상세 조회 (에러 예상)
   */
  async getDetailExpectError(id: string, expectedStatus: number): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/downward-evaluations/${id}`)
      .expect(expectedStatus);

    return response.body;
  }
}
