import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';

/**
 * 평가기간 등급 구간 (gradeRanges) E2E 테스트
 *
 * 시나리오:
 * - 평가기간 생성 시 gradeRanges 값 할당 검증 (POST /admin/evaluation-periods)
 * - 평가기간 등급 구간 수정 검증 (PATCH /admin/evaluation-periods/{id}/grade-ranges)
 * - 상세 조회를 통한 등급 구간 값 검증 (GET /admin/evaluation-periods/{id})
 */
describe('평가기간 등급 구간 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let apiClient: EvaluationPeriodManagementApiClient;

  const createdPeriodIds: string[] = [];

  // 날짜 범위 중복을 피하기 위한 연도 오프셋 카운터
  let yearOffset = 0;

  /**
   * 고유한 날짜 범위를 생성하는 헬퍼 함수
   * 각 테스트마다 서로 다른 연도를 사용하여 날짜 범위 중복 방지
   */
  const getUniqueDateRange = () => {
    const baseYear = 2030 + yearOffset++;
    const startDate = new Date(`${baseYear}-01-01`);
    const endDate = new Date(`${baseYear}-06-30`);
    return { startDate, endDate };
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    apiClient = new EvaluationPeriodManagementApiClient(testSuite);

    // 시드 데이터 생성
    await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 1,
      wbsPerProject: 1,
      departmentCount: 1,
      employeeCount: 2,
    });

    console.log('📝 테스트 환경 초기화 완료');
  });

  afterAll(async () => {
    // 생성된 평가기간 삭제
    for (const periodId of createdPeriodIds) {
      try {
        await apiClient.deleteEvaluationPeriod(periodId);
      } catch (error) {
        console.log(`평가기간 삭제 중 오류 (${periodId}):`, error.message);
      }
    }

    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('평가기간 생성 시 gradeRanges 값 할당 검증', () => {
    it('기본 5단계 등급 구간으로 평가기간 생성 시 모든 값이 정확하게 할당되어야 한다', async () => {
      // Given
      const { startDate, endDate } = getUniqueDateRange();

      const gradeRanges = [
        { grade: 'S', minRange: 95, maxRange: 100 },
        { grade: 'A', minRange: 90, maxRange: 94 },
        { grade: 'B', minRange: 80, maxRange: 89 },
        { grade: 'C', minRange: 70, maxRange: 79 },
        { grade: 'D', minRange: 0, maxRange: 69 },
      ];

      const createData = {
        name: '5단계 등급 구간 테스트',
        startDate: startDate.toISOString(),
        peerEvaluationDeadline: endDate.toISOString(),
        description: 'E2E 테스트 - 5단계 등급 구간',
        maxSelfEvaluationRate: 120,
        gradeRanges,
      };

      // When
      const result = await apiClient.createEvaluationPeriod(createData);
      createdPeriodIds.push(result.id);

      // Then - 생성 응답 검증
      expect(result.id).toBeDefined();
      expect(result.gradeRanges).toHaveLength(5);

      // 각 등급 구간의 값 상세 검증
      gradeRanges.forEach((input) => {
        const resultGrade = result.gradeRanges.find(
          (g: any) => g.grade === input.grade,
        );
        expect(resultGrade).toBeDefined();
        expect(resultGrade.minRange).toBe(input.minRange);
        expect(resultGrade.maxRange).toBe(input.maxRange);
      });

      console.log('✅ 5단계 등급 구간 생성 검증 완료');
    });

    it('7단계 등급 구간으로 평가기간 생성 시 모든 값이 정확하게 할당되어야 한다', async () => {
      // Given
      const { startDate, endDate } = getUniqueDateRange();

      const gradeRanges = [
        { grade: 'S+', minRange: 121, maxRange: 150 },
        { grade: 'S', minRange: 111, maxRange: 120 },
        { grade: 'A+', minRange: 101, maxRange: 110 },
        { grade: 'A', minRange: 91, maxRange: 100 },
        { grade: 'B+', minRange: 81, maxRange: 90 },
        { grade: 'B', minRange: 71, maxRange: 80 },
        { grade: 'C', minRange: 0, maxRange: 70 },
      ];

      const createData = {
        name: '7단계 등급 구간 테스트',
        startDate: startDate.toISOString(),
        peerEvaluationDeadline: endDate.toISOString(),
        description: 'E2E 테스트 - 7단계 등급 구간',
        maxSelfEvaluationRate: 150,
        gradeRanges,
      };

      // When
      const result = await apiClient.createEvaluationPeriod(createData);
      createdPeriodIds.push(result.id);

      // Then - 생성 응답 검증
      expect(result.gradeRanges).toHaveLength(7);

      gradeRanges.forEach((input) => {
        const resultGrade = result.gradeRanges.find(
          (g: any) => g.grade === input.grade,
        );
        expect(resultGrade).toBeDefined();
        expect(resultGrade.minRange).toBe(input.minRange);
        expect(resultGrade.maxRange).toBe(input.maxRange);
      });

      console.log('✅ 7단계 등급 구간 생성 검증 완료');
    });

    it('생성 후 상세 조회 시 등급 구간 값이 일치해야 한다', async () => {
      // Given
      const { startDate, endDate } = getUniqueDateRange();

      const gradeRanges = [
        { grade: 'EXCELLENT', minRange: 90, maxRange: 100 },
        { grade: 'GOOD', minRange: 70, maxRange: 89 },
        { grade: 'AVERAGE', minRange: 50, maxRange: 69 },
        { grade: 'POOR', minRange: 0, maxRange: 49 },
      ];

      const createData = {
        name: '상세 조회 등급 검증 테스트',
        startDate: startDate.toISOString(),
        peerEvaluationDeadline: endDate.toISOString(),
        description: 'E2E 테스트 - 상세 조회 등급 검증',
        maxSelfEvaluationRate: 120,
        gradeRanges,
      };

      // When - 생성
      const createResult = await apiClient.createEvaluationPeriod(createData);
      createdPeriodIds.push(createResult.id);

      // When - 상세 조회
      const detailResult = await apiClient.getEvaluationPeriodDetail(
        createResult.id,
      );

      // Then - 상세 조회 결과 검증
      expect(detailResult.gradeRanges).toHaveLength(4);

      gradeRanges.forEach((input) => {
        const resultGrade = detailResult.gradeRanges.find(
          (g: any) => g.grade === input.grade,
        );
        expect(resultGrade).toBeDefined();
        expect(resultGrade.minRange).toBe(input.minRange);
        expect(resultGrade.maxRange).toBe(input.maxRange);
      });

      console.log('✅ 상세 조회 등급 구간 검증 완료');
    });

    it('넓은 범위의 등급 구간으로 평가기간 생성 시 값이 정확하게 할당되어야 한다', async () => {
      // Given
      const { startDate, endDate } = getUniqueDateRange();

      const gradeRanges = [
        { grade: 'S', minRange: 900, maxRange: 1000 },
        { grade: 'A', minRange: 700, maxRange: 899 },
        { grade: 'B', minRange: 400, maxRange: 699 },
        { grade: 'C', minRange: 0, maxRange: 399 },
      ];

      const createData = {
        name: '넓은 범위 등급 구간 테스트',
        startDate: startDate.toISOString(),
        peerEvaluationDeadline: endDate.toISOString(),
        description: 'E2E 테스트 - 넓은 범위 등급 구간 (0-1000)',
        maxSelfEvaluationRate: 200,
        gradeRanges,
      };

      // When
      const result = await apiClient.createEvaluationPeriod(createData);
      createdPeriodIds.push(result.id);

      // Then
      expect(result.gradeRanges).toHaveLength(4);

      const sGrade = result.gradeRanges.find((g: any) => g.grade === 'S');
      expect(sGrade.minRange).toBe(900);
      expect(sGrade.maxRange).toBe(1000);

      const aGrade = result.gradeRanges.find((g: any) => g.grade === 'A');
      expect(aGrade.minRange).toBe(700);
      expect(aGrade.maxRange).toBe(899);

      console.log('✅ 넓은 범위 등급 구간 생성 검증 완료');
    });

    it('등급 구간 없이 평가기간 생성 시 빈 배열이 할당되어야 한다', async () => {
      // Given
      const { startDate, endDate } = getUniqueDateRange();

      const createData = {
        name: '등급 없는 평가기간 테스트',
        startDate: startDate.toISOString(),
        peerEvaluationDeadline: endDate.toISOString(),
        description: 'E2E 테스트 - 등급 구간 없음',
        maxSelfEvaluationRate: 100,
        gradeRanges: [],
      };

      // When
      const result = await apiClient.createEvaluationPeriod(createData);
      createdPeriodIds.push(result.id);

      // Then
      expect(result.gradeRanges).toHaveLength(0);

      // 상세 조회로도 확인
      const detailResult = await apiClient.getEvaluationPeriodDetail(result.id);
      expect(detailResult.gradeRanges).toHaveLength(0);

      console.log('✅ 등급 없는 평가기간 생성 검증 완료');
    });
  });

  describe('평가기간 등급 구간 수정 검증', () => {
    let testPeriodId: string;

    beforeEach(async () => {
      // 수정 테스트용 평가기간 생성
      const { startDate, endDate } = getUniqueDateRange();

      const createData = {
        name: `수정 테스트용 평가기간 ${Date.now()}`,
        startDate: startDate.toISOString(),
        peerEvaluationDeadline: endDate.toISOString(),
        description: '등급 구간 수정 테스트용',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 90, maxRange: 94 },
          { grade: 'B', minRange: 80, maxRange: 89 },
          { grade: 'C', minRange: 70, maxRange: 79 },
          { grade: 'D', minRange: 0, maxRange: 69 },
        ],
      };

      const result = await apiClient.createEvaluationPeriod(createData);
      testPeriodId = result.id;
      createdPeriodIds.push(testPeriodId);
    });

    it('등급 구간 수정 시 모든 값이 정확하게 변경되어야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'S+', minRange: 98, maxRange: 100 },
          { grade: 'S', minRange: 95, maxRange: 97 },
          { grade: 'A+', minRange: 90, maxRange: 94 },
          { grade: 'A', minRange: 85, maxRange: 89 },
          { grade: 'B+', minRange: 80, maxRange: 84 },
          { grade: 'B', minRange: 75, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 74 },
        ],
      };

      // When
      const result = await apiClient.updateEvaluationPeriodGradeRanges(
        testPeriodId,
        updateData,
      );

      // Then
      expect(result.gradeRanges).toHaveLength(7);

      updateData.gradeRanges.forEach((input) => {
        const resultGrade = result.gradeRanges.find(
          (g: any) => g.grade === input.grade,
        );
        expect(resultGrade).toBeDefined();
        expect(resultGrade.minRange).toBe(input.minRange);
        expect(resultGrade.maxRange).toBe(input.maxRange);
      });

      console.log('✅ 등급 구간 수정 검증 완료');
    });

    it('수정 후 상세 조회 시 변경된 값이 반영되어야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'HIGH', minRange: 80, maxRange: 100 },
          { grade: 'MEDIUM', minRange: 50, maxRange: 79 },
          { grade: 'LOW', minRange: 0, maxRange: 49 },
        ],
      };

      // When - 수정
      await apiClient.updateEvaluationPeriodGradeRanges(
        testPeriodId,
        updateData,
      );

      // When - 상세 조회
      const detailResult =
        await apiClient.getEvaluationPeriodDetail(testPeriodId);

      // Then
      expect(detailResult.gradeRanges).toHaveLength(3);

      updateData.gradeRanges.forEach((input) => {
        const resultGrade = detailResult.gradeRanges.find(
          (g: any) => g.grade === input.grade,
        );
        expect(resultGrade).toBeDefined();
        expect(resultGrade.minRange).toBe(input.minRange);
        expect(resultGrade.maxRange).toBe(input.maxRange);
      });

      console.log('✅ 수정 후 상세 조회 검증 완료');
    });

    it('등급 개수를 줄이며 수정 시 새로운 값이 정확하게 반영되어야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'PASS', minRange: 60, maxRange: 100 },
          { grade: 'FAIL', minRange: 0, maxRange: 59 },
        ],
      };

      // When
      const result = await apiClient.updateEvaluationPeriodGradeRanges(
        testPeriodId,
        updateData,
      );

      // Then
      expect(result.gradeRanges).toHaveLength(2);

      const passGrade = result.gradeRanges.find((g: any) => g.grade === 'PASS');
      expect(passGrade.minRange).toBe(60);
      expect(passGrade.maxRange).toBe(100);

      const failGrade = result.gradeRanges.find((g: any) => g.grade === 'FAIL');
      expect(failGrade.minRange).toBe(0);
      expect(failGrade.maxRange).toBe(59);

      console.log('✅ 등급 개수 줄이기 수정 검증 완료');
    });

    it('넓은 점수 범위로 수정 시 정확하게 반영되어야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'S', minRange: 950, maxRange: 1000 },
          { grade: 'A', minRange: 800, maxRange: 949 },
          { grade: 'B', minRange: 500, maxRange: 799 },
          { grade: 'C', minRange: 0, maxRange: 499 },
        ],
      };

      // When
      const result = await apiClient.updateEvaluationPeriodGradeRanges(
        testPeriodId,
        updateData,
      );

      // Then
      expect(result.gradeRanges).toHaveLength(4);

      const sGrade = result.gradeRanges.find((g: any) => g.grade === 'S');
      expect(sGrade.minRange).toBe(950);
      expect(sGrade.maxRange).toBe(1000);

      const cGrade = result.gradeRanges.find((g: any) => g.grade === 'C');
      expect(cGrade.minRange).toBe(0);
      expect(cGrade.maxRange).toBe(499);

      console.log('✅ 넓은 점수 범위 수정 검증 완료');
    });

    it('연속 수정 시 각각의 값이 정확하게 반영되어야 한다', async () => {
      // Given - 첫 번째 수정
      const firstUpdate = {
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
          { grade: 'B', minRange: 0, maxRange: 79 },
        ],
      };

      // When - 첫 번째 수정
      const firstResult = await apiClient.updateEvaluationPeriodGradeRanges(
        testPeriodId,
        firstUpdate,
      );

      // Then - 첫 번째 수정 확인
      expect(firstResult.gradeRanges).toHaveLength(2);
      expect(
        firstResult.gradeRanges.find((g: any) => g.grade === 'A').minRange,
      ).toBe(80);

      // Given - 두 번째 수정
      const secondUpdate = {
        gradeRanges: [
          { grade: 'S', minRange: 90, maxRange: 100 },
          { grade: 'A', minRange: 80, maxRange: 89 },
          { grade: 'B', minRange: 70, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 69 },
        ],
      };

      // When - 두 번째 수정
      const secondResult = await apiClient.updateEvaluationPeriodGradeRanges(
        testPeriodId,
        secondUpdate,
      );

      // Then - 두 번째 수정 확인
      expect(secondResult.gradeRanges).toHaveLength(4);
      expect(
        secondResult.gradeRanges.find((g: any) => g.grade === 'S').minRange,
      ).toBe(90);
      expect(
        secondResult.gradeRanges.find((g: any) => g.grade === 'A').minRange,
      ).toBe(80);

      // 상세 조회로 최종 확인
      const detailResult =
        await apiClient.getEvaluationPeriodDetail(testPeriodId);
      expect(detailResult.gradeRanges).toHaveLength(4);

      console.log('✅ 연속 수정 검증 완료');
    });
  });

  describe('목록 조회 시 등급 구간 포함 검증', () => {
    it('목록 조회 시 각 평가기간의 등급 구간이 포함되어야 한다', async () => {
      // Given - 서로 다른 등급 구간을 가진 평가기간 생성
      const { startDate: startDate1, endDate: endDate1 } = getUniqueDateRange();
      const { startDate: startDate2, endDate: endDate2 } = getUniqueDateRange();

      const period1Data = {
        name: `목록 조회 테스트 1 ${Date.now()}`,
        startDate: startDate1.toISOString(),
        peerEvaluationDeadline: endDate1.toISOString(),
        description: '목록 조회 테스트용 1',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 90, maxRange: 94 },
        ],
      };

      const period2Data = {
        name: `목록 조회 테스트 2 ${Date.now()}`,
        startDate: startDate2.toISOString(),
        peerEvaluationDeadline: endDate2.toISOString(),
        description: '목록 조회 테스트용 2',
        maxSelfEvaluationRate: 150,
        gradeRanges: [
          { grade: 'HIGH', minRange: 80, maxRange: 100 },
          { grade: 'LOW', minRange: 0, maxRange: 79 },
        ],
      };

      const result1 = await apiClient.createEvaluationPeriod(period1Data);
      createdPeriodIds.push(result1.id);
      const result2 = await apiClient.createEvaluationPeriod(period2Data);
      createdPeriodIds.push(result2.id);

      // When
      const listResult = await apiClient.getEvaluationPeriods({
        page: 1,
        limit: 100,
      });

      // Then
      const period1InList = listResult.items.find(
        (item: any) => item.id === result1.id,
      );
      const period2InList = listResult.items.find(
        (item: any) => item.id === result2.id,
      );

      expect(period1InList).toBeDefined();
      expect(period1InList.gradeRanges).toHaveLength(2);
      expect(
        period1InList.gradeRanges.find((g: any) => g.grade === 'S').minRange,
      ).toBe(95);

      expect(period2InList).toBeDefined();
      expect(period2InList.gradeRanges).toHaveLength(2);
      expect(
        period2InList.gradeRanges.find((g: any) => g.grade === 'HIGH').minRange,
      ).toBe(80);

      console.log('✅ 목록 조회 등급 구간 포함 검증 완료');
    });
  });
});
