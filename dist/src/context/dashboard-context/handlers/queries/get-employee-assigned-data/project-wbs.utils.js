"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectsWithWbs = getProjectsWithWbs;
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const logger = { log: () => { }, warn: () => { }, error: () => { }, debug: () => { } };
async function getProjectsWithWbs(evaluationPeriodId, employeeId, mapping, projectAssignmentRepository, wbsAssignmentRepository, wbsItemRepository, criteriaRepository, selfEvaluationRepository, downwardEvaluationRepository, evaluationLineMappingRepository, deliverableRepository, employeeRepository) {
    const projectAssignments = await projectAssignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
        .leftJoin(employee_entity_1.Employee, 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
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
    const projectIds = [
        ...new Set(projectAssignments.map((row) => row.assignment_project_id || row.project_id)),
    ].filter((id) => !!id);
    const wbsAssignments = await wbsAssignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin(wbs_item_entity_1.WbsItem, 'wbsItem', 'wbsItem.id = assignment.wbsItemId AND wbsItem.projectId = assignment.projectId AND wbsItem.deletedAt IS NULL')
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
    const wbsItemIds = [
        ...new Set(wbsAssignments.map((row) => row.assignment_wbs_item_id || row.wbs_item_id)),
    ].filter((id) => !!id);
    const criteriaMap = new Map();
    if (wbsItemIds.length > 0) {
        const criteriaRows = await criteriaRepository
            .createQueryBuilder('criteria')
            .select([
            'criteria.id AS criteria_id',
            'criteria.wbsItemId AS criteria_wbs_item_id',
            'criteria.criteria AS criteria_criteria',
            'criteria.importance AS criteria_importance',
            'criteria.subProject AS criteria_sub_project',
            'criteria.createdAt AS criteria_created_at',
        ])
            .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
            .andWhere('criteria.deletedAt IS NULL')
            .orderBy('criteria.createdAt', 'ASC')
            .getRawMany();
        for (const row of criteriaRows) {
            const wbsId = row.criteria_wbs_item_id;
            if (!wbsId)
                continue;
            if (!criteriaMap.has(wbsId)) {
                criteriaMap.set(wbsId, []);
            }
            criteriaMap.get(wbsId).push({
                criterionId: row.criteria_id,
                criteria: row.criteria_criteria || '',
                importance: row.criteria_importance || 5,
                subProject: row.criteria_sub_project || null,
                createdAt: row.criteria_created_at,
            });
        }
    }
    const performanceMap = new Map();
    const subProjectMap = new Map();
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
            if (!wbsId)
                continue;
            const performance = {
                performanceResult: row.evaluation_performance_result,
                score: row.evaluation_self_evaluation_score !== null &&
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
    const primaryEvaluatorMap = new Map();
    const secondaryEvaluatorMap = new Map();
    const primaryEvaluatorMapping = await evaluationLineMappingRepository
        .createQueryBuilder('mapping')
        .select([
        'mapping.evaluatorId AS mapping_evaluator_id',
        'evaluator.name AS evaluator_name',
    ])
        .leftJoin(employee_entity_1.Employee, 'evaluator', '(evaluator.id = mapping.evaluatorId OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL')
        .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
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
        wbsItemIds.forEach((wbsId) => {
            primaryEvaluatorMap.set(wbsId, {
                evaluatorId,
                evaluatorName: primaryEvaluatorMapping.evaluator_name || '',
            });
        });
    }
    else if (wbsItemIds.length > 0) {
        const wbsPrimaryEvaluatorMappings = await evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .select([
            'mapping.wbsItemId AS mapping_wbs_item_id',
            'mapping.evaluatorId AS mapping_evaluator_id',
            'evaluator.name AS evaluator_name',
        ])
            .leftJoin(employee_entity_1.Employee, 'evaluator', '(evaluator.id = mapping.evaluatorId OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL')
            .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
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
            if (!wbsId || !row.mapping_evaluator_id)
                continue;
            primaryEvaluatorMap.set(wbsId, {
                evaluatorId: row.mapping_evaluator_id,
                evaluatorName: row.evaluator_name || '',
            });
        }
    }
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
            .leftJoin(employee_entity_1.Employee, 'evaluator', '(evaluator.id = mapping.evaluatorId OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL')
            .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
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
            if (!wbsId || !row.mapping_evaluator_id)
                continue;
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
    const downwardEvaluationMap = new Map();
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
        const allEvaluatorIds = new Set();
        for (const row of downwardEvaluationRows) {
            const evaluatorId = row.downward_evaluator_id;
            if (evaluatorId) {
                allEvaluatorIds.add(evaluatorId);
            }
        }
        const evaluatorNameMap = new Map();
        if (allEvaluatorIds.size > 0) {
            const evaluators = await employeeRepository
                .createQueryBuilder('employee')
                .select(['employee.id AS employee_id', 'employee.name AS employee_name'])
                .where('employee.id IN (:...ids)', {
                ids: Array.from(allEvaluatorIds),
            })
                .andWhere('employee.deletedAt IS NULL')
                .getRawMany();
            for (const emp of evaluators) {
                evaluatorNameMap.set(emp.employee_id, emp.employee_name);
            }
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
        for (const row of downwardEvaluationRows) {
            const wbsId = row.downward_wbs_id;
            if (!wbsId)
                continue;
            if (!downwardEvaluationMap.has(wbsId)) {
                downwardEvaluationMap.set(wbsId, {
                    primary: null,
                    secondary: null,
                });
            }
            const evalData = downwardEvaluationMap.get(wbsId);
            const primaryEvaluator = primaryEvaluatorMap.get(wbsId);
            const secondaryEvaluator = secondaryEvaluatorMap.get(wbsId);
            let evaluationContent = typeof row.downward_evaluation_content === 'string'
                ? row.downward_evaluation_content
                : row.downward_evaluation_content
                    ? JSON.stringify(row.downward_evaluation_content)
                    : undefined;
            if (row.downward_is_completed && !evaluationContent?.trim()) {
                const actualEvaluatorId = row.downward_evaluator_id;
                const actualEvaluatorName = actualEvaluatorId
                    ? evaluatorNameMap.get(actualEvaluatorId) || '평가자'
                    : '평가자';
                evaluationContent = `${actualEvaluatorName}님이 미입력 상태에서 제출하였습니다.`;
            }
            const score = typeof row.downward_score === 'number'
                ? row.downward_score
                : row.downward_score !== null && row.downward_score !== undefined
                    ? parseFloat(String(row.downward_score)) || undefined
                    : undefined;
            const submittedAt = row.downward_completed_at instanceof Date
                ? row.downward_completed_at
                : row.downward_completed_at
                    ? new Date(row.downward_completed_at)
                    : undefined;
            const actualEvaluatorId = row.downward_evaluator_id;
            const actualEvaluatorName = actualEvaluatorId
                ? evaluatorNameMap.get(actualEvaluatorId) || undefined
                : undefined;
            if (row.downward_evaluation_type === 'primary') {
                evalData.primary = {
                    evaluatorId: primaryEvaluator?.evaluatorId || actualEvaluatorId || undefined,
                    evaluatorName: primaryEvaluator?.evaluatorName ||
                        actualEvaluatorName ||
                        '알 수 없음',
                    evaluationContent,
                    score,
                    isCompleted: row.downward_is_completed || false,
                    submittedAt,
                };
            }
            else if (row.downward_evaluation_type === 'secondary') {
                evalData.secondary = {
                    evaluatorId: secondaryEvaluator?.evaluatorId || actualEvaluatorId || undefined,
                    evaluatorName: secondaryEvaluator?.evaluatorName ||
                        actualEvaluatorName ||
                        '알 수 없음',
                    evaluationContent,
                    score,
                    isCompleted: row.downward_is_completed || false,
                    submittedAt,
                };
            }
        }
        for (const wbsId of wbsItemIds) {
            if (!downwardEvaluationMap.has(wbsId)) {
                downwardEvaluationMap.set(wbsId, {
                    primary: null,
                    secondary: null,
                });
            }
            const evalData = downwardEvaluationMap.get(wbsId);
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
    const deliverablesMap = new Map();
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
            if (!wbsId)
                continue;
            if (!deliverablesMap.has(wbsId)) {
                deliverablesMap.set(wbsId, []);
            }
            deliverablesMap.get(wbsId).push({
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
    const projectsWithWbs = [];
    for (const row of projectAssignments) {
        const projectId = row.assignment_project_id || row.project_id;
        if (!projectId) {
            logger.warn('프로젝트 ID가 없는 할당 발견', { row });
            continue;
        }
        if (!row.project_name) {
            logger.debug('소프트 딜리트된 프로젝트 제외', { projectId });
            continue;
        }
        const projectManager = row.manager_id && row.manager_name
            ? {
                id: row.manager_id,
                name: row.manager_name,
            }
            : null;
        const projectWbsAssignments = wbsAssignments.filter((wbsRow) => (wbsRow.assignment_project_id || wbsRow.wbs_item_project_id) ===
            projectId);
        const wbsList = [];
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
            let secondaryEval = downwardEvalData.secondary;
            if (secondaryEval) {
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
            }
            else if (projectManager) {
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
//# sourceMappingURL=project-wbs.utils.js.map