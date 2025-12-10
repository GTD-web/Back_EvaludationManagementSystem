import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';

/**
 * 직원의 전체 WBS 자기평가 승인 시 제출 커맨드
 * 승인 시 submittedToEvaluator와 submittedToManager를 모두 true로 설정합니다.
 */
export class SubmitAllWbsSelfEvaluationsForApprovalCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * 승인 시 제출된 WBS 자기평가 상세 정보
 */
export interface SubmittedWbsSelfEvaluationForApprovalDetail {
  evaluationId: string;
  wbsItemId: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
  performanceResult?: string;
  submittedToEvaluatorAt: Date;
  submittedToManagerAt: Date;
}

/**
 * 승인 시 제출 실패한 WBS 자기평가 정보
 */
export interface FailedWbsSelfEvaluationForApproval {
  evaluationId: string;
  wbsItemId: string;
  reason: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
}

/**
 * 직원의 전체 WBS 자기평가 승인 시 제출 응답
 */
export interface SubmitAllWbsSelfEvaluationsForApprovalResponse {
  /** 제출된 평가 개수 */
  submittedCount: number;
  /** 제출 실패한 평가 개수 */
  failedCount: number;
  /** 총 평가 개수 */
  totalCount: number;
  /** 완료된 평가 상세 정보 */
  completedEvaluations: SubmittedWbsSelfEvaluationForApprovalDetail[];
  /** 실패한 평가 상세 정보 */
  failedEvaluations: FailedWbsSelfEvaluationForApproval[];
}

/**
 * 직원의 전체 WBS 자기평가 승인 시 제출 핸들러
 * 승인 시 submittedToEvaluator와 submittedToManager를 모두 true로 설정합니다.
 */
@Injectable()
@CommandHandler(SubmitAllWbsSelfEvaluationsForApprovalCommand)
export class SubmitAllWbsSelfEvaluationsForApprovalHandler
  implements ICommandHandler<SubmitAllWbsSelfEvaluationsForApprovalCommand>
{
  private readonly logger = new Logger(
    SubmitAllWbsSelfEvaluationsForApprovalHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: SubmitAllWbsSelfEvaluationsForApprovalCommand,
  ): Promise<SubmitAllWbsSelfEvaluationsForApprovalResponse> {
    const { employeeId, periodId, submittedBy } = command;

    this.logger.log('직원의 전체 WBS 자기평가 승인 시 제출 시작', {
      employeeId,
      periodId,
    });

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
            .from('evaluation_wbs_assignments', 'wbs_assignment')
            .leftJoin(
              'evaluation_project_assignments',
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

      const completedEvaluations: SubmittedWbsSelfEvaluationForApprovalDetail[] =
        [];
      const failedEvaluations: FailedWbsSelfEvaluationForApproval[] = [];

      // 각 평가를 제출 처리
      for (let evaluation of evaluations) {
        try {
          // 이미 둘 다 제출된 평가는 스킵 (정보는 포함)
          if (
            evaluation.피평가자가_1차평가자에게_제출했는가() &&
            evaluation.일차평가자가_관리자에게_제출했는가()
          ) {
            this.logger.debug(
              `이미 모두 제출된 평가 스킵 - ID: ${evaluation.id}`,
            );
            completedEvaluations.push({
              evaluationId: evaluation.id,
              wbsItemId: evaluation.wbsItemId,
              selfEvaluationContent: evaluation.selfEvaluationContent,
              selfEvaluationScore: evaluation.selfEvaluationScore,
              performanceResult: evaluation.performanceResult,
              submittedToEvaluatorAt: evaluation.submittedToEvaluatorAt!,
              submittedToManagerAt: evaluation.submittedToManagerAt!,
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

          // 피평가자가 1차 평가자에게 제출 처리 (아직 제출되지 않은 경우)
          if (!evaluation.피평가자가_1차평가자에게_제출했는가()) {
            await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한다(
              evaluation,
              submittedBy,
            );
            // 저장 후 최신 상태 조회
            const updatedEvaluation =
              await this.wbsSelfEvaluationService.조회한다(evaluation.id);
            if (updatedEvaluation) {
              evaluation = updatedEvaluation;
            }
          }

          // 1차 평가자가 관리자에게 제출 처리 (아직 제출되지 않은 경우)
          if (!evaluation.일차평가자가_관리자에게_제출했는가()) {
            await this.wbsSelfEvaluationService.일차평가자가_관리자에게_제출한다(
              evaluation,
              submittedBy,
            );
            // 저장 후 최신 상태 조회
            const updatedEvaluation =
              await this.wbsSelfEvaluationService.조회한다(evaluation.id);
            if (updatedEvaluation) {
              evaluation = updatedEvaluation;
            }
          }

          // 최종 상태 조회
          const finalEvaluation = await this.wbsSelfEvaluationService.조회한다(
            evaluation.id,
          );
          if (!finalEvaluation) {
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
            evaluationId: finalEvaluation.id,
            wbsItemId: finalEvaluation.wbsItemId,
            selfEvaluationContent: finalEvaluation.selfEvaluationContent,
            selfEvaluationScore: finalEvaluation.selfEvaluationScore,
            performanceResult: finalEvaluation.performanceResult,
            submittedToEvaluatorAt: finalEvaluation.submittedToEvaluatorAt!,
            submittedToManagerAt: finalEvaluation.submittedToManagerAt!,
          });

          this.logger.debug(
            `평가 승인 시 제출 처리 성공 - ID: ${evaluation.id}`,
          );
        } catch (error) {
          this.logger.error(
            `평가 승인 시 제출 처리 실패 - ID: ${evaluation.id}`,
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

      const result: SubmitAllWbsSelfEvaluationsForApprovalResponse = {
        submittedCount: completedEvaluations.length,
        failedCount: failedEvaluations.length,
        totalCount: evaluations.length,
        completedEvaluations,
        failedEvaluations,
      };

      this.logger.log('직원의 전체 WBS 자기평가 승인 시 제출 완료', {
        employeeId,
        periodId,
        submittedCount: result.submittedCount,
        failedCount: result.failedCount,
      });

      // 실패한 평가가 있으면 경고 로그
      if (failedEvaluations.length > 0) {
        this.logger.warn('일부 평가 승인 시 제출 실패', {
          failedCount: failedEvaluations.length,
          failures: failedEvaluations,
        });
      }

      return result;
    });
  }
}
