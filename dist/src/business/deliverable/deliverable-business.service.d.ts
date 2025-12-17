import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import type { DeliverableType } from '@domain/core/deliverable/deliverable.types';
export declare class DeliverableBusinessService {
    private readonly performanceEvaluationService;
    private readonly activityLogContextService;
    private readonly evaluationCriteriaManagementService;
    private readonly logger;
    constructor(performanceEvaluationService: PerformanceEvaluationService, activityLogContextService: EvaluationActivityLogContextService, evaluationCriteriaManagementService: EvaluationCriteriaManagementService);
    산출물을_생성한다(data: {
        name: string;
        type: DeliverableType;
        employeeId: string;
        wbsItemId: string;
        description?: string;
        filePath?: string;
        createdBy: string;
    }): Promise<Deliverable>;
    산출물을_수정한다(data: {
        id: string;
        updatedBy: string;
        name?: string;
        type?: DeliverableType;
        description?: string;
        filePath?: string;
        employeeId?: string;
        wbsItemId?: string;
        isActive?: boolean;
    }): Promise<Deliverable>;
    산출물을_삭제한다(id: string, deletedBy: string): Promise<void>;
    산출물을_벌크_생성한다(data: {
        deliverables: Array<{
            name: string;
            description?: string;
            type: DeliverableType;
            filePath?: string;
            employeeId: string;
            wbsItemId: string;
        }>;
        createdBy: string;
    }): Promise<{
        successCount: number;
        failedCount: number;
        createdIds: string[];
        failedItems: Array<{
            data: Partial<(typeof data.deliverables)[0]>;
            error: string;
        }>;
    }>;
    산출물을_벌크_삭제한다(data: {
        ids: string[];
        deletedBy: string;
    }): Promise<{
        successCount: number;
        failedCount: number;
        failedIds: Array<{
            id: string;
            error: string;
        }>;
    }>;
    직원별_산출물을_조회한다(employeeId: string, activeOnly?: boolean): Promise<Deliverable[]>;
    WBS항목별_산출물을_조회한다(wbsItemId: string, activeOnly?: boolean): Promise<Deliverable[]>;
    산출물_상세를_조회한다(id: string): Promise<Deliverable>;
    private 평가기간을_조회한다;
}
