import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EvaluationPeriodManagementContextService } from '../../context/evaluation-period-management-context/evaluation-period-management.service';
import { EvaluationCriteriaManagementService } from '../../context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { CreateEvaluationPeriodMinimalDto, UpdateEvaluationPeriodBasicDto } from '../../context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import { CreateEvaluationPeriodWithTargetsResult } from '../../context/evaluation-period-management-context/handlers/evaluation-period/commands/create-evaluation-period-with-auto-targets.handler';
import { RegisterWithAutoEvaluatorResult } from '../../context/evaluation-period-management-context/handlers/evaluation-target/commands/register-evaluation-target-with-auto-evaluator.handler';
import { EvaluationPeriodPhase } from '../../domain/core/evaluation-period/evaluation-period.types';
import type { EvaluationPeriodDto } from '../../domain/core/evaluation-period/evaluation-period.types';
import { EvaluationPeriodService } from '../../domain/core/evaluation-period/evaluation-period.service';
import { RecalculateAllEmployeesWeightForPeriodCommand } from '../../context/evaluation-criteria-management-context/handlers/wbs-assignment/commands/recalculate-all-employees-weight-for-period.handler';

/**
 * 평가기간 비즈니스 서비스
 *
 * 평가기간 관련 비즈니스 로직의 오케스트레이션을 담당합니다.
 * 실제 비즈니스 로직은 각 Context의 핸들러에서 처리됩니다.
 */
@Injectable()
export class EvaluationPeriodBusinessService {
  private readonly logger = new Logger(EvaluationPeriodBusinessService.name);

  constructor(
    private readonly evaluationPeriodManagementService: EvaluationPeriodManagementContextService,
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * 평가기간을 생성하고 평가 대상자 및 1차 평가자를 자동 할당한다 (오케스트레이션만)
   */
  async 평가기간을_생성한다(
    createData: CreateEvaluationPeriodMinimalDto,
    createdBy: string,
  ): Promise<CreateEvaluationPeriodWithTargetsResult> {
    // 1. 평가기간 생성 및 평가 대상자 자동 등록
    const result =
      await this.evaluationPeriodManagementService.평가기간을_대상자와_함께_생성한다(
        createData,
        createdBy,
      );

    // 2. 전직원에 대한 1차 평가라인 자동 구성 (managerId 기반)
    try {
      await this.evaluationCriteriaManagementService.평가기간의_모든_직원에_대해_managerId로_1차_평가자를_자동_구성한다(
        result.evaluationPeriod.id,
        createdBy,
      );
    } catch (error) {
      // 평가라인 자동 구성 실패는 경고로 처리하고 평가기간 생성은 성공으로 간주
      this.logger.warn(
        `전직원 1차 평가라인 자동 구성 실패 - 평가기간: ${result.evaluationPeriod.id}`,
        error.stack,
      );
      result.warnings.push(
        `전직원 1차 평가라인 자동 구성 실패: ${error.message}`,
      );
    }

    return result;
  }

  /**
   * 평가 대상자를 대량 등록하고 1차 평가자를 자동 할당한다 (오케스트레이션만)
   */
  async 평가대상자를_대량_등록한다(
    evaluationPeriodId: string,
    employeeIds: string[],
    createdBy: string,
  ): Promise<RegisterWithAutoEvaluatorResult[]> {
    this.logger.log(
      `평가 대상자 대량 등록 비즈니스 로직 시작 - 평가기간: ${evaluationPeriodId}, 직원 수: ${employeeIds.length}명`,
    );

    const results: RegisterWithAutoEvaluatorResult[] = [];

    for (const employeeId of employeeIds) {
      try {
        const result =
          await this.evaluationPeriodManagementService.평가대상자를_자동평가자와_함께_등록한다(
            evaluationPeriodId,
            employeeId,
            createdBy,
          );
        results.push(result);
      } catch (error) {
        this.logger.warn(`직원 등록 실패 - 직원: ${employeeId}`, error.message);
        // 실패한 경우에도 빈 결과를 추가하여 인덱스 일치 유지
        results.push({
          mapping: null as any, // 실제로는 에러 상황이므로 null 처리
          primaryEvaluatorAssigned: false,
          primaryEvaluatorId: null,
          warning: `등록 실패: ${error.message}`,
        });
      }
    }

    const successCount = results.filter(
      (r) => r.primaryEvaluatorAssigned,
    ).length;
    const warningCount = results.filter((r) => r.warning).length;

    this.logger.log(
      `평가 대상자 대량 등록 비즈니스 로직 완료 - 평가기간: ${evaluationPeriodId}, ` +
        `총 직원: ${employeeIds.length}명, 성공: ${successCount}명, 경고: ${warningCount}개`,
    );

    return results;
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
      `평가기간 단계 변경 비즈니스 로직 시작 - 평가기간: ${periodId}, 대상 단계: ${targetPhase}`,
    );

    const result = await this.evaluationPeriodManagementService.단계_변경한다(
      periodId,
      targetPhase,
      changedBy,
    );

    this.logger.log(
      `평가기간 단계 변경 완료 - 평가기간: ${periodId}, 변경된 단계: ${result.currentPhase}`,
    );

    return result;
  }

