import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { NotificationHelperService } from '@domain/common/notification/notification-helper.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EmployeeService } from '@domain/common/employee/employee.service';

/**
 * 직원의 전체 WBS 자기평가 제출 커맨드 (피평가자 → 1차 평가자)
 */
export class SubmitAllWbsSelfEvaluationsToEvaluatorCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * 제출된 WBS 자기평가 상세 정보
 */
export interface SubmittedWbsSelfEvaluationToEvaluatorDetail {
  evaluationId: string;
  wbsItemId: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
  performanceResult?: string;
  submittedToEvaluatorAt: Date;
}

/**
 * 제출 실패한 WBS 자기평가 정보
 */
export interface FailedWbsSelfEvaluationToEvaluator {
  evaluationId: string;
  wbsItemId: string;
  reason: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
}

/**
 * 직원의 전체 WBS 자기평가 제출 응답 (피평가자 → 1차 평가자)
 */
export interface SubmitAllWbsSelfEvaluationsToEvaluatorResponse {
  /** 제출된 평가 개수 */
  submittedCount: number;
  /** 제출 실패한 평가 개수 */
  failedCount: number;
  /** 총 평가 개수 */
  totalCount: number;
  /** 제출된 평가 상세 정보 */
  completedEvaluations: SubmittedWbsSelfEvaluationToEvaluatorDetail[];
  /** 제출 실패한 평가 정보 */
  failedEvaluations: FailedWbsSelfEvaluationToEvaluator[];
}

/**
 * 직원의 전체 WBS 자기평가 제출 핸들러 (피평가자 → 1차 평가자)
 * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 1차 평가자에게 제출 처리합니다.
 */
