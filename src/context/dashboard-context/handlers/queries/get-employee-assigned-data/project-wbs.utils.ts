import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import {
  AssignedProjectWithWbs,
  AssignedWbsInfo,
  WbsEvaluationCriterion,
  WbsPerformance,
  WbsDownwardEvaluationInfo,
  DeliverableInfo,
} from './types';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';

// 임시로 로거 비활성화 (디버깅용)
// const logger = new Logger('ProjectWbsUtils');
const logger = {
  log: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
} as any;

/**
 * 프로젝트별 할당 정보 조회 (WBS 목록 포함)
 *
 * 루프 안 쿼리를 제거하고 배치 조회로 최적화했습니다.
 * 모든 관련 데이터를 한 번에 조회한 후 메모리에서 그룹핑합니다.
 */
export async function getProjectsWithWbs(
  evaluationPeriodId: string,
  employeeId: string,
  mapping: EvaluationPeriodEmployeeMapping,
  projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  wbsItemRepository: Repository<WbsItem>,
  criteriaRepository: Repository<WbsEvaluationCriteria>,
  selfEvaluationRepository: Repository<WbsSelfEvaluation>,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  deliverableRepository: Repository<Deliverable>,
  employeeRepository: Repository<Employee>,
): Promise<AssignedProjectWithWbs[]> {
  // 1. 평가 프로젝트 할당 조회 (Project와 PM 정보 join)
  const projectAssignments = await projectAssignmentRepository
    .createQueryBuilder('assignment')
    .leftJoin(
      Project,
      'project',
      'project.id = assignment.projectId AND project.deletedAt IS NULL',
    )
    .leftJoin(
      Employee,
      'manager',
      'manager.externalId = project.managerId AND manager.deletedAt IS NULL',
    )
    .select([
      'assignment.id AS assignment_id',
      'assignment.projectId AS assignment_project_id',
      'assignment.assignedDate AS assignment_assigned_date',
      'assignment.displayOrder AS assignment_display_order',
      'project.id AS project_id',
      'project.name AS project_name',
      'project.projectCode AS project_project_code',
      'project.grade AS project_grade',
      'project.priority AS project_priority',
      'project.managerId AS project_manager_id',
      'project.realPM AS project_real_pm',
      'manager.id AS manager_id',
      'manager.name AS manager_name',
    ])
    .where('assignment.periodId = :periodId', {
      periodId: evaluationPeriodId,
    })
    .andWhere('assignment.employeeId = :employeeId', { employeeId })
    .andWhere('assignment.deletedAt IS NULL')
    .orderBy('assignment.displayOrder', 'ASC')
    .addOrderBy('assignment.assignedDate', 'DESC')
    .getRawMany();

  if (projectAssignments.length === 0) {
    return [];
  }

  // 2. 모든 프로젝트 ID 수집
  const projectIds = [
    ...new Set(
      projectAssignments.map(
        (row) => row.assignment_project_id || row.project_id,
      ),
    ),
  ].filter((id): id is string => !!id);

  // 3. 모든 WBS 할당 조회 (한 번에 모든 프로젝트의 WBS 조회)
  const wbsAssignments = await wbsAssignmentRepository
    .createQueryBuilder('assignment')
    .leftJoin(
      WbsItem,
      'wbsItem',
      'wbsItem.id = assignment.wbsItemId AND wbsItem.projectId = assignment.projectId AND wbsItem.deletedAt IS NULL',
    )
    .select([
      'assignment.id AS assignment_id',
      'assignment.wbsItemId AS assignment_wbs_item_id',
      'assignment.projectId AS assignment_project_id',
      'assignment.assignedDate AS assignment_assigned_date',
      'assignment.displayOrder AS assignment_display_order',
      'assignment.weight AS assignment_weight',
      'wbsItem.id AS wbs_item_id',
      'wbsItem.wbsCode AS wbs_item_wbs_code',
      'wbsItem.title AS wbs_item_title',
      'wbsItem.projectId AS wbs_item_project_id',
    ])
    .where('assignment.periodId = :periodId', {
      periodId: evaluationPeriodId,
    })
    .andWhere('assignment.employeeId = :employeeId', { employeeId })
    .andWhere('assignment.projectId IN (:...projectIds)', { projectIds })
    .andWhere('assignment.deletedAt IS NULL')
    .orderBy('assignment.displayOrder', 'ASC')
    .addOrderBy('assignment.assignedDate', 'DESC')
    .getRawMany();

  // 4. 모든 WBS ID 수집
  const wbsItemIds = [
    ...new Set(
      wbsAssignments.map(
        (row) => row.assignment_wbs_item_id || row.wbs_item_id,
      ),
    ),
  ].filter((id): id is string => !!id);

  // 5. 배치 조회: 평가기준 (WHERE wbsItemId IN (:...wbsItemIds))
  const criteriaMap = new Map<string, WbsEvaluationCriterion[]>();
  if (wbsItemIds.length > 0) {
    const criteriaRows = await criteriaRepository
      .createQueryBuilder('criteria')
      .select([
        'criteria.id AS criteria_id',
        'criteria.wbsItemId AS criteria_wbs_item_id',
        'criteria.criteria AS criteria_criteria',
        'criteria.importance AS criteria_importance',
        'criteria.subProject AS criteria_sub_project',
        'criteria.isAdditional AS criteria_is_additional',
        'criteria.createdAt AS criteria_created_at',
      ])
      .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
      .andWhere('criteria.deletedAt IS NULL')
      .orderBy('criteria.createdAt', 'ASC')
      .getRawMany();

    for (const row of criteriaRows) {
      const wbsId = row.criteria_wbs_item_id;
      if (!wbsId) continue;

      if (!criteriaMap.has(wbsId)) {
        criteriaMap.set(wbsId, []);
      }

      criteriaMap.get(wbsId)!.push({
        criterionId: row.criteria_id,
        criteria: row.criteria_criteria || '',
        importance: row.criteria_importance || 5,
        subProject: row.criteria_sub_project || null,
        isAdditional: row.criteria_is_additional || false,
        createdAt: row.criteria_created_at,
      });
    }
  }

  // 6. 배치 조회: 성과 정보 (WHERE periodId = :p AND employeeId = :e AND wbsItemId IN (:...wbsItemIds))
  const performanceMap = new Map<string, WbsPerformance | null>();
  const subProjectMap = new Map<string, string | null>();
  if (wbsItemIds.length > 0) {
    const selfEvaluationRows = await selfEvaluationRepository
      .createQueryBuilder('evaluation')
      .select([
        'evaluation.wbsItemId AS evaluation_wbs_item_id',
        'evaluation.performanceResult AS evaluation_performance_result',
        'evaluation.selfEvaluationScore AS evaluation_self_evaluation_score',
        'evaluation.subProject AS evaluation_sub_project',
        'evaluation.submittedToManagerAt AS evaluation_submitted_to_manager_at',
      ])
      .where('evaluation.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('evaluation.employeeId = :employeeId', { employeeId })
      .andWhere('evaluation.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
      .andWhere('evaluation.deletedAt IS NULL')
      .getRawMany();

    for (const row of selfEvaluationRows) {
      const wbsId = row.evaluation_wbs_item_id;
      if (!wbsId) continue;

      const performance: WbsPerformance = {
        performanceResult: row.evaluation_performance_result,
        score:
          row.evaluation_self_evaluation_score !== null &&
          row.evaluation_self_evaluation_score !== undefined
            ? Number(row.evaluation_self_evaluation_score)
            : undefined,
        isCompleted: row.evaluation_performance_result ? true : false,
        completedAt: row.evaluation_performance_result
          ? row.evaluation_submitted_to_manager_at
          : undefined,
      };

      performanceMap.set(wbsId, performance);
      subProjectMap.set(wbsId, row.evaluation_sub_project || null);
    }
  }

  // 7. 배치 조회: 하향평가 평가자 매핑 (1차, 2차)
  const primaryEvaluatorMap = new Map<
    string,
    { evaluatorId: string; evaluatorName: string }
  >();
  const secondaryEvaluatorMap = new Map<
    string,
    { evaluatorId: string; evaluatorName: string }
  >();

  // 7-1. 1차 평가자 (직원별 고정 담당자)
  // 먼저 직원별 고정 담당자를 찾고, 없으면 WBS별 매핑에서 찾음
  const primaryEvaluatorMapping = await evaluationLineMappingRepository
    .createQueryBuilder('mapping')
    .select([
      'mapping.evaluatorId AS mapping_evaluator_id',
      'evaluator.name AS evaluator_name',
    ])
    .leftJoin(
      Employee,
      'evaluator',
      '(evaluator.id = mapping.evaluatorId OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL',
    )
    .leftJoin(
      'evaluation_lines',
      'line',
      'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
    )
    .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
      evaluationPeriodId,
    })
    .andWhere('mapping.employeeId = :employeeId', { employeeId })
    .andWhere('mapping.wbsItemId IS NULL')
    .andWhere('mapping.deletedAt IS NULL')
    .andWhere('line.evaluatorType = :evaluatorType', {
      evaluatorType: 'primary',
    })
    .getRawOne();

  if (primaryEvaluatorMapping?.mapping_evaluator_id) {
    const evaluatorId = primaryEvaluatorMapping.mapping_evaluator_id;
    // 모든 WBS에 대해 1차 평가자 동일 (직원별 고정)
    wbsItemIds.forEach((wbsId) => {
      primaryEvaluatorMap.set(wbsId, {
        evaluatorId,
        evaluatorName: primaryEvaluatorMapping.evaluator_name || '',
      });
    });
  } else if (wbsItemIds.length > 0) {
    // 직원별 고정 담당자가 없으면 WBS별 매핑에서 PRIMARY 평가자를 찾음
    const wbsPrimaryEvaluatorMappings = await evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .select([
        'mapping.wbsItemId AS mapping_wbs_item_id',
        'mapping.evaluatorId AS mapping_evaluator_id',
        'evaluator.name AS evaluator_name',
      ])
      .leftJoin(
        Employee,
        'evaluator',
        '(evaluator.id = mapping.evaluatorId OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL',
      )
      .leftJoin(
        'evaluation_lines',
        'line',
        'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
      )
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'primary',
      })
      .getRawMany();

    for (const row of wbsPrimaryEvaluatorMappings) {
      const wbsId = row.mapping_wbs_item_id;
      if (!wbsId || !row.mapping_evaluator_id) continue;

      primaryEvaluatorMap.set(wbsId, {
        evaluatorId: row.mapping_evaluator_id,
        evaluatorName: row.evaluator_name || '',
      });
    }
  }

  // 7-2. 2차 평가자 (WBS별 평가자)
  if (wbsItemIds.length > 0) {
    const secondaryEvaluatorMappings = await evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .select([
        'mapping.wbsItemId AS mapping_wbs_item_id',
        'mapping.evaluatorId AS mapping_evaluator_id',
        'evaluator.id AS evaluator_id',
        'evaluator.name AS evaluator_name',
        'evaluator.externalId AS evaluator_external_id',
      ])
      .leftJoin(
        Employee,
        'evaluator',
        '(evaluator.id = mapping.evaluatorId OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL',
      )
      .leftJoin(
        'evaluation_lines',
        'line',
        'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
      )
      .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('mapping.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
      .andWhere('mapping.deletedAt IS NULL')
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: 'secondary',
      })
      .getRawMany();

    logger.log('2차 평가자 매핑 조회 결과', {
      count: secondaryEvaluatorMappings.length,
      mappings: secondaryEvaluatorMappings,
    });

    for (const row of secondaryEvaluatorMappings) {
      const wbsId = row.mapping_wbs_item_id;
      if (!wbsId || !row.mapping_evaluator_id) continue;

      logger.log('2차 평가자 매핑 설정', {
        wbsId,
        evaluatorId: row.mapping_evaluator_id,
        evaluatorName: row.evaluator_name,
        evaluatorExternalId: row.evaluator_external_id,
      });

      secondaryEvaluatorMap.set(wbsId, {
        evaluatorId: row.mapping_evaluator_id,
        evaluatorName: row.evaluator_name || '',
      });
    }
  }

  // 8. 배치 조회: 하향평가 데이터 (WHERE periodId = :p AND employeeId = :e AND wbsId IN (:...wbsItemIds))
  const downwardEvaluationMap = new Map<
    string,
    {
      primary: WbsDownwardEvaluationInfo | null;
      secondary: WbsDownwardEvaluationInfo | null;
    }
  >();
  if (wbsItemIds.length > 0) {
    // 먼저 1차 평가 데이터 조회 (PRIMARY 평가자가 작성한 것만)
    const primaryEvaluationRows = await downwardEvaluationRepository
      .createQueryBuilder('downward')
      .innerJoin(
        EvaluationLineMapping,
        'mapping',
        'mapping.evaluationPeriodId = downward.periodId ' +
          'AND mapping.employeeId = downward.employeeId ' +
          'AND (mapping.wbsItemId = downward.wbsId OR mapping.wbsItemId IS NULL) ' +
          'AND mapping.evaluatorId = downward.evaluatorId ' +
          'AND mapping.deletedAt IS NULL',
      )
      .innerJoin(
        'evaluation_lines',
        'line',
        'line.id = mapping.evaluationLineId ' +
          "AND line.evaluatorType = 'primary' " +
          'AND line.deletedAt IS NULL',
      )
      .select([
        'downward.id AS downward_id',
        'downward.wbsId AS downward_wbs_id',
        'downward.evaluatorId AS downward_evaluator_id',
        'downward.evaluationType AS downward_evaluation_type',
        'downward.downwardEvaluationContent AS downward_evaluation_content',
        'downward.downwardEvaluationScore AS downward_score',
        'downward.isCompleted AS downward_is_completed',
        'downward.completedAt AS downward_completed_at',
      ])
      .where('downward.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('downward.employeeId = :employeeId', { employeeId })
      .andWhere('downward.wbsId IN (:...wbsItemIds)', { wbsItemIds })
      .andWhere('downward.evaluationType = :evaluationType', {
        evaluationType: 'primary',
      })
      .andWhere('downward.deletedAt IS NULL')
      .getRawMany();

    // 2차 평가 데이터 조회 (SECONDARY 평가자가 작성한 것만)
    // 평가라인 매핑과의 조인을 제거하여 실제로 제출된 모든 secondary 평가를 가져옴
    const secondaryEvaluationRows = await downwardEvaluationRepository
      .createQueryBuilder('downward')
      .select([
        'downward.id AS downward_id',
        'downward.wbsId AS downward_wbs_id',
        'downward.evaluatorId AS downward_evaluator_id',
        'downward.evaluationType AS downward_evaluation_type',
        'downward.downwardEvaluationContent AS downward_evaluation_content',
        'downward.downwardEvaluationScore AS downward_score',
        'downward.isCompleted AS downward_is_completed',
        'downward.completedAt AS downward_completed_at',
      ])
      .where('downward.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('downward.employeeId = :employeeId', { employeeId })
      .andWhere('downward.wbsId IN (:...wbsItemIds)', { wbsItemIds })
      .andWhere('downward.evaluationType = :evaluationType', {
        evaluationType: 'secondary',
      })
      .andWhere('downward.deletedAt IS NULL')
      .getRawMany();

    // 1차 평가와 2차 평가를 합침
    const downwardEvaluationRows = [
      ...primaryEvaluationRows,
      ...secondaryEvaluationRows,
    ];

    // 8-1. 하향평가에 나타난 모든 평가자 ID 수집
    const allEvaluatorIds = new Set<string>();
    for (const row of downwardEvaluationRows) {
      const evaluatorId = row.downward_evaluator_id;
      if (evaluatorId) {
        allEvaluatorIds.add(evaluatorId);
      }
    }

    // 8-2. 모든 평가자 정보 조회 (실제 제출한 평가자 이름을 정확히 표시하기 위해)
    const evaluatorNameMap = new Map<string, string>(); // evaluatorId -> name
    if (allEvaluatorIds.size > 0) {
      const evaluators = await employeeRepository
        .createQueryBuilder('employee')
        .select([
          'employee.id AS employee_id',
          'employee.name AS employee_name',
        ])
        .where('employee.id IN (:...ids)', {
          ids: Array.from(allEvaluatorIds),
        })
        .andWhere('employee.deletedAt IS NULL')
        .getRawMany();

      for (const emp of evaluators) {
        evaluatorNameMap.set(emp.employee_id, emp.employee_name);
      }

      // externalId로도 조회 (일부 평가자 ID가 externalId일 수 있음)
      const evaluatorsByExternalId = await employeeRepository
        .createQueryBuilder('employee')
        .select([
          'employee.externalId AS employee_id',
          'employee.name AS employee_name',
        ])
        .where('employee.externalId IN (:...ids)', {
          ids: Array.from(allEvaluatorIds),
        })
        .andWhere('employee.deletedAt IS NULL')
        .getRawMany();

      for (const emp of evaluatorsByExternalId) {
        if (emp.employee_id) {
          evaluatorNameMap.set(emp.employee_id, emp.employee_name);
        }
      }
    }

    // 하향평가 데이터를 primary/secondary로 분류
    // 주의: 평가자 ID와 무관하게 해당 WBS의 평가가 완료되었는지 확인
    // 실제로 평가를 제출한 사람의 정보를 사용 (평가라인과 다른 사람이 제출한 경우 대응)
    for (const row of downwardEvaluationRows) {
      const wbsId = row.downward_wbs_id;
      if (!wbsId) continue;

      if (!downwardEvaluationMap.has(wbsId)) {
        downwardEvaluationMap.set(wbsId, {
          primary: null,
          secondary: null,
        });
      }

      const evalData = downwardEvaluationMap.get(wbsId)!;
      const primaryEvaluator = primaryEvaluatorMap.get(wbsId);
      const secondaryEvaluator = secondaryEvaluatorMap.get(wbsId);

      // evaluationContent는 문자열이어야 함 (JSON일 경우 문자열로 변환)
      let evaluationContent =
        typeof row.downward_evaluation_content === 'string'
          ? row.downward_evaluation_content
          : row.downward_evaluation_content
            ? JSON.stringify(row.downward_evaluation_content)
            : undefined;

      // 제출된 하향평가인데 content가 없으면 기본 메시지 생성
      if (row.downward_is_completed && !evaluationContent?.trim()) {
        const actualEvaluatorId = row.downward_evaluator_id;
        const actualEvaluatorName = actualEvaluatorId
          ? evaluatorNameMap.get(actualEvaluatorId) || '평가자'
          : '평가자';
        evaluationContent = `${actualEvaluatorName}님이 미입력 상태에서 제출하였습니다.`;
      }

      // score는 숫자여야 함
      const score =
        typeof row.downward_score === 'number'
          ? row.downward_score
          : row.downward_score !== null && row.downward_score !== undefined
            ? parseFloat(String(row.downward_score)) || undefined
            : undefined;

      // submittedAt은 Date이거나 문자열이어야 함
      const submittedAt =
        row.downward_completed_at instanceof Date
          ? row.downward_completed_at
          : row.downward_completed_at
            ? new Date(row.downward_completed_at)
            : undefined;

      // 실제 제출한 평가자의 이름 찾기
      const actualEvaluatorId = row.downward_evaluator_id;
      const actualEvaluatorName = actualEvaluatorId
        ? evaluatorNameMap.get(actualEvaluatorId) || undefined
        : undefined;

      // 1차 평가: 평가자 ID와 무관하게 PRIMARY 타입 평가가 완료되었는지 확인
      // 항상 평가라인의 평가자 정보를 우선 사용 (DB에 잘못 저장된 경우 대응)
      if (row.downward_evaluation_type === 'primary') {
        evalData.primary = {
          evaluatorId:
            primaryEvaluator?.evaluatorId || actualEvaluatorId || undefined,
          evaluatorName:
            primaryEvaluator?.evaluatorName ||
            actualEvaluatorName ||
            '알 수 없음',
          evaluationContent,
          score,
          isCompleted: row.downward_is_completed || false,
          submittedAt,
        };
      }
      // 2차 평가: 평가자 ID와 무관하게 SECONDARY 타입 평가가 완료되었는지 확인
      // 항상 평가라인의 평가자 정보를 우선 사용 (DB에 잘못 저장된 경우 대응)
      else if (row.downward_evaluation_type === 'secondary') {
        evalData.secondary = {
          evaluatorId:
            secondaryEvaluator?.evaluatorId || actualEvaluatorId || undefined,
          evaluatorName:
            secondaryEvaluator?.evaluatorName ||
            actualEvaluatorName ||
            '알 수 없음',
          evaluationContent,
          score,
          isCompleted: row.downward_is_completed || false,
          submittedAt,
        };
      }
    }

    // 평가 데이터가 없지만 평가자가 있는 경우 기본 정보 설정
    for (const wbsId of wbsItemIds) {
      if (!downwardEvaluationMap.has(wbsId)) {
        downwardEvaluationMap.set(wbsId, {
          primary: null,
          secondary: null,
        });
      }

      const evalData = downwardEvaluationMap.get(wbsId)!;
      const primaryEvaluator = primaryEvaluatorMap.get(wbsId);
      const secondaryEvaluator = secondaryEvaluatorMap.get(wbsId);

      if (primaryEvaluator && !evalData.primary) {
        evalData.primary = {
          evaluatorId: primaryEvaluator.evaluatorId,
          evaluatorName: primaryEvaluator.evaluatorName,
          isCompleted: false,
        };
      }

      if (secondaryEvaluator && !evalData.secondary) {
        evalData.secondary = {
          evaluatorId: secondaryEvaluator.evaluatorId,
          evaluatorName: secondaryEvaluator.evaluatorName,
          isCompleted: false,
        };
      }
    }
  }

  // 9. 배치 조회: 산출물 (WHERE wbsItemId IN (:...wbsItemIds))
  const deliverablesMap = new Map<string, DeliverableInfo[]>();
  if (wbsItemIds.length > 0) {
    const deliverableRows = await deliverableRepository
      .createQueryBuilder('deliverable')
      .select([
        'deliverable.id AS deliverable_id',
        'deliverable.wbsItemId AS deliverable_wbs_item_id',
        'deliverable.name AS deliverable_name',
        'deliverable.description AS deliverable_description',
        'deliverable.type AS deliverable_type',
        'deliverable.filePath AS deliverable_file_path',
        'deliverable.employeeId AS deliverable_employee_id',
        'deliverable.mappedDate AS deliverable_mapped_date',
        'deliverable.mappedBy AS deliverable_mapped_by',
        'deliverable.isActive AS deliverable_is_active',
        'deliverable.createdAt AS deliverable_created_at',
      ])
      .where('deliverable.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
      .andWhere('deliverable.deletedAt IS NULL')
      .andWhere('deliverable.isActive = :isActive', { isActive: true })
      .orderBy('deliverable.createdAt', 'DESC')
      .getRawMany();

    for (const row of deliverableRows) {
      const wbsId = row.deliverable_wbs_item_id;
      if (!wbsId) continue;

      if (!deliverablesMap.has(wbsId)) {
        deliverablesMap.set(wbsId, []);
      }

      deliverablesMap.get(wbsId)!.push({
        id: row.deliverable_id,
        name: row.deliverable_name,
        description: row.deliverable_description,
        type: row.deliverable_type,
        filePath: row.deliverable_file_path,
        employeeId: row.deliverable_employee_id,
        mappedDate: row.deliverable_mapped_date,
        mappedBy: row.deliverable_mapped_by,
        isActive: row.deliverable_is_active,
        createdAt: row.deliverable_created_at,
      });
    }
  }

  // 10. 메모리에서 그룹핑: 프로젝트별 WBS 목록 구성
  const projectsWithWbs: AssignedProjectWithWbs[] = [];

  for (const row of projectAssignments) {
    const projectId = row.assignment_project_id || row.project_id;

    if (!projectId) {
      logger.warn('프로젝트 ID가 없는 할당 발견', { row });
      continue;
    }

    // 프로젝트가 삭제된 경우 스킵 (LEFT JOIN으로 인해 project 필드가 null일 수 있음)
    if (!row.project_name) {
      logger.debug('소프트 딜리트된 프로젝트 제외', { projectId });
      continue;
    }

    // 프로젝트 매니저 정보 (PM 기본 정보만)
    const projectManager =
      row.manager_id && row.manager_name
        ? {
            id: row.manager_id,
            name: row.manager_name,
          }
        : null;

    // 실 PM은 프로젝트 테이블에서 가져온 realPM 값 사용
    const realPM = row.project_real_pm || '';

    // 해당 프로젝트의 WBS 목록 필터링
    const projectWbsAssignments = wbsAssignments.filter(
      (wbsRow) =>
        (wbsRow.assignment_project_id || wbsRow.wbs_item_project_id) ===
        projectId,
    );

    const wbsList: AssignedWbsInfo[] = [];

    for (const wbsRow of projectWbsAssignments) {
      const wbsItemId = wbsRow.assignment_wbs_item_id || wbsRow.wbs_item_id;

      if (!wbsItemId) {
        logger.warn('WBS ID가 없는 할당 발견', { wbsRow });
        continue;
      }

      const criteria = criteriaMap.get(wbsItemId) || [];
      const performance = performanceMap.get(wbsItemId) || null;
      const subProject = subProjectMap.get(wbsItemId) || null;
      const downwardEvalData = downwardEvaluationMap.get(wbsItemId) || {
        primary: null,
        secondary: null,
      };
      const deliverables = deliverablesMap.get(wbsItemId) || [];

      // 2차 평가자 설정: 매핑이 있으면 사용, 없으면 프로젝트 PM을 기본값으로 설정
      let secondaryEval = downwardEvalData.secondary;

      if (secondaryEval) {
        // 매핑이 있지만 evaluatorName이 비어있는 경우, PM 이름으로 채움
        if (
          !secondaryEval.evaluatorName &&
          projectManager &&
          projectManager.id &&
          secondaryEval.evaluatorId === projectManager.id
        ) {
          logger.log('2차 평가자 이름을 프로젝트 PM으로 설정', {
            wbsId: wbsItemId,
            evaluatorId: secondaryEval.evaluatorId,
            pmId: projectManager.id,
            pmName: projectManager.name,
          });
          secondaryEval = {
            ...secondaryEval,
            evaluatorName: projectManager.name,
          };
        }
      } else if (projectManager && projectManager.id) {
        // 2차 평가자 매핑이 없으면 프로젝트 PM을 기본값으로 설정
        logger.log('2차 평가자 매핑이 없어 프로젝트 PM을 기본값으로 설정', {
          wbsId: wbsItemId,
          pmId: projectManager.id,
          pmName: projectManager.name,
        });
        secondaryEval = {
          evaluatorId: projectManager.id,
          evaluatorName: projectManager.name,
          isCompleted: false,
        };
      }

      wbsList.push({
        wbsId: wbsItemId,
        wbsName: wbsRow.wbs_item_title || '',
        wbsCode: wbsRow.wbs_item_wbs_code || '',
        weight: parseFloat(wbsRow.assignment_weight) || 0,
        assignedAt: wbsRow.assignment_assigned_date,
        criteria,
        performance,
        subProject,
        primaryDownwardEvaluation: downwardEvalData.primary || null,
        secondaryDownwardEvaluation: secondaryEval || null,
        deliverables,
      });
    }

    projectsWithWbs.push({
      projectId,
      projectName: row.project_name || '',
      projectCode: row.project_project_code || '',
      grade: row.project_grade || undefined,
      priority: row.project_priority || undefined,
      assignedAt: row.assignment_assigned_date,
      projectManager,
      realPM,
      wbsList,
    });
  }

  return projectsWithWbs;
}
