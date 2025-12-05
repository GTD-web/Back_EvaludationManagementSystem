/**
 * 시스템 설정 타입 정의
 *
 * 시스템 전역 설정을 관리하기 위한 타입들을 정의합니다.
 */

/**
 * 시스템 설정 키 상수
 */
export const SystemSettingKey = {
  DEFAULT_GRADE_RANGES: 'DEFAULT_GRADE_RANGES',
} as const;

export type SystemSettingKeyType =
  (typeof SystemSettingKey)[keyof typeof SystemSettingKey];

/**
 * 등급 구간 타입
 */
export interface GradeRangeValue {
  grade: string;
  minRange: number;
  maxRange: number;
}

/**
 * 시스템 설정 DTO
 */
export interface SystemSettingDto {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 기본 등급 구간 초기값
 */
export const DEFAULT_GRADE_RANGES_INITIAL: GradeRangeValue[] = [
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


