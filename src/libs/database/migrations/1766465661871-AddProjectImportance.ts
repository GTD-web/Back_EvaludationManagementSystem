import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectImportance1766465661871 implements MigrationInterface {
    name = 'AddProjectImportance1766465661871'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "project_importance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "createdBy" character varying(255), "updatedBy" character varying(255), "version" integer NOT NULL, "code" character varying(10) NOT NULL, "name" character varying(100), "displayOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_7d3e61c67b462d06e6cc4856d06" UNIQUE ("code"), CONSTRAINT "PK_ec898027993a8a0e16f2d9d25f3" PRIMARY KEY ("id")); COMMENT ON COLUMN "project_importance"."createdAt" IS '생성 일시'; COMMENT ON COLUMN "project_importance"."updatedAt" IS '수정 일시'; COMMENT ON COLUMN "project_importance"."deletedAt" IS '삭제 일시 (소프트 삭제)'; COMMENT ON COLUMN "project_importance"."createdBy" IS '생성자 ID'; COMMENT ON COLUMN "project_importance"."updatedBy" IS '수정자 ID'; COMMENT ON COLUMN "project_importance"."version" IS '버전 (낙관적 잠금용)'; COMMENT ON COLUMN "project_importance"."code" IS '중요도 코드'; COMMENT ON COLUMN "project_importance"."name" IS '중요도 이름'; COMMENT ON COLUMN "project_importance"."displayOrder" IS '표시 순서'; COMMENT ON COLUMN "project_importance"."isActive" IS '활성 여부'`);
        await queryRunner.query(`ALTER TABLE "project" ADD "importanceId" uuid`);
        await queryRunner.query(`COMMENT ON COLUMN "project"."importanceId" IS '프로젝트 중요도 ID'`);
        await queryRunner.query(`CREATE INDEX "IDX_28cfd28f1cb4a896bcd14f2597" ON "project" ("importanceId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_28cfd28f1cb4a896bcd14f2597"`);
        await queryRunner.query(`COMMENT ON COLUMN "project"."importanceId" IS '프로젝트 중요도 ID'`);
        await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "importanceId"`);
        await queryRunner.query(`DROP TABLE "project_importance"`);
    }

}
