import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 백업 설정
const BACKUP_DIR = path.join(__dirname, 'dumps');
const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '-')
  .split('.')[0];
const BACKUP_FILE = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

// 데이터베이스 연결 정보
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || '5432';
const DB_USER = process.env.DATABASE_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DATABASE_PASSWORD || '';
const DB_NAME = process.env.DATABASE_NAME || 'ems';

console.log('📦 데이터베이스 백업 시작...');
console.log(`   호스트: ${DB_HOST}:${DB_PORT}`);
console.log(`   데이터베이스: ${DB_NAME}`);
console.log(`   백업 파일: ${BACKUP_FILE}`);
console.log('');

// dumps 디렉토리가 없으면 생성
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

try {
  // pg_dump 명령어 구성
  const pgDumpCmd = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-owner --no-acl --clean --if-exists -f "${BACKUP_FILE}"`;

  // 환경 변수에 비밀번호 설정
  const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

  // pg_dump 실행
  execSync(pgDumpCmd, {
    env,
    stdio: 'inherit',
  });

  // 파일 크기 확인
  const stats = fs.statSync(BACKUP_FILE);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('');
  console.log('✅ 백업 완료!');
  console.log(`   파일: ${BACKUP_FILE}`);
  console.log(`   크기: ${fileSizeInMB} MB`);

  // 30일 이상 된 백업 파일 자동 삭제
  console.log('');
  console.log('🗑️  오래된 백업 파일 정리...');
  const files = fs.readdirSync(BACKUP_DIR);
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  let deletedCount = 0;
  files.forEach((file) => {
    if (file.startsWith('backup-') && file.endsWith('.sql')) {
      const filePath = path.join(BACKUP_DIR, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.mtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
  });

  console.log(`   (30일 이상 된 파일 ${deletedCount}개 삭제 완료)`);
} catch (error) {
  console.error('');
  console.error('❌ 백업 실패!');
  if (error instanceof Error) {
    console.error(`   오류: ${error.message}`);
  }

  // pg_dump가 설치되지 않은 경우 안내 메시지
  if (
    error instanceof Error &&
    error.message.includes('pg_dump') &&
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
    console.error('');
    console.error('또는 Docker를 사용하는 경우:');
    console.error(
      '  docker run --rm -v "%cd%/scripts/backup/dumps:/backup" postgres:15 pg_dump ...',
    );
  }

  process.exit(1);
}

