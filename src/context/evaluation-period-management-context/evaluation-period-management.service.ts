import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { InvalidDownwardEvaluationScoreException } from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import {
  EvaluationPeriodDto,
  EvaluationPeriodPhase,
} from '../../domain/core/evaluation-period/evaluation-period.types';
import { EvaluationPeriod } from '../../domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodService } from '../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodAutoPhaseService } from '../../domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import type {
  EmployeePeriodAssignmentsResponseDto,
  SimplifiedEvaluationPeriodDto,
  SimplifiedEmployeeDto,
  AssignedProjectDto,
  AssignedWbsItemDto,
  EvaluatorInfoDto,
  ProjectManagerInfoDto,
  WbsEvaluationCriterionDto,
} from '@interface/common/dto/evaluation-period/employee-period-assignments.dto';
import {
  CompleteEvaluationPeriodCommand,
  CreateEvaluationPeriodCommand,
  DeleteEvaluationPeriodCommand,
  StartEvaluationPeriodCommand,
  UpdateCriteriaSettingPermissionCommand,
  UpdateEvaluationPeriodBasicInfoCommand,
  UpdateEvaluationPeriodGradeRangesCommand,
  UpdateEvaluationPeriodScheduleCommand,
  UpdateEvaluationPeriodStartDateCommand,
  UpdateEvaluationSetupDeadlineCommand,
  UpdateFinalEvaluationSettingPermissionCommand,
  UpdateManualSettingPermissionsCommand,
  UpdatePeerEvaluationDeadlineCommand,
  UpdatePerformanceDeadlineCommand,
  UpdateSelfEvaluationDeadlineCommand,
  UpdateSelfEvaluationSettingPermissionCommand,
  RegisterEvaluationTargetCommand,
  RegisterBulkEvaluationTargetsCommand,
  ExcludeEvaluationTargetCommand,
  IncludeEvaluationTargetCommand,
  UnregisterEvaluationTargetCommand,
  UnregisterAllEvaluationTargetsCommand,
  RegisterEvaluationTargetWithAutoEvaluatorCommand,
  CreateEvaluationPeriodWithAutoTargetsCommand,
} from './handlers';
import {
  CreateEvaluationPeriodMinimalDto,
  UpdateCriteriaSettingPermissionDto,
  UpdateEvaluationPeriodBasicDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateEvaluationPeriodStartDateDto,
  UpdateEvaluationSetupDeadlineDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateGradeRangesDto,
  UpdateManualSettingPermissionsDto,
  UpdatePeerEvaluationDeadlineDto,
  UpdatePerformanceDeadlineDto,
  UpdateSelfEvaluationDeadlineDto,
  UpdateSelfEvaluationSettingPermissionDto,
} from './interfaces/evaluation-period-creation.interface';
import { IEvaluationPeriodManagementContext } from './interfaces/evaluation-period-management-context.interface';
import {
  GetActiveEvaluationPeriodsQuery,
  GetEvaluationPeriodDetailQuery,
  GetEvaluationPeriodListQuery,
  GetEvaluationTargetsQuery,
  GetExcludedEvaluationTargetsQuery,
  GetEmployeeEvaluationPeriodsQuery,
  CheckEvaluationTargetQuery,
  GetEvaluationTargetsByFilterQuery,
  GetUnregisteredEmployeesQuery,
} from './handlers';

/**
 * 평가 기간 관리 서비스
 *
 * CQRS 패턴을 사용하여 평가 기간의 생명주기 관리를 위한 비즈니스 로직을 구현합니다.
 */
