import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
 * 미작성 필드 정보
 */
export interface MissingFieldInfo {
  evaluationId: string;
  wbsItemId: string;
  wbsItemName?: string;
  missingFields: {
    performanceResult: boolean;
    selfEvaluationContent: boolean;
    selfEvaluationScore: boolean;
  };
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
    private readonly configService: ConfigService,
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
      // 소프트 딜리트된 프로젝트 할당에 속한 WBS 자기평가 제외
      const allEvaluations = await this.wbsSelfEvaluationService.필터_조회한다({
        employeeId,
        periodId,
      });

      // WBS 할당 및 프로젝트 할당이 유효한 자기평가만 필터링
      const evaluations = await this.transactionManager.executeTransaction(
        async (manager) => {
          const wbsItemIds = allEvaluations.map((e) => e.wbsItemId);
          if (wbsItemIds.length === 0) {
            return [];
          }

          // WBS 할당과 프로젝트 할당이 모두 유효한 WBS ID 조회
          const validWbsIds = await manager
            .createQueryBuilder()
            .select('DISTINCT wbs_assignment.wbsItemId', 'wbsItemId')
            .from('evaluation_wbs_assignment', 'wbs_assignment')
            .leftJoin(
              'evaluation_project_assignment',
              'project_assignment',
              'project_assignment.projectId = wbs_assignment.projectId AND project_assignment.periodId = wbs_assignment.periodId AND project_assignment.employeeId = wbs_assignment.employeeId AND project_assignment.deletedAt IS NULL',
            )
            .where('wbs_assignment.periodId = :periodId', { periodId })
            .andWhere('wbs_assignment.employeeId = :employeeId', { employeeId })
            .andWhere('wbs_assignment.wbsItemId IN (:...wbsItemIds)', {
              wbsItemIds,
            })
            .andWhere('wbs_assignment.deletedAt IS NULL')
            .andWhere('project_assignment.id IS NOT NULL')
            .getRawMany();

          const validWbsIdSet = new Set(
            validWbsIds.map((row: any) => row.wbsItemId),
          );

          return allEvaluations.filter((e) => validWbsIdSet.has(e.wbsItemId));
        },
      );

      if (evaluations.length === 0) {
        throw new BadRequestException('제출할 자기평가가 존재하지 않습니다.');
      }

      // ============================================
      // 1단계: 사전 검증 - 모든 필수 항목 작성 여부 확인
      // ============================================
      const missingFieldsList: MissingFieldInfo[] = [];
      const notSubmittedYet = evaluations.filter(
        (e) => !e.피평가자가_1차평가자에게_제출했는가(),
      );

      for (const evaluation of notSubmittedYet) {
        const missingFields = {
          performanceResult: !evaluation.performanceResult?.trim(),
          selfEvaluationContent: !evaluation.selfEvaluationContent?.trim(),
          selfEvaluationScore:
            evaluation.selfEvaluationScore === undefined ||
            evaluation.selfEvaluationScore === null,
        };

        // 하나라도 누락된 필드가 있으면 목록에 추가
        if (
          missingFields.performanceResult ||
          missingFields.selfEvaluationContent ||
          missingFields.selfEvaluationScore
        ) {
          missingFieldsList.push({
            evaluationId: evaluation.id,
            wbsItemId: evaluation.wbsItemId,
            missingFields,
          });
        }

        // 점수가 있는 경우 유효성 검증
        if (
          !missingFields.selfEvaluationScore &&
          !evaluation.점수가_유효한가(maxScore)
        ) {
          throw new BadRequestException(
            `평가 점수가 유효하지 않습니다 (WBS ID: ${evaluation.wbsItemId}, 점수: ${evaluation.selfEvaluationScore}, 허용 범위: 0 ~ ${maxScore})`,
          );
        }
      }

      // 미작성 항목이 있으면 제출 불가
      if (missingFieldsList.length > 0) {
        const missingFieldsDetails = missingFieldsList
          .map((info) => {
            const fields: string[] = [];
            if (info.missingFields.performanceResult) fields.push('성과');
            if (info.missingFields.selfEvaluationContent)
              fields.push('자기평가 내용');
            if (info.missingFields.selfEvaluationScore)
              fields.push('자기평가 점수');
            return `  - WBS ID: ${info.wbsItemId} → 미작성: ${fields.join(', ')}`;
          })
          .join('\n');

        throw new BadRequestException(
          `자기평가를 제출하려면 모든 필수 항목을 작성해야 합니다.\n\n미작성 항목:\n${missingFieldsDetails}\n\n작성해야 할 항목: 성과, 자기평가 내용, 자기평가 점수`,
        );
      }

      // ============================================
      // 2단계: 모든 항목이 작성되었으므로 제출 진행
      // ============================================
      const completedEvaluations: SubmittedWbsSelfEvaluationToEvaluatorDetail[] =
        [];

      // 이미 제출된 평가는 completedEvaluations에 추가
      for (const evaluation of evaluations) {
        if (evaluation.피평가자가_1차평가자에게_제출했는가()) {
          this.logger.debug(
            `이미 1차 평가자에게 제출된 평가 포함 - ID: ${evaluation.id}`,
          );
          completedEvaluations.push({
            evaluationId: evaluation.id,
            wbsItemId: evaluation.wbsItemId,
            selfEvaluationContent: evaluation.selfEvaluationContent,
            selfEvaluationScore: evaluation.selfEvaluationScore,
            performanceResult: evaluation.performanceResult,
            submittedToEvaluatorAt: evaluation.submittedToEvaluatorAt!,
          });
        }
      }

      // 미제출 평가를 제출 처리
      for (const evaluation of notSubmittedYet) {
        await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한다(
          evaluation,
          submittedBy,
        );

        // 저장 후 최신 상태 조회
        const updatedEvaluation =
          await this.wbsSelfEvaluationService.조회한다(evaluation.id);
        if (!updatedEvaluation) {
          throw new Error(
            `제출 후 자기평가를 찾을 수 없습니다. (ID: ${evaluation.id})`,
          );
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
      }

      const result: SubmitAllWbsSelfEvaluationsToEvaluatorResponse = {
        submittedCount: notSubmittedYet.length, // 새로 제출된 개수
        failedCount: 0, // 사전 검증으로 실패 없음
        totalCount: evaluations.length,
        completedEvaluations,
        failedEvaluations: [], // 사전 검증으로 실패 없음
      };

      // 알림 전송 (새로 제출된 평가가 있을 경우에만)
      if (notSubmittedYet.length > 0) {
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

      // linkUrl 생성
      const linkUrl = `${this.configService.get<string>('PORTAL_URL')}/current/user/employee-evaluation?periodId=${periodId}&employeeId=${employeeId}`;
      
      this.logger.log(
        `알림 linkUrl 생성: ${linkUrl}`,
      );

      // 알림 전송 (employeeNumber 사용)
      await this.notificationHelper.직원에게_알림을_전송한다({
        sender: 'system',
        title: 'WBS 자기평가 제출 알림',
        content: `${periodName} 평가기간의 ${employee.name} 피평가자가 WBS 자기평가를 제출했습니다.`,
        employeeNumber: evaluator.employeeNumber, // UUID 대신 employeeNumber 사용
        sourceSystem: 'EMS',
        linkUrl,
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
