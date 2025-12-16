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
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const BACKUP_DIR = path.join(__dirname, 'dumps');
const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .split('.')[0];
const BACKUP_FILE = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);
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
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
try {
    const pgDumpCmd = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --no-owner --no-acl --clean --if-exists -f "${BACKUP_FILE}"`;
    const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
    (0, child_process_1.execSync)(pgDumpCmd, {
        env,
        stdio: 'inherit',
    });
    const stats = fs.statSync(BACKUP_FILE);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('');
    console.log('✅ 백업 완료!');
    console.log(`   파일: ${BACKUP_FILE}`);
    console.log(`   크기: ${fileSizeInMB} MB`);
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
    if (error instanceof Error &&
        error.message.includes('pg_dump') &&
        (error.message.includes('not found') ||
            error.message.includes('not recognized'))) {
        console.error('');
        console.error('💡 PostgreSQL 클라이언트 도구가 설치되어 있지 않습니다.');
        console.error('');
        console.error('설치 방법:');
        console.error('  - Windows: https://www.postgresql.org/download/windows/');
        console.error('  - Mac: brew install postgresql');
        console.error('  - Linux: sudo apt-get install postgresql-client');
        console.error('');
        console.error('또는 Docker를 사용하는 경우:');
        console.error('  docker run --rm -v "%cd%/scripts/backup/dumps:/backup" postgres:15 pg_dump ...');
    }
    process.exit(1);
}
//# sourceMappingURL=backup.js.map