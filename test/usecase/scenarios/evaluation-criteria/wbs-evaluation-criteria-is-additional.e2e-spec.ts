import { BaseE2ETest } from '../../../base-e2e.spec';
import { SeedDataScenario } from '../seed-data.scenario';
import { WbsEvaluationCriteriaApiClient } from '../api-clients/wbs-evaluation-criteria.api-client';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';

/**
 * WBS 평가기준 isAdditional 필드 E2E 테스트
 *
 * 다음 기능을 검증합니다:
 * 1. WBS 평가기준 저장 (Upsert) 시 isAdditional 저장
 * 2. 사용자 할당 정보 조회 시 isAdditional 반환
 * 3. 나의 할당 정보 조회 시 isAdditional 반환
 * 4. 직원의 평가 현황 및 할당 데이터 통합 조회 시 isAdditional 반환
 */
describe('WBS 평가기준 isAdditional 필드 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let wbsEvaluationCriteriaApiClient: WbsEvaluationCriteriaApiClient;
  let dashboardApiClient: DashboardApiClient;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let wbsItemIds: string[];
  let projectIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    wbsEvaluationCriteriaApiClient = new WbsEvaluationCriteriaApiClient(
      testSuite,
    );
    dashboardApiClient = new DashboardApiClient(testSuite);
  });

  afterAll(async () => {
    // 정리 작업
    if (seedDataScenario) {
      await seedDataScenario.시드_데이터를_삭제한다();
    }
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터 생성
    const seedData = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'with_period',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 3,
    });

    // 시드 데이터 시나리오에서 직접 반환된 값 사용
    employeeIds = seedData.employeeIds || [];
    projectIds = seedData.projectIds || [];
    wbsItemIds = seedData.wbsItemIds || [];
    evaluationPeriodId = seedData.evaluationPeriodId || '';

    // 디버깅: 생성된 ID 확인
    if (wbsItemIds.length === 0) {
      throw new Error('WBS 아이템이 생성되지 않았습니다.');
    }
  });

  describe('WBS 평가기준 저장 (Upsert)', () => {
    it('isAdditional: false로 WBS 평가기준을 저장한다', async () => {
      // wbsItemIds 검증
      expect(wbsItemIds).toBeDefined();
      expect(wbsItemIds.length).toBeGreaterThan(0);

      const result = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteria(
        {
          wbsItemId: wbsItemIds[0],
          criteria: '일반 과제 평가기준',
          importance: 3,
        },
      );

      expect(result.id).toBeDefined();
      expect(result.criteria).toBe('일반 과제 평가기준');
      expect(result.importance).toBe(3);
      expect(result.isAdditional).toBe(false); // ✅ 기본값 false 검증
    });

    it('isAdditional: true로 WBS 평가기준을 저장한다', async () => {
      // wbsItemIds 검증
      expect(wbsItemIds).toBeDefined();
      expect(wbsItemIds.length).toBeGreaterThan(0);

      const result = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[0],
          criteria: '추가 과제 평가기준',
          importance: 4,
          isAdditional: true,
        },
      );

      expect(result.id).toBeDefined();
      expect(result.criteria).toBe('추가 과제 평가기준');
      expect(result.importance).toBe(4);
      expect(result.isAdditional).toBe(true); // ✅ true 값 저장 검증
    });

    it('isAdditional 값을 업데이트한다 (false → true)', async () => {
      // 1단계: isAdditional: false로 저장
      const createResult = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[0],
          criteria: '업데이트 테스트 평가기준',
          importance: 3,
          isAdditional: false,
        },
      );

      expect(createResult.isAdditional).toBe(false);

      // 2단계: 같은 wbsItemId + criteria 조합으로 isAdditional: true로 업데이트
      const updateResult = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[0],
          criteria: '업데이트 테스트 평가기준',
          importance: 3,
          isAdditional: true,
        },
      );

      expect(updateResult.id).toBe(createResult.id); // ✅ 같은 ID (업데이트 확인)
      expect(updateResult.isAdditional).toBe(true); // ✅ true로 업데이트 확인
    });

    it('isAdditional 값을 업데이트한다 (true → false)', async () => {
      // 1단계: isAdditional: true로 저장
      const createResult = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[1],
          criteria: '업데이트 테스트 2',
          importance: 2,
          isAdditional: true,
        },
      );

      expect(createResult.isAdditional).toBe(true);

      // 2단계: isAdditional: false로 업데이트
      const updateResult = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[1],
          criteria: '업데이트 테스트 2',
          importance: 2,
          isAdditional: false,
        },
      );

      expect(updateResult.id).toBe(createResult.id); // ✅ 같은 ID (업데이트 확인)
      expect(updateResult.isAdditional).toBe(false); // ✅ false로 업데이트 확인
    });
  });

  describe('사용자 할당 정보 조회', () => {
    it('WBS 평가기준 목록에서 isAdditional 필드를 반환한다', async () => {
      // 1단계: 일반 과제와 추가 과제 평가기준 저장
      await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[0],
          criteria: '일반 과제 1',
          importance: 3,
          isAdditional: false,
        },
      );

      await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[0],
          criteria: '추가 과제 1',
          importance: 4,
          isAdditional: true,
        },
      );

      // 2단계: 사용자 할당 정보 조회
      const assignedData = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: employeeIds[0],
      });

      // 3단계: isAdditional 필드 검증
      expect(assignedData.projects).toBeDefined();
      expect(assignedData.projects.length).toBeGreaterThan(0);

      const project = assignedData.projects[0];
      expect(project.wbsItems).toBeDefined();
      expect(project.wbsItems.length).toBeGreaterThan(0);

      const wbsItem = project.wbsItems.find(
        (wbs: any) => wbs.wbsId === wbsItemIds[0],
      );
      expect(wbsItem).toBeDefined();
      expect(wbsItem.criteria).toBeDefined();
      expect(wbsItem.criteria.length).toBeGreaterThanOrEqual(2);

      // 일반 과제 검증
      const normalCriteria = wbsItem.criteria.find(
        (c: any) => c.criteria === '일반 과제 1',
      );
      expect(normalCriteria).toBeDefined();
      expect(normalCriteria.isAdditional).toBe(false);

      // 추가 과제 검증
      const additionalCriteria = wbsItem.criteria.find(
        (c: any) => c.criteria === '추가 과제 1',
      );
      expect(additionalCriteria).toBeDefined();
      expect(additionalCriteria.isAdditional).toBe(true);
    });
  });

  describe('나의 할당 정보 조회 (현재 로그인 사용자)', () => {
    it('WBS 평가기준 목록에서 isAdditional 필드를 반환한다', async () => {
      // 1단계: 평가기준 저장
      await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[1],
          criteria: '나의 일반 과제',
          importance: 3,
          isAdditional: false,
        },
      );

      await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[1],
          criteria: '나의 추가 과제',
          importance: 4,
          isAdditional: true,
        },
      );

      // 2단계: 나의 할당 정보 조회
      const myAssignedData = await dashboardApiClient.getMyAssignedData(
        evaluationPeriodId,
      );

      // 3단계: isAdditional 필드 검증
      expect(myAssignedData.projects).toBeDefined();
      expect(myAssignedData.projects.length).toBeGreaterThan(0);

      let foundWbsItem = null;
      for (const project of myAssignedData.projects) {
        if (project.wbsItems) {
          foundWbsItem = project.wbsItems.find(
            (wbs: any) => wbs.wbsId === wbsItemIds[1],
          );
          if (foundWbsItem) break;
        }
      }

      expect(foundWbsItem).toBeDefined();
      expect(foundWbsItem.criteria).toBeDefined();
      expect(foundWbsItem.criteria.length).toBeGreaterThanOrEqual(2);

      // 일반 과제 검증
      const normalCriteria = foundWbsItem.criteria.find(
        (c: any) => c.criteria === '나의 일반 과제',
      );
      expect(normalCriteria).toBeDefined();
      expect(normalCriteria.isAdditional).toBe(false);

      // 추가 과제 검증
      const additionalCriteria = foundWbsItem.criteria.find(
        (c: any) => c.criteria === '나의 추가 과제',
      );
      expect(additionalCriteria).toBeDefined();
      expect(additionalCriteria.isAdditional).toBe(true);
    });
  });

  describe('직원의 평가 현황 및 할당 데이터 통합 조회', () => {
    it('WBS 평가기준 목록에서 isAdditional 필드를 반환한다', async () => {
      // 1단계: 평가기준 저장
      await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[2],
          criteria: '통합 조회 일반 과제',
          importance: 2,
          isAdditional: false,
        },
      );

      await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[2],
          criteria: '통합 조회 추가 과제',
          importance: 5,
          isAdditional: true,
        },
      );

      // 2단계: 직원의 평가 현황 및 할당 데이터 통합 조회
      const completeStatus = await dashboardApiClient.getEmployeeCompleteStatus(
        {
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        },
      );

      // 3단계: isAdditional 필드 검증
      expect(completeStatus.assignedData).toBeDefined();
      expect(completeStatus.assignedData.projects).toBeDefined();
      expect(completeStatus.assignedData.projects.length).toBeGreaterThan(0);

      let foundWbsItem = null;
      for (const project of completeStatus.assignedData.projects) {
        if (project.wbsItems) {
          foundWbsItem = project.wbsItems.find(
            (wbs: any) => wbs.wbsId === wbsItemIds[2],
          );
          if (foundWbsItem) break;
        }
      }

      expect(foundWbsItem).toBeDefined();
      expect(foundWbsItem.criteria).toBeDefined();
      expect(foundWbsItem.criteria.length).toBeGreaterThanOrEqual(2);

      // 일반 과제 검증
      const normalCriteria = foundWbsItem.criteria.find(
        (c: any) => c.criteria === '통합 조회 일반 과제',
      );
      expect(normalCriteria).toBeDefined();
      expect(normalCriteria.isAdditional).toBe(false);

      // 추가 과제 검증
      const additionalCriteria = foundWbsItem.criteria.find(
        (c: any) => c.criteria === '통합 조회 추가 과제',
      );
      expect(additionalCriteria).toBeDefined();
      expect(additionalCriteria.isAdditional).toBe(true);
    });
  });

  describe('WBS 평가기준 조회 API', () => {
    it('WBS 항목별 평가기준 조회 시 isAdditional 필드를 반환한다', async () => {
      // 1단계: 평가기준 저장
      const savedCriteria = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[0],
          criteria: 'API 조회 테스트 과제',
          importance: 3,
          isAdditional: true,
        },
      );

      // 2단계: WBS 항목별 평가기준 조회
      const criteriaList = await wbsEvaluationCriteriaApiClient.getWbsItemEvaluationCriteria(
        wbsItemIds[0],
      );

      // 3단계: isAdditional 필드 검증
      expect(criteriaList).toBeDefined();
      expect(Array.isArray(criteriaList)).toBe(true);

      const targetCriteria = criteriaList.find(
        (c: any) => c.id === savedCriteria.id,
      );
      expect(targetCriteria).toBeDefined();
      expect(targetCriteria.isAdditional).toBe(true);
    });

    it('WBS 평가기준 상세 조회 시 isAdditional 필드를 반환한다', async () => {
      // 1단계: 평가기준 저장
      const savedCriteria = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[1],
          criteria: '상세 조회 테스트 과제',
          importance: 3,
          isAdditional: false,
        },
      );

      // 2단계: WBS 평가기준 상세 조회
      const criteriaDetail = await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaDetail(
        savedCriteria.id,
      );

      // 3단계: isAdditional 필드 검증
      expect(criteriaDetail).toBeDefined();
      expect(criteriaDetail.id).toBe(savedCriteria.id);
      expect(criteriaDetail.isAdditional).toBe(false);
    });
  });

  describe('권한별 WBS 평가기준 저장 테스트', () => {
    it('Admin 권한으로 isAdditional 필드를 저장한다', async () => {
      // Admin 컨트롤러 테스트는 기본 API 클라이언트를 사용
      const result = await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteriaWithIsAdditional(
        {
          wbsItemId: wbsItemIds[0],
          criteria: 'Admin 권한 테스트',
          importance: 4,
          isAdditional: true,
        },
      );

      expect(result.isAdditional).toBe(true);
    });

    it('Evaluator 권한으로 isAdditional 필드를 저장한다', async () => {
      const result = await testSuite
        .request()
        .post(
          `/evaluator/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemIds[1]}`,
        )
        .send({
          criteria: 'Evaluator 권한 테스트',
          importance: 3,
          isAdditional: true,
        })
        .expect(200);

      expect(result.body.isAdditional).toBe(true);
    });

    it('User 권한으로 isAdditional 필드를 저장한다', async () => {
      const result = await testSuite
        .request()
        .post(
          `/user/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemIds[2]}`,
        )
        .send({
          criteria: 'User 권한 테스트',
          importance: 2,
          isAdditional: false,
        })
        .expect(200);

      expect(result.body.isAdditional).toBe(false);
    });
  });
});

