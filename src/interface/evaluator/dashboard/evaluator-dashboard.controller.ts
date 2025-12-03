import { DashboardService } from '@context/dashboard-context/dashboard.service';
import { ParseUUID } from '@interface/common/decorators';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import {
  GetEmployeeAssignedData,
  GetEmployeeEvaluationPeriodStatus,
  GetEvaluatorAssignedEmployeesData,
  GetMyAssignedData,
  GetMyEvaluationTargetsStatus,
} from '@interface/common/decorators/dashboard/dashboard-api.decorators';
import {
  EmployeeAssignedDataResponseDto,
  EvaluatorAssignedEmployeesDataResponseDto,
} from '@interface/common/dto/dashboard/employee-assigned-data.dto';
import { EmployeeEvaluationPeriodStatusResponseDto } from '@interface/common/dto/dashboard/employee-evaluation-period-status.dto';
import { MyEvaluationTargetStatusResponseDto } from '@interface/common/dto/dashboard/my-evaluation-targets-status.dto';
import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * 평가자용 대시보드 컨트롤러
 *
 * 평가 관련 대시보드 정보 조회 기능을 제공합니다.
 * 직원별 평가기간 현황, 평가 진행 상태 등의 정보를 제공합니다.
 */
@ApiTags('A-0-2. 평가자 - 대시보드')
@ApiBearerAuth('Bearer')
@Controller('evaluator/dashboard')
export class EvaluatorDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * 내가 담당하는 평가 대상자 현황을 조회합니다.
   */
  @GetMyEvaluationTargetsStatus()
  async getMyEvaluationTargetsStatus(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('evaluatorId') evaluatorId: string,
  ): Promise<MyEvaluationTargetStatusResponseDto[]> {
    return await this.dashboardService.내가_담당하는_평가대상자_현황을_조회한다(
      evaluationPeriodId,
      evaluatorId,
    );
  }

  /**
   * 직원의 평가기간 현황을 조회합니다.
   * (평가자가 사용)
   */
  @GetEmployeeEvaluationPeriodStatus()
  async getEmployeeEvaluationPeriodStatus(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeEvaluationPeriodStatusResponseDto | null> {
    const result = await this.dashboardService.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    if (!result) {
      return null;
    }

    // 최상위 레벨의 evaluationCriteria, wbsCriteria, evaluationLine 필드 제거
    const { evaluationCriteria, wbsCriteria, evaluationLine, ...rest } =
      result as any;
    return rest as EmployeeEvaluationPeriodStatusResponseDto;
  }

  /**
   * 현재 로그인한 사용자의 할당된 정보를 조회합니다.
   * 피평가자는 2차 평가자의 하향평가를 볼 수 없습니다.
   */
  @GetMyAssignedData()
  async getMyAssignedData(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeAssignedDataResponseDto> {
    const data = await this.dashboardService.사용자_할당_정보를_조회한다(
      evaluationPeriodId,
      user.id, // JWT에서 추출한 현재 로그인 사용자의 ID
      user.id, // viewerId (본인이 조회하므로 Activity Log 기록하지 않음)
    );

    // 피평가자는 2차 평가자의 하향평가를 볼 수 없음 (1차 하향평가는 제공)
    return this.이차_하향평가_정보를_제거한다(data);
  }

  /**
   * 사용자 할당 정보를 조회합니다.
   * 평가자가 다른 직원의 데이터를 조회하면 Activity Log에 'viewed' 활동이 기록됩니다.
   */
  @GetEmployeeAssignedData()
  async getEmployeeAssignedData(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployeeAssignedDataResponseDto> {
    return await this.dashboardService.사용자_할당_정보를_조회한다(
      evaluationPeriodId,
      employeeId,
      user.id, // viewerId (평가자가 조회하므로 Activity Log 기록)
    );
  }

  /**
   * 2차 하향평가 정보를 제거합니다.
   * 피평가자가 자신의 할당 정보를 조회할 때 사용됩니다.
   * 1차 하향평가 정보는 유지하고, 2차 하향평가의 평가 내용(점수, 코멘트)만 제거합니다.
   * 평가자 정보(evaluatorId, evaluatorName, isCompleted)는 유지됩니다.
   */
  private 이차_하향평가_정보를_제거한다(
    data: EmployeeAssignedDataResponseDto,
  ): EmployeeAssignedDataResponseDto {
    // 각 프로젝트의 WBS에서 2차 하향평가의 평가 내용만 제거 (평가자 정보는 유지)
    const projectsWithoutSecondaryDownwardEvaluation = data.projects.map(
      (project) => ({
        ...project,
        wbsList: project.wbsList.map((wbs) => ({
          ...wbs,
          // primaryDownwardEvaluation은 유지
          // secondaryDownwardEvaluation은 평가자 정보만 유지하고 평가 내용은 제거
          secondaryDownwardEvaluation: wbs.secondaryDownwardEvaluation
            ? {
                evaluatorId: wbs.secondaryDownwardEvaluation.evaluatorId,
                evaluatorName: wbs.secondaryDownwardEvaluation.evaluatorName,
                isCompleted: wbs.secondaryDownwardEvaluation.isCompleted,
                // 평가 내용은 제거
                // downwardEvaluationId, evaluationContent, score, submittedAt은 포함하지 않음
              }
            : null,
        })),
      }),
    );

    // summary에서 2차 하향평가 점수/등급만 제거 (평가자 목록은 유지)
    const summaryWithoutSecondaryDownwardEvaluation = {
      ...data.summary,
      // primaryDownwardEvaluation은 유지
      secondaryDownwardEvaluation: {
        totalScore: null,
        grade: null,
        isSubmitted: data.summary.secondaryDownwardEvaluation?.isSubmitted || false,
        evaluators: data.summary.secondaryDownwardEvaluation?.evaluators || [],
      },
    };

    return {
      ...data,
      projects: projectsWithoutSecondaryDownwardEvaluation,
      summary: summaryWithoutSecondaryDownwardEvaluation,
    };
  }

  @GetEvaluatorAssignedEmployeesData()
  async getEvaluatorAssignedEmployeesData(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('evaluatorId') evaluatorId: string,
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EvaluatorAssignedEmployeesDataResponseDto> {
    return await this.dashboardService.담당자의_피평가자_할당_정보를_조회한다(
      evaluationPeriodId,
      evaluatorId,
      employeeId,
    );
  }
}
