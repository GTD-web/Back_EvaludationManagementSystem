import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { DownwardEvaluationNotFoundException } from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { SecondaryEvaluationStepApprovalService } from '@domain/sub/secondary-evaluation-step-approval/secondary-evaluation-step-approval.service';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';
import { StepApprovalContextService } from '../step-approval-context/step-approval-context.service';
import { Employee } from '@domain/common/employee/employee.entity';

// 자기평가 관련 커맨드 및 쿼리
import {
  CreateWbsSelfEvaluationCommand,
  GetEmployeeSelfEvaluationsQuery,
  GetWbsSelfEvaluationDetailQuery,
  SubmitWbsSelfEvaluationCommand,
  SubmitWbsSelfEvaluationToEvaluatorCommand,
  SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand,
  SubmitAllWbsSelfEvaluationsToEvaluatorCommand,
  SubmitAllWbsSelfEvaluationsForApprovalCommand,
  ResetWbsSelfEvaluationCommand,
  ResetAllWbsSelfEvaluationsByEmployeePeriodCommand,
  SubmitWbsSelfEvaluationsByProjectCommand,
  SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand,
  ResetWbsSelfEvaluationsByProjectCommand,
  ResetWbsSelfEvaluationToEvaluatorCommand,
  ResetAllWbsSelfEvaluationsToEvaluatorCommand,
  ResetWbsSelfEvaluationsToEvaluatorByProjectCommand,
  ClearWbsSelfEvaluationCommand,
  ClearAllWbsSelfEvaluationsByEmployeePeriodCommand,
  ClearWbsSelfEvaluationsByProjectCommand,
  UpdateWbsSelfEvaluationCommand,
  UpsertWbsSelfEvaluationCommand,
  DeleteWbsSelfEvaluationsByAssignmentCommand,
} from './handlers/self-evaluation';
import type {
  SubmitAllWbsSelfEvaluationsResponse,
  SubmitAllWbsSelfEvaluationsToEvaluatorResponse,
  SubmitAllWbsSelfEvaluationsForApprovalResponse,
  ResetAllWbsSelfEvaluationsResponse,
  SubmitWbsSelfEvaluationsByProjectResponse,
  SubmitWbsSelfEvaluationsToEvaluatorByProjectResponse,
  ResetWbsSelfEvaluationsByProjectResponse,
  ResetAllWbsSelfEvaluationsToEvaluatorResponse,
  ResetWbsSelfEvaluationsToEvaluatorByProjectResponse,
  ClearAllWbsSelfEvaluationsResponse,
  ClearWbsSelfEvaluationsByProjectResponse,
  DeleteWbsSelfEvaluationsByAssignmentResponse,
} from './handlers/self-evaluation';
// 평가 수정 가능 상태 관련 커맨드
import { UpdatePeriodAllEvaluationEditableStatusCommand } from './handlers/evaluation-editable-status';
import type { UpdatePeriodAllEvaluationEditableStatusResponse } from './handlers/evaluation-editable-status';

// 동료평가 관련 커맨드 및 쿼리
import {
  CancelPeerEvaluationCommand,
  CancelPeerEvaluationsByPeriodCommand,
  CreatePeerEvaluationCommand,
  GetPeerEvaluationDetailQuery,
  GetPeerEvaluationListQuery,
  GetEvaluatorAssignedEvaluateesQuery,
  SubmitPeerEvaluationCommand,
  UpdatePeerEvaluationCommand,
  AddQuestionGroupToPeerEvaluationCommand,
  AddQuestionToPeerEvaluationCommand,
  AddMultipleQuestionsToPeerEvaluationCommand,
  RemoveQuestionFromPeerEvaluationCommand,
  UpdatePeerEvaluationQuestionOrderCommand,
  GetPeerEvaluationQuestionsQuery,
  UpsertPeerEvaluationAnswersCommand,
  type PeerEvaluationQuestionDetail,
} from './handlers/peer-evaluation';

// 하향평가 관련 커맨드 및 쿼리
import {
  CreateDownwardEvaluationCommand,
  GetDownwardEvaluationDetailQuery,
  GetDownwardEvaluationListQuery,
  SubmitDownwardEvaluationCommand,
  UpdateDownwardEvaluationCommand,
  UpsertDownwardEvaluationCommand,
  ResetDownwardEvaluationCommand,
  BulkSubmitDownwardEvaluationsCommand,
  BulkResetDownwardEvaluationsCommand,
} from './handlers/downward-evaluation';

// 최종평가 관련 커맨드 및 쿼리
import {
  CancelConfirmationFinalEvaluationCommand,
  ConfirmFinalEvaluationCommand,
  CreateFinalEvaluationCommand,
  DeleteFinalEvaluationCommand,
  GetFinalEvaluationByEmployeePeriodQuery,
  GetFinalEvaluationListQuery,
  GetFinalEvaluationQuery,
  UpdateFinalEvaluationCommand,
  UpsertFinalEvaluationCommand,
} from './handlers/final-evaluation';

// 산출물 관련 커맨드 및 쿼리
import {
  CreateDeliverableCommand,
  UpdateDeliverableCommand,
  DeleteDeliverableCommand,
  BulkCreateDeliverablesCommand,
  BulkDeleteDeliverablesCommand,
  type BulkDeliverableData,
} from './handlers/deliverable/command';
import {
  GetEmployeeDeliverablesQuery,
  GetWbsDeliverablesQuery,
  GetDeliverableDetailQuery,
} from './handlers/deliverable/query';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { DeliverableType } from '@domain/core/deliverable/deliverable.types';

