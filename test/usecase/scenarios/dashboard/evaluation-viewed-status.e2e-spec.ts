import { BaseE2ETest } from '../../../base-e2e.spec';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { DashboardScenario } from '../dashboard.scenario';
import { SelfEvaluationScenario } from '../self-evaluation.scenario';
import { EvaluationActivityLogScenario } from '../evaluation-activity-log/evaluation-activity-log.scenario';
import { DownwardEvaluationScenario } from '../downward-evaluation/downward-evaluation.scenario';

/**
 * 평가 확인 여부 E2E 테스트
 *
 * 평가자가 피평가자의 평가를 조회할 때 확인 여부가 올바르게 기록되고 조회되는지 검증합니다.
 */
describe('평가 확인 여부 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let dashboardScenario: DashboardScenario;
  let selfEvaluationScenario: SelfEvaluationScenario;
  let downwardEvaluationScenario: DownwardEvaluationScenario;
  let activityLogScenario: EvaluationActivityLogScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let wbsItemIds: string[];
  let projectIds: string[];
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;
  let evaluateeId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    dashboardScenario = new DashboardScenario(testSuite);
    selfEvaluationScenario = new SelfEvaluationScenario(testSuite);
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
    activityLogScenario = new EvaluationActivityLogScenario(testSuite);

    // 시드 데이터 생성 (충분한 직원 수 확보)
    const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 10,
    });

    employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
    projectIds = seedResponse.results[0].generatedIds?.projectIds || [];
    wbsItemIds = seedResponse.results[0].generatedIds?.wbsIds || [];

    // 평가기간 생성 (시나리오 메서드 사용)
    const today = new Date('2024-07-01');
    const nextMonth = new Date('2024-12-31');

    const createdPeriod = await evaluationPeriodScenario.평가기간을_생성한다({
      name: '2024년 하반기 평가',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '평가 확인 여부 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
    });

    evaluationPeriodId = createdPeriod.id;

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);

    // 평가자와 피평가자 설정
    evaluateeId = employeeIds[0];
    primaryEvaluatorId = employeeIds[1];
    secondaryEvaluatorId = employeeIds[2];

    // 피평가자를 평가 대상으로 등록
    await testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/targets/bulk`)
      .send({
        employeeIds: [evaluateeId],
      })
      .expect(201);

    // 1차 평가자 구성
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/period/${evaluationPeriodId}/primary-evaluator`,
      )
      .send({
        evaluatorId: primaryEvaluatorId,
      })
      .expect(201);

    // 프로젝트 배정
    await testSuite
      .request()
      .post(`/admin/evaluation-criteria/project-assignments`)
      .send({
        employeeId: evaluateeId,
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      })
      .expect(201);

    // WBS 배정
    if (wbsItemIds.length > 0) {
      await testSuite
        .request()
        .post(`/admin/evaluation-criteria/wbs-assignments`)
        .send({
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        })
        .expect(201);

      // 2차 평가자 구성 (WBS별)
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}/secondary-evaluator`,
        )
        .send({
          evaluatorId: secondaryEvaluatorId,
        })
        .expect(201);
    }
  });

  afterAll(async () => {
    // 정리 작업
    if (evaluationPeriodScenario && evaluationPeriodId) {
      await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
    }
    if (seedDataScenario) {
      await seedDataScenario.시드_데이터를_삭제한다();
    }
    if (testSuite) {
      await testSuite.closeApp();
    }
  });

  describe('1차 평가자 자기평가 확인 여부', () => {
    it('피평가자가 자기평가를 제출하지 않으면 viewedBy 필드가 포함되지 않아야 한다', async () => {
      // 현재 사용자를 1차 평가자로 설정
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      // 1차 평가자가 평가 대상자 현황 조회
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: evaluateeId,
      });

      // 자기평가를 제출하지 않았으므로 viewedBy 필드가 없어야 함
      expect(result.selfEvaluation.viewedByPrimaryEvaluator).toBeUndefined();
      expect(result.selfEvaluation.viewedBySecondaryEvaluator).toBeUndefined();
    });

    it('피평가자가 자기평가를 제출하면 1차 평가자 확인 여부가 false여야 한다', async () => {
      // 현재 사용자를 피평가자로 설정
      testSuite.setCurrentUser({
        id: evaluateeId,
        email: 'evaluatee@test.com',
        name: '피평가자',
        employeeNumber: 'EMP001',
      });

      // WBS 자기평가 저장 및 제출
      const selfEvaluationResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '성과 결과',
        })
        .expect(200);

      const selfEvaluationId = selfEvaluationResponse.body.id;

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${selfEvaluationId}/submit-to-evaluator`,
        )
        .expect(200);

      // 1차 평가자로 변경
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      // 1차 평가자가 평가 대상자 현황 조회
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: evaluateeId,
        expectedSelfEvaluationViewedByPrimaryEvaluator: false,
      });

      // 자기평가 제출 시 viewedBy 필드 포함
      expect(result.selfEvaluation.viewedByPrimaryEvaluator).toBe(false);
    });

    it('1차 평가자가 피평가자 데이터를 조회하면 확인 여부가 true로 변경되어야 한다', async () => {
      // 먼저 자기평가 제출 (선행 조건)
      testSuite.setCurrentUser({
        id: evaluateeId,
        email: 'evaluatee@test.com',
        name: '피평가자',
        employeeNumber: 'EMP001',
      });

      const selfEvaluationResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '성과 결과',
        })
        .expect(200);

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${selfEvaluationResponse.body.id}/submit-to-evaluator`,
        )
        .expect(200);

      // 약간의 지연 (시간 순서 명확화)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 1차 평가자로 변경
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      // 1차 평가자가 피평가자의 할당 데이터 조회
      await dashboardScenario.평가자가_피평가자_할당_데이터를_조회한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: evaluateeId,
      });

      // 활동 내역 검증
      const activityLogs = await activityLogScenario.활동_내역을_조회한다({
        periodId: evaluationPeriodId,
        employeeId: evaluateeId,
        limit: 10,
      });

      // 'viewed' 액션이 기록되었는지 확인
      const viewedLog = activityLogs.items.find(
        (log: any) =>
          log.activityAction === 'viewed' &&
          log.activityType === 'downward_evaluation' &&
          log.performedBy === primaryEvaluatorId,
      );
      expect(viewedLog).toBeDefined();
      expect(viewedLog.activityTitle).toBe('피평가자 할당 정보 조회');

      // 1차 평가자가 평가 대상자 현황 다시 조회
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: evaluateeId,
        expectedSelfEvaluationViewedByPrimaryEvaluator: true,
      });

      expect(result.selfEvaluation.viewedByPrimaryEvaluator).toBe(true);
    });
  });

  describe('2차 평가자 자기평가 및 1차평가 확인 여부', () => {
    let primaryDownwardEvaluationId: string;

    it('1차 평가가 제출되지 않으면 primaryEvaluationViewed 필드가 포함되지 않아야 한다', async () => {
      // 현재 사용자를 2차 평가자로 설정
      testSuite.setCurrentUser({
        id: secondaryEvaluatorId,
        email: 'secondary@test.com',
        name: '2차 평가자',
        employeeNumber: 'EMP003',
      });

      // 2차 평가자가 평가 대상자 현황 조회
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: secondaryEvaluatorId,
        employeeId: evaluateeId,
      });

      // 1차 평가를 제출하지 않았으므로 primaryEvaluationViewed 필드가 없어야 함
      expect(
        result.downwardEvaluation.secondaryStatus?.primaryEvaluationViewed,
      ).toBeUndefined();
    });

    it('피평가자가 자기평가를 제출하고 1차 평가자가 1차평가를 제출하면 2차 평가자 확인 여부가 false여야 한다', async () => {
      // 현재 사용자를 1차 평가자로 설정
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      // 1차 하향평가 저장 및 제출
      const primaryDownwardResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[0]}/primary`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 95,
          performanceResult: '1차 평가 성과 결과',
        })
        .expect(200);

      primaryDownwardEvaluationId = primaryDownwardResponse.body.id;

      // 1차 하향평가 제출
      const submitResult = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[0]}/primary/submit`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
        });

      // 200 (성공) 또는 409 (이미 제출됨) 모두 허용
      expect([200, 409]).toContain(submitResult.status);

      // 2차 평가자로 변경
      testSuite.setCurrentUser({
        id: secondaryEvaluatorId,
        email: 'secondary@test.com',
        name: '2차 평가자',
        employeeNumber: 'EMP003',
      });

      // 2차 평가자가 평가 대상자 현황 조회
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: secondaryEvaluatorId,
        employeeId: evaluateeId,
        expectedSelfEvaluationViewedBySecondaryEvaluator: false,
        expectedPrimaryEvaluationViewedBySecondaryEvaluator: false,
      });

      expect(result.selfEvaluation.viewedBySecondaryEvaluator).toBe(false);
      // 1차 평가 제출 시 primaryEvaluationViewed 필드 포함
      expect(
        result.downwardEvaluation.secondaryStatus?.primaryEvaluationViewed,
      ).toBe(false);
    });

    it('2차 평가자가 피평가자 데이터를 조회하면 자기평가 및 1차평가 확인 여부가 true로 변경되어야 한다', async () => {
      // 먼저 자기평가 및 1차 하향평가 제출 (선행 조건)
      testSuite.setCurrentUser({
        id: evaluateeId,
        email: 'evaluatee@test.com',
        name: '피평가자',
        employeeNumber: 'EMP001',
      });

      const selfEvaluationResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '성과 결과',
        })
        .expect(200);

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${selfEvaluationResponse.body.id}/submit-to-evaluator`,
        )
        .expect(200);

      // 1차 하향평가 저장 및 제출
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[0]}/primary`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 95,
          performanceResult: '1차 평가 성과 결과',
        })
        .expect(200);

      const primarySubmitResult = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[0]}/primary/submit`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
        });

      // 200 (성공) 또는 409 (이미 제출됨) 모두 허용
      expect([200, 409]).toContain(primarySubmitResult.status);

      // 약간의 지연 (시간 순서 명확화)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 2차 평가자로 변경
      testSuite.setCurrentUser({
        id: secondaryEvaluatorId,
        email: 'secondary@test.com',
        name: '2차 평가자',
        employeeNumber: 'EMP003',
      });

      // 2차 평가자가 피평가자의 할당 데이터 조회
      await dashboardScenario.평가자가_피평가자_할당_데이터를_조회한다({
        evaluationPeriodId,
        evaluatorId: secondaryEvaluatorId,
        employeeId: evaluateeId,
      });

      // 활동 내역 검증
      const activityLogs = await activityLogScenario.활동_내역을_조회한다({
        periodId: evaluationPeriodId,
        employeeId: evaluateeId,
        limit: 10,
      });

      // 'viewed' 액션이 기록되었는지 확인
      const viewedLog = activityLogs.items.find(
        (log: any) =>
          log.activityAction === 'viewed' &&
          log.activityType === 'downward_evaluation' &&
          log.performedBy === secondaryEvaluatorId,
      );
      expect(viewedLog).toBeDefined();
      expect(viewedLog.activityTitle).toBe('피평가자 할당 정보 조회');

      // 2차 평가자가 평가 대상자 현황 다시 조회
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: secondaryEvaluatorId,
        employeeId: evaluateeId,
        expectedSelfEvaluationViewedBySecondaryEvaluator: true,
        expectedPrimaryEvaluationViewedBySecondaryEvaluator: true,
      });

      expect(result.selfEvaluation.viewedBySecondaryEvaluator).toBe(true);
      expect(
        result.downwardEvaluation.secondaryStatus?.primaryEvaluationViewed,
      ).toBe(true);
    });
  });

  describe('여러 피평가자의 확인 여부 독립성', () => {
    let secondEvaluateeId: string;

    beforeAll(async () => {
      // 두 번째 피평가자 설정 (충분한 직원이 없으면 테스트 건너뛰기)
      if (employeeIds.length < 4) {
        console.log(
          '⚠️ 테스트를 위한 충분한 직원이 없습니다. 이 테스트를 건너뜁니다.',
        );
        return;
      }

      secondEvaluateeId = employeeIds[3];

      // 두 번째 피평가자를 평가 대상으로 등록
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/targets/bulk`)
        .send({
          employeeIds: [secondEvaluateeId],
        })
        .expect(201);

      // 1차 평가자 구성 (동일한 1차 평가자)
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${secondEvaluateeId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
        })
        .expect(201);

      // 프로젝트 배정
      await testSuite
        .request()
        .post(`/admin/evaluation-criteria/project-assignments`)
        .send({
          employeeId: secondEvaluateeId,
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        })
        .expect(201);

      // WBS 배정
      if (wbsItemIds.length > 1) {
        await testSuite
          .request()
          .post(`/admin/evaluation-criteria/wbs-assignments`)
          .send({
            employeeId: secondEvaluateeId,
            wbsItemId: wbsItemIds[1],
            projectId: projectIds[0],
            periodId: evaluationPeriodId,
          })
          .expect(201);
      }
    });

    it('1차 평가자가 첫 번째 피평가자만 조회하면 두 번째 피평가자의 확인 여부는 false여야 한다', async () => {
      // 충분한 직원이 없으면 테스트 건너뛰기
      if (!secondEvaluateeId || employeeIds.length < 4) {
        console.log(
          '⚠️ 테스트를 위한 충분한 직원이 없습니다. 이 테스트를 건너뜁니다.',
        );
        return;
      }

      // 첫 번째 피평가자의 자기평가 제출
      testSuite.setCurrentUser({
        id: evaluateeId,
        email: 'evaluatee@test.com',
        name: '피평가자',
        employeeNumber: 'EMP001',
      });

      const firstSelfEvalResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '첫 번째 자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '첫 번째 성과 결과',
        })
        .expect(200);

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${firstSelfEvalResponse.body.id}/submit-to-evaluator`,
        )
        .expect(200);

      // 두 번째 피평가자의 자기평가 제출
      testSuite.setCurrentUser({
        id: secondEvaluateeId,
        email: 'evaluatee2@test.com',
        name: '두 번째 피평가자',
        employeeNumber: 'EMP004',
      });

      const selfEvaluationResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${secondEvaluateeId}/wbs/${wbsItemIds[1] || wbsItemIds[0]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '두 번째 자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '두 번째 성과 결과',
        })
        .expect(200);

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${selfEvaluationResponse.body.id}/submit-to-evaluator`,
        )
        .expect(200);

      // 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 1차 평가자로 변경
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      // 첫 번째 피평가자만 조회
      await dashboardScenario.평가자가_피평가자_할당_데이터를_조회한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: evaluateeId,
      });

      // 두 번째 피평가자의 확인 여부 검증 (조회 전이므로 false)
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: secondEvaluateeId,
        expectedSelfEvaluationViewedByPrimaryEvaluator: false,
      });

      expect(result.selfEvaluation.viewedByPrimaryEvaluator).toBe(false);

      // 첫 번째 피평가자는 이미 조회했으므로 true
      const firstResult = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: evaluateeId,
        expectedSelfEvaluationViewedByPrimaryEvaluator: true,
      });

      expect(firstResult.selfEvaluation.viewedByPrimaryEvaluator).toBe(true);
    });

    it('1차 평가자가 두 번째 피평가자를 조회하면 해당 피평가자의 확인 여부만 true로 변경되어야 한다', async () => {
      // 충분한 직원이 없으면 테스트 건너뛰기
      if (!secondEvaluateeId || employeeIds.length < 4) {
        console.log(
          '⚠️ 테스트를 위한 충분한 직원이 없습니다. 이 테스트를 건너뜁니다.',
        );
        return;
      }

      // 두 피평가자의 자기평가 제출
      testSuite.setCurrentUser({
        id: evaluateeId,
        email: 'evaluatee@test.com',
        name: '피평가자',
        employeeNumber: 'EMP001',
      });

      const firstSelfEvalResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '첫 번째 자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '첫 번째 성과 결과',
        })
        .expect(200);

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${firstSelfEvalResponse.body.id}/submit-to-evaluator`,
        )
        .expect(200);

      testSuite.setCurrentUser({
        id: secondEvaluateeId,
        email: 'evaluatee2@test.com',
        name: '두 번째 피평가자',
        employeeNumber: 'EMP004',
      });

      const secondSelfEvalResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${secondEvaluateeId}/wbs/${wbsItemIds[1] || wbsItemIds[0]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '두 번째 자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '두 번째 성과 결과',
        })
        .expect(200);

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${secondSelfEvalResponse.body.id}/submit-to-evaluator`,
        )
        .expect(200);

      // 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 1차 평가자로 변경
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      // 1차 평가자가 첫 번째 피평가자의 할당 데이터 조회
      await dashboardScenario.평가자가_피평가자_할당_데이터를_조회한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: evaluateeId,
      });

      // 약간의 지연 (Activity Log 커밋 대기)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 첫 번째 피평가자의 확인 여부 검증 (조회 후이므로 true)
      const firstResult = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: evaluateeId,
        expectedSelfEvaluationViewedByPrimaryEvaluator: true,
      });

      expect(firstResult.selfEvaluation.viewedByPrimaryEvaluator).toBe(true);

      // 1차 평가자가 두 번째 피평가자의 할당 데이터 조회
      await dashboardScenario.평가자가_피평가자_할당_데이터를_조회한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: secondEvaluateeId,
      });

      // 약간의 지연 (Activity Log 커밋 대기)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 두 번째 피평가자의 확인 여부 검증 (조회 후이므로 true)
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: secondEvaluateeId,
        expectedSelfEvaluationViewedByPrimaryEvaluator: true,
      });

      expect(result.selfEvaluation.viewedByPrimaryEvaluator).toBe(true);

      // 첫 번째 피평가자도 여전히 true
      const firstResultAfter =
        await dashboardScenario.평가_확인_여부를_검증한다({
          evaluationPeriodId,
          evaluatorId: primaryEvaluatorId,
          employeeId: evaluateeId,
          expectedSelfEvaluationViewedByPrimaryEvaluator: true,
        });

      expect(firstResultAfter.selfEvaluation.viewedByPrimaryEvaluator).toBe(
        true,
      );
    });
  });

  describe('평가자 유형별 필드 제한', () => {
    beforeAll(async () => {
      // 자기평가 및 1차 평가 제출 (선행 조건)
      testSuite.setCurrentUser({
        id: evaluateeId,
        email: 'evaluatee@test.com',
        name: '피평가자',
        employeeNumber: 'EMP001',
      });

      const selfEvaluationResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '성과 결과',
        })
        .expect(200);

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${selfEvaluationResponse.body.id}/submit-to-evaluator`,
        )
        .expect(200);

      // 1차 하향평가 저장 및 제출
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[0]}/primary`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 95,
          performanceResult: '1차 평가 성과 결과',
        })
        .expect(200);

      const submitResult = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[0]}/primary/submit`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
        });

      // 200 (성공) 또는 409 (이미 제출됨) 모두 허용
      expect([200, 409]).toContain(submitResult.status);
    });

    it('1차 평가자가 조회할 때 2차 평가자 전용 필드가 포함되지 않아야 한다', async () => {
      // 1차 평가자로 변경
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      // 1차 평가자가 평가 대상자 현황 조회
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: primaryEvaluatorId,
        employeeId: evaluateeId,
      });

      // 1차 평가자 전용 필드만 포함
      expect(result.selfEvaluation.viewedByPrimaryEvaluator).toBeDefined();
      
      // 2차 평가자 전용 필드는 포함되지 않아야 함
      expect(result.selfEvaluation.viewedBySecondaryEvaluator).toBeUndefined();
      expect(
        result.downwardEvaluation.secondaryStatus?.primaryEvaluationViewed,
      ).toBeUndefined();
    });

    it('2차 평가자가 조회할 때 1차 평가자 전용 필드가 포함되지 않아야 한다', async () => {
      // 2차 평가자로 변경
      testSuite.setCurrentUser({
        id: secondaryEvaluatorId,
        email: 'secondary@test.com',
        name: '2차 평가자',
        employeeNumber: 'EMP003',
      });

      // 2차 평가자가 평가 대상자 현황 조회
      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: secondaryEvaluatorId,
        employeeId: evaluateeId,
      });

      // 2차 평가자 전용 필드만 포함
      expect(result.selfEvaluation.viewedBySecondaryEvaluator).toBeDefined();
      expect(
        result.downwardEvaluation.secondaryStatus?.primaryEvaluationViewed,
      ).toBeDefined();

      // 1차 평가자 전용 필드는 포함되지 않아야 함
      expect(result.selfEvaluation.viewedByPrimaryEvaluator).toBeUndefined();
    });
  });

  describe('평가자가 아닌 사람의 조회', () => {
    let nonEvaluatorId: string;

    beforeAll(async () => {
      // 평가자가 아닌 직원 설정 (충분한 직원이 없으면 테스트 건너뛰기)
      if (employeeIds.length < 5) {
        console.log(
          '⚠️ 테스트를 위한 충분한 직원이 없습니다. 이 테스트를 건너뜁니다.',
        );
        return;
      }

      nonEvaluatorId = employeeIds[4];

      // 자기평가 및 1차 평가 제출 (선행 조건)
      testSuite.setCurrentUser({
        id: evaluateeId,
        email: 'evaluatee@test.com',
        name: '피평가자',
        employeeNumber: 'EMP001',
      });

      const selfEvaluationResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '성과 결과',
        })
        .expect(200);

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${selfEvaluationResponse.body.id}/submit-to-evaluator`,
        )
        .expect(200);

      // 1차 하향평가 저장 및 제출
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[0]}/primary`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 95,
          performanceResult: '1차 평가 성과 결과',
        })
        .expect(200);

      const submitResult = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[0]}/primary/submit`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
        });

      // 200 (성공) 또는 409 (이미 제출됨) 모두 허용
      expect([200, 409]).toContain(submitResult.status);
    });

    it('평가자가 아닌 사람이 조회할 때 모든 viewed 관련 필드가 포함되지 않아야 한다', async () => {
      // 충분한 직원이 없으면 테스트 건너뛰기
      if (!nonEvaluatorId || employeeIds.length < 5) {
        console.log(
          '⚠️ 테스트를 위한 충분한 직원이 없습니다. 이 테스트를 건너뜁니다.',
        );
        return;
      }

      // 평가자가 아닌 사람으로 변경
      testSuite.setCurrentUser({
        id: nonEvaluatorId,
        email: 'non-evaluator@test.com',
        name: '평가자 아님',
        employeeNumber: 'EMP005',
      });

      // 평가 대상자 현황 조회
      const 현황 = await dashboardScenario.평가대상자_현황을_조회한다({
        evaluationPeriodId,
        evaluatorId: nonEvaluatorId,
      });

      // 평가자가 아니므로 담당하는 피평가자가 없어야 함 (빈 배열)
      expect(현황).toEqual([]);
    });

    it('평가자가 아닌 사람이 피평가자 데이터를 조회해도 Activity Log에 viewed가 기록되지 않아야 한다', async () => {
      // 충분한 직원이 없으면 테스트 건너뛰기
      if (!nonEvaluatorId || employeeIds.length < 5) {
        console.log(
          '⚠️ 테스트를 위한 충분한 직원이 없습니다. 이 테스트를 건너뜁니다.',
        );
        return;
      }

      // 평가자가 아닌 사람으로 변경
      testSuite.setCurrentUser({
        id: nonEvaluatorId,
        email: 'non-evaluator@test.com',
        name: '평가자 아님',
        employeeNumber: 'EMP005',
      });

      // 조회 전 Activity Log 개수 확인
      const beforeLogs = await activityLogScenario.활동_내역을_조회한다({
        periodId: evaluationPeriodId,
        employeeId: evaluateeId,
        limit: 100,
      });

      const beforeViewedCount = beforeLogs.items.filter(
        (log: any) =>
          log.activityAction === 'viewed' &&
          log.performedBy === nonEvaluatorId,
      ).length;

      // 피평가자의 할당 데이터 조회 (평가자가 아니므로 404 또는 403 예상)
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/assigned-data`,
        );

      // 평가자가 아닌 사람의 조회는 실패하거나, 성공하더라도 Activity Log에 기록되지 않아야 함
      if (response.status === 200) {
        // 성공한 경우에도 Activity Log에 viewed가 기록되지 않아야 함
        await new Promise((resolve) => setTimeout(resolve, 100));

        const afterLogs = await activityLogScenario.활동_내역을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          limit: 100,
        });

        const afterViewedCount = afterLogs.items.filter(
          (log: any) =>
            log.activityAction === 'viewed' &&
            log.performedBy === nonEvaluatorId,
        ).length;

        // viewed 액션이 기록되지 않았는지 확인
        expect(afterViewedCount).toBe(beforeViewedCount);
      }
    });
  });

  describe('피평가자가 자기 자신의 평가자인 경우', () => {
    let selfEvaluatingEmployeeId: string;

    beforeAll(async () => {
      // 자기 자신을 평가하는 직원 설정
      if (employeeIds.length < 4) {
        console.log(
          '⚠️ 테스트를 위한 충분한 직원이 없습니다. 이 테스트를 건너뜁니다.',
        );
        return;
      }

      selfEvaluatingEmployeeId = employeeIds[3];

      // 피평가자로 등록 (이미 등록된 경우 에러 무시)
      const registerTargetResult = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/targets/bulk`)
        .send({
          employeeIds: [selfEvaluatingEmployeeId],
        });
      
      // 201 (성공) 또는 기타 에러 (부분 성공 등) 허용
      if (registerTargetResult.status !== 201 && registerTargetResult.status !== 200) {
        console.log('⚠️ 평가 대상자 등록 응답:', registerTargetResult.status, registerTargetResult.body);
      }

      // 프로젝트 배정 (이미 배정된 경우 409 허용)
      const projectAssignResult = await testSuite
        .request()
        .post(`/admin/evaluation-criteria/project-assignments`)
        .send({
          employeeId: selfEvaluatingEmployeeId,
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        });
      
      // 201 (성공) 또는 409 (이미 배정됨) 모두 허용
      expect([201, 409]).toContain(projectAssignResult.status);

      // WBS 배정 (이미 배정된 경우 409 허용)
      if (wbsItemIds.length > 1) {
        const wbsAssignResult = await testSuite
          .request()
          .post(`/admin/evaluation-criteria/wbs-assignments`)
          .send({
            employeeId: selfEvaluatingEmployeeId,
            wbsItemId: wbsItemIds[1],
            projectId: projectIds[0],
            periodId: evaluationPeriodId,
          });
        
        // 201 (성공) 또는 409 (이미 배정됨) 모두 허용
        expect([201, 409]).toContain(wbsAssignResult.status);

        // 자기 자신을 2차 평가자로 지정 (이미 지정된 경우 409 허용)
        const secondaryEvaluatorResult = await testSuite
          .request()
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${selfEvaluatingEmployeeId}/wbs/${wbsItemIds[1]}/period/${evaluationPeriodId}/secondary-evaluator`,
          )
          .send({
            evaluatorId: selfEvaluatingEmployeeId, // 자기 자신
          });
        
        // 201 (성공) 또는 409 (이미 지정됨) 모두 허용
        expect([201, 409]).toContain(secondaryEvaluatorResult.status);
      }

      // 1차 평가자 구성 (다른 사람, 이미 지정된 경우 409 허용)
      const primaryEvaluatorResult = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${selfEvaluatingEmployeeId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
        });
      
      // 201 (성공) 또는 409 (이미 지정됨) 모두 허용
      expect([201, 409]).toContain(primaryEvaluatorResult.status);

      // 자기평가 작성 및 제출
      testSuite.setCurrentUser({
        id: selfEvaluatingEmployeeId,
        email: 'self-eval@test.com',
        name: '자기평가자',
        employeeNumber: 'EMP004',
      });

      const selfEvalResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${selfEvaluatingEmployeeId}/wbs/${wbsItemIds[1]}/period/${evaluationPeriodId}`,
        )
        .send({
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 100,
          performanceResult: '성과 결과',
        })
        .expect(200);

      // 1차 평가자에게 자기평가 제출
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${selfEvalResponse.body.id}/submit-to-evaluator`,
        )
        .expect(200);

      // 1차 평가자가 1차 하향평가 작성 및 제출
      testSuite.setCurrentUser({
        id: primaryEvaluatorId,
        email: 'primary@test.com',
        name: '1차 평가자',
        employeeNumber: 'EMP002',
      });

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${selfEvaluatingEmployeeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[1]}/primary`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 95,
          performanceResult: '1차 평가 성과 결과',
        })
        .expect(200);

      const submitResult = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${selfEvaluatingEmployeeId}/period/${evaluationPeriodId}/wbs/${wbsItemIds[1]}/primary/submit`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
        });

      // 200 (성공) 또는 409 (이미 제출됨) 모두 허용
      expect([200, 409]).toContain(submitResult.status);
    });

    it('자기 자신이 2차 평가자로 데이터를 조회하면 Activity Log가 기록되어야 한다', async () => {
      // 충분한 직원이 없으면 테스트 건너뛰기
      if (!selfEvaluatingEmployeeId || employeeIds.length < 4) {
        console.log(
          '⚠️ 테스트를 위한 충분한 직원이 없습니다. 이 테스트를 건너뜁니다.',
        );
        return;
      }

      // 자기 자신으로 사용자 변경 (2차 평가자 역할)
      testSuite.setCurrentUser({
        id: selfEvaluatingEmployeeId,
        email: 'self-eval@test.com',
        name: '자기평가자',
        employeeNumber: 'EMP004',
      });

      // 조회 전 상태 확인 (viewedBy 필드가 false)
      const beforeResult = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: selfEvaluatingEmployeeId,
        employeeId: selfEvaluatingEmployeeId,
        expectedSelfEvaluationViewedBySecondaryEvaluator: false,
        expectedPrimaryEvaluationViewedBySecondaryEvaluator: false,
      });

      expect(beforeResult.selfEvaluation.viewedBySecondaryEvaluator).toBe(
        false,
      );
      expect(
        beforeResult.downwardEvaluation.secondaryStatus
          ?.primaryEvaluationViewed,
      ).toBe(false);

      // 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 2차 평가자로서 자기 자신의 할당 데이터 조회
      await dashboardScenario.평가자가_피평가자_할당_데이터를_조회한다({
        evaluationPeriodId,
        evaluatorId: selfEvaluatingEmployeeId,
        employeeId: selfEvaluatingEmployeeId,
      });

      // Activity Log 기록 확인
      const activityLogs = await activityLogScenario.활동_내역을_조회한다({
        periodId: evaluationPeriodId,
        employeeId: selfEvaluatingEmployeeId,
        limit: 10,
      });

      const viewedLog = activityLogs.items.find(
        (log: any) =>
          log.activityAction === 'viewed' &&
          log.activityType === 'downward_evaluation' &&
          log.performedBy === selfEvaluatingEmployeeId,
      );

      expect(viewedLog).toBeDefined();
      expect(viewedLog.activityTitle).toBe('피평가자 할당 정보 조회');

      // 약간의 지연 (Activity Log 커밋 대기)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 조회 후 상태 확인 (viewedBy 필드가 true로 변경)
      const afterResult = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: selfEvaluatingEmployeeId,
        employeeId: selfEvaluatingEmployeeId,
        expectedSelfEvaluationViewedBySecondaryEvaluator: true,
        expectedPrimaryEvaluationViewedBySecondaryEvaluator: true,
      });

      expect(afterResult.selfEvaluation.viewedBySecondaryEvaluator).toBe(true);
      expect(
        afterResult.downwardEvaluation.secondaryStatus?.primaryEvaluationViewed,
      ).toBe(true);
    });

    it('자기 자신이 2차 평가자인 경우 2차 평가자 전용 필드만 포함되어야 한다', async () => {
      // 충분한 직원이 없으면 테스트 건너뛰기
      if (!selfEvaluatingEmployeeId || employeeIds.length < 4) {
        console.log(
          '⚠️ 테스트를 위한 충분한 직원이 없습니다. 이 테스트를 건너뜁니다.',
        );
        return;
      }

      // 자기 자신으로 사용자 변경 (2차 평가자 역할)
      testSuite.setCurrentUser({
        id: selfEvaluatingEmployeeId,
        email: 'self-eval@test.com',
        name: '자기평가자',
        employeeNumber: 'EMP004',
      });

      const result = await dashboardScenario.평가_확인_여부를_검증한다({
        evaluationPeriodId,
        evaluatorId: selfEvaluatingEmployeeId,
        employeeId: selfEvaluatingEmployeeId,
      });

      // 2차 평가자 전용 필드만 포함
      expect(result.selfEvaluation.viewedBySecondaryEvaluator).toBeDefined();
      expect(
        result.downwardEvaluation.secondaryStatus?.primaryEvaluationViewed,
      ).toBeDefined();

      // 1차 평가자 전용 필드는 포함되지 않아야 함
      expect(result.selfEvaluation.viewedByPrimaryEvaluator).toBeUndefined();
    });
  });
});
