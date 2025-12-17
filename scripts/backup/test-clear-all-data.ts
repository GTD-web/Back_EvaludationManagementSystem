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
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000, // 30초
  query_timeout: 600000, // 10분
  statement_timeout: 600000, // 10분
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

async function checkAndTerminateBlockingConnections(
  client: Client,
): Promise<void> {
  console.log('');
  console.log('🔍 데이터베이스 잠금 확인 중...');

  // 활성 연결 확인
  const activeConnectionsResult = await client.query(`
    SELECT 
      pid,
      usename,
      application_name,
      state,
      query,
      state_change
    FROM pg_stat_activity 
    WHERE datname = current_database()
      AND pid != pg_backend_pid()
      AND state != 'idle'
    ORDER BY state_change;
  `);

  if (activeConnectionsResult.rows.length > 0) {
    console.log(
      `   ⚠️  ${activeConnectionsResult.rows.length}개의 활성 연결 발견`,
    );
    for (const row of activeConnectionsResult.rows) {
      console.log(
        `      - PID ${row.pid}: ${row.application_name} (${row.state})`,
      );
    }

    const terminate = await askConfirmation(
      '\n   이 연결들을 강제 종료하시겠습니까? (yes/no): ',
    );

    if (terminate) {
      for (const row of activeConnectionsResult.rows) {
        try {
          await client.query(`SELECT pg_terminate_backend(${row.pid})`);
          console.log(`   ✓ PID ${row.pid} 종료됨`);
        } catch (error) {
          console.log(`   ✗ PID ${row.pid} 종료 실패`);
        }
      }
    } else {
      console.log(
        '   ⚠️  다른 연결이 활성화되어 있으면 삭제가 느려지거나 실패할 수 있습니다.',
      );
    }
  } else {
    console.log('   ✓ 활성 연결 없음');
  }
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

    // 활성 연결 확인 및 종료
    await checkAndTerminateBlockingConnections(client);

    // 데이터 삭제 시작
    console.log('');
    console.log('🗑️  데이터 삭제 시작...');

    // statement timeout을 10분으로 설정 (600000ms)
    await client.query('SET statement_timeout = 600000');
    console.log('   - Statement timeout: 10분');

    // lock timeout 설정 (5분)
    await client.query('SET lock_timeout = 300000');
    console.log('   - Lock timeout: 5분');

    // Foreign Key 제약조건 일시 비활성화 (트랜잭션 없이)
    await client.query("SET session_replication_role = 'replica'");
    console.log('   - Foreign Key 제약조건 비활성화');

    let successCount = 0;
    let errorCount = 0;

    console.log('');
    console.log('   개별 테이블 삭제 시작...');

    // 개별 테이블로 삭제 (더 안정적)
    for (const table of tables) {
      try {
        // 테이블의 행 수 확인
        const countResult = await client.query(
          `SELECT COUNT(*) as count FROM "${table}"`,
        );
        const rowCount = parseInt(countResult.rows[0].count);

        if (rowCount === 0) {
          console.log(`   - ${table} (이미 비어있음)`);
          successCount++;
          continue;
        }

        console.log(
          `   🔄 ${table} 삭제 중... (${rowCount.toLocaleString()}행)`,
        );

        const startTime = Date.now();

        // DELETE를 사용하여 삭제 (TRUNCATE보다 잠금 문제에 강함)
        await client.query(`DELETE FROM "${table}"`);

        // SEQUENCE 리셋
        await client.query(
          `SELECT setval(pg_get_serial_sequence('"${table}"', column_name), 1, false) 
           FROM information_schema.columns 
           WHERE table_name = '${table}' 
             AND column_default LIKE 'nextval%'`,
        );

        const duration = Date.now() - startTime;
        console.log(`   ✓ ${table} 완료 (${duration}ms)`);
        successCount++;
      } catch (error) {
        console.error(
          `   ✗ ${table} - ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        errorCount++;
      }
    }

    // Foreign Key 제약조건 다시 활성화
    await client.query("SET session_replication_role = 'origin'");
    console.log('');
    console.log('   - Foreign Key 제약조건 활성화');

    console.log('');
    console.log(`📊 삭제 결과: 성공 ${successCount}개, 실패 ${errorCount}개`);

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
