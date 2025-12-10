import {
  GetEmployeeSelfEvaluationsQuery,
  GetWbsSelfEvaluationDetailQuery,
} from '@context/performance-evaluation-context/handlers/self-evaluation';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { ParseUUID, Roles } from '@interface/common/decorators';
import { Body, Controller, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ClearAllWbsSelfEvaluationsByEmployeePeriod,
  ClearWbsSelfEvaluation,
  ClearWbsSelfEvaluationsByProject,
  GetEmployeeSelfEvaluations,
  GetWbsSelfEvaluationDetail,
  ResetAllWbsSelfEvaluationsByEmployeePeriod,
  ResetWbsSelfEvaluation,
  ResetWbsSelfEvaluationsByProject,
  ResetWbsSelfEvaluationToEvaluator,
  ResetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod,
  ResetWbsSelfEvaluationsToEvaluatorByProject,
  SubmitAllWbsSelfEvaluationsByEmployeePeriod,
  SubmitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod,
  SubmitWbsSelfEvaluation,
  SubmitWbsSelfEvaluationToEvaluator,
  SubmitWbsSelfEvaluationsByProject,
  SubmitWbsSelfEvaluationsToEvaluatorByProject,
  UpsertWbsSelfEvaluation,
} from '@interface/common/decorators/performance-evaluation/wbs-self-evaluation-api.decorators';
import {
  ClearAllWbsSelfEvaluationsResponseDto,
  ClearWbsSelfEvaluationsByProjectResponseDto,
  CreateWbsSelfEvaluationBodyDto,
  EmployeeSelfEvaluationsResponseDto,
  ResetAllWbsSelfEvaluationsResponseDto,
  ResetWbsSelfEvaluationsByProjectResponseDto,
  SubmitAllWbsSelfEvaluationsResponseDto,
  SubmitWbsSelfEvaluationsByProjectResponseDto,
  WbsSelfEvaluationDetailResponseDto,
  WbsSelfEvaluationFilterDto,
  WbsSelfEvaluationResponseDto,
} from '@interface/common/dto/performance-evaluation/wbs-self-evaluation.dto';

