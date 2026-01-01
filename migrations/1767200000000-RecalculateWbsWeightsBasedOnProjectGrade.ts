import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * WBS 가중치를 프로젝트 등급 기반으로 재계산하는 마이그레이션
 * 
 * 기존: WBS 평가기준의 중요도(importance) 기반 가중치
 * 변경: 프로젝트 등급(priority) + 프로젝트별 WBS 수량 기반 가중치
 * 
 * 프로젝트 등급별 우선순위:
 * - 1A: 6
 * - 1B: 5
 * - 2A: 4
 * - 2B: 3
 * - 3A: 2
 * - 3B: 1
 * 
 * 계산 방식:
 * 1. 프로젝트별 가중치 = 프로젝트 등급의 우선순위 값
 * 2. 프로젝트 내 각 WBS 가중치 = 프로젝트 가중치 / 프로젝트의 WBS 수량
 * 3. 정규화: (WBS 가중치 / 전체 WBS 가중치 합) × maxSelfEvaluationRate
 */
export class RecalculateWbsWeightsBasedOnProjectGrade1767200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 WBS 가중치를 프로젝트 등급 기반으로 재계산 시작...');

    // 프로젝트 등급별 우선순위 맵
    const gradePriorityMap: Record<string, number> = {
      '1A': 6,
      '1B': 5,
      '2A': 4,
      '2B': 3,
      '3A': 2,
      '3B': 1,
    };

    // 1. 모든 평가기간 조회
    const periods = await queryRunner.query(`
      SELECT id, "maxSelfEvaluationRate"
      FROM evaluation_period
      WHERE "deletedAt" IS NULL
    `);

    console.log(`📊 평가기간 ${periods.length}개 발견`);

    let totalRecalculated = 0;
    let totalAssignments = 0;

    // 2. 각 평가기간별로 처리
    for (const period of periods) {
      const periodId = period.id;
      const maxSelfEvaluationRate = period.maxSelfEvaluationRate || 100;

      console.log(
        `\n📅 평가기간 처리 중: ${periodId} (최대 달성률: ${maxSelfEvaluationRate})`,
      );

      // 3. 해당 평가기간의 모든 직원-프로젝트 조합 조회
      const employeeProjectCombinations = await queryRunner.query(
        `
        SELECT DISTINCT 
          ewa."employeeId",
          ewa."projectId"
        FROM evaluation_wbs_assignment ewa
        WHERE ewa."periodId" = $1
          AND ewa."deletedAt" IS NULL
      `,
        [periodId],
      );

      console.log(
        `  👥 직원-프로젝트 조합 ${employeeProjectCombinations.length}개 발견`,
      );

      // 4. 각 직원별로 그룹핑하여 처리
      const employeeMap = new Map<string, string[]>();
      employeeProjectCombinations.forEach((combo: any) => {
        const employeeId = combo.employeeId;
        if (!employeeMap.has(employeeId)) {
          employeeMap.set(employeeId, []);
        }
        employeeMap.get(employeeId)!.push(combo.projectId);
      });

      // 5. 각 직원별로 가중치 재계산
      for (const [employeeId, projectIds] of employeeMap.entries()) {
        // 5-1. 해당 직원의 모든 WBS 할당 조회
        const assignments = await queryRunner.query(
          `
          SELECT 
            ewa.id,
            ewa."projectId",
            ewa."wbsItemId",
            p.grade as project_grade,
            p.priority as project_priority
          FROM evaluation_wbs_assignment ewa
          LEFT JOIN project p ON p.id = ewa."projectId" AND p."deletedAt" IS NULL
          WHERE ewa."periodId" = $1
            AND ewa."employeeId" = $2
            AND ewa."deletedAt" IS NULL
          ORDER BY ewa."projectId", ewa."displayOrder"
        `,
          [periodId, employeeId],
        );

        if (assignments.length === 0) {
          continue;
        }

        // 5-2. 프로젝트별 그룹핑 및 우선순위 계산
        const projectGroups = new Map<string, any[]>();
        const projectPriorityMap = new Map<string, number>();

        assignments.forEach((assignment: any) => {
          const projectId = assignment.projectId;
          if (!projectGroups.has(projectId)) {
            projectGroups.set(projectId, []);
          }
          projectGroups.get(projectId)!.push(assignment);

          // 프로젝트 우선순위 설정 (서비스 로직과 일치)
          if (!projectPriorityMap.has(projectId)) {
            const grade = assignment.project_grade;
            // grade가 있으면 gradePriorityMap 사용, 없으면 0
            // project_priority는 grade가 설정되면 자동 계산되므로, grade가 없으면 priority도 신뢰할 수 없음
            const priority = grade ? gradePriorityMap[grade] || 0 : 0;
            projectPriorityMap.set(projectId, priority);
          }
        });

        // 5-3. 프로젝트별 WBS 수량 계산
        const projectWbsCountMap = new Map<string, number>();
        projectGroups.forEach((wbsAssignments, projectId) => {
          projectWbsCountMap.set(projectId, wbsAssignments.length);
        });

        // 5-4. 원시 가중치 계산 (프로젝트 우선순위 / WBS 수량)
        const rawWeights: Array<{ assignmentId: string; weight: number }> = [];
        let totalRawWeight = 0;

        projectGroups.forEach((wbsAssignments, projectId) => {
          const priority = projectPriorityMap.get(projectId) || 0;
          const wbsCount = projectWbsCountMap.get(projectId) || 0;

          if (priority === 0 || wbsCount === 0) {
            // 프로젝트 등급이 없거나 WBS 수량이 0이면 가중치 0
            wbsAssignments.forEach((assignment: any) => {
              rawWeights.push({ assignmentId: assignment.id, weight: 0 });
            });
            return;
          }

          // 프로젝트 가중치를 WBS 수량으로 나누어 각 WBS에 균등 분배
          const wbsWeight = priority / wbsCount;
          wbsAssignments.forEach((assignment: any) => {
            rawWeights.push({ assignmentId: assignment.id, weight: wbsWeight });
            totalRawWeight += wbsWeight;
          });
        });

        // 5-5. 정규화: 가중치 총합을 maxSelfEvaluationRate로 맞춤
        if (totalRawWeight === 0) {
          // 모든 프로젝트 등급이 없거나 WBS 수량이 0이면 모든 가중치를 0으로 설정
          for (const { assignmentId } of rawWeights) {
            await queryRunner.query(
              `
              UPDATE evaluation_wbs_assignment
              SET weight = 0
              WHERE id = $1
            `,
              [assignmentId],
            );
          }
        } else {
          // 정규화된 가중치 계산
          const normalizedWeights: number[] = [];
          let sumNormalizedWeights = 0;

          for (let i = 0; i < rawWeights.length; i++) {
            const { weight } = rawWeights[i];
            const normalizedWeight =
              i === rawWeights.length - 1
                ? maxSelfEvaluationRate - sumNormalizedWeights // 마지막 항목은 오차 보정
                : Math.round((weight / totalRawWeight) * maxSelfEvaluationRate * 100) / 100; // 소수점 2자리

            normalizedWeights.push(normalizedWeight);
            sumNormalizedWeights += normalizedWeight;
          }

          // 5-6. 가중치 업데이트
          // 성능을 위해 배치 업데이트 사용 (VALUES를 사용한 JOIN 업데이트)
          if (rawWeights.length > 0) {
            const values: string[] = [];
            const params: any[] = [];
            let paramIndex = 1;
            
            for (let i = 0; i < rawWeights.length; i++) {
              const { assignmentId } = rawWeights[i];
              const normalizedWeight = normalizedWeights[i];
              values.push(`($${paramIndex}, $${paramIndex + 1})`);
              params.push(assignmentId, normalizedWeight);
              paramIndex += 2;
            }

            await queryRunner.query(
              `
              UPDATE evaluation_wbs_assignment ewa
              SET weight = v.weight::numeric
              FROM (VALUES ${values.join(', ')}) AS v(id, weight)
              WHERE ewa.id = v.id::uuid
            `,
              params,
            );
          }
        }

        totalRecalculated++;
        totalAssignments += assignments.length;
      }
    }

    console.log(
      `\n✅ 가중치 재계산 완료: ${totalRecalculated}개 직원-평가기간 조합, ${totalAssignments}개 WBS 할당`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백 시 기존 가중치를 복원할 수 없으므로 경고만 출력
    console.warn(
      '⚠️  가중치 재계산 마이그레이션은 롤백할 수 없습니다. 백업에서 복원하거나 수동으로 재계산해야 합니다.',
    );
  }
}