  /**
   * 자동 단계 전이를 실행한다
   */
  async 자동_단계_전이를_실행한다(): Promise<number> {
    this.logger.log('자동 단계 전이 비즈니스 로직 시작');

    const result =
      await this.evaluationPeriodManagementService.자동_단계_전이를_실행한다();

    this.logger.log(`자동 단계 전이 완료 - 전이된 평가기간 수: ${result}`);

    return result;
  }

  /**
   * 평가기간 기본정보를 수정하고 maxSelfEvaluationRate 변경 시 가중치 재계산을 트리거한다
   */
  async 평가기간기본정보_수정한다(
    periodId: string,
    updateData: UpdateEvaluationPeriodBasicDto,
    updatedBy: string,
  ): Promise<EvaluationPeriodDto> {
    this.logger.log(
      `평가기간 기본정보 수정 비즈니스 로직 시작 - 평가기간: ${periodId}`,
    );

    // 기존 maxSelfEvaluationRate 조회
    const existingPeriod = await this.evaluationPeriodService.ID로_조회한다(
      periodId,
    );
    if (!existingPeriod) {
      throw new Error(`평가기간을 찾을 수 없습니다: ${periodId}`);
    }

    const oldMaxSelfEvaluationRate = existingPeriod.maxSelfEvaluationRate;
    const newMaxSelfEvaluationRate = updateData.maxSelfEvaluationRate;

    // 평가기간 기본정보 수정
    const updatedPeriod =
      await this.evaluationPeriodManagementService.평가기간기본정보_수정한다(
        periodId,
        updateData,
        updatedBy,
      );

    // maxSelfEvaluationRate 변경 감지 및 비동기 재계산 트리거
    if (
      newMaxSelfEvaluationRate !== undefined &&
      newMaxSelfEvaluationRate !== oldMaxSelfEvaluationRate
    ) {
      this.logger.log(
        `maxSelfEvaluationRate 변경 감지 - 평가기간: ${periodId}, ` +
          `기존: ${oldMaxSelfEvaluationRate}, 신규: ${newMaxSelfEvaluationRate}`,
      );

      // 비동기로 재계산 (Promise를 기다리지 않음)
      setImmediate(async () => {
        try {
          this.logger.log(
            `평가기간 전체 직원 가중치 재계산 시작 (비동기) - 평가기간: ${periodId}`,
          );
          await this.commandBus.execute(
            new RecalculateAllEmployeesWeightForPeriodCommand(periodId),
          );
          this.logger.log(
            `평가기간 전체 직원 가중치 재계산 완료 (비동기) - 평가기간: ${periodId}`,
          );
        } catch (error: any) {
          this.logger.error(
            `가중치 재계산 실패 (비동기) - 평가기간: ${periodId}, 오류: ${error?.message || String(error)}`,
            error?.stack,
          );
        }
      });
    }

    this.logger.log(
      `평가기간 기본정보 수정 완료 - 평가기간: ${periodId}`,
    );

    return updatedPeriod;
  }
}
