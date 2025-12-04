import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { EvaluationPeriodBusinessService } from '@business/evaluation-period/evaluation-period-business.service';
import type { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { PaginationQueryDto } from '@interface/common/dto/evaluation-period/evaluation-management.dto';
import type { GradeRangeResponseDto } from '@interface/common/dto/evaluation-period/evaluation-period-response.dto';
import { SystemSettingService } from '@domain/common/system-setting/system-setting.service';
export declare class EvaluatorEvaluationPeriodManagementController {
    private readonly evaluationPeriodBusinessService;
    private readonly evaluationPeriodManagementService;
    private readonly systemSettingService;
    constructor(evaluationPeriodBusinessService: EvaluationPeriodBusinessService, evaluationPeriodManagementService: EvaluationPeriodManagementContextService, systemSettingService: SystemSettingService);
    getDefaultGradeRanges(): Promise<GradeRangeResponseDto[]>;
    getActiveEvaluationPeriods(): Promise<EvaluationPeriodDto[]>;
    getEvaluationPeriods(query: PaginationQueryDto): Promise<{
        items: EvaluationPeriodDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getEvaluationPeriodDetail(periodId: string): Promise<EvaluationPeriodDto | null>;
}