/**
 * WBS 자기평가 관리 컨트롤러
 *
 * WBS 자기평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('C-6. 평가자 - 성과평가 - WBS 자기평가')
@ApiBearerAuth('Bearer')
@Roles('evaluator')
@Controller('evaluator/performance-evaluation/wbs-self-evaluations')
export class EvaluatorWbsSelfEvaluationManagementController {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly wbsSelfEvaluationBusinessService: WbsSelfEvaluationBusinessService,
  ) {}

  /**
   * WBS 자기평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  @UpsertWbsSelfEvaluation()
  async upsertWbsSelfEvaluation(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('wbsItemId') wbsItemId: string,
    @ParseUUID('periodId') periodId: string,
    @Body() dto: CreateWbsSelfEvaluationBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const actionBy = user.id;

    return await this.performanceEvaluationService.WBS자기평가를_저장한다(
      periodId,
      employeeId,
      wbsItemId,
      dto.selfEvaluationContent,
      dto.selfEvaluationScore,
      dto.performanceResult,
      actionBy,
    );
  }

  /**
   * 직원의 전체 WBS 자기평가 제출 (1차 평가자 → 관리자)
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 관리자에게 한 번에 제출합니다.
   * 해당 평가기간에 발생한 자기평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   */
  @SubmitAllWbsSelfEvaluationsByEmployeePeriod()
  async submitAllWbsSelfEvaluationsByEmployeePeriod(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubmitAllWbsSelfEvaluationsResponseDto> {
    const submittedBy = user.id;
    return await this.wbsSelfEvaluationBusinessService.직원의_전체_WBS자기평가를_제출하고_재작성요청을_완료한다(
      employeeId,
      periodId,
      submittedBy,
    );
  }

  /**
   * 직원의 전체 WBS 자기평가 제출 (피평가자 → 1차 평가자)
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 1차 평가자에게 한 번에 제출합니다.
   */
  @SubmitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod()
  async submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubmitAllWbsSelfEvaluationsResponseDto> {
    const submittedBy = user.id;
    return await this.wbsSelfEvaluationBusinessService.직원의_전체_자기평가를_1차평가자에게_제출한다(
      employeeId,
      periodId,
      submittedBy,
    );
  }

  /**
   * 프로젝트별 WBS 자기평가 제출 (1차 평가자 → 관리자)
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 관리자에게 한 번에 제출합니다.
   */
  @SubmitWbsSelfEvaluationsByProject()
  async submitWbsSelfEvaluationsByProject(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubmitWbsSelfEvaluationsByProjectResponseDto> {
    const submittedBy = user.id;
    return await this.performanceEvaluationService.프로젝트별_WBS자기평가를_제출한다(
      employeeId,
      periodId,
      projectId,
      submittedBy,
    );
  }

  /**
   * 프로젝트별 WBS 자기평가 제출 (피평가자 → 1차 평가자)
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 1차 평가자에게 한 번에 제출합니다.
   */
  @SubmitWbsSelfEvaluationsToEvaluatorByProject()
  async submitWbsSelfEvaluationsToEvaluatorByProject(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SubmitWbsSelfEvaluationsByProjectResponseDto> {
    const submittedBy = user.id;
    const result =
      await this.performanceEvaluationService.프로젝트별_자기평가를_1차평가자에게_제출한다(
        employeeId,
        periodId,
        projectId,
        submittedBy,
      );
    // 피평가자 → 1차 평가자 제출 응답을 DTO 형식으로 변환
    return {
      ...result,
      completedEvaluations: result.completedEvaluations.map((e) => {
        const { submittedToEvaluatorAt, ...rest } = e;
        return {
          ...rest,
          submittedToEvaluatorAt,
        };
      }),
    } as SubmitWbsSelfEvaluationsByProjectResponseDto;
  }

  /**
   * 직원의 전체 WBS 자기평가 취소 (피평가자 → 1차 평가자 제출 취소)
   * 특정 직원의 특정 평가기간에 대한 모든 1차 평가자 제출 완료된 WBS 자기평가를 취소합니다.
   */
  @ResetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod()
  async resetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResetAllWbsSelfEvaluationsResponseDto> {
    const resetBy = user.id;
    const result =
      await this.wbsSelfEvaluationBusinessService.직원의_전체_자기평가를_1차평가자_제출_취소한다(
        employeeId,
        periodId,
        resetBy,
      );
    // 1차 평가자 제출 취소 응답을 DTO 형식으로 변환
    return {
      resetCount: result.resetCount,
      failedCount: result.failedCount,
      totalCount: result.totalCount,
      resetEvaluations: result.resetEvaluations.map((e) => ({
        evaluationId: e.evaluationId,
        wbsItemId: e.wbsItemId,
        selfEvaluationContent: e.selfEvaluationContent,
        selfEvaluationScore: e.selfEvaluationScore,
        performanceResult: e.performanceResult,
        wasSubmittedToManager: false, // 1차 평가자 제출 취소는 관리자 제출과 무관
      })),
      failedResets: result.failedResets,
    } as ResetAllWbsSelfEvaluationsResponseDto;
  }

  /**
   * 프로젝트별 WBS 자기평가 취소 (피평가자 → 1차 평가자 제출 취소)
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 1차 평가자 제출 완료된 WBS 자기평가를 취소합니다.
   */
  @ResetWbsSelfEvaluationsToEvaluatorByProject()
  async resetWbsSelfEvaluationsToEvaluatorByProject(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ResetWbsSelfEvaluationsByProjectResponseDto> {
    const resetBy = user.id;
    const result =
      await this.performanceEvaluationService.프로젝트별_자기평가를_1차평가자_제출_취소한다(
        employeeId,
        periodId,
        projectId,
        resetBy,
      );
    // 피평가자 → 1차 평가자 제출 취소 응답을 DTO 형식으로 변환
    return {
      ...result,
      resetEvaluations: result.resetEvaluations.map((e) => ({
        ...e,
        wasSubmittedToManager: false, // 1차 평가자 제출 취소는 관리자 제출과 무관
      })),
    } as ResetWbsSelfEvaluationsByProjectResponseDto;
  }

  /**
   * 직원의 전체 WBS 자기평가 내용 초기화
   * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가 내용을 초기화합니다.
   */
  @ClearAllWbsSelfEvaluationsByEmployeePeriod()
  async clearAllWbsSelfEvaluationsByEmployeePeriod(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClearAllWbsSelfEvaluationsResponseDto> {
    const clearedBy = user.id;
    return await this.performanceEvaluationService.직원의_전체_WBS자기평가_내용을_초기화한다(
      {
        employeeId,
        periodId,
        clearedBy,
      },
    );
  }

  /**
   * 프로젝트별 WBS 자기평가 내용 초기화
   * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가 내용을 초기화합니다.
   */
  @ClearWbsSelfEvaluationsByProject()
  async clearWbsSelfEvaluationsByProject(
    @ParseUUID('employeeId') employeeId: string,
    @ParseUUID('periodId') periodId: string,
    @ParseUUID('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClearWbsSelfEvaluationsByProjectResponseDto> {
    const clearedBy = user.id;
    return await this.performanceEvaluationService.프로젝트별_WBS자기평가_내용을_초기화한다(
      {
        employeeId,
        periodId,
        projectId,
        clearedBy,
      },
    );
  }
}
