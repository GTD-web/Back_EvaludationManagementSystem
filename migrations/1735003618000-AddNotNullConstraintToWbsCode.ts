import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * WBS 항목 테이블의 wbsCode 컬럼에 NOT NULL 제약조건 추가
 *
 * 변경 사항:
 * 1. 기존 null 값을 가진 레코드에 임시 wbsCode 생성
 * 2. wbsCode 컬럼에 NOT NULL 제약조건 추가
 *
 * 주의사항:
 * - 기존 데이터에 null 값이 있는 경우, 프로젝트ID와 순번으로 임시 코드 생성
 * - 생성된 임시 코드는 'TEMP-{projectId}-{순번}' 형식
 */
export class AddNotNullConstraintToWbsCode1735003618000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 wbsCode 컬럼에 NOT NULL 제약조건 추가 시작...');

    // 1. wbsCode 컬럼이 존재하는지 확인
    const columns = await queryRunner.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_name = 'wbs_item' AND column_name = 'wbsCode'
    `);

    if (columns.length === 0) {
      console.log('⚠️  wbsCode 컬럼이 존재하지 않습니다. 스킵합니다.');
      return;
    }

    console.log(`✓ 현재 wbsCode 컬럼 상태: ${JSON.stringify(columns[0])}`);

    // 2. null 값을 가진 레코드 확인
    const nullRecords = await queryRunner.query(`
      SELECT id, "projectId", "createdAt"
      FROM wbs_item 
      WHERE "wbsCode" IS NULL
      ORDER BY "projectId", "createdAt"
    `);

    if (nullRecords.length > 0) {
      console.log(
        `⚠️  null 값을 가진 레코드 ${nullRecords.length}개 발견. 임시 코드 생성 중...`,
      );

      // 프로젝트별로 그룹화하여 순번 부여
      const projectGroups = new Map<string, number>();

      for (const record of nullRecords) {
        const projectId = record.projectId;
        const currentSeq = projectGroups.get(projectId) || 0;
        const newSeq = currentSeq + 1;
        projectGroups.set(projectId, newSeq);

        // 임시 wbsCode 생성: TEMP-{projectId 앞 8자}-{순번}
        const shortProjectId = projectId.substring(0, 8);
        const tempWbsCode = `TEMP-${shortProjectId}-${newSeq.toString().padStart(3, '0')}`;

        await queryRunner.query(
          `
          UPDATE wbs_item 
          SET "wbsCode" = $1
          WHERE id = $2
        `,
          [tempWbsCode, record.id],
        );

        console.log(
          `  ✓ 레코드 ${record.id}: wbsCode = '${tempWbsCode}' 할당`,
        );
      }

      console.log(
        `✓ ${nullRecords.length}개 레코드에 임시 wbsCode 할당 완료`,
      );
    } else {
      console.log('✓ null 값을 가진 레코드가 없습니다.');
    }

    // 3. wbsCode 컬럼에 NOT NULL 제약조건 추가
    if (columns[0].is_nullable === 'YES') {
      console.log('🔄 wbsCode 컬럼에 NOT NULL 제약조건 추가 중...');

      await queryRunner.query(`
        ALTER TABLE "wbs_item" 
        ALTER COLUMN "wbsCode" SET NOT NULL
      `);

      console.log('✓ wbsCode 컬럼에 NOT NULL 제약조건 추가 완료');
    } else {
      console.log('✓ wbsCode 컬럼이 이미 NOT NULL입니다.');
    }

    // 4. 최종 상태 확인
    const finalColumns = await queryRunner.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns 
      WHERE table_name = 'wbs_item' AND column_name = 'wbsCode'
    `);

    console.log(`✓ 최종 wbsCode 컬럼 상태: ${JSON.stringify(finalColumns[0])}`);
    console.log('✅ 마이그레이션 완료');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 wbsCode 컬럼 NOT NULL 제약조건 제거 시작...');

    // 1. wbsCode 컬럼 확인
    const columns = await queryRunner.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'wbs_item' AND column_name = 'wbsCode'
    `);

    if (columns.length === 0) {
      console.log('⚠️  wbsCode 컬럼이 존재하지 않습니다. 스킵합니다.');
      return;
    }

    // 2. NOT NULL 제약조건 제거
    if (columns[0].is_nullable === 'NO') {
      console.log('🔄 wbsCode 컬럼 NOT NULL 제약조건 제거 중...');

      await queryRunner.query(`
        ALTER TABLE "wbs_item" 
        ALTER COLUMN "wbsCode" DROP NOT NULL
      `);

      console.log('✓ wbsCode 컬럼 NOT NULL 제약조건 제거 완료');
    } else {
      console.log('✓ wbsCode 컬럼이 이미 nullable입니다.');
    }

    // 3. 임시로 생성된 wbsCode를 null로 되돌림 (선택사항)
    const tempRecords = await queryRunner.query(`
      SELECT id, "wbsCode"
      FROM wbs_item 
      WHERE "wbsCode" LIKE 'TEMP-%'
    `);

    if (tempRecords.length > 0) {
      console.log(
        `⚠️  임시 코드 ${tempRecords.length}개 발견. null로 되돌림 중...`,
      );

      await queryRunner.query(`
        UPDATE wbs_item 
        SET "wbsCode" = NULL
        WHERE "wbsCode" LIKE 'TEMP-%'
      `);

      console.log(`✓ ${tempRecords.length}개 레코드의 wbsCode를 null로 되돌림`);
    }

    console.log('✅ 롤백 완료');
  }
}

