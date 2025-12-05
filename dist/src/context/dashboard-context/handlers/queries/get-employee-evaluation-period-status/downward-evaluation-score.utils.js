"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.가중치_기반_1차_하향평가_점수를_계산한다 = 가중치_기반_1차_하향평가_점수를_계산한다;
exports.가중치_기반_2차_하향평가_점수를_계산한다 = 가중치_기반_2차_하향평가_점수를_계산한다;
exports.하향평가_등급을_조회한다 = 하향평가_등급을_조회한다;
const typeorm_1 = require("typeorm");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
const logger = { log: () => { }, warn: () => { }, error: () => { }, debug: () => { } };
async function 가중치_기반_1차_하향평가_점수를_계산한다(evaluationPeriodId, employeeId, evaluatorIds, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository) {
    try {
        if (!evaluatorIds || evaluatorIds.length === 0) {
            logger.warn(`1차 평가자가 지정되지 않았습니다. (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`);
            return null;
        }
        const downwardEvaluations = await downwardEvaluationRepository.find({
            where: {
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                evaluatorId: (0, typeorm_1.In)(evaluatorIds),
                evaluationType: downward_evaluation_types_1.DownwardEvaluationType.PRIMARY,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        const completedEvaluations = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가() &&
            evaluation.downwardEvaluationScore !== null &&
            evaluation.downwardEvaluationScore !== undefined);
        if (completedEvaluations.length === 0) {
            return null;
        }
        const wbsIds = completedEvaluations.map((de) => de.wbsId);
        logger.log(`[DEBUG] 1차 하향평가 - 완료된 평가 WBS IDs: ${wbsIds.join(', ')} (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`);
        const wbsAssignments = await wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = assignment.projectId AND projectAssignment.periodId = assignment.periodId AND projectAssignment.employeeId = assignment.employeeId AND projectAssignment.deletedAt IS NULL')
            .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
            .where('assignment.periodId = :periodId', {
            periodId: evaluationPeriodId,
        })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.wbsItemId IN (:...wbsIds)', { wbsIds })
            .andWhere('assignment.deletedAt IS NULL')
            .andWhere('project.id IS NOT NULL')
            .andWhere('projectAssignment.id IS NOT NULL')
            .getMany();
        logger.log(`[DEBUG] 1차 하향평가 - 조회된 WBS 할당 수: ${wbsAssignments.length}, WBS IDs: ${wbsAssignments.map((a) => `${a.wbsItemId}(가중치:${a.weight}%)`).join(', ')}`);
        const evaluationPeriod = await evaluationPeriodRepository.findOne({
            where: { id: evaluationPeriodId },
        });
        const maxRate = evaluationPeriod?.maxSelfEvaluationRate || 100;
        const weightMap = new Map();
        wbsAssignments.forEach((assignment) => {
            weightMap.set(assignment.wbsItemId, assignment.weight);
        });
        const validEvaluations = completedEvaluations.filter((evaluation) => weightMap.has(evaluation.wbsId));
        logger.log(`[DEBUG] 1차 하향평가 - 필터링 결과: 전체 평가 ${completedEvaluations.length}개 중 유효한 평가 ${validEvaluations.length}개`);
        if (validEvaluations.length === 0) {
            logger.warn(`모든 평가가 취소된 프로젝트 할당에 속해 있습니다. (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`);
            return null;
        }
        let totalWeightedScore = 0;
        let totalWeight = 0;
        validEvaluations.forEach((evaluation) => {
            const weight = weightMap.get(evaluation.wbsId);
            const score = evaluation.downwardEvaluationScore || 0;
            logger.log(`[DEBUG] 1차 하향평가 - WBS ${evaluation.wbsId}: 점수=${score}, 가중치=${weight}%, 가중 점수=${((weight / 100) * score).toFixed(2)}`);
            totalWeightedScore += (weight / 100) * score;
            totalWeight += weight;
        });
        logger.log(`[DEBUG] 1차 하향평가 - 총 가중 점수: ${totalWeightedScore.toFixed(2)}, 총 가중치: ${totalWeight}%`);
        if (totalWeight === 0) {
            logger.warn(`가중치 합이 0입니다. 점수 계산 불가 (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`);
            return null;
        }
        const finalScore = totalWeight !== 100
            ? totalWeightedScore * (100 / totalWeight)
            : totalWeightedScore;
        logger.log(`가중치 기반 1차 하향평가 점수 계산 완료: ${finalScore.toFixed(2)} (원본: ${totalWeightedScore.toFixed(2)}, 가중치 합: ${totalWeight}%, 최대값: ${maxRate}) (피평가자: ${employeeId}, 평가자: ${evaluatorIds.join(', ')}, 평가기간: ${evaluationPeriodId})`);
        return Math.round(finalScore * 100) / 100;
    }
    catch (error) {
        logger.error(`가중치 기반 1차 하향평가 점수 계산 실패: ${error.message}`, error.stack);
        return null;
    }
}
async function 가중치_기반_2차_하향평가_점수를_계산한다(evaluationPeriodId, employeeId, evaluatorIds, downwardEvaluationRepository, wbsAssignmentRepository, evaluationPeriodRepository) {
    try {
        if (evaluatorIds.length === 0) {
            logger.warn(`2차 평가자가 지정되지 않았습니다. (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`);
            return null;
        }
        const downwardEvaluations = await downwardEvaluationRepository.find({
            where: {
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                evaluatorId: (0, typeorm_1.In)(evaluatorIds),
                evaluationType: downward_evaluation_types_1.DownwardEvaluationType.SECONDARY,
                deletedAt: (0, typeorm_1.IsNull)(),
            },
        });
        const completedEvaluations = downwardEvaluations.filter((evaluation) => evaluation.완료되었는가() &&
            evaluation.downwardEvaluationScore !== null &&
            evaluation.downwardEvaluationScore !== undefined);
        if (completedEvaluations.length === 0) {
            return null;
        }
        const wbsIds = [...new Set(completedEvaluations.map((de) => de.wbsId))];
        const wbsAssignments = await wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .leftJoin(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, 'projectAssignment', 'projectAssignment.projectId = assignment.projectId AND projectAssignment.periodId = assignment.periodId AND projectAssignment.employeeId = assignment.employeeId AND projectAssignment.deletedAt IS NULL')
            .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
            .where('assignment.periodId = :periodId', {
            periodId: evaluationPeriodId,
        })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.wbsItemId IN (:...wbsIds)', { wbsIds })
            .andWhere('assignment.deletedAt IS NULL')
            .andWhere('project.id IS NOT NULL')
            .andWhere('projectAssignment.id IS NOT NULL')
            .getMany();
        const evaluationPeriod = await evaluationPeriodRepository.findOne({
            where: { id: evaluationPeriodId },
        });
        const maxRate = evaluationPeriod?.maxSelfEvaluationRate || 100;
        const weightMap = new Map();
        wbsAssignments.forEach((assignment) => {
            weightMap.set(assignment.wbsItemId, assignment.weight);
        });
        const validEvaluations = completedEvaluations.filter((evaluation) => weightMap.has(evaluation.wbsId));
        if (validEvaluations.length === 0) {
            logger.warn(`모든 평가가 취소된 프로젝트 할당에 속해 있습니다. (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`);
            return null;
        }
        const wbsScoresMap = new Map();
        validEvaluations.forEach((evaluation) => {
            if (!wbsScoresMap.has(evaluation.wbsId)) {
                wbsScoresMap.set(evaluation.wbsId, []);
            }
            wbsScoresMap
                .get(evaluation.wbsId)
                .push(evaluation.downwardEvaluationScore || 0);
        });
        let totalWeightedScore = 0;
        let totalWeight = 0;
        wbsScoresMap.forEach((scores, wbsId) => {
            const weight = weightMap.get(wbsId);
            const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            totalWeightedScore += (weight / 100) * averageScore;
            totalWeight += weight;
        });
        if (totalWeight === 0) {
            logger.warn(`가중치 합이 0입니다. 점수 계산 불가 (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`);
            return null;
        }
        const finalScore = totalWeight !== 100
            ? totalWeightedScore * (100 / totalWeight)
            : totalWeightedScore;
        logger.log(`가중치 기반 2차 하향평가 점수 계산 완료: ${finalScore.toFixed(2)} (원본: ${totalWeightedScore.toFixed(2)}, 가중치 합: ${totalWeight}%, 최대값: ${maxRate}) (피평가자: ${employeeId}, 평가자 수: ${evaluatorIds.length}, 평가기간: ${evaluationPeriodId})`);
        return Math.round(finalScore * 100) / 100;
    }
    catch (error) {
        logger.error(`가중치 기반 2차 하향평가 점수 계산 실패: ${error.message}`, error.stack);
        return null;
    }
}
async function 하향평가_등급을_조회한다(evaluationPeriodId, totalScore, periodRepository) {
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
        logger.log(`✅ 하향평가 등급 조회 완료: ${gradeMapping.finalGrade} (점수: ${totalScore}, 평가기간: ${period.name})`);
        return gradeMapping.finalGrade;
    }
    catch (error) {
        logger.error(`하향평가 등급 조회 실패: ${error.message}`, error.stack);
        return null;
    }
}
//# sourceMappingURL=downward-evaluation-score.utils.js.map