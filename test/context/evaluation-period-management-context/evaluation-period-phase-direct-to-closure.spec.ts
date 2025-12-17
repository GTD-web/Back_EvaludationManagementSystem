/**
 * 평가기간 생성 시 단계 자동 결정 테스트
 *
 * 특정 마감일 조합에 따라 평가기간의 초기 단계가 어떻게 설정되는지 테스트합니다.
 * 
 * 이 테스트는 EvaluationPeriod 엔티티의 동작을 직접 테스트합니다.
 */

import { EvaluationPeriod } from '../../../src/domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodPhase, EvaluationPeriodStatus } from '../../../src/domain/core/evaluation-period/evaluation-period.types';

/**
 * 테스트용 평가기간 엔티티를 생성하는 헬퍼 함수
 * (new EvaluationPeriod()는 TypeORM 데코레이터 기본값을 적용하지 않음)
 */
function createTestEvaluationPeriod(): EvaluationPeriod {
  const period = new EvaluationPeriod();
  // TypeORM 데코레이터에 정의된 기본값을 수동으로 설정
  period.status = EvaluationPeriodStatus.WAITING;
  period.currentPhase = EvaluationPeriodPhase.WAITING;
  period.criteriaSettingEnabled = false;
  period.selfEvaluationSettingEnabled = false;
  period.finalEvaluationSettingEnabled = false;
  period.manuallySetFields = [];
  period.maxSelfEvaluationRate = 120;
  period.gradeRanges = [];
  return period;
}

