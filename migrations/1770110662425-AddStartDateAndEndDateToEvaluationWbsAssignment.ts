import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStartDateAndEndDateToEvaluationWbsAssignment1770110662425
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. start_date 컬럼 추가
    await queryRunner.addColumn(
      'evaluation_wbs_assignment',
      new TableColumn({
        name: 'start_date',
        type: 'date',
        isNullable: true,
        comment: '시작일',
      }),
    );

    // 2. end_date 컬럼 추가
    await queryRunner.addColumn(
      'evaluation_wbs_assignment',
      new TableColumn({
        name: 'end_date',
        type: 'date',
        isNullable: true,
        comment: '종료일',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 2. end_date 컬럼 삭제
    await queryRunner.dropColumn(
      'evaluation_wbs_assignment',
      'end_date',
    );

    // 1. start_date 컬럼 삭제
    await queryRunner.dropColumn(
      'evaluation_wbs_assignment',
      'start_date',
    );
  }
}
