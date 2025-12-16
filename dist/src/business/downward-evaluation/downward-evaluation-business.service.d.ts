import { Repository } from 'typeorm';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { NotificationHelperService } from '@domain/common/notification';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
export declare class DownwardEvaluationBusinessService {
    private readonly performanceEvaluationService;
    private readonly evaluationCriteriaManagementService;
    private readonly evaluationPeriodManagementContextService;
    private readonly revisionRequestContextService;
    private readonly stepApprovalContextService;
    private readonly activityLogContextService;
    private readonly notificationHelper;
    private readonly evaluationPeriodService;
    private readonly wbsSelfEvaluationRepository;
    private readonly downwardEvaluationRepository;
    private readonly logger;
    constructor(performanceEvaluationService: PerformanceEvaluationService, evaluationCriteriaManagementService: EvaluationCriteriaManagementService, evaluationPeriodManagementContextService: EvaluationPeriodManagementContextService, revisionRequestContextService: RevisionRequestContextService, stepApprovalContextService: StepApprovalContextService, activityLogContextService: EvaluationActivityLogContextService, notificationHelper: NotificationHelperService, evaluationPeriodService: EvaluationPeriodService, wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>, downwardEvaluationRepository: Repository<DownwardEvaluation>);
    일차_하향평가를_저장한다(params: {
        evaluatorId: string;
        evaluateeId: string;
        periodId: string;
        wbsId: string;
        selfEvaluationId?: string;
        downwardEvaluationContent?: string;
        downwardEvaluationScore?: number;
        actionBy: string;
    }): Promise<string>;
    이차_하향평가를_저장한다(params: {
        evaluatorId: string;
        evaluateeId: string;
        periodId: string;
        wbsId: string;
        selfEvaluationId?: string;
        downwardEvaluationContent?: string;
        downwardEvaluationScore?: number;
        actionBy: string;
    }): Promise<string>;
    일차_하향평가를_제출하고_재작성요청을_완료한다(evaluateeId: string, periodId: string, wbsId: string, evaluatorId: string, submittedBy: string, approveAllBelow?: boolean): Promise<void>;
    private 피평가자에게_알림을_전송한다;
    이차_하향평가를_제출하고_재작성요청을_완료한다(evaluateeId: string, periodId: string, wbsId: string, evaluatorId: string, submittedBy: string, approveAllBelow?: boolean): Promise<void>;
    일차_하향평가_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId: string, employeeId: string, revisionComment: string, requestedBy: string): Promise<void>;
    이차_하향평가_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId: string, employeeId: string, evaluatorId: string, revisionComment: string, requestedBy: string): Promise<import('@domain/sub/secondary-evaluation-step-approval').SecondaryEvaluationStepApproval>;
    피평가자의_모든_하향평가를_일괄_제출한다(evaluatorId: string, evaluateeId: string, periodId: string, evaluationType: DownwardEvaluationType, submittedBy: string, approveAllBelow?: boolean): Promise<{
        submittedCount: number;
        skippedCount: number;
        failedCount: number;
        submittedIds: string[];
        skippedIds: string[];
        failedItems: Array<{
            evaluationId: string;
            error: string;
        }>;
    }>;
    private 자기평가를_자동_제출한다;
    private 일차_하향평가를_자동_제출한다;
}
