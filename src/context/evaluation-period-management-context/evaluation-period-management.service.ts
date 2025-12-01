import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InvalidDownwardEvaluationScoreException } from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import {
  EvaluationPeriodDto,
  EvaluationPeriodPhase,
} from '../../domain/core/evaluation-period/evaluation-period.types';
import { EvaluationPeriodService } from '../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodAutoPhaseService } from '../../domain/core/evaluation-period/evaluation-period-auto-phase.service';
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
    this.logger.debug('평가 점수 검증 시작', { periodId, score });

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

    this.logger.debug('평가 점수 검증 완료', { periodId, score, maxRate });
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
      throw new Error(`소스 평가기간을 찾을 수 없습니다. (id: ${sourcePeriodId})`);
    }

    // 2. 타겟 평가기간 조회
    const targetPeriod = await this.평가기간상세_조회한다(targetPeriodId);
    if (!targetPeriod) {
      throw new Error(`타겟 평가기간을 찾을 수 없습니다. (id: ${targetPeriodId})`);
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
        finalEvaluationSettingEnabled: sourcePeriod.finalEvaluationSettingEnabled,
      },
      updatedBy,
    );

    this.logger.log(
      `평가기간 복제 완료 - 소스: ${sourcePeriodId}, 타겟: ${targetPeriodId}`,
    );

    // 4. 업데이트된 타겟 평가기간 반환
    const updatedPeriod = await this.평가기간상세_조회한다(targetPeriodId);
    return updatedPeriod!;
  }
}