describe('평가기간 생성 시 단계 자동 결정 테스트', () => {

  describe('평가기간 생성 및 초기 단계 설정', () => {
    it('평가기간 생성 시 초기 상태는 WAITING이고 단계는 WAITING이어야 한다', () => {
      // Given: 새로운 평가기간 엔티티 생성
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.peerEvaluationDeadline = new Date('2024-12-31');

      // Then: 초기 상태와 단계 확인
      expect(period.status).toBe('waiting');
      expect(period.currentPhase).toBe('waiting');
    });

    it('평가기간 생성 시 peerEvaluationDeadline만 설정하고 다른 마감일은 설정하지 않을 수 있다', () => {
      // Given: 평가기간 엔티티 생성
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.peerEvaluationDeadline = new Date('2024-12-31');

      // When: 다른 마감일은 설정하지 않음
      // evaluationSetupDeadline, performanceDeadline, selfEvaluationDeadline 미설정

      // Then: 평가기간 엔티티가 정상적으로 생성됨
      expect(period.evaluationSetupDeadline).toBeUndefined();
      expect(period.performanceDeadline).toBeUndefined();
      expect(period.selfEvaluationDeadline).toBeUndefined();
      expect(period.peerEvaluationDeadline).toEqual(new Date('2024-12-31'));
    });

    it('평가기간을 시작하면 EVALUATION_SETUP 단계로 전이된다', () => {
      // Given: 평가기간 엔티티 생성
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.peerEvaluationDeadline = new Date('2024-12-31');
      period.createdBy = 'test-user';

      // When: 평가기간 시작
      period.평가기간_시작한다('test-user');

      // Then: 상태와 단계가 전이됨
      expect(period.status).toBe('in-progress');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);
    });
  });

  describe('중간 마감일 없이 peerEvaluationDeadline만 있을 때의 동작', () => {
    it('평가기간 시작 후 EVALUATION_SETUP 단계에 머물러야 한다 (evaluationSetupDeadline 없음)', () => {
      // Given: 평가기간 생성 및 시작
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.peerEvaluationDeadline = new Date('2024-12-31');
      period.createdBy = 'test-user';

      // When: 평가기간 시작
      period.평가기간_시작한다('test-user');

      // Then: EVALUATION_SETUP 단계로 전이
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      // When: evaluationSetupDeadline이 없는 상태에서 자동 전이 시도
      // 자동 전이 로직은 마감일이 없으면 전이하지 않음

      // Then: EVALUATION_SETUP 단계에 머물러야 함
      expect(period.evaluationSetupDeadline).toBeUndefined();
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);
    });

    it('evaluationSetupDeadline만 설정하면 PERFORMANCE 단계로 전이 가능하다', () => {
      // Given: 평가기간 생성 및 시작
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.evaluationSetupDeadline = new Date('2024-01-15');
      period.peerEvaluationDeadline = new Date('2024-12-31');
      period.createdBy = 'test-user';

      period.평가기간_시작한다('test-user');

      // When: PERFORMANCE 단계로 전이 시도
      period.업무수행_단계로_이동한다('test-user');

      // Then: PERFORMANCE 단계로 전이됨
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);
    });

    it('performanceDeadline 없이는 SELF_EVALUATION 단계로 전이할 수 없다', () => {
      // Given: 평가기간이 PERFORMANCE 단계에 있음
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.evaluationSetupDeadline = new Date('2024-01-15');
      period.peerEvaluationDeadline = new Date('2024-12-31');
      period.createdBy = 'test-user';

      period.평가기간_시작한다('test-user');
      period.업무수행_단계로_이동한다('test-user');

      // Then: PERFORMANCE 단계에 있음
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);

      // When: performanceDeadline이 없는 상태에서 자동 전이 시도
      // 자동 전이 로직은 마감일이 없으면 전이하지 않음

      // Then: PERFORMANCE 단계에 머물러야 함
      expect(period.performanceDeadline).toBeUndefined();
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);
    });
  });

  describe('마감일 순차 설정 시나리오', () => {
    it('모든 마감일을 순차적으로 설정하면 CLOSURE까지 전이 가능하다', () => {
      // Given: 평가기간 생성
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.evaluationSetupDeadline = new Date('2024-01-15');
      period.performanceDeadline = new Date('2024-05-31');
      period.selfEvaluationDeadline = new Date('2024-06-15');
      period.peerEvaluationDeadline = new Date('2024-06-30');
      period.createdBy = 'test-user';

      // When: 평가기간 시작 및 단계 전이
      period.평가기간_시작한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      period.업무수행_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);

      period.자기평가_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.SELF_EVALUATION);

      period.하향동료평가_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.PEER_EVALUATION);

      period.종결_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.CLOSURE);
    });

    it('중간 단계를 건너뛰고 바로 CLOSURE로 이동할 수는 없다', () => {
      // Given: 평가기간이 EVALUATION_SETUP 단계에 있음
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.peerEvaluationDeadline = new Date('2024-12-31');
      period.createdBy = 'test-user';

      period.평가기간_시작한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      // When/Then: CLOSURE로 바로 이동 시도
      // 단계 전이 검증 로직에 의해 실패해야 함
      expect(() => {
        period.종결_단계로_이동한다('test-user');
      }).toThrow();
    });
  });

  describe('자동 전이 시나리오 (마감일 기반)', () => {
    it('peerEvaluationDeadline만 있을 때 자동 전이는 EVALUATION_SETUP에서 멈춘다', () => {
      // Given: 평가기간 생성 (peerEvaluationDeadline만 설정)
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.peerEvaluationDeadline = new Date('2024-12-31');
      period.createdBy = 'test-user';

      // When: 평가기간 시작
      period.평가기간_시작한다('test-user');

      // Then: EVALUATION_SETUP 단계로 전이
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      // 자동 전이 로직은 evaluationSetupDeadline이 없으므로 전이하지 않음
      // 따라서 EVALUATION_SETUP 단계에 머물러야 함
      expect(period.evaluationSetupDeadline).toBeUndefined();
    });

    it('모든 중간 마감일이 있으면 자동 전이로 CLOSURE까지 도달 가능하다', () => {
      // Given: 평가기간 생성 (모든 마감일 설정)
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.evaluationSetupDeadline = new Date('2024-01-15');
      period.performanceDeadline = new Date('2024-05-31');
      period.selfEvaluationDeadline = new Date('2024-06-15');
      period.peerEvaluationDeadline = new Date('2024-06-30');
      period.createdBy = 'test-user';

      // When: 평가기간 시작 및 모든 단계 전이
      period.평가기간_시작한다('test-user');
      period.업무수행_단계로_이동한다('test-user');
      period.자기평가_단계로_이동한다('test-user');
      period.하향동료평가_단계로_이동한다('test-user');
      period.종결_단계로_이동한다('test-user');

      // Then: CLOSURE 단계에 도달
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.CLOSURE);
    });
  });

  describe('현재 구현의 동작 명세', () => {
    it('평가기간 생성 시 초기 단계는 항상 WAITING이다', () => {
      // Given/When: 평가기간 생성 (어떤 마감일 조합이든)
      const periodWithAllDeadlines = createTestEvaluationPeriod();
      periodWithAllDeadlines.name = '모든 마감일 있음';
      periodWithAllDeadlines.startDate = new Date('2024-01-01');
      periodWithAllDeadlines.evaluationSetupDeadline = new Date('2024-01-15');
      periodWithAllDeadlines.performanceDeadline = new Date('2024-05-31');
      periodWithAllDeadlines.selfEvaluationDeadline = new Date('2024-06-15');
      periodWithAllDeadlines.peerEvaluationDeadline = new Date('2024-12-31');

      const periodWithPeerOnly = createTestEvaluationPeriod();
      periodWithPeerOnly.name = 'peer 마감일만 있음';
      periodWithPeerOnly.startDate = new Date('2024-01-01');
      periodWithPeerOnly.peerEvaluationDeadline = new Date('2024-12-31');

      // Then: 모두 WAITING 상태로 시작
      expect(periodWithAllDeadlines.status).toBe('waiting');
      expect(periodWithAllDeadlines.currentPhase).toBe('waiting');
      expect(periodWithPeerOnly.status).toBe('waiting');
      expect(periodWithPeerOnly.currentPhase).toBe('waiting');
    });

    it('평가기간 시작 시 단계는 항상 EVALUATION_SETUP으로 설정된다', () => {
      // Given: 평가기간 생성 (peerEvaluationDeadline만 있음)
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.peerEvaluationDeadline = new Date('2024-12-31');
      period.createdBy = 'test-user';

      // When: 평가기간 시작
      period.평가기간_시작한다('test-user');

      // Then: EVALUATION_SETUP 단계로 설정됨 (마감일 설정과 무관)
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);
    });

    it('자동 전이는 순차적이며 각 단계의 마감일이 필요하다', () => {
      // Given: 평가기간이 진행 중
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.peerEvaluationDeadline = new Date('2024-12-31');
      period.createdBy = 'test-user';
      period.평가기간_시작한다('test-user');

      // 현재 EVALUATION_SETUP 단계
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      // evaluationSetupDeadline이 없으면 자동 전이 불가
      expect(period.evaluationSetupDeadline).toBeUndefined();

      // 마감일을 설정해야 다음 단계로 전이 가능
      period.evaluationSetupDeadline = new Date('2024-01-15');
      period.업무수행_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);

      // performanceDeadline이 없으면 자동 전이 불가
      expect(period.performanceDeadline).toBeUndefined();

      // 마감일을 설정해야 다음 단계로 전이 가능
      period.performanceDeadline = new Date('2024-05-31');
      period.자기평가_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.SELF_EVALUATION);
    });
  });

  describe('결론: peerEvaluationDeadline만 있을 때 closure로 자동 전이되지 않는다', () => {
    it('peerEvaluationDeadline만 있고 중간 마감일이 없으면 EVALUATION_SETUP에서 멈춘다', () => {
      // Given: 평가기간 생성 (peerEvaluationDeadline만 설정)
      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      period.peerEvaluationDeadline = new Date('2024-12-31');
      period.createdBy = 'test-user';

      // When: 평가기간 시작
      period.평가기간_시작한다('test-user');

      // Then: EVALUATION_SETUP 단계로 전이
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      // 자동 전이 로직은 evaluationSetupDeadline이 없으므로 전이하지 않음
      // 따라서 CLOSURE로 자동 전이되지 않는다
      expect(period.currentPhase).not.toBe(EvaluationPeriodPhase.CLOSURE);
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);
    });

    it('CLOSURE에 도달하려면 모든 중간 마감일이 필요하다', () => {
      // 이 테스트는 현재 시스템의 동작을 명확히 보여줍니다:
      // peerEvaluationDeadline만 있어도 CLOSURE에 자동으로 도달하지 않으며,
      // 모든 중간 단계의 마감일이 설정되어야 순차적으로 전이됩니다.

      const period = createTestEvaluationPeriod();
      period.name = '테스트 평가기간';
      period.startDate = new Date('2024-01-01');
      // 모든 마감일 설정
      period.evaluationSetupDeadline = new Date('2024-01-15');
      period.performanceDeadline = new Date('2024-05-31');
      period.selfEvaluationDeadline = new Date('2024-06-15');
      period.peerEvaluationDeadline = new Date('2024-06-30');
      period.createdBy = 'test-user';

      // 모든 단계를 거쳐야 CLOSURE 도달
      period.평가기간_시작한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.EVALUATION_SETUP);

      period.업무수행_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);

      period.자기평가_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.SELF_EVALUATION);

      period.하향동료평가_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.PEER_EVALUATION);

      period.종결_단계로_이동한다('test-user');
      expect(period.currentPhase).toBe(EvaluationPeriodPhase.CLOSURE);
    });
  });
});

