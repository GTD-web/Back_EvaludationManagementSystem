"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.하향평가_통합_상태를_계산한다 = 하향평가_통합_상태를_계산한다;
exports.이차평가_전체_상태를_계산한다 = 이차평가_전체_상태를_계산한다;
exports.하향평가_상태를_조회한다 = 하향평가_상태를_조회한다;
exports.평가자별_하향평가_상태를_조회한다 = 평가자별_하향평가_상태를_조회한다;
exports.특정_평가자의_하향평가_상태를_조회한다 = 특정_평가자의_하향평가_상태를_조회한다;
const typeorm_1 = require("typeorm");
const evaluation_line_entity_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
const downward_evaluation_score_utils_1 = require("./downward-evaluation-score.utils");
function 하향평가_통합_상태를_계산한다(downwardStatus, approvalStatus, evaluationType) {
    if (approvalStatus === 'revision_requested') {
        return 'revision_requested';
    }
    if (approvalStatus === 'revision_completed') {
        return 'revision_completed';
    }
    if (approvalStatus === 'approved') {
        return 'approved';
    }
    if (downwardStatus === 'none') {
        return 'none';
    }
    if (downwardStatus === 'in_progress') {
        return 'in_progress';
    }
    return approvalStatus || 'pending';
}
function 이차평가_전체_상태를_계산한다(evaluatorStatuses) {
    if (evaluatorStatuses.length === 0 ||
        evaluatorStatuses.every((s) => s === 'none')) {
        return 'none';
    }
    if (evaluatorStatuses.some((s) => s === 'revision_completed')) {
        return 'revision_completed';
    }
    if (evaluatorStatuses.some((s) => s === 'revision_requested')) {
        return 'revision_requested';
    }
    if (evaluatorStatuses.some((s) => s === 'pending')) {
        return 'pending';
    }
    const hasInProgress = evaluatorStatuses.some((s) => s === 'in_progress' || s === 'complete');
    if (hasInProgress &&
        evaluatorStatuses.some((s) => s === 'none' || s === 'in_progress')) {
        return 'in_progress';
    }
    const allCompleteOrAbove = evaluatorStatuses.every((s) => s === 'complete' || s === 'pending' || s === 'approved');
    if (allCompleteOrAbove) {
        if (evaluatorStatuses.every((s) => s === 'pending')) {
            return 'pending';
        }
        if (evaluatorStatuses.every((s) => s === 'approved')) {
            return 'approved';
        }
        if (evaluatorStatuses.some((s) => s === 'pending')) {
            return 'pending';
        }
        return 'in_progress';
    }
    return 'in_progress';
}
async function 하향평가_상태를_조회한다(evaluationPeriodId, employeeId, evaluationLineRepository, evaluationLineMappingRepository, downwardEvaluationRepository, wbsAssignmentRepository, periodRepository, employeeRepository, secondaryStepApprovalRepository, mappingRepository) {
    const primaryLine = await evaluationLineRepository.findOne({
        where: {
            evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const primaryEvaluators = [];
    if (primaryLine) {
        let primaryMappings = await evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.evaluationLineId = :lineId', {
            lineId: primaryLine.id,
        })
            .andWhere('mapping.wbsItemId IS NULL')
            .andWhere('mapping.deletedAt IS NULL')
            .orderBy('mapping.createdAt', 'ASC')
            .getMany();
        if (primaryMappings.length === 0) {
            primaryMappings = await evaluationLineMappingRepository
                .createQueryBuilder('mapping')
                .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('mapping.employeeId = :employeeId', { employeeId })
                .andWhere('mapping.evaluationLineId = :lineId', {
                lineId: primaryLine.id,
            })
                .andWhere('mapping.wbsItemId IS NOT NULL')
                .andWhere('mapping.deletedAt IS NULL')
                .orderBy('mapping.createdAt', 'ASC')
                .getMany();
        }
        const uniqueEvaluatorIds = [
            ...new Set(primaryMappings.map((m) => m.evaluatorId).filter((id) => !!id)),
        ];
        primaryEvaluators.push(...uniqueEvaluatorIds);
    }
    const primaryEvaluatorId = primaryEvaluators.length > 0 ? primaryEvaluators[0] : null;
    const primaryStatus = await 평가자별_하향평가_상태를_조회한다(evaluationPeriodId, employeeId, downward_evaluation_types_1.DownwardEvaluationType.PRIMARY, null, downwardEvaluationRepository, wbsAssignmentRepository);
    let primaryEvaluatorInfo = null;
    if (primaryEvaluatorId && employeeRepository) {
        const evaluator = await employeeRepository
            .createQueryBuilder('employee')
            .where('(employee.id::text = :evaluatorId OR employee.externalId = :evaluatorId)', {
            evaluatorId: primaryEvaluatorId,
        })
            .andWhere('employee.deletedAt IS NULL')
            .select([
            'employee.id',
            'employee.name',
            'employee.employeeNumber',
            'employee.email',
            'employee.departmentName',
            'employee.rankName',
        ])
            .getOne();
        if (evaluator) {
            primaryEvaluatorInfo = {
                id: evaluator.id,
                name: evaluator.name,
                employeeNumber: evaluator.employeeNumber,
                email: evaluator.email,
                departmentName: evaluator.departmentName || undefined,
                rankName: evaluator.rankName || undefined,
            };
        }
    }
    const secondaryLine = await evaluationLineRepository.findOne({
        where: {
            evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
            deletedAt: (0, typeorm_1.IsNull)(),
        },
    });
    const secondaryEvaluators = [];
    if (secondaryLine) {
        const secondaryMappings = await evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.evaluationLineId = :lineId', {
            lineId: secondaryLine.id,
        })
            .andWhere('mapping.deletedAt IS NULL')
            .orderBy('mapping.createdAt', 'ASC')
            .getMany();
        const uniqueEvaluatorIds = [
            ...new Set(secondaryMappings.map((m) => m.evaluatorId).filter((id) => !!id)),
        ];
        secondaryEvaluators.push(...uniqueEvaluatorIds);
    }
    const secondaryStatuses = await Promise.all(secondaryEvaluators.map(async (evaluatorId) => {
        const status = await 특정_평가자의_하향평가_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorId, downward_evaluation_types_1.DownwardEvaluationType.SECONDARY, downwardEvaluationRepository, wbsAssignmentRepository, evaluationLineMappingRepository, evaluationLineRepository);
        let evaluatorInfo = null;
        if (employeeRepository) {
            const evaluator = await employeeRepository
                .createQueryBuilder('employee')
                .where('(employee.id::text = :evaluatorId OR employee.externalId = :evaluatorId)', {
                evaluatorId,
            })
                .andWhere('employee.deletedAt IS NULL')
                .select([
                'employee.id',
                'employee.name',
                'employee.employeeNumber',
                'employee.email',
                'employee.departmentName',
                'employee.rankName',
            ])
                .getOne();
            if (evaluator) {
                evaluatorInfo = {
                    id: evaluator.id,
                    name: evaluator.name,
                    employeeNumber: evaluator.employeeNumber,
                    email: evaluator.email,
                    departmentName: evaluator.departmentName || undefined,
                    rankName: evaluator.rankName || undefined,
                };
            }
        }
        const isSubmitted = status.isSubmitted;
        return {
            evaluator: evaluatorInfo || {
                id: evaluatorId,
                name: '알 수 없음',
                employeeNumber: 'N/A',
                email: 'N/A',
                departmentName: undefined,
                rankName: undefined,
            },
            status: status.status,
            assignedWbsCount: status.assignedWbsCount,
            completedEvaluationCount: status.completedEvaluationCount,
            isSubmitted,
        };
    }));
    const filteredSecondaryStatuses = secondaryStatuses.filter((status) => status.assignedWbsCount > 0);
    let secondaryTotalScore = null;
    let secondaryGrade = null;
    const allSecondaryEvaluationsCompleted = filteredSecondaryStatuses.every((status) => status.assignedWbsCount > 0 &&
        status.completedEvaluationCount >= status.assignedWbsCount);
    const allSecondaryEvaluationsSubmitted = filteredSecondaryStatuses.every((status) => status.isSubmitted);
    if (filteredSecondaryStatuses.length > 0 &&
        allSecondaryEvaluationsCompleted &&
        allSecondaryEvaluationsSubmitted) {
        secondaryTotalScore = await (0, downward_evaluation_score_utils_1.가중치_기반_2차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, secondaryEvaluators, downwardEvaluationRepository, wbsAssignmentRepository, periodRepository);
        if (secondaryTotalScore !== null) {
            secondaryGrade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, secondaryTotalScore, periodRepository);
        }
    }
    let primaryTotalScore = null;
    let primaryGrade = null;
    if (primaryStatus.assignedWbsCount > 0 &&
        primaryStatus.completedEvaluationCount === primaryStatus.assignedWbsCount) {
        primaryTotalScore = await (0, downward_evaluation_score_utils_1.가중치_기반_1차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, primaryEvaluators, downwardEvaluationRepository, wbsAssignmentRepository, periodRepository);
        if (primaryTotalScore !== null) {
            primaryGrade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, primaryTotalScore, periodRepository);
        }
    }
    const secondaryIsSubmitted = filteredSecondaryStatuses.length > 0 &&
        filteredSecondaryStatuses.every((status) => status.isSubmitted);
    return {
        primary: {
            evaluator: primaryEvaluatorInfo,
            status: primaryStatus.status,
            assignedWbsCount: primaryStatus.assignedWbsCount,
            completedEvaluationCount: primaryStatus.completedEvaluationCount,
            isSubmitted: primaryStatus.isSubmitted,
            totalScore: primaryTotalScore,
            grade: primaryGrade,
        },
        secondary: {
            evaluators: filteredSecondaryStatuses,
            isSubmitted: secondaryIsSubmitted,
            totalScore: secondaryTotalScore,
            grade: secondaryGrade,
        },
    };
}
async function 평가자별_하향평가_상태를_조회한다(evaluationPeriodId, employeeId, evaluationType, evaluatorId, downwardEvaluationRepository, wbsAssignmentRepository) {
    const assignedWbsCount = await wbsAssignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = assignment.projectId AND projectAssignment.periodId = assignment.periodId AND projectAssignment.employeeId = assignment.employeeId AND projectAssignment.deletedAt IS NULL')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
        .where('assignment.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('assignment.employeeId = :employeeId', { employeeId })
        .andWhere('assignment.deletedAt IS NULL')
        .andWhere('project.id IS NOT NULL')
        .andWhere('projectAssignment.id IS NOT NULL')
        .getCount();
    let downwardEvaluationsQuery = downwardEvaluationRepository
        .createQueryBuilder('eval')
        .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = eval.wbsId AND wbs.deletedAt IS NULL')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
        .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = eval.periodId AND projectAssignment.employeeId = eval.employeeId AND projectAssignment.deletedAt IS NULL')
        .where('eval.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('eval.employeeId = :employeeId', { employeeId: employeeId })
        .andWhere('eval.evaluationType = :evaluationType', {
        evaluationType: evaluationType,
    })
        .andWhere('eval.deletedAt IS NULL')
        .andWhere('project.id IS NOT NULL')
        .andWhere('projectAssignment.id IS NOT NULL');
    if (evaluatorId) {
        downwardEvaluationsQuery = downwardEvaluationsQuery.andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId: evaluatorId });
    }
    const downwardEvaluations = await downwardEvaluationsQuery.getMany();
    const completedEvaluationCount = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가()).length;
    let averageScore = null;
    const completedEvaluations = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가() &&
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined);
    if (completedEvaluations.length > 0) {
        const totalScore = completedEvaluations.reduce((sum, evaluation) => sum + (evaluation.downwardEvaluationScore || 0), 0);
        averageScore = totalScore / completedEvaluations.length;
    }
    let status;
    if (assignedWbsCount === 0) {
        status = 'none';
    }
    else if (downwardEvaluations.length === 0) {
        status = 'none';
    }
    else if (completedEvaluationCount >= assignedWbsCount) {
        status = 'complete';
    }
    else if (completedEvaluationCount > 0 || downwardEvaluations.length > 0) {
        status = 'in_progress';
    }
    else {
        status = 'none';
    }
    const isSubmitted = assignedWbsCount > 0 &&
        completedEvaluationCount >= assignedWbsCount &&
        completedEvaluationCount > 0;
    return {
        status,
        assignedWbsCount,
        completedEvaluationCount,
        isSubmitted,
        averageScore,
    };
}
async function 특정_평가자의_하향평가_상태를_조회한다(evaluationPeriodId, employeeId, evaluatorId, evaluationType, downwardEvaluationRepository, wbsAssignmentRepository, evaluationLineMappingRepository, evaluationLineRepository) {
    let assignedWbsCount;
    if (evaluationType === downward_evaluation_types_1.DownwardEvaluationType.SECONDARY) {
        if (!evaluationLineMappingRepository || !evaluationLineRepository) {
            throw new Error('evaluationLineMappingRepository와 evaluationLineRepository가 필요합니다.');
        }
        const secondaryLine = await evaluationLineRepository.findOne({
            where: {
                evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        if (!secondaryLine) {
            assignedWbsCount = 0;
        }
        else {
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
            assignedWbsCount = assignedMappings.length;
        }
    }
    else {
        assignedWbsCount = await wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = assignment.projectId AND projectAssignment.periodId = assignment.periodId AND projectAssignment.employeeId = assignment.employeeId AND projectAssignment.deletedAt IS NULL')
            .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
            .where('assignment.periodId = :periodId', { periodId: evaluationPeriodId })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.deletedAt IS NULL')
            .andWhere('project.id IS NOT NULL')
            .andWhere('projectAssignment.id IS NOT NULL')
            .getCount();
    }
    const downwardEvaluations = await downwardEvaluationRepository
        .createQueryBuilder('eval')
        .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = eval.wbsId AND wbs.deletedAt IS NULL')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
        .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = eval.periodId AND projectAssignment.employeeId = eval.employeeId AND projectAssignment.deletedAt IS NULL')
        .where('eval.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('eval.employeeId = :employeeId', { employeeId: employeeId })
        .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId: evaluatorId })
        .andWhere('eval.evaluationType = :evaluationType', {
        evaluationType: evaluationType,
    })
        .andWhere('eval.deletedAt IS NULL')
        .andWhere('project.id IS NOT NULL')
        .andWhere('projectAssignment.id IS NOT NULL')
        .getMany();
    const completedEvaluationCount = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가()).length;
    let averageScore = null;
    const completedEvaluations = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가() &&
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined);
    if (completedEvaluations.length > 0) {
        const totalScore = completedEvaluations.reduce((sum, evaluation) => sum + (evaluation.downwardEvaluationScore || 0), 0);
        averageScore = totalScore / completedEvaluations.length;
    }
    let status;
    if (assignedWbsCount === 0) {
        status = 'none';
    }
    else if (downwardEvaluations.length === 0) {
        status = 'none';
    }
    else if (completedEvaluationCount >= assignedWbsCount) {
        status = 'complete';
    }
    else if (completedEvaluationCount > 0 || downwardEvaluations.length > 0) {
        status = 'in_progress';
    }
    else {
        status = 'none';
    }
    const isSubmitted = assignedWbsCount > 0 &&
        completedEvaluationCount >= assignedWbsCount &&
        completedEvaluationCount > 0;
    return {
        status,
        assignedWbsCount,
        completedEvaluationCount,
        isSubmitted,
        averageScore,
    };
}
//# sourceMappingURL=downward-evaluation.utils.js.map