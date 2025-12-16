import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { IEvaluationCriteriaManagementService } from './interfaces/evaluation-criteria-management.interface';
import { WbsAssignmentValidationService } from './services/wbs-assignment-validation.service';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval';
import type { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

// Project Assignment Commands & Queries
import {
  BulkCreateProjectAssignmentCommand,
  CancelProjectAssignmentCommand,
  ChangeProjectAssignmentOrderCommand,
  CreateProjectAssignmentCommand,
  GetAvailableProjectsQuery,
  GetEmployeeProjectAssignmentsQuery,
  GetProjectAssignedEmployeesQuery,
  GetProjectAssignmentDetailQuery,
  GetProjectAssignmentListQuery,
  GetUnassignedEmployeesQuery,
  type AvailableProjectsResult,
  type ProjectAssignmentListResult,
} from './handlers/project-assignment';

// WBS Assignment Commands & Queries
import {
  BulkCreateWbsAssignmentCommand,
  CancelWbsAssignmentCommand,
  ChangeWbsAssignmentOrderCommand,
  CreateWbsAssignmentCommand,
  GetEmployeeWbsAssignmentsQuery,
  GetProjectWbsAssignmentsQuery,
  GetUnassignedWbsItemsQuery,
  GetWbsAssignmentDetailQuery,
  GetWbsAssignmentListQuery,
  GetWbsItemAssignmentsQuery,
  ResetEmployeeWbsAssignmentsCommand,
  ResetPeriodWbsAssignmentsCommand,
  ResetProjectWbsAssignmentsCommand,
  type WbsAssignmentDetailResult,
  type WbsAssignmentListResult,
} from './handlers/wbs-assignment';

// WBS Evaluation Criteria Commands & Queries
import {
  CreateWbsEvaluationCriteriaCommand,
  DeleteWbsEvaluationCriteriaCommand,
  DeleteWbsItemEvaluationCriteriaCommand,
  GetWbsEvaluationCriteriaDetailQuery,
  GetWbsEvaluationCriteriaListQuery,
  GetWbsItemEvaluationCriteriaQuery,
  UpdateWbsEvaluationCriteriaCommand,
} from './handlers/wbs-evaluation-criteria';

// WBS Item Commands & Queries
import {
  CreateWbsItemCommand,
  GetWbsItemsByProjectQuery,
  UpdateWbsItemCommand,
} from './handlers/wbs-item';

// Evaluation Line Commands & Queries
import {
  AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand,
  ConfigureEmployeeWbsEvaluationLineCommand,
  ConfigurePrimaryEvaluatorCommand,
  ConfigureSecondaryEvaluatorCommand,
  GetEmployeeEvaluationSettingsQuery,
  GetEvaluatorEmployeesQuery,
  GetEvaluatorsByPeriodQuery,
  type AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult,
} from './handlers/evaluation-line';

import type { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { WbsItemStatus } from '@domain/common/wbs-item/wbs-item.types';
import type { EvaluationLineMappingDto } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
import type {
  CreateEvaluationProjectAssignmentData,
  EvaluationProjectAssignmentDto,
  EvaluationProjectAssignmentFilter,
  OrderDirection,
} from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import type {
  CreateEvaluationWbsAssignmentData,
  EvaluationWbsAssignmentDto,
  EvaluationWbsAssignmentFilter,
  OrderDirection as WbsOrderDirection,
} from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type {
  CreateWbsEvaluationCriteriaData,
  UpdateWbsEvaluationCriteriaData,
  WbsEvaluationCriteriaDto,
  WbsEvaluationCriteriaFilter,
} from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import {
  EmployeeInfoDto,
  ProjectInfoDto,
} from '@interface/common/dto/evaluation-criteria/project-assignment.dto';
import type { WbsEvaluationCriteriaListResponseDto } from '@interface/common/dto/evaluation-criteria/wbs-evaluation-criteria.dto';

/**
 * 평가기준관리 서비스 (MVP 버전)
 *
 * MVP에서는 핵심 기능인 프로젝트 할당과 WBS 할당 관리만 제공합니다.
 * - 프로젝트 할당 관리
 * - WBS 할당 관리
 */
@Injectable()
export class EvaluationCriteriaManagementService
  implements IEvaluationCriteriaManagementService
{
  private readonly logger = new Logger(
    EvaluationCriteriaManagementService.name,
  );

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly evaluationPeriodEmployeeMappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    private readonly wbsAssignmentValidationService: WbsAssignmentValidationService,
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
  ) {}

  // ============================================================================
  // 프로젝트 할당 관리
  // ============================================================================

  async 프로젝트를_할당한다(
    data: CreateEvaluationProjectAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto> {
    const command = new CreateProjectAssignmentCommand(data, assignedBy);
    return await this.commandBus.execute(command);
  }

  async 프로젝트_할당을_취소한다(
    id: string,
    cancelledBy: string,
  ): Promise<void> {
    const command = new CancelProjectAssignmentCommand(id, cancelledBy);
    await this.commandBus.execute(command);
  }

  async 프로젝트_할당_목록을_조회한다(
    filter: EvaluationProjectAssignmentFilter,
  ): Promise<ProjectAssignmentListResult> {
    const query = new GetProjectAssignmentListQuery(filter);
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_직원에게_할당된_프로젝트를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{ projects: ProjectInfoDto[] }> {
    const query = new GetEmployeeProjectAssignmentsQuery(employeeId, periodId);
    return await this.queryBus.execute(query);
  }

  async 프로젝트_할당_상세를_조회한다(
    assignmentId: string,
  ): Promise<EvaluationProjectAssignmentDto | null> {
    const query = new GetProjectAssignmentDetailQuery(assignmentId);
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_프로젝트에_할당된_직원을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<{ employees: EmployeeInfoDto[] }> {
    const query = new GetProjectAssignedEmployeesQuery(projectId, periodId);
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_프로젝트가_할당되지_않은_직원_목록을_조회한다(
    periodId: string,
    projectId?: string,
  ): Promise<{ employees: EmployeeInfoDto[] }> {
    const query = new GetUnassignedEmployeesQuery(periodId, projectId);
    return await this.queryBus.execute(query);
  }

  async 프로젝트를_대량으로_할당한다(
    assignments: CreateEvaluationProjectAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const command = new BulkCreateProjectAssignmentCommand(
      assignments,
      assignedBy,
    );
    return await this.commandBus.execute(command);
  }

  async 프로젝트_할당_순서를_변경한다(
    assignmentId: string,
    direction: OrderDirection,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto> {
    const command = new ChangeProjectAssignmentOrderCommand(
      assignmentId,
      direction,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  async 프로젝트_할당을_프로젝트_ID로_취소한다(
    employeeId: string,
    projectId: string,
    periodId: string,
    cancelledBy: string,
  ): Promise<void> {
    // 1. 프로젝트 할당 목록 조회하여 할당 ID 찾기
    const assignmentList = await this.프로젝트_할당_목록을_조회한다({
      employeeId,
      projectId,
      periodId,
      page: 1,
      limit: 1,
    });

    if (
      !assignmentList.assignments ||
      assignmentList.assignments.length === 0
    ) {
      // 멱등성 보장: 할당이 없으면 성공 처리
      return;
    }

    // 2. 할당 ID를 사용하여 취소
    const assignmentId = assignmentList.assignments[0].id;
    await this.프로젝트_할당을_취소한다(assignmentId, cancelledBy);
  }

  async 프로젝트_할당_순서를_프로젝트_ID로_변경한다(
    employeeId: string,
    projectId: string,
    periodId: string,
    direction: OrderDirection,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto> {
    // 1. 프로젝트 할당 목록 조회하여 할당 ID 찾기
    const assignmentList = await this.프로젝트_할당_목록을_조회한다({
      employeeId,
      projectId,
      periodId,
      page: 1,
      limit: 1,
    });

    if (
      !assignmentList.assignments ||
      assignmentList.assignments.length === 0
    ) {
      throw new NotFoundException(
        `프로젝트 할당을 찾을 수 없습니다. (employeeId: ${employeeId}, projectId: ${projectId}, periodId: ${periodId})`,
      );
    }

    // 2. 할당 ID를 사용하여 순서 변경
    const assignmentId = assignmentList.assignments[0].id;
    return await this.프로젝트_할당_순서를_변경한다(
      assignmentId,
      direction,
      updatedBy,
    );
  }

  // ============================================================================
  // WBS 할당 관리
  // ============================================================================

  /**
   * WBS 할당 생성 비즈니스 규칙을 검증한다
   * Context 레벨에서 비즈니스 로직 검증 및 예외 처리를 수행
   */
  async WBS_할당_생성_비즈니스_규칙을_검증한다(
    data: CreateEvaluationWbsAssignmentData,
    manager?: EntityManager,
  ): Promise<void> {
    await this.wbsAssignmentValidationService.할당생성비즈니스규칙검증한다(
      data,
      manager,
    );
  }

  async WBS를_할당한다(
    data: CreateEvaluationWbsAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationWbsAssignmentDto> {
    const command = new CreateWbsAssignmentCommand(data, assignedBy);
    return await this.commandBus.execute(command);
  }

  async WBS_할당을_취소한다(id: string, cancelledBy: string): Promise<void> {
    const command = new CancelWbsAssignmentCommand(id, cancelledBy);
    await this.commandBus.execute(command);
  }

  async WBS_할당_목록을_조회한다(
    filter: EvaluationWbsAssignmentFilter,
    page?: number,
    limit?: number,
    orderBy?: string,
    orderDirection?: 'ASC' | 'DESC',
  ): Promise<WbsAssignmentListResult> {
    const query = new GetWbsAssignmentListQuery(
      filter,
      page,
      limit,
      orderBy,
      orderDirection,
    );
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_직원에게_할당된_WBS를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const query = new GetEmployeeWbsAssignmentsQuery(employeeId, periodId);
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const query = new GetProjectWbsAssignmentsQuery(projectId, periodId);
    return await this.queryBus.execute(query);
  }

  async WBS_할당_상세를_조회한다(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
  ): Promise<WbsAssignmentDetailResult | null> {
    const query = new GetWbsAssignmentDetailQuery(
      employeeId,
      wbsItemId,
      projectId,
      periodId,
    );
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
    wbsItemId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const query = new GetWbsItemAssignmentsQuery(wbsItemId, periodId);
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
    projectId: string,
    periodId: string,
    employeeId?: string,
  ): Promise<WbsItemDto[]> {
    const query = new GetUnassignedWbsItemsQuery(
      projectId,
      periodId,
      employeeId,
    );
    return await this.queryBus.execute(query);
  }

  async WBS를_대량으로_할당한다(
    assignments: CreateEvaluationWbsAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const command = new BulkCreateWbsAssignmentCommand(assignments, assignedBy);
    return await this.commandBus.execute(command);
  }

  async 평가기간의_WBS_할당을_초기화한다(
    periodId: string,
    resetBy: string,
  ): Promise<void> {
    const command = new ResetPeriodWbsAssignmentsCommand(periodId, resetBy);
    await this.commandBus.execute(command);
  }

  async 프로젝트의_WBS_할당을_초기화한다(
    projectId: string,
    periodId: string,
    resetBy: string,
  ): Promise<void> {
    const command = new ResetProjectWbsAssignmentsCommand(
      projectId,
      periodId,
      resetBy,
    );
    await this.commandBus.execute(command);
  }

  async 직원의_WBS_할당을_초기화한다(
    employeeId: string,
    periodId: string,
    resetBy: string,
  ): Promise<void> {
    const command = new ResetEmployeeWbsAssignmentsCommand(
      employeeId,
      periodId,
      resetBy,
    );
    await this.commandBus.execute(command);
  }

  async WBS_할당_순서를_변경한다(
    assignmentId: string,
    direction: WbsOrderDirection,
    updatedBy: string,
  ): Promise<EvaluationWbsAssignmentDto> {
    const command = new ChangeWbsAssignmentOrderCommand(
      assignmentId,
      direction,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  // ============================================================================
  // 평가라인 관리 (CQRS 패턴)
  // ============================================================================

  async 특정_평가자가_평가해야_하는_피평가자_목록을_조회한다(
    evaluationPeriodId: string,
    evaluatorId: string,
  ): Promise<{
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
  }> {
    const query = new GetEvaluatorEmployeesQuery(
      evaluationPeriodId,
      evaluatorId,
    );
    return await this.queryBus.execute(query);
  }

  async 평가기간의_평가자_목록을_조회한다(
    periodId: string,
    type: 'primary' | 'secondary' | 'all',
  ): Promise<{
    periodId: string;
    type: 'primary' | 'secondary' | 'all';
    evaluators: {
      evaluatorId: string;
      evaluatorName: string;
      departmentName: string;
      evaluatorType: 'primary' | 'secondary';
      evaluateeCount: number;
    }[];
  }> {
    const query = new GetEvaluatorsByPeriodQuery(periodId, type);
    return await this.queryBus.execute(query);
  }

  // ============================================================================
  // 평가라인 구성 관리 (핵심 기능)
  // ============================================================================

  /**
   * 직원-WBS별 평가라인을 구성한다
   * 각 직원의 각 WBS 항목마다 개별적으로 평가라인을 구성한다
   */
  async 직원_WBS별_평가라인을_구성한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    createdBy: string,
  ): Promise<{
    message: string;
    createdLines: number;
    createdMappings: number;
  }> {
    const command = new ConfigureEmployeeWbsEvaluationLineCommand(
      employeeId,
      wbsItemId,
      periodId,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 1차_평가자를_구성한다
   * 직원별 고정 담당자(1차 평가자)를 설정한다 (WBS와 무관)
   */
  async 일차_평가자를_구성한다(
    employeeId: string,
    periodId: string,
    evaluatorId: string,
    createdBy: string,
  ): Promise<{
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
  }> {
    const command = new ConfigurePrimaryEvaluatorCommand(
      employeeId,
      periodId,
      evaluatorId,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가기간의 모든 직원에 대해 managerId 기반으로 1차 평가자를 자동 구성한다
   * 평가기간에 등록된 모든 직원의 관리자를 1차 평가자로 자동 설정합니다.
   * 기존 1차 평가라인 매핑이 있으면 업데이트하고, 없으면 새로 생성합니다.
   */
  async 평가기간의_모든_직원에_대해_managerId로_1차_평가자를_자동_구성한다(
    periodId: string,
    createdBy: string,
  ): Promise<AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult> {
    const command =
      new AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand(
        periodId,
        createdBy,
      );
    return await this.commandBus.execute(command);
  }

  /**
   * 2차_평가자를_구성한다
   * 직원, WBS, 평가기간에 따라 2차 평가자를 지정하여 평가라인을 구성한다
   */
  async 이차_평가자를_구성한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    evaluatorId: string,
    createdBy: string,
  ): Promise<{
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
  }> {
    const command = new ConfigureSecondaryEvaluatorCommand(
      employeeId,
      wbsItemId,
      periodId,
      evaluatorId,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 여러 피평가자의 1차 평가자를 일괄 구성한다
   * 여러 직원의 1차 평가자(고정 담당자)를 일괄로 설정한다
   */
  async 여러_피평가자의_일차_평가자를_일괄_구성한다(
    periodId: string,
    assignments: Array<{ employeeId: string; evaluatorId: string }>,
    createdBy: string,
  ): Promise<{
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
  }> {
    const logger = new Logger('EvaluationCriteriaManagementService');
    logger.log(
      `여러 피평가자의 1차 평가자 일괄 구성 시작 - 평가기간: ${periodId}, 건수: ${assignments.length}`,
    );

    const results: Array<{
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
    }> = [];

    let totalCreatedLines = 0;
    let totalCreatedMappings = 0;
    let successCount = 0;
    let failureCount = 0;

    // 각 할당에 대해 순차 처리 (일부 실패해도 계속 진행)
    for (const assignment of assignments) {
      try {
        const result = await this.일차_평가자를_구성한다(
          assignment.employeeId,
          periodId,
          assignment.evaluatorId,
          createdBy,
        );

        totalCreatedLines += result.createdLines;
        totalCreatedMappings += result.createdMappings;
        successCount++;

        results.push({
          employeeId: assignment.employeeId,
          evaluatorId: assignment.evaluatorId,
          status: 'success',
          message: result.message,
          mapping: result.mapping,
        });
      } catch (error) {
        failureCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        logger.error(
          `1차 평가자 구성 실패 - 직원: ${assignment.employeeId}, 평가자: ${assignment.evaluatorId}, 오류: ${errorMessage}`,
        );

        results.push({
          employeeId: assignment.employeeId,
          evaluatorId: assignment.evaluatorId,
          status: 'error',
          error: errorMessage,
        });
      }
    }

    logger.log(
      `여러 피평가자의 1차 평가자 일괄 구성 완료 - 평가기간: ${periodId}, 전체: ${assignments.length}, 성공: ${successCount}, 실패: ${failureCount}`,
    );

    return {
      periodId,
      totalCount: assignments.length,
      successCount,
      failureCount,
      createdLines: totalCreatedLines,
      createdMappings: totalCreatedMappings,
      results,
    };
  }

  /**
   * 여러 피평가자의 2차 평가자를 일괄 구성한다
   * 여러 직원의 여러 WBS 항목에 대한 2차 평가자를 일괄로 설정한다
   */
  async 여러_피평가자의_이차_평가자를_일괄_구성한다(
    periodId: string,
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      evaluatorId: string;
    }>,
    createdBy: string,
  ): Promise<{
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
  }> {
    const logger = new Logger('EvaluationCriteriaManagementService');
    logger.log(
      `여러 피평가자의 2차 평가자 일괄 구성 시작 - 평가기간: ${periodId}, 건수: ${assignments.length}`,
    );

    const results: Array<{
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
    }> = [];

    let totalCreatedLines = 0;
    let totalCreatedMappings = 0;
    let successCount = 0;
    let failureCount = 0;

    // 각 할당에 대해 순차 처리 (일부 실패해도 계속 진행)
    for (const assignment of assignments) {
      try {
        const result = await this.이차_평가자를_구성한다(
          assignment.employeeId,
          assignment.wbsItemId,
          periodId,
          assignment.evaluatorId,
          createdBy,
        );

        totalCreatedLines += result.createdLines;
        totalCreatedMappings += result.createdMappings;
        successCount++;

        results.push({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          evaluatorId: assignment.evaluatorId,
          status: 'success',
          message: result.message,
          mapping: result.mapping,
        });
      } catch (error) {
        failureCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        logger.error(
          `2차 평가자 구성 실패 - 직원: ${assignment.employeeId}, WBS: ${assignment.wbsItemId}, 평가자: ${assignment.evaluatorId}, 오류: ${errorMessage}`,
        );

        results.push({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          evaluatorId: assignment.evaluatorId,
          status: 'error',
          error: errorMessage,
        });
      }
    }

    logger.log(
      `여러 피평가자의 2차 평가자 일괄 구성 완료 - 평가기간: ${periodId}, 전체: ${assignments.length}, 성공: ${successCount}, 실패: ${failureCount}`,
    );

    return {
      periodId,
      totalCount: assignments.length,
      successCount,
      failureCount,
      createdLines: totalCreatedLines,
      createdMappings: totalCreatedMappings,
      results,
    };
  }

  // ============================================================================
  // WBS 평가기준 관리
  // ============================================================================

  async WBS_평가기준을_생성한다(
    data: CreateWbsEvaluationCriteriaData,
    createdBy: string,
  ): Promise<WbsEvaluationCriteriaDto> {
    const command = new CreateWbsEvaluationCriteriaCommand(data, createdBy);
    return await this.commandBus.execute(command);
  }

  async WBS_평가기준을_수정한다(
    id: string,
    data: UpdateWbsEvaluationCriteriaData,
    updatedBy: string,
  ): Promise<WbsEvaluationCriteriaDto> {
    const command = new UpdateWbsEvaluationCriteriaCommand(id, data, updatedBy);
    return await this.commandBus.execute(command);
  }

  /**
   * WBS 평가기준 저장 (Upsert)
   * - wbsItemId에 평가기준이 없으면 생성
   * - wbsItemId에 평가기준이 있으면 수정
   * - WBS 항목당 하나의 평가기준만 존재
   */
  async WBS_평가기준을_저장한다(
    wbsItemId: string,
    criteria: string,
    importance: number,
    subProject: string | undefined,
    actionBy: string,
  ): Promise<WbsEvaluationCriteriaDto> {
    // wbsItemId로 기존 평가기준 조회
    const existingCriteria =
      await this.특정_WBS항목의_평가기준을_조회한다(wbsItemId);

    if (existingCriteria && existingCriteria.length > 0) {
      // 기존 평가기준이 있으면 수정
      const criteriaToUpdate = existingCriteria[0];
      return await this.WBS_평가기준을_수정한다(
        criteriaToUpdate.id,
        { criteria, importance, subProject },
        actionBy,
      );
    } else {
      // 기존 평가기준이 없으면 생성
      return await this.WBS_평가기준을_생성한다(
        { wbsItemId, criteria, importance, subProject },
        actionBy,
      );
    }
  }

  async WBS_평가기준을_삭제한다(
    id: string,
    deletedBy: string,
  ): Promise<boolean> {
    const command = new DeleteWbsEvaluationCriteriaCommand(id, deletedBy);
    return await this.commandBus.execute(command);
  }

  // ============================================================================
  // WBS 항목 관리
  // ============================================================================

  /**
   * WBS 항목을 생성한다
   */
  async WBS_항목을_생성한다(
    data: {
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
    },
    createdBy: string,
  ): Promise<WbsItemDto> {
    const command = new CreateWbsItemCommand(data, createdBy);
    const result = await this.commandBus.execute(command);
    return result.wbsItem;
  }

  /**
   * WBS 항목을 생성하면서 자동으로 WBS 코드를 생성한다
   */
  async WBS_항목을_생성하고_코드를_자동_생성한다(
    data: {
      title: string;
      status: WbsItemStatus;
      level: number;
      assignedToId?: string;
      projectId: string;
      parentWbsId?: string;
      startDate?: Date;
      endDate?: Date;
      progressPercentage?: number;
    },
    createdBy: string,
  ): Promise<WbsItemDto> {
    // 1. WBS 코드 자동 생성
    const wbsCode = await this.WBS_코드를_자동_생성한다(data.projectId);

    // 2. WBS 항목 생성 데이터에 코드 추가
    const wbsItemData = {
      ...data,
      wbsCode,
    };

    // 3. WBS 항목 생성
    return await this.WBS_항목을_생성한다(wbsItemData, createdBy);
  }

  /**
   * 프로젝트 내 WBS 코드를 자동 생성한다
   */
  private async WBS_코드를_자동_생성한다(projectId: string): Promise<string> {
    // 프로젝트 내 기존 WBS 개수 조회
    const existingWbsItems =
      await this.프로젝트별_WBS_목록을_조회한다(projectId);

    // 다음 순번 계산 (1부터 시작)
    const nextNumber = existingWbsItems.length + 1;

    // WBS 코드 생성 (3자리 제로 패딩)
    const wbsCode = `WBS-${nextNumber.toString().padStart(3, '0')}`;

    this.logger.log('WBS 코드 자동 생성', {
      projectId,
      existingCount: existingWbsItems.length,
      generatedCode: wbsCode,
    });

    return wbsCode;
  }

  /**
   * WBS 항목을 수정한다
   */
  async WBS_항목을_수정한다(
    id: string,
    data: {
      title?: string;
      status?: WbsItemStatus;
      startDate?: Date;
      endDate?: Date;
      progressPercentage?: number;
    },
    updatedBy: string,
  ): Promise<WbsItemDto> {
    const command = new UpdateWbsItemCommand(id, data, updatedBy);
    const result = await this.commandBus.execute(command);
    return result.wbsItem;
  }

  /**
   * 프로젝트별 WBS 목록을 조회한다
   */
  async 프로젝트별_WBS_목록을_조회한다(
    projectId: string,
  ): Promise<WbsItemDto[]> {
    const query = new GetWbsItemsByProjectQuery(projectId);
    const result = await this.queryBus.execute(query);
    return result.wbsItems;
  }

  async WBS_항목의_평가기준을_전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
  ): Promise<boolean> {
    const command = new DeleteWbsItemEvaluationCriteriaCommand(
      wbsItemId,
      deletedBy,
    );
    return await this.commandBus.execute(command);
  }

  async WBS_평가기준_목록을_조회한다(
    filter: WbsEvaluationCriteriaFilter,
  ): Promise<WbsEvaluationCriteriaListResponseDto> {
    const query = new GetWbsEvaluationCriteriaListQuery(filter);
    return await this.queryBus.execute(query);
  }

  async WBS_평가기준_상세를_조회한다(id: string): Promise<{
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
  } | null> {
    const query = new GetWbsEvaluationCriteriaDetailQuery(id);
    return await this.queryBus.execute(query);
  }

  async 특정_WBS항목의_평가기준을_조회한다(
    wbsItemId: string,
  ): Promise<WbsEvaluationCriteriaDto[]> {
    const query = new GetWbsItemEvaluationCriteriaQuery(wbsItemId);
    return await this.queryBus.execute(query);
  }

  // ============================================================================
  // 통합 관리 기능 (MVP)
  // ============================================================================

  async 특정_평가기간에_직원의_평가설정을_통합_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{
    projectAssignments: EvaluationProjectAssignmentDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
    evaluationLineMappings: EvaluationLineMappingDto[];
  }> {
    const query = new GetEmployeeEvaluationSettingsQuery(employeeId, periodId);
    return await this.queryBus.execute(query);
  }

  // ============================================================================
  // 평가라인 검증
  // ============================================================================

  /**
   * 평가라인을 검증한다
   * - 평가자가 해당 피평가자의 해당 WBS에 대해 평가 권한이 있는지 확인
   * - 평가 유형(1차/2차)이 올바른지 확인
   * @param evaluateeId 피평가자 ID
   * @param evaluatorId 평가자 ID
   * @param wbsId WBS ID
   * @param evaluationType 평가 유형 ('primary' | 'secondary')
   * @throws ForbiddenException 평가 권한이 없는 경우
   */
  async 평가라인을_검증한다(
    evaluateeId: string,
    evaluatorId: string,
    wbsId: string,
    evaluationType: 'primary' | 'secondary',
  ): Promise<void> {
    this.logger.debug('평가라인 검증 시작', {
      evaluateeId,
      evaluatorId,
      wbsId,
      evaluationType,
    });

    // 1. 평가 유형에 맞는 평가라인 조회
    const expectedEvaluatorType =
      evaluationType === 'primary'
        ? EvaluatorType.PRIMARY
        : EvaluatorType.SECONDARY;

    const evaluationLine = await this.evaluationLineRepository.findOne({
      where: {
        evaluatorType: expectedEvaluatorType,
        deletedAt: IsNull(),
      },
    });

    if (!evaluationLine) {
      this.logger.error('평가라인을 찾을 수 없습니다', {
        evaluatorType: expectedEvaluatorType,
      });
      throw new ForbiddenException(
        `${evaluationType === 'primary' ? '1차' : '2차'} 평가라인 정보를 찾을 수 없습니다.`,
      );
    }

    // 2. 평가라인 ID를 포함하여 평가라인 매핑 조회
    // 1차 평가자의 경우 wbsItemId가 null (직원별 고정 담당자)
    // 2차 평가자의 경우 wbsItemId가 있음 (WBS별 평가자)
    let mapping;
    if (evaluationType === 'primary') {
      // 1차 평가자: wbsItemId가 null인 매핑을 조회
      mapping = await this.evaluationLineMappingRepository.findOne({
        where: {
          employeeId: evaluateeId,
          evaluatorId: evaluatorId,
          wbsItemId: IsNull(),
          evaluationLineId: evaluationLine.id,
          deletedAt: IsNull(),
        },
      });
    } else {
      // 2차 평가자: wbsItemId가 있는 매핑을 조회
      mapping = await this.evaluationLineMappingRepository.findOne({
        where: {
          employeeId: evaluateeId,
          evaluatorId: evaluatorId,
          wbsItemId: wbsId,
          evaluationLineId: evaluationLine.id,
          deletedAt: IsNull(),
        },
      });
    }

    if (!mapping) {
      this.logger.warn('평가라인 매핑을 찾을 수 없습니다', {
        evaluateeId,
        evaluatorId,
        wbsId,
        evaluationLineId: evaluationLine.id,
        evaluationType,
      });
      throw new ForbiddenException(
        `해당 평가자는 이 WBS 항목에 대한 ${evaluationType === 'primary' ? '1차' : '2차'} 평가 권한이 없습니다. (피평가자: ${evaluateeId}, 평가자: ${evaluatorId}, WBS: ${wbsId})`,
      );
    }

    this.logger.debug('평가라인 검증 완료', {
      evaluateeId,
      evaluatorId,
      wbsId,
      evaluationType,
      evaluationLineId: evaluationLine.id,
    });
  }

  // ============================================================================
  // 할당 가능한 프로젝트 관리
  // ============================================================================

  async 할당_가능한_프로젝트_목록을_조회한다(
    periodId: string,
    options: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<AvailableProjectsResult> {
    const query = new GetAvailableProjectsQuery(periodId, options);
    return await this.queryBus.execute(query);
  }

  // ============================================================================
  // 평가기준 제출 관리
  // ============================================================================

  /**
   * 평가기준을 제출한다
   */
  async 평가기준을_제출한다(
    evaluationPeriodId: string,
    employeeId: string,
    submittedBy: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    return await this.evaluationPeriodEmployeeMappingService.평가기준을_제출한다(
      evaluationPeriodId,
      employeeId,
      submittedBy,
    );
  }

  /**
   * 평가기준 제출을 초기화한다
   */
  async 평가기준_제출을_초기화한다(
    evaluationPeriodId: string,
    employeeId: string,
    updatedBy: string,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const result = await this.evaluationPeriodEmployeeMappingService.평가기준_제출을_초기화한다(
      evaluationPeriodId,
      employeeId,
      updatedBy,
    );

    // StepApproval의 criteriaSettingStatus도 초기화 (null로 설정)
    try {
      const mapping = await this.evaluationPeriodEmployeeMappingRepository.findOne({
        where: {
          evaluationPeriodId,
          employeeId,
          deletedAt: null as any,
        },
      });

      if (mapping) {
        const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
        if (stepApproval) {
          // criteriaSettingStatus를 PENDING으로 초기화
          stepApproval.평가기준설정_대기로_변경한다(updatedBy);
          await this.stepApprovalService.저장한다(stepApproval);

          this.logger.log(
            `평가기준 제출 초기화 시 StepApproval 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
          );
        }
      }
    } catch (error) {
      // StepApproval 초기화 실패는 경고만 출력 (평가기준 제출 초기화는 성공)
      this.logger.warn(
        `평가기준 제출 초기화 시 StepApproval 상태 초기화 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
    }

    return result;
  }
}
