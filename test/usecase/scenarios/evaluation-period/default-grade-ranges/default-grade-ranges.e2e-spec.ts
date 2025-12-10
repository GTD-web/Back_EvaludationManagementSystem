import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';
import {
  getDefaultGradeRanges,
  setDefaultGradeRanges,
} from '../../../../../src/interface/common/dto/evaluation-period/grade-ranges.store';

/**
 * 기본 등급 구간 관리 E2E 테스트
 *
 * 시나리오:
 * - 기본 등급 구간 조회 (GET /admin/evaluation-periods/default-grade-ranges)
 * - 기본 등급 구간 변경 (POST /admin/evaluation-periods/default-grade-ranges)
 * - 변경 후 조회 검증
 * - 유효성 검증 (중복, 겹침, 범위 등)
 */
describe('기본 등급 구간 관리 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let apiClient: EvaluationPeriodManagementApiClient;

  const originalRanges = getDefaultGradeRanges();

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;

    apiClient = new EvaluationPeriodManagementApiClient(testSuite);
  });

  afterAll(async () => {
    // 원래 값으로 복원
    setDefaultGradeRanges(originalRanges);
    await testSuite.closeApp();
  });

  afterEach(() => {
    // 각 테스트 후 원래 값으로 복원
    setDefaultGradeRanges(originalRanges);
  });

  describe('기본 등급 구간 조회', () => {
    it('기본 등급 구간을 조회한다', async () => {
      const result = await apiClient.getDefaultGradeRanges();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // 각 등급 구간의 구조 검증
      result.forEach((range: any) => {
        expect(range).toHaveProperty('grade');
        expect(range).toHaveProperty('minRange');
        expect(range).toHaveProperty('maxRange');
        expect(typeof range.grade).toBe('string');
        expect(typeof range.minRange).toBe('number');
        expect(typeof range.maxRange).toBe('number');
        expect(range.minRange).toBeGreaterThanOrEqual(0);
        expect(range.maxRange).toBeLessThanOrEqual(200);
        expect(range.minRange).toBeLessThan(range.maxRange);
      });

      console.log(`✅ 기본 등급 구간 조회 완료: ${result.length}개`);
    });

    it('기본 등급 구간이 올바른 순서로 반환된다', async () => {
      const result = await apiClient.getDefaultGradeRanges();

      // 최소 범위 기준으로 내림차순 정렬되어 있는지 확인
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].minRange).toBeGreaterThanOrEqual(
          result[i + 1].minRange,
        );
      }
    });

    it('기본 등급 구간의 범위가 유효하다', async () => {
      const result = await apiClient.getDefaultGradeRanges();

      const minRange = Math.min(...result.map((r: any) => r.minRange));
      const maxRange = Math.max(...result.map((r: any) => r.maxRange));

      // 최소값은 0 이상, 최대값은 1000 이하
      expect(minRange).toBeGreaterThanOrEqual(0);
      expect(maxRange).toBeLessThanOrEqual(1000);
    });

    it('기본 등급 구간이 겹치지 않는다', async () => {
      const result = await apiClient.getDefaultGradeRanges();

      const sortedRanges = [...result].sort(
        (a: any, b: any) => a.minRange - b.minRange,
      );

      for (let i = 0; i < sortedRanges.length - 1; i++) {
        const current = sortedRanges[i];
        const next = sortedRanges[i + 1];
        expect(current.maxRange).toBeLessThanOrEqual(next.minRange);
      }
    });
  });

  describe('기본 등급 구간 변경', () => {
    it('기본 등급 구간을 변경한다', async () => {
      const newRanges = [
        { grade: 'S', minRange: 150, maxRange: 200 },
        { grade: 'A', minRange: 100, maxRange: 149 },
        { grade: 'B', minRange: 50, maxRange: 99 },
        { grade: 'C', minRange: 0, maxRange: 49 },
      ];

      const result = await apiClient.updateDefaultGradeRanges(newRanges);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(newRanges.length);
      expect(result).toEqual(newRanges);

      console.log(`✅ 기본 등급 구간 변경 완료: ${result.length}개`);
    });

    it('변경 후 조회 API에서 변경된 값이 반환된다', async () => {
      const newRanges = [
        { grade: 'S+', minRange: 180, maxRange: 200 },
        { grade: 'S', minRange: 160, maxRange: 179 },
        { grade: 'A+', minRange: 140, maxRange: 159 },
        { grade: 'A', minRange: 120, maxRange: 139 },
        { grade: 'B', minRange: 60, maxRange: 119 },
        { grade: 'C', minRange: 0, maxRange: 59 },
      ];

      await apiClient.updateDefaultGradeRanges(newRanges);

      const result = await apiClient.getDefaultGradeRanges();

      expect(result).toEqual(newRanges);
      expect(result.length).toBe(6);
    });

    it('다양한 등급 구간으로 변경할 수 있다', async () => {
      const customRanges = [
        { grade: 'S++', minRange: 180, maxRange: 200 },
        { grade: 'S+', minRange: 160, maxRange: 179 },
        { grade: 'S', minRange: 140, maxRange: 159 },
        { grade: 'A+', minRange: 120, maxRange: 139 },
        { grade: 'A', minRange: 100, maxRange: 119 },
        { grade: 'B+', minRange: 80, maxRange: 99 },
        { grade: 'B', minRange: 60, maxRange: 79 },
        { grade: 'C', minRange: 40, maxRange: 59 },
        { grade: 'D', minRange: 20, maxRange: 39 },
        { grade: 'F', minRange: 0, maxRange: 19 },
      ];

      const result = await apiClient.updateDefaultGradeRanges(customRanges);

      expect(result.length).toBe(10);
      expect(result[0].grade).toBe('S++');
      expect(result[result.length - 1].grade).toBe('F');
    });

    it('여러 번 변경해도 정상 동작한다', async () => {
      const ranges1 = [
        { grade: 'S', minRange: 150, maxRange: 200 },
        { grade: 'A', minRange: 100, maxRange: 149 },
        { grade: 'B', minRange: 0, maxRange: 99 },
      ];

      await apiClient.updateDefaultGradeRanges(ranges1);
      let result = await apiClient.getDefaultGradeRanges();
      expect(result).toEqual(ranges1);

      const ranges2 = [
        { grade: 'S+', minRange: 180, maxRange: 200 },
        { grade: 'S', minRange: 160, maxRange: 179 },
        { grade: 'A', minRange: 100, maxRange: 159 },
        { grade: 'B', minRange: 0, maxRange: 99 },
      ];

      await apiClient.updateDefaultGradeRanges(ranges2);
      result = await apiClient.getDefaultGradeRanges();
      expect(result).toEqual(ranges2);
    });
  });

  describe('유효성 검증', () => {
    it('중복된 등급이 있으면 400 에러를 반환한다', async () => {
      const invalidRanges = [
        { grade: 'S', minRange: 90, maxRange: 100 },
        { grade: 'S', minRange: 80, maxRange: 89 }, // 중복 등급
        { grade: 'A', minRange: 0, maxRange: 79 },
      ];

      await testSuite
        .request()
        .post('/admin/evaluation-periods/default-grade-ranges')
        .send({ gradeRanges: invalidRanges })
        .expect(400);
    });

    it('범위가 0-1000을 벗어나면 400 에러를 반환한다', async () => {
      const invalidRanges = [
        { grade: 'S', minRange: -10, maxRange: 100 }, // 음수
        { grade: 'A', minRange: 0, maxRange: 79 },
      ];

      await testSuite
        .request()
        .post('/admin/evaluation-periods/default-grade-ranges')
        .send({ gradeRanges: invalidRanges })
        .expect(400);
    });

    it('최대 범위가 1000을 초과하면 400 에러를 반환한다', async () => {
      const invalidRanges = [
        { grade: 'S', minRange: 900, maxRange: 1500 }, // 1000 초과
        { grade: 'A', minRange: 0, maxRange: 899 },
      ];

      await testSuite
        .request()
        .post('/admin/evaluation-periods/default-grade-ranges')
        .send({ gradeRanges: invalidRanges })
        .expect(400);
    });

    it('최소 범위가 최대 범위보다 크거나 같으면 400 에러를 반환한다', async () => {
      const invalidRanges = [
        { grade: 'S', minRange: 100, maxRange: 90 }, // minRange > maxRange
        { grade: 'A', minRange: 0, maxRange: 79 },
      ];

      await testSuite
        .request()
        .post('/admin/evaluation-periods/default-grade-ranges')
        .send({ gradeRanges: invalidRanges })
        .expect(400);
    });

    it('등급 구간이 겹치면 400 에러를 반환한다', async () => {
      const invalidRanges = [
        { grade: 'S', minRange: 90, maxRange: 100 },
        { grade: 'A', minRange: 95, maxRange: 110 }, // 겹침
        { grade: 'B', minRange: 0, maxRange: 89 },
      ];

      await testSuite
        .request()
        .post('/admin/evaluation-periods/default-grade-ranges')
        .send({ gradeRanges: invalidRanges })
        .expect(400);
    });

    it('부분 범위만 설정해도 정상 동작한다', async () => {
      const partialRanges = [
        { grade: 'S', minRange: 150, maxRange: 200 },
        { grade: 'A', minRange: 100, maxRange: 149 },
        // 0-99 범위는 커버하지 않지만 설정 가능
      ];

      const result = await apiClient.updateDefaultGradeRanges(partialRanges);

      expect(result).toEqual(partialRanges);
      expect(result.length).toBe(2);
    });

    it('빈 배열이면 400 에러를 반환한다', async () => {
      await testSuite
        .request()
        .post('/admin/evaluation-periods/default-grade-ranges')
        .send({ gradeRanges: [] })
        .expect(400);
    });

    it('필수 필드가 누락되면 400 에러를 반환한다', async () => {
      const invalidRanges = [
        { grade: 'S', minRange: 90 }, // maxRange 누락
        { grade: 'A', minRange: 0, maxRange: 89 },
      ];

      await testSuite
        .request()
        .post('/admin/evaluation-periods/default-grade-ranges')
        .send({ gradeRanges: invalidRanges })
        .expect(400);
    });
  });

  describe('경계값 테스트', () => {
    it('최소값(0)과 최대값(1000)을 포함한 등급 구간을 설정할 수 있다', async () => {
      const boundaryRanges = [
        { grade: 'S', minRange: 500, maxRange: 1000 },
        { grade: 'A', minRange: 250, maxRange: 499 },
        { grade: 'B', minRange: 0, maxRange: 249 },
      ];

      const result = await apiClient.updateDefaultGradeRanges(boundaryRanges);

      expect(result).toEqual(boundaryRanges);
      expect(result[result.length - 1].minRange).toBe(0);
      expect(result[0].maxRange).toBe(1000);
    });

    it('단일 등급 구간으로 전체 범위를 커버할 수 있다', async () => {
      const singleRange = [{ grade: 'ALL', minRange: 0, maxRange: 1000 }];

      const result = await apiClient.updateDefaultGradeRanges(singleRange);

      expect(result).toEqual(singleRange);
      expect(result[0].minRange).toBe(0);
      expect(result[0].maxRange).toBe(1000);
    });

    it('사용자 정의 범위로 등급 구간을 설정할 수 있다', async () => {
      const customRanges = [
        { grade: 'Excellent', minRange: 80, maxRange: 100 },
        { grade: 'Good', minRange: 60, maxRange: 79 },
        { grade: 'Fair', minRange: 40, maxRange: 59 },
        { grade: 'Poor', minRange: 20, maxRange: 39 },
      ];

      const result = await apiClient.updateDefaultGradeRanges(customRanges);

      expect(result).toEqual(customRanges);
      expect(result.length).toBe(4);
      expect(result[0].grade).toBe('Excellent');
    });

    it('높은 점수 범위로 등급 구간을 설정할 수 있다', async () => {
      const highRanges = [
        { grade: 'S++', minRange: 800, maxRange: 1000 },
        { grade: 'S+', minRange: 600, maxRange: 799 },
        { grade: 'S', minRange: 400, maxRange: 599 },
      ];

      const result = await apiClient.updateDefaultGradeRanges(highRanges);

      expect(result).toEqual(highRanges);
      expect(result[0].maxRange).toBe(1000);
    });
  });
});

