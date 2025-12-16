/**
 * Node.js 기반 데이터베이스 복구 스크립트
 * psql 없이 Node.js로 직접 복구
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readline = require('readline');

const execAsync = promisify(exec);

// 환경 변수 로드
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, 'dumps');

// 데이터베이스 연결 정보
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_PORT = process.env.DATABASE_PORT || 5432;
const DB_USER = process.env.DATABASE_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DATABASE_PASSWORD || '';
const DB_NAME = process.env.DATABASE_NAME || 'ems';

async function restore() {
  try {
    // 백업 파일 결정
    const backupFile = process.argv[2] || findLatestBackup();

    if (!backupFile) {
      console.log('❌ 백업 파일을 찾을 수 없습니다.');
      console.log(`   경로: ${BACKUP_DIR}/`);
      process.exit(1);
    }

    if (!fs.existsSync(backupFile)) {
      console.log(`❌ 백업 파일이 존재하지 않습니다: ${backupFile}`);
      process.exit(1);
    }

    console.log('📂 백업 파일:', backupFile);
    console.log('');
    console.log('⚠️  경고: 이 작업은 기존 데이터베이스를 완전히 덮어씁니다!');
    console.log('');
    console.log(`   호스트: ${DB_HOST}:${DB_PORT}`);
    console.log(`   데이터베이스: ${DB_NAME}`);
    console.log(`   백업 파일: ${backupFile}`);
    console.log('');

    // 사용자 확인
    const answer = await askQuestion('계속하시겠습니까? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('복구 작업이 취소되었습니다.');
      process.exit(0);
    }

    console.log('');
    console.log('🔄 데이터베이스 복구 시작...');

    // psql 명령어 구성
    const command = `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${backupFile}"`;

    // 환경 변수에 비밀번호 설정
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

    // 복구 실행
    await execAsync(command, { env, maxBuffer: 1024 * 1024 * 100 }); // 100MB 버퍼

    console.log('');
    console.log('✅ 복구 완료!');
    console.log('   데이터베이스가 성공적으로 복구되었습니다.');
  } catch (error) {
    console.log('');
    console.log('❌ 복구 실패!');
    console.error('오류:', error.message);

    // psql이 설치되지 않은 경우 안내
    if (error.message.includes('psql')) {
      console.log('');
      console.log('💡 psql을 찾을 수 없습니다.');
      console.log('   PostgreSQL 클라이언트 도구를 설치해주세요:');
      console.log('   - Windows: https://www.postgresql.org/download/windows/');
      console.log('   - Mac: brew install postgresql');
      console.log('   - Linux: sudo apt-get install postgresql-client');
    }

    process.exit(1);
  }
}

function findLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return null;
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.startsWith('backup-') && file.endsWith('.sql'))
    .map((file) => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);

  return files.length > 0 ? files[0].path : null;
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    }),
  );
}

restore();

