"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const BACKUP_DIR = path.join(__dirname, 'dumps');
function getKSTDate() {
    const now = new Date();
    const kstOffset = 9 * 60;
    return new Date(now.getTime() + kstOffset * 60 * 1000);
}
function getKSTTimestamp() {
    const kstTime = getKSTDate();
    const formatted = kstTime
        .toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '-')
        .split('.')[0];
    return `${formatted}-KST`;
}
const timestamp = getKSTTimestamp();
const BACKUP_FILE = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);
const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'ems',
    ssl: process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
};
console.log('📦 데이터베이스 백업 시작...');
console.log(`   호스트: ${config.host}:${config.port}`);
console.log(`   데이터베이스: ${config.database}`);
console.log(`   백업 파일: ${BACKUP_FILE}`);
console.log('');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
async function backup() {
    const client = new pg_1.Client(config);
    let sqlContent = '';
    try {
        await client.connect();
        console.log('✅ 데이터베이스 연결 성공');
        sqlContent += `-- PostgreSQL Database Backup (Data Only)\n`;
        sqlContent += `-- Generated: ${getKSTDate().toISOString()} (KST)\n`;
        sqlContent += `-- Database: ${config.database}\n`;
        sqlContent += `-- Note: 이 백업은 데이터만 포함합니다. 테이블 구조는 TypeORM이 관리합니다.\n\n`;
        sqlContent += `SET statement_timeout = 0;\n`;
        sqlContent += `SET lock_timeout = 0;\n`;
        sqlContent += `SET client_encoding = 'UTF8';\n\n`;
        sqlContent += `-- UUID와 FK 관계를 보존하기 위해 기존 데이터를 모두 삭제하고 백업 데이터로 교체합니다.\n\n`;
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
        for (const tableName of tables) {
            console.log(`   - 백업 중: ${tableName}`);
            sqlContent += `\n-- Table: ${tableName}\n`;
            sqlContent += `TRUNCATE TABLE "${tableName}" CASCADE;\n\n`;
            const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
            if (dataResult.rows.length > 0) {
                const columns = Object.keys(dataResult.rows[0]);
                const columnsList = columns.map((col) => `"${col}"`).join(', ');
                for (const row of dataResult.rows) {
                    const values = columns.map((col) => {
                        const value = row[col];
                        if (value === null)
                            return 'NULL';
                        if (typeof value === 'boolean')
                            return value ? 'true' : 'false';
                        if (typeof value === 'number')
                            return value.toString();
                        if (value instanceof Date)
                            return `'${value.toISOString()}'`;
                        if (typeof value === 'object')
                            return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
                        return `'${String(value).replace(/'/g, "''")}'`;
                    });
                    sqlContent += `INSERT INTO "${tableName}" (${columnsList}) VALUES (${values.join(', ')});\n`;
                }
                sqlContent += '\n';
            }
        }
        console.log('✅ 데이터 백업 완료 (제약조건은 TypeORM이 관리)');
        fs.writeFileSync(BACKUP_FILE, sqlContent, 'utf8');
        const stats = fs.statSync(BACKUP_FILE);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log('');
        console.log('✅ 백업 완료!');
        console.log(`   파일: ${BACKUP_FILE}`);
        console.log(`   크기: ${fileSizeInMB} MB`);
        console.log(`   테이블: ${tables.length}개`);
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
    }
    catch (error) {
        console.error('');
        console.error('❌ 백업 실패!');
        if (error instanceof Error) {
            console.error(`   오류: ${error.message}`);
        }
        process.exit(1);
    }
    finally {
        try {
            await client.end();
        }
        catch (endError) {
        }
    }
}
backup();
//# sourceMappingURL=backup-pure.js.map