export declare const SystemSettingKey: {
    readonly DEFAULT_GRADE_RANGES: "DEFAULT_GRADE_RANGES";
};
export type SystemSettingKeyType = (typeof SystemSettingKey)[keyof typeof SystemSettingKey];
export interface GradeRangeValue {
    grade: string;
    minRange: number;
    maxRange: number;
}
export interface SystemSettingDto {
    id: string;
    key: string;
    value: unknown;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DEFAULT_GRADE_RANGES_INITIAL: GradeRangeValue[];
