import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 백업 설정
const BACKUP_DIR = path.join(__dirname, 'dumps');

// 한국 시간(KST) 유틸리티 함수
function getKSTDate(): Date {
  const now = new Date();
  // 한국 시간으로 변환 (UTC+9)
  const kstOffset = 9 * 60; // 9시간을 분으로
  return new Date(now.getTime() + kstOffset * 60 * 1000);
}

function getKSTTimestamp(): string {
  const kstTime = getKSTDate();
  // ISO 형식의 문자열 생성 후 포맷팅
  const formatted = kstTime
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .split('.')[0];
  return `${formatted}-KST`;
}

const timestamp = getKSTTimestamp();
const BACKUP_FILE = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

// 데이터베이스 연결 정보
const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  user: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'ems',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

console.log('📦 데이터베이스 백업 시작...');
console.log(`   호스트: ${config.host}:${config.port}`);
console.log(`   데이터베이스: ${config.database}`);
console.log(`   백업 파일: ${BACKUP_FILE}`);
console.log('');

// dumps 디렉토리가 없으면 생성
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backup() {
  const client = new Client(config);
  let sqlContent = '';

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // SQL 헤더
    sqlContent += `-- PostgreSQL Database Backup (Data Only)\n`;
    sqlContent += `-- Generated: ${getKSTDate().toISOString()} (KST)\n`;
    sqlContent += `-- Database: ${config.database}\n`;
    sqlContent += `-- Note: 이 백업은 데이터만 포함합니다. 테이블 구조는 TypeORM이 관리합니다.\n\n`;
    sqlContent += `SET statement_timeout = 0;\n`;
    sqlContent += `SET lock_timeout = 0;\n`;
    sqlContent += `SET client_encoding = 'UTF8';\n\n`;
    sqlContent += `-- UUID와 FK 관계를 보존하기 위해 기존 데이터를 모두 삭제하고 백업 데이터로 교체합니다.\n\n`;

    // 1. 모든 테이블 목록 가져오기
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

    // 2. 각 테이블의 스키마 및 데이터 백업
    for (const tableName of tables) {
      // 테이블 데이터 삭제 구문 (구조는 유지)
      sqlContent += `\n-- Table: ${tableName}\n`;
      sqlContent += `TRUNCATE TABLE "${tableName}" CASCADE;\n\n`;

      // 테이블 생성 구문은 생략 (이미 존재하는 테이블 구조 사용)
      // TypeORM이 스키마를 관리하므로 데이터만 백업

      // 테이블 데이터 백업
      const dataResult = await client.query(`SELECT * FROM "${tableName}"`);

      if (dataResult.rows.length > 0) {
        console.log(`   - 백업 중: ${tableName} (${dataResult.rows.length}행)`);

        // 컬럼 목록
        const columns = Object.keys(dataResult.rows[0]);
        const columnsList = columns.map((col) => `"${col}"`).join(', ');

        // employee 테이블의 경우 isAccessible 값 분포 확인
        if (tableName === 'employee' && columns.includes('isAccessible')) {
          const accessibleTrue = dataResult.rows.filter(
            (r) => r.isAccessible === true,
          ).length;
          const accessibleFalse = dataResult.rows.filter(
            (r) => r.isAccessible === false,
          ).length;
          console.log(
            `      → isAccessible: true=${accessibleTrue}, false=${accessibleFalse}`,
          );
        }

        for (const row of dataResult.rows) {
          const values = columns.map((col) => {
            const value = row[col];

            // NULL 값 처리
            if (value === null || value === undefined) {
              return 'NULL';
            }

            // Boolean 값 처리 (명시적 확인)
            if (typeof value === 'boolean') {
              return value === true ? 'true' : 'false';
            }

            // 숫자 값 처리
            if (typeof value === 'number') {
              return value.toString();
            }

            // Date 값 처리
            if (value instanceof Date) {
              return `'${value.toISOString()}'`;
            }

            // 객체/배열 값 처리 (JSON)
            if (typeof value === 'object') {
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            }

            // 문자열 값 처리
            return `'${String(value).replace(/'/g, "''")}'`;
          });

          sqlContent += `INSERT INTO "${tableName}" (${columnsList}) VALUES (${values.join(', ')});\n`;
        }
        sqlContent += '\n';
      }
    }

    // 제약조건과 인덱스는 TypeORM이 관리하므로 백업하지 않음
    console.log('✅ 데이터 백업 완료 (제약조건은 TypeORM이 관리)');

    // 파일 저장
    fs.writeFileSync(BACKUP_FILE, sqlContent, 'utf8');

    // 파일 크기 확인
    const stats = fs.statSync(BACKUP_FILE);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('');
    console.log('✅ 백업 완료!');
    console.log(`   파일: ${BACKUP_FILE}`);
    console.log(`   크기: ${fileSizeInMB} MB`);
    console.log(`   테이블: ${tables.length}개`);

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
    process.exit(1);
  } finally {
    // 연결 종료 (이미 서버에서 끊긴 경우 에러 무시)
    try {
      await client.end();
    } catch (endError) {
      // Supabase pooler가 이미 연결을 끊은 경우 발생하는 에러 무시
      // 백업은 이미 완료되었으므로 문제없음
    }
  }
}

backup();
