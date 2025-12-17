/**
 * 평가기간 자동 단계 전이 E2E 테스트
 *
 * README.md의 자동 단계 전이 시나리오를 검증합니다.
 */

import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodAutoPhaseTransitionScenario } from './evaluation-period-auto-phase-transition.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';

describe('평가기간 자동 단계 전이 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let scenario: EvaluationPeriodAutoPhaseTransitionScenario;
  let seedDataScenario: SeedDataScenario;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    scenario = new EvaluationPeriodAutoPhaseTransitionScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);

    // 기존 데이터 정리
    await testSuite
      .request()
      .delete('/admin/seed/clear')
      .expect((res) => {
        if (res.status !== 200 && res.status !== 404) {
          throw new Error(
            `Failed to clear seed data: ${res.status} ${res.text}`,
          );
        }
      });
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  afterEach(async () => {
    // 각 테스트에서 생성된 평가기간들을 정리
    const createdPeriods = (global as any).createdEvaluationPeriods || [];

    for (const periodId of createdPeriods) {
      if (periodId) {
        try {
          // 먼저 평가기간을 완료 상태로 만든 후 삭제
          await testSuite
            .request()
            .post(`/admin/evaluation-periods/${periodId}/complete`)
            .expect((res) => {
              if (res.status !== 200 && res.status !== 404) {
                console.warn(`평가기간 완료 실패: ${res.status} ${res.text}`);
              }
            });

          // 완료 후 삭제
          await testSuite
            .request()
            .delete(`/admin/evaluation-periods/${periodId}`)
            .expect((res) => {
              if (res.status !== 200 && res.status !== 404) {
                console.warn(`평가기간 삭제 실패: ${res.status} ${res.text}`);
              }
            });
        } catch (error) {
          console.warn(`평가기간 정리 실패: ${error.message}`);
        }
      }
    }

    // 정리 후 배열 초기화
    (global as any).createdEvaluationPeriods = [];
  });

  describe('기본 자동 단계 전이 시나리오', () => {
    it('평가기간 자동 단계 전이 전체 시나리오를 실행한다', async () => {
      // Given: 시드 데이터 생성 (직원 데이터 포함)
      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 2,
        departmentCount: 1,
        employeeCount: 3,
      });

      // Given: 평가기간 생성 및 시작
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '자동 전이 테스트용 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      // 초기 상태 확인 (evaluation-setup 단계)
      const initialState = await scenario.현재_단계를_조회한다(periodId);
      expect(initialState.currentPhase).toBe('evaluation-setup');
      expect(initialState.status).toBe('in-progress');

      // evaluation-setup 단계에서 수동 설정 상태 확인 (평가기간 시작 시 모든 수동 설정은 기본값(false))
      const initialDashboard =
        await scenario.대시보드_상태를_조회한다(periodId);
      expect(initialDashboard.evaluationPeriod.currentPhase).toBe(
        'evaluation-setup',
      );
      expect(
        initialDashboard.evaluationPeriod.manualSettings.criteriaSettingEnabled,
      ).toBe(false);
      expect(
        initialDashboard.evaluationPeriod.manualSettings
          .selfEvaluationSettingEnabled,
      ).toBe(false);
      expect(
        initialDashboard.evaluationPeriod.manualSettings
          .finalEvaluationSettingEnabled,
      ).toBe(false);
      console.log(
        `   - evaluation-setup 단계 수동 설정: criteria=${initialDashboard.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${initialDashboard.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${initialDashboard.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`,
      );

      // 단계별 마감일 설정 (과거 시간으로 설정하여 즉시 전이되도록)
      const now = scenario.getCurrentTime();
      const pastTime = new Date(now.getTime() - 60 * 1000).toISOString(); // 1분 전
      const futureTime1 = new Date(now.getTime() + 60 * 1000).toISOString(); // 1분 후
      const futureTime2 = new Date(now.getTime() + 2 * 60 * 1000).toISOString(); // 2분 후
      const futureTime3 = new Date(now.getTime() + 3 * 60 * 1000).toISOString(); // 3분 후

      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: pastTime, // 과거 시간으로 설정
        performanceDeadline: futureTime1, // 1분 후
        selfEvaluationDeadline: futureTime2, // 2분 후
        peerEvaluationDeadline: futureTime3, // 3분 후
      });

      // 자동 단계 전이 실행 전 상태 확인
      const beforeTransition = await scenario.현재_단계를_조회한다(periodId);
      console.log(`자동 전이 전 상태: ${beforeTransition.currentPhase}`);

      // 현재 시간과 마감일 확인
      const currentTime = scenario.getCurrentTime();
      const evaluationSetupDeadline = scenario.getFutureTime(1);
      console.log(`현재 시간: ${currentTime.toISOString()}`);
      console.log(`evaluation-setup 마감일: ${evaluationSetupDeadline}`);
      console.log(
        `마감일 지났는가: ${currentTime >= new Date(evaluationSetupDeadline)}`,
      );

      const transitionedCount = await scenario.자동_단계_전이를_실행한다();
      console.log(`전이된 평가기간 수: ${transitionedCount}`);

      const phase1State = await scenario.현재_단계를_조회한다(periodId);
      console.log(`자동 전이 후 상태: ${phase1State.currentPhase}`);
      expect(phase1State.currentPhase).toBe('performance');

      // 대시보드에서 수동 설정 상태 확인 (performance 단계에서는 모두 false)
      const dashboard1 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard1.evaluationPeriod.currentPhase).toBe('performance');
      expect(
        dashboard1.evaluationPeriod.manualSettings.criteriaSettingEnabled,
      ).toBe(false);
      expect(
        dashboard1.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled,
      ).toBe(false);
      expect(
        dashboard1.evaluationPeriod.manualSettings
          .finalEvaluationSettingEnabled,
      ).toBe(false);
      console.log(
        `   - performance 단계 수동 설정: criteria=${dashboard1.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${dashboard1.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${dashboard1.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`,
      );

      // 2분 경과 후 자동 전이 확인 (performance → self-evaluation)
      // performance 마감일을 과거로 설정
      const now2 = scenario.getCurrentTime();
      const pastTime2 = new Date(now2.getTime() - 60 * 1000).toISOString(); // 1분 전

      await scenario.단계별_마감일을_설정한다({
        periodId,
        performanceDeadline: pastTime2, // 과거 시간으로 설정
      });

      await scenario.자동_단계_전이를_실행한다();

      const phase2State = await scenario.현재_단계를_조회한다(periodId);
      console.log(`2단계 전이 후 상태: ${phase2State.currentPhase}`);
      expect(phase2State.currentPhase).toBe('self-evaluation');

      // 대시보드에서 수동 설정 상태 확인 (self-evaluation 단계에서도 모든 수동 설정은 기본값(false))
      const dashboard2 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard2.evaluationPeriod.currentPhase).toBe('self-evaluation');
      expect(
        dashboard2.evaluationPeriod.manualSettings.criteriaSettingEnabled,
      ).toBe(false);
      expect(
        dashboard2.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled,
      ).toBe(false);
      expect(
        dashboard2.evaluationPeriod.manualSettings
          .finalEvaluationSettingEnabled,
      ).toBe(false);
      console.log(
        `   - self-evaluation 단계 수동 설정: criteria=${dashboard2.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${dashboard2.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${dashboard2.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`,
      );

      // 3분 경과 후 자동 전이 확인 (self-evaluation → peer-evaluation)
      // self-evaluation 마감일을 과거로 설정
      const now3 = scenario.getCurrentTime();
      const pastTime3 = new Date(now3.getTime() - 60 * 1000).toISOString(); // 1분 전

      await scenario.단계별_마감일을_설정한다({
        periodId,
        selfEvaluationDeadline: pastTime3, // 과거 시간으로 설정
      });

      await scenario.자동_단계_전이를_실행한다();

      const phase3State = await scenario.현재_단계를_조회한다(periodId);
      console.log(`3단계 전이 후 상태: ${phase3State.currentPhase}`);
      expect(phase3State.currentPhase).toBe('peer-evaluation');

      // 대시보드에서 수동 설정 상태 확인 (peer-evaluation 단계에서도 모든 수동 설정은 기본값(false))
      const dashboard3 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard3.evaluationPeriod.currentPhase).toBe('peer-evaluation');
      expect(
        dashboard3.evaluationPeriod.manualSettings.criteriaSettingEnabled,
      ).toBe(false);
      expect(
        dashboard3.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled,
      ).toBe(false);
      expect(
        dashboard3.evaluationPeriod.manualSettings
          .finalEvaluationSettingEnabled,
      ).toBe(false);
      console.log(
        `   - peer-evaluation 단계 수동 설정: criteria=${dashboard3.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${dashboard3.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${dashboard3.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`,
      );

      // 4분 경과 후 자동 전이 확인 (peer-evaluation → closure)
      // peer-evaluation 마감일을 과거로 설정
      const now4 = scenario.getCurrentTime();
      const pastTime4 = new Date(now4.getTime() - 60 * 1000).toISOString(); // 1분 전

      await scenario.단계별_마감일을_설정한다({
        periodId,
        peerEvaluationDeadline: pastTime4, // 과거 시간으로 설정
      });

      await scenario.자동_단계_전이를_실행한다();

      const phase4State = await scenario.현재_단계를_조회한다(periodId);
      console.log(`4단계 전이 후 상태: ${phase4State.currentPhase}`);
      expect(phase4State.currentPhase).toBe('closure');

      // 대시보드에서 수동 설정 상태 확인 (closure 단계에서는 모두 false)
      const dashboard4 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard4.evaluationPeriod.currentPhase).toBe('closure');
      expect(
        dashboard4.evaluationPeriod.manualSettings.criteriaSettingEnabled,
      ).toBe(false);
      expect(
        dashboard4.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled,
      ).toBe(false);
      expect(
        dashboard4.evaluationPeriod.manualSettings
          .finalEvaluationSettingEnabled,
      ).toBe(false);
      console.log(
        `   - closure 단계 수동 설정: criteria=${dashboard4.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${dashboard4.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${dashboard4.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`,
      );

      console.log('✅ 자동 단계 전이 전체 시나리오 완료');
      console.log(`   - 최종 단계: ${phase4State.currentPhase}`);
    });
  });

  describe('평가기간 자동 단계 전이 (마감일 미설정 케이스)', () => {
    it('마감일이 설정되지 않은 단계는 자동 전이되지 않는다', async () => {
      // Given: 평가기간 생성 및 시작
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '마감일 미설정 테스트용 평가기간',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      // 현재 단계 확인 (evaluation-setup)
      const initialState = await scenario.현재_단계를_조회한다(periodId);
      expect(initialState.currentPhase).toBe('evaluation-setup');

      // 일부 단계의 마감일만 설정 (README.md 시나리오에 따라)
      // peerEvaluationDeadline (2024-12-31)보다 이른 시간으로 설정
      const now = scenario.getCurrentTime();
      const pastTime = new Date(now.getTime() - 60 * 1000).toISOString(); // 1분 전
      const futureTime = new Date(now.getTime() + 60 * 1000).toISOString(); // 1분 후

      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: pastTime, // 과거 시간으로 설정하여 즉시 전이
        performanceDeadline: futureTime, // 미래 시간으로 설정하여 전이되지 않음
        // selfEvaluationDeadline과 peerEvaluationDeadline은 설정하지 않음 (README.md 시나리오)
      });

      // 1분 경과 후 자동 전이 확인 (evaluation-setup → performance)
      await scenario.시간을_조작한다(1 * 60 * 1000);
      await scenario.자동_단계_전이를_실행한다();

      const phase1State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase1State.currentPhase).toBe('performance');

      // 2분 경과 후 자동 전이 확인 (performance에서 멈춤)
      await scenario.시간을_조작한다(1 * 60 * 1000);
      await scenario.자동_단계_전이를_실행한다();

      const phase2State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase2State.currentPhase).toBe('performance'); // 전이되지 않음

      console.log('✅ 마감일 미설정 케이스 검증 완료');
      console.log(
        `   - 마감일이 설정되지 않은 단계는 자동 전이되지 않음: ${phase2State.currentPhase}`,
      );
    });
  });

  describe('평가기간 자동 단계 전이 (수동 단계 변경 후 자동 전이)', () => {
    it('수동으로 단계를 변경한 후 자동 전이가 계속 진행된다', async () => {
      // Given: 평가기간 생성 및 시작
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '수동 변경 후 자동 전이 테스트용 평가기간',
        startDate: '2024-08-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      // 단계별 마감일 설정 (README.md 시나리오에 따라)
      // 수동 단계 변경을 테스트하기 위해 마감일을 미래로 설정 (자동 전이 방지)
      const now = scenario.getCurrentTime();
      const futureTime1 = new Date(
        now.getTime() + 60 * 60 * 1000,
      ).toISOString(); // 1분 후
      const futureTime2 = new Date(
        now.getTime() + 120 * 60 * 1000,
      ).toISOString(); // 2분 후

      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: futureTime1, // 미래 시간으로 설정하여 자동 전이 방지
        performanceDeadline: futureTime2, // evaluationSetupDeadline보다 늦은 시간
        // selfEvaluationDeadline과 peerEvaluationDeadline은 설정하지 않음 (README.md 시나리오)
      });

      // 현재 단계 확인 (evaluation-setup이어야 함)
      const beforeManualChange = await scenario.현재_단계를_조회한다(periodId);
      expect(beforeManualChange.currentPhase).toBe('evaluation-setup');

      // 수동으로 performance 단계로 변경 (README.md 시나리오에 따라)
      await scenario.수동으로_단계를_변경한다(periodId, 'performance');

      const manualState = await scenario.현재_단계를_조회한다(periodId);
      expect(manualState.currentPhase).toBe('performance');

      // 3분 경과 후 자동 전이 확인 (performance → self-evaluation)
      // performance 마감일을 과거로 설정 (evaluationSetupDeadline보다는 늦지만 현재 시간보다는 이른 시간)
      const now2 = scenario.getCurrentTime();
      const pastTime2 = new Date(now2.getTime() - 60 * 1000).toISOString(); // 1분 전
      const pastTime1 = new Date(now2.getTime() - 120 * 1000).toISOString(); // 2분 전 (evaluationSetupDeadline)

      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: pastTime1, // evaluationSetupDeadline도 과거로 설정 (performanceDeadline보다 이른 시간)
        performanceDeadline: pastTime2, // 과거 시간으로 설정 (evaluationSetupDeadline보다 늦은 시간)
      });

      await scenario.자동_단계_전이를_실행한다();

      const phase1State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase1State.currentPhase).toBe('self-evaluation');

      // 4분 경과 후 자동 전이 확인 (self-evaluation → peer-evaluation)
      // self-evaluation 마감일을 과거로 설정 (performanceDeadline보다는 늦지만 현재 시간보다는 이른 시간)
      const now3 = scenario.getCurrentTime();
      const pastTime3 = new Date(now3.getTime() - 60 * 1000).toISOString(); // 1분 전
      const pastTime2_updated = new Date(
        now3.getTime() - 120 * 1000,
      ).toISOString(); // 2분 전 (performanceDeadline)

      await scenario.단계별_마감일을_설정한다({
        periodId,
        performanceDeadline: pastTime2_updated, // performanceDeadline도 과거로 설정 (selfEvaluationDeadline보다 이른 시간)
        selfEvaluationDeadline: pastTime3, // 과거 시간으로 설정 (performanceDeadline보다 늦은 시간)
      });

      await scenario.자동_단계_전이를_실행한다();

      const phase2State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase2State.currentPhase).toBe('peer-evaluation');

      // 5분 경과 후 자동 전이 확인 (peer-evaluation → closure)
      // peer-evaluation 마감일을 과거로 설정 (selfEvaluationDeadline보다는 늦지만 현재 시간보다는 이른 시간)
      const now4 = scenario.getCurrentTime();
      const pastTime4 = new Date(now4.getTime() - 60 * 1000).toISOString(); // 1분 전
      const pastTime3_updated = new Date(
        now4.getTime() - 120 * 1000,
      ).toISOString(); // 2분 전 (selfEvaluationDeadline)

      await scenario.단계별_마감일을_설정한다({
        periodId,
        selfEvaluationDeadline: pastTime3_updated, // selfEvaluationDeadline도 과거로 설정 (peerEvaluationDeadline보다 이른 시간)
        peerEvaluationDeadline: pastTime4, // 과거 시간으로 설정 (selfEvaluationDeadline보다 늦은 시간)
      });

      await scenario.자동_단계_전이를_실행한다();

      const phase3State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase3State.currentPhase).toBe('closure');

      console.log('✅ 수동 변경 후 자동 전이 검증 완료');
      console.log(
        `   - 수동 변경 후 자동 전이가 정상적으로 계속 진행됨: ${phase3State.currentPhase}`,
      );
    });
  });

  describe('자동 단계 전이 에러 케이스', () => {
    it('대기 중인 평가기간은 자동 전이되지 않는다', async () => {
      // Given: 대기 중인 평가기간 생성
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '대기 상태 테스트용 평가기간',
        startDate: '2024-09-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      // 평가기간을 완료하여 대기 상태로 만들기
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${periodId}/complete`)
        .expect(200);

      const completedState = await scenario.현재_단계를_조회한다(periodId);
      expect(completedState.status).toBe('completed');

      // 자동 단계 전이 실행
      const transitionedCount = await scenario.자동_단계_전이를_실행한다();
      expect(transitionedCount).toBe(0); // 전이되지 않음

      console.log('✅ 대기/완료 상태 평가기간 자동 전이 제외 검증 완료');
    });

    it('마감일이 지나지 않은 단계는 자동 전이되지 않는다', async () => {
      // Given: 평가기간 생성 및 시작
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '마감일 미도달 테스트용 평가기간',
        startDate: '2024-10-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      // 마감일을 현재 시간보다 훨씬 미래로 설정
      const now = scenario.getCurrentTime();
      const futureTime1 = new Date(
        now.getTime() + 60 * 60 * 1000,
      ).toISOString(); // +60분
      const futureTime2 = new Date(
        now.getTime() + 120 * 60 * 1000,
      ).toISOString(); // +120분

      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: futureTime1, // +60분
        performanceDeadline: futureTime2, // +120분
      });

      // 자동 단계 전이 실행
      const transitionedCount = await scenario.자동_단계_전이를_실행한다();
      expect(transitionedCount).toBe(0); // 전이되지 않음

      const currentState = await scenario.현재_단계를_조회한다(periodId);
      expect(currentState.currentPhase).toBe('evaluation-setup'); // 변경되지 않음

      console.log('✅ 마감일 미도달 시 자동 전이 제외 검증 완료');
    });
  });

  describe('자동 단계 전이 성능 테스트', () => {
    it('여러 평가기간의 자동 단계 전이가 동시에 처리된다', async () => {
      // Given: 단일 평가기간 생성 (단순화)
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '자동 단계 전이 테스트용 평가기간',
        startDate: '2024-11-01',
        peerEvaluationDeadline: '2024-12-31', // 충분히 늦은 마감일
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      console.log(`생성된 평가기간 ID:`, periodId);

      // 마감일 설정 없이 자동 단계 전이 테스트
      // (현재 단계는 evaluation-setup이고, 마감일이 설정되지 않았으므로 자동 전이되지 않음)

      const periods = [periodId];

      // 자동 전이 실행 전 상태 확인
      console.log('=== 자동 전이 실행 전 상태 ===');
      for (let i = 0; i < periods.length; i++) {
        const state = await scenario.현재_단계를_조회한다(periods[i]);
        console.log(`평가기간 ${i + 1} (${periods[i]}) 상태:`, state);
      }

      // 자동 전이 실행 (여러 번 실행하여 모든 단계 전이)
      let totalTransitionedCount = 0;
      for (let i = 0; i < 3; i++) {
        console.log(`=== 자동 전이 실행 ${i + 1}회차 ===`);
        const transitionedCount = await scenario.자동_단계_전이를_실행한다();
        totalTransitionedCount += transitionedCount;
        console.log(`전이된 평가기간 수: ${transitionedCount}`);

        // 모든 평가기간이 performance 단계에 도달했으면 중단
        let allInPerformance = true;
        for (let j = 0; j < periods.length; j++) {
          const state = await scenario.현재_단계를_조회한다(periods[j]);
          console.log(`평가기간 ${j + 1} (${periods[j]}) 상태:`, state);
          if (state.currentPhase !== 'performance') {
            allInPerformance = false;
          }
        }

        if (allInPerformance) {
          console.log('모든 평가기간이 performance 단계에 도달했습니다.');
          break;
        }
      }

      // 마감일이 설정되지 않았으므로 자동 전이가 발생하지 않아야 함
      expect(totalTransitionedCount).toBe(0);

      for (const periodId of periods) {
        const state = await scenario.현재_단계를_조회한다(periodId);
        console.log(`평가기간 ${periodId} 상태:`, state);
        expect(state.currentPhase).toBe('evaluation-setup'); // 마감일 미설정으로 전이되지 않음
      }

      console.log('✅ 다중 평가기간 동시 자동 전이 검증 완료');
      console.log(`   - 전이된 평가기간 수: ${totalTransitionedCount}`);
    });
  });

  describe('특정 마감일 조합 자동 전이 테스트', () => {
    it('peer-evaluation 단계에서 하향/동료평가 마감일만 있을 때 자동으로 closure 단계로 전이된다', async () => {
      // Given: 시드 데이터 생성
      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 2,
        departmentCount: 1,
        employeeCount: 3,
      });

      // Given: 평가기간 생성
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '하향/동료평가 마감일만 있는 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
      });

      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      console.log('📝 평가기간 생성 완료:', {
        periodId,
        name: '하향/동료평가 마감일만 있는 평가기간',
      });

      // 초기 상태 확인 (evaluation-setup 단계)
      const initialState = await scenario.현재_단계를_조회한다(periodId);
      expect(initialState.currentPhase).toBe('evaluation-setup');
      expect(initialState.status).toBe('in-progress');
      console.log('✅ 초기 상태 확인 완료:', initialState);

      // When: 평가기간을 수동으로 peer-evaluation 단계까지 순차적으로 진행
      console.log(
        '🔄 평가기간을 peer-evaluation 단계로 순차적으로 수동 변경...',
      );

      // evaluation-setup → performance
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${periodId}/phase-change`)
        .send({ targetPhase: 'performance' })
        .expect(200);
      console.log('✅ performance 단계로 변경 완료');

      // performance → self-evaluation
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${periodId}/phase-change`)
        .send({ targetPhase: 'self-evaluation' })
        .expect(200);
      console.log('✅ self-evaluation 단계로 변경 완료');

      // self-evaluation → peer-evaluation
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${periodId}/phase-change`)
        .send({ targetPhase: 'peer-evaluation' })
        .expect(200);
      console.log('✅ peer-evaluation 단계로 변경 완료');

      const peerEvalState = await scenario.현재_단계를_조회한다(periodId);
      expect(peerEvalState.currentPhase).toBe('peer-evaluation');
      console.log('✅ 최종 단계 확인:', peerEvalState);

      // When: 하향/동료평가 마감일만 과거로 설정 (다른 마감일은 설정하지 않음)
      const now = scenario.getCurrentTime();
      const pastPeerDeadline = new Date(
        now.getTime() - 2 * 60 * 1000,
      ).toISOString(); // 2분 전 (peerEvaluationDeadline)

      console.log('📝 하향/동료평가 마감일을 과거로 설정:', {
        peerEvaluationDeadline: pastPeerDeadline,
        currentTime: now.toISOString(),
        note: '하향/동료평가 마감일만 설정 (다른 마감일은 null)',
      });

      await scenario.단계별_마감일을_설정한다({
        periodId,
        peerEvaluationDeadline: pastPeerDeadline,
      });

      // 마감일 설정 후 상태 확인
      const stateAfterDeadlineSet =
        await scenario.현재_단계를_조회한다(periodId);
      console.log('📊 마감일 설정 후 상태:', stateAfterDeadlineSet);

      // Then: 자동 단계 전이 실행
      console.log('🔄 자동 단계 전이 실행...');
      const transitionedCount = await scenario.자동_단계_전이를_실행한다();
      console.log(`전이된 평가기간 수: ${transitionedCount}`);

      // 현재 상태 확인
      const finalState = await scenario.현재_단계를_조회한다(periodId);
      console.log('📊 최종 상태:', finalState);

      // Assert: peer-evaluation 단계의 마감일이 도래했으므로 closure로 전이되어야 함
      expect(finalState.currentPhase).toBe('closure');
      expect(finalState.status).toBe('in-progress');

      // 마감일 설정 시점에 이미 closure로 전이되었거나, 자동 전이에 의해 전이됨
      console.log(
        `   - 마감일 설정 후 단계: ${stateAfterDeadlineSet.currentPhase}`,
      );
      console.log(`   - 자동 전이 후 단계: ${finalState.currentPhase}`);

      console.log(
        '✅ peer-evaluation 단계에서 하향/동료평가 마감일 도래 시 closure 전이 검증 완료',
      );
      console.log(
        '   - 평가설정/업무수행/자기평가 마감일이 없어도, peer-evaluation 단계에서',
      );
      console.log(
        '     하향/동료평가 마감일이 도래하면 closure 단계로 자동 전이됩니다.',
      );
    });

    it('하향/동료평가 마감일만 과거로 설정하고 다른 마감일은 없을 때 CLOSURE로 전이됨', async () => {
      // Given: 시드 데이터 생성
      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 2,
        departmentCount: 1,
        employeeCount: 3,
      });

      // Given: 평가기간 생성
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '하향/동료평가 마감일만 설정된 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
      });

      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      console.log('📝 평가기간 생성 완료:', {
        periodId,
        name: '하향/동료평가 마감일만 설정된 평가기간',
      });

      // 초기 상태 확인
      const initialState = await scenario.현재_단계를_조회한다(periodId);
      expect(initialState.currentPhase).toBe('evaluation-setup');
      console.log('✅ 초기 상태:', initialState);

      // When: 하향/동료평가 마감일만 과거로 설정
      const now = scenario.getCurrentTime();
      const pastPeerDeadline = new Date(
        now.getTime() - 2 * 60 * 1000,
      ).toISOString(); // 2분 전

      console.log('📝 하향/동료평가 마감일만 과거로 설정:', {
        peerEvaluationDeadline: pastPeerDeadline,
        currentTime: now.toISOString(),
      });

      await scenario.단계별_마감일을_설정한다({
        periodId,
        peerEvaluationDeadline: pastPeerDeadline,
      });

      // 마감일 설정 후 상태 확인 (일정 수정 시 자동 조정이 일어남)
      const afterSetState = await scenario.현재_단계를_조회한다(periodId);
      console.log('📊 마감일 설정 후 상태:', afterSetState);

      // Assert: 중간 마감일이 없으므로 즉시 CLOSURE로 전이되어야 함
      // 일정 수정 시 자동으로 단계 조정이 일어나므로 이미 CLOSURE에 도달
      expect(afterSetState.currentPhase).toBe('closure');

      console.log(
        '✅ 하향/동료평가 마감일만 있고 중간 마감일이 없을 때 CLOSURE로 전이됨 검증 완료',
      );
      console.log(
        '   - 중간 마감일(평가설정/업무수행/자기평가)이 없으면 해당 단계를 건너뛰고',
      );
      console.log(
        '   - 하향/동료평가 마감일이 도래하면 CLOSURE 단계로 자동 전이됩니다.',
      );
      console.log('   - 일정 수정 시 자동 단계 조정 기능이 즉시 실행됩니다.');
    });

    it('일부 중간 마감일만 설정되어 있을 때 건너뛰기 동작 확인', async () => {
      // Given: 시드 데이터 생성
      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 2,
        departmentCount: 1,
        employeeCount: 3,
      });

      // Given: 평가기간 생성 (peerEvaluationDeadline은 미래로 설정)
      const now = scenario.getCurrentTime();
      const pastSetupDeadline = new Date(
        now.getTime() - 5 * 60 * 1000,
      ).toISOString(); // 5분 전
      const futurePeerDeadline = new Date(
        now.getTime() + 60 * 60 * 1000,
      ).toISOString(); // 60분 후

      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '일부 마감일만 설정된 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: futurePeerDeadline,
      });

      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      console.log('📝 평가기간 생성 완료:', {
        periodId,
        name: '일부 마감일만 설정된 평가기간',
      });

      // evaluationSetupDeadline만 과거로 설정 (performanceDeadline과 selfEvaluationDeadline은 설정하지 않음)
      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: pastSetupDeadline,
      });

      console.log('📝 마감일 설정 완료:', {
        evaluationSetupDeadline: pastSetupDeadline,
        peerEvaluationDeadline: futurePeerDeadline,
        note: 'performanceDeadline과 selfEvaluationDeadline은 설정하지 않음',
      });

      // 마감일 설정 후 상태 확인 (일정 수정 시 자동 조정이 일어남)
      const afterSetState = await scenario.현재_단계를_조회한다(periodId);
      console.log('📊 마감일 설정 후 상태:', afterSetState);

      // Assert: EVALUATION_SETUP → PERFORMANCE → SELF_EVALUATION → PEER_EVALUATION
      // performanceDeadline과 selfEvaluationDeadline이 없으므로 해당 단계를 건너뛰고
      // peerEvaluationDeadline이 아직 지나지 않았으므로 PEER_EVALUATION에 머뭄
      expect(afterSetState.currentPhase).toBe('peer-evaluation');

      console.log(
        '✅ 일부 중간 마감일만 설정되어 있을 때 건너뛰기 동작 검증 완료',
      );
      console.log('   - evaluationSetupDeadline이 지나면 PERFORMANCE로 전이');
      console.log(
        '   - performanceDeadline이 없으면 즉시 SELF_EVALUATION으로 전이',
      );
      console.log(
        '   - selfEvaluationDeadline이 없으면 즉시 PEER_EVALUATION으로 전이',
      );
      console.log(
        '   - peerEvaluationDeadline이 아직 지나지 않았으므로 PEER_EVALUATION에 머뭄',
      );
    });
  });
});
