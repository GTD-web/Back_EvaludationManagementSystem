import { Body, Controller, ParseBoolPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { EvaluationTargetBusinessService } from '@business/evaluation-target/evaluation-target-business.service';
import { ParseUUID } from '@interface/common/decorators/parse-uuid.decorator';
import { Roles } from '@interface/common/decorators';
import { CurrentUser } from '@interface/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import {
  CheckEvaluationTarget,
  ExcludeEvaluationTarget,
  GetEmployeeEvaluationPeriods,
  GetEvaluationTargets,
  GetExcludedEvaluationTargets,
  GetUnregisteredEmployees,
  IncludeEvaluationTarget,
  RegisterBulkEvaluationTargets,
  RegisterEvaluationTarget,
  UnregisterAllEvaluationTargets,
  UnregisterEvaluationTarget,
} from '@interface/common/decorators/evaluation-period/evaluation-target-api.decorators';
import {
  EmployeeEvaluationPeriodsResponseDto,
  EvaluationTargetMappingResponseDto,
  EvaluationTargetStatusResponseDto,
  EvaluationTargetsResponseDto,
  ExcludeEvaluationTargetDto,
  RegisterBulkEvaluationTargetsDto,
  UnregisteredEmployeesResponseDto,
} from '@interface/common/dto/evaluation-period/evaluation-target.dto';

/**
 * 평가 대상 관리 컨트롤러
 *
 * 평가기간별 평가 대상자 등록, 제외/포함, 조회 등을 처리하는 API 엔드포인트를 제공합니다.
 */
@ApiTags('A-3. 관리자 - 평가 대상')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/evaluation-periods')
export class EvaluationTargetController {
  constructor(
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService,
    private readonly evaluationTargetBusinessService: EvaluationTargetBusinessService,
  ) {}

