import { Logger } from '@nestjs/common';
import { Repository, IsNull, In } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Project } from '@domain/common/project/project.entity';

const logger = new Logger('DownwardEvaluationScoreUtils');

/**
 * 가중치 기반 1차 하향평가 점수를 계산한다
 * 계산식: Σ(WBS 가중치 × 하향평가 점수)
 * 최대 점수: 평가기간의 maxSelfEvaluationRate
 * 하향평가 점수 범위: 0 ~ 평가기간의 최대 달성률
 *
 * @param evaluatorIds 현재 평가라인에 있는 평가자 ID 목록 (평가자 교체 시 현재 평가자만 점수 계산에 포함)
 */
export async function 가중치_기반_1차_하향평가_점수를_계산한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorIds: string[],
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
): Promise<number | null> {
  logger.log(
    `[1차 하향평가 점수 계산 시작] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자 수: ${evaluatorIds.length}`,
  );

  try {
    // 점수가 입력된 1차 평가 조회 (평가자 ID 조건 없이 모든 1차 평가 조회)
    // 평가자 매핑이 변경되었거나 삭제되어도 점수가 입력된 평가는 조회
    const downwardEvaluations = await downwardEvaluationRepository.find({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationType: DownwardEvaluationType.PRIMARY,
        deletedAt: IsNull(),
      },
    });

    logger.log(
      `[1차 하향평가 조회] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 전체 평가 수: ${downwardEvaluations.length}`,
    );

    // 점수가 입력된 평가만 필터링 (제출 여부와 무관)
    const completedEvaluations = downwardEvaluations.filter(
      (evaluation) =>
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined,
    );

    logger.log(
      `[1차 하향평가 필터링] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 점수 입력된 평가 수: ${completedEvaluations.length}`,
    );

    if (completedEvaluations.length === 0) {
      logger.log(
        `[1차 하향평가 점수 없음] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 점수가 입력된 평가가 없습니다.`,
      );
      return null;
    }

    // WBS 할당 정보 조회 (가중치 포함, 취소된 프로젝트 할당 제외)
    const wbsIds = completedEvaluations.map((de) => de.wbsId);

    logger.log(
      `[1차 하향평가 WBS 조회] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가된 WBS IDs: ${wbsIds.join(', ')}`,
    );

    const wbsAssignments = await wbsAssignmentRepository
      .createQueryBuilder('assignment')
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
      .where('assignment.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.wbsItemId IN (:...wbsIds)', { wbsIds })
      .andWhere('assignment.deletedAt IS NULL')
      .andWhere('project.id IS NOT NULL') // 프로젝트가 존재하는 경우만 조회
      .andWhere('projectAssignment.id IS NOT NULL') // 프로젝트 할당이 존재하는 경우만 조회
      .getMany();

    logger.log(
      `[1차 하향평가 WBS 할당 조회 결과] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 조회된 WBS 할당 수: ${wbsAssignments.length}, WBS별 가중치: ${wbsAssignments.map((a) => `${a.wbsItemId}(가중치:${a.weight}%)`).join(', ')}`,
    );

    // ⚠️ 문제 진단: 평가된 WBS 중 할당 정보가 없는 WBS 확인
    const evaluatedWbsSet = new Set(wbsIds);
    const assignedWbsSet = new Set(wbsAssignments.map((a) => a.wbsItemId));
    const missingWbsIds = wbsIds.filter((id) => !assignedWbsSet.has(id));
    if (missingWbsIds.length > 0) {
      logger.warn(
        `[1차 하향평가 경고] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 할당 정보가 없는 WBS IDs: ${missingWbsIds.join(', ')} (이 WBS의 평가는 제외됩니다)`,
      );
    }

    // 평가기간의 최대 달성률 조회
    const evaluationPeriod = await evaluationPeriodRepository.findOne({
      where: { id: evaluationPeriodId },
    });
    const maxRate = evaluationPeriod?.maxSelfEvaluationRate || 100;

    // WBS별 가중치 맵 생성
    const weightMap = new Map<string, number>();
    wbsAssignments.forEach((assignment) => {
      weightMap.set(assignment.wbsItemId, assignment.weight);
    });

    // 취소된 프로젝트 할당의 WBS 평가는 제외
    const validEvaluations = completedEvaluations.filter((evaluation) =>
      weightMap.has(evaluation.wbsId),
    );

    logger.log(
      `[1차 하향평가 유효성 필터링] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 전체 평가: ${completedEvaluations.length}개, 유효한 평가: ${validEvaluations.length}개`,
    );

    if (validEvaluations.length === 0) {
      logger.warn(
        `[1차 하향평가 계산 실패] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 모든 평가가 취소된 프로젝트 할당에 속해 있거나 할당 정보가 없습니다.`,
      );
      return null;
    }

    // 가중치 기반 점수 계산
    let totalWeightedScore = 0;
    let totalWeight = 0;

    logger.log(
      `[1차 하향평가 점수 계산 상세] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 최대 달성률: ${maxRate}`,
    );

    validEvaluations.forEach((evaluation) => {
      const weight = weightMap.get(evaluation.wbsId)!; // 이미 필터링했으므로 !로 단언
      const score = evaluation.downwardEvaluationScore || 0;

      // 가중치 적용: (weight / maxRate) × score
      const weightedScore = (weight / maxRate) * score;
      totalWeightedScore += weightedScore;
      totalWeight += weight;

      logger.log(
        `[1차 하향평가 계산 상세] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, WBS: ${evaluation.wbsId}, 점수: ${score}, 가중치: ${weight}%, 가중치 적용 점수: ${weightedScore.toFixed(2)}`,
      );
    });

    logger.log(
      `[1차 하향평가 가중치 합계] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 총 가중치 합: ${totalWeight}%, 최대값: ${maxRate}%, 원본 가중치 점수 합: ${totalWeightedScore.toFixed(2)}`,
    );

    // 가중치 합이 0인 경우
    if (totalWeight === 0) {
      logger.warn(
        `[1차 하향평가 계산 실패] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 가중치 합이 0입니다. 점수 계산 불가`,
      );
      return null;
    }

    // 가중치 합이 maxRate가 아닌 경우 정규화
    const finalScore =
      totalWeight !== maxRate
        ? totalWeightedScore * (maxRate / totalWeight)
        : totalWeightedScore;

    logger.log(
      `[1차 하향평가 점수 계산 완료] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 최종 점수: ${finalScore.toFixed(2)} (원본: ${totalWeightedScore.toFixed(2)}, 가중치 합: ${totalWeight.toFixed(2)}%, 최대값: ${maxRate}%, 정규화 적용: ${totalWeight !== maxRate})`,
    );

    return Math.round(finalScore * 100) / 100; // 소수점 2자리로 반올림
  } catch (error) {
    logger.error(
      `[1차 하향평가 계산 오류] 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 오류: ${error.message}`,
      error.stack,
    );
    return null;
  }
}

