import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProjectGradeAndPriority1767188426026
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. grade 컬럼 추가 (enum 타입) - 존재하지 않으면 생성
    const gradeExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'grade'
    `);
    if (gradeExists.length === 0) {
      await queryRunner.addColumn(
        'project',
        new TableColumn({
          name: 'grade',
          type: 'enum',
          enum: ['1A', '1B', '2A', '2B', '3A'],
          isNullable: true,
          comment: '프로젝트 등급 (1A, 1B, 2A, 2B, 3A)',
        }),
      );
    }

    // 2. priority 컬럼 추가 (integer 타입) - 존재하지 않으면 생성
    const priorityExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'priority'
    `);
    if (priorityExists.length === 0) {
      await queryRunner.addColumn(
        'project',
        new TableColumn({
          name: 'priority',
          type: 'int',
          isNullable: true,
          comment:
            '프로젝트 우선순위 (등급에 따라 자동 설정: 1A=5, 1B=4, 2A=3, 2B=2, 3A=1)',
        }),
      );
    }

    // 3. grade 컬럼에 인덱스 추가 (존재하지 않으면 생성)
    const gradeIndexExists = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'project' AND indexname = 'IDX_project_grade'
    `);
    if (gradeIndexExists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_project_grade" ON "project" ("grade")`,
      );
    }

    // 4. priority 컬럼에 인덱스 추가 (존재하지 않으면 생성)
    const priorityIndexExists = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'project' AND indexname = 'IDX_project_priority'
    `);
    if (priorityIndexExists.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_project_priority" ON "project" ("priority")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 4. priority 인덱스 삭제 (존재하면 삭제)
    const priorityIndexExists = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'project' AND indexname = 'IDX_project_priority'
    `);
    if (priorityIndexExists.length > 0) {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_priority"`);
    }

    // 3. grade 인덱스 삭제 (존재하면 삭제)
    const gradeIndexExists = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'project' AND indexname = 'IDX_project_grade'
    `);
    if (gradeIndexExists.length > 0) {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_project_grade"`);
    }

    // 2. priority 컬럼 삭제 (존재하면 삭제)
    const priorityExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'priority'
    `);
    if (priorityExists.length > 0) {
      await queryRunner.dropColumn('project', 'priority');
    }

    // 1. grade 컬럼 삭제 (존재하면 삭제)
    const gradeExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' AND column_name = 'grade'
    `);
    if (gradeExists.length > 0) {
      await queryRunner.dropColumn('project', 'grade');
    }
  }
}

