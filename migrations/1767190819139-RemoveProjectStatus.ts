import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveProjectStatus1767190819139
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. status 컬럼 삭제 (존재하면 삭제)
    const statusExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'status'
    `);
    if (statusExists.length > 0) {
      await queryRunner.dropColumn('project', 'status');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. status 컬럼 복원 (존재하지 않으면 생성)
    const statusExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'status'
    `);
    if (statusExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "project" 
        ADD COLUMN "status" enum('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE'
      `);
    }
  }
}

