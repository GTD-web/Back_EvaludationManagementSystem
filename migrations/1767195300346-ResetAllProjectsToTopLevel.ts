import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetAllProjectsToTopLevel1767195300346
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 모든 프로젝트의 parentProjectId를 NULL로 설정하여 최상위 프로젝트로 만듭니다
    await queryRunner.query(`
      UPDATE "project" 
      SET "parentProjectId" = NULL 
      WHERE "parentProjectId" IS NOT NULL 
        AND "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // down 마이그레이션은 복구할 수 없으므로 경고만 표시
    // parentProjectId의 원래 값을 복구할 수 없습니다
    // 필요시 백업 데이터를 사용하여 수동으로 복구해야 합니다
    console.warn(
      '⚠️  경고: parentProjectId를 NULL로 설정한 것은 복구할 수 없습니다.',
    );
    console.warn(
      '   원래 계층 구조를 복구하려면 백업 데이터를 사용하세요.',
    );
  }
}

