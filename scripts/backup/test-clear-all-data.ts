import { Client } from 'pg';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 데이터베이스 연결 정보
const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'ems',
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
};

async function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function clearAllData() {
  console.log('⚠️  경고: 이 작업은 모든 데이터를 삭제합니다!');
  console.log('   (테이블 구조는 유지됩니다)');
  console.log('');
  console.log(`   호스트: ${config.host}:${config.port}`);
  console.log(`   데이터베이스: ${config.database}`);
  console.log('');

  const confirmed = await askConfirmation(
    '정말로 모든 데이터를 삭제하시겠습니까? (yes/no): ',
  );

  if (!confirmed) {
    console.log('작업이 취소되었습니다.');
    process.exit(0);
  }

  const client = new Client(config);

  try {
    await client.connect();
    console.log('');
    console.log('✅ 데이터베이스 연결 성공');

    // 모든 테이블 목록 가져오기
    console.log('📋 테이블 목록 조회 중...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map((row) => row.table_name);
    console.log(`   - ${tables.length}개의 테이블 발견`);

    // 데이터 삭제 시작
    console.log('');
    console.log('🗑️  데이터 삭제 시작...');

    // 트랜잭션 시작
    await client.query('BEGIN');

    // Foreign Key 제약조건 일시 비활성화
    await client.query("SET session_replication_role = 'replica'");

    // 각 테이블 데이터 삭제
    for (const table of tables) {
      try {
        await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`   ✓ ${table}`);
      } catch (error) {
        console.error(`   ✗ ${table} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Foreign Key 제약조건 다시 활성화
    await client.query("SET session_replication_role = 'origin'");

    // 트랜잭션 커밋
    await client.query('COMMIT');

    console.log('');
    console.log('✅ 모든 데이터가 삭제되었습니다!');
    console.log('');
    console.log('📊 데이터 확인 중...');

    // 각 테이블의 행 수 확인
    for (const table of tables) {
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM "${table}"`,
      );
      const count = parseInt(countResult.rows[0].count);
      console.log(`   - ${table}: ${count}행`);
    }

    console.log('');
    console.log('💡 이제 백업 복구를 테스트할 수 있습니다:');
    console.log('   npm run db:restore');
  } catch (error) {
    console.error('');
    console.error('❌ 작업 실패!');
    if (error instanceof Error) {
      console.error(`   오류: ${error.message}`);
    }

    // 롤백
    try {
      await client.query('ROLLBACK');
      console.log('   (변경사항이 롤백되었습니다)');
    } catch (rollbackError) {
      // 롤백 실패는 무시
    }

    process.exit(1);
  } finally {
    // 연결 종료 (이미 서버에서 끊긴 경우 에러 무시)
    try {
      await client.end();
    } catch (endError) {
      // Supabase pooler가 이미 연결을 끊은 경우 발생하는 에러 무시
    }
  }
}

clearAllData();

