import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 백업 설정
const BACKUP_DIR = path.join(__dirname, 'dumps');

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

// 명령줄 인자로 백업 파일 지정 가능
let BACKUP_FILE = process.argv[2];

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

async function restore() {
  // 백업 파일 결정
  if (!BACKUP_FILE) {
    // 인자가 없으면 최신 백업 파일 사용
    if (!fs.existsSync(BACKUP_DIR)) {
      console.error('❌ 백업 디렉토리가 존재하지 않습니다.');
      console.error(`   경로: ${BACKUP_DIR}`);
      process.exit(1);
    }

    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((file) => file.startsWith('backup-') && file.endsWith('.sql'))
      .map((file) => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (files.length === 0) {
      console.error('❌ 백업 파일을 찾을 수 없습니다.');
      console.error(`   경로: ${BACKUP_DIR}`);
      process.exit(1);
    }

    BACKUP_FILE = files[0].path;
    console.log(`📂 최신 백업 파일을 사용합니다: ${BACKUP_FILE}`);
  } else {
    if (!fs.existsSync(BACKUP_FILE)) {
      console.error(`❌ 백업 파일이 존재하지 않습니다: ${BACKUP_FILE}`);
      process.exit(1);
    }
  }

  // 확인 메시지
  console.log('');
  console.log('⚠️  경고: 이 작업은 기존 데이터베이스를 완전히 덮어씁니다!');
  console.log('');
  console.log(`   호스트: ${config.host}:${config.port}`);
  console.log(`   데이터베이스: ${config.database}`);
  console.log(`   백업 파일: ${BACKUP_FILE}`);
  console.log('');

  const confirmed = await askConfirmation('계속하시겠습니까? (yes/no): ');

  if (!confirmed) {
    console.log('복구 작업이 취소되었습니다.');
    process.exit(0);
  }

  console.log('');
  console.log('🔄 데이터베이스 복구 시작...');

  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // SQL 파일 읽기
    const sqlContent = fs.readFileSync(BACKUP_FILE, 'utf8');

    // SQL 문을 세미콜론으로 분리하여 실행
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 ${statements.length}개의 SQL 구문 실행 중...`);

    let executedCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        await client.query(statement);
        executedCount++;

        // 진행 상황 표시 (100개마다)
        if (executedCount % 100 === 0) {
          process.stdout.write(`\r   처리: ${executedCount}/${statements.length}`);
        }
      } catch (error) {
        errorCount++;
        // 일부 오류는 무시 (예: 테이블이 이미 존재하지 않는 경우)
        if (error instanceof Error && !error.message.includes('does not exist')) {
          console.error(`\n⚠️  SQL 실행 오류: ${error.message}`);
        }
      }
    }

    console.log(`\r   처리: ${executedCount}/${statements.length}`);
    console.log('');
    console.log('✅ 복구 완료!');
    console.log(`   성공: ${executedCount}개`);
    if (errorCount > 0) {
      console.log(`   경고: ${errorCount}개 (무시됨)`);
    }
    console.log('   데이터베이스가 성공적으로 복구되었습니다.');
  } catch (error) {
    console.error('');
    console.error('❌ 복구 실패!');
    if (error instanceof Error) {
      console.error(`   오류: ${error.message}`);
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

restore();

