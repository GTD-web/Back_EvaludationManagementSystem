import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * 데이터베이스 백업 스케줄러 서비스
 *
 * 백업 전략 (한국 시간 기준):
 * - 4시간마다: 00시, 04시, 08시, 12시, 16시, 20시 (최근 24시간 복구용, 6개 파일)
 * - 매일 00시: 30일 보관
 * - 매주 일요일 00시: 12주(3개월) 보관
 * - 매월 1일 00시: 12개월 보관
 * - 분기말/연말: 3-7년 장기 보관
 */
@Injectable()
export class BackupSchedulerService {
  private readonly logger = new Logger(BackupSchedulerService.name);
  private readonly isVercel = !!process.env.VERCEL;

  // 백업 디렉토리 설정
  private readonly BACKUP_BASE_DIR = path.join(process.cwd(), 'backup');
  private readonly HOURLY_DIR = path.join(this.BACKUP_BASE_DIR, 'hourly');
  private readonly DAILY_DIR = path.join(this.BACKUP_BASE_DIR, 'daily');
  private readonly WEEKLY_DIR = path.join(this.BACKUP_BASE_DIR, 'weekly');
  private readonly MONTHLY_DIR = path.join(this.BACKUP_BASE_DIR, 'monthly');
  private readonly YEARLY_DIR = path.join(this.BACKUP_BASE_DIR, 'yearly');

  constructor() {
    // Vercel 환경에서는 백업 스케줄러 비활성화
    if (this.isVercel) {
      this.logger.warn(
        '⚠️  Vercel 환경 감지: 백업 스케줄러가 비활성화되었습니다.',
      );
      return;
    }

    // 백업 디렉토리 생성
    this.초기화한다();
  }