@Injectable()
export class EvaluationPeriodManagementContextService
  implements IEvaluationPeriodManagementContext
{
  private readonly logger = new Logger(
    EvaluationPeriodManagementContextService.name,
  );

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly evaluationPeriodAutoPhaseService: EvaluationPeriodAutoPhaseService,
    private readonly evaluationProjectAssignmentService: EvaluationProjectAssignmentService,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly evaluationLineMappingService: EvaluationLineMappingService,
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(EvaluationLineMapping)
    private readonly lineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
  ) {}
  /**
   * 평가 기간을 생성한다 (최소 필수 정보만)
   */
  async 평가기간_생성한다(
    createData: CreateEvaluationPeriodMinimalDto,
    createdBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new CreateEvaluationPeriodCommand(createData, createdBy);
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간을 시작한다
   */
  async 평가기간_시작한다(
    periodId: string,
    startedBy: string,
  ): Promise<boolean> {
    const command = new StartEvaluationPeriodCommand(periodId, startedBy);
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간을 완료한다
   */
  async 평가기간_완료한다(
    periodId: string,
    completedBy: string,
  ): Promise<boolean> {
    const command = new CompleteEvaluationPeriodCommand(periodId, completedBy);
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간 기본 정보를 수정한다
   */
  async 평가기간기본정보_수정한다(
    periodId: string,
    updateData: UpdateEvaluationPeriodBasicDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationPeriodBasicInfoCommand(
      periodId,
      updateData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간 일정을 수정한다
   */
  async 평가기간일정_수정한다(
    periodId: string,
    scheduleData: UpdateEvaluationPeriodScheduleDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationPeriodScheduleCommand(
      periodId,
      scheduleData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가설정 단계 마감일을 수정한다
   */
  async 평가설정단계마감일_수정한다(
    periodId: string,
    deadlineData: UpdateEvaluationSetupDeadlineDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationSetupDeadlineCommand(
      periodId,
      deadlineData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 업무 수행 단계 마감일을 수정한다
   */
  async 업무수행단계마감일_수정한다(
    periodId: string,
    deadlineData: UpdatePerformanceDeadlineDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdatePerformanceDeadlineCommand(
      periodId,
      deadlineData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 자기 평가 단계 마감일을 수정한다
   */
  async 자기평가단계마감일_수정한다(
    periodId: string,
    deadlineData: UpdateSelfEvaluationDeadlineDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateSelfEvaluationDeadlineCommand(
      periodId,
      deadlineData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 하향/동료평가 단계 마감일을 수정한다
   */
  async 하향동료평가단계마감일_수정한다(
    periodId: string,
    deadlineData: UpdatePeerEvaluationDeadlineDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdatePeerEvaluationDeadlineCommand(
      periodId,
      deadlineData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간 시작일을 수정한다
   */
  async 평가기간시작일_수정한다(
    periodId: string,
    startDateData: UpdateEvaluationPeriodStartDateDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationPeriodStartDateCommand(
      periodId,
      startDateData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 기간 등급 구간을 수정한다
   */
  async 평가기간등급구간_수정한다(
    periodId: string,
    gradeData: UpdateGradeRangesDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateEvaluationPeriodGradeRangesCommand(
      periodId,
      gradeData,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 결재 문서 ID를 설정한다
   */
  async 결재문서ID_설정한다(
    periodId: string,
    approvalDocumentId: string,
    setBy: string,
  ): Promise<EvaluationPeriodDto> {
    const period = await this.evaluationPeriodService.ID로_조회한다(periodId);
    if (!period) {
      throw new NotFoundException(
        `평가 기간을 찾을 수 없습니다. (ID: ${periodId})`,
      );
    }

    // 도메인 엔티티의 메서드를 통해 결재 문서 ID 설정
    period.결재문서ID_설정한다(approvalDocumentId, setBy);

    // Repository를 통해 직접 저장
    const savedPeriod = await this.evaluationPeriodRepository.save(period);

    return savedPeriod.DTO로_변환한다();
  }

  /**
   * 평가 기간을 삭제한다
   */
  async 평가기간_삭제한다(
    periodId: string,
    deletedBy: string,
  ): Promise<boolean> {
    const command = new DeleteEvaluationPeriodCommand(periodId, deletedBy);
    return await this.commandBus.execute(command);
  }

  /**
   * 활성 평가 기간을 조회한다
   */
  async 활성평가기간_조회한다(): Promise<EvaluationPeriodDto[]> {
    const query = new GetActiveEvaluationPeriodsQuery();
    return await this.queryBus.execute(query);
  }

  /**
   * 평가 기간 상세 정보를 조회한다
   */
  async 평가기간상세_조회한다(
    periodId: string,
  ): Promise<EvaluationPeriodDto | null> {
    const query = new GetEvaluationPeriodDetailQuery(periodId);
    return await this.queryBus.execute(query);
  }

  /**
   * 평가 기간 목록을 조회한다
   */
  async 평가기간목록_조회한다(
    page: number,
    limit: number,
  ): Promise<{
    items: EvaluationPeriodDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = new GetEvaluationPeriodListQuery(page, limit);
    return await this.queryBus.execute(query);
  }

  // ==================== 수동 허용 설정 관리 ====================

  /**
   * 평가 기준 설정 수동 허용을 변경한다
   */
  async 평가기준설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateCriteriaSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateCriteriaSettingPermissionCommand(
      periodId,
      permissionData,
      changedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 자기 평가 설정 수동 허용을 변경한다
   */
  async 자기평가설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateSelfEvaluationSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateSelfEvaluationSettingPermissionCommand(
      periodId,
      permissionData,
      changedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 최종 평가 설정 수동 허용을 변경한다
   */
  async 최종평가설정수동허용_변경한다(
    periodId: string,
    permissionData: UpdateFinalEvaluationSettingPermissionDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateFinalEvaluationSettingPermissionCommand(
      periodId,
      permissionData,
      changedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 전체 수동 허용 설정을 변경한다
   */
  async 전체수동허용설정_변경한다(
    periodId: string,
    permissionData: UpdateManualSettingPermissionsDto,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    const command = new UpdateManualSettingPermissionsCommand(
      periodId,
      permissionData,
      changedBy,
    );
    return await this.commandBus.execute(command);
  }

  // ==================== 평가 대상자 관리 ====================

  /**
   * 평가 대상자를 등록한다
   */
  async 평가대상자_등록한다(
    evaluationPeriodId: string,
    employeeId: string,
    createdBy: string,
  ): Promise<any> {
    const command = new RegisterEvaluationTargetCommand(
      evaluationPeriodId,
      employeeId,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 대상자를 대량 등록한다
   */
  async 평가대상자_대량_등록한다(
    evaluationPeriodId: string,
    employeeIds: string[],
    createdBy: string,
  ): Promise<any[]> {
    const command = new RegisterBulkEvaluationTargetsCommand(
      evaluationPeriodId,
      employeeIds,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 대상에서 제외한다
   */
  async 평가대상에서_제외한다(
    evaluationPeriodId: string,
    employeeId: string,
    excludeReason: string,
    excludedBy: string,
  ): Promise<any> {
    const command = new ExcludeEvaluationTargetCommand(
      evaluationPeriodId,
      employeeId,
      excludeReason,
      excludedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 대상에 포함한다 (제외 취소)
   */
  async 평가대상에_포함한다(
    evaluationPeriodId: string,
    employeeId: string,
    updatedBy: string,
  ): Promise<any> {
    const command = new IncludeEvaluationTargetCommand(
      evaluationPeriodId,
      employeeId,
      updatedBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가 대상자 등록을 해제한다
   */
  async 평가대상자_등록_해제한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<boolean> {
    const command = new UnregisterEvaluationTargetCommand(
      evaluationPeriodId,
      employeeId,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가기간의 모든 대상자를 해제한다
   */
  async 평가기간의_모든_대상자_해제한다(
    evaluationPeriodId: string,
  ): Promise<number> {
    const command = new UnregisterAllEvaluationTargetsCommand(
      evaluationPeriodId,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 평가기간의 평가대상자를 조회한다
   */
  async 평가기간의_평가대상자_조회한다(
    evaluationPeriodId: string,
    includeExcluded: boolean = false,
  ): Promise<any[]> {
    const query = new GetEvaluationTargetsQuery(
      evaluationPeriodId,
      includeExcluded,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 평가기간의 제외된 대상자를 조회한다
   */
  async 평가기간의_제외된_대상자_조회한다(
    evaluationPeriodId: string,
  ): Promise<any[]> {
    const query = new GetExcludedEvaluationTargetsQuery(evaluationPeriodId);
    return await this.queryBus.execute(query);
  }

  /**
   * 직원의 평가기간 맵핑을 조회한다
   */
  async 직원의_평가기간_맵핑_조회한다(employeeId: string): Promise<any[]> {
    const query = new GetEmployeeEvaluationPeriodsQuery(employeeId);
    return await this.queryBus.execute(query);
  }

  /**
   * 평가 대상 여부를 확인한다
   */
  async 평가대상_여부_확인한다(evaluationPeriodId: string, employeeId: string) {
    const query = new CheckEvaluationTargetQuery(
      evaluationPeriodId,
      employeeId,
    );
    return await this.queryBus.execute(query);
  }

  /**
   * 필터로 평가대상자를 조회한다
   */
  async 필터로_평가대상자_조회한다(filter: any): Promise<any[]> {
    const query = new GetEvaluationTargetsByFilterQuery(filter);
    return await this.queryBus.execute(query);
  }

  /**
   * 평가기간에 등록되지 않은 직원 목록을 조회한다
   */
  async 평가기간에_등록되지_않은_직원_목록을_조회한다(
    evaluationPeriodId: string,
  ): Promise<{
    evaluationPeriodId: string;
    employees: Array<{
      id: string;
      employeeNumber: string;
      name: string;
      email: string;
      phoneNumber?: string;
      status: string;
      departmentId?: string;
      departmentName?: string;
      rankName?: string;
    }>;
  }> {
    const query = new GetUnregisteredEmployeesQuery(evaluationPeriodId);
    return await this.queryBus.execute(query);
  }

  /**
   * 평가 점수를 검증한다
   * - 평가기간의 달성률 최대값을 기준으로 점수 범위를 검증
   * @param periodId 평가기간 ID
   * @param score 평가 점수
   * @throws InvalidDownwardEvaluationScoreException 점수가 유효 범위를 벗어난 경우
   */
  async 평가_점수를_검증한다(periodId: string, score: number): Promise<void> {
    // 1. 평가기간 조회
    const period = await this.평가기간상세_조회한다(periodId);

    if (!period) {
      this.logger.error('평가기간을 찾을 수 없습니다', { periodId });
      throw new InvalidDownwardEvaluationScoreException(
        score,
        1,
        120,
        `평가기간을 찾을 수 없습니다: ${periodId}`,
      );
    }

    // 2. 평가기간의 달성률 최대값 조회
    const maxRate = period.maxSelfEvaluationRate;

    // 3. 점수 범위 검증 (1 ~ maxRate)
    if (score < 1 || score > maxRate) {
      this.logger.error('평가 점수가 유효 범위를 벗어났습니다', {
        score,
        minScore: 1,
        maxScore: maxRate,
        periodId,
      });
      throw new InvalidDownwardEvaluationScoreException(score, 1, maxRate);
    }
  }

  /**
   * 평가기간을 생성하고 평가 대상자 및 1차 평가자를 자동 할당합니다
   */
  async 평가기간을_대상자와_함께_생성한다(
    createData: CreateEvaluationPeriodMinimalDto,
    createdBy: string,
  ) {
    return await this.commandBus.execute(
      new CreateEvaluationPeriodWithAutoTargetsCommand(createData, createdBy),
    );
  }

  /**
   * 평가 대상자를 등록하고 1차 평가자를 자동 할당합니다
   */
  async 평가대상자를_자동평가자와_함께_등록한다(
    evaluationPeriodId: string,
    employeeId: string,
    createdBy: string,
  ) {
    return await this.commandBus.execute(
      new RegisterEvaluationTargetWithAutoEvaluatorCommand(
        evaluationPeriodId,
        employeeId,
        createdBy,
      ),
    );
  }

  /**
   * 평가기간의 단계를 변경한다
   */
  async 단계_변경한다(
    periodId: string,
    targetPhase: EvaluationPeriodPhase,
    changedBy: string,
  ): Promise<EvaluationPeriodDto> {
    this.logger.log(
      `평가기간 단계 변경 컨텍스트 로직 시작 - 평가기간: ${periodId}, 대상 단계: ${targetPhase}`,
    );

    // 도메인 서비스를 직접 호출하여 단계 변경
    const result = await this.evaluationPeriodService.단계_변경한다(
      periodId,
      targetPhase,
      changedBy,
    );

    this.logger.log(
      `평가기간 단계 변경 컨텍스트 로직 완료 - 평가기간: ${periodId}, 변경된 단계: ${result.currentPhase}`,
    );

    return result;
  }

  /**
   * 자동 단계 전이를 실행한다
   */
  async 자동_단계_전이를_실행한다(): Promise<number> {
    this.logger.log('자동 단계 전이 컨텍스트 로직 시작');

    // 자동 단계 전이 서비스를 직접 호출
    const result =
      await this.evaluationPeriodAutoPhaseService.autoPhaseTransition();

    this.logger.log(
      `자동 단계 전이 컨텍스트 로직 완료 - 전이된 평가기간 수: ${result}`,
    );

    return result;
  }

  /**
   * 평가기간 설정을 복제한다
   */
  async 평가기간_복제한다(
    targetPeriodId: string,
    sourcePeriodId: string,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    this.logger.log(
      `평가기간 복제 시작 - 소스: ${sourcePeriodId}, 타겟: ${targetPeriodId}`,
    );

    // 1. 소스 평가기간 조회
    const sourcePeriod = await this.평가기간상세_조회한다(sourcePeriodId);
    if (!sourcePeriod) {
      throw new Error(
        `소스 평가기간을 찾을 수 없습니다. (id: ${sourcePeriodId})`,
      );
    }

    // 2. 타겟 평가기간 조회
    const targetPeriod = await this.평가기간상세_조회한다(targetPeriodId);
    if (!targetPeriod) {
      throw new Error(
        `타겟 평가기간을 찾을 수 없습니다. (id: ${targetPeriodId})`,
      );
    }

    // 3. 타겟 평가기간에 소스 평가기간의 설정 복사 (기간 정보는 제외)

    // 3-1. 기본 정보 복사 (description, maxSelfEvaluationRate)
    await this.평가기간기본정보_수정한다(
      targetPeriodId,
      {
        name: targetPeriod.name, // 이름은 유지
        description: sourcePeriod.description,
        maxSelfEvaluationRate: sourcePeriod.maxSelfEvaluationRate,
      },
      updatedBy,
    );

    // 3-2. 등급 구간 복사
    if (sourcePeriod.gradeRanges && sourcePeriod.gradeRanges.length > 0) {
      await this.평가기간등급구간_수정한다(
        targetPeriodId,
        {
          gradeRanges: sourcePeriod.gradeRanges.map((range) => ({
            grade: range.grade,
            minRange: range.minRange,
            maxRange: range.maxRange,
          })),
        },
        updatedBy,
      );
    }

    // 3-3. 수동 허용 설정 복사
    await this.전체수동허용설정_변경한다(
      targetPeriodId,
      {
        criteriaSettingEnabled: sourcePeriod.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: sourcePeriod.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          sourcePeriod.finalEvaluationSettingEnabled,
      },
      updatedBy,
    );

    this.logger.log(
      `평가기간 복제 완료 - 소스: ${sourcePeriodId}, 타겟: ${targetPeriodId}`,
    );

    // 4. 업데이트된 타겟 평가기간 반환
    const updatedPeriod = await this.평가기간상세_조회한다(targetPeriodId);
    if (!updatedPeriod) {
      throw new NotFoundException(
        `타겟 평가기간을 찾을 수 없습니다. (ID: ${targetPeriodId})`,
      );
    }
    return updatedPeriod;
  }

  /**
   * 이전 평가기간의 직원 데이터를 복사한다 (프로젝트 할당, 평가라인 매핑)
   */
  async 이전_평가기간_데이터를_복사한다(
    targetPeriodId: string,
    sourcePeriodId: string,
    employeeId: string,
    copiedBy: string,
    projects?: Array<{ projectId: string; wbsIds?: string[] }>,
  ): Promise<{
    copiedProjectAssignments: number;
    copiedWbsAssignments: number;
    copiedEvaluationLineMappings: number;
    copiedWbsEvaluationCriteria: number;
  }> {
    this.logger.log(
      `이전 평가기간 데이터 복사 시작 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}, 직원: ${employeeId}`,
    );

    // 1. 평가기간 존재 여부 확인
    const sourcePeriod = await this.평가기간상세_조회한다(sourcePeriodId);
    if (!sourcePeriod) {
      throw new NotFoundException(
        `원본 평가기간을 찾을 수 없습니다. (id: ${sourcePeriodId})`,
      );
    }

    const targetPeriod = await this.평가기간상세_조회한다(targetPeriodId);
    if (!targetPeriod) {
      throw new NotFoundException(
        `대상 평가기간을 찾을 수 없습니다. (id: ${targetPeriodId})`,
      );
    }

    // 2. 대상 평가기간에 직원이 등록되어 있는지 확인
    const targetMapping =
      await this.evaluationPeriodEmployeeMappingService.평가대상_여부를_확인한다(
        targetPeriodId,
        employeeId,
      );
    if (!targetMapping) {
      this.logger.warn(
        `대상 평가기간에 직원이 등록되지 않았습니다. 자동으로 등록합니다. - 평가기간: ${targetPeriodId}, 직원: ${employeeId}`,
      );
      // 자동으로 평가대상자로 등록
      await this.평가대상자_등록한다(targetPeriodId, employeeId, copiedBy);
    }

    // 3. 원본 평가기간의 프로젝트 할당 조회
    const sourceProjectAssignments =
      await this.projectAssignmentRepository.find({
        where: {
          periodId: sourcePeriodId,
          employeeId: employeeId,
        },
        order: {
          displayOrder: 'ASC',
        },
      });

    this.logger.log(
      `원본 평가기간의 프로젝트 할당 ${sourceProjectAssignments.length}개 발견`,
    );

    // 4. 프로젝트 필터링 (projects가 지정된 경우)
    const projectIds = projects?.map((p) => p.projectId);
    const filteredProjectAssignments = projectIds
      ? sourceProjectAssignments.filter((assignment) =>
          projectIds.includes(assignment.projectId),
        )
      : sourceProjectAssignments;

    // 프로젝트별 WBS ID 매핑 생성
    const projectWbsMap = new Map<string, string[]>();
    if (projects) {
      for (const project of projects) {
        if (project.wbsIds && project.wbsIds.length > 0) {
          projectWbsMap.set(project.projectId, project.wbsIds);
        }
      }
    }

    // 5. 프로젝트 할당 복사
    let copiedProjectAssignmentsCount = 0;
    const copiedProjectIds = new Set<string>(); // 복사된 프로젝트 ID 추적 (평가 기준 복사용)

    for (const assignment of filteredProjectAssignments) {
      try {
        await this.evaluationProjectAssignmentService.생성한다({
          periodId: targetPeriodId,
          employeeId: employeeId,
          projectId: assignment.projectId,
          assignedBy: copiedBy,
          displayOrder: assignment.displayOrder,
        });
        copiedProjectAssignmentsCount++;
        copiedProjectIds.add(assignment.projectId); // 프로젝트 ID 추적
        this.logger.log(
          `프로젝트 할당 복사 완료 - 프로젝트: ${assignment.projectId}`,
        );
      } catch (error) {
        // 중복 에러는 무시 (이미 존재하는 할당)
        if (
          error.message?.includes('이미 존재') ||
          error.code === 'DUPLICATE_ASSIGNMENT'
        ) {
          copiedProjectIds.add(assignment.projectId); // 이미 존재하는 프로젝트도 추적
          this.logger.log(
            `프로젝트 할당 건너뜀 (이미 존재): 프로젝트=${assignment.projectId}`,
          );
        } else {
          this.logger.error(
            `프로젝트 할당 복사 실패 - 프로젝트: ${assignment.projectId}`,
            error.stack,
          );
          // 에러가 발생해도 계속 진행
        }
      }
    }

    // 6. 원본 평가기간의 WBS 할당 조회
    const sourceWbsAssignments = await this.wbsAssignmentRepository.find({
      where: {
        periodId: sourcePeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
      order: {
        displayOrder: 'ASC',
      },
    });

    this.logger.log(
      `원본 평가기간의 WBS 할당 ${sourceWbsAssignments.length}개 발견`,
    );

    // 7. WBS 할당 필터링 및 복사
    let copiedWbsAssignmentsCount = 0;
    const copiedWbsIds = new Set<string>(); // 복사된 WBS ID 추적

    for (const wbsAssignment of sourceWbsAssignments) {
      // 프로젝트 필터링
      if (copiedProjectIds.has(wbsAssignment.projectId)) {
        // wbsIds 필터링 (프로젝트별로 특정 WBS만 복사하도록 지정된 경우)
        const allowedWbsIds = projectWbsMap.get(wbsAssignment.projectId);
        const shouldCopyWbs =
          !allowedWbsIds || allowedWbsIds.includes(wbsAssignment.wbsItemId);

        if (shouldCopyWbs) {
          try {
            await this.evaluationWbsAssignmentService.생성한다({
              periodId: targetPeriodId,
              employeeId: employeeId,
              projectId: wbsAssignment.projectId,
              wbsItemId: wbsAssignment.wbsItemId,
              assignedBy: copiedBy,
            });
            copiedWbsAssignmentsCount++;
            copiedWbsIds.add(wbsAssignment.wbsItemId);
            this.logger.log(
              `WBS 할당 복사 완료 - WBS: ${wbsAssignment.wbsItemId}, 프로젝트: ${wbsAssignment.projectId}`,
            );
          } catch (error) {
            // 중복 에러는 무시 (이미 존재하는 할당)
            if (
              error.message?.includes('이미 존재') ||
              error.code === 'DUPLICATE_ASSIGNMENT'
            ) {
              copiedWbsIds.add(wbsAssignment.wbsItemId); // 이미 존재하는 WBS도 추적
              this.logger.log(
                `WBS 할당 건너뜀 (이미 존재): WBS=${wbsAssignment.wbsItemId}, 프로젝트=${wbsAssignment.projectId}`,
              );
            } else {
              this.logger.error(
                `WBS 할당 복사 실패 - WBS: ${wbsAssignment.wbsItemId}`,
                error.stack,
              );
              // 에러가 발생해도 계속 진행
            }
          }
        }
      }
    }

    // 8. 원본 평가기간의 평가라인 매핑 조회
    const sourceLineMappings = await this.lineMappingRepository.find({
      where: {
        evaluationPeriodId: sourcePeriodId,
        employeeId: employeeId,
      },
    });

    this.logger.log(
      `원본 평가기간의 평가라인 매핑 ${sourceLineMappings.length}개 발견`,
    );

    // 9. 평가라인 매핑 필터링 (복사된 WBS만)
    let filteredLineMappings = sourceLineMappings.filter(
      (mapping) => !mapping.wbsItemId || copiedWbsIds.has(mapping.wbsItemId), // WBS가 없는 경우(직원별 고정) 또는 복사된 WBS인 경우
    );

    this.logger.log(`필터링 후 평가라인 매핑 ${filteredLineMappings.length}개`);

    // 10. 평가라인 매핑 복사
    let copiedLineMappingsCount = 0;

    for (const mapping of filteredLineMappings) {
      try {
        await this.evaluationLineMappingService.생성한다({
          evaluationPeriodId: targetPeriodId,
          employeeId: employeeId,
          evaluatorId: mapping.evaluatorId,
          wbsItemId: mapping.wbsItemId,
          evaluationLineId: mapping.evaluationLineId,
          createdBy: copiedBy,
        });
        copiedLineMappingsCount++;
        this.logger.log(
          `평가라인 매핑 복사 완료 - WBS: ${mapping.wbsItemId}, 평가자: ${mapping.evaluatorId}`,
        );
      } catch (error) {
        // 중복 에러는 무시 (이미 존재하는 매핑)
        if (
          error.message?.includes('이미 존재') ||
          error.code === 'DUPLICATE_MAPPING'
        ) {
          this.logger.log(
            `평가라인 매핑 건너뜀 (이미 존재): WBS=${mapping.wbsItemId}, 평가자=${mapping.evaluatorId}`,
          );
        } else {
          this.logger.error(
            `평가라인 매핑 복사 실패 - WBS: ${mapping.wbsItemId}`,
            error.stack,
          );
          // 에러가 발생해도 계속 진행
        }
      }
    }

    // 11. WBS 평가 기준 복사
    // 복사된 WBS의 평가 기준을 복사
    let copiedCriteriaCount = 0;

    if (copiedWbsIds.size > 0) {
      this.logger.log(
        `복사된 WBS ${copiedWbsIds.size}개의 평가 기준 복사 시작`,
      );

      // 각 WBS의 평가 기준 복사
      for (const wbsItemId of copiedWbsIds) {
        const sourceCriteria = await this.wbsEvaluationCriteriaRepository.find({
          where: {
            wbsItemId: wbsItemId,
            deletedAt: IsNull(),
          },
        });

        if (sourceCriteria.length > 0) {
          this.logger.log(
            `WBS ${wbsItemId}의 평가 기준 ${sourceCriteria.length}개 복사 시작`,
          );

          for (const criteria of sourceCriteria) {
            try {
              // 대상 평가기간에 동일한 평가 기준이 이미 있는지 확인
              const existingCriteria =
                await this.wbsEvaluationCriteriaRepository.findOne({
                  where: {
                    wbsItemId: criteria.wbsItemId,
                    criteria: criteria.criteria,
                    deletedAt: IsNull(),
                  },
                });

              if (!existingCriteria) {
                // 평가 기준 복사
                const newCriteria = this.wbsEvaluationCriteriaRepository.create(
                  {
                    wbsItemId: criteria.wbsItemId,
                    criteria: criteria.criteria,
                    importance: criteria.importance,
                    createdBy: copiedBy,
                  },
                );
                await this.wbsEvaluationCriteriaRepository.save(newCriteria);
                copiedCriteriaCount++;

                this.logger.log(
                  `평가 기준 복사 완료 - WBS: ${criteria.wbsItemId}, 기준: "${criteria.criteria}", 중요도: ${criteria.importance}`,
                );
              } else {
                this.logger.log(
                  `평가 기준 건너뜀 (이미 존재): WBS=${criteria.wbsItemId}, 기준="${criteria.criteria}"`,
                );
              }
            } catch (error) {
              this.logger.error(
                `평가 기준 복사 실패 - WBS: ${criteria.wbsItemId}, 기준: "${criteria.criteria}"`,
                error.stack,
              );
              // 에러가 발생해도 계속 진행
            }
          }
        }
      }
    }

    // 12. WBS별 subProject 복사
    // 복사된 WBS의 subProject를 복사 (자기평가 데이터에서 조회)
    let copiedSubProjectCount = 0;

    if (copiedWbsIds.size > 0) {
      this.logger.log(
        `복사된 WBS ${copiedWbsIds.size}개의 subProject 복사 시작`,
      );

      // 원본 평가기간의 자기평가에서 subProject 조회
      const sourceSelfEvaluations = await this.wbsSelfEvaluationRepository.find(
        {
          where: {
            periodId: sourcePeriodId,
            employeeId: employeeId,
            deletedAt: IsNull(),
          },
        },
      );

      this.logger.log(
        `원본 평가기간의 자기평가 ${sourceSelfEvaluations.length}개 발견`,
      );

      for (const sourceSelfEval of sourceSelfEvaluations) {
        // 복사된 WBS인지 확인
        if (copiedWbsIds.has(sourceSelfEval.wbsItemId)) {
          try {
            // 대상 평가기간에 이미 자기평가가 있는지 확인
            let targetSelfEval = await this.wbsSelfEvaluationRepository.findOne(
              {
                where: {
                  periodId: targetPeriodId,
                  employeeId: employeeId,
                  wbsItemId: sourceSelfEval.wbsItemId,
                  deletedAt: IsNull(),
                },
              },
            );

            if (targetSelfEval) {
              // 이미 존재하면 subProject만 업데이트
              targetSelfEval.subProject = sourceSelfEval.subProject;
              await this.wbsSelfEvaluationRepository.save(targetSelfEval);
              this.logger.log(
                `subProject 업데이트 완료 - WBS: ${sourceSelfEval.wbsItemId}, subProject: "${sourceSelfEval.subProject || 'null'}"`,
              );
            } else {
              // 없으면 새로 생성 (subProject만 설정)
              const newSelfEval = this.wbsSelfEvaluationRepository.create({
                periodId: targetPeriodId,
                employeeId: employeeId,
                wbsItemId: sourceSelfEval.wbsItemId,
                assignedBy: copiedBy,
                assignedDate: new Date(),
                submittedToEvaluator: false,
                submittedToManager: false,
                evaluationDate: new Date(),
                subProject: sourceSelfEval.subProject,
                createdBy: copiedBy,
              });
              await this.wbsSelfEvaluationRepository.save(newSelfEval);
              this.logger.log(
                `subProject 복사 완료 - WBS: ${sourceSelfEval.wbsItemId}, subProject: "${sourceSelfEval.subProject || 'null'}"`,
              );
            }

            copiedSubProjectCount++;
          } catch (error) {
            this.logger.error(
              `subProject 복사 실패 - WBS: ${sourceSelfEval.wbsItemId}, subProject: "${sourceSelfEval.subProject || 'null'}"`,
              error.stack,
            );
            // 에러가 발생해도 계속 진행
          }
        }
      }

      this.logger.log(
        `subProject 복사 완료: ${copiedSubProjectCount}개 (총 ${copiedWbsIds.size}개 WBS 중)`,
      );
    }

    this.logger.log(
      `이전 평가기간 데이터 복사 완료 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}, 직원: ${employeeId}, 프로젝트 할당: ${copiedProjectAssignmentsCount}개, WBS 할당: ${copiedWbsAssignmentsCount}개, 평가라인 매핑: ${copiedLineMappingsCount}개, WBS 평가 기준: ${copiedCriteriaCount}개, subProject: ${copiedSubProjectCount}개`,
    );

    return {
      copiedProjectAssignments: copiedProjectAssignmentsCount,
      copiedWbsAssignments: copiedWbsAssignmentsCount,
      copiedEvaluationLineMappings: copiedLineMappingsCount,
      copiedWbsEvaluationCriteria: copiedCriteriaCount,
    };
  }

  /**
   * 직원의 평가기간별 할당 정보를 조회한다
   */
  async 직원_평가기간별_할당정보_조회한다(
    periodId: string,
    employeeId: string,
  ): Promise<EmployeePeriodAssignmentsResponseDto> {
    this.logger.log(
      `직원 평가기간별 할당정보 조회 시작 - 평가기간: ${periodId}, 직원: ${employeeId}`,
    );

    // 1. 평가기간 정보 조회
    const evaluationPeriod =
      await this.evaluationPeriodService.ID로_조회한다(periodId);
    if (!evaluationPeriod) {
      throw new NotFoundException(
        `평가기간을 찾을 수 없습니다. (ID: ${periodId})`,
      );
    }

    // 2. 직원 정보 조회
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, deletedAt: IsNull() },
    });
    if (!employee) {
      throw new NotFoundException(
        `직원을 찾을 수 없습니다. (ID: ${employeeId})`,
      );
    }

    // 3. 평가라인 매핑 조회
    // 3-1. 직원별 고정 1차 담당자 조회 (wbsItemId IS NULL, evaluatorType = 'primary')
    //      대시보드 API와 동일한 로직 사용
    const primaryEvaluatorMapping = await this.lineMappingRepository
      .createQueryBuilder('mapping')
      .select([
        'mapping.id AS mapping_id',
        'mapping.evaluatorId AS mapping_evaluator_id',
        'evaluator.name AS evaluator_name',
      ])
      .leftJoin(
        Employee,
        'evaluator',
        '(evaluator.id = mapping.evaluatorId OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL',
      )
      .leftJoin(
        EvaluationLine,
        'line',
        'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
      )
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId: periodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.wbsItemId IS NULL')
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'primary',
      })
      .getRawOne();

    this.logger.log(
      `직원별 고정 1차 평가자 매핑: ${primaryEvaluatorMapping ? '발견 - ' + primaryEvaluatorMapping.evaluator_name : '없음'}`,
    );

    // 3-2. WBS별 평가라인 매핑 조회 (wbsItemId가 있는 매핑)
    const lineMappings = await this.lineMappingRepository.find({
      where: {
        evaluationPeriodId: periodId,
        employeeId: employeeId,
        deletedAt: IsNull(), // 삭제된 매핑 제외
      },
    });

    this.logger.log(
      `평가라인 매핑 총 ${lineMappings.length}개 발견 (직원별 고정 포함)`,
    );

    // 평가라인 매핑 상세 로그
    if (lineMappings.length > 0) {
      this.logger.log('평가라인 매핑 상세:');
      lineMappings.forEach((mapping, index) => {
        this.logger.log(
          `  [${index + 1}] WBS: ${mapping.wbsItemId ? mapping.wbsItemId.substring(0, 8) + '...' : 'NULL(직원별 고정)'}, 평가라인: ${mapping.evaluationLineId?.substring(0, 8)}..., 평가자: ${mapping.evaluatorId?.substring(0, 8)}...`,
        );
      });
    }

    // 4. 직원에게 할당된 프로젝트 할당 조회 (소프트 삭제된 항목 제외)
    const projectAssignments = await this.projectAssignmentRepository.find({
      where: {
        periodId: periodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });

    this.logger.log(`프로젝트 할당 ${projectAssignments.length}개 발견`);

    // 5. 직원에게 할당된 WBS 할당 조회 (소프트 삭제된 항목 제외, displayOrder/assignedDate 순으로 정렬)
    const wbsAssignments = await this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.deletedAt IS NULL')
      .orderBy('assignment.displayOrder', 'ASC')
      .addOrderBy('assignment.assignedDate', 'DESC')
      .getMany();

    this.logger.log(`WBS 할당 ${wbsAssignments.length}개 발견`);

    // 6. 할당된 WBS ID 목록 추출 (WBS 할당 기반)
    // 이전 평가기간 데이터 복사를 위해 평가라인 매핑이 없어도 모든 WBS 할당을 조회합니다
    const assignedWbsIds = wbsAssignments.map(
      (assignment) => assignment.wbsItemId,
    );

    this.logger.log(`실제 할당된 WBS ${assignedWbsIds.length}개`);

    // 7. WBS가 할당되지 않은 경우 빈 응답 반환
    if (assignedWbsIds.length === 0) {
      const periodDto = evaluationPeriod.DTO로_변환한다();

      return {
        evaluationPeriod: {
          id: periodDto.id,
          name: periodDto.name,
          startDate: periodDto.startDate,
          endDate: periodDto.peerEvaluationDeadline ?? undefined,
          status: periodDto.status,
        } as SimplifiedEvaluationPeriodDto,
        employee: {
          id: employee.id,
          name: employee.name,
          employeeNumber: employee.employeeNumber,
        } as SimplifiedEmployeeDto,
        projects: [],
        totalProjects: 0,
        totalWbs: 0,
      };
    }

    // 8. 할당된 WBS 정보 조회 (할당 순서 유지)
    // wbsAssignments의 순서를 유지하기 위해 Map 사용
    const wbsAssignmentMap = new Map<
      string,
      { wbsItemId: string; projectId: string; displayOrder: number; assignedDate: Date }
    >();
    for (const assignment of wbsAssignments) {
      wbsAssignmentMap.set(assignment.wbsItemId, {
        wbsItemId: assignment.wbsItemId,
        projectId: assignment.projectId,
        displayOrder: assignment.displayOrder,
        assignedDate: assignment.assignedDate,
      });
    }

    const assignedWbsList = await this.wbsItemRepository.find({
      where: {
        id: In(assignedWbsIds),
        deletedAt: IsNull(),
      },
    });

    this.logger.log(`조회된 WBS 아이템 ${assignedWbsList.length}개`);

    // 9. WBS를 프로젝트별로 그룹화 (할당 순서 유지)
    // WBS 할당이 있으면 프로젝트 할당 여부와 상관없이 모두 포함
    // (이전 평가기간 데이터 복사를 위해 WBS 할당이 있는 모든 프로젝트를 보여줌)
    const projectWbsMap = new Map<string, WbsItem[]>();
    
    // wbsAssignments 순서대로 처리 (이미 정렬되어 있음: displayOrder ASC, assignedDate DESC)
    for (const assignment of wbsAssignments) {
      const wbs = assignedWbsList.find((w) => w.id === assignment.wbsItemId);
      if (wbs) {
        if (!projectWbsMap.has(assignment.projectId)) {
          projectWbsMap.set(assignment.projectId, []);
        }
        projectWbsMap.get(assignment.projectId)!.push(wbs);
      }
    }

    // 10. 프로젝트 정보 조회 (삭제되지 않은 프로젝트만)
    const projectIds = Array.from(projectWbsMap.keys());
    const projectsList = await this.projectRepository.find({
      where: {
        id: In(projectIds),
        deletedAt: IsNull(),
      },
    });

    this.logger.log(`프로젝트 ${projectsList.length}개 조회됨`);

    projectsList.forEach((project) => {
      this.logger.log(
        `  프로젝트 ${project.name} (${project.projectCode}): managerId=${project.managerId || 'null'}`,
      );
    });

    const projectsMap = new Map<string, Project>();
    for (const project of projectsList) {
      projectsMap.set(project.id, project);
    }

    const wbsWithEvaluationLineSet = new Set(assignedWbsIds);

    // 11. WBS 평가기준 조회 (대시보드 API와 동일하게 subProject, isAdditional 포함)
    const wbsCriteriaMap = new Map<
      string,
      Array<{
        criterionId: string;
        criteria: string;
        importance: number;
        subProject?: string | null;
        isAdditional: boolean;
        createdAt: Date;
      }>
    >();

    if (assignedWbsIds.length > 0) {
      const criteriaRows = await this.wbsEvaluationCriteriaRepository
        .createQueryBuilder('criteria')
        .select([
          'criteria.id AS criteria_id',
          'criteria.wbsItemId AS criteria_wbs_item_id',
          'criteria.criteria AS criteria_criteria',
          'criteria.importance AS criteria_importance',
          'criteria.subProject AS criteria_sub_project',
          'criteria.isAdditional AS criteria_is_additional',
          'criteria.createdAt AS criteria_created_at',
        ])
        .where('criteria.wbsItemId IN (:...wbsItemIds)', {
          wbsItemIds: assignedWbsIds,
        })
        .andWhere('criteria.deletedAt IS NULL')
        .orderBy('criteria.createdAt', 'ASC')
        .getRawMany();

      this.logger.log(`WBS 평가기준 ${criteriaRows.length}개 조회됨`);

      for (const row of criteriaRows) {
        const wbsId = row.criteria_wbs_item_id;
        if (!wbsId) continue;

        if (!wbsCriteriaMap.has(wbsId)) {
          wbsCriteriaMap.set(wbsId, []);
        }

        wbsCriteriaMap.get(wbsId)!.push({
          criterionId: row.criteria_id,
          criteria: row.criteria_criteria || '',
          importance: row.criteria_importance || 5,
          subProject: row.criteria_sub_project || null,
          isAdditional: row.criteria_is_additional || false,
          createdAt: row.criteria_created_at,
        });
      }
    }

    // 12. 평가라인 정보 조회
    const evaluationLineIds = [
      ...new Set(
        lineMappings
          .map((mapping) => mapping.evaluationLineId)
          .filter((id) => id),
      ),
    ];

    this.logger.log(
      `평가라인 ID ${evaluationLineIds.length}개: ${JSON.stringify(evaluationLineIds)}`,
    );

    const evaluationLines =
      evaluationLineIds.length > 0
        ? await this.evaluationLineRepository.find({
            where: {
              id: In(evaluationLineIds),
              deletedAt: IsNull(),
            },
          })
        : [];

    this.logger.log(`평가라인 ${evaluationLines.length}개 조회됨`);

    if (evaluationLines.length > 0) {
      this.logger.log('평가라인 상세:');
      evaluationLines.forEach((line) => {
        this.logger.log(
          `  평가라인 ${line.id.substring(0, 8)}...: type=${line.evaluatorType}, order=${line.order}, isRequired=${line.isRequired}`,
        );
      });
    } else {
      this.logger.warn('조회된 평가라인이 없습니다!');
    }

    const evaluationLineMap = new Map<string, EvaluationLine>();
    for (const line of evaluationLines) {
      evaluationLineMap.set(line.id, line);
    }

    // 13. 평가자 정보 조회
    const evaluatorIds = [
      ...new Set(
        lineMappings.map((mapping) => mapping.evaluatorId).filter((id) => id),
      ),
    ];

    // 직원별 고정 1차 평가자 ID도 추가
    if (primaryEvaluatorMapping?.mapping_evaluator_id) {
      if (
        !evaluatorIds.includes(primaryEvaluatorMapping.mapping_evaluator_id)
      ) {
        evaluatorIds.push(primaryEvaluatorMapping.mapping_evaluator_id);
      }
    }

    this.logger.log(
      `평가자 ID ${evaluatorIds.length}개 (직원별 고정 1차 포함): ${JSON.stringify(evaluatorIds)}`,
    );

    // evaluatorId는 employee.id 또는 employee.externalId를 참조할 수 있음
    // 평가자도 삭제된 직원이어도 보여주기 위해 deletedAt 조건 제거
    const evaluators =
      evaluatorIds.length > 0
        ? await this.employeeRepository
            .createQueryBuilder('employee')
            .where(
              '(employee.id::text IN (:...evaluatorIds) OR employee.externalId IN (:...evaluatorIds))',
              { evaluatorIds },
            )
            .getMany()
        : [];

    this.logger.log(
      `평가자 ${evaluators.length}명 조회됨: ${evaluators.map((e) => `${e.name}${e.deletedAt ? ' (삭제됨)' : ''}`).join(', ')}`,
    );

    // evaluatorId로 매핑 (id와 externalId 모두 키로 등록)
    const evaluatorMap = new Map<string, Employee>();
    for (const evaluator of evaluators) {
      evaluatorMap.set(evaluator.id, evaluator);
      if (evaluator.externalId) {
        evaluatorMap.set(evaluator.externalId, evaluator);
      }
    }

    // 14. WBS별 평가자 정보 그룹화 (primary/secondary 분리)
    const wbsPrimaryEvaluatorMap = new Map<string, EvaluatorInfoDto>();
    const wbsSecondaryEvaluatorMap = new Map<string, EvaluatorInfoDto>();

    // 12-1. 직원별 고정 1차 평가자 처리 (대시보드 API와 동일한 로직)
    if (primaryEvaluatorMapping?.mapping_evaluator_id) {
      const evaluatorId = primaryEvaluatorMapping.mapping_evaluator_id;
      const evaluatorName = primaryEvaluatorMapping.evaluator_name || '';

      this.logger.log(
        `직원별 고정 1차 평가자 발견: ${evaluatorName} (ID: ${evaluatorId.substring(0, 8)}...)`,
      );

      // 모든 WBS에 대해 1차 평가자 동일 (직원별 고정)
      assignedWbsIds.forEach((wbsId) => {
        wbsPrimaryEvaluatorMap.set(wbsId, {
          evaluatorId,
          evaluatorName,
        });
      });

      this.logger.log(
        `모든 WBS ${assignedWbsIds.length}개에 고정 1차 평가자 할당: ${evaluatorName}`,
      );
    } else {
      this.logger.log(`직원별 고정 1차 평가자 없음 - WBS별 매핑에서 조회`);
    }

    // 12-2. WBS별 평가자 매핑 (wbsItemId가 있는 매핑)
    for (const mapping of lineMappings) {
      if (!mapping.wbsItemId) continue; // 직원별 고정 담당자는 이미 처리했으므로 스킵

      const evaluationLine = evaluationLineMap.get(mapping.evaluationLineId);
      const evaluator = evaluatorMap.get(mapping.evaluatorId);

      if (evaluationLine && evaluator) {
        const evaluatorInfo: EvaluatorInfoDto = {
          evaluatorId: evaluator.id,
          evaluatorName: evaluator.name,
        };

        if (evaluationLine.evaluatorType === 'primary') {
          // WBS별 1차 평가자 (직원별 고정 담당자보다 우선)
          wbsPrimaryEvaluatorMap.set(mapping.wbsItemId, evaluatorInfo);
          this.logger.log(
            `  WBS ${mapping.wbsItemId.substring(0, 8)}...에 WBS별 1차 평가자 추가: ${evaluator.name}`,
          );
        } else if (evaluationLine.evaluatorType === 'secondary') {
          wbsSecondaryEvaluatorMap.set(mapping.wbsItemId, evaluatorInfo);
          this.logger.log(
            `  WBS ${mapping.wbsItemId.substring(0, 8)}...에 2차 평가자 추가: ${evaluator.name}`,
          );
        }
      } else {
        this.logger.warn(
          `  평가라인 또는 평가자 정보 누락 - lineId: ${mapping.evaluationLineId}, evaluatorId: ${mapping.evaluatorId}`,
        );
      }
    }

    this.logger.log(
      `WBS별 평가자 매핑 완료: 1차 ${wbsPrimaryEvaluatorMap.size}개, 2차 ${wbsSecondaryEvaluatorMap.size}개`,
    );

    // 15. 프로젝트 매니저 정보 조회
    const managerIds = [
      ...new Set(
        projectsList
          .map((project) => project.managerId)
          .filter((id): id is string => !!id),
      ),
    ];

    this.logger.log(
      `프로젝트 매니저 ID ${managerIds.length}개 발견: ${JSON.stringify(managerIds)}`,
    );

    // managerId는 employee.externalId를 참조함
    // PM은 삭제된 직원이어도 보여주기 위해 deletedAt 조건 제거
    const managers =
      managerIds.length > 0
        ? await this.employeeRepository.find({
            where: {
              externalId: In(managerIds), // ⭐ id가 아니라 externalId로 조회
            },
          })
        : [];

    this.logger.log(
      `프로젝트 매니저 ${managers.length}명 조회됨: ${managers.map((m) => `${m.name}${m.deletedAt ? ' (삭제됨)' : ''}`).join(', ')}`,
    );

    // managerId는 externalId를 참조하므로 externalId로 매핑
    const managerMap = new Map<string, Employee>();
    for (const manager of managers) {
      if (manager.externalId) {
        managerMap.set(manager.externalId, manager);
      }
    }

    // 14. 응답 DTO 생성
    const projects: AssignedProjectDto[] = [];
    let totalWbs = 0;

    for (const [projectId, wbsList] of projectWbsMap.entries()) {
      const project = projectsMap.get(projectId);
      if (!project) continue; // 프로젝트가 삭제된 경우 건너뛰기

      const wbsItemDtos: AssignedWbsItemDto[] = wbsList.map((wbs) => {
        totalWbs++;

        // 평가기준 목록 변환 (대시보드 API와 동일하게 subProject, isAdditional 포함)
        const wbsCriteriaList = wbsCriteriaMap.get(wbs.id) || [];
        const criteriaDto = wbsCriteriaList.map((criteria) => ({
          criterionId: criteria.criterionId,
          criteria: criteria.criteria,
          importance: criteria.importance,
          subProject: criteria.subProject, // ⭐ 평가기준에 subProject 포함
          isAdditional: criteria.isAdditional, // ⭐ 추가 과제 여부 포함
          createdAt: criteria.createdAt,
        }));

        return {
          wbsId: wbs.id,
          wbsName: wbs.title, // WbsItem 엔티티의 실제 속성은 'title'
          wbsCode: wbs.wbsCode, // WbsItem 엔티티의 실제 속성은 'wbsCode'
          criteria: criteriaDto, // 평가기준 목록 (criteria 레벨에 subProject 포함)
          primaryDownwardEvaluation: wbsPrimaryEvaluatorMap.get(wbs.id),
          secondaryDownwardEvaluation: wbsSecondaryEvaluatorMap.get(wbs.id),
        };
      });

      // 프로젝트 매니저 정보 추가
      let projectManagerInfo: ProjectManagerInfoDto | undefined = undefined;
      if (project.managerId) {
        const manager = managerMap.get(project.managerId);
        if (manager) {
          projectManagerInfo = {
            id: manager.id,
            name: manager.name,
          };
          this.logger.log(
            `  프로젝트 ${project.name}에 PM 할당: ${manager.name}`,
          );
        } else {
          this.logger.warn(
            `  프로젝트 ${project.name}의 PM을 찾을 수 없음: managerId=${project.managerId}`,
          );
        }
      } else {
        this.logger.log(`  프로젝트 ${project.name}에 PM이 설정되지 않음`);
      }

      const primaryCount = wbsItemDtos.filter(
        (w) => w.primaryDownwardEvaluation,
      ).length;
      const secondaryCount = wbsItemDtos.filter(
        (w) => w.secondaryDownwardEvaluation,
      ).length;

      this.logger.log(
        `  프로젝트 ${project.name}: WBS ${wbsItemDtos.length}개, 1차 평가자 ${primaryCount}개, 2차 평가자 ${secondaryCount}개`,
      );

      projects.push({
        projectId: project.id,
        projectName: project.name,
        projectCode: project.projectCode ?? '', // Project 엔티티의 실제 속성은 'projectCode'
        projectManager: projectManagerInfo,
        wbsList: wbsItemDtos,
      });
    }

    const periodDto = evaluationPeriod.DTO로_변환한다();

    const response: EmployeePeriodAssignmentsResponseDto = {
      evaluationPeriod: {
        id: periodDto.id,
        name: periodDto.name,
        startDate: periodDto.startDate,
        endDate: periodDto.peerEvaluationDeadline ?? undefined,
        status: periodDto.status,
      } as SimplifiedEvaluationPeriodDto,
      employee: {
        id: employee.id,
        name: employee.name,
        employeeNumber: employee.employeeNumber,
      } as SimplifiedEmployeeDto,
      projects,
      totalProjects: projects.length,
      totalWbs,
    };

    this.logger.log(
      `직원 평가기간별 할당정보 조회 완료 - 프로젝트: ${projects.length}개, WBS: ${totalWbs}개`,
    );

    return response;
  }
}
