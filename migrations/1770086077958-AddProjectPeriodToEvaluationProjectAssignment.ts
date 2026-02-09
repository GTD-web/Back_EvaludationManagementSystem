import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProjectPeriodToEvaluationProjectAssignment1770086077958
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. project_start_date 컬럼 추가
    await queryRunner.addColumn(
      'evaluation_project_assignment',
      new TableColumn({
        name: 'project_start_date',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: '프로젝트 시작일',
      }),
    );

    // 2. project_end_date 컬럼 추가
    await queryRunner.addColumn(
      'evaluation_project_assignment',
      new TableColumn({
        name: 'project_end_date',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: '프로젝트 종료일',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 2. project_end_date 컬럼 삭제
    await queryRunner.dropColumn(
      'evaluation_project_assignment',
      'project_end_date',
    );

    // 1. project_start_date 컬럼 삭제
    await queryRunner.dropColumn(
      'evaluation_project_assignment',
      'project_start_date',
    );
  }
}
