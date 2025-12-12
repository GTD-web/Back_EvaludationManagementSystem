import { WbsSelfEvaluationBusinessService } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.service';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import { ParseUUID, Roles } from '@interface/common/decorators';
import { Body, Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ClearAllWbsSelfEvaluationsByEmployeePeriod,
  ClearWbsSelfEvaluation,
  ClearWbsSelfEvaluationsByProject,
  SubmitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod,
  SubmitWbsSelfEvaluationsToEvaluatorByProject,
  SubmitWbsSelfEvaluationToEvaluator,
  UpsertWbsSelfEvaluation,
} from '@interface/common/decorators/performance-evaluation/wbs-self-evaluation-api.decorators';
import {
  ClearAllWbsSelfEvaluationsResponseDto,
  ClearWbsSelfEvaluationsByProjectResponseDto,
  CreateWbsSelfEvaluationBodyDto,
  SubmitAllWbsSelfEvaluationsResponseDto,
  SubmitWbsSelfEvaluationsByProjectResponseDto,
  WbsSelfEvaluationResponseDto,
} from '@interface/common/dto/performance-evaluation/wbs-self-evaluation.dto';

/**
 * WBS 자기평가 관리 컨트롤러
 *
 * WBS 자기평가의 저장(생성/수정), 제출, 조회 기능을 제공합니다.
 */
@ApiTags('A-6. 사용자 - 성과평가 - WBS 자기평가')
@ApiBearerAuth('Bearer')
@Roles('user')
@Controller('user/performance-evaluation/wbs-self-evaluations')
export class UserWbsSelfEvaluationManagementController {
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
      dto.subProject,
      actionBy,
    );
  }

  /**
   * WBS 자기평가 제출 (피평가자 → 1차 평가자)
   */
  @SubmitWbsSelfEvaluationToEvaluator()
  async submitWbsSelfEvaluationToEvaluator(
    @ParseUUID('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const submittedBy = user.id;
    return await this.performanceEvaluationService.피평가자가_1차평가자에게_자기평가를_제출한다(
      id,
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
   * WBS 자기평가 내용 초기화 (단일)
   * 특정 WBS 자기평가의 내용(selfEvaluationContent, selfEvaluationScore, performanceResult)을 초기화합니다.
   */
  @ClearWbsSelfEvaluation()
  async clearWbsSelfEvaluation(
    @ParseUUID('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WbsSelfEvaluationResponseDto> {
    const clearedBy = user.id;
    return await this.performanceEvaluationService.WBS자기평가_내용을_초기화한다(
      {
        evaluationId: id,
        clearedBy,
      },
    );
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
