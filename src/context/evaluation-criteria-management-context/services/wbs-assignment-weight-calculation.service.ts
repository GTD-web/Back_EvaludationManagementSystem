import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, IsNull } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Project } from '@domain/common/project/project.entity';
import { getProjectGradePriority, ProjectGrade } from '@domain/common/project/project.types';

/**
 * WBS 할당 가중치 계산 서비스
 *
 * 직원별 WBS 할당의 가중치를 프로젝트 등급 기반으로 자동 계산합니다.
 * - 총 가중치 합계: 평가기간의 maxSelfEvaluationRate
 * - 계산 기준: 프로젝트 등급의 우선순위(priority) 값
 * - 분배 방식: 프로젝트 가중치를 해당 프로젝트의 WBS 수량으로 나누어 균등 분배
 */
@Injectable()
export class WbsAssignmentWeightCalculationService {
  private readonly logger = new Logger(
    WbsAssignmentWeightCalculationService.name,
  );

  constructor(
    @InjectRepository(EvaluationWbsAssignment)
    private readonly assignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
  ) {}

  /**
   * 직원의 특정 평가기간 WBS 할당 가중치를 재계산한다
   * - 프로젝트 등급 기반으로 가중치를 자동 계산 (총합 maxSelfEvaluationRate)
   * - 프로젝트 등급이 없거나 우선순위가 0인 경우 제외
   * - 모든 프로젝트 등급이 없으면 가중치는 0으로 설정
   */
  async 직원_평가기간_가중치를_재계산한다(
    employeeId: string,
    periodId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(EvaluationWbsAssignment)
      : this.assignmentRepository;

    const projectAssignmentRepository = manager
      ? manager.getRepository(EvaluationProjectAssignment)
      : this.projectAssignmentRepository;

    const evaluationPeriodRepository = manager
      ? manager.getRepository(EvaluationPeriod)
      : this.evaluationPeriodRepository;

    // 1. 평가기간 정보 조회 (maxSelfEvaluationRate 필요)
    const evaluationPeriod = await evaluationPeriodRepository.findOne({
      where: {
        id: periodId,
        deletedAt: IsNull(),
      },
    });

    if (!evaluationPeriod) {
      this.logger.warn(
        `가중치 재계산: 평가기간을 찾을 수 없습니다 - 기간: ${periodId}`,
      );
      return;
    }

    const maxSelfEvaluationRate = evaluationPeriod.maxSelfEvaluationRate || 100;

    // 2. 해당 직원의 평가기간 WBS 할당 조회
    const assignments = await repository.find({
      where: {
        employeeId,
        periodId,
        deletedAt: IsNull(),
      },
    });

    if (assignments.length === 0) {
      this.logger.log(
        `가중치 재계산: 할당이 없습니다 - 직원: ${employeeId}, 기간: ${periodId}`,
      );
      return;
    }

    // 3. 프로젝트 할당 정보 조회 (프로젝트 등급 포함)
    const projectIds = [...new Set(assignments.map((a) => a.projectId))];
    const projectAssignments = await projectAssignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin(
        Project,
        'project',
        'project.id = assignment.projectId AND project.deletedAt IS NULL',
      )
      .select([
        'assignment.projectId AS project_id',
        'project.id AS project_id',
        'project.grade AS project_grade',
        'project.priority AS project_priority',
      ])
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.deletedAt IS NULL')
      .andWhere('project.id IN (:...projectIds)', { projectIds })
      .getRawMany();

    // 4. 프로젝트별 등급 및 우선순위 맵 생성
    const projectGradeMap = new Map<string, ProjectGrade | null>();
    const projectPriorityMap = new Map<string, number>();

    projectAssignments.forEach((pa) => {
      const projectId = pa.project_id;
      const grade = pa.project_grade as ProjectGrade | null;
      projectGradeMap.set(projectId, grade);

      if (grade) {
        const priority = getProjectGradePriority(grade);
        projectPriorityMap.set(projectId, priority);
      } else {
        projectPriorityMap.set(projectId, 0);
      }
    });

    // 5. 프로젝트별 WBS 수량 계산
    const projectWbsCountMap = new Map<string, number>();
    assignments.forEach((assignment) => {
      const count = projectWbsCountMap.get(assignment.projectId) || 0;
      projectWbsCountMap.set(assignment.projectId, count + 1);
    });

    // 6. 프로젝트별 가중치 계산 및 WBS별 가중치 분배
    const wbsWeights: { assignment: EvaluationWbsAssignment; weight: number }[] = [];
    let totalRawWeight = 0;

    // 프로젝트별로 그룹핑하여 가중치 계산
    const projectGroups = new Map<string, EvaluationWbsAssignment[]>();
    assignments.forEach((assignment) => {
      const projectId = assignment.projectId;
      if (!projectGroups.has(projectId)) {
        projectGroups.set(projectId, []);
      }
      projectGroups.get(projectId)!.push(assignment);
    });

    projectGroups.forEach((wbsAssignments, projectId) => {
      const priority = projectPriorityMap.get(projectId) || 0;
      const wbsCount = projectWbsCountMap.get(projectId) || 0;

      // 프로젝트 등급이 없거나 WBS 수량이 0이면 가중치 0
      if (priority === 0 || wbsCount === 0) {
        wbsAssignments.forEach((assignment) => {
          wbsWeights.push({ assignment, weight: 0 });
        });
        return;
      }

      // 프로젝트 가중치를 WBS 수량으로 나누어 각 WBS에 균등 분배
      const wbsWeight = priority / wbsCount;
      wbsAssignments.forEach((assignment) => {
        wbsWeights.push({ assignment, weight: wbsWeight });
        totalRawWeight += wbsWeight;
      });
    });

    // 7. 정규화: 가중치 총합을 maxSelfEvaluationRate로 맞춤
    if (totalRawWeight === 0) {
      // 모든 프로젝트 등급이 없거나 WBS 수량이 0이면 모든 가중치를 0으로 설정
      this.logger.warn(
        `가중치 재계산: 총 가중치가 0입니다 - 직원: ${employeeId}, 기간: ${periodId}`,
      );
      for (const assignment of assignments) {
        assignment.가중치를_설정한다(0);
      }
    } else {
      // 정규화된 가중치 계산
      const normalizedWeights: number[] = [];
      let sumNormalizedWeights = 0;

      for (let i = 0; i < wbsWeights.length; i++) {
        const { weight } = wbsWeights[i];
        const normalizedWeight =
          i === wbsWeights.length - 1
            ? maxSelfEvaluationRate - sumNormalizedWeights // 마지막 항목은 오차 보정
            : Math.round((weight / totalRawWeight) * maxSelfEvaluationRate * 100) / 100; // 소수점 2자리

        normalizedWeights.push(normalizedWeight);
        sumNormalizedWeights += normalizedWeight;
      }

      // 가중치 설정
      for (let i = 0; i < wbsWeights.length; i++) {
        const { assignment } = wbsWeights[i];
        assignment.가중치를_설정한다(normalizedWeights[i]);
      }
    }

    // 8. 저장 - 각 할당마다 개별 업데이트
    for (const assignment of assignments) {
      await repository
        .createQueryBuilder()
        .update()
        .set({ weight: assignment.weight })
        .where('id = :id', { id: assignment.id })
        .execute();
    }

    // 저장 후 weight 값 로그
    const weights = assignments.map((a) => a.weight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    this.logger.log(
      `가중치 재계산 완료 - 직원: ${employeeId}, 기간: ${periodId}, ` +
        `할당 수: ${assignments.length}, 총 가중치: ${totalWeight.toFixed(2)}, ` +
        `최대 달성률: ${maxSelfEvaluationRate}, ` +
        `가중치: [${weights.map((w) => w.toFixed(2)).join(', ')}]`,
    );
  }

  /**
   * 특정 WBS가 할당된 모든 직원의 가중치를 재계산한다
   * - WBS 평가기준 생성/수정/삭제 시 호출
   */
  async WBS별_할당된_직원_가중치를_재계산한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(EvaluationWbsAssignment)
      : this.assignmentRepository;

    // 해당 WBS가 할당된 모든 직원-기간 조합 조회
    const assignments = await repository
      .createQueryBuilder('assignment')
      .select('assignment.employeeId', 'employeeId')
      .addSelect('assignment.periodId', 'periodId')
      .where('assignment.wbsItemId = :wbsItemId', { wbsItemId })
      .andWhere('assignment.deletedAt IS NULL')
      .distinct(true)
      .getRawMany();

    this.logger.log(
      `WBS별 가중치 재계산 시작 - WBS: ${wbsItemId}, ` +
        `영향받는 직원-기간 조합: ${assignments.length}`,
    );

    // 각 직원-기간 조합에 대해 가중치 재계산
    for (const { employeeId, periodId } of assignments) {
      await this.직원_평가기간_가중치를_재계산한다(
        employeeId,
        periodId,
        manager,
      );
    }

    this.logger.log(`WBS별 가중치 재계산 완료 - WBS: ${wbsItemId}`);
  }
}
