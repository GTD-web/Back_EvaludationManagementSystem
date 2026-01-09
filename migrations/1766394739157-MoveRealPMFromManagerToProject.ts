import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MoveRealPMFromManagerToProject1766394739157
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // project 테이블의 realPM 컬럼이 존재하는지 확인
    const table = await queryRunner.getTable('project');
    const realPMColumn = table?.findColumnByName('realPM');

    // realPM 컬럼이 없으면 추가
    if (!realPMColumn) {
      await queryRunner.addColumn(
        'project',
        new TableColumn({
          name: 'realPM',
          type: 'varchar',
          length: '255',
          isNullable: true,
          comment: '실 PM',
        }),
      );
    }

    // project_manager 테이블의 realPM 컬럼이 존재하면 제거
    const pmTable = await queryRunner.getTable('project_manager');
    const pmRealPMColumn = pmTable?.findColumnByName('realPM');

    if (pmRealPMColumn) {
      await queryRunner.dropColumn('project_manager', 'realPM');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // project 테이블의 realPM 컬럼 제거
    const table = await queryRunner.getTable('project');
    const realPMColumn = table?.findColumnByName('realPM');

    if (realPMColumn) {
      await queryRunner.dropColumn('project', 'realPM');
    }

    // project_manager 테이블의 realPM 컬럼 복구
    const pmTable = await queryRunner.getTable('project_manager');
    const pmRealPMColumn = pmTable?.findColumnByName('realPM');

    if (!pmRealPMColumn) {
      await queryRunner.addColumn(
        'project_manager',
        new TableColumn({
          name: 'realPM',
          type: 'varchar',
          length: '255',
          isNullable: true,
          comment: '실 PM',
        }),
      );
    }
  }
}
