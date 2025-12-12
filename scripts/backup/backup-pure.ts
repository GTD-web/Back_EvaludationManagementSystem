import { Client } from 'pg';
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
    sqlContent += `-- PostgreSQL Database Backup\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Database: ${config.database}\n\n`;
    sqlContent += `SET statement_timeout = 0;\n`;
    sqlContent += `SET lock_timeout = 0;\n`;
    sqlContent += `SET client_encoding = 'UTF8';\n\n`;

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
      console.log(`   - 백업 중: ${tableName}`);

      // 기존 테이블 삭제 구문
      sqlContent += `\n-- Table: ${tableName}\n`;
      sqlContent += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n\n`;

      // 테이블 생성 구문
      const createTableResult = await client.query(`
        SELECT 
          'CREATE TABLE "' || table_name || '" (' || 
          string_agg(
            '"' || column_name || '" ' || 
            CASE 
              WHEN data_type = 'USER-DEFINED' THEN udt_name
              WHEN data_type = 'ARRAY' THEN udt_name
              ELSE data_type
            END ||
            CASE 
              WHEN character_maximum_length IS NOT NULL 
              THEN '(' || character_maximum_length || ')'
              ELSE ''
            END ||
            CASE 
              WHEN is_nullable = 'NO' THEN ' NOT NULL'
              ELSE ''
            END ||
            CASE 
              WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
              ELSE ''
            END,
            ', '
          ) || ');' as create_table
        FROM information_schema.columns
        WHERE table_name = $1
          AND table_schema = 'public'
        GROUP BY table_name;
      `, [tableName]);

      if (createTableResult.rows.length > 0) {
        sqlContent += createTableResult.rows[0].create_table + '\n\n';
      }

      // 테이블 데이터 백업
      const dataResult = await client.query(`SELECT * FROM "${tableName}"`);

      if (dataResult.rows.length > 0) {
        // 컬럼 목록
        const columns = Object.keys(dataResult.rows[0]);
        const columnsList = columns.map((col) => `"${col}"`).join(', ');

        for (const row of dataResult.rows) {
          const values = columns.map((col) => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'boolean') return value ? 'true' : 'false';
            if (typeof value === 'number') return value.toString();
            if (value instanceof Date) return `'${value.toISOString()}'`;
            if (typeof value === 'object')
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return `'${String(value).replace(/'/g, "''")}'`;
          });

          sqlContent += `INSERT INTO "${tableName}" (${columnsList}) VALUES (${values.join(', ')});\n`;
        }
        sqlContent += '\n';
      }
    }

    // 3. Primary Key, Foreign Key, Index 백업
    console.log('🔑 제약조건 및 인덱스 조회 중...');

    // Primary Keys
    const pkResult = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
      GROUP BY tc.table_name, tc.constraint_name;
    `);

    sqlContent += '\n-- Primary Keys\n';
    for (const row of pkResult.rows) {
      sqlContent += `ALTER TABLE "${row.table_name}" ADD CONSTRAINT "${row.constraint_name}" PRIMARY KEY (${row.columns});\n`;
    }

    // Foreign Keys
    const fkResult = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
    `);

    sqlContent += '\n-- Foreign Keys\n';
    for (const row of fkResult.rows) {
      sqlContent += `ALTER TABLE "${row.table_name}" ADD CONSTRAINT "${row.constraint_name}" FOREIGN KEY ("${row.column_name}") REFERENCES "${row.foreign_table_name}" ("${row.foreign_column_name}");\n`;
    }

    // Indexes
    const indexResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey';
    `);

    sqlContent += '\n-- Indexes\n';
    for (const row of indexResult.rows) {
      sqlContent += `${row.indexdef};\n`;
    }

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

