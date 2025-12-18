import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EntityManager, Repository } from 'typeorm';
import { IEvaluationCriteriaManagementService } from './interfaces/evaluation-criteria-management.interface';
import { WbsAssignmentValidationService } from './services/wbs-assignment-validation.service';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval';
import type { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { type AvailableProjectsResult, type ProjectAssignmentListResult } from './handlers/project-assignment';
import { type WbsAssignmentDetailResult, type WbsAssignmentListResult } from './handlers/wbs-assignment';
import { type AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult } from './handlers/evaluation-line';
import type { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { WbsItemStatus } from '@domain/common/wbs-item/wbs-item.types';
import type { EvaluationLineMappingDto } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
import type { CreateEvaluationProjectAssignmentData, EvaluationProjectAssignmentDto, EvaluationProjectAssignmentFilter, OrderDirection } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import type { CreateEvaluationWbsAssignmentData, EvaluationWbsAssignmentDto, EvaluationWbsAssignmentFilter, OrderDirection as WbsOrderDirection } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type { CreateWbsEvaluationCriteriaData, UpdateWbsEvaluationCriteriaData, WbsEvaluationCriteriaDto, WbsEvaluationCriteriaFilter } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import { EmployeeInfoDto, ProjectInfoDto } from '@interface/common/dto/evaluation-criteria/project-assignment.dto';
import type { WbsEvaluationCriteriaListResponseDto } from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';
export declare class EvaluationCriteriaManagementService implements IEvaluationCriteriaManagementService {
    private readonly commandBus;
    private readonly queryBus;
    private readonly evaluationLineMappingRepository;
    private readonly evaluationLineRepository;
    private readonly evaluationPeriodEmployeeMappingRepository;
    private readonly wbsAssignmentRepository;
    private readonly wbsAssignmentValidationService;
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly stepApprovalService;
    private readonly logger;
    constructor(commandBus: CommandBus, queryBus: QueryBus, evaluationLineMappingRepository: Repository<EvaluationLineMapping>, evaluationLineRepository: Repository<EvaluationLine>, evaluationPeriodEmployeeMappingRepository: Repository<EvaluationPeriodEmployeeMapping>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, wbsAssignmentValidationService: WbsAssignmentValidationService, evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService, stepApprovalService: EmployeeEvaluationStepApprovalService);
    프로젝트를_할당한다(data: CreateEvaluationProjectAssignmentData, assignedBy: string): Promise<EvaluationProjectAssignmentDto>;
    프로젝트_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;
    프로젝트_할당_목록을_조회한다(filter: EvaluationProjectAssignmentFilter): Promise<ProjectAssignmentListResult>;
    특정_평가기간에_직원에게_할당된_프로젝트를_조회한다(employeeId: string, periodId: string): Promise<{
        projects: ProjectInfoDto[];
    }>;
    프로젝트_할당_상세를_조회한다(assignmentId: string): Promise<EvaluationProjectAssignmentDto | null>;
    특정_평가기간에_프로젝트에_할당된_직원을_조회한다(projectId: string, periodId: string): Promise<{
        employees: EmployeeInfoDto[];
    }>;
    특정_평가기간에_프로젝트가_할당되지_않은_직원_목록을_조회한다(periodId: string, projectId?: string): Promise<{
        employees: EmployeeInfoDto[];
    }>;
    프로젝트를_대량으로_할당한다(assignments: CreateEvaluationProjectAssignmentData[], assignedBy: string): Promise<EvaluationProjectAssignmentDto[]>;
    프로젝트_할당_순서를_변경한다(assignmentId: string, direction: OrderDirection, updatedBy: string): Promise<EvaluationProjectAssignmentDto>;
    프로젝트_할당을_프로젝트_ID로_취소한다(employeeId: string, projectId: string, periodId: string, cancelledBy: string): Promise<void>;
    프로젝트_할당_순서를_프로젝트_ID로_변경한다(employeeId: string, projectId: string, periodId: string, direction: OrderDirection, updatedBy: string): Promise<EvaluationProjectAssignmentDto>;
    WBS_할당_생성_비즈니스_규칙을_검증한다(data: CreateEvaluationWbsAssignmentData, manager?: EntityManager): Promise<void>;
    WBS를_할당한다(data: CreateEvaluationWbsAssignmentData, assignedBy: string): Promise<EvaluationWbsAssignmentDto>;
    WBS_할당을_취소한다(id: string, cancelledBy: string): Promise<void>;
    WBS_할당_목록을_조회한다(filter: EvaluationWbsAssignmentFilter, page?: number, limit?: number, orderBy?: string, orderDirection?: 'ASC' | 'DESC'): Promise<WbsAssignmentListResult>;
    특정_평가기간에_직원에게_할당된_WBS를_조회한다(employeeId: string, periodId: string): Promise<EvaluationWbsAssignmentDto[]>;
    특정_평가기간에_프로젝트의_WBS_할당을_조회한다(projectId: string, periodId: string): Promise<EvaluationWbsAssignmentDto[]>;
    WBS_할당_상세를_조회한다(employeeId: string, wbsItemId: string, projectId: string, periodId: string): Promise<WbsAssignmentDetailResult | null>;
    특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId: string, periodId: string): Promise<EvaluationWbsAssignmentDto[]>;
    WBS항목에_할당된_모든_직원을_조회한다(wbsItemId: string): Promise<EvaluationWbsAssignmentDto[]>;
    특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(projectId: string, periodId: string, employeeId?: string): Promise<WbsItemDto[]>;
    WBS를_대량으로_할당한다(assignments: CreateEvaluationWbsAssignmentData[], assignedBy: string): Promise<EvaluationWbsAssignmentDto[]>;
    평가기간의_WBS_할당을_초기화한다(periodId: string, resetBy: string): Promise<void>;
    프로젝트의_WBS_할당을_초기화한다(projectId: string, periodId: string, resetBy: string): Promise<void>;
    직원의_WBS_할당을_초기화한다(employeeId: string, periodId: string, resetBy: string): Promise<void>;
    WBS_할당_순서를_변경한다(assignmentId: string, direction: WbsOrderDirection, updatedBy: string): Promise<EvaluationWbsAssignmentDto>;
    특정_평가자가_평가해야_하는_피평가자_목록을_조회한다(evaluationPeriodId: string, evaluatorId: string): Promise<{
        evaluatorId: string;
        employees: {
            employeeId: string;
            wbsItemId?: string;
            evaluationLineId: string;
            createdBy?: string;
            updatedBy?: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    평가기간의_평가자_목록을_조회한다(periodId: string, type: 'primary' | 'secondary' | 'all'): Promise<{
        periodId: string;
        type: 'primary' | 'secondary' | 'all';
        evaluators: {
            evaluatorId: string;
            evaluatorName: string;
            departmentName: string;
            evaluatorType: 'primary' | 'secondary';
            evaluateeCount: number;
        }[];
    }>;
    직원_WBS별_평가라인을_구성한다(employeeId: string, wbsItemId: string, periodId: string, createdBy: string): Promise<{
        message: string;
        createdLines: number;
        createdMappings: number;
    }>;
    일차_평가자를_구성한다(employeeId: string, periodId: string, evaluatorId: string, createdBy: string): Promise<{
        message: string;
        createdLines: number;
        createdMappings: number;
        mapping: {
            id: string;
            employeeId: string;
            evaluatorId: string;
            wbsItemId: string | null;
            evaluationLineId: string;
        };
    }>;
    평가기간의_모든_직원에_대해_managerId로_1차_평가자를_자동_구성한다(periodId: string, createdBy: string): Promise<AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult>;
    이차_평가자를_구성한다(employeeId: string, wbsItemId: string, periodId: string, evaluatorId: string, createdBy: string): Promise<{
        message: string;
        createdLines: number;
        createdMappings: number;
        mapping: {
            id: string;
            employeeId: string;
            evaluatorId: string;
            wbsItemId: string;
            evaluationLineId: string;
        };
    }>;
    여러_피평가자의_일차_평가자를_일괄_구성한다(periodId: string, assignments: Array<{
        employeeId: string;
        evaluatorId: string;
    }>, createdBy: string): Promise<{
        periodId: string;
        totalCount: number;
        successCount: number;
        failureCount: number;
        createdLines: number;
        createdMappings: number;
        results: Array<{
            employeeId: string;
            evaluatorId: string;
            status: 'success' | 'error';
            message?: string;
            mapping?: {
                id: string;
                employeeId: string;
                evaluatorId: string;
                wbsItemId: string | null;
                evaluationLineId: string;
            };
            error?: string;
        }>;
    }>;
    여러_피평가자의_이차_평가자를_일괄_구성한다(periodId: string, assignments: Array<{
        employeeId: string;
        wbsItemId: string;
        evaluatorId: string;
    }>, createdBy: string): Promise<{
        periodId: string;
        totalCount: number;
        successCount: number;
        failureCount: number;
        createdLines: number;
        createdMappings: number;
        results: Array<{
            employeeId: string;
            wbsItemId: string;
            evaluatorId: string;
            status: 'success' | 'error';
            message?: string;
            mapping?: {
                id: string;
                employeeId: string;
                evaluatorId: string;
                wbsItemId: string;
                evaluationLineId: string;
            };
            error?: string;
        }>;
    }>;
    WBS_평가기준을_생성한다(data: CreateWbsEvaluationCriteriaData, createdBy: string): Promise<WbsEvaluationCriteriaDto>;
    WBS_평가기준을_수정한다(id: string, data: UpdateWbsEvaluationCriteriaData, updatedBy: string): Promise<WbsEvaluationCriteriaDto>;
    WBS_평가기준을_저장한다(wbsItemId: string, criteria: string, importance: number, subProject: string | undefined, actionBy: string): Promise<WbsEvaluationCriteriaDto>;
    WBS_평가기준을_삭제한다(id: string, deletedBy: string): Promise<boolean>;
    WBS_항목을_생성한다(data: {
        wbsCode: string;
        title: string;
        status: WbsItemStatus;
        level: number;
        assignedToId?: string;
        projectId: string;
        parentWbsId?: string;
        startDate?: Date;
        endDate?: Date;
        progressPercentage?: number;
    }, createdBy: string): Promise<WbsItemDto>;
    WBS_항목을_생성하고_코드를_자동_생성한다(data: {
        title: string;
        status: WbsItemStatus;
        level: number;
        assignedToId?: string;
        projectId: string;
        parentWbsId?: string;
        startDate?: Date;
        endDate?: Date;
        progressPercentage?: number;
    }, createdBy: string): Promise<WbsItemDto>;
    private WBS_코드를_자동_생성한다;
    WBS_항목을_수정한다(id: string, data: {
        title?: string;
        status?: WbsItemStatus;
        startDate?: Date;
        endDate?: Date;
        progressPercentage?: number;
    }, updatedBy: string): Promise<WbsItemDto>;
    프로젝트별_WBS_목록을_조회한다(projectId: string): Promise<WbsItemDto[]>;
    WBS_항목의_평가기준을_전체삭제한다(wbsItemId: string, deletedBy: string): Promise<boolean>;
    WBS_평가기준_목록을_조회한다(filter: WbsEvaluationCriteriaFilter): Promise<WbsEvaluationCriteriaListResponseDto>;
    WBS_평가기준_상세를_조회한다(id: string): Promise<{
        id: string;
        criteria: string;
        importance: number;
        createdAt: Date;
        updatedAt: Date;
        wbsItem: {
            id: string;
            wbsCode: string;
            title: string;
            status: string;
            level: number;
            startDate: Date;
            endDate: Date;
            progressPercentage: string;
        } | null;
    } | null>;
    특정_WBS항목의_평가기준을_조회한다(wbsItemId: string): Promise<WbsEvaluationCriteriaDto[]>;
    특정_평가기간에_직원의_평가설정을_통합_조회한다(employeeId: string, periodId: string): Promise<{
        projectAssignments: EvaluationProjectAssignmentDto[];
        wbsAssignments: EvaluationWbsAssignmentDto[];
        evaluationLineMappings: EvaluationLineMappingDto[];
    }>;
    평가라인을_검증한다(evaluateeId: string, evaluatorId: string, wbsId: string, evaluationType: 'primary' | 'secondary'): Promise<void>;
    할당_가능한_프로젝트_목록을_조회한다(periodId: string, options?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    }): Promise<AvailableProjectsResult>;
    평가기준을_제출한다(evaluationPeriodId: string, employeeId: string, submittedBy: string): Promise<EvaluationPeriodEmployeeMappingDto>;
    평가기준_제출을_초기화한다(evaluationPeriodId: string, employeeId: string, updatedBy: string): Promise<EvaluationPeriodEmployeeMappingDto>;
}
