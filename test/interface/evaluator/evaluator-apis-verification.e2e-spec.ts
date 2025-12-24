import { BaseE2ETest } from '../../base-e2e.spec';

/**
 * Evaluator API 검증 테스트
 *
 * 평가자가 사용할 수 있는 주요 API가 올바르게 설정되어 있는지 검증합니다.
 */
describe('Evaluator APIs 검증', () => {
  let testSuite: BaseE2ETest;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('나의 할당 정보 조회 API', () => {
    it('GET /evaluator/dashboard/:evaluationPeriodId/my-assigned-data 경로가 존재한다', async () => {
      const dummyPeriodId = '00000000-0000-0000-0000-000000000001';

      const response = await testSuite
        .request()
        .get(`/evaluator/dashboard/${dummyPeriodId}/my-assigned-data`);

      // 404가 아니면 경로가 존재하는 것 (인증, 데이터 없음 등의 에러는 OK)
      expect(response.status).not.toBe(404);
    });
  });

  describe('WBS 평가기준 저장 (Upsert) API', () => {
    it('POST /evaluator/evaluation-criteria/wbs-evaluation-criteria/wbs-item/:wbsItemId 경로가 존재한다', async () => {
      const dummyWbsItemId = '00000000-0000-0000-0000-000000000002';

      const response = await testSuite
        .request()
        .post(
          `/evaluator/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${dummyWbsItemId}`,
        )
        .send({
          criteria: '테스트 평가기준',
          importance: 3,
          isAdditional: false,
        });

      // 404가 아니면 경로가 존재하는 것 (인증, 데이터 없음 등의 에러는 OK)
      expect(response.status).not.toBe(404);
    });
  });
});

