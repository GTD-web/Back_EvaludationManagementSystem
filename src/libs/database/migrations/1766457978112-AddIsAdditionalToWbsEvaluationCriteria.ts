import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsAdditionalToWbsEvaluationCriteria1766457978112 implements MigrationInterface {
    name = 'AddIsAdditionalToWbsEvaluationCriteria1766457978112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wbs_evaluation_criteria" ADD "isAdditional" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "wbs_evaluation_criteria"."isAdditional" IS '추가 과제 여부 - true인 경우 추가로 할당된 과제'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "wbs_evaluation_criteria"."isAdditional" IS '추가 과제 여부 - true인 경우 추가로 할당된 과제'`);
        await queryRunner.query(`ALTER TABLE "wbs_evaluation_criteria" DROP COLUMN "isAdditional"`);
    }

}
