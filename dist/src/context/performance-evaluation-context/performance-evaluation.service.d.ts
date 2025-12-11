import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { SecondaryEvaluationStepApprovalService } from '@domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.service';
import { StepApprovalContextService } from '../step-approval-context/step-approval-context.service';
import { Employee } from '@domain/common/employee/employee.entity';
import { GetEmployeeSelfEvaluationsQuery, GetWbsSelfEvaluationDetailQuery } from './handlers/self-evaluation';
import type { SubmitAllWbsSelfEvaluationsResponse, SubmitAllWbsSelfEvaluationsToEvaluatorResponse, SubmitAllWbsSelfEvaluationsForApprovalResponse, ResetAllWbsSelfEvaluationsResponse, SubmitWbsSelfEvaluationsByProjectResponse, SubmitWbsSelfEvaluationsToEvaluatorByProjectResponse, ResetWbsSelfEvaluationsByProjectResponse, ResetAllWbsSelfEvaluationsToEvaluatorResponse, ResetWbsSelfEvaluationsToEvaluatorByProjectResponse, ClearAllWbsSelfEvaluationsResponse, ClearWbsSelfEvaluationsByProjectResponse, DeleteWbsSelfEvaluationsByAssignmentResponse } from './handlers/self-evaluation';
import { GetPeerEvaluationDetailQuery, GetPeerEvaluationListQuery, GetEvaluatorAssignedEvaluateesQuery, type PeerEvaluationQuestionDetail } from './handlers/peer-evaluation';
import { GetDownwardEvaluationDetailQuery, GetDownwardEvaluationListQuery } from './handlers/downward-evaluation';
import { GetFinalEvaluationByEmployeePeriodQuery, GetFinalEvaluationListQuery, GetFinalEvaluationQuery } from './handlers/final-evaluation';
import { type BulkDeliverableData } from './handlers/deliverable/command';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
import { EmployeeSelfEvaluationsResponseDto, WbsSelfEvaluationBasicDto, WbsSelfEvaluationResponseDto } from '@interface/common/dto/performance-evaluation/wbs-self-evaluation.dto';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { IPerformanceEvaluationService } from './interfaces/performance-evaluation.interface';
export declare class PerformanceEvaluationService implements IPerformanceEvaluationService {
    private readonly commandBus;
    private readonly queryBus;
    private readonly mappingRepository;
    private readonly employeeRepository;
    private readonly secondaryStepApprovalService;
    private readonly stepApprovalContextService;
    private readonly logger;
    constructor(commandBus: CommandBus, queryBus: QueryBus, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, employeeRepository: Repository<Employee>, secondaryStepApprovalService: SecondaryEvaluationStepApprovalService, stepApprovalContextService: StepApprovalContextService);
    WBS자기평가를_생성한다(periodId: string, employeeId: string, wbsItemId: string, selfEvaluationContent: string, selfEvaluationScore: number, performanceResult?: string, createdBy?: string): Promise<WbsSelfEvaluationResponseDto>;
    WBS자기평가를_수정한다(evaluationId: string, selfEvaluationContent?: string, selfEvaluationScore?: number, performanceResult?: string, updatedBy?: string): Promise<WbsSelfEvaluationBasicDto>;
    WBS자기평가를_저장한다(periodId: string, employeeId: string, wbsItemId: string, selfEvaluationContent?: string, selfEvaluationScore?: number, performanceResult?: string, actionBy?: string): Promise<WbsSelfEvaluationResponseDto>;
    WBS자기평가를_제출한다(evaluationId: string, submittedBy?: string): Promise<WbsSelfEvaluationResponseDto>;
    피평가자가_1차평가자에게_자기평가를_제출한다(evaluationId: string, submittedBy?: string): Promise<WbsSelfEvaluationResponseDto>;
    직원의_전체_WBS자기평가를_제출한다(employeeId: string, periodId: string, submittedBy?: string): Promise<SubmitAllWbsSelfEvaluationsResponse>;
    직원의_전체_자기평가를_1차평가자에게_제출한다(employeeId: string, periodId: string, submittedBy?: string): Promise<SubmitAllWbsSelfEvaluationsToEvaluatorResponse>;
    직원의_전체_자기평가를_승인시_제출한다(employeeId: string, periodId: string, submittedBy?: string): Promise<SubmitAllWbsSelfEvaluationsForApprovalResponse>;
    WBS자기평가를_초기화한다(evaluationId: string, resetBy?: string): Promise<WbsSelfEvaluationResponseDto>;
    직원의_전체_WBS자기평가를_초기화한다(employeeId: string, periodId: string, resetBy?: string): Promise<ResetAllWbsSelfEvaluationsResponse>;
    프로젝트별_WBS자기평가를_제출한다(employeeId: string, periodId: string, projectId: string, submittedBy?: string): Promise<SubmitWbsSelfEvaluationsByProjectResponse>;
    프로젝트별_자기평가를_1차평가자에게_제출한다(employeeId: string, periodId: string, projectId: string, submittedBy?: string): Promise<SubmitWbsSelfEvaluationsToEvaluatorByProjectResponse>;
    피평가자가_1차평가자에게_제출한_자기평가를_취소한다(evaluationId: string, resetBy?: string): Promise<WbsSelfEvaluationResponseDto>;
    직원의_전체_자기평가를_1차평가자_제출_취소한다(employeeId: string, periodId: string, resetBy?: string): Promise<ResetAllWbsSelfEvaluationsToEvaluatorResponse>;
    프로젝트별_자기평가를_1차평가자_제출_취소한다(employeeId: string, periodId: string, projectId: string, resetBy?: string): Promise<ResetWbsSelfEvaluationsToEvaluatorByProjectResponse>;
    프로젝트별_WBS자기평가를_초기화한다(employeeId: string, periodId: string, projectId: string, resetBy?: string): Promise<ResetWbsSelfEvaluationsByProjectResponse>;
    직원의_자기평가_목록을_조회한다(query: GetEmployeeSelfEvaluationsQuery): Promise<EmployeeSelfEvaluationsResponseDto>;
    WBS자기평가_상세정보를_조회한다(query: GetWbsSelfEvaluationDetailQuery): Promise<any>;
    동료평가를_생성한다(evaluatorId: string, evaluateeId: string, periodId: string, projectId: string, requestDeadline?: Date, evaluationContent?: string, score?: number, createdBy?: string): Promise<string>;
    동료평가를_수정한다(evaluationId: string, evaluationContent?: string, score?: number, updatedBy?: string): Promise<void>;
    동료평가를_취소한다(evaluationId: string, cancelledBy: string): Promise<void>;
    피평가자의_동료평가를_일괄_취소한다(evaluateeId: string, periodId: string, cancelledBy: string): Promise<{
        cancelledCount: number;
    }>;
    동료평가를_제출한다(evaluationId: string, submittedBy?: string): Promise<void>;
    동료평가_목록을_조회한다(query: GetPeerEvaluationListQuery): Promise<any>;
    동료평가_상세정보를_조회한다(query: GetPeerEvaluationDetailQuery): Promise<any>;
    평가자에게_할당된_피평가자_목록을_조회한다(query: GetEvaluatorAssignedEvaluateesQuery): Promise<any>;
    하향평가를_생성한다(evaluatorId: string, evaluateeId: string, periodId: string, projectId: string, selfEvaluationId?: string, evaluationType?: string, downwardEvaluationContent?: string, downwardEvaluationScore?: number, createdBy?: string): Promise<string>;
    하향평가를_수정한다(evaluationId: string, downwardEvaluationContent?: string, downwardEvaluationScore?: number, updatedBy?: string): Promise<void>;
    하향평가를_저장한다(evaluatorId: string, evaluateeId: string, periodId: string, wbsId: string, selfEvaluationId?: string, evaluationType?: string, downwardEvaluationContent?: string, downwardEvaluationScore?: number, actionBy?: string): Promise<string>;
    일차_하향평가를_제출한다(evaluateeId: string, periodId: string, wbsId: string, evaluatorId: string, submittedBy: string): Promise<void>;
    이차_하향평가를_제출한다(evaluateeId: string, periodId: string, wbsId: string, evaluatorId: string, submittedBy: string): Promise<void>;
    하향평가를_제출한다(evaluationId: string, submittedBy?: string): Promise<void>;
    피평가자의_모든_하향평가를_일괄_제출한다(evaluatorId: string, evaluateeId: string, periodId: string, evaluationType: DownwardEvaluationType, submittedBy: string, forceSubmit?: boolean): Promise<{
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
    피평가자의_모든_하향평가를_일괄_초기화한다(evaluatorId: string, evaluateeId: string, periodId: string, evaluationType: DownwardEvaluationType, resetBy: string): Promise<{
        resetCount: number;
        skippedCount: number;
        failedCount: number;
        resetIds: string[];
        skippedIds: string[];
        failedItems: Array<{
            evaluationId: string;
            error: string;
        }>;
    }>;
    일차_하향평가를_초기화한다(evaluateeId: string, periodId: string, wbsId: string, evaluatorId: string, resetBy: string): Promise<void>;
    이차_하향평가를_초기화한다(evaluateeId: string, periodId: string, wbsId: string, evaluatorId: string, resetBy: string): Promise<void>;
    하향평가_목록을_조회한다(query: GetDownwardEvaluationListQuery): Promise<any>;
    하향평가_상세정보를_조회한다(query: GetDownwardEvaluationDetailQuery): Promise<any>;
    최종평가를_생성한다(employeeId: string, periodId: string, evaluationGrade: string, jobGrade: any, jobDetailedGrade: any, finalComments?: string, createdBy?: string): Promise<string>;
    최종평가를_수정한다(id: string, evaluationGrade?: string, jobGrade?: any, jobDetailedGrade?: any, finalComments?: string, updatedBy?: string): Promise<void>;
    최종평가를_저장한다(employeeId: string, periodId: string, evaluationGrade: string, jobGrade: any, jobDetailedGrade: any, finalComments?: string, actionBy?: string): Promise<string>;
    최종평가를_삭제한다(id: string, deletedBy?: string): Promise<void>;
    최종평가를_확정한다(id: string, confirmedBy: string): Promise<void>;
    최종평가_확정을_취소한다(id: string, updatedBy: string): Promise<void>;
    최종평가를_조회한다(query: GetFinalEvaluationQuery): Promise<any>;
    최종평가_목록을_조회한다(query: GetFinalEvaluationListQuery): Promise<any>;
    직원_평가기간별_최종평가를_조회한다(query: GetFinalEvaluationByEmployeePeriodQuery): Promise<any>;
    평가기간별_모든_평가_수정_가능_상태를_변경한다(evaluationPeriodId: string, isSelfEvaluationEditable: boolean, isPrimaryEvaluationEditable: boolean, isSecondaryEvaluationEditable: boolean, updatedBy?: string): Promise<any>;
    WBS자기평가_내용을_초기화한다(data: {
        evaluationId: string;
        clearedBy?: string;
    }): Promise<WbsSelfEvaluationDto>;
    직원의_전체_WBS자기평가_내용을_초기화한다(data: {
        employeeId: string;
        periodId: string;
        clearedBy?: string;
    }): Promise<ClearAllWbsSelfEvaluationsResponse>;
    프로젝트별_WBS자기평가_내용을_초기화한다(data: {
        employeeId: string;
        periodId: string;
        projectId: string;
        clearedBy?: string;
    }): Promise<ClearWbsSelfEvaluationsByProjectResponse>;
    WBS할당_자기평가를_삭제한다(data: {
        employeeId: string;
        periodId: string;
        wbsItemId: string;
        deletedBy: string;
    }): Promise<DeleteWbsSelfEvaluationsByAssignmentResponse>;
    동료평가에_질문그룹을_추가한다(peerEvaluationId: string, questionGroupId: string, startDisplayOrder: number, createdBy: string): Promise<string[]>;
    동료평가에_질문을_추가한다(peerEvaluationId: string, questionId: string, displayOrder: number, questionGroupId: string | undefined, createdBy: string): Promise<string>;
    동료평가에_질문을_매핑한다(peerEvaluationId: string, questionIds: string[], createdBy: string): Promise<string[]>;
    동료평가에서_질문을_제거한다(mappingId: string, deletedBy: string): Promise<void>;
    동료평가_질문_순서를_변경한다(mappingId: string, newDisplayOrder: number, updatedBy: string): Promise<void>;
    동료평가의_질문목록을_조회한다(peerEvaluationId: string): Promise<PeerEvaluationQuestionDetail[]>;
    동료평가_답변을_저장한다(peerEvaluationId: string, answers: Array<{
        questionId: string;
        answer: string;
    }>, answeredBy: string): Promise<number>;
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
        deliverables: BulkDeliverableData[];
        createdBy: string;
    }): Promise<{
        successCount: number;
        failedCount: number;
        createdIds: string[];
        failedItems: Array<{
            data: Partial<BulkDeliverableData>;
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
}
