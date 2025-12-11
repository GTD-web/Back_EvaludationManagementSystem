import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';

/**
 * 프로젝트별 WBS 자기평가 제출 커맨드 (피평가자 → 1차 평가자)
 */
export class SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand {
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
export interface SubmittedWbsSelfEvaluationToEvaluatorByProjectDetail {
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
export interface FailedWbsSelfEvaluationToEvaluatorByProject {
  evaluationId: string;
  wbsItemId: string;
  reason: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
}

/**
 * 미작성 필드 정보 (프로젝트별)
 */
export interface MissingFieldInfoByProject {
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
 * 프로젝트별 WBS 자기평가 제출 응답 (피평가자 → 1차 평가자)
 */
export interface SubmitWbsSelfEvaluationsToEvaluatorByProjectResponse {
  /** 제출된 평가 개수 */
  submittedCount: number;
  /** 제출 실패한 평가 개수 */
  failedCount: number;
  /** 총 평가 개수 */
  totalCount: number;
  /** 제출된 평가 상세 정보 */
  completedEvaluations: SubmittedWbsSelfEvaluationToEvaluatorByProjectDetail[];
  /** 제출 실패한 평가 정보 */
  failedEvaluations: FailedWbsSelfEvaluationToEvaluatorByProject[];
}

/**
 * 프로젝트별 WBS 자기평가 제출 핸들러 (피평가자 → 1차 평가자)
 * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 1차 평가자에게 제출합니다.
 */
@Injectable()
@CommandHandler(SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand)
export class SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler
  implements
    ICommandHandler<SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand>
{
  private readonly logger = new Logger(
    SubmitWbsSelfEvaluationsToEvaluatorByProjectHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: SubmitWbsSelfEvaluationsToEvaluatorByProjectCommand,
  ): Promise<SubmitWbsSelfEvaluationsToEvaluatorByProjectResponse> {
    const { employeeId, periodId, projectId, submittedBy } = command;

    this.logger.log(
      '프로젝트별 WBS 자기평가 제출 시작 (피평가자 → 1차 평가자)',
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

      // ============================================
      // 3단계: 사전 검증 - 모든 필수 항목 작성 여부 확인
      // ============================================
      const missingFieldsList: MissingFieldInfoByProject[] = [];
      const notSubmittedYet = projectEvaluations.filter(
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
      // 4단계: 모든 항목이 작성되었으므로 제출 진행
      // ============================================
      const completedEvaluations: SubmittedWbsSelfEvaluationToEvaluatorByProjectDetail[] =
        [];

      // 이미 제출된 평가는 completedEvaluations에 추가
      for (const evaluation of projectEvaluations) {
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

      const result: SubmitWbsSelfEvaluationsToEvaluatorByProjectResponse = {
        submittedCount: notSubmittedYet.length, // 새로 제출된 개수
        failedCount: 0, // 사전 검증으로 실패 없음
        totalCount: projectEvaluations.length,
        completedEvaluations,
        failedEvaluations: [], // 사전 검증으로 실패 없음
      };

      this.logger.log(
        '프로젝트별 WBS 자기평가 제출 완료 (피평가자 → 1차 평가자)',
        {
          employeeId,
          periodId,
          projectId,
          submittedCount: result.submittedCount,
          totalEvaluations: result.totalCount,
        },
      );

      return result;
    });
  }
}
