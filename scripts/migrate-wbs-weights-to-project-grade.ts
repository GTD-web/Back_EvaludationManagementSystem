/**
 * WBS 가중치를 프로젝트 등급 기반으로 재계산하는 스크립트
 * 
 * 사용법:
 *   # 1단계: 통계 정보 확인 (기본)
 *   npm run migrate:wbs-weights
 *   
 *   # 2단계: 실제 마이그레이션 실행
 *   npm run migrate:wbs-weights -- --execute
 */

import { DataSource, IsNull } from 'typeorm';
import { config } from 'dotenv';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { WbsAssignmentWeightCalculationService } from '../src/context/evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service';
import { EvaluationWbsAssignment } from '../src/domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationProjectAssignment } from '../src/domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationPeriod } from '../src/domain/core/evaluation-period/evaluation-period.entity';
import { Project } from '../src/domain/common/project/project.entity';

// .env 파일 로드
config();

interface MigrationStats {
  totalPeriods: number;
  totalEmployees: number;
  totalEmployeePeriodCombinations: number;
  totalWbsAssignments: number;
  assignmentsWithProjectGrade: number;
  assignmentsWithoutProjectGrade: number;
  assignmentsWithZeroWeight: number;
  assignmentsWithNonZeroWeight: number;
  periodDetails: Array<{
    periodId: string;
    periodName: string;
    maxSelfEvaluationRate: number;
    employeeCount: number;
    wbsAssignmentCount: number;
  }>;
}

/**
 * 데이터베이스 백업 수행
 */
