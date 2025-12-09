export declare class PaginationQueryDto {
    page?: number;
    limit?: number;
}
export declare class PaginationResponseDto<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    constructor(items: T[], total: number, page: number, limit: number);
}
export declare class CreateGradeRangeApiDto {
    grade: string;
    minRange: number;
    maxRange: number;
}
export declare class CreateEvaluationPeriodApiDto {
    name: string;
    startDate: string;
    peerEvaluationDeadline: string;
    description?: string;
    maxSelfEvaluationRate?: number;
    gradeRanges?: CreateGradeRangeApiDto[];
    sourcePeriodId?: string;
}
export declare class UpdateEvaluationPeriodBasicApiDto {
    name?: string;
    description?: string;
    maxSelfEvaluationRate?: number;
}
export declare class UpdateEvaluationPeriodScheduleApiDto {
    startDate?: string;
    evaluationSetupDeadline?: string;
    performanceDeadline?: string;
    selfEvaluationDeadline?: string;
    peerEvaluationDeadline?: string;
}
export declare class UpdateEvaluationPeriodStartDateApiDto {
    startDate: string;
}
export declare class CopyEvaluationPeriodApiDto {
    sourceEvaluationPeriodId: string;
}
export declare class UpdateEvaluationSetupDeadlineApiDto {
    evaluationSetupDeadline: string;
}
export declare class UpdatePerformanceDeadlineApiDto {
    performanceDeadline: string;
}
export declare class UpdateSelfEvaluationDeadlineApiDto {
    selfEvaluationDeadline: string;
}
export declare class UpdatePeerEvaluationDeadlineApiDto {
    peerEvaluationDeadline: string;
}
export declare class UpdateGradeRangesApiDto {
    gradeRanges: CreateGradeRangeApiDto[];
}
export declare class UpdateDefaultGradeRangesApiDto {
    gradeRanges: CreateGradeRangeApiDto[];
}
export declare class ManualPermissionSettingDto {
    allowManualSetting: boolean;
}
export declare class UpdateManualSettingPermissionsApiDto {
    allowCriteriaManualSetting?: boolean;
    allowSelfEvaluationManualSetting?: boolean;
    allowFinalEvaluationManualSetting?: boolean;
}
export declare class ChangeEvaluationPeriodPhaseApiDto {
    targetPhase: string;
}
export declare class CopyProjectWithWbsDto {
    projectId: string;
    wbsIds?: string[];
}
export declare class CopyPreviousPeriodDataApiDto {
    projects?: CopyProjectWithWbsDto[];
}
export declare class CopyPreviousPeriodDataResponseDto {
    success: boolean;
    message: string;
    copiedProjectAssignments: number;
    copiedEvaluationLineMappings: number;
}
export declare class ApiResponseDto<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
    constructor(success: boolean, message: string, data?: T, error?: any);
}
