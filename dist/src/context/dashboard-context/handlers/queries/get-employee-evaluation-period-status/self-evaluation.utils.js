"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.자기평가_진행_상태를_조회한다 = 자기평가_진행_상태를_조회한다;
exports.자기평가_상태를_계산한다 = 자기평가_상태를_계산한다;
exports.자기평가_통합_상태를_계산한다 = 자기평가_통합_상태를_계산한다;
exports.가중치_기반_자기평가_점수를_계산한다 = 가중치_기반_자기평가_점수를_계산한다;
exports.자기평가_등급을_조회한다 = 자기평가_등급을_조회한다;
const typeorm_1 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
const logger = {
    log: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { },
};
async function 자기평가_진행_상태를_조회한다(evaluationPeriodId, employeeId, wbsSelfEvaluationRepository, wbsAssignmentRepository, periodRepository) {
    const totalMappingCount = await wbsSelfEvaluationRepository
        .createQueryBuilder('evaluation')
        .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = evaluation.wbsItemId AND wbs.deletedAt IS NULL')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
        .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = evaluation.periodId AND projectAssignment.employeeId = evaluation.employeeId AND projectAssignment.deletedAt IS NULL')
        .where('evaluation.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('evaluation.employeeId = :employeeId', { employeeId })
        .andWhere('evaluation.deletedAt IS NULL')
        .andWhere('project.id IS NOT NULL')
        .andWhere('projectAssignment.id IS NOT NULL')
        .getCount();
    const completedMappingCount = await wbsSelfEvaluationRepository
        .createQueryBuilder('evaluation')
        .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = evaluation.wbsItemId AND wbs.deletedAt IS NULL')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
        .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = evaluation.periodId AND projectAssignment.employeeId = evaluation.employeeId AND projectAssignment.deletedAt IS NULL')
        .where('evaluation.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('evaluation.employeeId = :employeeId', { employeeId })
        .andWhere('evaluation.submittedToManager = :submittedToManager', {
        submittedToManager: true,
    })
        .andWhere('evaluation.deletedAt IS NULL')
        .andWhere('project.id IS NOT NULL')
        .andWhere('projectAssignment.id IS NOT NULL')
        .getCount();
    const submittedToEvaluatorCount = await wbsSelfEvaluationRepository
        .createQueryBuilder('evaluation')
        .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = evaluation.wbsItemId AND wbs.deletedAt IS NULL')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
        .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = evaluation.periodId AND projectAssignment.employeeId = evaluation.employeeId AND projectAssignment.deletedAt IS NULL')
        .where('evaluation.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('evaluation.employeeId = :employeeId', { employeeId })
        .andWhere('evaluation.submittedToEvaluator = :submittedToEvaluator', {
        submittedToEvaluator: true,
    })
        .andWhere('evaluation.deletedAt IS NULL')
        .andWhere('project.id IS NOT NULL')
        .andWhere('projectAssignment.id IS NOT NULL')
        .getCount();
    const isSubmittedToEvaluator = totalMappingCount > 0 && submittedToEvaluatorCount === totalMappingCount;
    const submittedToManagerCount = await wbsSelfEvaluationRepository
        .createQueryBuilder('evaluation')
        .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = evaluation.wbsItemId AND wbs.deletedAt IS NULL')
        .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
        .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = evaluation.periodId AND projectAssignment.employeeId = evaluation.employeeId AND projectAssignment.deletedAt IS NULL')
        .where('evaluation.periodId = :periodId', { periodId: evaluationPeriodId })
        .andWhere('evaluation.employeeId = :employeeId', { employeeId })
        .andWhere('evaluation.submittedToManager = :submittedToManager', {
        submittedToManager: true,
    })
        .andWhere('evaluation.deletedAt IS NULL')
        .andWhere('project.id IS NOT NULL')
        .andWhere('projectAssignment.id IS NOT NULL')
        .getCount();
    const isSubmittedToManager = totalMappingCount > 0 && submittedToManagerCount === totalMappingCount;
    let totalScore = null;
    let grade = null;
    if (totalMappingCount > 0 && completedMappingCount === totalMappingCount) {
        totalScore = await 가중치_기반_자기평가_점수를_계산한다(evaluationPeriodId, employeeId, wbsSelfEvaluationRepository, wbsAssignmentRepository, periodRepository);
        if (totalScore !== null) {
            grade = await 자기평가_등급을_조회한다(evaluationPeriodId, totalScore, periodRepository);
        }
    }
    return {
        totalMappingCount,
        completedMappingCount,
        submittedToEvaluatorCount,
        isSubmittedToEvaluator,
        submittedToManagerCount,
        isSubmittedToManager,
        totalScore,
        grade,
    };
}
function 자기평가_상태를_계산한다(totalMappingCount, completedMappingCount) {
    if (totalMappingCount === 0) {
        return 'none';
    }
    if (completedMappingCount === totalMappingCount) {
        return 'complete';
    }
    else {
        return 'in_progress';
    }
}
function 자기평가_통합_상태를_계산한다(selfEvaluationStatus, approvalStatus) {
    if (approvalStatus === 'revision_requested') {
        return 'revision_requested';
    }
    if (approvalStatus === 'revision_completed') {
        return 'revision_completed';
    }
    if (approvalStatus === 'approved') {
        return 'approved';
    }
    if (selfEvaluationStatus === 'none') {
        return 'none';
    }
    if (selfEvaluationStatus === 'in_progress') {
        return 'in_progress';
    }
    return approvalStatus;
}
async function 가중치_기반_자기평가_점수를_계산한다(evaluationPeriodId, employeeId, wbsSelfEvaluationRepository, wbsAssignmentRepository, periodRepository) {
    try {
        const period = await periodRepository.findOne({
            where: {
                id: evaluationPeriodId,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        if (!period) {
            logger.warn(`평가기간을 찾을 수 없습니다: ${evaluationPeriodId}`);
            return null;
        }
        const maxSelfEvaluationRate = period.maxSelfEvaluationRate;
        const selfEvaluations = await wbsSelfEvaluationRepository
            .createQueryBuilder('evaluation')
            .leftJoin(wbs_item_entity_1.WbsItem, 'wbs', 'wbs.id = evaluation.wbsItemId AND wbs.deletedAt IS NULL')
            .leftJoin(project_entity_1.Project, 'project', 'project.id = wbs.projectId AND project.deletedAt IS NULL')
            .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = wbs.projectId AND projectAssignment.periodId = evaluation.periodId AND projectAssignment.employeeId = evaluation.employeeId AND projectAssignment.deletedAt IS NULL')
            .where('evaluation.periodId = :periodId', {
            periodId: evaluationPeriodId,
        })
            .andWhere('evaluation.employeeId = :employeeId', { employeeId })
            .andWhere('evaluation.submittedToManager = :submittedToManager', {
            submittedToManager: true,
        })
            .andWhere('evaluation.deletedAt IS NULL')
            .andWhere('project.id IS NOT NULL')
            .andWhere('projectAssignment.id IS NOT NULL')
            .getMany();
        if (selfEvaluations.length === 0) {
            return null;
        }
        const wbsItemIds = selfEvaluations.map((se) => se.wbsItemId);
        logger.log(`[DEBUG] 자기평가 - 완료된 자기평가 WBS IDs: ${wbsItemIds.join(', ')} (평가기간: ${evaluationPeriodId}, 직원: ${employeeId})`);
        const wbsAssignments = await wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = assignment.projectId AND projectAssignment.periodId = assignment.periodId AND projectAssignment.employeeId = assignment.employeeId AND projectAssignment.deletedAt IS NULL')
            .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
            .where('assignment.periodId = :periodId', {
            periodId: evaluationPeriodId,
        })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
            .andWhere('assignment.deletedAt IS NULL')
            .andWhere('project.id IS NOT NULL')
            .andWhere('projectAssignment.id IS NOT NULL')
            .getMany();
        logger.log(`[DEBUG] 자기평가 - 조회된 WBS 할당 수: ${wbsAssignments.length}, WBS IDs: ${wbsAssignments.map((a) => `${a.wbsItemId}(가중치:${a.weight}%)`).join(', ')}`);
        const weightMap = new Map();
        wbsAssignments.forEach((assignment) => {
            weightMap.set(assignment.wbsItemId, assignment.weight);
        });
        const validEvaluations = selfEvaluations.filter((evaluation) => weightMap.has(evaluation.wbsItemId));
        logger.log(`[DEBUG] 자기평가 - 필터링 결과: 전체 자기평가 ${selfEvaluations.length}개 중 유효한 자기평가 ${validEvaluations.length}개`);
        if (validEvaluations.length === 0) {
            logger.warn(`모든 자기평가가 취소된 프로젝트 할당에 속해 있습니다. (평가기간: ${evaluationPeriodId}, 직원: ${employeeId})`);
            return null;
        }
        let totalWeightedScore = 0;
        let totalWeight = 0;
        validEvaluations.forEach((evaluation) => {
            const weight = weightMap.get(evaluation.wbsItemId);
            const score = evaluation.selfEvaluationScore || 0;
            logger.log(`[DEBUG] 자기평가 - WBS ${evaluation.wbsItemId}: 점수=${score}, 가중치=${weight}%, 가중 점수=${((weight / 100) * score).toFixed(2)}`);
            totalWeightedScore += (weight / 100) * score;
            totalWeight += weight;
        });
        logger.log(`[DEBUG] 자기평가 - 총 가중 점수: ${totalWeightedScore.toFixed(2)}, 총 가중치: ${totalWeight}%`);
        if (totalWeight === 0) {
            logger.warn(`가중치 합이 0입니다. 점수 계산 불가 (평가기간: ${evaluationPeriodId}, 직원: ${employeeId})`);
            return null;
        }
        const normalizedScore = totalWeight !== 100
            ? totalWeightedScore * (100 / totalWeight)
            : totalWeightedScore;
        const integerScore = Math.floor(normalizedScore);
        logger.log(`가중치 기반 자기평가 점수 계산 완료: ${integerScore} (원본: ${totalWeightedScore.toFixed(2)}, 정규화: ${normalizedScore.toFixed(2)}, 가중치 합: ${totalWeight}%, 최대값: ${maxSelfEvaluationRate}) (직원: ${employeeId}, 평가기간: ${evaluationPeriodId})`);
        return integerScore;
    }
    catch (error) {
        logger.error(`가중치 기반 자기평가 점수 계산 실패: ${error.message}`, error.stack);
        return null;
    }
}
async function 자기평가_등급을_조회한다(evaluationPeriodId, totalScore, periodRepository) {
    try {
        const period = await periodRepository.findOne({
            where: {
                id: evaluationPeriodId,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        if (!period) {
            logger.warn(`평가기간을 찾을 수 없습니다: ${evaluationPeriodId}`);
            return null;
        }
        if (!period.등급구간_설정됨()) {
            logger.warn(`⚠️ 평가기간에 등급 구간이 설정되지 않았습니다. 등급 범위를 설정해주세요. (평가기간: ${period.name} [${evaluationPeriodId}], gradeRanges: ${JSON.stringify(period.gradeRanges || [])})`);
            return null;
        }
        const gradeMapping = period.점수로_등급_조회한다(totalScore);
        if (!gradeMapping) {
            logger.warn(`⚠️ 점수에 해당하는 등급을 찾을 수 없습니다. 등급 범위를 확인해주세요. (점수: ${totalScore}, 평가기간: ${period.name} [${evaluationPeriodId}], gradeRanges: ${JSON.stringify(period.gradeRanges)})`);
            return null;
        }
        logger.log(`✅ 자기평가 등급 조회 완료: ${gradeMapping.finalGrade} (점수: ${totalScore}, 평가기간: ${period.name})`);
        return gradeMapping.finalGrade;
    }
    catch (error) {
        logger.error(`자기평가 등급 조회 실패: ${error.message}`, error.stack);
        return null;
    }
}
//# sourceMappingURL=self-evaluation.utils.js.map