async function performBackup(): Promise<string> {
  console.log('\n' + '='.repeat(80));
  console.log('💾 데이터베이스 백업 시작...');
  console.log('='.repeat(80));

  const BACKUP_DIR = path.join(__dirname, '..', 'backup', 'migration');
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '-')
    .split('.')[0];
  const BACKUP_FILE = path.join(
    BACKUP_DIR,
    `backup-wbs-weight-migration-${timestamp}.sql`,
  );

  // 백업 디렉토리 생성
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USERNAME || 'lumir_admin',
    password: process.env.DATABASE_PASSWORD || 'lumir_password_2024',
    database: process.env.DATABASE_NAME || 'lumir_project_management',
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  };

  console.log(`   호스트: ${config.host}:${config.port}`);
  console.log(`   데이터베이스: ${config.database}`);
  console.log(`   백업 파일: ${BACKUP_FILE}\n`);

  const client = new Client(config);
  let sqlContent = '';

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // SQL 헤더
    sqlContent += `-- PostgreSQL Database Backup (WBS Weight Migration)\n`;
    sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
    sqlContent += `-- Database: ${config.database}\n`;
    sqlContent += `-- Purpose: Pre-migration backup for WBS weight recalculation\n\n`;
    sqlContent += `SET statement_timeout = 0;\n`;
    sqlContent += `SET lock_timeout = 0;\n`;
    sqlContent += `SET client_encoding = 'UTF8';\n\n`;

    // evaluation_wbs_assignment 테이블만 백업 (가중치 관련)
    console.log('📋 WBS 할당 테이블 백업 중...');
    const tableName = 'evaluation_wbs_assignment';

    sqlContent += `\n-- Table: ${tableName}\n`;
    sqlContent += `-- Backup before weight recalculation\n\n`;

    // 테이블 데이터 백업
    const dataResult = await client.query(`SELECT * FROM "${tableName}"`);

    if (dataResult.rows.length > 0) {
      console.log(`   - 백업 중: ${tableName} (${dataResult.rows.length}행)`);

      // 컬럼 목록
      const columns = Object.keys(dataResult.rows[0]);
      const columnsList = columns.map((col) => `"${col}"`).join(', ');

      for (const row of dataResult.rows) {
        const values = columns.map((col) => {
          const value = row[col];

          // NULL 값 처리
          if (value === null || value === undefined) {
            return 'NULL';
          }

          // Boolean 값 처리
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

    console.log('✅ 데이터 백업 완료');

    // 파일 저장
    fs.writeFileSync(BACKUP_FILE, sqlContent, 'utf8');

    // 파일 크기 확인
    const stats = fs.statSync(BACKUP_FILE);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('');
    console.log('✅ 백업 완료!');
    console.log(`   파일: ${BACKUP_FILE}`);
    console.log(`   크기: ${fileSizeInMB} MB`);
    console.log('='.repeat(80) + '\n');

    return BACKUP_FILE;
  } catch (error: any) {
    console.error('');
    console.error('❌ 백업 실패!');
    if (error instanceof Error) {
      console.error(`   오류: ${error.message}`);
    }
    throw error;
  } finally {
    try {
      await client.end();
    } catch (endError) {
      // 연결 종료 에러 무시
    }
  }
}

async function previewMigration(): Promise<MigrationStats> {
  console.log('📊 WBS 가중치 마이그레이션 통계 정보 조회 중...\n');

  let dataSource: DataSource | null = null;

  try {
    // DataSource 생성
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'lumir_admin',
      password: process.env.DATABASE_PASSWORD || 'lumir_password_2024',
      database: process.env.DATABASE_NAME || 'lumir_project_management',
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      entities: [
        EvaluationWbsAssignment,
        EvaluationProjectAssignment,
        EvaluationPeriod,
        Project,
      ],
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const wbsAssignmentRepository =
      dataSource.getRepository(EvaluationWbsAssignment);
    const evaluationPeriodRepository =
      dataSource.getRepository(EvaluationPeriod);

    // 1. 모든 평가기간 조회
    const periods = await evaluationPeriodRepository.find({
      where: { deletedAt: IsNull() },
    });

    const stats: MigrationStats = {
      totalPeriods: periods.length,
      totalEmployees: 0,
      totalEmployeePeriodCombinations: 0,
      totalWbsAssignments: 0,
      assignmentsWithProjectGrade: 0,
      assignmentsWithoutProjectGrade: 0,
      assignmentsWithZeroWeight: 0,
      assignmentsWithNonZeroWeight: 0,
      periodDetails: [],
    };

    // 2. 각 평가기간별 통계 수집
    for (const period of periods) {
      // 직원 수 조회
      const employeeIds = await wbsAssignmentRepository
        .createQueryBuilder('assignment')
        .select('DISTINCT assignment.employeeId', 'employeeId')
        .where('assignment.periodId = :periodId', { periodId: period.id })
        .andWhere('assignment.deletedAt IS NULL')
        .getRawMany();

      const employeeCount = employeeIds.length;

      // WBS 할당 수 조회
      const wbsAssignments = await wbsAssignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin(
          Project,
          'project',
          'project.id = assignment.projectId AND project.deletedAt IS NULL',
        )
        .select([
          'assignment.id',
          'assignment.weight',
          'project.grade as project_grade',
        ])
        .where('assignment.periodId = :periodId', { periodId: period.id })
        .andWhere('assignment.deletedAt IS NULL')
        .getRawMany();

      const wbsAssignmentCount = wbsAssignments.length;
      const withGrade = wbsAssignments.filter(
        (a: any) => a.project_grade !== null,
      ).length;
      const withoutGrade = wbsAssignmentCount - withGrade;
      const withZeroWeight = wbsAssignments.filter(
        (a: any) => parseFloat(a.weight) === 0,
      ).length;
      const withNonZeroWeight = wbsAssignmentCount - withZeroWeight;

      stats.totalEmployees += employeeCount;
      stats.totalEmployeePeriodCombinations += employeeCount;
      stats.totalWbsAssignments += wbsAssignmentCount;
      stats.assignmentsWithProjectGrade += withGrade;
      stats.assignmentsWithoutProjectGrade += withoutGrade;
      stats.assignmentsWithZeroWeight += withZeroWeight;
      stats.assignmentsWithNonZeroWeight += withNonZeroWeight;

      stats.periodDetails.push({
        periodId: period.id,
        periodName: period.name || period.id,
        maxSelfEvaluationRate: period.maxSelfEvaluationRate || 100,
        employeeCount,
        wbsAssignmentCount,
      });
    }

    return stats;
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

function printStats(stats: MigrationStats) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 WBS 가중치 마이그레이션 통계 정보');
  console.log('='.repeat(80));
  console.log(`\n📅 평가기간 정보:`);
  console.log(`   총 평가기간 수: ${stats.totalPeriods}개`);
  console.log(`\n👥 직원 정보:`);
  console.log(`   총 직원 수: ${stats.totalEmployees}명`);
  console.log(`   총 직원-평가기간 조합: ${stats.totalEmployeePeriodCombinations}개`);
  console.log(`\n📋 WBS 할당 정보:`);
  console.log(`   총 WBS 할당 수: ${stats.totalWbsAssignments}개`);
  console.log(`   - 프로젝트 등급이 있는 할당: ${stats.assignmentsWithProjectGrade}개`);
  console.log(`   - 프로젝트 등급이 없는 할당: ${stats.assignmentsWithoutProjectGrade}개`);
  console.log(`   - 현재 가중치가 0인 할당: ${stats.assignmentsWithZeroWeight}개`);
  console.log(`   - 현재 가중치가 0이 아닌 할당: ${stats.assignmentsWithNonZeroWeight}개`);

  if (stats.periodDetails.length > 0) {
    console.log(`\n📊 평가기간별 상세 정보:`);
    stats.periodDetails.forEach((detail, index) => {
      console.log(`\n   ${index + 1}. ${detail.periodName}`);
      console.log(`      - 평가기간 ID: ${detail.periodId}`);
      console.log(`      - 최대 달성률: ${detail.maxSelfEvaluationRate}`);
      console.log(`      - 직원 수: ${detail.employeeCount}명`);
      console.log(`      - WBS 할당 수: ${detail.wbsAssignmentCount}개`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('⚠️  주의사항:');
  console.log('='.repeat(80));
  console.log('1. 마이그레이션 실행 전 반드시 데이터베이스 백업을 수행하세요.');
  console.log('2. 프로젝트 등급이 없는 할당은 가중치가 0으로 설정됩니다.');
  console.log('3. 모든 WBS 할당의 가중치가 재계산됩니다.');
  console.log('4. 마이그레이션 실행 시간은 데이터 양에 비례합니다.');
  console.log('\n' + '='.repeat(80));
}

async function migrateWbsWeights() {
  console.log('🔄 WBS 가중치를 프로젝트 등급 기반으로 재계산 시작...\n');

  let dataSource: DataSource | null = null;

  try {
    // DataSource 생성
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'lumir_admin',
      password: process.env.DATABASE_PASSWORD || 'lumir_password_2024',
      database: process.env.DATABASE_NAME || 'lumir_project_management',
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      entities: [
        EvaluationWbsAssignment,
        EvaluationProjectAssignment,
        EvaluationPeriod,
        Project,
      ],
      synchronize: false,
      logging: ['error', 'warn'],
    });

    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 서비스 생성
    const wbsAssignmentRepository =
      dataSource.getRepository(EvaluationWbsAssignment);
    const projectAssignmentRepository =
      dataSource.getRepository(EvaluationProjectAssignment);
    const evaluationPeriodRepository =
      dataSource.getRepository(EvaluationPeriod);

    const weightCalculationService = new WbsAssignmentWeightCalculationService(
      wbsAssignmentRepository,
      projectAssignmentRepository,
      evaluationPeriodRepository,
    );

    // 1. 모든 평가기간 조회
    const periods = await evaluationPeriodRepository.find({
      where: { deletedAt: IsNull() },
    });

    console.log(`📊 평가기간 ${periods.length}개 발견\n`);

    let totalRecalculated = 0;
    let totalAssignments = 0;
    let errorCount = 0;

    // 2. 각 평가기간별로 처리
    for (const period of periods) {
      console.log(
        `📅 평가기간 처리 중: ${period.name || period.id} (최대 달성률: ${period.maxSelfEvaluationRate})`,
      );

      // 3. 해당 평가기간의 모든 직원 조회
      const employeeIds = await wbsAssignmentRepository
        .createQueryBuilder('assignment')
        .select('DISTINCT assignment.employeeId', 'employeeId')
        .where('assignment.periodId = :periodId', { periodId: period.id })
        .andWhere('assignment.deletedAt IS NULL')
        .getRawMany();

      console.log(`  👥 직원 ${employeeIds.length}명 발견`);

      // 4. 각 직원별로 가중치 재계산
      for (const { employeeId } of employeeIds) {
        try {
          const assignmentCount = await wbsAssignmentRepository.count({
            where: {
              periodId: period.id,
              employeeId: employeeId,
              deletedAt: IsNull(),
            },
          });

          if (assignmentCount === 0) {
            continue;
          }

          await weightCalculationService.직원_평가기간_가중치를_재계산한다(
            employeeId,
            period.id,
          );

          totalRecalculated++;
          totalAssignments += assignmentCount;
        } catch (error: any) {
          errorCount++;
          console.error(
            `  ❌ 오류 발생 - 직원: ${employeeId}, 평가기간: ${period.id}`,
          );
          console.error(`     ${error.message}`);
        }
      }

      console.log(
        `  ✅ 완료 - ${employeeIds.length}명의 직원 처리 완료\n`,
      );
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 마이그레이션 결과 요약');
    console.log('='.repeat(60));
    console.log(`평가기간 수: ${periods.length}`);
    console.log(`처리된 직원-평가기간 조합: ${totalRecalculated}`);
    console.log(`처리된 WBS 할당 수: ${totalAssignments}`);
    console.log(`오류 발생 수: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  일부 오류가 발생했습니다. 로그를 확인하세요.');
    } else {
      console.log('\n✅ 모든 가중치 재계산이 완료되었습니다!');
    }
  } catch (error: any) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n✅ 데이터베이스 연결 종료');
    }
  }
}

function askForConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '\n❓ 위 통계 정보를 확인하셨습니까? 마이그레이션을 실행하시겠습니까? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      },
    );
  });
}

// 스크립트 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const shouldExecute = args.includes('--execute') || args.includes('-e');

  if (shouldExecute) {
    // 직접 실행 모드 (백업 후 실행)
    (async () => {
      try {
        // 백업 수행
        const backupFile = await performBackup();

        // 마이그레이션 실행
        await migrateWbsWeights();
        console.log('\n✅ 스크립트 실행 완료');
        console.log(`💾 백업 파일: ${backupFile}`);
        process.exit(0);
      } catch (error: any) {
        console.error('\n❌ 스크립트 실행 실패:', error);
        if (error.message && error.message.includes('백업')) {
          console.error('💡 백업을 수동으로 수행한 후 다시 시도하세요:');
          console.error('   npm run db:backup');
        }
        process.exit(1);
      }
    })();
  } else {
    // Preview 모드 (기본)
    previewMigration()
      .then(async (stats) => {
        printStats(stats);

        const confirmed = await askForConfirmation();

        if (confirmed) {
          console.log('\n🚀 마이그레이션 실행을 시작합니다...\n');

          // 백업 수행
          let backupFile: string;
          try {
            backupFile = await performBackup();
          } catch (error: any) {
            console.error('\n❌ 백업 실패로 인해 마이그레이션을 중단합니다.');
            console.error('💡 백업을 수동으로 수행한 후 다시 시도하세요:');
            console.error('   npm run db:backup');
            process.exit(1);
          }

          // 마이그레이션 실행
          try {
            await migrateWbsWeights();
            console.log('\n✅ 마이그레이션 완료');
            console.log(`💾 백업 파일: ${backupFile}`);
            process.exit(0);
          } catch (error: any) {
            console.error('\n❌ 마이그레이션 실패!');
            console.error(`💾 백업 파일이 저장되어 있습니다: ${backupFile}`);
            console.error('💡 백업 파일을 사용하여 복구할 수 있습니다.');
            process.exit(1);
          }
        } else {
          console.log('\n❌ 마이그레이션이 취소되었습니다.');
          console.log('💡 실제 마이그레이션을 실행하려면 다음 명령어를 사용하세요:');
          console.log('   npm run migrate:wbs-weights -- --execute');
          process.exit(0);
        }
      })
      .catch((error) => {
        console.error('\n❌ 통계 정보 조회 실패:', error);
        process.exit(1);
      });
  }
}

export { migrateWbsWeights, previewMigration, printStats };
