import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationActivityLog } from '@domain/core/evaluation-activity-log/evaluation-activity-log.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import {
  MyEvaluationTargetStatusDto,
  EvaluationCriteriaStatus,
  WbsCriteriaStatus,
  EvaluationLineStatus,
  PerformanceInputStatus,
} from '../../interfaces/dashboard-context.interface';
import {
  가중치_기반_1차_하향평가_점수를_계산한다,
  가중치_기반_2차_하향평가_점수를_계산한다,
  하향평가_등급을_조회한다,
} from '../queries/get-employee-evaluation-period-status/downward-evaluation-score.utils';
import {
  자기평가_진행_상태를_조회한다,
  자기평가_상태를_계산한다,
} from '../queries/get-employee-evaluation-period-status/self-evaluation.utils';
import {
  평가라인_지정_여부를_확인한다,
  평가라인_상태를_계산한다,
} from '../queries/get-employee-evaluation-period-status/evaluation-line.utils';
import { 평가기준설정_상태를_계산한다 } from '../queries/get-employee-evaluation-period-status/evaluation-criteria.utils';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';

/**
 * 내가 담당하는 평가 대상자 현황 조회 쿼리
 */
export class GetMyEvaluationTargetsStatusQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly evaluatorId: string,
  ) {}
}

/**
 * 내가 담당하는 평가 대상자 현황 조회 핸들러
 *
 * 특정 평가기간에서 내가 평가자로 지정된 피평가자들의 현황을 조회합니다.
 */
