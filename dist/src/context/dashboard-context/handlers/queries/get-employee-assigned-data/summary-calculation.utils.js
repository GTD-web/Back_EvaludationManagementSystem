"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSelfEvaluationScore = calculateSelfEvaluationScore;
exports.calculatePrimaryDownwardEvaluationScore = calculatePrimaryDownwardEvaluationScore;
exports.calculateSecondaryDownwardEvaluationScore = calculateSecondaryDownwardEvaluationScore;
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_line_entity_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
const self_evaluation_utils_1 = require("../get-employee-evaluation-period-status/self-evaluation.utils");
const downward_evaluation_score_utils_1 = require("../get-employee-evaluation-period-status/downward-evaluation-score.utils");
async function calculateSelfEvaluationScore(evaluationPeriodId, employeeId, completedSelfEvaluations, selfEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository) {
    let selfEvaluationScore = null;
    let selfEvaluationGrade = null;
    const totalSelfEvaluations = await selfEvaluationRepository
        .createQueryBuilder('self_eval')
        .leftJoin('evaluation_wbs_assignments', 'wbs_assignment', 'wbs_assignment.wbsItemId = self_eval.wbsItemId AND wbs_assignment.periodId = self_eval.periodId AND wbs_assignment.employeeId = self_eval.employeeId AND wbs_assignment.deletedAt IS NULL')
        .leftJoin('evaluation_project_assignments', 'project_assignment', 'project_assignment.projectId = wbs_assignment.projectId AND project_assignment.periodId = wbs_assignment.periodId AND project_assignment.employeeId = wbs_assignment.employeeId AND project_assignment.deletedAt IS NULL')
        .where('self_eval.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('self_eval.employeeId = :employeeId', { employeeId })
        .andWhere('self_eval.deletedAt IS NULL')
        .andWhere('project_assignment.id IS NOT NULL')
        .getCount();
    if (totalSelfEvaluations > 0 &&
        completedSelfEvaluations === totalSelfEvaluations) {
        selfEvaluationScore = await (0, self_evaluation_utils_1.가중치_기반_자기평가_점수를_계산한다)(evaluationPeriodId, employeeId, selfEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository);
        if (selfEvaluationScore !== null) {
            selfEvaluationGrade = await (0, self_evaluation_utils_1.자기평가_등급을_조회한다)(evaluationPeriodId, selfEvaluationScore, evaluationPeriodRepository);
        }
    }
    return {
        totalScore: selfEvaluationScore,
        grade: selfEvaluationGrade,
    };
}
async function calculatePrimaryDownwardEvaluationScore(evaluationPeriodId, employeeId, evaluationLineMappingRepository, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository) {
    let primaryDownwardScore = null;
    let primaryDownwardGrade = null;
    let primaryEvaluatorMappings = await evaluationLineMappingRepository
        .createQueryBuilder('mapping')
        .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
    })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('mapping.wbsItemId IS NULL')
        .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
    })
        .andWhere('mapping.deletedAt IS NULL')
        .getMany();
    if (primaryEvaluatorMappings.length === 0) {
        primaryEvaluatorMappings = await evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.wbsItemId IS NOT NULL')
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
        })
            .andWhere('mapping.deletedAt IS NULL')
            .getMany();
    }
    if (primaryEvaluatorMappings && primaryEvaluatorMappings.length > 0) {
        const primaryEvaluatorIds = [
            ...new Set(primaryEvaluatorMappings.map((m) => m.evaluatorId).filter((id) => !!id)),
        ];
        const primaryEvaluatorId = primaryEvaluatorIds[0];
        const primaryAssignedWbs = await wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .select(['assignment.wbsItemId AS wbs_item_id'])
            .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = assignment.projectId AND projectAssignment.periodId = assignment.periodId AND projectAssignment.employeeId = assignment.employeeId AND projectAssignment.deletedAt IS NULL')
            .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
            .where('assignment.periodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.deletedAt IS NULL')
            .andWhere('project.id IS NOT NULL')
            .andWhere('projectAssignment.id IS NOT NULL')
            .getRawMany();
        const primaryAssignedCount = primaryAssignedWbs.length;
        const primaryAssignedWbsIds = primaryAssignedWbs.map((w) => w.wbs_item_id);
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
                evaluationType: downward_evaluation_types_1.DownwardEvaluationType.PRIMARY,
            })
                .andWhere('eval.isCompleted = :isCompleted', {
                isCompleted: true,
            })
                .andWhere('eval.deletedAt IS NULL')
                .getCount();
        }
        if (primaryAssignedCount > 0 &&
            primaryCompletedCount === primaryAssignedCount) {
            primaryDownwardScore = await (0, downward_evaluation_score_utils_1.가중치_기반_1차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, primaryEvaluatorIds, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository);
            if (primaryDownwardScore !== null) {
                primaryDownwardGrade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, primaryDownwardScore, evaluationPeriodRepository);
            }
        }
        const primaryIsSubmitted = primaryAssignedCount > 0 &&
            primaryCompletedCount === primaryAssignedCount &&
            primaryCompletedCount > 0;
        return {
            totalScore: primaryDownwardScore,
            grade: primaryDownwardGrade,
            isSubmitted: primaryIsSubmitted,
        };
    }
    return {
        totalScore: null,
        grade: null,
        isSubmitted: false,
    };
}
async function calculateSecondaryDownwardEvaluationScore(evaluationPeriodId, employeeId, evaluationLineMappingRepository, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository, employeeRepository) {
    let secondaryDownwardScore = null;
    let secondaryDownwardGrade = null;
    const secondaryEvaluatorMappings = await evaluationLineMappingRepository
        .createQueryBuilder('mapping')
        .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
        .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
        evaluationPeriodId,
    })
        .andWhere('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
    })
        .andWhere('mapping.deletedAt IS NULL')
        .getMany();
    if (secondaryEvaluatorMappings.length > 0) {
        const secondaryEvaluatorIds = [
            ...new Set(secondaryEvaluatorMappings.map((m) => m.evaluatorId)),
        ];
        const evaluatorStats = await Promise.all(secondaryEvaluatorIds.map(async (evaluatorId) => {
            const assignedMappings = await evaluationLineMappingRepository
                .createQueryBuilder('mapping')
                .select(['mapping.id', 'mapping.wbsItemId'])
                .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
                .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = mapping.wbsItemId AND wbs.deletedAt IS NULL')
                .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
                .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = mapping.evaluationPeriodId AND projectAssignment.employeeId = mapping.employeeId AND projectAssignment.deletedAt IS NULL')
                .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('mapping.employeeId = :employeeId', { employeeId })
                .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
                .andWhere('line.evaluatorType = :evaluatorType', {
                evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
            })
                .andWhere('mapping.deletedAt IS NULL')
                .andWhere('mapping.wbsItemId IS NOT NULL')
                .andWhere('project.id IS NOT NULL')
                .andWhere('projectAssignment.id IS NOT NULL')
                .getRawMany();
            const assignedCount = assignedMappings.length;
            const assignedWbsIds = assignedMappings.map((m) => m.mapping_wbsItemId);
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
                    evaluationType: downward_evaluation_types_1.DownwardEvaluationType.SECONDARY,
                })
                    .andWhere('eval.isCompleted = :isCompleted', {
                    isCompleted: true,
                })
                    .andWhere('eval.deletedAt IS NULL')
                    .getCount();
            }
            return { evaluatorId, assignedCount, completedCount };
        }));
        const activeEvaluatorStats = evaluatorStats.filter((stat) => stat.assignedCount > 0);
        const allCompleted = activeEvaluatorStats.length > 0 &&
            activeEvaluatorStats.every((stat) => stat.completedCount === stat.assignedCount);
        if (allCompleted) {
            secondaryDownwardScore = await (0, downward_evaluation_score_utils_1.가중치_기반_2차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, secondaryEvaluatorIds, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository);
            if (secondaryDownwardScore !== null) {
                secondaryDownwardGrade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, secondaryDownwardScore, evaluationPeriodRepository);
            }
        }
        const secondaryIsSubmitted = activeEvaluatorStats.length > 0 &&
            activeEvaluatorStats.every((stat) => stat.completedCount === stat.assignedCount && stat.completedCount > 0);
        const evaluators = await Promise.all(activeEvaluatorStats.map(async (stat) => {
            let evaluatorName = '알 수 없음';
            let evaluatorEmployeeNumber = 'N/A';
            let evaluatorEmail = 'N/A';
            if (employeeRepository) {
                const evaluator = await employeeRepository
                    .createQueryBuilder('employee')
                    .where('(employee.id::text = :evaluatorId OR employee.externalId = :evaluatorId)', {
                    evaluatorId: stat.evaluatorId,
                })
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
            const evaluatorIsSubmitted = stat.assignedCount > 0 &&
                stat.completedCount === stat.assignedCount &&
                stat.completedCount > 0;
            return {
                evaluatorId: stat.evaluatorId,
                evaluatorName,
                evaluatorEmployeeNumber,
                evaluatorEmail,
                assignedWbsCount: stat.assignedCount,
                completedEvaluationCount: stat.completedCount,
                isSubmitted: evaluatorIsSubmitted,
            };
        }));
        return {
            totalScore: secondaryDownwardScore,
            grade: secondaryDownwardGrade,
            isSubmitted: secondaryIsSubmitted,
            evaluators,
        };
    }
    return {
        totalScore: null,
        grade: null,
        isSubmitted: false,
        evaluators: [],
    };
}
//# sourceMappingURL=summary-calculation.utils.js.map