/**
 * 가중치 기반 2차 하향평가 점수를 계산한다
 * 여러 명의 2차 평가자가 있을 경우, 모든 평가자의 평가를 종합하여 계산
 * 계산식: Σ(WBS 가중치 × 모든 2차 평가자의 평균 점수)
 * 최대 점수: 평가기간의 maxSelfEvaluationRate
 */
export async function 가중치_기반_2차_하향평가_점수를_계산한다(
  evaluationPeriodId: string,
  employeeId: string,
  evaluatorIds: string[],
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  evaluationPeriodRepository: Repository<EvaluationPeriod>,
): Promise<number | null> {
  try {
    // 점수가 입력된 2차 평가 조회 (평가자 ID 조건 없이 모든 2차 평가 조회)
    // 평가자 매핑이 변경되었거나 삭제되어도 점수가 입력된 평가는 조회
    const downwardEvaluations = await downwardEvaluationRepository.find({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        evaluationType: DownwardEvaluationType.SECONDARY,
        deletedAt: IsNull(),
      },
    });

    // 점수가 입력된 평가만 필터링 (제출 여부와 무관)
    const completedEvaluations = downwardEvaluations.filter(
      (evaluation) =>
        evaluation.downwardEvaluationScore !== null &&
        evaluation.downwardEvaluationScore !== undefined,
    );

    if (completedEvaluations.length === 0) {
      return null;
    }

    // WBS 할당 정보 조회 (가중치 포함, 취소된 프로젝트 할당 제외)
    const wbsIds = [...new Set(completedEvaluations.map((de) => de.wbsId))];
    const wbsAssignments = await wbsAssignmentRepository
      .createQueryBuilder('assignment')
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
      .where('assignment.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.wbsItemId IN (:...wbsIds)', { wbsIds })
      .andWhere('assignment.deletedAt IS NULL')
      .andWhere('project.id IS NOT NULL') // 프로젝트가 존재하는 경우만 조회
      .andWhere('projectAssignment.id IS NOT NULL') // 프로젝트 할당이 존재하는 경우만 조회
      .getMany();

    // 평가기간의 최대 달성률 조회
    const evaluationPeriod = await evaluationPeriodRepository.findOne({
      where: { id: evaluationPeriodId },
    });
    const maxRate = evaluationPeriod?.maxSelfEvaluationRate || 100;

    // WBS별 가중치 맵 생성
    const weightMap = new Map<string, number>();
    wbsAssignments.forEach((assignment) => {
      weightMap.set(assignment.wbsItemId, assignment.weight);
    });

    // 취소된 프로젝트 할당의 WBS 평가는 제외
    const validEvaluations = completedEvaluations.filter((evaluation) =>
      weightMap.has(evaluation.wbsId),
    );

    if (validEvaluations.length === 0) {
      logger.warn(
        `모든 평가가 취소된 프로젝트 할당에 속해 있습니다. (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`,
      );
      return null;
    }

    // WBS별 평가자들의 점수를 수집
    const wbsScoresMap = new Map<string, number[]>();
    validEvaluations.forEach((evaluation) => {
      if (!wbsScoresMap.has(evaluation.wbsId)) {
        wbsScoresMap.set(evaluation.wbsId, []);
      }
      wbsScoresMap
        .get(evaluation.wbsId)!
        .push(evaluation.downwardEvaluationScore || 0);
    });

    // 가중치 기반 점수 계산
    let totalWeightedScore = 0;
    let totalWeight = 0;

    wbsScoresMap.forEach((scores, wbsId) => {
      const weight = weightMap.get(wbsId)!; // 이미 필터링했으므로 !로 단언

      // 해당 WBS에 대한 모든 평가자의 평균 점수
      const averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;

      // 가중치 적용: (weight / maxRate) × averageScore
      totalWeightedScore += (weight / maxRate) * averageScore;
      totalWeight += weight;
    });

    // 가중치 합이 0인 경우
    if (totalWeight === 0) {
      logger.warn(
        `가중치 합이 0입니다. 점수 계산 불가 (평가기간: ${evaluationPeriodId}, 피평가자: ${employeeId})`,
      );
      return null;
    }

    // 가중치 합이 maxRate가 아닌 경우 정규화
    const finalScore =
      totalWeight !== maxRate
        ? totalWeightedScore * (maxRate / totalWeight)
        : totalWeightedScore;

    logger.log(
      `가중치 기반 2차 하향평가 점수 계산 완료: ${finalScore.toFixed(2)} (원본: ${totalWeightedScore.toFixed(2)}, 가중치 합: ${totalWeight}%, 최대값: ${maxRate}) (피평가자: ${employeeId}, 평가자 수: ${evaluatorIds.length}, 평가기간: ${evaluationPeriodId})`,
    );

    return Math.round(finalScore * 100) / 100; // 소수점 2자리로 반올림
  } catch (error) {
    logger.error(
      `가중치 기반 2차 하향평가 점수 계산 실패: ${error.message}`,
      error.stack,
    );
    return null;
  }
}

