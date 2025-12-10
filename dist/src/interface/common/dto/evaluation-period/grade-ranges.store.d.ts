type GradeRange = {
    grade: string;
    minRange: number;
    maxRange: number;
};
export declare function getDefaultGradeRanges(): GradeRange[];
export declare function setDefaultGradeRanges(ranges: GradeRange[]): void;
export declare const DEFAULT_GRADE_RANGES: GradeRange[];
export {};
