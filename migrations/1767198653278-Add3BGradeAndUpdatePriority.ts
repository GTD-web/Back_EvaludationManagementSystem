import { MigrationInterface, QueryRunner } from 'typeorm';

export class Add3BGradeAndUpdatePriority1767198653278
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. enum 타입에 3B 값 추가 (PostgreSQL)
    // TypeORM이 생성한 enum 타입 이름은 보통 '{table}_{column}_enum' 형식입니다.
    // 먼저 일반적인 이름들을 시도하고, 실패하면 동적으로 찾습니다.
    const possibleEnumNames = [
      'project_grade_enum',
      'projectgradeenum',
      'grade_enum',
    ];

    let enumTypeName: string | null = null;
    
    // 일반적인 이름들 확인
    for (const name of possibleEnumNames) {
      const exists = await queryRunner.query(`
        SELECT 1 FROM pg_type WHERE typname = $1
      `, [name]);
      if (exists.length > 0) {
        enumTypeName = name;
        break;
      }
    }

    // 일반적인 이름이 없으면 동적으로 찾기
    if (!enumTypeName) {
      const dynamicQuery = await queryRunner.query(`
        SELECT DISTINCT t.typname as enum_type_name
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE e.enumlabel IN ('1A', '1B', '2A', '2B', '3A')
        GROUP BY t.typname
        HAVING COUNT(DISTINCT e.enumlabel) >= 5
        LIMIT 1
      `);
      if (dynamicQuery.length > 0) {
        enumTypeName = dynamicQuery[0].enum_type_name;
      }
    }

    if (enumTypeName) {
      // enum 타입에 3B 값이 없으면 추가
      const enumValueExists = await queryRunner.query(`
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = '3B' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)
      `, [enumTypeName]);
      
      if (enumValueExists.length === 0) {
        // PostgreSQL에서 enum 값 추가
        // 주의: ALTER TYPE ... ADD VALUE는 트랜잭션 내에서 실행 가능하지만
        // IF NOT EXISTS는 PostgreSQL 9.5+에서만 지원됩니다.
        try {
          await queryRunner.query(`
            ALTER TYPE "${enumTypeName}" ADD VALUE IF NOT EXISTS '3B'
          `);
        } catch (error) {
          // IF NOT EXISTS가 지원되지 않는 경우, 직접 확인 후 추가
          const checkExists = await queryRunner.query(`
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = '3B' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)
          `, [enumTypeName]);
          
          if (checkExists.length === 0) {
            await queryRunner.query(`
              ALTER TYPE "${enumTypeName}" ADD VALUE '3B'
            `);
          }
        }
      }
    }

    // 2. 기존 프로젝트들의 priority 값을 새로운 체계에 맞게 업데이트
    // 1A: 5 -> 6
    await queryRunner.query(`
      UPDATE "project" 
      SET "priority" = 6 
      WHERE "grade" = '1A' AND "priority" = 5 AND "deletedAt" IS NULL
    `);

    // 1B: 4 -> 5
    await queryRunner.query(`
      UPDATE "project" 
      SET "priority" = 5 
      WHERE "grade" = '1B' AND "priority" = 4 AND "deletedAt" IS NULL
    `);

    // 2A: 3 -> 4
    await queryRunner.query(`
      UPDATE "project" 
      SET "priority" = 4 
      WHERE "grade" = '2A' AND "priority" = 3 AND "deletedAt" IS NULL
    `);

    // 2B: 2 -> 3
    await queryRunner.query(`
      UPDATE "project" 
      SET "priority" = 3 
      WHERE "grade" = '2B' AND "priority" = 2 AND "deletedAt" IS NULL
    `);

    // 3A: 1 -> 2
    await queryRunner.query(`
      UPDATE "project" 
      SET "priority" = 2 
      WHERE "grade" = '3A' AND "priority" = 1 AND "deletedAt" IS NULL
    `);

    // grade가 있지만 priority가 없는 경우 (새로운 체계로 설정)
    await queryRunner.query(`
      UPDATE "project" 
      SET "priority" = CASE 
        WHEN "grade" = '1A' THEN 6
        WHEN "grade" = '1B' THEN 5
        WHEN "grade" = '2A' THEN 4
        WHEN "grade" = '2B' THEN 3
        WHEN "grade" = '3A' THEN 2
        WHEN "grade" = '3B' THEN 1
        ELSE NULL
      END
      WHERE "grade" IS NOT NULL 
        AND ("priority" IS NULL OR "priority" NOT IN (1, 2, 3, 4, 5, 6))
        AND "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 우선순위를 이전 체계로 되돌리기 (1A=5, 1B=4, 2A=3, 2B=2, 3A=1)
    await queryRunner.query(`
      UPDATE "project" 
      SET "priority" = CASE 
        WHEN "grade" = '1A' THEN 5
        WHEN "grade" = '1B' THEN 4
        WHEN "grade" = '2A' THEN 3
        WHEN "grade" = '2B' THEN 2
        WHEN "grade" = '3A' THEN 1
        WHEN "grade" = '3B' THEN NULL
        ELSE NULL
      END
      WHERE "grade" IS NOT NULL AND "deletedAt" IS NULL
    `);

    // 참고: PostgreSQL에서 enum 값 제거는 복잡하므로
    // down 마이그레이션에서는 enum 값 제거를 수행하지 않습니다.
    // 필요시 수동으로 처리해야 합니다.
  }
}