/**
 * 평가기간의 등급 구간을 이용하여 점수에 해당하는 등급을 조회한다
 */
export async function 하향평가_등급을_조회한다(
  evaluationPeriodId: string,
  totalScore: number,
  periodRepository: Repository<EvaluationPeriod>,
): Promise<string | null> {
  try {
    // 평가기간 정보 조회
    const period = await periodRepository.findOne({
      where: {
        id: evaluationPeriodId,
        deletedAt: IsNull(),
      },
    });

    if (!period) {
      logger.warn(`평가기간을 찾을 수 없습니다: ${evaluationPeriodId}`);
      return null;
    }

    // 등급 구간이 설정되어 있지 않은 경우
    if (!period.등급구간_설정됨()) {
      logger.warn(
        `⚠️ 평가기간에 등급 구간이 설정되지 않았습니다. 등급 범위를 설정해주세요. (평가기간: ${period.name} [${evaluationPeriodId}], gradeRanges: ${JSON.stringify(period.gradeRanges || [])})`,
      );
      return null;
    }

    // 점수로 등급 조회
    const gradeMapping = period.점수로_등급_조회한다(totalScore);

    if (!gradeMapping) {
      logger.warn(
        `⚠️ 점수에 해당하는 등급을 찾을 수 없습니다. 등급 범위를 확인해주세요. (점수: ${totalScore}, 평가기간: ${period.name} [${evaluationPeriodId}], gradeRanges: ${JSON.stringify(period.gradeRanges)})`,
      );
      return null;
    }

    logger.log(
      `✅ 하향평가 등급 조회 완료: ${gradeMapping.finalGrade} (점수: ${totalScore}, 평가기간: ${period.name})`,
    );

    return gradeMapping.finalGrade;
  } catch (error) {
    logger.error(`하향평가 등급 조회 실패: ${error.message}`, error.stack);
    return null;
  }
}
