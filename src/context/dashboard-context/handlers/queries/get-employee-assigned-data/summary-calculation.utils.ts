import { Logger } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { Employee } from '@domain/common/employee/employee.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { Project } from '@domain/common/project/project.entity';
import {
  가중치_기반_자기평가_점수를_계산한다,
  자기평가_등급을_조회한다,
} from '../get-employee-evaluation-period-status/self-evaluation.utils';
import {
  가중치_기반_1차_하향평가_점수를_계산한다,
  가중치_기반_2차_하향평가_점수를_계산한다,
  하향평가_등급을_조회한다,
} from '../get-employee-evaluation-period-status/downward-evaluation-score.utils';

const logger = new Logger('SummaryCalculationUtils');

/**
 * 자기평가 점수/등급 계산
 */
export async function calculateSelfEvaluationScore(
  evaluationPeriodId: string,
  employeeId: string,
  completedSelfEvaluations: number,
  selfEvaluationRepository: Repository<WbsSelfEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
): Promise<{
  totalScore: number | null;
  grade: string | null;
}> {
  let selfEvaluationScore: number | null = null;
  let selfEvaluationGrade: string | null = null;

  // 점수가 입력된 자기평가가 있으면 점수/등급 계산 (제출 여부와 무관)
  // 가중치_기반_자기평가_점수를_계산한다 함수 내부에서 점수 입력 여부를 확인하므로,
  // 조건 없이 항상 호출하여 점수가 입력된 경우에만 등급 계산
  selfEvaluationScore = await 가중치_기반_자기평가_점수를_계산한다(
    evaluationPeriodId,
    employeeId,
    selfEvaluationRepository,
    wbsAssignmentRepository,
    evaluationPeriodRepository,
  );

  if (selfEvaluationScore !== null) {
    selfEvaluationGrade = await 자기평가_등급을_조회한다(
      evaluationPeriodId,
      selfEvaluationScore,
      evaluationPeriodRepository,
    );

  }

  return {
    totalScore: selfEvaluationScore,
    grade: selfEvaluationGrade,
  };
}

/**
 * 1차 하향평가 점수/등급 계산
 */
