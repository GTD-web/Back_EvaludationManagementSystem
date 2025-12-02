/**
 * 평가 기간 기본 등급 구간 설정
 *
 * 프론트엔드에서 평가 기간 생성 시 참고할 수 있는 기본 등급 구간입니다.
 * POST /admin/evaluation-periods/default-grade-ranges 엔드포인트를 통해 변경할 수 있습니다.
 */

type GradeRange = {
  grade: string;
  minRange: number;
  maxRange: number;
};

let defaultGradeRanges: GradeRange[] = [
  {
    grade: 'S',
    minRange: 121,
    maxRange: 200,
  },
  {
    grade: 'A+',
    minRange: 111,
    maxRange: 120,
  },
  {
    grade: 'A',
    minRange: 101,
    maxRange: 110,
  },
  {
    grade: 'B+',
    minRange: 91,
    maxRange: 100,
  },
  {
    grade: 'B',
    minRange: 81,
    maxRange: 90,
  },
  {
    grade: 'C',
    minRange: 71,
    maxRange: 80,
  },
  {
    grade: 'D',
    minRange: 0,
    maxRange: 70,
  },
];

/**
 * 기본 등급 구간을 조회합니다.
 */
export function getDefaultGradeRanges(): GradeRange[] {
  return [...defaultGradeRanges];
}

/**
 * 기본 등급 구간을 변경합니다.
 */
export function setDefaultGradeRanges(ranges: GradeRange[]): void {
  defaultGradeRanges = [...ranges];
}

/**
 * 기본 등급 구간 상수 (하위 호환성을 위해 유지)
 * @deprecated getDefaultGradeRanges() 함수를 사용하세요.
 */
export const DEFAULT_GRADE_RANGES = getDefaultGradeRanges();

