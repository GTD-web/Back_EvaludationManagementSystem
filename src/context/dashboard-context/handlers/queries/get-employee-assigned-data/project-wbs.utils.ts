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

const logger = new Logger('ProjectWbsUtils');

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
): Promise<AssignedProjectWithWbs[]> {
  // 1. 평가 프로젝트 할당 조회 (Project와 PM 직원 정보 join)
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
      'project.status AS project_status',
      'project.startDate AS project_start_date',
      'project.endDate AS project_end_date',
      'project.managerId AS project_manager_id',
      'manager.externalId AS manager_id',
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
        createdAt: row.criteria_created_at,
      });
    }
  }

  // 6. 배치 조회: 성과 정보 (WHERE periodId = :p AND employeeId = :e AND wbsItemId IN (:...wbsItemIds))
  const performanceMap = new Map<string, WbsPerformance | null>();
  if (wbsItemIds.length > 0) {
    const selfEvaluationRows = await selfEvaluationRepository
      .createQueryBuilder('evaluation')
      .select([
        'evaluation.wbsItemId AS evaluation_wbs_item_id',
        'evaluation.performanceResult AS evaluation_performance_result',
        'evaluation.selfEvaluationScore AS evaluation_self_evaluation_score',
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
    const downwardEvaluationRows = await downwardEvaluationRepository
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
      .andWhere('downward.deletedAt IS NULL')
      .getRawMany();

    // 하향평가 데이터를 primary/secondary로 분류
    // 주의: 평가자 ID와 무관하게 해당 WBS의 평가가 완료되었는지 확인
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
      const evaluationContent =
        typeof row.downward_evaluation_content === 'string'
          ? row.downward_evaluation_content
          : row.downward_evaluation_content
            ? JSON.stringify(row.downward_evaluation_content)
            : undefined;

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

      // 1차 평가: 평가자 ID와 무관하게 PRIMARY 타입 평가가 완료되었는지 확인
      if (row.downward_evaluation_type === 'primary' && primaryEvaluator) {
        evalData.primary = {
          downwardEvaluationId: row.downward_id,
          evaluatorId: primaryEvaluator.evaluatorId,
          evaluatorName: primaryEvaluator.evaluatorName,
          evaluationContent,
          score,
          isCompleted: row.downward_is_completed || false,
          submittedAt,
        };
      }
      // 2차 평가: 평가자 ID와 무관하게 SECONDARY 타입 평가가 완료되었는지 확인
      else if (
        row.downward_evaluation_type === 'secondary' &&
        secondaryEvaluator
      ) {
        evalData.secondary = {
          downwardEvaluationId: row.downward_id,
          evaluatorId: secondaryEvaluator.evaluatorId,
          evaluatorName: secondaryEvaluator.evaluatorName,
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

    // 프로젝트 매니저 정보
    const projectManager =
      row.manager_id && row.manager_name
        ? {
            id: row.manager_id,
            name: row.manager_name,
          }
        : null;

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
      const downwardEvalData = downwardEvaluationMap.get(wbsItemId) || {
        primary: null,
        secondary: null,
      };
      const deliverables = deliverablesMap.get(wbsItemId) || [];

      // 2차 평가자 설정: 매핑이 있으면 사용, 없으면 프로젝트 PM을 기본값으로 설정
      let secondaryEval = downwardEvalData.secondary;
      
      if (secondaryEval) {
        // 매핑이 있지만 evaluatorName이 비어있는 경우, PM 이름으로 채움
        if (!secondaryEval.evaluatorName && projectManager && secondaryEval.evaluatorId === projectManager.id) {
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
      } else if (projectManager) {
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
        primaryDownwardEvaluation: downwardEvalData.primary || null,
        secondaryDownwardEvaluation: secondaryEval || null,
        deliverables,
      });
    }

    projectsWithWbs.push({
      projectId,
      projectName: row.project_name || '',
      projectCode: row.project_project_code || '',
      assignedAt: row.assignment_assigned_date,
      projectManager,
      wbsList,
    });
  }

  return projectsWithWbs;
}
