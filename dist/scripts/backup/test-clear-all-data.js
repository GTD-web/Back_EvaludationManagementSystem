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
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 30000,
    query_timeout: 600000,
    statement_timeout: 600000,
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
async function checkAndTerminateBlockingConnections(client) {
    console.log('');
    console.log('🔍 데이터베이스 잠금 확인 중...');
    const activeConnectionsResult = await client.query(`
    SELECT 
      pid,
      usename,
      application_name,
      state,
      query,
      state_change
    FROM pg_stat_activity 
    WHERE datname = current_database()
      AND pid != pg_backend_pid()
      AND state != 'idle'
    ORDER BY state_change;
  `);
    if (activeConnectionsResult.rows.length > 0) {
        console.log(`   ⚠️  ${activeConnectionsResult.rows.length}개의 활성 연결 발견`);
        for (const row of activeConnectionsResult.rows) {
            console.log(`      - PID ${row.pid}: ${row.application_name} (${row.state})`);
        }
        const terminate = await askConfirmation('\n   이 연결들을 강제 종료하시겠습니까? (yes/no): ');
        if (terminate) {
            for (const row of activeConnectionsResult.rows) {
                try {
                    await client.query(`SELECT pg_terminate_backend(${row.pid})`);
                    console.log(`   ✓ PID ${row.pid} 종료됨`);
                }
                catch (error) {
                    console.log(`   ✗ PID ${row.pid} 종료 실패`);
                }
            }
        }
        else {
            console.log('   ⚠️  다른 연결이 활성화되어 있으면 삭제가 느려지거나 실패할 수 있습니다.');
        }
    }
    else {
        console.log('   ✓ 활성 연결 없음');
    }
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
        await checkAndTerminateBlockingConnections(client);
        console.log('');
        console.log('🗑️  데이터 삭제 시작...');
        await client.query('SET statement_timeout = 600000');
        console.log('   - Statement timeout: 10분');
        await client.query('SET lock_timeout = 300000');
        console.log('   - Lock timeout: 5분');
        await client.query("SET session_replication_role = 'replica'");
        console.log('   - Foreign Key 제약조건 비활성화');
        let successCount = 0;
        let errorCount = 0;
        console.log('');
        console.log('   개별 테이블 삭제 시작...');
        for (const table of tables) {
            try {
                const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
                const rowCount = parseInt(countResult.rows[0].count);
                if (rowCount === 0) {
                    console.log(`   - ${table} (이미 비어있음)`);
                    successCount++;
                    continue;
                }
                console.log(`   🔄 ${table} 삭제 중... (${rowCount.toLocaleString()}행)`);
                const startTime = Date.now();
                await client.query(`DELETE FROM "${table}"`);
                await client.query(`SELECT setval(pg_get_serial_sequence('"${table}"', column_name), 1, false) 
           FROM information_schema.columns 
           WHERE table_name = '${table}' 
             AND column_default LIKE 'nextval%'`);
                const duration = Date.now() - startTime;
                console.log(`   ✓ ${table} 완료 (${duration}ms)`);
                successCount++;
            }
            catch (error) {
                console.error(`   ✗ ${table} - ${error instanceof Error ? error.message : 'Unknown error'}`);
                errorCount++;
            }
        }
        await client.query("SET session_replication_role = 'origin'");
        console.log('');
        console.log('   - Foreign Key 제약조건 활성화');
        console.log('');
        console.log(`📊 삭제 결과: 성공 ${successCount}개, 실패 ${errorCount}개`);
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