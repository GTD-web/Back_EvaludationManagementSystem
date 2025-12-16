/**
 * Node.js 기반 데이터베이스 백업 스크립트
 * pg_dump 없이 Node.js로 직접 백업
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 환경 변수 로드
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, 'dumps');
const TIMESTAMP = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '-')
  .slice(0, 19);
const BACKUP_FILE = path.join(BACKUP_DIR, `backup-${TIMESTAMP}.sql`);

// 데이터베이스 연결 정보
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || 5432;
const DB_USER = process.env.DATABASE_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DATABASE_PASSWORD || '';
const DB_NAME = process.env.DATABASE_NAME || 'ems';

console.log('📦 데이터베이스 백업 시작...');
console.log(`   호스트: ${DB_HOST}:${DB_PORT}`);
console.log(`   데이터베이스: ${DB_NAME}`);
console.log(`   백업 파일: ${BACKUP_FILE}`);
console.log('');

async function backup() {
  try {
    // 백업 디렉토리 생성
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // pg_dump 명령어 구성
    const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-owner --no-acl --clean --if-exists -f "${BACKUP_FILE}"`;

    // 환경 변수에 비밀번호 설정
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

    // 백업 실행
    await execAsync(command, { env, maxBuffer: 1024 * 1024 * 100 }); // 100MB 버퍼

    // 파일 크기 확인
    const stats = fs.statSync(BACKUP_FILE);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('');
    console.log('✅ 백업 완료!');
    console.log(`   파일: ${BACKUP_FILE}`);
    console.log(`   크기: ${fileSizeMB} MB`);

    // 30일 이상 된 백업 파일 삭제
    console.log('');
    console.log('🗑️  오래된 백업 파일 정리...');
    cleanOldBackups();
    console.log('   (30일 이상 된 파일 삭제 완료)');
  } catch (error) {
    console.log('');
    console.log('❌ 백업 실패!');
    console.error('오류:', error.message);

    // pg_dump가 설치되지 않은 경우 안내
    if (error.message.includes('pg_dump')) {
      console.log('');
      console.log('💡 pg_dump를 찾을 수 없습니다.');
      console.log('   PostgreSQL 클라이언트 도구를 설치해주세요:');
      console.log('   - Windows: https://www.postgresql.org/download/windows/');
      console.log('   - Mac: brew install postgresql');
      console.log('   - Linux: sudo apt-get install postgresql-client');
    }

    process.exit(1);
  }
}

function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  files
    .filter((file) => file.startsWith('backup-') && file.endsWith('.sql'))
    .forEach((file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`   삭제: ${file}`);
      }
    });
}

backup();

