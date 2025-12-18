import { Repository } from 'typeorm';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { ProjectService } from '@domain/common/project/project.service';
import { EvaluationLineService } from '@domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import type { OrderDirection } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
export declare class WbsAssignmentBusinessService {
    private readonly evaluationCriteriaManagementService;
    private readonly activityLogContextService;
    private readonly performanceEvaluationService;
    private readonly employeeService;
    private readonly projectService;
    private readonly evaluationLineService;
    private readonly evaluationLineMappingService;
    private readonly evaluationWbsAssignmentService;
    private readonly wbsAssignmentRepository;
    private readonly logger;
    constructor(evaluationCriteriaManagementService: EvaluationCriteriaManagementService, activityLogContextService: EvaluationActivityLogContextService, performanceEvaluationService: PerformanceEvaluationService, employeeService: EmployeeService, projectService: ProjectService, evaluationLineService: EvaluationLineService, evaluationLineMappingService: EvaluationLineMappingService, evaluationWbsAssignmentService: EvaluationWbsAssignmentService, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>);
    WBS를_할당한다(params: {
        employeeId: string;
        wbsItemId: string;
        projectId: string;
        periodId: string;
        assignedBy: string;
    }): Promise<any>;
    WBS_할당을_취소한다(params: {
        assignmentId: string;
        cancelledBy: string;
    }): Promise<void>;
    WBS_할당을_WBS_ID로_취소한다(params: {
        employeeId: string;
        wbsItemId: string;
        projectId: string;
        periodId: string;
        cancelledBy: string;
    }): Promise<void>;
    WBS를_대량으로_할당한다(params: {
        assignments: Array<{
            employeeId: string;
            wbsItemId: string;
            projectId: string;
            periodId: string;
            assignedBy: string;
        }>;
        assignedBy: string;
    }): Promise<any[]>;
    WBS_할당_순서를_변경한다(params: {
        assignmentId: string;
        direction: OrderDirection;
        updatedBy: string;
    }): Promise<any>;
    WBS_할당_순서를_WBS_ID로_변경한다(params: {
        employeeId: string;
        wbsItemId: string;
        projectId: string;
        periodId: string;
        direction: OrderDirection;
        updatedBy: string;
    }): Promise<any>;
    평가기간의_WBS_할당을_초기화한다(params: {
        periodId: string;
        resetBy: string;
    }): Promise<void>;
    프로젝트의_WBS_할당을_초기화한다(params: {
        projectId: string;
        periodId: string;
        resetBy: string;
    }): Promise<void>;
    직원의_WBS_할당을_초기화한다(params: {
        employeeId: string;
        periodId: string;
        resetBy: string;
    }): Promise<void>;
    WBS_할당_목록을_조회한다(params: {
        periodId?: string;
        employeeId?: string;
        wbsItemId?: string;
        projectId?: string;
        page?: number;
        limit?: number;
        orderBy?: string;
        orderDirection?: 'ASC' | 'DESC';
    }): Promise<any>;
    WBS_할당_상세를_조회한다(employeeId: string, wbsItemId: string, projectId: string, periodId: string): Promise<any>;
    특정_평가기간에_직원에게_할당된_WBS를_조회한다(employeeId: string, periodId: string): Promise<any[]>;
    특정_평가기간에_프로젝트의_WBS_할당을_조회한다(projectId: string, periodId: string): Promise<any[]>;
    특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId: string, periodId: string): Promise<any[]>;
    특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(projectId: string, periodId: string, employeeId?: string): Promise<WbsItemDto[]>;
    private 평가라인을_자동으로_구성한다;
    private 평가라인_매핑을_삭제한다;
    private 기존_1차_평가자를_조회한다;
    WBS를_생성하고_할당한다(params: {
        title: string;
        projectId: string;
        employeeId: string;
        periodId: string;
        createdBy: string;
    }): Promise<{
        wbsItem: WbsItemDto;
        assignment: any;
    }>;
    WBS를_사이에_생성하고_할당한다(params: {
        title: string;
        projectId: string;
        employeeId: string;
        periodId: string;
        previousWbsItemId?: string;
        nextWbsItemId?: string;
        createdBy: string;
    }): Promise<{
        wbsItem: WbsItemDto;
        assignment: any;
    }>;
    private 전체_WBS_할당_순서를_재정렬한다;
    WBS_항목_이름을_수정한다(params: {
        wbsItemId: string;
        title: string;
        updatedBy: string;
    }): Promise<WbsItemDto>;
}
