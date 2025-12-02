import {
  getDefaultGradeRanges,
  setDefaultGradeRanges,
} from './grade-ranges.store';

describe('기본 등급 구간 상수 테스트', () => {
  const originalRanges = getDefaultGradeRanges();

  afterEach(() => {
    // 각 테스트 후 원래 값으로 복원
    setDefaultGradeRanges(originalRanges);
  });

  describe('getDefaultGradeRanges', () => {
    it('기본 등급 구간을 반환한다', () => {
      const ranges = getDefaultGradeRanges();

      expect(Array.isArray(ranges)).toBe(true);
      expect(ranges.length).toBeGreaterThan(0);
      expect(ranges[0]).toHaveProperty('grade');
      expect(ranges[0]).toHaveProperty('minRange');
      expect(ranges[0]).toHaveProperty('maxRange');
    });

    it('반환된 배열은 복사본이다', () => {
      const ranges1 = getDefaultGradeRanges();
      const ranges2 = getDefaultGradeRanges();

      expect(ranges1).not.toBe(ranges2);
      expect(ranges1).toEqual(ranges2);
    });

    it('기본값이 올바른 구조를 가진다', () => {
      const ranges = getDefaultGradeRanges();

      ranges.forEach((range) => {
        expect(typeof range.grade).toBe('string');
        expect(typeof range.minRange).toBe('number');
        expect(typeof range.maxRange).toBe('number');
        expect(range.minRange).toBeGreaterThanOrEqual(0);
        expect(range.maxRange).toBeLessThanOrEqual(200);
        expect(range.minRange).toBeLessThan(range.maxRange);
      });
    });
  });

  describe('setDefaultGradeRanges', () => {
    it('기본 등급 구간을 변경한다', () => {
      const newRanges = [
        { grade: 'S', minRange: 90, maxRange: 100 },
        { grade: 'A', minRange: 80, maxRange: 89 },
        { grade: 'B', minRange: 70, maxRange: 79 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ];

      setDefaultGradeRanges(newRanges);

      const updatedRanges = getDefaultGradeRanges();
      expect(updatedRanges).toEqual(newRanges);
    });

    it('변경된 값이 이후 조회에 반영된다', () => {
      const newRanges = [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A', minRange: 80, maxRange: 89 },
        { grade: 'B', minRange: 70, maxRange: 79 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ];

      setDefaultGradeRanges(newRanges);

      const ranges1 = getDefaultGradeRanges();
      const ranges2 = getDefaultGradeRanges();

      expect(ranges1).toEqual(newRanges);
      expect(ranges2).toEqual(newRanges);
    });

    it('빈 배열로 변경할 수 있다', () => {
      const emptyRanges: Array<{
        grade: string;
        minRange: number;
        maxRange: number;
      }> = [];

      setDefaultGradeRanges(emptyRanges);

      const ranges = getDefaultGradeRanges();
      expect(ranges).toEqual([]);
    });

    it('다양한 등급 구간으로 변경할 수 있다', () => {
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

      setDefaultGradeRanges(customRanges);

      const ranges = getDefaultGradeRanges();
      expect(ranges).toEqual(customRanges);
      expect(ranges.length).toBe(10);
    });

    it('변경 시 원본 배열을 수정하지 않는다', () => {
      const newRanges = [
        { grade: 'S', minRange: 90, maxRange: 100 },
        { grade: 'A', minRange: 80, maxRange: 89 },
      ];

      setDefaultGradeRanges(newRanges);

      // 원본 배열 수정 시도
      newRanges.push({ grade: 'B', minRange: 70, maxRange: 79 });

      const ranges = getDefaultGradeRanges();
      expect(ranges.length).toBe(2); // 원본 수정이 반영되지 않음
    });
  });

  describe('통합 테스트', () => {
    it('여러 번 변경해도 정상 동작한다', () => {
      const ranges1 = [
        { grade: 'S', minRange: 90, maxRange: 100 },
        { grade: 'A', minRange: 80, maxRange: 89 },
      ];

      setDefaultGradeRanges(ranges1);
      expect(getDefaultGradeRanges()).toEqual(ranges1);

      const ranges2 = [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A', minRange: 80, maxRange: 89 },
      ];

      setDefaultGradeRanges(ranges2);
      expect(getDefaultGradeRanges()).toEqual(ranges2);

      const ranges3 = [
        { grade: 'S', minRange: 121, maxRange: 200 },
        { grade: 'A+', minRange: 111, maxRange: 120 },
        { grade: 'A', minRange: 101, maxRange: 110 },
        { grade: 'B+', minRange: 91, maxRange: 100 },
        { grade: 'B', minRange: 81, maxRange: 90 },
        { grade: 'C', minRange: 71, maxRange: 80 },
        { grade: 'D', minRange: 0, maxRange: 70 },
      ];

      setDefaultGradeRanges(ranges3);
      expect(getDefaultGradeRanges()).toEqual(ranges3);
    });
  });
});

