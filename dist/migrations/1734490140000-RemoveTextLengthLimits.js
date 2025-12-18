"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveTextLengthLimits1734490140000 = void 0;
class RemoveTextLengthLimits1734490140000 {
    async up(queryRunner) {
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
        const wbsCodeColumns = await queryRunner.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'wbs_item' AND column_name IN ('wbsCode', 'wbs_code')
    `);
        if (wbsCodeColumns.length > 0) {
            const columnName = wbsCodeColumns[0].column_name;
            const dataType = wbsCodeColumns[0].data_type;
            if (dataType === 'character varying') {
                await queryRunner.query(`
          ALTER TABLE "wbs_item" 
          ALTER COLUMN "${columnName}" TYPE text
        `);
                console.log(`✓ wbs_item.${columnName} 타입을 text로 변경 완료`);
            }
        }
        const titleColumns = await queryRunner.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'wbs_item' AND column_name = 'title'
    `);
        if (titleColumns.length > 0 &&
            titleColumns[0].data_type === 'character varying') {
            await queryRunner.query(`
        ALTER TABLE "wbs_item" 
        ALTER COLUMN "title" TYPE text
      `);
            console.log('✓ wbs_item.title 타입을 text로 변경 완료');
        }
    }
    async down(queryRunner) {
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
exports.RemoveTextLengthLimits1734490140000 = RemoveTextLengthLimits1734490140000;
//# sourceMappingURL=1734490140000-RemoveTextLengthLimits.js.map