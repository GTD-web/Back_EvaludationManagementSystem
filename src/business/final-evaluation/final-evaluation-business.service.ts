import { Injectable } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { GetFinalEvaluationByEmployeePeriodQuery } from '@context/performance-evaluation-context/handlers/final-evaluation';

/**
 * 최종평가 비즈니스 서비스
 *
 * 최종평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 최종평가 저장
 * - 활동 내역 자동 기록
 */
@Injectable()
export class FinalEvaluationBusinessService {
  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly activityLogContextService: EvaluationActivityLogContextService,
  ) {}

  /**
   * 최종평가를 저장한다 (활동 내역 기록 포함)
   */
  async 최종평가를_저장한다(
    employeeId: string,
    periodId: string,
    evaluationGrade: string,
    jobGrade: any,
    jobDetailedGrade: any,
    finalComments: string | undefined,
    actionBy: string,
  ): Promise<string> {
    // 기존 최종평가 확인 (생성/수정 여부 판단)
    const existingEvaluation =
      await this.performanceEvaluationService.직원_평가기간별_최종평가를_조회한다(
        new GetFinalEvaluationByEmployeePeriodQuery(employeeId, periodId),
      );

    const isNewEvaluation = !existingEvaluation;

    // 최종평가 저장
    const evaluationId =
      await this.performanceEvaluationService.최종평가를_저장한다(
        employeeId,
        periodId,
        evaluationGrade,
        jobGrade,
        jobDetailedGrade,
        finalComments,
        actionBy,
      );

    // 활동 내역 기록
    try {
      await this.activityLogContextService.활동내역을_기록한다({
        periodId,
        employeeId,
        activityType: 'final_evaluation',
        activityAction: isNewEvaluation ? 'created' : 'updated',
        activityTitle: isNewEvaluation ? '최종평가 생성' : '최종평가 수정',
        relatedEntityType: 'final_evaluation',
        relatedEntityId: evaluationId,
        performedBy: actionBy,
        activityMetadata: {
          evaluationGrade,
          jobGrade,
          jobDetailedGrade,
        },
      });
    } catch (error) {
      // 활동 내역 기록 실패 시에도 최종평가 저장은 정상 처리
    }

    return evaluationId;
  }
}

