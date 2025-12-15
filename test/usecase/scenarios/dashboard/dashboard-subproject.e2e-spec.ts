import { BaseE2ETest } from '../../../base-e2e.spec';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { DashboardScenario } from '../dashboard.scenario';
import { SelfEvaluationScenario } from '../self-evaluation.scenario';

/**
 * Dashboard - SubProject E2E 테스트
 *
 * 대시보드 API에서 WBS 평가기준 및 자기평가의 subProject가 올바르게 조회되는지 검증합니다.
 * - WBS 평가기준의 subProject를 우선 사용
 * - 평가기준에 없으면 자기평가의 subProject 사용
 */
describe('Dashboard - SubProject E2E (나의 할당 정보 조회)', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let dashboardScenario: DashboardScenario;
  let selfEvaluationScenario: SelfEvaluationScenario;

  // 테스트 데이터
  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    dashboardScenario = new DashboardScenario(testSuite);
    selfEvaluationScenario = new SelfEvaluationScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('WBS 자기평가 subProject 조회', () => {
    it('나의 할당 정보 조회 시 각 WBS별 subProject가 포함되어야 한다', async () => {
      // Given - 시드 데이터 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 2,
      });

      employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
      projectIds = seedResponse.results[0].generatedIds?.projectIds || [];
      wbsItemIds = seedResponse.results[0].generatedIds?.wbsItemIds || [];

      // 평가기간 생성 및 시작
      const { periodId } =
        await evaluationPeriodScenario.평가기간을_생성하고_평가설정단계까지_진행한다({
          periodName: 'SubProject 테스트 평가기간',
        });
      evaluationPeriodId = periodId;

      const employeeId = employeeIds[0];
      const wbsItemId1 = wbsItemIds[0];
      const wbsItemId2 = wbsItemIds[1];
      const projectId = projectIds[0];

      // 직원 추가
      await evaluationPeriodScenario.평가기간에_직원을_추가한다({
        evaluationPeriodId,
        employeeIds: [employeeId],
      });

      // 프로젝트 배정
      await evaluationPeriodScenario.프로젝트를_배정한다({
        evaluationPeriodId,
        employeeId,
        projectIds: [projectId],
      });

      // WBS 배정
      await evaluationPeriodScenario.WBS를_배정한다({
        evaluationPeriodId,
        employeeId,
        projectId,
        wbsItemIds: [wbsItemId1, wbsItemId2],
      });

      // WBS 1: subProject 있음, WBS 2: subProject 없음
      await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId,
        wbsItemId: wbsItemId1,
        periodId: evaluationPeriodId,
        selfEvaluationContent: '첫 번째 WBS 자기평가',
        selfEvaluationScore: 100,
        performanceResult: '모바일 앱 개발 완료',
        subProject: '모바일 앱 개발',
      });

      await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId,
        wbsItemId: wbsItemId2,
        periodId: evaluationPeriodId,
        selfEvaluationContent: '두 번째 WBS 자기평가',
        selfEvaluationScore: 90,
        performanceResult: '백엔드 API 개발 완료',
        // subProject 없음
      });

      // When - 나의 할당 정보 조회
      const assignedData = await dashboardScenario.나의_할당_정보를_조회한다({
        evaluationPeriodId,
      });

      // Then - 응답 검증
      expect(assignedData).toBeDefined();
      expect(assignedData.projects).toBeDefined();
      expect(assignedData.projects.length).toBeGreaterThan(0);

      // 프로젝트 찾기
      const project = assignedData.projects.find(
        (p: any) => p.projectId === projectId,
      );
      expect(project).toBeDefined();
      expect(project.wbsList).toBeDefined();
      expect(project.wbsList.length).toBe(2);

      // WBS 1: 자기평가 subProject 확인 (criteria에는 없음)
      const wbs1 = project.wbsList.find((w: any) => w.wbsId === wbsItemId1);
      expect(wbs1).toBeDefined();
      expect(wbs1.subProject).toBeUndefined(); // WBS 레벨에는 subProject 없음
      expect(wbs1.performance).toBeDefined();
      expect(wbs1.performance.performanceResult).toBe('모바일 앱 개발 완료');

      // WBS 2: subProject null 확인
      const wbs2 = project.wbsList.find((w: any) => w.wbsId === wbsItemId2);
      expect(wbs2).toBeDefined();
      expect(wbs2.subProject).toBeUndefined(); // WBS 레벨에는 subProject 없음
      expect(wbs2.performance).toBeDefined();
      expect(wbs2.performance.performanceResult).toBe('백엔드 API 개발 완료');
    });

    it('subProject가 없는 WBS는 null로 조회되어야 한다', async () => {
      // Given - 시드 데이터 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 1,
      });

      employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
      projectIds = seedResponse.results[0].generatedIds?.projectIds || [];
      wbsItemIds = seedResponse.results[0].generatedIds?.wbsItemIds || [];

      // 평가기간 생성 및 시작
      const { periodId } =
        await evaluationPeriodScenario.평가기간을_생성하고_평가설정단계까지_진행한다({
          periodName: 'SubProject Null 테스트',
        });
      evaluationPeriodId = periodId;

      const employeeId = employeeIds[0];
      const wbsItemId = wbsItemIds[0];
      const projectId = projectIds[0];

      // 직원 추가
      await evaluationPeriodScenario.평가기간에_직원을_추가한다({
        evaluationPeriodId,
        employeeIds: [employeeId],
      });

      // 프로젝트 및 WBS 배정
      await evaluationPeriodScenario.프로젝트를_배정한다({
        evaluationPeriodId,
        employeeId,
        projectIds: [projectId],
      });

      await evaluationPeriodScenario.WBS를_배정한다({
        evaluationPeriodId,
        employeeId,
        projectId,
        wbsItemIds: [wbsItemId],
      });

      // subProject 없이 자기평가 저장
      await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId,
        wbsItemId,
        periodId: evaluationPeriodId,
        selfEvaluationContent: 'subProject 없는 평가',
        selfEvaluationScore: 85,
        performanceResult: '일반 작업 완료',
        // subProject 없음
      });

      // When - 나의 할당 정보 조회
      const assignedData = await dashboardScenario.나의_할당_정보를_조회한다({
        evaluationPeriodId,
      });

      // Then
      const project = assignedData.projects.find(
        (p: any) => p.projectId === projectId,
      );
      expect(project).toBeDefined();

      const wbs = project.wbsList.find((w: any) => w.wbsId === wbsItemId);
      expect(wbs).toBeDefined();
      expect(wbs.subProject).toBeUndefined(); // WBS 레벨에는 subProject 없음
      expect(wbs.performance).toBeDefined();
      expect(wbs.performance.performanceResult).toBe('일반 작업 완료');
    });
  });

  describe('WBS 평가기준 subProject 조회', () => {
    it('평가기준에 subProject가 있으면 평가기준의 값을 우선 사용해야 한다', async () => {
      // Given - 시드 데이터 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 2,
      });

      employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
      projectIds = seedResponse.results[0].generatedIds?.projectIds || [];
      wbsItemIds = seedResponse.results[0].generatedIds?.wbsItemIds || [];

      // 평가기간 생성 및 시작
      const { periodId } =
        await evaluationPeriodScenario.평가기간을_생성하고_평가설정단계까지_진행한다({
          periodName: '평가기준 SubProject 테스트',
        });
      evaluationPeriodId = periodId;

      const employeeId = employeeIds[0];
      const wbsItemId1 = wbsItemIds[0];
      const wbsItemId2 = wbsItemIds[1];
      const projectId = projectIds[0];

      // 직원 추가 및 배정
      await evaluationPeriodScenario.평가기간에_직원을_추가한다({
        evaluationPeriodId,
        employeeIds: [employeeId],
      });

      await evaluationPeriodScenario.프로젝트를_배정한다({
        evaluationPeriodId,
        employeeId,
        projectIds: [projectId],
      });

      await evaluationPeriodScenario.WBS를_배정한다({
        evaluationPeriodId,
        employeeId,
        projectId,
        wbsItemIds: [wbsItemId1, wbsItemId2],
      });

      // WBS 평가기준에 subProject 저장
      await testSuite
        .request()
        .put(`/admin/evaluation-criteria/wbs-evaluation-criteria/${wbsItemId1}`)
        .send({
          criteria: '코드 품질 및 성능 최적화',
          importance: 3,
          subProject: '백엔드 API 서버',
        })
        .expect(200);

      await testSuite
        .request()
        .put(`/admin/evaluation-criteria/wbs-evaluation-criteria/${wbsItemId2}`)
        .send({
          criteria: '프론트엔드 UI/UX 개선',
          importance: 4,
          subProject: '관리자 웹 대시보드',
        })
        .expect(200);

      // WBS 자기평가 저장 (subProject 없음)
      await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId,
        wbsItemId: wbsItemId1,
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 100,
        performanceResult: '성과 입력',
        // subProject 없음 - 평가기준의 subProject 사용해야 함
      });

      // When - 나의 할당 정보 조회
      const assignedData = await dashboardScenario.나의_할당_정보를_조회한다({
        evaluationPeriodId,
      });

      // Then
      const project = assignedData.projects.find(
        (p: any) => p.projectId === projectId,
      );
      expect(project).toBeDefined();

      // WBS 1: 평가기준의 subProject 확인
      const wbs1 = project.wbsList.find((w: any) => w.wbsId === wbsItemId1);
      expect(wbs1).toBeDefined();
      expect(wbs1.subProject).toBeUndefined(); // WBS 레벨에는 subProject 없음
      expect(wbs1.criteria).toBeDefined();
      expect(wbs1.criteria.length).toBeGreaterThan(0);
      expect(wbs1.criteria[0].subProject).toBe('백엔드 API 서버');

      // WBS 2: 평가기준의 subProject 확인 (자기평가 없음)
      const wbs2 = project.wbsList.find((w: any) => w.wbsId === wbsItemId2);
      expect(wbs2).toBeDefined();
      expect(wbs2.subProject).toBeUndefined(); // WBS 레벨에는 subProject 없음
      expect(wbs2.criteria).toBeDefined();
      expect(wbs2.criteria.length).toBeGreaterThan(0);
      expect(wbs2.criteria[0].subProject).toBe('관리자 웹 대시보드');
    });

    it('평가기준과 자기평가 모두 subProject가 있으면 평가기준 값을 우선 사용해야 한다', async () => {
      // Given - 시드 데이터 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 1,
      });

      employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
      projectIds = seedResponse.results[0].generatedIds?.projectIds || [];
      wbsItemIds = seedResponse.results[0].generatedIds?.wbsItemIds || [];

      // 평가기간 생성 및 시작
      const { periodId } =
        await evaluationPeriodScenario.평가기간을_생성하고_평가설정단계까지_진행한다({
          periodName: '평가기준 우선순위 테스트',
        });
      evaluationPeriodId = periodId;

      const employeeId = employeeIds[0];
      const wbsItemId = wbsItemIds[0];
      const projectId = projectIds[0];

      // 직원 추가 및 배정
      await evaluationPeriodScenario.평가기간에_직원을_추가한다({
        evaluationPeriodId,
        employeeIds: [employeeId],
      });

      await evaluationPeriodScenario.프로젝트를_배정한다({
        evaluationPeriodId,
        employeeId,
        projectIds: [projectId],
      });

      await evaluationPeriodScenario.WBS를_배정한다({
        evaluationPeriodId,
        employeeId,
        projectId,
        wbsItemIds: [wbsItemId],
      });

      // WBS 평가기준에 subProject 저장
      await testSuite
        .request()
        .put(`/admin/evaluation-criteria/wbs-evaluation-criteria/${wbsItemId}`)
        .send({
          criteria: '데이터베이스 최적화',
          importance: 5,
          subProject: '평가기준 SubProject',
        })
        .expect(200);

      // WBS 자기평가에 다른 subProject 저장
      await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId,
        wbsItemId,
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 95,
        performanceResult: '성과 입력',
        subProject: '자기평가 SubProject', // 평가기준과 다른 값
      });

      // When - 나의 할당 정보 조회
      const assignedData = await dashboardScenario.나의_할당_정보를_조회한다({
        evaluationPeriodId,
      });

      // Then - 평가기준의 subProject가 표시되어야 함
      const project = assignedData.projects.find(
        (p: any) => p.projectId === projectId,
      );
      expect(project).toBeDefined();

      const wbs = project.wbsList.find((w: any) => w.wbsId === wbsItemId);
      expect(wbs).toBeDefined();
      expect(wbs.subProject).toBeUndefined(); // WBS 레벨에는 subProject 없음
      expect(wbs.criteria[0].subProject).toBe('평가기준 SubProject');
    });
  });
});

