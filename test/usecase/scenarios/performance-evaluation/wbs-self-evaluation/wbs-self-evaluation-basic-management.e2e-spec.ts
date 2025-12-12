import { BaseE2ETest } from '../../../../base-e2e.spec';
import { WbsSelfEvaluationScenario } from './wbs-self-evaluation.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../../wbs-assignment/wbs-assignment.scenario';
import { EvaluationTargetScenario } from '../../evaluation-target.scenario';

describe('WBS 자기평가 기본 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    wbsSelfEvaluationScenario = new WbsSelfEvaluationScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

    if (
      employeeIds.length === 0 ||
      projectIds.length === 0 ||
      wbsItemIds.length === 0
    ) {
      throw new Error(
        '시드 데이터 생성 실패: 직원, 프로젝트 또는 WBS가 생성되지 않았습니다.',
      );
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: 'WBS 자기평가 관리 시나리오 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: 'WBS 자기평가 관리 E2E 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
      gradeRanges: [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A+', minRange: 85, maxRange: 89 },
        { grade: 'A', minRange: 80, maxRange: 84 },
        { grade: 'B+', minRange: 75, maxRange: 79 },
        { grade: 'B', minRange: 70, maxRange: 74 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ],
    };

    const createPeriodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(createData)
      .expect(201);

    evaluationPeriodId = createPeriodResponse.body.id;

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);

    // 프로젝트 할당
    await projectAssignmentScenario.프로젝트를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: employeeIds[0],
      projectId: projectIds[0],
    });

    // WBS 할당
    await wbsAssignmentScenario.WBS를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: employeeIds[0],
      wbsItemId: wbsItemIds[0],
      projectId: projectIds[0],
    });
  });

  describe('자기평가 저장 (신규 생성)', () => {
    it('자기평가를 저장하고 대시보드 API를 검증한다', async () => {
      // Given - 자기평가 저장
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });

      // Then - 저장 검증
      expect(저장결과.id).toBeDefined();
      expect(저장결과.selfEvaluationContent).toBe('자기평가 내용입니다.');
      expect(저장결과.selfEvaluationScore).toBe(85);

      // 대시보드 API 검증
      const 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황).toBeDefined();
      expect(개별직원현황.selfEvaluation).toBeDefined();
      expect(개별직원현황.selfEvaluation.status).toBe('in_progress');
      expect(개별직원현황.selfEvaluation.totalMappingCount).toBeGreaterThan(0);
      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0); // 제출 전

      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(할당데이터).toBeDefined();
      expect(할당데이터.projects).toBeDefined();
      expect(할당데이터.projects.length).toBeGreaterThan(0);

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(할당데이터.summary).toBeDefined();
      expect(할당데이터.summary.completedSelfEvaluations).toBe(0); // 제출 전
      expect(할당데이터.summary.selfEvaluation.totalSelfEvaluations).toBe(1); // 저장된 자기평가 수
      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        0,
      ); // 미제출
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(0); // 미제출
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        false,
      );
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
        false,
      );
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeNull();
      expect(할당데이터.summary.selfEvaluation.grade).toBeNull();

      // 전체 직원 현황 조회
      const 전체직원현황 =
        await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
          evaluationPeriodId,
        );

      const 직원정보 = 전체직원현황.find(
        (emp: any) => emp.employeeId === employeeIds[0],
      );
      expect(직원정보).toBeDefined();
      expect(직원정보.selfEvaluation.status).toBe('in_progress');
      expect(직원정보.selfEvaluation.completedMappingCount).toBe(0);
    });

    it('자기평가를 저장하고 상세 조회 및 my-assigned-data를 검증한다', async () => {
      // Given - 현재 사용자를 employeeIds[0]로 설정 (my-assigned-data 조회를 위해)
      testSuite.setCurrentUser({
        id: employeeIds[0],
        email: 'test@example.com',
        name: '테스트 사용자',
        employeeNumber: 'TEST001',
      });

      // Given - 자기평가 저장
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '상세 조회 테스트용 자기평가 내용',
        selfEvaluationScore: 90,
        performanceResult: '상세 조회 테스트용 성과 결과',
      });

      // Then - 저장 검증
      expect(저장결과.id).toBeDefined();
      expect(저장결과.selfEvaluationContent).toBe(
        '상세 조회 테스트용 자기평가 내용',
      );
      expect(저장결과.selfEvaluationScore).toBe(90);
      expect(저장결과.performanceResult).toBe('상세 조회 테스트용 성과 결과');

      // 상세 조회 검증
      const 상세조회결과 =
        await wbsSelfEvaluationScenario.WBS자기평가_상세정보를_조회한다(
          저장결과.id,
        );

      expect(상세조회결과).toBeDefined();
      expect(상세조회결과.id).toBe(저장결과.id);
      expect(상세조회결과.selfEvaluationContent).toBe(
        '상세 조회 테스트용 자기평가 내용',
      );
      expect(상세조회결과.selfEvaluationScore).toBe(90);
      expect(상세조회결과.performanceResult).toBe(
        '상세 조회 테스트용 성과 결과',
      );
      expect(상세조회결과.employeeId).toBe(employeeIds[0]);
      expect(상세조회결과.wbsItemId).toBe(wbsItemIds[0]);
      expect(상세조회결과.periodId).toBe(evaluationPeriodId);
      expect(상세조회결과.submittedToEvaluator).toBe(false); // 미제출 상태
      expect(상세조회결과.submittedToManager).toBe(false); // 미제출 상태

      // 관련 엔티티 정보 검증
      expect(상세조회결과.evaluationPeriod).toBeDefined();
      expect(상세조회결과.evaluationPeriod.id).toBe(evaluationPeriodId);
      expect(상세조회결과.employee).toBeDefined();
      expect(상세조회결과.employee.id).toBe(employeeIds[0]);
      expect(상세조회결과.wbsItem).toBeDefined();
      expect(상세조회결과.wbsItem.id).toBe(wbsItemIds[0]);

      // my-assigned-data 조회 검증
      const 나의할당데이터 =
        await wbsSelfEvaluationScenario.나의_할당_데이터를_조회한다(
          evaluationPeriodId,
        );

      expect(나의할당데이터).toBeDefined();
      expect(나의할당데이터.evaluationPeriod).toBeDefined();
      expect(나의할당데이터.employee).toBeDefined();
      expect(나의할당데이터.projects).toBeDefined();
      expect(나의할당데이터.projects.length).toBeGreaterThan(0);

      // summary 검증 (wbsList 내 selfEvaluation은 제거되었으므로 summary만 검증)
      expect(나의할당데이터.summary).toBeDefined();
      expect(나의할당데이터.summary.completedSelfEvaluations).toBe(0); // 제출 전
      expect(나의할당데이터.summary.selfEvaluation.totalScore).toBeNull();
      expect(나의할당데이터.summary.selfEvaluation.grade).toBeNull();

      // 하향평가 정보는 제거되어야 함 (my-assigned-data의 특징)
      const 프로젝트 = 나의할당데이터.projects.find(
        (p: any) => p.id === projectIds[0],
      );
      if (프로젝트 && 프로젝트.wbsItems) {
        const wbsItem = 프로젝트.wbsItems.find(
          (w: any) => w.id === wbsItemIds[0],
        );
        if (wbsItem) {
          expect(wbsItem.primaryDownwardEvaluation).toBeNull();
          expect(wbsItem.secondaryDownwardEvaluation).toBeNull();
        }
      }
    });
  });

  describe('자기평가 저장 시 subProject 필드 테스트', () => {
    it('subProject 값을 포함하여 자기평가를 저장하고 조회한다', async () => {
      // Given - subProject를 포함한 자기평가 저장
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '서브 프로젝트 테스트 자기평가',
        selfEvaluationScore: 100,
        performanceResult: '모바일 앱 개발 완료',
        subProject: '모바일 앱 개발',
      });

      // Then - 저장 결과에 subProject 포함 확인
      expect(저장결과.id).toBeDefined();
      expect(저장결과.subProject).toBe('모바일 앱 개발');
      expect(저장결과.selfEvaluationContent).toBe('서브 프로젝트 테스트 자기평가');
      expect(저장결과.selfEvaluationScore).toBe(100);

      // When - 상세 조회
      const 상세조회결과 =
        await wbsSelfEvaluationScenario.WBS자기평가_상세정보를_조회한다(
          저장결과.id,
        );

      // Then - 상세 조회 결과에 subProject 포함 확인
      expect(상세조회결과.subProject).toBe('모바일 앱 개발');
      expect(상세조회결과.performanceResult).toBe('모바일 앱 개발 완료');

      // When - 사용자 할당 정보 조회
      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // Then - WBS 정보에 subProject가 wbsId, wbsName, wbsCode와 같은 레벨에 포함 확인
      expect(할당데이터.projects).toBeDefined();
      expect(할당데이터.projects.length).toBeGreaterThan(0);
      
      const 프로젝트 = 할당데이터.projects[0];
      expect(프로젝트.wbsList).toBeDefined();
      expect(프로젝트.wbsList.length).toBeGreaterThan(0);
      
      const wbs = 프로젝트.wbsList.find((w: any) => w.wbsId === wbsItemIds[0]);
      expect(wbs).toBeDefined();
      expect(wbs.subProject).toBe('모바일 앱 개발');
      expect(wbs.wbsId).toBeDefined();
      expect(wbs.wbsName).toBeDefined();
      expect(wbs.wbsCode).toBeDefined();
      
      // subProject가 performance 내부가 아닌 WBS 레벨에 있는지 확인
      expect(wbs.performance).toBeDefined();
      if (wbs.performance && typeof wbs.performance === 'object') {
        expect(wbs.performance.subProject).toBeUndefined(); // performance에는 없어야 함
      }
    });

    it('subProject 없이 자기평가를 저장하면 null로 반환된다', async () => {
      // WBS 할당 (두 번째 WBS)
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[1],
        projectId: projectIds[0],
      });

      // Given - subProject 없이 자기평가 저장
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[1],
        periodId: evaluationPeriodId,
        selfEvaluationContent: 'subProject 없는 자기평가',
        selfEvaluationScore: 90,
        performanceResult: '일반 작업 완료',
      });

      // Then - subProject가 null로 반환되는지 확인
      expect(저장결과.id).toBeDefined();
      expect(저장결과.subProject).toBeNull();

      // When - 사용자 할당 정보 조회
      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // Then - WBS 레벨에 subProject가 null로 포함되어 있는지 확인
      const wbs = 할당데이터.projects[0].wbsList.find(
        (w: any) => w.wbsId === wbsItemIds[1],
      );
      expect(wbs).toBeDefined();
      expect(wbs.subProject).toBeNull(); // 항상 프로퍼티는 존재하고 null 값
      expect(wbs.wbsId).toBeDefined();
    });

    it('subProject를 수정할 수 있다', async () => {
      // Given - 초기 subProject로 저장
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '초기 평가',
        selfEvaluationScore: 80,
        performanceResult: '초기 성과',
        subProject: '백엔드 API',
      });

      expect(저장결과.subProject).toBe('백엔드 API');

      // When - subProject 수정
      const 수정결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '수정된 평가',
        selfEvaluationScore: 95,
        performanceResult: '수정된 성과',
        subProject: '프론트엔드 UI',
      });

      // Then - subProject가 수정되었는지 확인
      expect(수정결과.id).toBe(저장결과.id); // 동일한 평가
      expect(수정결과.subProject).toBe('프론트엔드 UI');
      expect(수정결과.version).toBeGreaterThan(저장결과.version);

      // When - 상세 조회로 재확인
      const 상세조회결과 =
        await wbsSelfEvaluationScenario.WBS자기평가_상세정보를_조회한다(
          저장결과.id,
        );

      // Then - 상세 조회에서도 수정된 subProject 확인
      expect(상세조회결과.subProject).toBe('프론트엔드 UI');
    });

    it('1차 평가자에게 제출 후에도 subProject가 유지된다', async () => {
      // Given - subProject 포함 자기평가 저장
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '제출 테스트',
        selfEvaluationScore: 100,
        performanceResult: '작업 완료',
        subProject: '데이터베이스 설계',
      });

      expect(저장결과.subProject).toBe('데이터베이스 설계');

      // When - 1차 평가자에게 제출
      const 제출결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
          저장결과.id,
        );

      // Then - 제출 후에도 subProject 유지
      expect(제출결과.submittedToEvaluator).toBe(true);
      expect(제출결과.subProject).toBe('데이터베이스 설계');

      // When - 사용자 할당 정보 조회
      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // Then - 할당 데이터에서도 subProject 확인
      const wbs = 할당데이터.projects[0].wbsList.find(
        (w: any) => w.wbsId === wbsItemIds[0],
      );
      expect(wbs.subProject).toBe('데이터베이스 설계');
    });

    it('관리자에게 제출 후에도 subProject가 유지된다', async () => {
      // Given - subProject 포함 자기평가 저장 및 1차 평가자 제출
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '관리자 제출 테스트',
        selfEvaluationScore: 110,
        performanceResult: '최종 완료',
        subProject: '시스템 통합',
      });

      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );

      // When - 관리자에게 제출
      const 제출결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
          저장결과.id,
        );

      // Then - 관리자 제출 후에도 subProject 유지
      expect(제출결과.submittedToManager).toBe(true);
      expect(제출결과.subProject).toBe('시스템 통합');

      // When - 나의 할당 정보 조회
      testSuite.setCurrentUser({
        id: employeeIds[0],
        email: 'test@example.com',
        name: '테스트 사용자',
        employeeNumber: 'TEST001',
      });

      const 나의할당데이터 =
        await wbsSelfEvaluationScenario.나의_할당_데이터를_조회한다(
          evaluationPeriodId,
        );

      // Then - 나의 할당 정보에서도 subProject 확인
      expect(나의할당데이터.projects).toBeDefined();
      const wbs = 나의할당데이터.projects[0].wbsList.find(
        (w: any) => w.wbsId === wbsItemIds[0],
      );
      expect(wbs).toBeDefined();
      expect(wbs.subProject).toBe('시스템 통합');
      expect(wbs.performance).toBeDefined();
      expect(wbs.performance.performanceResult).toBe('최종 완료');
    });
  });

  describe('자기평가 수정 (제출 전)', () => {
    it('자기평가를 수정하고 대시보드 API를 검증한다', async () => {
      // Given - 자기평가 저장
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '초기 자기평가 내용',
        selfEvaluationScore: 80,
      });

      const 저장된ID = 저장결과.id;
      const 저장된Version = 저장결과.version;

      // When - 자기평가 수정
      const 수정결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '수정된 자기평가 내용',
        selfEvaluationScore: 90,
        performanceResult: '수정된 성과 결과',
      });

      // Then - 수정 검증
      expect(수정결과.id).toBe(저장된ID); // 동일한 ID
      expect(수정결과.version).toBeGreaterThan(저장된Version); // version 증가
      expect(수정결과.selfEvaluationContent).toBe('수정된 자기평가 내용');
      expect(수정결과.selfEvaluationScore).toBe(90);

      // 대시보드 API 검증
      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(할당데이터.summary).toBeDefined();
      expect(할당데이터.summary.selfEvaluation.totalSelfEvaluations).toBe(1);
      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        0,
      );
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        false,
      );
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
        false,
      );
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeNull();
      expect(할당데이터.summary.selfEvaluation.grade).toBeNull();

      const 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0); // 제출 전
    });
  });

  describe('자기평가 제출 (피평가자 → 1차 평가자, 단일)', () => {
    it('자기평가를 1차 평가자에게 제출하고 대시보드 API를 검증한다', async () => {
      // Given - 자기평가 저장
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
      });

      // When - 1차 평가자에게 제출
      const 제출결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
          저장결과.id,
        );

      // Then - 제출 검증
      expect(제출결과.submittedToEvaluator).toBe(true);
      expect(제출결과.submittedToEvaluatorAt).toBeDefined();
      expect(제출결과.submittedToManager).toBe(false); // 아직 관리자 제출 전

      // 대시보드 API 검증
      const 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(true); // 전체가 1개이므로 true
      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0); // 관리자 제출 전

      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        1,
      );
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        true,
      );

      const 전체직원현황 =
        await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
          evaluationPeriodId,
        );

      const 직원정보 = 전체직원현황.find(
        (emp: any) => emp.employeeId === employeeIds[0],
      );
      expect(직원정보.selfEvaluation.isSubmittedToEvaluator).toBe(true);
    });
  });

  describe('자기평가 제출 (1차 평가자 → 관리자, 단일)', () => {
    it('자기평가를 관리자에게 제출하고 대시보드 API를 검증한다', async () => {
      // Given - 자기평가 저장 및 1차 평가자에게 제출
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
      });

      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );

      // When - 관리자에게 제출
      const 제출결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
          저장결과.id,
        );

      // Then - 제출 검증
      expect(제출결과.submittedToManager).toBe(true);
      expect(제출결과.submittedToManagerAt).toBeDefined();
      expect(제출결과.submittedToEvaluator).toBe(true); // 이미 제출된 상태 유지

      // 대시보드 API 검증
      const 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(1);
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(개별직원현황.selfEvaluation.status).toBe('pending'); // 모든 자기평가가 관리자에게 제출되었지만 승인 상태가 pending이므로 pending

      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(할당데이터.summary.completedSelfEvaluations).toBe(1);
      expect(할당데이터.summary.selfEvaluation.totalSelfEvaluations).toBe(1);
      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        1,
      );
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(1);
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        true,
      );
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(true);

      // 점수 계산 검증 (모든 자기평가 제출 완료 시)
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeDefined();
      expect(할당데이터.summary.selfEvaluation.grade).toBeDefined();
    });
  });

  describe('자기평가 수정 (제출 후)', () => {
    it('제출된 자기평가를 수정하고 대시보드 API를 검증한다', async () => {
      // Given - 자기평가 저장 및 제출
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '초기 자기평가 내용',
        selfEvaluationScore: 80,
      });

      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );
      await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
        저장결과.id,
      );

      // When - 제출된 자기평가 수정
      const 수정결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '수정된 자기평가 내용',
        selfEvaluationScore: 90,
      });

      // Then - 수정 검증
      expect(수정결과.selfEvaluationContent).toBe('수정된 자기평가 내용');
      expect(수정결과.selfEvaluationScore).toBe(90);
      expect(수정결과.submittedToManager).toBe(true); // 제출 상태 유지

      // 대시보드 API 검증
      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(할당데이터.summary.completedSelfEvaluations).toBe(1); // 제출 상태 유지
      expect(할당데이터.summary.selfEvaluation.totalSelfEvaluations).toBe(1);
      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        1,
      );
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(1);
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        true,
      );
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(true);
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeDefined(); // 재계산
      expect(할당데이터.summary.selfEvaluation.grade).toBeDefined(); // 재계산
    });
  });

  describe('자기평가 내용 초기화 (Clear)', () => {
    it('자기평가 내용을 초기화하고 대시보드 API를 검증한다', async () => {
      // Given - 자기평가 저장 및 제출
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
      });

      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );
      await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
        저장결과.id,
      );

      // When - 내용 초기화
      const 초기화결과 =
        await wbsSelfEvaluationScenario.WBS자기평가_내용을_초기화한다(
          저장결과.id,
        );

      // Then - 초기화 검증 (Clear는 내용을 빈 문자열(""), 점수를 0점으로 설정)
      expect(초기화결과.selfEvaluationContent).toBe('');
      expect(초기화결과.selfEvaluationScore).toBe(0);
      expect(초기화결과.submittedToManager).toBe(false); // 제출 상태도 초기화
      expect(초기화결과.submittedToManagerAt).toBeNull();

      // 대시보드 API가 업데이트된 데이터를 반영할 때까지 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 대시보드 API 검증
      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      const 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0); // 제출 상태 초기화
      expect(개별직원현황.selfEvaluation.status).toBe('in_progress');
      expect(개별직원현황.selfEvaluation.totalScore).toBeNull();
      expect(개별직원현황.selfEvaluation.grade).toBeNull();

      expect(할당데이터.summary.completedSelfEvaluations).toBe(0);
      expect(할당데이터.summary.selfEvaluation.totalSelfEvaluations).toBe(1); // 레코드는 존재
      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        0,
      );
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        false,
      );
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
        false,
      );
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeNull();
      expect(할당데이터.summary.selfEvaluation.grade).toBeNull();
    });
  });

  describe('자기평가 취소 (피평가자 → 1차 평가자 제출 취소)', () => {
    it('자기평가를 1차 평가자 제출 취소하고 대시보드 API를 검증한다', async () => {
      // Given - 자기평가 저장 및 1차 평가자에게 제출
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
      });

      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );

      // When - 1차 평가자 제출 취소
      const 취소결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자_제출_취소한다(
          저장결과.id,
        );

      // Then - 취소 검증 (Reset 시에는 제출 상태만 false로 변경, submittedToEvaluatorAt은 유지)
      expect(취소결과.submittedToEvaluator).toBe(false);
      // Reset 시에는 submittedToEvaluatorAt을 초기화하지 않고 유지
      expect(취소결과.selfEvaluationContent).toBe('자기평가 내용'); // 내용 유지
      expect(취소결과.selfEvaluationScore).toBe(85); // 내용 유지

      // 대시보드 API 검증
      const 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0); // 관리자 제출 상태와 무관

      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        0,
      );
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        false,
      );
    });
  });

  describe('자기평가 미제출 상태로 변경 (1차 평가자 → 관리자 제출 초기화)', () => {
    it('자기평가를 미제출 상태로 변경하고 대시보드 API를 검증한다', async () => {
      // Given - 자기평가 저장 및 제출
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
      });

      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );
      await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
        저장결과.id,
      );

      // When - 미제출 상태로 변경
      const 미제출결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_미제출_상태로_변경한다(
          저장결과.id,
        );

      // Then - 미제출 처리 검증 (Reset 시에는 제출 상태만 false로 변경, submittedToManagerAt은 유지)
      expect(미제출결과.submittedToManager).toBe(false);
      // Reset 시에는 submittedToManagerAt을 초기화하지 않고 유지
      expect(미제출결과.selfEvaluationContent).toBe('자기평가 내용'); // 내용 유지
      expect(미제출결과.selfEvaluationScore).toBe(85); // 내용 유지
      expect(미제출결과.submittedToEvaluator).toBe(true); // 1차 평가자 제출 상태 유지

      // 대시보드 API 검증
      const 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0);
      expect(개별직원현황.selfEvaluation.status).toBe('in_progress');
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(true); // 유지
      expect(개별직원현황.selfEvaluation.totalScore).toBeNull();
      expect(개별직원현황.selfEvaluation.grade).toBeNull();

      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
      expect(할당데이터.summary.completedSelfEvaluations).toBe(0);
      expect(할당데이터.summary.selfEvaluation.totalSelfEvaluations).toBe(1);
      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        1,
      ); // 1차 평가자 제출 상태 유지
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        true,
      ); // 1차 평가자 제출 상태 유지
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
        false,
      );
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeNull();
      expect(할당데이터.summary.selfEvaluation.grade).toBeNull();
    });
  });
});
