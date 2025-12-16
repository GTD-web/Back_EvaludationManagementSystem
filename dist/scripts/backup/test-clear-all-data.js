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
const readline = __importStar(require("readline"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
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
async function askConfirmation(question) {
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
async function clearAllData() {
    console.log('⚠️  경고: 이 작업은 모든 데이터를 삭제합니다!');
    console.log('   (테이블 구조는 유지됩니다)');
    console.log('');
    console.log(`   호스트: ${config.host}:${config.port}`);
    console.log(`   데이터베이스: ${config.database}`);
    console.log('');
    const confirmed = await askConfirmation('정말로 모든 데이터를 삭제하시겠습니까? (yes/no): ');
    if (!confirmed) {
        console.log('작업이 취소되었습니다.');
        process.exit(0);
    }
    const client = new pg_1.Client(config);
    try {
        await client.connect();
        console.log('');
        console.log('✅ 데이터베이스 연결 성공');
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
        console.log('');
        console.log('🗑️  데이터 삭제 시작...');
        await client.query('BEGIN');
        await client.query("SET session_replication_role = 'replica'");
        for (const table of tables) {
            try {
                await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
                console.log(`   ✓ ${table}`);
            }
            catch (error) {
                console.error(`   ✗ ${table} - ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        await client.query("SET session_replication_role = 'origin'");
        await client.query('COMMIT');
        console.log('');
        console.log('✅ 모든 데이터가 삭제되었습니다!');
        console.log('');
        console.log('📊 데이터 확인 중...');
        for (const table of tables) {
            const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
            const count = parseInt(countResult.rows[0].count);
            console.log(`   - ${table}: ${count}행`);
        }
        console.log('');
        console.log('💡 이제 백업 복구를 테스트할 수 있습니다:');
        console.log('   npm run db:restore');
    }
    catch (error) {
        console.error('');
        console.error('❌ 작업 실패!');
        if (error instanceof Error) {
            console.error(`   오류: ${error.message}`);
        }
        try {
            await client.query('ROLLBACK');
            console.log('   (변경사항이 롤백되었습니다)');
        }
        catch (rollbackError) {
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
clearAllData();
//# sourceMappingURL=test-clear-all-data.js.map