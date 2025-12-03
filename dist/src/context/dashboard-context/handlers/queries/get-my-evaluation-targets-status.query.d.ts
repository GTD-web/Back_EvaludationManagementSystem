import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationActivityLog } from '@domain/core/evaluation-activity-log/evaluation-activity-log.entity';
import { MyEvaluationTargetStatusDto } from '../../interfaces/dashboard-context.interface';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
export declare class GetMyEvaluationTargetsStatusQuery {
    readonly evaluationPeriodId: string;
    readonly evaluatorId: string;
    constructor(evaluationPeriodId: string, evaluatorId: string);
}
export declare class GetMyEvaluationTargetsStatusHandler implements IQueryHandler<GetMyEvaluationTargetsStatusQuery> {
    private readonly lineMappingRepository;
    private readonly lineRepository;
    private readonly mappingRepository;
    private readonly downwardEvaluationRepository;
    private readonly projectAssignmentRepository;
    private readonly wbsAssignmentRepository;
    private readonly wbsCriteriaRepository;
    private readonly wbsSelfEvaluationRepository;
    private readonly evaluationPeriodRepository;
    private readonly activityLogRepository;
    private readonly stepApprovalService;
    private readonly logger;
    constructor(lineMappingRepository: Repository<EvaluationLineMapping>, lineRepository: Repository<EvaluationLine>, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, downwardEvaluationRepository: Repository<DownwardEvaluation>, projectAssignmentRepository: Repository<EvaluationProjectAssignment>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, wbsCriteriaRepository: Repository<WbsEvaluationCriteria>, wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>, evaluationPeriodRepository: Repository<EvaluationPeriod>, activityLogRepository: Repository<EvaluationActivityLog>, stepApprovalService: EmployeeEvaluationStepApprovalService);
    execute(query: GetMyEvaluationTargetsStatusQuery): Promise<MyEvaluationTargetStatusDto[]>;
    private 내가_담당하는_하향평가_현황을_조회한다;
    private 성과입력_상태를_조회한다;
    private 성과입력_상태를_계산한다;
    private 평가항목_상태를_계산한다;
    private WBS평가기준_상태를_계산한다;
    private 일차평가_제출_여부를_확인한다;
    private 이차평가_상태에_일차평가확인여부를_추가한다;
    private 평가자_확인여부를_계산한다;
}
