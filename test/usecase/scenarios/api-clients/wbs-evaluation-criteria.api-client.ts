import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * WBS 평가기준 API 클라이언트
 *
 * WBS 평가기준 생성, 조회, 수정, 삭제 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class WbsEvaluationCriteriaApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * WBS 평가기준 목록 조회
   *
   * @param config.wbsItemId - WBS 항목 ID (선택)
   * @param config.criteriaSearch - 평가기준 검색어 (선택)
   * @param config.criteriaExact - 평가기준 정확 일치 검색어 (선택)
   * @returns WBS 평가기준 목록
   */
  async getWbsEvaluationCriteriaList(config?: {
    wbsItemId?: string;
    criteriaSearch?: string;
    criteriaExact?: string;
  }): Promise<any> {
    const queryParams: any = {};
    if (config?.wbsItemId) queryParams.wbsItemId = config.wbsItemId;
    if (config?.criteriaSearch)
      queryParams.criteriaSearch = config.criteriaSearch;
    if (config?.criteriaExact) queryParams.criteriaExact = config.criteriaExact;

    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 평가기준 상세 조회
   *
   * @param id - 평가기준 ID
   * @returns WBS 평가기준 상세 정보
   */
  async getWbsEvaluationCriteriaDetail(id: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${id}`)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 항목별 평가기준 조회
   *
   * @param wbsItemId - WBS 항목 ID
   * @returns WBS 항목의 평가기준 목록
   */
  async getWbsItemEvaluationCriteria(wbsItemId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * WBS 평가기준 저장 (Upsert)
   *
   * @param config.wbsItemId - WBS 항목 ID
   * @param config.criteria - 평가기준 내용
   * @param config.importance - 중요도 (1-10)
   * @returns 저장된 평가기준 정보
   */
  async upsertWbsEvaluationCriteria(config: {
    wbsItemId: string;
    criteria: string;
    importance: number;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${config.wbsItemId}`,
      )
      .send({
        criteria: config.criteria,
        importance: config.importance,
      })
      .expect(200);

    return response.body;
  }

  /**
   * WBS 평가기준 저장 (Upsert) with isAdditional
   *
   * @param config.wbsItemId - WBS 항목 ID
   * @param config.criteria - 평가기준 내용
   * @param config.importance - 중요도 (1-10)
   * @param config.isAdditional - 추가 과제 여부
   * @param config.subProject - 하위 프로젝트 (선택)
   * @returns 저장된 평가기준 정보
   */
  async upsertWbsEvaluationCriteriaWithIsAdditional(config: {
    wbsItemId: string;
    criteria: string;
    importance: number;
    isAdditional?: boolean;
    subProject?: string;
  }): Promise<any> {
    const requestBody: any = {
      criteria: config.criteria,
      importance: config.importance,
    };

    if (config.isAdditional !== undefined) {
      requestBody.isAdditional = config.isAdditional;
    }

    if (config.subProject !== undefined) {
      requestBody.subProject = config.subProject;
    }

    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${config.wbsItemId}`,
      )
      .send(requestBody)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 평가기준 삭제
   *
   * @param id - 평가기준 ID
   * @returns 삭제 성공 여부
   */
  async deleteWbsEvaluationCriteria(id: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-evaluation-criteria/${id}`)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 항목 평가기준 전체 삭제
   *
   * @param wbsItemId - WBS 항목 ID
   * @returns 삭제 성공 여부
   */
  async deleteWbsItemEvaluationCriteria(wbsItemId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== 에러 케이스 테스트용 메서드 ====================

  /**
   * WBS 평가기준 목록 조회 (에러 예상)
   */
  async getWbsEvaluationCriteriaListExpectError(
    config: {
      wbsItemId?: string;
      criteriaSearch?: string;
      criteriaExact?: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const queryParams: any = {};
    if (config.wbsItemId) queryParams.wbsItemId = config.wbsItemId;
    if (config.criteriaSearch)
      queryParams.criteriaSearch = config.criteriaSearch;
    if (config.criteriaExact) queryParams.criteriaExact = config.criteriaExact;

    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-evaluation-criteria')
      .query(queryParams)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * WBS 평가기준 상세 조회 (에러 예상)
   */
  async getWbsEvaluationCriteriaDetailExpectError(
    id: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/wbs-evaluation-criteria/${id}`)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * WBS 항목별 평가기준 조회 (에러 예상)
   */
  async getWbsItemEvaluationCriteriaExpectError(
    wbsItemId: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * WBS 평가기준 저장 (에러 예상)
   */
  async upsertWbsEvaluationCriteriaExpectError(
    config: {
      wbsItemId: string;
      criteria?: string;
      importance?: number;
    },
    expectedStatus: number,
  ): Promise<any> {
    const requestBody: any = {};
    if (config.criteria !== undefined) requestBody.criteria = config.criteria;
    if (config.importance !== undefined)
      requestBody.importance = config.importance;

    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${config.wbsItemId}`,
      )
      .send(requestBody)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * WBS 평가기준 삭제 (에러 예상)
   */
  async deleteWbsEvaluationCriteriaExpectError(
    id: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-evaluation-criteria/${id}`)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * WBS 항목 평가기준 전체 삭제 (에러 예상)
   */
  async deleteWbsItemEvaluationCriteriaExpectError(
    wbsItemId: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 평가기준 제출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 평가기준 제출 응답
   */
  async submitEvaluationCriteria(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-evaluation-criteria/submit')
      .send({
        evaluationPeriodId: config.evaluationPeriodId,
        employeeId: config.employeeId,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 평가기준 제출 초기화
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 평가기준 제출 초기화 응답
   */
  async resetEvaluationCriteriaSubmission(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        '/admin/evaluation-criteria/wbs-evaluation-criteria/reset-submission',
      )
      .send({
        evaluationPeriodId: config.evaluationPeriodId,
        employeeId: config.employeeId,
      })
      .expect(200);

    return response.body;
  }
}
