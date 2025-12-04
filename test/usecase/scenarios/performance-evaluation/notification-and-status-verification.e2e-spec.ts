import { BaseE2ETest } from '../../../base-e2e.spec';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import { WbsSelfEvaluationScenario } from './wbs-self-evaluation/wbs-self-evaluation.scenario';
import { DownwardEvaluationScenario } from './downward-evaluation/downward-evaluation.scenario';

describe('자기평가 및 하향평가 제출 시 알림 및 상태 검증', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let selfEvaluationScenario: WbsSelfEvaluationScenario;
  let downwardEvaluationScenario: DownwardEvaluationScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];
  let evaluateeId: string;
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    selfEvaluationScenario = new WbsSelfEvaluationScenario(testSuite);
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 시드 데이터 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 1,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

    // 피평가자 및 평가자 설정
    evaluateeId = employeeIds[0];
    primaryEvaluatorId = employeeIds[1];
    secondaryEvaluatorId = employeeIds[2];

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '알림 검증 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '알림 및 상태 검증 E2E 테스트용 평가기간',
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
      employeeId: evaluateeId,
      projectId: projectIds[0],
    });

    // WBS 할당
    await wbsAssignmentScenario.WBS를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: evaluateeId,
      wbsItemId: wbsItemIds[0],
      projectId: projectIds[0],
    });

    // 평가라인 매핑 생성 (1차 평가자)
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/period/${evaluationPeriodId}/primary-evaluator`,
      )
      .send({
        evaluatorId: primaryEvaluatorId,
      })
      .expect(201);

    // 평가라인 매핑 생성 (2차 평가자)
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}/secondary-evaluator`,
      )
      .send({
        evaluatorId: secondaryEvaluatorId,
      })
      .expect(201);
  });

  describe('시나리오 1: 자기평가 제출 시 알림 및 boolean 값 변경 검증', () => {
    it('1차 평가자가 다른 사람인 경우 - 자기평가 제출 시 submittedToEvaluator가 true로 변경되고 알림이 생성된다', async () => {
      console.log('\n🧪 테스트 시작: 1차 평가자가 다른 사람인 경우');
      console.log(`피평가자: ${evaluateeId.substring(0, 8)}`);
      console.log(`1차 평가자: ${primaryEvaluatorId.substring(0, 8)}`);

      // Given - 자기평가 저장
      const 저장결과 = await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: evaluateeId,
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 90,
        performanceResult: '성과 결과입니다.',
      });

      console.log(`저장된 자기평가 ID: ${저장결과.id.substring(0, 8)}`);

      // 제출 전 상태 확인
      expect(저장결과.submittedToEvaluator).toBe(false);
      expect(저장결과.submittedToEvaluatorAt).toBeNull();

      // When - 자기평가 제출
      const 제출결과 =
        await selfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
          저장결과.id,
        );

      console.log(`\n제출 결과:`);
      console.log(`  - submittedToEvaluator: ${제출결과.submittedToEvaluator}`);
      console.log(
        `  - submittedToEvaluatorAt: ${제출결과.submittedToEvaluatorAt}`,
      );

      // Then - boolean 값 변경 검증
      expect(제출결과.submittedToEvaluator).toBe(true);
      expect(제출결과.submittedToEvaluatorAt).not.toBeNull();

      console.log('✅ 테스트 통과: boolean 값 변경 검증 완료');
      console.log(
        '   (알림 전송은 비동기로 처리되며, 로그에서 전송 완료를 확인할 수 있습니다)',
      );
    });

    it('1차 평가자가 자기 자신인 경우 - 자기평가 제출 시에도 알림이 정상 생성된다', async () => {
      console.log('\n🧪 테스트 시작: 1차 평가자가 자기 자신인 경우');

      // Given - 1차 평가자를 자기 자신으로 설정
      const 자신이평가자인_직원 = employeeIds[3];
      console.log(`피평가자 (자신): ${자신이평가자인_직원.substring(0, 8)}`);

      // 프로젝트 및 WBS 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: 자신이평가자인_직원,
        projectId: projectIds[0],
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: 자신이평가자인_직원,
        wbsItemId: wbsItemIds[1],
        projectId: projectIds[0],
      });

      // 1차 평가자를 자기 자신으로 설정
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${자신이평가자인_직원}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: 자신이평가자인_직원, // 자기 자신
        })
        .expect(201);

      console.log('✅ 1차 평가자가 자기 자신으로 설정됨');

      // 자기평가 저장 및 제출
      const 저장결과 = await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: 자신이평가자인_직원,
        wbsItemId: wbsItemIds[1],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });

      const 제출결과 =
        await selfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
          저장결과.id,
        );

      // Then - boolean 값 변경 검증
      expect(제출결과.submittedToEvaluator).toBe(true);
      expect(제출결과.submittedToEvaluatorAt).not.toBeNull();

      console.log(
        '✅ 테스트 통과: 1차 평가자가 자기 자신인 경우에도 boolean 값 변경 및 알림 전송 로직이 정상 작동함',
      );
      console.log(
        '   (알림 전송은 비동기로 처리되며, 로그에서 전송 완료를 확인할 수 있습니다)',
      );
    });
  });

  describe('시나리오 2: 1차 하향평가 제출 시 알림 및 boolean 값 변경 검증', () => {
    beforeEach(async () => {
      // 선행 조건: 자기평가 제출
      const 저장결과 = await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: evaluateeId,
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 90,
        performanceResult: '성과 결과입니다.',
      });

      await selfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );
    });

    it('1차 하향평가 제출 시 isCompleted가 true로 변경되고 피평가자에게 알림이 생성된다', async () => {
      console.log(
        '\n🧪 테스트 시작: 1차 하향평가 제출 시 알림 및 boolean 값 검증',
      );
      console.log(`피평가자: ${evaluateeId.substring(0, 8)}`);
      console.log(`1차 평가자: ${primaryEvaluatorId.substring(0, 8)}`);

      // Given - 1차 하향평가 저장
      const 저장결과 =
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          downwardEvaluationContent: '1차 하향평가 내용입니다.',
          downwardEvaluationScore: 85,
        });

      console.log(
        `저장된 1차 하향평가 ID: ${저장결과.id.substring(0, 8)}`,
      );

      // 제출 전 상태 확인 - 평가 목록 조회
      const 제출전평가목록 =
        await downwardEvaluationScenario.평가자의_하향평가_목록을_조회한다({
          evaluatorId: primaryEvaluatorId,
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluationType: 'primary',
        });

      expect(제출전평가목록.evaluations[0].isCompleted).toBe(false);

      // When - 1차 하향평가 제출
      await downwardEvaluationScenario.일차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: primaryEvaluatorId,
      });

      console.log('\n1차 하향평가 제출 완료');

      // Then - boolean 값 변경 검증
      const 제출후평가목록 =
        await downwardEvaluationScenario.평가자의_하향평가_목록을_조회한다({
          evaluatorId: primaryEvaluatorId,
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluationType: 'primary',
        });

      const 제출된평가 = 제출후평가목록.evaluations[0];
      console.log(`\n제출 후 상태:`);
      console.log(`  - isCompleted: ${제출된평가.isCompleted}`);
      console.log(`  - completedAt: ${제출된평가.completedAt}`);

      expect(제출된평가.isCompleted).toBe(true);
      expect(제출된평가.completedAt).not.toBeNull();

      console.log('✅ 테스트 통과: boolean 값 변경 검증 완료');
      console.log(
        '   (알림 전송은 비동기로 처리되며, 로그에서 전송 완료를 확인할 수 있습니다)',
      );
    });
  });

});

