import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 백업 설정
const BACKUP_DIR = path.join(__dirname, 'dumps');

// 데이터베이스 연결 정보
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '5432';
const DB_USER = process.env.DATABASE_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DATABASE_PASSWORD || '';
const DB_NAME = process.env.DATABASE_NAME || 'ems';

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

async function main() {
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
  console.log(`   호스트: ${DB_HOST}:${DB_PORT}`);
  console.log(`   데이터베이스: ${DB_NAME}`);
  console.log(`   백업 파일: ${BACKUP_FILE}`);
  console.log('');

  const confirmed = await askConfirmation('계속하시겠습니까? (yes/no): ');

  if (!confirmed) {
    console.log('복구 작업이 취소되었습니다.');
    process.exit(0);
  }

  console.log('');
  console.log('🔄 데이터베이스 복구 시작...');

  try {
    // psql 명령어 구성
    const psqlCmd = `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${BACKUP_FILE}"`;

    // 환경 변수에 비밀번호 설정
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

    // psql 실행
    execSync(psqlCmd, {
      env,
      stdio: 'inherit',
    });

    console.log('');
    console.log('✅ 복구 완료!');
    console.log('   데이터베이스가 성공적으로 복구되었습니다.');
  } catch (error) {
    console.error('');
    console.error('❌ 복구 실패!');
    if (error instanceof Error) {
      console.error(`   오류: ${error.message}`);
    }

    // psql이 설치되지 않은 경우 안내 메시지
    if (
      error instanceof Error &&
      error.message.includes('psql') &&
      (error.message.includes('not found') ||
        error.message.includes('not recognized'))
    ) {
      console.error('');
      console.error('💡 PostgreSQL 클라이언트 도구가 설치되어 있지 않습니다.');
      console.error('');
      console.error('설치 방법:');
      console.error('  - Windows: https://www.postgresql.org/download/windows/');
      console.error('  - Mac: brew install postgresql');
      console.error('  - Linux: sudo apt-get install postgresql-client');
    }

    process.exit(1);
  }
}

main();

