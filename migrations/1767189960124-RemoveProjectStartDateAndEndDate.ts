import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveProjectStartDateAndEndDate1767189960124
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. startDate 컬럼 삭제 (존재하면 삭제)
    const startDateExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'startDate'
    `);
    if (startDateExists.length > 0) {
      await queryRunner.dropColumn('project', 'startDate');
    }

    // 2. endDate 컬럼 삭제 (존재하면 삭제)
    const endDateExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'endDate'
    `);
    if (endDateExists.length > 0) {
      await queryRunner.dropColumn('project', 'endDate');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 2. endDate 컬럼 복원 (존재하지 않으면 생성)
    const endDateExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'endDate'
    `);
    if (endDateExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "project" 
        ADD COLUMN "endDate" date NULL
      `);
    }

    // 1. startDate 컬럼 복원 (존재하지 않으면 생성)
    const startDateExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'startDate'
    `);
    if (startDateExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "project" 
        ADD COLUMN "startDate" date NULL
      `);
    }
  }
}

