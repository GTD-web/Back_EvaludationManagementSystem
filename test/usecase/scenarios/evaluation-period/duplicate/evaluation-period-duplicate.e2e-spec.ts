import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';

/**
 * 평가기간 복제 E2E 테스트
 *
 * 소스 평가기간의 설정을 타겟 평가기간으로 복사하는 시나리오를 검증합니다.
 */
describe('평가기간 복제 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let apiClient: EvaluationPeriodManagementApiClient;

  let sourcePeriodId: string;
  let targetPeriodId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    apiClient = new EvaluationPeriodManagementApiClient(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  afterEach(async () => {
    // 테스트 후 생성된 평가기간 정리
    if (sourcePeriodId) {
      try {
        await apiClient.deleteEvaluationPeriod(sourcePeriodId);
      } catch (error) {
        // 삭제 실패 시 무시 (이미 삭제되었을 수 있음)
      }
      sourcePeriodId = '';
    }

    if (targetPeriodId) {
      try {
        await apiClient.deleteEvaluationPeriod(targetPeriodId);
      } catch (error) {
        // 삭제 실패 시 무시
      }
      targetPeriodId = '';
    }
  });

  describe('평가기간 복제', () => {
    it('소스 평가기간의 설정을 타겟 평가기간으로 복사한다', async () => {
      // Given: 소스 평가기간 생성
      const sourceData = {
        name: '소스 평가기간',
        startDate: new Date('2025-01-01').toISOString(),
        peerEvaluationDeadline: new Date('2025-06-30').toISOString(),
        description: '소스 평가기간 설명',
        maxSelfEvaluationRate: 150,
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

      const sourcePeriod = await apiClient.createEvaluationPeriod(sourceData);
      sourcePeriodId = sourcePeriod.id;

      // 소스 평가기간의 수동 허용 설정 변경
      await apiClient.updateManualSettingPermissions(sourcePeriodId, {
        allowCriteriaManualSetting: true,
        allowSelfEvaluationManualSetting: false,
        allowFinalEvaluationManualSetting: true,
      });

      // Given: 타겟 평가기간 생성 (다른 날짜와 기본 설정)
      const targetData = {
        name: '타겟 평가기간',
        startDate: new Date('2026-01-01').toISOString(),
        peerEvaluationDeadline: new Date('2026-12-31').toISOString(),
        description: '타겟 평가기간 설명',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
          { grade: 'B', minRange: 60, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 59 },
        ],
      };

      const targetPeriod = await apiClient.createEvaluationPeriod(targetData);
      targetPeriodId = targetPeriod.id;

      // When: 소스 평가기간의 설정을 타겟 평가기간으로 복제
      const result = await apiClient.duplicateEvaluationPeriod(
        targetPeriodId,
        sourcePeriodId,
      );

      // Then: 복제된 결과 확인
      expect(result.id).toBe(targetPeriodId);

      // 1. 복사된 항목 검증
      expect(result.description).toBe(sourceData.description); // 설명 복사됨
      expect(result.maxSelfEvaluationRate).toBe(sourceData.maxSelfEvaluationRate); // 달성률 복사됨

      // 2. 등급 구간 복사 검증
      expect(result.gradeRanges).toHaveLength(sourceData.gradeRanges.length);
      sourceData.gradeRanges.forEach((sourceRange, index) => {
        expect(result.gradeRanges[index].grade).toBe(sourceRange.grade);
        expect(result.gradeRanges[index].minRange).toBe(sourceRange.minRange);
        expect(result.gradeRanges[index].maxRange).toBe(sourceRange.maxRange);
      });

      // 3. 수동 허용 설정 복사 검증
      expect(result.criteriaSettingEnabled).toBe(true);
      expect(result.selfEvaluationSettingEnabled).toBe(false);
      expect(result.finalEvaluationSettingEnabled).toBe(true);

      // 4. 유지되는 항목 검증 (복사되지 않음)
      expect(result.name).toBe(targetData.name); // 이름은 유지
      expect(new Date(result.startDate).toISOString()).toBe(
        new Date(targetData.startDate).toISOString(),
      ); // 시작일 유지
      expect(new Date(result.peerEvaluationDeadline).toISOString()).toBe(
        new Date(targetData.peerEvaluationDeadline).toISOString(),
      ); // 마감일 유지
      expect(result.status).toBe('waiting'); // 상태 유지
      expect(result.currentPhase).toBe('waiting'); // 단계 유지

      console.log('✅ 평가기간 복제 성공');
      console.log(`   - 소스: ${sourcePeriod.name} (${sourcePeriodId})`);
      console.log(`   - 타겟: ${result.name} (${targetPeriodId})`);
      console.log(`   - 복사된 설정: 설명, 달성률, 등급구간, 수동허용설정`);
      console.log(`   - 유지된 항목: 이름, 시작일, 마감일, 상태, 단계`);
    });

    it('등급 구간이 없는 소스에서도 복제할 수 있다', async () => {
      // Given: 등급 구간이 없는 소스 평가기간
      const sourceData = {
        name: '등급 구간 없는 소스',
        startDate: new Date('2025-02-01').toISOString(),
        peerEvaluationDeadline: new Date('2025-07-31').toISOString(),
        description: '등급 구간 없음',
        maxSelfEvaluationRate: 130,
      };

      const sourcePeriod = await apiClient.createEvaluationPeriod(sourceData);
      sourcePeriodId = sourcePeriod.id;

      // Given: 등급 구간이 있는 타겟 평가기간
      const targetData = {
        name: '등급 구간 있는 타겟',
        startDate: new Date('2027-01-01').toISOString(),
        peerEvaluationDeadline: new Date('2027-12-31').toISOString(),
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 90, maxRange: 100 },
          { grade: 'A', minRange: 70, maxRange: 89 },
          { grade: 'B', minRange: 0, maxRange: 69 },
        ],
      };

      const targetPeriod = await apiClient.createEvaluationPeriod(targetData);
      targetPeriodId = targetPeriod.id;

      // When: 복제 실행
      const result = await apiClient.duplicateEvaluationPeriod(
        targetPeriodId,
        sourcePeriodId,
      );

      // Then: 복제 성공 확인
      expect(result.description).toBe(sourceData.description);
      expect(result.maxSelfEvaluationRate).toBe(sourceData.maxSelfEvaluationRate);

      console.log('✅ 등급 구간 없는 소스에서도 복제 성공');
    });

    it('존재하지 않는 소스 평가기간으로 복제 시도 시 에러 반환', async () => {
      // Given: 타겟 평가기간만 생성
      const targetData = {
        name: '타겟만 존재',
        startDate: new Date('2028-01-01').toISOString(),
        peerEvaluationDeadline: new Date('2028-12-31').toISOString(),
      };

      const targetPeriod = await apiClient.createEvaluationPeriod(targetData);
      targetPeriodId = targetPeriod.id;

      // When & Then: 존재하지 않는 소스 ID로 복제 시도
      const fakeSourceId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${targetPeriodId}/duplicate`)
        .send({ sourceEvaluationPeriodId: fakeSourceId })
        .expect(500); // 소스를 찾을 수 없어 에러 발생

      console.log('✅ 존재하지 않는 소스로 복제 시도 시 에러 반환');
    });

    it('존재하지 않는 타겟 평가기간으로 복제 시도 시 에러 반환', async () => {
      // Given: 소스 평가기간만 생성
      const sourceData = {
        name: '소스만 존재',
        startDate: new Date('2025-03-01').toISOString(),
        peerEvaluationDeadline: new Date('2025-08-31').toISOString(),
      };

      const sourcePeriod = await apiClient.createEvaluationPeriod(sourceData);
      sourcePeriodId = sourcePeriod.id;

      // When & Then: 존재하지 않는 타겟 ID로 복제 시도
      const fakeTargetId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${fakeTargetId}/duplicate`)
        .send({ sourceEvaluationPeriodId: sourcePeriodId })
        .expect(500); // 타겟을 찾을 수 없어 에러 발생

      console.log('✅ 존재하지 않는 타겟으로 복제 시도 시 에러 반환');
    });
  });
});

