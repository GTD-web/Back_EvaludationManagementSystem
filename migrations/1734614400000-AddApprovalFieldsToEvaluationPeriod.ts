import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddApprovalFieldsToEvaluationPeriod1734614400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. approvalDocumentId 컬럼 추가
    await queryRunner.addColumn(
      'evaluation_period',
      new TableColumn({
        name: 'approval_document_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: '결재 문서 ID',
      }),
    );

    // 2. approvalStatus 컬럼 추가
    await queryRunner.addColumn(
      'evaluation_period',
      new TableColumn({
        name: 'approval_status',
        type: 'enum',
        enum: [
          'none',
          'pending',
          'approved',
          'rejected',
          'cancelled',
          'implemented',
        ],
        default: "'none'",
        isNullable: false,
        comment: '결재 상태',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 2. approvalStatus 컬럼 삭제
    await queryRunner.dropColumn('evaluation_period', 'approval_status');

    // 1. approvalDocumentId 컬럼 삭제
    await queryRunner.dropColumn('evaluation_period', 'approval_document_id');
  }
}