export async function calculatePrimaryDownwardEvaluationScore(
  evaluationPeriodId: string,
  employeeId: string,
  evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
): Promise<{
  totalScore: number | null;
  grade: string | null;
  isSubmitted: boolean;
}> {
  let primaryDownwardScore: number | null = null;
  let primaryDownwardGrade: string | null = null;

  // 1차 평가자 조회
  // 먼저 직원별 고정 담당자 (wbsItemId IS NULL)를 찾고, 없으면 WBS별 매핑에서 찾음
  // 평가자 교체를 고려하여 현재 매핑된 모든 평가자 조회
  let primaryEvaluatorMappings = await evaluationLineMappingRepository
    .createQueryBuilder('mapping')
    .leftJoin(
      EvaluationLine,
      'line',
      'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
    )
    .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
      evaluationPeriodId,
    })
    .andWhere('mapping.employeeId = :employeeId', { employeeId })
    .andWhere('mapping.wbsItemId IS NULL') // 1차 평가자는 직원별 고정 담당자
    .andWhere('line.evaluatorType = :evaluatorType', {
      evaluatorType: EvaluatorType.PRIMARY,
    })
    .andWhere('mapping.deletedAt IS NULL')
    .getMany();

  // 직원별 고정 담당자 매핑이 없으면 WBS별 매핑에서 찾음
  if (primaryEvaluatorMappings.length === 0) {
    primaryEvaluatorMappings = await evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin(
        EvaluationLine,
        'line',
        'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
      )
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.wbsItemId IS NOT NULL') // WBS별 매핑
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: EvaluatorType.PRIMARY,
      })
      .andWhere('mapping.deletedAt IS NULL')
      .getMany();
  }

  if (primaryEvaluatorMappings && primaryEvaluatorMappings.length > 0) {
    // 중복된 evaluatorId 제거
    const primaryEvaluatorIds = [
      ...new Set(
        primaryEvaluatorMappings.map((m) => m.evaluatorId).filter((id) => !!id),
      ),
    ];
    const primaryEvaluatorId = primaryEvaluatorIds[0]; // 대표 평가자 (하위 호환성)

    // 1차 평가자는 직원별 고정 담당자이므로, 할당된 WBS 목록은 WBS 할당 테이블에서 조회
    // (소프트 딜리트된 프로젝트 및 취소된 프로젝트 할당 제외)
    const primaryAssignedWbs = await wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .select(['assignment.wbsItemId AS wbs_item_id'])
      .leftJoin(
        EvaluationProjectAssignment,
        'projectAssignment',
        'projectAssignment.projectId = assignment.projectId AND projectAssignment.periodId = assignment.periodId AND projectAssignment.employeeId = assignment.employeeId AND projectAssignment.deletedAt IS NULL',
      )
      .leftJoin(
        Project,
        'project',
        'project.id = assignment.projectId AND project.deletedAt IS NULL',
      )
      .where('assignment.periodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.deletedAt IS NULL')
      .andWhere('project.id IS NOT NULL') // 프로젝트가 존재하는 경우만 조회
      .andWhere('projectAssignment.id IS NOT NULL') // 프로젝트 할당이 존재하는 경우만 조회
      .getRawMany();

    const primaryAssignedCount = primaryAssignedWbs.length;

    // 할당된 WBS ID 목록 추출
    const primaryAssignedWbsIds = primaryAssignedWbs.map((w) => w.wbs_item_id);

    // 할당된 WBS에 대한 완료된 평가 수 조회 (점수가 입력된 평가)
    // 주의: 1차 평가자가 여러 명일 수 있으므로, evaluatorId 조건 없이 모든 1차 평가를 확인
    // 제출 여부와 무관하게 점수만 입력되면 완료로 간주 (등급 계산용)
    let primaryCompletedCount = 0;
    if (primaryAssignedWbsIds.length > 0) {
      primaryCompletedCount = await downwardEvaluationRepository
        .createQueryBuilder('eval')
        .where('eval.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('eval.employeeId = :employeeId', { employeeId })
        .andWhere('eval.wbsId IN (:...wbsIds)', {
          wbsIds: primaryAssignedWbsIds,
        })
        .andWhere('eval.evaluationType = :evaluationType', {
          evaluationType: DownwardEvaluationType.PRIMARY,
        })
        .andWhere('eval.downwardEvaluationScore IS NOT NULL')
        .andWhere('eval.deletedAt IS NULL')
        .getCount();
    }

    // 제출된 평가 수 조회 (실제 제출 상태 확인용)
    let primarySubmittedCount = 0;
    if (primaryAssignedWbsIds.length > 0) {
      primarySubmittedCount = await downwardEvaluationRepository
        .createQueryBuilder('eval')
        .where('eval.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('eval.employeeId = :employeeId', { employeeId })
        .andWhere('eval.wbsId IN (:...wbsIds)', {
          wbsIds: primaryAssignedWbsIds,
        })
        .andWhere('eval.evaluationType = :evaluationType', {
          evaluationType: DownwardEvaluationType.PRIMARY,
        })
        .andWhere('eval.isCompleted = :isCompleted', {
          isCompleted: true,
        })
        .andWhere('eval.deletedAt IS NULL')
        .getCount();
    }

    // 점수가 입력된 평가가 있으면 점수/등급 계산 (제출 여부와 무관)
    // 가중치_기반_1차_하향평가_점수를_계산한다 함수 내부에서 점수 입력 여부를 확인하므로,
    // 조건 없이 항상 호출하여 점수가 입력된 경우에만 등급 계산
    primaryDownwardScore = await 가중치_기반_1차_하향평가_점수를_계산한다(
      evaluationPeriodId,
      employeeId,
      primaryEvaluatorIds, // 현재 평가라인에 있는 모든 평가자
      downwardEvaluationRepository,
      wbsAssignmentRepository,
      evaluationPeriodRepository,
    );

    if (primaryDownwardScore !== null) {
      primaryDownwardGrade = await 하향평가_등급을_조회한다(
        evaluationPeriodId,
        primaryDownwardScore,
        evaluationPeriodRepository,
      );

    }

    // 제출 상태 계산: 할당된 WBS가 있고, 제출된 평가 수가 할당된 WBS 수와 같으면 제출 완료
    const primaryIsSubmitted =
      primaryAssignedCount > 0 &&
      primarySubmittedCount === primaryAssignedCount &&
      primarySubmittedCount > 0;

    return {
      totalScore: primaryDownwardScore,
      grade: primaryDownwardGrade,
      isSubmitted: primaryIsSubmitted,
    };
  }

  // 1차 평가자가 없는 경우
  return {
    totalScore: null,
    grade: null,
    isSubmitted: false,
  };
}

/**
 * 2차 하향평가 점수/등급 계산
 */
export async function calculateSecondaryDownwardEvaluationScore(
  evaluationPeriodId: string,
  employeeId: string,
  evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
  employeeRepository?: Repository<Employee>,
): Promise<{
  totalScore: number | null;
  grade: string | null;
  isSubmitted: boolean;
  evaluators: Array<{
    evaluatorId: string;
    evaluatorName: string;
    evaluatorEmployeeNumber: string;
    evaluatorEmail: string;
    assignedWbsCount: number;
    completedEvaluationCount: number;
    isSubmitted: boolean;
  }>;
}> {
  let secondaryDownwardScore: number | null = null;
  let secondaryDownwardGrade: string | null = null;

  // 2차 평가자들 조회
  const secondaryEvaluatorMappings = await evaluationLineMappingRepository
    .createQueryBuilder('mapping')
    .leftJoin(
      EvaluationLine,
      'line',
      'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
    )
    .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
      evaluationPeriodId,
    })
    .andWhere('mapping.employeeId = :employeeId', { employeeId })
    .andWhere('line.evaluatorType = :evaluatorType', {
      evaluatorType: EvaluatorType.SECONDARY,
    })
    .andWhere('mapping.deletedAt IS NULL')
    .getMany();

  // 중복 제거: 한 평가자가 여러 WBS를 평가할 수 있음
  const secondaryEvaluatorIds = secondaryEvaluatorMappings.length > 0
    ? [...new Set(secondaryEvaluatorMappings.map((m) => m.evaluatorId))]
    : [];

  // 매핑이 없어도 점수가 입력된 평가가 있으면 등급 계산 시도
  // 가중치_기반_2차_하향평가_점수를_계산한다 함수가 evaluatorIds 조건 없이 모든 2차 평가를 조회하므로
  // 매핑이 없어도 점수가 입력된 평가가 있으면 등급 계산 가능
  
  // 각 2차 평가자별 할당된 WBS 수와 완료된 평가 수 조회 (매핑이 있는 경우만)
  const evaluatorStats = secondaryEvaluatorIds.length > 0
    ? await Promise.all(
        secondaryEvaluatorIds.map(async (evaluatorId) => {
        // 할당된 WBS 목록 조회 (wbsItemId 포함, 소프트 딜리트된 프로젝트 및 취소된 프로젝트 할당 제외)
        const assignedMappings = await evaluationLineMappingRepository
          .createQueryBuilder('mapping')
          .select(['mapping.id', 'mapping.wbsItemId'])
          .leftJoin(
            EvaluationLine,
            'line',
            'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
          )
          .leftJoin(
            WbsItem,
            'wbs',
            'wbs.id = mapping.wbsItemId AND wbs.deletedAt IS NULL',
          )
          .leftJoin(
            Project,
            'project',
            'project.id = wbs.projectId AND project.deletedAt IS NULL',
          )
          .leftJoin(
            EvaluationProjectAssignment,
            'projectAssignment',
            'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = mapping.evaluationPeriodId AND projectAssignment.employeeId = mapping.employeeId AND projectAssignment.deletedAt IS NULL',
          )
          .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
          })
          .andWhere('mapping.employeeId = :employeeId', { employeeId })
          .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
          .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: EvaluatorType.SECONDARY,
          })
          .andWhere('mapping.deletedAt IS NULL')
          .andWhere('mapping.wbsItemId IS NOT NULL') // wbsItemId가 있는 것만 조회
          .andWhere('project.id IS NOT NULL') // 프로젝트가 존재하는 경우만 조회
          .andWhere('projectAssignment.id IS NOT NULL') // 프로젝트 할당이 존재하는 경우만 조회
          .getRawMany();

        const assignedCount = assignedMappings.length;

        // 할당된 WBS ID 목록 추출
        const assignedWbsIds = assignedMappings.map((m) => m.mapping_wbsItemId);

        // 할당된 WBS에 대한 완료된 평가 수 조회 (점수가 입력된 평가, 등급 계산용)
        // 제출 여부와 무관하게 점수만 입력되면 완료로 간주
        let completedCount = 0;
        if (assignedWbsIds.length > 0) {
          completedCount = await downwardEvaluationRepository
            .createQueryBuilder('eval')
            .where('eval.periodId = :periodId', {
              periodId: evaluationPeriodId,
            })
            .andWhere('eval.employeeId = :employeeId', { employeeId })
            .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
            .andWhere('eval.wbsId IN (:...wbsIds)', { wbsIds: assignedWbsIds })
            .andWhere('eval.evaluationType = :evaluationType', {
              evaluationType: DownwardEvaluationType.SECONDARY,
            })
            .andWhere('eval.downwardEvaluationScore IS NOT NULL')
            .andWhere('eval.deletedAt IS NULL')
            .getCount();
        }

        // 제출된 평가 수 조회 (실제 제출 상태 확인용)
        let submittedCount = 0;
        if (assignedWbsIds.length > 0) {
          submittedCount = await downwardEvaluationRepository
            .createQueryBuilder('eval')
            .where('eval.periodId = :periodId', {
              periodId: evaluationPeriodId,
            })
            .andWhere('eval.employeeId = :employeeId', { employeeId })
            .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
            .andWhere('eval.wbsId IN (:...wbsIds)', { wbsIds: assignedWbsIds })
            .andWhere('eval.evaluationType = :evaluationType', {
              evaluationType: DownwardEvaluationType.SECONDARY,
            })
            .andWhere('eval.isCompleted = :isCompleted', {
              isCompleted: true,
            })
            .andWhere('eval.deletedAt IS NULL')
            .getCount();
        }

          return { evaluatorId, assignedCount, completedCount, submittedCount };
        }),
      )
    : [];

  // 할당된 WBS가 있는 평가자만 필터링 (삭제된 프로젝트의 WBS만 담당하는 평가자 제외)
  const activeEvaluatorStats = evaluatorStats.filter(
    (stat) => stat.assignedCount > 0,
  );

    // 모든 활성 평가자가 완료했는지 확인 (등급 계산용)
    const allCompleted =
      activeEvaluatorStats.length > 0 &&
      activeEvaluatorStats.every(
        (stat) => stat.completedCount === stat.assignedCount,
      );

  // 점수가 입력된 평가가 있으면 점수 계산 (제출 여부와 무관)
  // 가중치_기반_2차_하향평가_점수를_계산한다 함수 내부에서 점수 입력 여부를 확인하므로,
  // 조건 없이 항상 호출하여 점수가 입력된 경우에만 등급 계산
  secondaryDownwardScore = await 가중치_기반_2차_하향평가_점수를_계산한다(
    evaluationPeriodId,
    employeeId,
    secondaryEvaluatorIds,
    downwardEvaluationRepository,
    wbsAssignmentRepository,
    evaluationPeriodRepository,
  );

  if (secondaryDownwardScore !== null) {
    secondaryDownwardGrade = await 하향평가_등급을_조회한다(
      evaluationPeriodId,
      secondaryDownwardScore,
      evaluationPeriodRepository,
    );
  }

  // 2차 평가 제출 상태 계산: 할당된 WBS가 있는 모든 평가자가 제출했는지 확인
  const secondaryIsSubmitted =
    activeEvaluatorStats.length > 0 &&
    activeEvaluatorStats.every(
      (stat) =>
        stat.submittedCount === stat.assignedCount && stat.submittedCount > 0,
    );

  // 각 평가자별 정보 조회 (할당된 WBS가 있는 평가자만 포함)
  const evaluators = await Promise.all(
    activeEvaluatorStats.map(async (stat) => {
        let evaluatorName = '알 수 없음';
        let evaluatorEmployeeNumber = 'N/A';
        let evaluatorEmail = 'N/A';

        if (employeeRepository) {
          const evaluator = await employeeRepository
            .createQueryBuilder('employee')
            .where(
              '(employee.id::text = :evaluatorId OR employee.externalId = :evaluatorId)',
              {
                evaluatorId: stat.evaluatorId,
              },
            )
            .andWhere('employee.deletedAt IS NULL')
            .select([
              'employee.id',
              'employee.name',
              'employee.employeeNumber',
              'employee.email',
            ])
            .getOne();

          if (evaluator) {
            evaluatorName = evaluator.name;
            evaluatorEmployeeNumber = evaluator.employeeNumber;
            evaluatorEmail = evaluator.email;
          }
        }

        const evaluatorIsSubmitted =
          stat.assignedCount > 0 &&
          stat.submittedCount === stat.assignedCount &&
          stat.submittedCount > 0;

      return {
        evaluatorId: stat.evaluatorId,
        evaluatorName,
        evaluatorEmployeeNumber,
        evaluatorEmail,
        assignedWbsCount: stat.assignedCount,
        completedEvaluationCount: stat.completedCount,
        isSubmitted: evaluatorIsSubmitted,
      };
    }),
  );

  return {
    totalScore: secondaryDownwardScore,
    grade: secondaryDownwardGrade,
    isSubmitted: secondaryIsSubmitted,
    evaluators,
  };
}