  /**
   * 평가 대상자 대량 등록
   *
   * 평가 대상자를 등록하고 각 직원의 부서장을 1차 평가자로 자동 할당합니다.
   *
   * 주의: 이 메서드는 단일 등록 메서드보다 먼저 정의되어야 합니다.
   * NestJS는 라우트를 순서대로 매칭하므로, /targets/bulk가 /targets/:employeeId보다 먼저 매칭되어야 합니다.
   */
  @RegisterBulkEvaluationTargets()
  async registerBulkEvaluationTargets(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @Body() dto: RegisterBulkEvaluationTargetsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationTargetMappingResponseDto[]> {
    const results =
      await this.evaluationTargetBusinessService.평가대상자를_대량_등록한다(
        evaluationPeriodId,
        dto.employeeIds,
        user.id,
      );

    // RegisterWithAutoEvaluatorResult[]에서 mapping 필드만 추출하여 반환
    return results.map((result) => result.mapping as any);
  }

  /**
   * 평가 대상자 등록
   *
   * 평가 대상자를 등록하고 해당 직원의 부서장을 1차 평가자로 자동 할당합니다.
   *
   * Note: createdBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
   */
  @RegisterEvaluationTarget()
  async registerEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationTargetMappingResponseDto> {
    const result =
      await this.evaluationTargetBusinessService.평가대상자를_등록한다(
        evaluationPeriodId,
        employeeId,
        user.id,
      );

    // RegisterWithAutoEvaluatorResult에서 mapping 필드만 추출하여 반환
    return result.mapping as any;
  }

  /**
   * 평가 대상 제외
   */
  @ExcludeEvaluationTarget()
  async excludeEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @Body() dto: ExcludeEvaluationTargetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationTargetMappingResponseDto> {
    return await this.evaluationPeriodManagementService.평가대상에서_제외한다(
      evaluationPeriodId,
      employeeId,
      dto.excludeReason,
      user.id,
    );
  }

  /**
   * 평가 대상 포함 (제외 취소)
   *
   * Note: updatedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
   */
  @IncludeEvaluationTarget()
  async includeEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EvaluationTargetMappingResponseDto> {
    return await this.evaluationPeriodManagementService.평가대상에_포함한다(
      evaluationPeriodId,
      employeeId,
      user.id,
    );
  }

  /**
   * 평가기간의 평가 대상자 조회
   */
  @GetEvaluationTargets()
  async getEvaluationTargets(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @Query('includeExcluded', new ParseBoolPipe({ optional: true }))
    includeExcluded: boolean = false,
  ): Promise<EvaluationTargetsResponseDto> {
    const targets =
      await this.evaluationPeriodManagementService.평가기간의_평가대상자_조회한다(
        evaluationPeriodId,
        includeExcluded,
      );

    return {
      evaluationPeriodId,
      targets: targets.map((target) => {
        const { evaluationPeriodId: _, employeeId: __, ...rest } = target;
        return rest;
      }),
    };
  }

  /**
   * 제외된 평가 대상자 조회
   */
  @GetExcludedEvaluationTargets()
  async getExcludedEvaluationTargets(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
  ): Promise<EvaluationTargetsResponseDto> {
    const targets =
      await this.evaluationPeriodManagementService.평가기간의_제외된_대상자_조회한다(
        evaluationPeriodId,
      );

    return {
      evaluationPeriodId,
      targets: targets.map((target) => {
        const { evaluationPeriodId: _, employeeId: __, ...rest } = target;
        return rest;
      }),
    };
  }

  /**
   * 직원의 평가기간 맵핑 조회
   */
  @GetEmployeeEvaluationPeriods()
  async getEmployeeEvaluationPeriods(
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EmployeeEvaluationPeriodsResponseDto> {
    const mappings =
      await this.evaluationPeriodManagementService.직원의_평가기간_맵핑_조회한다(
        employeeId,
      );

    // 첫 번째 맵핑에서 직원 정보 추출 (모든 맵핑의 직원 정보는 동일)
    const employee =
      mappings.length > 0
        ? mappings[0].employee
        : {
            id: employeeId,
            employeeNumber: '',
            name: '알 수 없음',
            email: '',
            status: '',
          };

    return {
      employee,
      mappings: mappings.map((mapping) => {
        const { employee: _, employeeId: __, ...rest } = mapping;
        return rest;
      }),
    };
  }

  /**
   * 평가 대상 여부 확인
   */
  @CheckEvaluationTarget()
  async checkEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
  ): Promise<EvaluationTargetStatusResponseDto> {
    return await this.evaluationPeriodManagementService.평가대상_여부_확인한다(
      evaluationPeriodId,
      employeeId,
    );
  }

  /**
   * 등록되지 않은 직원 목록 조회
   *
   * 특정 평가기간에 평가 대상자로 등록되지 않은 활성 직원 목록을 조회합니다.
   */
  @GetUnregisteredEmployees()
  async getUnregisteredEmployees(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
  ): Promise<UnregisteredEmployeesResponseDto> {
    return await this.evaluationPeriodManagementService.평가기간에_등록되지_않은_직원_목록을_조회한다(
      evaluationPeriodId,
    );
  }

  /**
   * 평가 대상자 등록 해제
   *
   * 평가 대상자 등록을 해제하고 관련된 모든 평가라인 매핑(1차, 2차 평가자)도 함께 삭제합니다.
   */
  @UnregisterEvaluationTarget()
  async unregisterEvaluationTarget(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
    @ParseUUID('employeeId') employeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    const result =
      await this.evaluationTargetBusinessService.평가대상자_등록_해제한다(
        evaluationPeriodId,
        employeeId,
        user.id,
      );

    return { success: result };
  }

  /**
   * 평가기간의 모든 대상자 등록 해제
   */
  @UnregisterAllEvaluationTargets()
  async unregisterAllEvaluationTargets(
    @ParseUUID('evaluationPeriodId') evaluationPeriodId: string,
  ): Promise<{ deletedCount: number }> {
    const deletedCount =
      await this.evaluationPeriodManagementService.평가기간의_모든_대상자_해제한다(
        evaluationPeriodId,
      );

    return { deletedCount };
  }
}
