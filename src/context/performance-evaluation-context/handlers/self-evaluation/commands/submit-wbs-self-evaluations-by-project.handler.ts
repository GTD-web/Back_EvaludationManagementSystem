import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';

/**
 * 프로젝트별 WBS 자기평가 제출 커맨드 (1차 평가자 → 관리자)
 */
export class SubmitWbsSelfEvaluationsByProjectCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly projectId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * 제출된 WBS 자기평가 상세 정보
 */
export interface SubmittedWbsSelfEvaluationByProjectDetail {
  evaluationId: string;
  wbsItemId: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
  performanceResult?: string;
  submittedToManagerAt: Date;
}

/**
 * 제출 실패한 WBS 자기평가 정보
 */
export interface FailedWbsSelfEvaluationByProject {
  evaluationId: string;
  wbsItemId: string;
  reason: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
}

/**
 * 프로젝트별 WBS 자기평가 제출 응답
 */
export interface SubmitWbsSelfEvaluationsByProjectResponse {
  /** 제출된 평가 개수 */
  submittedCount: number;
  /** 제출 실패한 평가 개수 */
  failedCount: number;
  /** 총 평가 개수 */
  totalCount: number;
  /** 제출된 평가 상세 정보 */
  completedEvaluations: SubmittedWbsSelfEvaluationByProjectDetail[];
  /** 제출 실패한 평가 정보 */
  failedEvaluations: FailedWbsSelfEvaluationByProject[];
}

/**
 * 프로젝트별 WBS 자기평가 제출 핸들러 (1차 평가자 → 관리자)
 * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 관리자에게 제출합니다.
 */
@Injectable()
@CommandHandler(SubmitWbsSelfEvaluationsByProjectCommand)
export class SubmitWbsSelfEvaluationsByProjectHandler
  implements ICommandHandler<SubmitWbsSelfEvaluationsByProjectCommand>
{
  private readonly logger = new Logger(
    SubmitWbsSelfEvaluationsByProjectHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: SubmitWbsSelfEvaluationsByProjectCommand,
  ): Promise<SubmitWbsSelfEvaluationsByProjectResponse> {
    const { employeeId, periodId, projectId, submittedBy } = command;

    this.logger.log(
      '프로젝트별 WBS 자기평가 제출 시작 (1차 평가자 → 관리자)',
      {
        employeeId,
        periodId,
        projectId,
      },
    );

    return await this.transactionManager.executeTransaction(async () => {
      // 0. 평가기간 조회 및 점수 범위 확인
      const evaluationPeriod =
        await this.evaluationPeriodService.ID로_조회한다(periodId);

      if (!evaluationPeriod) {
        throw new BadRequestException(
          `평가기간을 찾을 수 없습니다. (periodId: ${periodId})`,
        );
      }

      const maxScore = evaluationPeriod.자기평가_달성률_최대값();

      // 1. 해당 직원의 해당 기간 모든 자기평가 조회
      const allEvaluations = await this.wbsSelfEvaluationService.필터_조회한다({
        employeeId,
        periodId,
      });

      // 2. WBS 할당 및 프로젝트 할당이 유효한 자기평가만 필터링 (프로젝트별)
      const projectEvaluations = await this.transactionManager.executeTransaction(
        async (manager) => {
          const wbsItemIds = allEvaluations.map((e) => e.wbsItemId);
          if (wbsItemIds.length === 0) {
            return [];
          }

          // 해당 프로젝트에서 WBS 할당과 프로젝트 할당이 모두 유효한 WBS ID 조회
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
            .andWhere('wbs_assignment.projectId = :projectId', { projectId })
            .andWhere('wbs_assignment.wbsItemId IN (:...wbsItemIds)', {
              wbsItemIds,
            })
            .andWhere('wbs_assignment.deletedAt IS NULL')
            .andWhere('project_assignment.id IS NOT NULL')
            .getRawMany();

          const validWbsIdSet = new Set(
            validWbsIds.map((row: any) => row.wbsItemId),
          );

          this.logger.debug('프로젝트별 유효한 WBS 항목', {
            totalWbsCount: wbsItemIds.length,
            validWbsCount: validWbsIdSet.size,
            projectId,
          });

          return allEvaluations.filter((e) => validWbsIdSet.has(e.wbsItemId));
        },
      );

      if (projectEvaluations.length === 0) {
        throw new BadRequestException(
          '해당 프로젝트에 제출할 자기평가가 존재하지 않습니다. (취소된 프로젝트 할당의 WBS는 제외됨)',
        );
      }

      const completedEvaluations: SubmittedWbsSelfEvaluationByProjectDetail[] =
        [];
      const failedEvaluations: FailedWbsSelfEvaluationByProject[] = [];

      // 3. 각 평가를 제출 처리
      for (const evaluation of projectEvaluations) {
        try {
          // 이미 관리자에게 제출된 평가는 스킵 (정보는 포함)
          if (evaluation.일차평가자가_관리자에게_제출했는가()) {
            this.logger.debug(
              `이미 관리자에게 제출된 평가 스킵 - ID: ${evaluation.id}`,
            );
            completedEvaluations.push({
              evaluationId: evaluation.id,
              wbsItemId: evaluation.wbsItemId,
              selfEvaluationContent: evaluation.selfEvaluationContent,
              selfEvaluationScore: evaluation.selfEvaluationScore,
              performanceResult: evaluation.performanceResult,
              submittedToManagerAt: evaluation.submittedToManagerAt!,
            });
            continue;
          }

          // 평가 내용과 점수 검증
          // (관리자에게 제출할 때는 평가자에게도 자동으로 제출한 것으로 처리됨)
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

          // 1차 평가자가 관리자에게 제출 처리
          const updatedEvaluation =
            await this.wbsSelfEvaluationService.수정한다(
              evaluation.id,
              { submittedToManager: true },
              submittedBy,
            );

          completedEvaluations.push({
            evaluationId: updatedEvaluation.id,
            wbsItemId: updatedEvaluation.wbsItemId,
            selfEvaluationContent: updatedEvaluation.selfEvaluationContent,
            selfEvaluationScore: updatedEvaluation.selfEvaluationScore,
            performanceResult: updatedEvaluation.performanceResult,
            submittedToManagerAt: updatedEvaluation.submittedToManagerAt!,
          });

          this.logger.debug(`평가 완료 처리 성공 - ID: ${evaluation.id}`);
        } catch (error) {
          this.logger.error(
            `평가 완료 처리 실패 - ID: ${evaluation.id}`,
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

      const result: SubmitWbsSelfEvaluationsByProjectResponse = {
        submittedCount: completedEvaluations.length,
        failedCount: failedEvaluations.length,
        totalCount: projectEvaluations.length,
        completedEvaluations,
        failedEvaluations,
      };

      this.logger.log(
        '프로젝트별 WBS 자기평가 제출 완료 (1차 평가자 → 관리자)',
        {
          employeeId,
        periodId,
        projectId,
        submittedCount: result.submittedCount,
        failedCount: result.failedCount,
      });

      if (failedEvaluations.length > 0) {
        this.logger.warn('일부 평가 제출 실패', {
          failedCount: failedEvaluations.length,
          failures: failedEvaluations,
        });
      }

      return result;
    });
  }
}
