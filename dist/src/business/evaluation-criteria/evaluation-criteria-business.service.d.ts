import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import type { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
export declare class EvaluationCriteriaBusinessService {
    private readonly evaluationCriteriaManagementService;
    private readonly revisionRequestContextService;
    private readonly activityLogContextService;
    private readonly stepApprovalContextService;
    private readonly logger;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, revisionRequestContextService: RevisionRequestContextService, activityLogContextService: EvaluationActivityLogContextService, stepApprovalContextService: StepApprovalContextService);
    평가기준을_제출하고_재작성요청을_완료한다(evaluationPeriodId: string, employeeId: string, submittedBy: string): Promise<EvaluationPeriodEmployeeMappingDto>;
}