@QueryHandler(GetMyEvaluationTargetsStatusQuery)
export class GetMyEvaluationTargetsStatusHandler
  implements IQueryHandler<GetMyEvaluationTargetsStatusQuery>
{
  private readonly logger = new Logger(
    GetMyEvaluationTargetsStatusHandler.name,
  );

  constructor(
    @InjectRepository(EvaluationLineMapping)
    private readonly lineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly lineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsCriteriaRepository: Repository<WbsEvaluationCriteria>,
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(EvaluationActivityLog)
    private readonly activityLogRepository: Repository<EvaluationActivityLog>,
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
  ) {}

  async execute(
    query: GetMyEvaluationTargetsStatusQuery,
  ): Promise<MyEvaluationTargetStatusDto[]> {
    const { evaluationPeriodId, evaluatorId } = query;

    this.logger.debug(
      `내가 담당하는 평가 대상자 현황 조회 시작 - 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
    );

    try {
      // 1. 내가 평가자로 지정된 매핑 조회 (평가라인 정보 포함)
      // 평가기간별로 필터링하여 해당 평가기간의 평가라인만 조회
      const myTargetMappings = await this.lineMappingRepository
        .createQueryBuilder('mapping')
        .leftJoin(
          EvaluationLine,
          'line',
          'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
        )
        .where('mapping.evaluatorId = :evaluatorId', { evaluatorId })
        .andWhere('mapping.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('mapping.deletedAt IS NULL')
        .getMany();

      if (myTargetMappings.length === 0) {
        this.logger.debug(
          `담당하는 평가 대상자가 없습니다 - 평가자: ${evaluatorId}`,
        );
        return [];
      }

      // 평가라인 ID별로 평가라인 정보 조회
      const evaluationLineIds = [
        ...new Set(myTargetMappings.map((m) => m.evaluationLineId)),
      ];
      const evaluationLines =
        await this.lineRepository.findByIds(evaluationLineIds);
      const lineMap = new Map(
        evaluationLines.map((line) => [line.id, line.evaluatorType]),
      );

      // 피평가자 ID 목록
      const employeeIds = [
        ...new Set(myTargetMappings.map((m) => m.employeeId)),
      ];

      // 2. 피평가자들의 평가기간 매핑 정보 조회 (해당 평가기간에 속한 직원, 제외된 직원 포함)
      const employeeMappings = await this.mappingRepository
        .createQueryBuilder('mapping')
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
          evaluationPeriodId,
        })
        .andWhere('mapping.employeeId IN (:...employeeIds)', { employeeIds })
        .getMany();

      if (employeeMappings.length === 0) {
        this.logger.debug(
          `해당 평가기간에 활성화된 평가 대상자가 없습니다 - 평가기간: ${evaluationPeriodId}`,
        );
        return [];
      }

      const activeEmployeeIds = new Set(
        employeeMappings.map((m) => m.employeeId),
      );

      // 3. 각 피평가자별로 현황 정보 조회
      const results: MyEvaluationTargetStatusDto[] = [];

      for (const mapping of employeeMappings) {
        try {
          const employeeId = mapping.employeeId;

          // 내가 담당하는 평가 유형 확인
          const myMappings = myTargetMappings.filter(
            (m) =>
              m.employeeId === employeeId &&
              activeEmployeeIds.has(m.employeeId),
          );

          const evaluatorTypes = [
            ...new Set(
              myMappings
                .map((m) => lineMap.get(m.evaluationLineId))
                .filter((type): type is EvaluatorType => type !== undefined),
            ),
          ];

          if (evaluatorTypes.length === 0) {
            continue;
          }

          // 제외 정보
          const exclusionInfo = {
            isExcluded: mapping.isExcluded,
            excludeReason: mapping.excludeReason ?? null,
            excludedAt: mapping.excludedAt ?? null,
          };

          // 프로젝트 할당 수 조회
          const projectCount = await this.projectAssignmentRepository.count({
            where: {
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              deletedAt: IsNull(),
            },
          });

          // WBS 할당 수 조회
          const wbsCount = await this.wbsAssignmentRepository.count({
            where: {
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              deletedAt: IsNull(),
            },
          });

          // 평가항목 상태 계산
          const evaluationCriteriaStatus: EvaluationCriteriaStatus =
            this.평가항목_상태를_계산한다(projectCount, wbsCount);

          // 할당된 WBS 목록 조회
          const assignedWbsList = await this.wbsAssignmentRepository.find({
            where: {
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              deletedAt: IsNull(),
            },
            select: ['wbsItemId'],
          });

          // 평가기준이 있는 WBS 수 조회 (고유한 WBS 개수)
          let wbsWithCriteriaCount = 0;
          if (assignedWbsList.length > 0) {
            const wbsItemIds = assignedWbsList.map((wbs) => wbs.wbsItemId);
            const distinctWbsIdsWithCriteria = await this.wbsCriteriaRepository
              .createQueryBuilder('criteria')
              .select('DISTINCT criteria.wbsItemId', 'wbsItemId')
              .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
              .andWhere('criteria.deletedAt IS NULL')
              .getRawMany();
            wbsWithCriteriaCount = distinctWbsIdsWithCriteria.length;
          }

          // WBS 평가기준 상태 계산
          const wbsCriteriaStatus: WbsCriteriaStatus =
            this.WBS평가기준_상태를_계산한다(wbsCount, wbsWithCriteriaCount);

          // 평가라인 지정 상태 확인
          const { hasPrimaryEvaluator, hasSecondaryEvaluator } =
            await 평가라인_지정_여부를_확인한다(
              evaluationPeriodId,
              employeeId,
              this.lineRepository,
              this.lineMappingRepository,
            );

          // 평가라인 상태 계산
          const evaluationLineStatus: EvaluationLineStatus =
            평가라인_상태를_계산한다(
              hasPrimaryEvaluator,
              hasSecondaryEvaluator,
            );

          // 성과 입력 상태 조회
          const { totalWbsCount: perfTotalWbsCount, inputCompletedCount } =
            await this.성과입력_상태를_조회한다(evaluationPeriodId, employeeId);

          // 성과 입력 상태 계산
          const performanceInputStatus: PerformanceInputStatus =
            this.성과입력_상태를_계산한다(
              perfTotalWbsCount,
              inputCompletedCount,
            );

          // 자기평가 제출 상태 조회
          const selfEvaluationStatus = await 자기평가_진행_상태를_조회한다(
            evaluationPeriodId,
            employeeId,
            this.wbsSelfEvaluationRepository,
            this.wbsAssignmentRepository,
            this.evaluationPeriodRepository,
          );

          // 자기평가 상태 계산
          const selfEvaluationStatusType = 자기평가_상태를_계산한다(
            selfEvaluationStatus.totalMappingCount,
            selfEvaluationStatus.completedMappingCount,
          );

          // 내가 담당하는 하향평가 현황 조회
          const downwardEvaluationStatus =
            await this.내가_담당하는_하향평가_현황을_조회한다(
              evaluationPeriodId,
              employeeId,
              evaluatorId,
              evaluatorTypes,
            );

          // setup 상태 계산 (평가기준 설정 + 제출/승인 상태 통합)
          // stepApproval 조회
          const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(
            mapping.id,
          );

          const setupStatus = 평가기준설정_상태를_계산한다(
            evaluationCriteriaStatus,
            wbsCriteriaStatus,
            stepApproval?.criteriaSettingStatus ?? null,
            mapping.isCriteriaSubmitted || false,
          );

          // 1차 평가 제출 여부 확인
          const primaryEvaluationSubmitted =
            await this.일차평가_제출_여부를_확인한다(
              evaluationPeriodId,
              employeeId,
            );

          // 평가자 확인 여부 계산 (자기평가 또는 1차 평가가 제출된 경우)
          let viewedStatus: {
            viewedByPrimaryEvaluator: boolean;
            viewedBySecondaryEvaluator: boolean;
            primaryEvaluationViewed: boolean;
          } | null = null;

          if (
            selfEvaluationStatus.isSubmittedToEvaluator ||
            primaryEvaluationSubmitted
          ) {
            viewedStatus = await this.평가자_확인여부를_계산한다(
              evaluationPeriodId,
              employeeId,
              evaluatorId,
              evaluatorTypes,
            );
          }

          // selfEvaluation 객체 생성 (자기평가 제출 시에만 viewedBy 필드 포함)
          const selfEvaluationResult: any = {
            status: selfEvaluationStatusType,
            totalMappingCount: selfEvaluationStatus.totalMappingCount,
            completedMappingCount: selfEvaluationStatus.completedMappingCount,
            totalSelfEvaluations: selfEvaluationStatus.totalMappingCount,
            submittedToEvaluatorCount:
              selfEvaluationStatus.submittedToEvaluatorCount,
            isSubmittedToEvaluator: selfEvaluationStatus.isSubmittedToEvaluator,
            submittedToManagerCount:
              selfEvaluationStatus.submittedToManagerCount,
            isSubmittedToManager: selfEvaluationStatus.isSubmittedToManager,
            totalScore: selfEvaluationStatus.totalScore,
            grade: selfEvaluationStatus.grade,
          };

          // 자기평가가 제출된 경우에만 viewedBy 필드 추가
          if (viewedStatus) {
            selfEvaluationResult.viewedByPrimaryEvaluator =
              viewedStatus.viewedByPrimaryEvaluator;
            selfEvaluationResult.viewedBySecondaryEvaluator =
              viewedStatus.viewedBySecondaryEvaluator;
          }

          results.push({
            employeeId,
            isEvaluationTarget: !mapping.isExcluded,
            exclusionInfo,
            evaluationCriteria: {
              status: evaluationCriteriaStatus,
              assignedProjectCount: projectCount,
              assignedWbsCount: wbsCount,
            },
            wbsCriteria: {
              status: wbsCriteriaStatus,
              wbsWithCriteriaCount,
            },
            evaluationLine: {
              status: evaluationLineStatus,
              hasPrimaryEvaluator,
              hasSecondaryEvaluator,
            },
            setup: {
              status: setupStatus,
            },
            performanceInput: {
              status: performanceInputStatus,
              totalWbsCount: perfTotalWbsCount,
              inputCompletedCount,
            },
            myEvaluatorTypes: evaluatorTypes,
            selfEvaluation: selfEvaluationResult,
            downwardEvaluation: {
              ...downwardEvaluationStatus,
              secondaryStatus: downwardEvaluationStatus.secondaryStatus
                ? this.이차평가_상태에_일차평가확인여부를_추가한다(
                    downwardEvaluationStatus.secondaryStatus,
                    viewedStatus,
                    primaryEvaluationSubmitted,
                  )
                : null,
            },
          });
        } catch (error) {
          this.logger.error(
            `피평가자 현황 조회 실패 - 직원: ${mapping.employeeId}`,
            error.stack,
          );
          continue;
        }
      }

      this.logger.debug(
        `내가 담당하는 평가 대상자 현황 조회 완료 - 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}, 대상자 수: ${results.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `내가 담당하는 평가 대상자 현황 조회 실패 - 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 내가 담당하는 하향평가 현황을 조회한다
   */
  private async 내가_담당하는_하향평가_현황을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    evaluatorTypes: EvaluatorType[],
  ): Promise<{
    isPrimary: boolean;
    isSecondary: boolean;
    status: 'none' | 'in_progress' | 'complete';
    primaryStatus: {
      status: 'none' | 'in_progress' | 'complete';
      assignedWbsCount: number;
      completedEvaluationCount: number;
      totalScore: number | null;
      grade: string | null;
    } | null;
    secondaryStatus: {
      status: 'none' | 'in_progress' | 'complete';
      assignedWbsCount: number;
      completedEvaluationCount: number;
      totalScore: number | null;
      grade: string | null;
    } | null;
  }> {
    const isPrimary = evaluatorTypes.includes(EvaluatorType.PRIMARY);
    const isSecondary = evaluatorTypes.includes(EvaluatorType.SECONDARY);

    // 매핑 정보에서 수정 가능 여부 조회
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
        isExcluded: false,
      },
    });

    let primaryStatus: {
      status: 'none' | 'in_progress' | 'complete';
      assignedWbsCount: number;
      completedEvaluationCount: number;
      totalScore: number | null;
      grade: string | null;
    } | null = null;
    let secondaryStatus: {
      status: 'none' | 'in_progress' | 'complete';
      assignedWbsCount: number;
      completedEvaluationCount: number;
      totalScore: number | null;
      grade: string | null;
    } | null = null;

    if (isPrimary) {
      // 1차 평가 현황 조회
      const evaluations = await this.downwardEvaluationRepository
        .createQueryBuilder('eval')
        .where('eval.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('eval.employeeId = :employeeId', { employeeId })
        .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
        .andWhere('eval.evaluationType = :evaluationType', {
          evaluationType: 'primary',
        })
        .andWhere('eval.deletedAt IS NULL')
        .getMany();

      const assignedWbsCount = evaluations.length;
      const completedEvaluationCount = evaluations.filter(
        (e) =>
          e.downwardEvaluationScore !== null &&
          e.downwardEvaluationScore !== undefined,
      ).length;

      // 모든 WBS가 완료되면 점수/등급 계산
      let totalScore: number | null = null;
      let grade: string | null = null;

      if (
        assignedWbsCount > 0 &&
        completedEvaluationCount === assignedWbsCount
      ) {
        totalScore = await 가중치_기반_1차_하향평가_점수를_계산한다(
          evaluationPeriodId,
          employeeId,
          [evaluatorId], // 현재 평가자만 배열로 전달
          this.downwardEvaluationRepository,
          this.wbsAssignmentRepository,
          this.evaluationPeriodRepository,
        );

        if (totalScore !== null) {
          grade = await 하향평가_등급을_조회한다(
            evaluationPeriodId,
            totalScore,
            this.evaluationPeriodRepository,
          );
        }
      }

      // 상태 계산: 할당수 = 완료수 = 0 → "none", 할당수 > 완료수 > 0 → "in_progress", 할당수 = 완료수 (그리고 할당수 > 0) → "complete"
      let status: 'none' | 'in_progress' | 'complete';
      if (assignedWbsCount === 0) {
        status = 'none';
      } else if (assignedWbsCount === completedEvaluationCount) {
        status = 'complete';
      } else {
        status = 'in_progress';
      }

      primaryStatus = {
        status,
        assignedWbsCount,
        completedEvaluationCount,
        totalScore,
        grade,
      };
    }

    if (isSecondary) {
      // 2차 평가 현황 조회
      const evaluations = await this.downwardEvaluationRepository
        .createQueryBuilder('eval')
        .where('eval.periodId = :periodId', {
          periodId: evaluationPeriodId,
        })
        .andWhere('eval.employeeId = :employeeId', { employeeId })
        .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
        .andWhere('eval.evaluationType = :evaluationType', {
          evaluationType: 'secondary',
        })
        .andWhere('eval.deletedAt IS NULL')
        .getMany();

      const assignedWbsCount = evaluations.length;
      const completedEvaluationCount = evaluations.filter(
        (e) =>
          e.downwardEvaluationScore !== null &&
          e.downwardEvaluationScore !== undefined,
      ).length;

      // 모든 WBS가 완료되면 점수/등급 계산
      let totalScore: number | null = null;
      let grade: string | null = null;

      if (
        assignedWbsCount > 0 &&
        completedEvaluationCount === assignedWbsCount
      ) {
        totalScore = await 가중치_기반_2차_하향평가_점수를_계산한다(
          evaluationPeriodId,
          employeeId,
          [evaluatorId], // 배열로 전달 (현재 평가자만)
          this.downwardEvaluationRepository,
          this.wbsAssignmentRepository,
          this.evaluationPeriodRepository,
        );

        if (totalScore !== null) {
          grade = await 하향평가_등급을_조회한다(
            evaluationPeriodId,
            totalScore,
            this.evaluationPeriodRepository,
          );
        }
      }

      // 상태 계산: 할당수 = 완료수 = 0 → "none", 할당수 > 완료수 > 0 → "in_progress", 할당수 = 완료수 (그리고 할당수 > 0) → "complete"
      let status: 'none' | 'in_progress' | 'complete';
      if (assignedWbsCount === 0) {
        status = 'none';
      } else if (assignedWbsCount === completedEvaluationCount) {
        status = 'complete';
      } else {
        status = 'in_progress';
      }

      secondaryStatus = {
        status,
        assignedWbsCount,
        completedEvaluationCount,
        totalScore,
        grade,
      };
    }

    // 통합 상태 계산: 1차와 2차 상태를 통합
    // 우선순위: complete > in_progress > none
    const primaryStatusValue = primaryStatus?.status || 'none';
    const secondaryStatusValue = secondaryStatus?.status || 'none';

    let integratedStatus: 'none' | 'in_progress' | 'complete';
    if (
      primaryStatusValue === 'complete' ||
      secondaryStatusValue === 'complete'
    ) {
      // 둘 중 하나라도 complete이면 complete
      integratedStatus = 'complete';
    } else if (
      primaryStatusValue === 'in_progress' ||
      secondaryStatusValue === 'in_progress'
    ) {
      // 둘 중 하나라도 in_progress이면 in_progress
      integratedStatus = 'in_progress';
    } else {
      // 둘 다 none이면 none
      integratedStatus = 'none';
    }

    return {
      isPrimary,
      isSecondary,
      status: integratedStatus,
      primaryStatus,
      secondaryStatus,
    };
  }

  /**
   * 성과 입력 상태를 조회한다
   */
  private async 성과입력_상태를_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<{ totalWbsCount: number; inputCompletedCount: number }> {
    // 전체 WBS 자기평가 수 조회
    const totalWbsCount = await this.wbsSelfEvaluationRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });

    // 성과가 입력된 WBS 수 조회
    const selfEvaluations = await this.wbsSelfEvaluationRepository.find({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: IsNull(),
      },
    });

    const inputCompletedCount = selfEvaluations.filter(
      (evaluation) =>
        evaluation.performanceResult &&
        evaluation.performanceResult.trim().length > 0,
    ).length;

    return { totalWbsCount, inputCompletedCount };
  }

  /**
   * 성과 입력 상태를 계산한다
   */
  private 성과입력_상태를_계산한다(
    totalWbsCount: number,
    inputCompletedCount: number,
  ): PerformanceInputStatus {
    if (totalWbsCount === 0) {
      return 'none';
    }

    if (inputCompletedCount === 0) {
      return 'none';
    } else if (inputCompletedCount === totalWbsCount) {
      return 'complete';
    } else {
      return 'in_progress';
    }
  }

  /**
   * 평가항목 상태를 계산한다
   * - 프로젝트와 WBS 모두 있으면: complete (존재)
   * - 프로젝트나 WBS 중 하나만 있으면: in_progress (설정중)
   * - 둘 다 없으면: none (미존재)
   */
  private 평가항목_상태를_계산한다(
    projectCount: number,
    wbsCount: number,
  ): EvaluationCriteriaStatus {
    const hasProject = projectCount > 0;
    const hasWbs = wbsCount > 0;

    if (hasProject && hasWbs) {
      return 'complete';
    } else if (hasProject || hasWbs) {
      return 'in_progress';
    } else {
      return 'none';
    }
  }

  /**
   * WBS 평가기준 상태를 계산한다
   * - 모든 WBS에 평가기준이 있으면: complete (완료)
   * - 일부 WBS에만 평가기준이 있으면: in_progress (설정중)
   * - 평가기준이 없으면: none (미존재)
   */
  private WBS평가기준_상태를_계산한다(
    totalWbsCount: number,
    wbsWithCriteriaCount: number,
  ): WbsCriteriaStatus {
    if (totalWbsCount === 0) {
      return 'none';
    }

    if (wbsWithCriteriaCount === 0) {
      return 'none';
    } else if (wbsWithCriteriaCount === totalWbsCount) {
      return 'complete';
    } else {
      return 'in_progress';
    }
  }

  /**
   * 1차 평가 제출 여부를 확인한다
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @returns 1차 평가가 제출되었는지 여부
   */
  private async 일차평가_제출_여부를_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<boolean> {
    const primaryEvaluation = await this.downwardEvaluationRepository
      .createQueryBuilder('de')
      .where('de.periodId = :periodId', { periodId: evaluationPeriodId })
      .andWhere('de.employeeId = :employeeId', { employeeId })
      .andWhere('de.evaluationType = :type', { type: 'primary' })
      .andWhere('de.isCompleted = true')
      .andWhere('de.completedAt IS NOT NULL')
      .andWhere('de.deletedAt IS NULL')
      .limit(1)
      .getOne();

    return !!primaryEvaluation;
  }

  /**
   * 2차 평가 상태에 1차 평가 확인 여부를 추가한다
   *
   * 1차 평가가 제출된 경우에만 primaryEvaluationViewed 필드를 포함합니다.
   *
   * @param secondaryStatus 2차 평가 상태
   * @param viewedStatus 확인 여부 정보 (없으면 필드 미포함)
   * @param primaryEvaluationSubmitted 1차 평가 제출 여부
   * @returns primaryEvaluationViewed가 조건부로 포함된 2차 평가 상태
   */
  private 이차평가_상태에_일차평가확인여부를_추가한다(
    secondaryStatus: {
      status: 'none' | 'in_progress' | 'complete';
      assignedWbsCount: number;
      completedEvaluationCount: number;
      totalScore: number | null;
      grade: string | null;
    },
    viewedStatus: {
      viewedByPrimaryEvaluator: boolean;
      viewedBySecondaryEvaluator: boolean;
      primaryEvaluationViewed: boolean;
    } | null,
    primaryEvaluationSubmitted: boolean,
  ): any {
    const result: any = { ...secondaryStatus };

    // viewedStatus가 있고, 1차 평가가 제출된 경우에만 primaryEvaluationViewed 포함
    if (viewedStatus && primaryEvaluationSubmitted) {
      result.primaryEvaluationViewed = viewedStatus.primaryEvaluationViewed;
    }

    return result;
  }

  /**
   * 평가자의 확인 여부를 계산한다
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param evaluatorId 평가자 ID
   * @param evaluatorTypes 평가자 유형 배열 (PRIMARY, SECONDARY 등)
   * @returns 확인 여부 정보
   */
  private async 평가자_확인여부를_계산한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    evaluatorTypes: string[],
  ): Promise<{
    viewedByPrimaryEvaluator: boolean;
    viewedBySecondaryEvaluator: boolean;
    primaryEvaluationViewed: boolean;
  }> {
    // 1. 피평가자의 마지막 자기평가 제출 시간 조회 (1차 평가자에게 제출)
    const lastSelfEvaluationSubmitTime = await this.wbsSelfEvaluationRepository
      .createQueryBuilder('self')
      .where('self.periodId = :periodId', { periodId: evaluationPeriodId })
      .andWhere('self.employeeId = :employeeId', { employeeId })
      .andWhere('self.submittedToEvaluator = true')
      .andWhere('self.submittedToEvaluatorAt IS NOT NULL')
      .andWhere('self.deletedAt IS NULL')
      .orderBy('self.submittedToEvaluatorAt', 'DESC')
      .limit(1)
      .getOne();

    // 2. 1차 평가자의 마지막 1차평가 제출 시간 조회
    const lastPrimaryEvaluationSubmitTime =
      await this.downwardEvaluationRepository
        .createQueryBuilder('de')
        .where('de.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('de.employeeId = :employeeId', { employeeId })
        .andWhere('de.evaluationType = :type', { type: 'primary' })
        .andWhere('de.isCompleted = true')
        .andWhere('de.completedAt IS NOT NULL')
        .andWhere('de.deletedAt IS NULL')
        .orderBy('de.completedAt', 'DESC')
        .limit(1)
        .getOne();

    // 3. 평가자의 마지막 'viewed' 활동 시간 조회
    const lastViewedActivity = await this.activityLogRepository
      .createQueryBuilder('log')
      .where('log.periodId = :periodId', { periodId: evaluationPeriodId })
      .andWhere('log.employeeId = :employeeId', { employeeId })
      .andWhere('log.performedBy = :evaluatorId', { evaluatorId })
      .andWhere('log.activityAction = :action', { action: 'viewed' })
      .andWhere('log.activityType = :activityType', {
        activityType: 'downward_evaluation',
      })
      .andWhere('log.deletedAt IS NULL')
      .orderBy('log.activityDate', 'DESC')
      .limit(1)
      .getOne();

    const lastViewedTime = lastViewedActivity?.activityDate;

    // 4. 확인 여부 계산
    let viewedByPrimaryEvaluator = false;
    let viewedBySecondaryEvaluator = false;
    let primaryEvaluationViewed = false;

    if (lastViewedTime) {
      // 1차 평가자인 경우: 자기평가 제출 확인
      if (evaluatorTypes.includes('primary')) {
        if (
          lastSelfEvaluationSubmitTime?.submittedToEvaluatorAt &&
          lastViewedTime >= lastSelfEvaluationSubmitTime.submittedToEvaluatorAt
        ) {
          viewedByPrimaryEvaluator = true;
        }
      }

      // 2차 평가자인 경우: 자기평가 + 1차평가 제출 확인
      if (evaluatorTypes.includes('secondary')) {
        // 자기평가 확인
        if (
          lastSelfEvaluationSubmitTime?.submittedToEvaluatorAt &&
          lastViewedTime >= lastSelfEvaluationSubmitTime.submittedToEvaluatorAt
        ) {
          viewedBySecondaryEvaluator = true;
        }

        // 1차평가 확인
        if (
          lastPrimaryEvaluationSubmitTime?.completedAt &&
          lastViewedTime >= lastPrimaryEvaluationSubmitTime.completedAt
        ) {
          primaryEvaluationViewed = true;
        }
      }
    }

    return {
      viewedByPrimaryEvaluator,
      viewedBySecondaryEvaluator,
      primaryEvaluationViewed,
    };
  }
}