import {
  EmployeeSelfEvaluationsResponseDto,
  WbsSelfEvaluationBasicDto,
  WbsSelfEvaluationResponseDto,
} from '@interface/common/dto/performance-evaluation/wbs-self-evaluation.dto';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { IPerformanceEvaluationService } from './interfaces/performance-evaluation.interface';

/**
 * 성과평가 컨텍스트 서비스
 * 자기평가(성과입력), 동료평가, 하향평가를 관리합니다.
 */
@Injectable()
export class PerformanceEvaluationService
  implements IPerformanceEvaluationService
{
  private readonly logger = new Logger(PerformanceEvaluationService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly secondaryStepApprovalService: SecondaryEvaluationStepApprovalService,
    private readonly stepApprovalContextService: StepApprovalContextService,
  ) {}

  // ==================== 자기평가(성과입력) 관련 메서드 ====================

  /**
   * WBS 자기평가를 생성한다
   */
  async WBS자기평가를_생성한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    selfEvaluationContent: string,
    selfEvaluationScore: number,
    performanceResult?: string,
    createdBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new CreateWbsSelfEvaluationCommand(
      periodId,
      employeeId,
      wbsItemId,
      selfEvaluationContent,
      selfEvaluationScore,
      performanceResult,
      createdBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * WBS 자기평가를 수정한다
   */
  async WBS자기평가를_수정한다(
    evaluationId: string,
    selfEvaluationContent?: string,
    selfEvaluationScore?: number,
    performanceResult?: string,
    updatedBy?: string,
  ): Promise<WbsSelfEvaluationBasicDto> {
    const command = new UpdateWbsSelfEvaluationCommand(
      evaluationId,
      selfEvaluationContent,
      selfEvaluationScore,
      performanceResult,
      updatedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * WBS 자기평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  async WBS자기평가를_저장한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    selfEvaluationContent?: string,
    selfEvaluationScore?: number,
    performanceResult?: string,
    actionBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new UpsertWbsSelfEvaluationCommand(
      periodId,
      employeeId,
      wbsItemId,
      selfEvaluationContent,
      selfEvaluationScore,
      performanceResult,
      actionBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * WBS 자기평가를 제출한다 (1차 평가자 → 관리자)
   */
  async WBS자기평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new SubmitWbsSelfEvaluationCommand(
      evaluationId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 피평가자가 1차 평가자에게 자기평가를 제출한다
   */
  async 피평가자가_1차평가자에게_자기평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new SubmitWbsSelfEvaluationToEvaluatorCommand(
      evaluationId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가를 제출한다 (1차 평가자 → 관리자)
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 관리자에게 제출 처리합니다.
   */
  async 직원의_전체_WBS자기평가를_제출한다(
    employeeId: string,
    periodId: string,
    submittedBy?: string,
  ): Promise<SubmitAllWbsSelfEvaluationsResponse> {
    const command = new SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand(
      employeeId,
      periodId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가를 1차 평가자에게 제출한다
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 1차 평가자에게 제출 처리합니다.
   */
  async 직원의_전체_자기평가를_1차평가자에게_제출한다(
    employeeId: string,
    periodId: string,
    submittedBy?: string,
  ): Promise<SubmitAllWbsSelfEvaluationsToEvaluatorResponse> {
    const command = new SubmitAllWbsSelfEvaluationsToEvaluatorCommand(
      employeeId,
      periodId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가를 승인 시 제출한다
   * 승인 시 submittedToEvaluator와 submittedToManager를 모두 true로 설정합니다.
   */
  async 직원의_전체_자기평가를_승인시_제출한다(
    employeeId: string,
    periodId: string,
    submittedBy?: string,
  ): Promise<SubmitAllWbsSelfEvaluationsForApprovalResponse> {
    const command = new SubmitAllWbsSelfEvaluationsForApprovalCommand(
      employeeId,
      periodId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * WBS 자기평가를 초기화한다 (단일)
   */
  async WBS자기평가를_초기화한다(
    evaluationId: string,
    resetBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new ResetWbsSelfEvaluationCommand(
      evaluationId,
      resetBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가를 초기화한다
   * 특정 직원의 특정 평가기간에 대한 모든 완료된 WBS 자기평가를 초기화합니다.
   */
  async 직원의_전체_WBS자기평가를_초기화한다(
    employeeId: string,
    periodId: string,
    resetBy?: string,
  ): Promise<ResetAllWbsSelfEvaluationsResponse> {
    const command = new ResetAllWbsSelfEvaluationsByEmployeePeriodCommand(
      employeeId,
      periodId,
      resetBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 프로젝트별 WBS 자기평가를 제출한다 (1차 평가자 → 관리자)
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 관리자에게 제출 처리합니다.
   */
  async 프로젝트별_WBS자기평가를_제출한다(
    employeeId: string,
    periodId: string,
    projectId: string,
    submittedBy?: string,
  ): Promise<SubmitWbsSelfEvaluationsByProjectResponse> {
    const command = new SubmitWbsSelfEvaluationsByProjectCommand(
      employeeId,
      periodId,
      projectId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 프로젝트별 WBS 자기평가를 1차 평가자에게 제출한다
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 1차 평가자에게 제출 처리합니다.
   */
  async 프로젝트별_자기평가를_1차평가자에게_제출한다(
    employeeId: string,
    periodId: string,
    projectId: string,
    submittedBy?: string,
  ): Promise<SubmitWbsSelfEvaluationsToEvaluatorByProjectResponse> {
    const command = new SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand(
      employeeId,
      periodId,
      projectId,
      submittedBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 피평가자가 1차 평가자에게 제출한 자기평가를 취소한다 (단일)
   * 특정 WBS 자기평가의 1차 평가자 제출 상태를 취소합니다.
   */
  async 피평가자가_1차평가자에게_제출한_자기평가를_취소한다(
    evaluationId: string,
    resetBy?: string,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const command = new ResetWbsSelfEvaluationToEvaluatorCommand(
      evaluationId,
      resetBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 전체 자기평가를 1차 평가자 제출 취소한다
   * 특정 직원의 특정 평가기간에 대한 모든 1차 평가자 제출 완료된 WBS 자기평가를 취소합니다.
   */
  async 직원의_전체_자기평가를_1차평가자_제출_취소한다(
    employeeId: string,
    periodId: string,
    resetBy?: string,
  ): Promise<ResetAllWbsSelfEvaluationsToEvaluatorResponse> {
    const command = new ResetAllWbsSelfEvaluationsToEvaluatorCommand(
      employeeId,
      periodId,
      resetBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 프로젝트별 자기평가를 1차 평가자 제출 취소한다
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 1차 평가자 제출 완료된 WBS 자기평가를 취소합니다.
   */
  async 프로젝트별_자기평가를_1차평가자_제출_취소한다(
    employeeId: string,
    periodId: string,
    projectId: string,
    resetBy?: string,
  ): Promise<ResetWbsSelfEvaluationsToEvaluatorByProjectResponse> {
    const command = new ResetWbsSelfEvaluationsToEvaluatorByProjectCommand(
      employeeId,
      periodId,
      projectId,
      resetBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 프로젝트별 WBS 자기평가를 초기화한다
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 완료된 WBS 자기평가를 초기화합니다.
   */
  async 프로젝트별_WBS자기평가를_초기화한다(
    employeeId: string,
    periodId: string,
    projectId: string,
    resetBy?: string,
  ): Promise<ResetWbsSelfEvaluationsByProjectResponse> {
    const command = new ResetWbsSelfEvaluationsByProjectCommand(
      employeeId,
      periodId,
      projectId,
      resetBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 자기평가 목록을 조회한다
   */
  async 직원의_자기평가_목록을_조회한다(
    query: GetEmployeeSelfEvaluationsQuery,
  ): Promise<EmployeeSelfEvaluationsResponseDto> {
    return await this.queryBus.execute(query);
  }

  /**
   * WBS 자기평가 상세정보를 조회한다
   */
  async WBS자기평가_상세정보를_조회한다(
    query: GetWbsSelfEvaluationDetailQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  // ==================== 동료평가 관련 메서드 ====================

  /**
   * 동료평가를 생성한다
   */
  async 동료평가를_생성한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    projectId: string,
    requestDeadline?: Date,
    evaluationContent?: string,
    score?: number,
    createdBy?: string,
  ): Promise<string> {
    const command = new CreatePeerEvaluationCommand(
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      requestDeadline,
      createdBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가를 수정한다
   */
  async 동료평가를_수정한다(
    evaluationId: string,
    evaluationContent?: string,
    score?: number,
    updatedBy?: string,
  ): Promise<void> {
    const command = new UpdatePeerEvaluationCommand(
      evaluationId,
      updatedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 동료평가를 취소한다
   */
  async 동료평가를_취소한다(
    evaluationId: string,
    cancelledBy: string,
  ): Promise<void> {
    const command = new CancelPeerEvaluationCommand(evaluationId, cancelledBy);

    await this.commandBus.execute(command);
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가를 취소한다
   */
  async 피평가자의_동료평가를_일괄_취소한다(
    evaluateeId: string,
    periodId: string,
    cancelledBy: string,
  ): Promise<{ cancelledCount: number }> {
    const command = new CancelPeerEvaluationsByPeriodCommand(
      evaluateeId,
      periodId,
      cancelledBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가를 제출한다
   */
  async 동료평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<void> {
    const command = new SubmitPeerEvaluationCommand(
      evaluationId,
      submittedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 동료평가 목록을 조회한다
   */
  async 동료평가_목록을_조회한다(
    query: GetPeerEvaluationListQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 동료평가 상세정보를 조회한다
   */
  async 동료평가_상세정보를_조회한다(
    query: GetPeerEvaluationDetailQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 평가자에게 할당된 피평가자 목록을 조회한다
   */
  async 평가자에게_할당된_피평가자_목록을_조회한다(
    query: GetEvaluatorAssignedEvaluateesQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  // ==================== 하향평가 관련 메서드 ====================

  /**
   * 하향평가를 생성한다
   */
  async 하향평가를_생성한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    projectId: string,
    selfEvaluationId?: string,
    evaluationType?: string,
    downwardEvaluationContent?: string,
    downwardEvaluationScore?: number,
    createdBy?: string,
  ): Promise<string> {
    const command = new CreateDownwardEvaluationCommand(
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      selfEvaluationId,
      evaluationType || 'primary',
      downwardEvaluationContent,
      downwardEvaluationScore,
      createdBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 하향평가를 수정한다
   */
  async 하향평가를_수정한다(
    evaluationId: string,
    downwardEvaluationContent?: string,
    downwardEvaluationScore?: number,
    updatedBy?: string,
  ): Promise<void> {
    const command = new UpdateDownwardEvaluationCommand(
      evaluationId,
      downwardEvaluationContent,
      downwardEvaluationScore,
      updatedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 하향평가를 Upsert한다 (있으면 수정, 없으면 생성)
   */
  async 하향평가를_저장한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    selfEvaluationId?: string,
    evaluationType?: string,
    downwardEvaluationContent?: string,
    downwardEvaluationScore?: number,
    actionBy?: string,
  ): Promise<string> {
    const command = new UpsertDownwardEvaluationCommand(
      evaluatorId,
      evaluateeId,
      periodId,
      wbsId,
      selfEvaluationId,
      evaluationType || 'primary',
      downwardEvaluationContent,
      downwardEvaluationScore,
      actionBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 1차 하향평가를 제출한다
   * 평가가 존재하지 않으면 자동으로 생성합니다.
   * 평가라인 매핑에서 실제 할당된 1차 평가자 ID를 조회하여 사용합니다.
   * content가 비어있으면 기본 제출 메시지를 생성합니다.
   */
  async 일차_하향평가를_제출한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    submittedBy: string,
  ): Promise<void> {
    // 평가라인 매핑에서 실제 할당된 1차 평가자 ID 조회
    const actualPrimaryEvaluatorId =
      await this.stepApprovalContextService.일차평가자를_조회한다(
        periodId,
        evaluateeId,
      );

    if (!actualPrimaryEvaluatorId) {
      throw new DownwardEvaluationNotFoundException(
        `1차 평가자를 찾을 수 없습니다. (evaluateeId: ${evaluateeId}, periodId: ${periodId})`,
      );
    }

    // 전달받은 evaluatorId와 실제 할당된 평가자 ID가 다르면 경고 로그
    if (evaluatorId !== actualPrimaryEvaluatorId) {
      this.logger.warn(
        `⚠️ 전달받은 evaluatorId(${evaluatorId})와 실제 할당된 1차 평가자 ID(${actualPrimaryEvaluatorId})가 다릅니다. 실제 평가자 ID를 사용합니다.`,
      );
    }

    // 제출자 정보 조회 (기본 메시지 생성용)
    const submitter = await this.employeeRepository.findOne({
      where: { id: submittedBy, deletedAt: null as any },
    });
    const submitterName = submitter?.name || '관리자';

    // 실제 평가자 ID로 1차 하향평가를 조회
    const query = new GetDownwardEvaluationListQuery(
      actualPrimaryEvaluatorId,
      evaluateeId,
      periodId,
      wbsId,
      'primary',
      undefined,
      1,
      1,
    );

    const result = await this.queryBus.execute(query);

    // 평가가 없으면 자동으로 생성 (기본 메시지 포함)
    if (!result.evaluations || result.evaluations.length === 0) {
      const defaultContent = `${submitterName}님이 미입력 상태에서 제출하였습니다.`;

      // 실제 평가자 ID로 생성
      await this.하향평가를_저장한다(
        actualPrimaryEvaluatorId,
        evaluateeId,
        periodId,
        wbsId,
        undefined,
        'primary',
        defaultContent,
        undefined,
        submittedBy,
      );

      // 생성 후 다시 조회
      const newResult = await this.queryBus.execute(query);
      if (!newResult.evaluations || newResult.evaluations.length === 0) {
        throw new DownwardEvaluationNotFoundException(
          `1차 하향평가 생성 실패 (evaluateeId: ${evaluateeId}, periodId: ${periodId}, wbsId: ${wbsId})`,
        );
      }

      const evaluation = newResult.evaluations[0];

      // 제출 커맨드 실행
      const command = new SubmitDownwardEvaluationCommand(
        evaluation.id,
        submittedBy,
      );

      await this.commandBus.execute(command);
      return;
    }

    const evaluation = result.evaluations[0];

    // 평가가 있지만 content가 비어있으면 기본 메시지 추가
    if (!evaluation.downwardEvaluationContent?.trim()) {
      const defaultContent = `${submitterName}님이 미입력 상태에서 제출하였습니다.`;
      await this.하향평가를_저장한다(
        actualPrimaryEvaluatorId,
        evaluateeId,
        periodId,
        wbsId,
        evaluation.selfEvaluationId,
        'primary',
        defaultContent,
        evaluation.downwardEvaluationScore,
        submittedBy,
      );
    }

    // 제출 커맨드 실행
    const command = new SubmitDownwardEvaluationCommand(
      evaluation.id,
      submittedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * 2차 하향평가를 제출한다
   * 평가가 존재하지 않으면 자동으로 생성합니다.
   * 평가라인 매핑에서 실제 할당된 2차 평가자 ID를 조회하여 사용합니다.
   * content가 비어있으면 기본 제출 메시지를 생성합니다.
   */
  async 이차_하향평가를_제출한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    submittedBy: string,
  ): Promise<void> {
    // 평가라인 매핑에서 실제 할당된 2차 평가자 ID 조회 (WBS별)
    const actualSecondaryEvaluatorId =
      await this.stepApprovalContextService.이차평가자를_조회한다(
        periodId,
        evaluateeId,
        wbsId,
      );

    if (!actualSecondaryEvaluatorId) {
      throw new DownwardEvaluationNotFoundException(
        `2차 평가자를 찾을 수 없습니다. (evaluateeId: ${evaluateeId}, periodId: ${periodId}, wbsId: ${wbsId})`,
      );
    }

    // 전달받은 evaluatorId와 실제 할당된 평가자 ID가 다르면 경고 로그
    if (evaluatorId !== actualSecondaryEvaluatorId) {
      this.logger.warn(
        `⚠️ 전달받은 evaluatorId(${evaluatorId})와 실제 할당된 2차 평가자 ID(${actualSecondaryEvaluatorId})가 다릅니다. 실제 평가자 ID를 사용합니다.`,
      );
    }

    // 제출자 정보 조회 (기본 메시지 생성용)
    const submitter = await this.employeeRepository.findOne({
      where: { id: submittedBy, deletedAt: null as any },
    });
    const submitterName = submitter?.name || '관리자';

    // 실제 평가자 ID로 2차 하향평가를 조회
    const query = new GetDownwardEvaluationListQuery(
      actualSecondaryEvaluatorId,
      evaluateeId,
      periodId,
      wbsId,
      'secondary',
      undefined,
      1,
      1,
    );

    const result = await this.queryBus.execute(query);

    // 평가가 없으면 자동으로 생성 (기본 메시지 포함)
    if (!result.evaluations || result.evaluations.length === 0) {
      const defaultContent = `${submitterName}님이 미입력 상태에서 제출하였습니다.`;

      // 실제 평가자 ID로 생성
      await this.하향평가를_저장한다(
        actualSecondaryEvaluatorId,
        evaluateeId,
        periodId,
        wbsId,
        undefined,
        'secondary',
        defaultContent,
        undefined,
        submittedBy,
      );

      // 생성 후 다시 조회
      const newResult = await this.queryBus.execute(query);
      if (!newResult.evaluations || newResult.evaluations.length === 0) {
        throw new DownwardEvaluationNotFoundException(
          `2차 하향평가 생성 실패 (evaluateeId: ${evaluateeId}, periodId: ${periodId}, wbsId: ${wbsId})`,
        );
      }

      const evaluation = newResult.evaluations[0];

      // 제출 커맨드 실행
      const command = new SubmitDownwardEvaluationCommand(
        evaluation.id,
        submittedBy,
      );

      await this.commandBus.execute(command);
      return;
    }

    const evaluation = result.evaluations[0];

    // 평가가 있지만 content가 비어있으면 기본 메시지 추가
    if (!evaluation.downwardEvaluationContent?.trim()) {
      const defaultContent = `${submitterName}님이 미입력 상태에서 제출하였습니다.`;
      await this.하향평가를_저장한다(
        actualSecondaryEvaluatorId,
        evaluateeId,
        periodId,
        wbsId,
        evaluation.selfEvaluationId,
        'secondary',
        defaultContent,
        evaluation.downwardEvaluationScore,
        submittedBy,
      );
    }

    // 제출 커맨드 실행
    const command = new SubmitDownwardEvaluationCommand(
      evaluation.id,
      submittedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * 하향평가를 제출한다 (ID로 직접)
   */
  async 하향평가를_제출한다(
    evaluationId: string,
    submittedBy?: string,
  ): Promise<void> {
    const command = new SubmitDownwardEvaluationCommand(
      evaluationId,
      submittedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 피평가자의 모든 하향평가를 일괄 제출한다
   * 평가자가 담당하는 특정 피평가자의 모든 하향평가를 한 번에 제출합니다.
   */
  async 피평가자의_모든_하향평가를_일괄_제출한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    evaluationType: DownwardEvaluationType,
    submittedBy: string,
    forceSubmit: boolean = false, // 강제 제출 옵션 (승인 시 필수 항목 검증 건너뛰기)
  ): Promise<{
    submittedCount: number;
    skippedCount: number;
    failedCount: number;
    submittedIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    const command = new BulkSubmitDownwardEvaluationsCommand(
      evaluatorId,
      evaluateeId,
      periodId,
      evaluationType,
      submittedBy,
      forceSubmit,
    );

    return await this.commandBus.execute(command);
  }

  /**
   * 피평가자의 모든 하향평가를 일괄 초기화한다 (미제출 상태로 변경)
   * 평가자가 담당하는 특정 피평가자의 모든 하향평가를 한 번에 미제출 상태로 되돌립니다.
   */
  async 피평가자의_모든_하향평가를_일괄_초기화한다(
    evaluatorId: string,
    evaluateeId: string,
    periodId: string,
    evaluationType: DownwardEvaluationType,
    resetBy: string,
  ): Promise<{
    resetCount: number;
    skippedCount: number;
    failedCount: number;
    resetIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    const command = new BulkResetDownwardEvaluationsCommand(
      evaluatorId,
      evaluateeId,
      periodId,
      evaluationType,
      resetBy,
    );

    return await this.commandBus.execute(command);
  }

  /**
   * 1차 하향평가를 초기화한다 (미제출 상태로 변경)
   * 2차 평가자도 1차 하향평가를 초기화(반려)할 수 있도록 evaluatorId 조건을 제거하고
   * evaluateeId, periodId, wbsId, evaluationType만으로 조회합니다.
   */
  async 일차_하향평가를_초기화한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    resetBy: string,
  ): Promise<void> {
    // 1차 하향평가를 조회 (evaluatorId 조건 없이 조회하여 2차 평가자도 초기화 가능)
    const query = new GetDownwardEvaluationListQuery(
      undefined, // evaluatorId를 undefined로 설정하여 모든 평가자의 평가 조회
      evaluateeId,
      periodId,
      wbsId,
      'primary',
      undefined,
      1,
      1,
    );

    const result = await this.queryBus.execute(query);
    if (!result.evaluations || result.evaluations.length === 0) {
      throw new DownwardEvaluationNotFoundException(
        `1차 하향평가 (evaluateeId: ${evaluateeId}, periodId: ${periodId}, wbsId: ${wbsId})`,
      );
    }

    const evaluation = result.evaluations[0];

    // 초기화 커맨드 실행
    const command = new ResetDownwardEvaluationCommand(evaluation.id, resetBy);

    await this.commandBus.execute(command);
  }

  /**
   * 2차 하향평가를 초기화한다 (미제출 상태로 변경)
   */
  async 이차_하향평가를_초기화한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    resetBy: string,
  ): Promise<void> {
    this.logger.log('2차 하향평가 초기화 시작', {
      evaluateeId,
      periodId,
      wbsId,
      evaluatorId,
      resetBy,
    });

    try {
      // 1. 평가 레코드 조회 (있으면 초기화)
      const query = new GetDownwardEvaluationListQuery(
        evaluatorId,
        evaluateeId,
        periodId,
        wbsId,
        'secondary',
        undefined,
        1,
        1,
      );

      this.logger.debug('2차 하향평가 조회 쿼리 실행', { query });
      const result = await this.queryBus.execute(query);

      this.logger.debug('2차 하향평가 조회 결과', {
        totalCount: result.total,
        evaluationCount: result.evaluations?.length || 0,
      });

      // 평가 레코드가 있으면 초기화
      if (result.evaluations && result.evaluations.length > 0) {
        const evaluation = result.evaluations[0];

        // 이미 미제출 상태가 아닌 경우에만 초기화
        if (evaluation.isCompleted) {
          this.logger.debug('2차 하향평가 초기화 실행', {
            evaluationId: evaluation.id,
            isCompleted: evaluation.isCompleted,
          });

          const command = new ResetDownwardEvaluationCommand(
            evaluation.id,
            resetBy,
          );
          await this.commandBus.execute(command);

          this.logger.log('2차 하향평가 초기화 완료', {
            evaluationId: evaluation.id,
          });
        } else {
          this.logger.debug('이미 미제출 상태인 평가 - 초기화 스킵', {
            evaluationId: evaluation.id,
          });
        }
      } else {
        this.logger.debug('2차 하향평가 레코드 없음 - 초기화 스킵');
      }

      // 2. 승인 상태는 변경하지 않음 (반려 후 재제출 시 기존 승인 상태 유지)
      this.logger.debug('승인 상태는 유지됨 (변경하지 않음)', {
        evaluateeId,
        periodId,
        evaluatorId,
      });

      this.logger.log('2차 하향평가 초기화 완료', {
        evaluateeId,
        periodId,
        wbsId,
        evaluatorId,
      });
    } catch (error) {
      this.logger.error('2차 하향평가 초기화 실패', error.stack, {
        evaluateeId,
        periodId,
        wbsId,
        evaluatorId,
        resetBy,
        errorName: error.name,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * 하향평가 목록을 조회한다
   */
  async 하향평가_목록을_조회한다(
    query: GetDownwardEvaluationListQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 하향평가 상세정보를 조회한다
   */
  async 하향평가_상세정보를_조회한다(
    query: GetDownwardEvaluationDetailQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  // ==================== 최종평가 관련 메서드 ====================

  /**
   * 최종평가를 생성한다
   */
  async 최종평가를_생성한다(
    employeeId: string,
    periodId: string,
    evaluationGrade: string,
    jobGrade: any,
    jobDetailedGrade: any,
    finalComments?: string,
    createdBy?: string,
  ): Promise<string> {
    const command = new CreateFinalEvaluationCommand(
      employeeId,
      periodId,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      finalComments,
      createdBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 최종평가를 수정한다
   */
  async 최종평가를_수정한다(
    id: string,
    evaluationGrade?: string,
    jobGrade?: any,
    jobDetailedGrade?: any,
    finalComments?: string,
    updatedBy?: string,
  ): Promise<void> {
    const command = new UpdateFinalEvaluationCommand(
      id,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      finalComments,
      updatedBy || '시스템',
    );

    await this.commandBus.execute(command);
  }

  /**
   * 최종평가를 저장한다 (Upsert: 있으면 수정, 없으면 생성)
   */
  async 최종평가를_저장한다(
    employeeId: string,
    periodId: string,
    evaluationGrade: string,
    jobGrade: any,
    jobDetailedGrade: any,
    finalComments?: string,
    actionBy?: string,
  ): Promise<string> {
    const command = new UpsertFinalEvaluationCommand(
      employeeId,
      periodId,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      finalComments,
      actionBy || '시스템',
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 최종평가를 삭제한다
   */
  async 최종평가를_삭제한다(id: string, deletedBy?: string): Promise<void> {
    const command = new DeleteFinalEvaluationCommand(id, deletedBy || '시스템');

    await this.commandBus.execute(command);
  }

  /**
   * 최종평가를 확정한다
   */
  async 최종평가를_확정한다(id: string, confirmedBy: string): Promise<void> {
    const command = new ConfirmFinalEvaluationCommand(id, confirmedBy);

    await this.commandBus.execute(command);
  }

  /**
   * 최종평가 확정을 취소한다
   */
  async 최종평가_확정을_취소한다(id: string, updatedBy: string): Promise<void> {
    const command = new CancelConfirmationFinalEvaluationCommand(id, updatedBy);

    await this.commandBus.execute(command);
  }

  /**
   * 최종평가를 조회한다
   */
  async 최종평가를_조회한다(query: GetFinalEvaluationQuery): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 최종평가 목록을 조회한다
   */
  async 최종평가_목록을_조회한다(
    query: GetFinalEvaluationListQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 직원-평가기간별 최종평가를 조회한다
   */
  async 직원_평가기간별_최종평가를_조회한다(
    query: GetFinalEvaluationByEmployeePeriodQuery,
  ): Promise<any> {
    return await this.queryBus.execute(query);
  }

  /**
   * 평가기간별 모든 평가 대상자의 수정 가능 상태를 일괄 변경한다
   *
   * 주의: 엔티티 필드가 삭제되었으므로 이 메서드는 실제로 아무 작업도 수행하지 않습니다.
   * 평가기간별 일괄 변경 기능과의 호환성을 위해 유지됩니다.
   */
  async 평가기간별_모든_평가_수정_가능_상태를_변경한다(
    evaluationPeriodId: string,
    isSelfEvaluationEditable: boolean,
    isPrimaryEvaluationEditable: boolean,
    isSecondaryEvaluationEditable: boolean,
    updatedBy?: string,
  ): Promise<any> {
    // 평가기간별 일괄 변경 기능은 유지되지만, 실제로는 아무 작업도 수행하지 않음
    const command = new UpdatePeriodAllEvaluationEditableStatusCommand(
      evaluationPeriodId,
      isSelfEvaluationEditable,
      isPrimaryEvaluationEditable,
      isSecondaryEvaluationEditable,
      updatedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  // ==================== WBS 자기평가 내용 초기화 ====================

  /**
   * WBS 자기평가 내용을 초기화한다 (단일)
   */
  async WBS자기평가_내용을_초기화한다(data: {
    evaluationId: string;
    clearedBy?: string;
  }): Promise<WbsSelfEvaluationDto> {
    const command = new ClearWbsSelfEvaluationCommand(
      data.evaluationId,
      data.clearedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 직원의 전체 WBS 자기평가 내용을 초기화한다
   */
  async 직원의_전체_WBS자기평가_내용을_초기화한다(data: {
    employeeId: string;
    periodId: string;
    clearedBy?: string;
  }): Promise<ClearAllWbsSelfEvaluationsResponse> {
    const command = new ClearAllWbsSelfEvaluationsByEmployeePeriodCommand(
      data.employeeId,
      data.periodId,
      data.clearedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 프로젝트별 WBS 자기평가 내용을 초기화한다
   */
  async 프로젝트별_WBS자기평가_내용을_초기화한다(data: {
    employeeId: string;
    periodId: string;
    projectId: string;
    clearedBy?: string;
  }): Promise<ClearWbsSelfEvaluationsByProjectResponse> {
    const command = new ClearWbsSelfEvaluationsByProjectCommand(
      data.employeeId,
      data.periodId,
      data.projectId,
      data.clearedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * WBS 할당에 연결된 자기평가를 삭제한다
   * WBS 할당 취소 시 관련 자기평가 데이터를 정리하는 용도로 사용합니다.
   */
  async WBS할당_자기평가를_삭제한다(data: {
    employeeId: string;
    periodId: string;
    wbsItemId: string;
    deletedBy: string;
  }): Promise<DeleteWbsSelfEvaluationsByAssignmentResponse> {
    const command = new DeleteWbsSelfEvaluationsByAssignmentCommand(
      data.employeeId,
      data.periodId,
      data.wbsItemId,
      data.deletedBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  // ==================== 동료평가 질문 매핑 관련 메서드 ====================

  /**
   * 동료평가에 질문 그룹을 추가한다
   */
  async 동료평가에_질문그룹을_추가한다(
    peerEvaluationId: string,
    questionGroupId: string,
    startDisplayOrder: number,
    createdBy: string,
  ): Promise<string[]> {
    const command = new AddQuestionGroupToPeerEvaluationCommand(
      peerEvaluationId,
      questionGroupId,
      startDisplayOrder,
      createdBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가에 개별 질문을 추가한다
   */
  async 동료평가에_질문을_추가한다(
    peerEvaluationId: string,
    questionId: string,
    displayOrder: number,
    questionGroupId: string | undefined,
    createdBy: string,
  ): Promise<string> {
    const command = new AddQuestionToPeerEvaluationCommand(
      peerEvaluationId,
      questionId,
      displayOrder,
      questionGroupId,
      createdBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가에 여러 질문을 매핑한다
   * 동료평가 요청 시 질문 IDs를 받아서 일괄 매핑합니다.
   */
  async 동료평가에_질문을_매핑한다(
    peerEvaluationId: string,
    questionIds: string[],
    createdBy: string,
  ): Promise<string[]> {
    const command = new AddMultipleQuestionsToPeerEvaluationCommand(
      peerEvaluationId,
      questionIds,
      0, // startDisplayOrder는 0부터 시작
      createdBy,
    );

    const result = await this.commandBus.execute(command);
    return result;
  }

  /**
   * 동료평가에서 질문을 제거한다
   */
  async 동료평가에서_질문을_제거한다(
    mappingId: string,
    deletedBy: string,
  ): Promise<void> {
    const command = new RemoveQuestionFromPeerEvaluationCommand(
      mappingId,
      deletedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * 동료평가 질문 순서를 변경한다
   */
  async 동료평가_질문_순서를_변경한다(
    mappingId: string,
    newDisplayOrder: number,
    updatedBy: string,
  ): Promise<void> {
    const command = new UpdatePeerEvaluationQuestionOrderCommand(
      mappingId,
      newDisplayOrder,
      updatedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * 동료평가의 질문 목록을 조회한다
   */
  async 동료평가의_질문목록을_조회한다(
    peerEvaluationId: string,
  ): Promise<PeerEvaluationQuestionDetail[]> {
    const query = new GetPeerEvaluationQuestionsQuery(peerEvaluationId);

    const result = await this.queryBus.execute(query);
    return result;
  }

  /**
   * 동료평가 질문에 대한 답변을 저장/업데이트한다
   */
  async 동료평가_답변을_저장한다(
    peerEvaluationId: string,
    answers: Array<{ questionId: string; answer: string }>,
    answeredBy: string,
  ): Promise<number> {
    const command = new UpsertPeerEvaluationAnswersCommand(
      peerEvaluationId,
      answers,
      answeredBy,
    );

    const savedCount = await this.commandBus.execute(command);
    return savedCount;
  }

  // ==================== 산출물 관련 메서드 ====================

  /**
   * 산출물을 생성한다
   */
  async 산출물을_생성한다(data: {
    name: string;
    type: DeliverableType;
    employeeId: string;
    wbsItemId: string;
    description?: string;
    filePath?: string;
    createdBy: string;
  }): Promise<Deliverable> {
    const command = new CreateDeliverableCommand(
      data.name,
      data.type,
      data.employeeId,
      data.wbsItemId,
      data.description,
      data.filePath,
      data.createdBy,
    );

    const deliverable = await this.commandBus.execute(command);
    return deliverable;
  }

  /**
   * 산출물을 수정한다
   */
  async 산출물을_수정한다(data: {
    id: string;
    updatedBy: string;
    name?: string;
    type?: DeliverableType;
    description?: string;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    isActive?: boolean;
  }): Promise<Deliverable> {
    const command = new UpdateDeliverableCommand(
      data.id,
      data.updatedBy,
      data.name,
      data.type,
      data.description,
      data.filePath,
      data.employeeId,
      data.wbsItemId,
      data.isActive,
    );

    const deliverable = await this.commandBus.execute(command);
    return deliverable;
  }

  /**
   * 산출물을 삭제한다
   */
  async 산출물을_삭제한다(id: string, deletedBy: string): Promise<void> {
    const command = new DeleteDeliverableCommand(id, deletedBy);
    await this.commandBus.execute(command);
  }

  /**
   * 산출물을 벌크 생성한다
   */
  async 산출물을_벌크_생성한다(data: {
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
  }> {
    const command = new BulkCreateDeliverablesCommand(
      data.deliverables,
      data.createdBy,
    );

    const result = await this.commandBus.execute(command);
    return {
      successCount: result.successCount,
      failedCount: result.failedCount,
      createdIds: result.createdIds,
      failedItems: result.failedItems,
    };
  }

  /**
   * 산출물을 벌크 삭제한다
   */
  async 산출물을_벌크_삭제한다(data: {
    ids: string[];
    deletedBy: string;
  }): Promise<{
    successCount: number;
    failedCount: number;
    failedIds: Array<{ id: string; error: string }>;
  }> {
    const command = new BulkDeleteDeliverablesCommand(data.ids, data.deletedBy);

    const result = await this.commandBus.execute(command);
    return {
      successCount: result.successCount,
      failedCount: result.failedCount,
      failedIds: result.failedIds,
    };
  }

  /**
   * 직원별 산출물을 조회한다
   */
  async 직원별_산출물을_조회한다(
    employeeId: string,
    activeOnly: boolean = true,
  ): Promise<Deliverable[]> {
    const query = new GetEmployeeDeliverablesQuery(employeeId, activeOnly);
    const deliverables = await this.queryBus.execute(query);
    return deliverables;
  }

  /**
   * WBS 항목별 산출물을 조회한다
   */
  async WBS항목별_산출물을_조회한다(
    wbsItemId: string,
    activeOnly: boolean = true,
  ): Promise<Deliverable[]> {
    const query = new GetWbsDeliverablesQuery(wbsItemId, activeOnly);
    const deliverables = await this.queryBus.execute(query);
    return deliverables;
  }

  /**
   * 산출물 상세를 조회한다
   */
  async 산출물_상세를_조회한다(id: string): Promise<Deliverable> {
    const query = new GetDeliverableDetailQuery(id);
    const deliverable = await this.queryBus.execute(query);
    return deliverable;
  }
}
