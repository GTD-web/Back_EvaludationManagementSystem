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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BackupSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let BackupSchedulerService = BackupSchedulerService_1 = class BackupSchedulerService {
    logger = new common_1.Logger(BackupSchedulerService_1.name);
    isVercel = !!process.env.VERCEL;
    BACKUP_BASE_DIR = path.join(process.cwd(), 'backup');
    HOURLY_DIR = path.join(this.BACKUP_BASE_DIR, 'hourly');
    DAILY_DIR = path.join(this.BACKUP_BASE_DIR, 'daily');
    WEEKLY_DIR = path.join(this.BACKUP_BASE_DIR, 'weekly');
    MONTHLY_DIR = path.join(this.BACKUP_BASE_DIR, 'monthly');
    YEARLY_DIR = path.join(this.BACKUP_BASE_DIR, 'yearly');
    constructor() {
        if (this.isVercel) {
            this.logger.warn('⚠️  Vercel 환경 감지: 백업 스케줄러가 비활성화되었습니다.');
            return;
        }
        this.초기화한다();
    }
    초기화한다() {
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
    async 시간별_백업을_실행한다() {
        if (this.isVercel)
            return;
        try {
            this.logger.log('🕐 4시간 단위 백업 시작... (KST)');
            await this.백업을_실행한다(this.HOURLY_DIR, 'hourly');
            await this.오래된_백업을_삭제한다(this.HOURLY_DIR, 6);
            this.logger.log('✅ 4시간 단위 백업 완료');
        }
        catch (error) {
            this.logger.error(`❌ 4시간 단위 백업 실패: ${error.message}`);
        }
    }
    async 일일_백업을_실행한다() {
        if (this.isVercel)
            return;
        try {
            this.logger.log('📅 일일 백업 시작... (KST 00:00)');
            const timestamp = this.타임스탬프를_생성한다();
            await this.백업을_실행한다(this.HOURLY_DIR, 'hourly', timestamp);
            await this.백업을_실행한다(this.DAILY_DIR, 'daily', timestamp);
            await this.오래된_백업을_삭제한다(this.DAILY_DIR, 30);
            this.logger.log('✅ 일일 백업 완료');
        }
        catch (error) {
            this.logger.error(`❌ 일일 백업 실패: ${error.message}`);
        }
    }
    async 주간_백업을_실행한다() {
        if (this.isVercel)
            return;
        try {
            this.logger.log('📆 주간 백업 시작... (KST 일요일 00:00)');
            const timestamp = this.타임스탬프를_생성한다();
            await this.백업을_실행한다(this.WEEKLY_DIR, 'weekly', timestamp);
            await this.오래된_백업을_삭제한다(this.WEEKLY_DIR, 12);
            this.logger.log('✅ 주간 백업 완료');
        }
        catch (error) {
            this.logger.error(`❌ 주간 백업 실패: ${error.message}`);
        }
    }
    async 월간_백업을_실행한다() {
        if (this.isVercel)
            return;
        try {
            this.logger.log('📊 월간 백업 시작... (KST 1일 00:00)');
            const timestamp = this.타임스탬프를_생성한다();
            await this.백업을_실행한다(this.MONTHLY_DIR, 'monthly', timestamp);
            await this.오래된_백업을_삭제한다(this.MONTHLY_DIR, 12);
            this.logger.log('✅ 월간 백업 완료');
            const now = new Date();
            const month = now.getMonth() + 1;
            if (month === 3 || month === 6 || month === 9 || month === 12) {
                this.logger.log('📈 분기말/연말 백업 시작...');
                await this.백업을_실행한다(this.YEARLY_DIR, 'yearly', timestamp);
                this.logger.log('✅ 분기말/연말 백업 완료');
            }
        }
        catch (error) {
            this.logger.error(`❌ 월간 백업 실패: ${error.message}`);
        }
    }
    async 백업을_실행한다(targetDir, type, timestamp) {
        const ts = timestamp || this.타임스탬프를_생성한다();
        const filename = `backup-${type}-${ts}.sql`;
        const outputPath = path.join(targetDir, filename);
        const scriptPath = path.join(process.cwd(), 'scripts', 'backup', 'backup-pure.ts');
        try {
            const tempBackupDir = path.join(process.cwd(), 'scripts', 'backup', 'dumps');
            await execAsync(`npx ts-node "${scriptPath}"`, {
                cwd: process.cwd(),
                env: { ...process.env },
            });
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
                fs.copyFileSync(files[0].path, outputPath);
                this.logger.log(`   → ${filename} 저장 완료`);
            }
        }
        catch (error) {
            this.logger.error(`백업 실행 실패 (${type}): ${error.message}`);
            throw error;
        }
    }
    async 오래된_백업을_삭제한다(dir, keepCount) {
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
            if (files.length > keepCount) {
                const filesToDelete = files.slice(keepCount);
                for (const file of filesToDelete) {
                    fs.unlinkSync(file.path);
                    this.logger.log(`   🗑️  오래된 백업 삭제: ${file.name}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`오래된 백업 삭제 실패: ${error.message}`);
        }
    }
    타임스탬프를_생성한다() {
        const now = new Date();
        const kstOffset = 9 * 60;
        const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
        const formatted = kstTime
            .toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '-')
            .split('Z')[0];
        return `${formatted}-KST`;
    }
    async 수동_백업을_실행한다(type = 'daily') {
        if (this.isVercel) {
            throw new Error('Vercel 환경에서는 백업 기능을 사용할 수 없습니다. EC2 환경을 사용해주세요.');
        }
        this.logger.log(`🔧 수동 백업 시작 (타입: ${type})...`);
        let targetDir;
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
    백업_상태를_조회한다() {
        return {
            hourly: this.백업_파일_개수를_조회한다(this.HOURLY_DIR),
            daily: this.백업_파일_개수를_조회한다(this.DAILY_DIR),
            weekly: this.백업_파일_개수를_조회한다(this.WEEKLY_DIR),
            monthly: this.백업_파일_개수를_조회한다(this.MONTHLY_DIR),
            yearly: this.백업_파일_개수를_조회한다(this.YEARLY_DIR),
        };
    }
    백업_파일_개수를_조회한다(dir) {
        try {
            return fs
                .readdirSync(dir)
                .filter((f) => f.startsWith('backup-') && f.endsWith('.sql')).length;
        }
        catch {
            return 0;
        }
    }
};
exports.BackupSchedulerService = BackupSchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 0,4,8,12,16,20 * * *', {
        timeZone: 'Asia/Seoul',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupSchedulerService.prototype, "\uC2DC\uAC04\uBCC4_\uBC31\uC5C5\uC744_\uC2E4\uD589\uD55C\uB2E4", null);
__decorate([
    (0, schedule_1.Cron)('0 0 * * *', {
        timeZone: 'Asia/Seoul',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupSchedulerService.prototype, "\uC77C\uC77C_\uBC31\uC5C5\uC744_\uC2E4\uD589\uD55C\uB2E4", null);
__decorate([
    (0, schedule_1.Cron)('0 0 * * 0', {
        timeZone: 'Asia/Seoul',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupSchedulerService.prototype, "\uC8FC\uAC04_\uBC31\uC5C5\uC744_\uC2E4\uD589\uD55C\uB2E4", null);
__decorate([
    (0, schedule_1.Cron)('0 0 1 * *', {
        timeZone: 'Asia/Seoul',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupSchedulerService.prototype, "\uC6D4\uAC04_\uBC31\uC5C5\uC744_\uC2E4\uD589\uD55C\uB2E4", null);
exports.BackupSchedulerService = BackupSchedulerService = BackupSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BackupSchedulerService);
//# sourceMappingURL=backup-scheduler.service.js.map