@Injectable()
@CommandHandler(SubmitAllWbsSelfEvaluationsToEvaluatorCommand)
export class SubmitAllWbsSelfEvaluationsToEvaluatorHandler
  implements ICommandHandler<SubmitAllWbsSelfEvaluationsToEvaluatorCommand>
{
  private readonly logger = new Logger(
    SubmitAllWbsSelfEvaluationsToEvaluatorHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
    private readonly notificationHelper: NotificationHelperService,
    private readonly stepApprovalContext: StepApprovalContextService,
    private readonly employeeService: EmployeeService,
  ) {}

  async execute(
    command: SubmitAllWbsSelfEvaluationsToEvaluatorCommand,
  ): Promise<SubmitAllWbsSelfEvaluationsToEvaluatorResponse> {
    const { employeeId, periodId, submittedBy } = command;

    this.logger.log(
      '직원의 전체 WBS 자기평가 제출 시작 (피평가자 → 1차 평가자)',
      {
        employeeId,
        periodId,
      },
    );

    return await this.transactionManager.executeTransaction(async () => {
      // 평가기간 조회 및 점수 범위 확인
      const evaluationPeriod =
        await this.evaluationPeriodService.ID로_조회한다(periodId);

      if (!evaluationPeriod) {
        throw new BadRequestException(
          `평가기간을 찾을 수 없습니다. (periodId: ${periodId})`,
        );
      }

      const maxScore = evaluationPeriod.자기평가_달성률_최대값();

      // 해당 직원의 해당 기간 모든 자기평가 조회
      const evaluations = await this.wbsSelfEvaluationService.필터_조회한다({
        employeeId,
        periodId,
      });

      if (evaluations.length === 0) {
        throw new BadRequestException('제출할 자기평가가 존재하지 않습니다.');
      }

      const completedEvaluations: SubmittedWbsSelfEvaluationToEvaluatorDetail[] =
        [];
      const failedEvaluations: FailedWbsSelfEvaluationToEvaluator[] = [];

      // 각 평가를 제출 처리
      for (const evaluation of evaluations) {
        try {
          // 이미 1차 평가자에게 제출된 평가는 스킵 (정보는 포함)
          if (evaluation.피평가자가_1차평가자에게_제출했는가()) {
            this.logger.debug(
              `이미 1차 평가자에게 제출된 평가 스킵 - ID: ${evaluation.id}`,
            );
            completedEvaluations.push({
              evaluationId: evaluation.id,
              wbsItemId: evaluation.wbsItemId,
              selfEvaluationContent: evaluation.selfEvaluationContent,
              selfEvaluationScore: evaluation.selfEvaluationScore,
              performanceResult: evaluation.performanceResult,
              submittedToEvaluatorAt: evaluation.submittedToEvaluatorAt!,
            });
            continue;
          }

          // 평가 내용과 점수 검증
          if (
            !evaluation.selfEvaluationContent ||
            !evaluation.selfEvaluationScore
          ) {
            failedEvaluations.push({
              evaluationId: evaluation.id,
              wbsItemId: evaluation.wbsItemId,
              reason: '평가 내용과 점수가 입력되지 않았습니다.',
              selfEvaluationContent: evaluation.selfEvaluationContent,
              selfEvaluationScore: evaluation.selfEvaluationScore,
            });
            continue;
          }

          // 점수 유효성 검증
          if (!evaluation.점수가_유효한가(maxScore)) {
            failedEvaluations.push({
              evaluationId: evaluation.id,
              wbsItemId: evaluation.wbsItemId,
              reason: `평가 점수가 유효하지 않습니다 (0 ~ ${maxScore} 사이여야 함).`,
              selfEvaluationContent: evaluation.selfEvaluationContent,
              selfEvaluationScore: evaluation.selfEvaluationScore,
            });
            continue;
          }

          // 피평가자가 1차 평가자에게 제출 처리
          await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한다(
            evaluation,
            submittedBy,
          );

          // 저장 후 최신 상태 조회
          const updatedEvaluation =
            await this.wbsSelfEvaluationService.조회한다(evaluation.id);
          if (!updatedEvaluation) {
            failedEvaluations.push({
              evaluationId: evaluation.id,
              wbsItemId: evaluation.wbsItemId,
              reason: '저장 후 조회 실패: 자기평가를 찾을 수 없습니다.',
              selfEvaluationContent: evaluation.selfEvaluationContent,
              selfEvaluationScore: evaluation.selfEvaluationScore,
            });
            continue;
          }

          completedEvaluations.push({
            evaluationId: updatedEvaluation.id,
            wbsItemId: updatedEvaluation.wbsItemId,
            selfEvaluationContent: updatedEvaluation.selfEvaluationContent,
            selfEvaluationScore: updatedEvaluation.selfEvaluationScore,
            performanceResult: updatedEvaluation.performanceResult,
            submittedToEvaluatorAt: updatedEvaluation.submittedToEvaluatorAt!,
          });

          this.logger.debug(`평가 제출 처리 성공 - ID: ${evaluation.id}`);
        } catch (error) {
          this.logger.error(
            `평가 제출 처리 실패 - ID: ${evaluation.id}`,
            error,
          );
          failedEvaluations.push({
            evaluationId: evaluation.id,
            wbsItemId: evaluation.wbsItemId,
            reason: error.message || '알 수 없는 오류가 발생했습니다.',
            selfEvaluationContent: evaluation.selfEvaluationContent,
            selfEvaluationScore: evaluation.selfEvaluationScore,
          });
        }
      }

      const result: SubmitAllWbsSelfEvaluationsToEvaluatorResponse = {
        submittedCount: completedEvaluations.length,
        failedCount: failedEvaluations.length,
        totalCount: evaluations.length,
        completedEvaluations,
        failedEvaluations,
      };

      // 실패한 평가가 있으면 경고 로그
      if (failedEvaluations.length > 0) {
        this.logger.warn('일부 평가 제출 실패', {
          failedCount: failedEvaluations.length,
          failures: failedEvaluations,
        });
      }

      // 알림 전송 (성공한 평가가 있을 경우에만)
      if (completedEvaluations.length > 0) {
        this.일차평가자에게_알림을전송한다(
          employeeId,
          periodId,
          evaluationPeriod.name,
        ).catch((error) => {
          this.logger.error(
            'WBS 자기평가 일괄 제출 알림 전송 실패 (무시됨)',
            error.stack,
          );
        });
      }

      return result;
    });
  }

  /**
   * 1차 평가자에게 알림을 전송한다
   */
  private async 일차평가자에게_알림을전송한다(
    employeeId: string,
    periodId: string,
    periodName: string,
  ): Promise<void> {
    try {
      // 피평가자(제출자) 정보 조회
      const employee = await this.employeeService.findById(employeeId);
      if (!employee) {
        this.logger.warn(
          `피평가자 정보를 찾을 수 없어 알림을 전송하지 않습니다. employeeId=${employeeId}`,
        );
        return;
      }

      // 1차 평가자 조회 (UUID)
      const evaluatorId = await this.stepApprovalContext.일차평가자를_조회한다(
        periodId,
        employeeId,
      );

      if (!evaluatorId) {
        this.logger.warn(
          `1차 평가자를 찾을 수 없어 알림을 전송하지 않습니다. employeeId=${employeeId}, periodId=${periodId}`,
        );
        return;
      }

      // 1차 평가자의 직원 번호 조회
      const evaluator = await this.employeeService.findById(evaluatorId);

      if (!evaluator) {
        this.logger.warn(
          `1차 평가자 정보를 찾을 수 없어 알림을 전송하지 않습니다. evaluatorId=${evaluatorId}`,
        );
        return;
      }

      // 알림 전송 (employeeNumber 사용)
      await this.notificationHelper.직원에게_알림을_전송한다({
        sender: 'system',
        title: 'WBS 자기평가 제출 알림',
        content: `${periodName} 평가기간의 ${employee.name} 피평가자가 WBS 자기평가를 제출했습니다.`,
        employeeNumber: evaluator.employeeNumber, // UUID 대신 employeeNumber 사용
        sourceSystem: 'EMS',
        linkUrl: `/current/user/employee-evaluation?periodId=${periodId}&employeeId=${employeeId}`,
        metadata: {
          type: 'self-evaluation-submitted',
          priority: 'medium',
          employeeId,
          periodId,
          employeeName: employee.name,
        },
      });

      this.logger.log(
        `WBS 자기평가 일괄 제출 알림 전송 완료: 피평가자=${employee.name}, 평가자=${evaluatorId}, 직원번호=${evaluator.employeeNumber}`,
      );
    } catch (error) {
      this.logger.error('알림 전송 중 오류 발생', error.stack);
      throw error;
    }
  }
}
