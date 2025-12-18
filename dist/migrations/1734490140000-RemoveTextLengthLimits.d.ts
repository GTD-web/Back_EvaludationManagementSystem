import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class RemoveTextLengthLimits1734490140000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
