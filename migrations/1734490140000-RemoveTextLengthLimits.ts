import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * WBS 자기평가, WBS 평가기준, WBS 항목 테이블의 텍스트 길이 제한 제거
 *
 * 변경 사항:
 * 1. wbs_self_evaluation 테이블: subProject 컬럼 추가 (text, nullable)
 * 2. wbs_evaluation_criteria 테이블: subProject 컬럼 추가 (text, nullable)
 * 3. wbs_item 테이블의 기존 컬럼 타입 변경은 컬럼명 확인 필요
 */
export class RemoveTextLengthLimits1734490140000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. wbs_self_evaluation 테이블: subProject 컬럼 추가
    const wbsSelfEvalColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'wbs_self_evaluation' AND column_name = 'subProject'
    `);

    if (wbsSelfEvalColumns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "wbs_self_evaluation" 
        ADD COLUMN "subProject" text
      `);
      console.log('✓ wbs_self_evaluation에 subProject 컬럼 추가 완료');
    }

    // 2. wbs_evaluation_criteria 테이블: subProject 컬럼 추가
    const wbsCriteriaColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'wbs_evaluation_criteria' AND column_name = 'subProject'
    `);

    if (wbsCriteriaColumns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "wbs_evaluation_criteria" 
        ADD COLUMN "subProject" text
      `);
      console.log('✓ wbs_evaluation_criteria에 subProject 컬럼 추가 완료');
    }

    // 3. wbs_item 테이블: 기존 컬럼 타입 변경
    // wbsCode 컬럼이 존재하는지 확인
    const wbsCodeColumns = await queryRunner.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'wbs_item' AND column_name IN ('wbsCode', 'wbs_code')
    `);

    if (wbsCodeColumns.length > 0) {
      const columnName = wbsCodeColumns[0].column_name;
      const dataType = wbsCodeColumns[0].data_type;

      // varchar이면 text로 변경
      if (dataType === 'character varying') {
        await queryRunner.query(`
          ALTER TABLE "wbs_item" 
          ALTER COLUMN "${columnName}" TYPE text
        `);
        console.log(`✓ wbs_item.${columnName} 타입을 text로 변경 완료`);
      }
    }

    // title 컬럼 타입 변경
    const titleColumns = await queryRunner.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'wbs_item' AND column_name = 'title'
    `);

    if (
      titleColumns.length > 0 &&
      titleColumns[0].data_type === 'character varying'
    ) {
      await queryRunner.query(`
        ALTER TABLE "wbs_item" 
        ALTER COLUMN "title" TYPE text
      `);
      console.log('✓ wbs_item.title 타입을 text로 변경 완료');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백: 추가한 컬럼 제거 및 타입 복원

    // 1. wbs_self_evaluation.subProject 컬럼 제거
    const wbsSelfEvalColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'wbs_self_evaluation' AND column_name = 'subProject'
    `);

    if (wbsSelfEvalColumns.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "wbs_self_evaluation" 
        DROP COLUMN "subProject"
      `);
    }

    // 2. wbs_evaluation_criteria.subProject 컬럼 제거
    const wbsCriteriaColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'wbs_evaluation_criteria' AND column_name = 'subProject'
    `);

    if (wbsCriteriaColumns.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "wbs_evaluation_criteria" 
        DROP COLUMN "subProject"
      `);
    }

    // 3. wbs_item 테이블 타입 복원 (데이터 손실 가능성 경고)
    const wbsCodeColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'wbs_item' AND column_name IN ('wbsCode', 'wbs_code')
    `);

    if (wbsCodeColumns.length > 0) {
      const columnName = wbsCodeColumns[0].column_name;
      await queryRunner.query(`
        ALTER TABLE "wbs_item" 
        ALTER COLUMN "${columnName}" TYPE varchar(50)
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "wbs_item" 
      ALTER COLUMN "title" TYPE varchar(255)
    `);
  }
}
