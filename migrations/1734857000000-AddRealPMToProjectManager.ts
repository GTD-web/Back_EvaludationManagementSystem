import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRealPMToProjectManager1734857000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // realPM 컬럼 추가
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    // realPM 컬럼 삭제
    await queryRunner.dropColumn('project_manager', 'realPM');
  }
}