  /**
   * 백업 디렉토리 초기화
   */
  private 초기화한다(): void {
    const dirs = [
      this.HOURLY_DIR,
      this.DAILY_DIR,
      this.WEEKLY_DIR,
      this.MONTHLY_DIR,
      this.YEARLY_DIR,
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`백업 디렉토리 생성: ${dir}`);
      }
    }
  }

  /**
   * 4시간마다 백업 (한국시간 00시, 04시, 08시, 12시, 16시, 20시)
   * 최근 24시간 복구용, 6개 파일만 유지
   */
  @Cron('0 0,4,8,12,16,20 * * *', {
    timeZone: 'Asia/Seoul',
  })
  async 시간별_백업을_실행한다(): Promise<void> {
    if (this.isVercel) return;

    try {
      this.logger.log('🕐 4시간 단위 백업 시작... (KST)');
      await this.백업을_실행한다(this.HOURLY_DIR, 'hourly');
      await this.오래된_백업을_삭제한다(this.HOURLY_DIR, 6); // 6개만 유지
      this.logger.log('✅ 4시간 단위 백업 완료');
    } catch (error) {
      this.logger.error(`❌ 4시간 단위 백업 실패: ${error.message}`);
    }
  }

  /**
   * 매일 자정 백업 (한국시간 00시)
   * 30일 보관
   */
  @Cron('0 0 * * *', {
    timeZone: 'Asia/Seoul',
  })
  async 일일_백업을_실행한다(): Promise<void> {
    if (this.isVercel) return;

    try {
      this.logger.log('📅 일일 백업 시작... (KST 00:00)');

      // hourly와 daily 폴더 모두에 저장
      const timestamp = this.타임스탬프를_생성한다();
      await this.백업을_실행한다(this.HOURLY_DIR, 'hourly', timestamp);
      await this.백업을_실행한다(this.DAILY_DIR, 'daily', timestamp);

      await this.오래된_백업을_삭제한다(this.DAILY_DIR, 30); // 30일 유지
      this.logger.log('✅ 일일 백업 완료');
    } catch (error) {
      this.logger.error(`❌ 일일 백업 실패: ${error.message}`);
    }
  }

  /**
   * 매주 일요일 자정 백업 (한국시간 00시)
   * 12주(3개월) 보관
   */
  @Cron('0 0 * * 0', {
    timeZone: 'Asia/Seoul',
  })
  async 주간_백업을_실행한다(): Promise<void> {
    if (this.isVercel) return;

    try {
      this.logger.log('📆 주간 백업 시작... (KST 일요일 00:00)');

      const timestamp = this.타임스탬프를_생성한다();
      await this.백업을_실행한다(this.WEEKLY_DIR, 'weekly', timestamp);

      await this.오래된_백업을_삭제한다(this.WEEKLY_DIR, 12); // 12주 유지
      this.logger.log('✅ 주간 백업 완료');
    } catch (error) {
      this.logger.error(`❌ 주간 백업 실패: ${error.message}`);
    }
  }

  /**
   * 매월 1일 자정 백업 (한국시간 00시)
   * 12개월 보관
   */
  @Cron('0 0 1 * *', {
    timeZone: 'Asia/Seoul',
  })
  async 월간_백업을_실행한다(): Promise<void> {
    if (this.isVercel) return;

    try {
      this.logger.log('📊 월간 백업 시작... (KST 1일 00:00)');

      const timestamp = this.타임스탬프를_생성한다();
      await this.백업을_실행한다(this.MONTHLY_DIR, 'monthly', timestamp);

      await this.오래된_백업을_삭제한다(this.MONTHLY_DIR, 12); // 12개월 유지
      this.logger.log('✅ 월간 백업 완료');

      // 분기말 또는 연말이면 yearly 폴더에도 저장
      const now = new Date();
      const month = now.getMonth() + 1;
      if (month === 3 || month === 6 || month === 9 || month === 12) {
        this.logger.log('📈 분기말/연말 백업 시작...');
        await this.백업을_실행한다(this.YEARLY_DIR, 'yearly', timestamp);
        // yearly는 수동으로 관리 (3-7년 보관)
        this.logger.log('✅ 분기말/연말 백업 완료');
      }
    } catch (error) {
      this.logger.error(`❌ 월간 백업 실패: ${error.message}`);
    }
  }

  /**
   * 백업 실행
   */
  private async 백업을_실행한다(
    targetDir: string,
    type: string,
    timestamp?: string,
  ): Promise<void> {
    const ts = timestamp || this.타임스탬프를_생성한다();
    const filename = `backup-${type}-${ts}.sql`;
    const outputPath = path.join(targetDir, filename);

    // backup-pure.ts 스크립트 실행
    const scriptPath = path.join(
      process.cwd(),
      'scripts',
      'backup',
      'backup-pure.ts',
    );

    try {
      // ts-node로 백업 스크립트 실행하고 결과를 지정된 경로로 이동
      const tempBackupDir = path.join(
        process.cwd(),
        'scripts',
        'backup',
        'dumps',
      );

      // 백업 실행
      await execAsync(`npx ts-node "${scriptPath}"`, {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      // 가장 최근 백업 파일 찾기
      const files = fs
        .readdirSync(tempBackupDir)
        .filter((f) => f.startsWith('backup-') && f.endsWith('.sql'))
        .map((f) => ({
          name: f,
          path: path.join(tempBackupDir, f),
          mtime: fs.statSync(path.join(tempBackupDir, f)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      if (files.length > 0) {
        // 최신 백업 파일을 목표 디렉토리로 복사
        fs.copyFileSync(files[0].path, outputPath);
        this.logger.log(`   → ${filename} 저장 완료`);
      }
    } catch (error) {
      this.logger.error(`백업 실행 실패 (${type}): ${error.message}`);
      throw error;
    }
  }

  /**
   * 오래된 백업 파일 삭제
   */
  private async 오래된_백업을_삭제한다(
    dir: string,
    keepCount: number,
  ): Promise<void> {
    try {
      const files = fs
        .readdirSync(dir)
        .filter((f) => f.startsWith('backup-') && f.endsWith('.sql'))
        .map((f) => ({
          name: f,
          path: path.join(dir, f),
          mtime: fs.statSync(path.join(dir, f)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // keepCount개를 초과하는 파일 삭제
      if (files.length > keepCount) {
        const filesToDelete = files.slice(keepCount);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          this.logger.log(`   🗑️  오래된 백업 삭제: ${file.name}`);
        }
      }
    } catch (error) {
      this.logger.error(`오래된 백업 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 타임스탬프 생성 (KST 기준)
   */
  private 타임스탬프를_생성한다(): string {
    // 한국 시간으로 변환
    const now = new Date();
    const kstDate = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }),
    );

    return kstDate
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '-')
      .split('Z')[0];
  }

  /**
   * 수동 백업 트리거 (API 엔드포인트용)
   */
  async 수동_백업을_실행한다(
    type: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
  ): Promise<string> {
    if (this.isVercel) {
      throw new Error(
        'Vercel 환경에서는 백업 기능을 사용할 수 없습니다. EC2 환경을 사용해주세요.',
      );
    }

    this.logger.log(`🔧 수동 백업 시작 (타입: ${type})...`);

    let targetDir: string;
    switch (type) {
      case 'hourly':
        targetDir = this.HOURLY_DIR;
        break;
      case 'weekly':
        targetDir = this.WEEKLY_DIR;
        break;
      case 'monthly':
        targetDir = this.MONTHLY_DIR;
        break;
      default:
        targetDir = this.DAILY_DIR;
    }

    await this.백업을_실행한다(targetDir, type);
    this.logger.log('✅ 수동 백업 완료');

    return `${type} 백업이 완료되었습니다.`;
  }

  /**
   * 백업 상태 조회
   */
  백업_상태를_조회한다(): {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  } {
    return {
      hourly: this.백업_파일_개수를_조회한다(this.HOURLY_DIR),
      daily: this.백업_파일_개수를_조회한다(this.DAILY_DIR),
      weekly: this.백업_파일_개수를_조회한다(this.WEEKLY_DIR),
      monthly: this.백업_파일_개수를_조회한다(this.MONTHLY_DIR),
      yearly: this.백업_파일_개수를_조회한다(this.YEARLY_DIR),
    };
  }

  private 백업_파일_개수를_조회한다(dir: string): number {
    try {
      return fs
        .readdirSync(dir)
        .filter((f) => f.startsWith('backup-') && f.endsWith('.sql')).length;
    } catch {
      return 0;
    }
  }
}
