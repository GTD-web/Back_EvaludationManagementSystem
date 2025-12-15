import { BaseE2ETest } from '../../../base-e2e.spec';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { DashboardScenario } from '../dashboard.scenario';
import { SelfEvaluationScenario } from '../self-evaluation.scenario';

/**
 * Dashboard - SubProject E2E 테스트
 *
 * 대시보드 API에서 WBS별 subProject가 올바르게 조회되는지 검증합니다.
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

      // WBS 1: subProject 확인
      const wbs1 = project.wbsList.find((w: any) => w.wbsId === wbsItemId1);
      expect(wbs1).toBeDefined();
      expect(wbs1.subProject).toBe('모바일 앱 개발');
      expect(wbs1.performance).toBeDefined();
      expect(wbs1.performance.performanceResult).toBe('모바일 앱 개발 완료');

      // WBS 2: subProject null 확인
      const wbs2 = project.wbsList.find((w: any) => w.wbsId === wbsItemId2);
      expect(wbs2).toBeDefined();
      expect(wbs2.subProject).toBeNull();
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
      expect(wbs.subProject).toBeNull();
      expect(wbs.performance).toBeDefined();
      expect(wbs.performance.performanceResult).toBe('일반 작업 완료');
    });
  });
});

