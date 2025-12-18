import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 백업 설정 (자동 백업 디렉토리들)
const BACKUP_ROOT = path.join(__dirname, '..', '..', 'backup');
const BACKUP_DIRS = [
  path.join(BACKUP_ROOT, 'hourly'),
  path.join(BACKUP_ROOT, 'daily'),
  path.join(BACKUP_ROOT, 'weekly'),
  path.join(BACKUP_ROOT, 'monthly'),
  path.join(BACKUP_ROOT, 'yearly'),
  path.join(__dirname, 'dumps'), // 수동 백업 디렉토리도 포함
];

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

async function askSelection(
  question: string,
  options: string[],
): Promise<number> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const selection = parseInt(answer, 10);
      resolve(selection);
    });
  });
}

async function restore() {
  // 백업 파일 결정
  if (!BACKUP_FILE) {
    // 1단계: 백업 타입별로 파일 수집
    const filesByType = new Map<
      string,
      Array<{
        name: string;
        path: string;
        mtime: Date;
        dir: string;
      }>
    >();

    for (const dir of BACKUP_DIRS) {
      if (fs.existsSync(dir)) {
        const dirName = path.basename(dir);
        const files = fs
          .readdirSync(dir)
          .filter((file) => file.startsWith('backup-') && file.endsWith('.sql'))
          .map((file) => ({
            name: file,
            path: path.join(dir, file),
            mtime: fs.statSync(path.join(dir, file)).mtime,
            dir: dirName,
          }))
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

        if (files.length > 0) {
          filesByType.set(dirName, files);
        }
      }
    }

    if (filesByType.size === 0) {
      console.error('❌ 백업 파일을 찾을 수 없습니다.');
      console.error('   확인한 디렉토리:');
      BACKUP_DIRS.forEach((dir) => {
        console.error(`   - ${dir}`);
      });
      process.exit(1);
    }

    // 1단계: 백업 타입 선택
    console.log('');
    console.log('📂 백업 타입을 선택하세요:');
    console.log('');

    const typeDescriptions = {
      hourly: '4시간마다 (최근 24시간, 6개 유지)',
      daily: '매일 자정 (30일 보관)',
      weekly: '매주 일요일 (12주 보관)',
      monthly: '매월 1일 (12개월 보관)',
      yearly: '분기말/연말 (수동 관리)',
      dumps: '수동 백업 (30일 보관)',
    };

    const availableTypes = Array.from(filesByType.keys());
    availableTypes.forEach((type, index) => {
      const count = filesByType.get(type)!.length;
      const desc = typeDescriptions[type] || type;
      console.log(`  ${index + 1}. ${type.padEnd(10)} - ${desc} (${count}개)`);
    });

    console.log('');
    console.log('  0. 취소');
    console.log('');

    const typeSelection = await askSelection(
      `백업 타입 번호를 선택하세요 (1-${availableTypes.length}): `,
      availableTypes,
    );

    if (typeSelection === 0) {
      console.log('복구 작업이 취소되었습니다.');
      process.exit(0);
    }

    if (
      typeSelection < 1 ||
      typeSelection > availableTypes.length ||
      isNaN(typeSelection)
    ) {
      console.error('❌ 잘못된 선택입니다.');
      process.exit(1);
    }

    const selectedType = availableTypes[typeSelection - 1];
    const filesOfType = filesByType.get(selectedType)!;

    // 2단계: 해당 타입의 백업 파일 선택
    console.log('');
    console.log(`📋 ${selectedType} 백업 파일 목록:`);
    console.log('');

    // 최대 20개까지만 표시
    const displayFiles = filesOfType.slice(0, 20);
    displayFiles.forEach((file, index) => {
      const timeStr = file.mtime.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
      });
      const sizeInKB = (fs.statSync(file.path).size / 1024).toFixed(1);
      console.log(`  ${(index + 1).toString().padStart(2)}. ${file.name}`);
      console.log(`      ${timeStr} (${sizeInKB} KB)`);
    });

    if (filesOfType.length > 20) {
      console.log(`  ... 외 ${filesOfType.length - 20}개 파일`);
    }

    console.log('');
    console.log('  0. 취소');
    console.log('');

    // 사용자 입력 받기
    const fileSelection = await askSelection(
      `복구할 백업 파일 번호를 선택하세요 (1-${displayFiles.length}): `,
      displayFiles.map((f) => f.name),
    );

    if (fileSelection === 0) {
      console.log('복구 작업이 취소되었습니다.');
      process.exit(0);
    }

    if (
      fileSelection < 1 ||
      fileSelection > displayFiles.length ||
      isNaN(fileSelection)
    ) {
      console.error('❌ 잘못된 선택입니다.');
      process.exit(1);
    }

    const selectedFile = displayFiles[fileSelection - 1];
    BACKUP_FILE = selectedFile.path;

    console.log('');
    console.log(`✅ 선택된 파일: ${selectedFile.name}`);
    console.log(`   타입: ${selectedType}`);
    console.log(`   위치: backup/${selectedFile.dir}/`);
    console.log(
      `   생성 시간: ${selectedFile.mtime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
    );
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
  console.log(`   호스트: ${config.host}:${config.port}`);
  console.log(`   데이터베이스: ${config.database}`);
  console.log(`   백업 파일: ${path.basename(BACKUP_FILE)}`);
  console.log('');

  const confirmed = await askConfirmation('계속하시겠습니까? (yes/no): ');

  if (!confirmed) {
    console.log('복구 작업이 취소되었습니다.');
    process.exit(0);
  }

  console.log('');
  console.log('🔄 데이터베이스 복구 시작...');
  console.log('');
  console.log('📝 복구 전략:');
  console.log('   1. 모든 테이블의 데이터를 TRUNCATE로 삭제');
  console.log('   2. 백업 파일의 데이터를 그대로 INSERT');
  console.log('   3. UUID가 백업 당시의 값으로 복구됨');
  console.log('   4. FK 관계도 모두 유지됨');
  console.log(
    '   5. 서버가 켜져 있어도 다음 SSO 동기화 시 externalId로 매칭되어 UUID 유지',
  );
  console.log('');

  const client = new Client(config);

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // SQL 파일 읽기
    const sqlContent = fs.readFileSync(BACKUP_FILE, 'utf8');

    // SQL 문을 더 정확하게 분리 (문자열 내부의 세미콜론 무시)
    const statements: string[] = [];
    let currentStatement = '';
    let insideString = false;
    let stringDelimiter = '';

    for (let i = 0; i < sqlContent.length; i++) {
      const char = sqlContent[i];
      const prevChar = i > 0 ? sqlContent[i - 1] : '';

      // 문자열 시작/종료 감지 (escape된 따옴표 무시)
      if ((char === "'" || char === '"') && prevChar !== '\\') {
        if (!insideString) {
          insideString = true;
          stringDelimiter = char;
        } else if (char === stringDelimiter) {
          insideString = false;
          stringDelimiter = '';
        }
      }

      // 세미콜론이 문자열 밖에 있을 때만 구문 구분자로 인식
      if (char === ';' && !insideString) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0 && !stmt.startsWith('--')) {
          statements.push(stmt);
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }

    // 마지막 구문 추가
    const lastStmt = currentStatement.trim();
    if (lastStmt.length > 0 && !lastStmt.startsWith('--')) {
      statements.push(lastStmt);
    }

    console.log(`📝 ${statements.length}개의 SQL 구문 실행 중...`);

    let executedCount = 0;
    let errorCount = 0;
    let criticalErrorCount = 0;

    // 무시해도 되는 오류 패턴 (백업 복구 시 예상되는 오류들)
    const ignorableErrors = [
      'already exists',
      'does not exist',
      'multiple primary keys',
      'relation "IDX_',
      'relation "PK_',
      'relation "UQ_',
      'relation "FK_',
      'constraint "FK_',
      'constraint "PK_',
      'constraint "UQ_',
    ];

    const shouldIgnoreError = (errorMessage: string): boolean => {
      return ignorableErrors.some((pattern) =>
        errorMessage.toLowerCase().includes(pattern.toLowerCase()),
      );
    };

    for (const statement of statements) {
      try {
        await client.query(statement);
        executedCount++;

        // 진행 상황 표시 (100개마다)
        if (executedCount % 100 === 0) {
          process.stdout.write(
            `\r   처리: ${executedCount}/${statements.length}`,
          );
        }
      } catch (error) {
        errorCount++;

        // 중요한 오류만 표시
        if (error instanceof Error && !shouldIgnoreError(error.message)) {
          criticalErrorCount++;
          console.error(`\n⚠️  중요 오류: ${error.message}`);
        }
      }
    }

    console.log(`\r   처리: ${executedCount}/${statements.length}`);
    console.log('');
    console.log('✅ 복구 완료!');
    console.log(`   성공: ${executedCount}개`);
    if (errorCount > 0) {
      console.log(
        `   무시됨: ${errorCount - criticalErrorCount}개 (예상된 중복)`,
      );
    }
    if (criticalErrorCount > 0) {
      console.log(`   ⚠️  경고: ${criticalErrorCount}개의 중요 오류`);
    }
    console.log('   데이터베이스가 성공적으로 복구되었습니다.');
    console.log('');
    console.log('💡 복구된 데이터:');
    console.log('   - roles: 백업 당시의 역할 정보 복구됨');
    console.log('   - isAccessible: 백업 당시의 접근 권한 복구됨');
    console.log('   - UUID: 백업 당시의 UUID로 완전 복구됨');
    console.log('');
    console.log('💡 다음 SSO 동기화 시:');
    console.log('   - externalId로 기존 직원을 찾아 UUID를 유지합니다.');
    console.log(
      '   - roles와 isAccessible은 변경되지 않습니다 (기존 값 유지).',
    );
    console.log('   - 로그인 시에만 roles가 SSO에서 업데이트됩니다.');
    console.log('');
    console.log('⚠️  중요: 동기화 보호 설정');
    console.log('   백업 복구 직후 동기화로 인한 데이터 손실을 방지하려면:');
    console.log('   1. SYNC_DELETE_MISSING_EMPLOYEES=false (환경 변수)');
    console.log('   2. SYNC_DELETE_MISSING_DEPARTMENTS=false (환경 변수)');
    console.log('   3. 이미 24시간 보호 로직이 적용되어 있습니다.');
  } catch (error) {
    console.error('');
    console.error('❌ 복구 실패!');
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
    }
  }
}

restore();
