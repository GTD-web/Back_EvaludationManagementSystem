import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 1차 평가자(직원별 고정 담당자) 매핑 중복 정리 및 유니크 제약 추가
 *
 * - 동일 (평가기간, 피평가자, 1차 평가라인, wbsItemId NULL)에 대해 2건 이상 있으면
 *   가장 최신(createdAt DESC) 1건만 남기고 나머지는 soft delete 처리
 * - 이후 해당 조건에 대한 부분 유니크 인덱스 추가하여 중복 방지
 */
export class DeduplicatePrimaryEvaluatorMappingsAndAddUniqueConstraint1770200000000
  implements MigrationInterface
{
  private readonly INDEX_NAME =
    'UQ_evaluation_line_mappings_primary_per_period_employee_line';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 직원별 고정 1차 매핑(wbsItemId IS NULL) 중 중복 그룹별로 최신 1건 제외하고 soft delete
    await queryRunner.query(`
      WITH primary_mappings AS (
        SELECT id, "evaluationPeriodId", "employeeId", "evaluationLineId",
               "createdAt",
               ROW_NUMBER() OVER (
                 PARTITION BY "evaluationPeriodId", "employeeId", "evaluationLineId"
                 ORDER BY "createdAt" DESC
               ) AS rn
        FROM evaluation_line_mappings
        WHERE "wbsItemId" IS NULL AND "deletedAt" IS NULL
      ),
      ids_to_soft_delete AS (
        SELECT id FROM primary_mappings WHERE rn > 1
      )
      UPDATE evaluation_line_mappings m
      SET "deletedAt" = NOW()
      FROM ids_to_soft_delete d
      WHERE m.id = d.id
    `);

    // 2. 직원별 고정 1차 매핑에 대한 부분 유니크 인덱스 추가
    //    (동일 period + employee + line + wbsItemId NULL인 비삭제 행은 1건만 허용)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "${this.INDEX_NAME}"
      ON evaluation_line_mappings ("evaluationPeriodId", "employeeId", "evaluationLineId")
      WHERE "wbsItemId" IS NULL AND "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "${this.INDEX_NAME}"`);
    // 중복 정리(soft delete)는 롤백하지 않음 - 복구 시 데이터 정합성 이슈 가능
  }
}
