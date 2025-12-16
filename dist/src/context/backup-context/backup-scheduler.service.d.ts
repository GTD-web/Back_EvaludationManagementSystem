export declare class BackupSchedulerService {
    private readonly logger;
    private readonly isVercel;
    private readonly BACKUP_BASE_DIR;
    private readonly HOURLY_DIR;
    private readonly DAILY_DIR;
    private readonly WEEKLY_DIR;
    private readonly MONTHLY_DIR;
    private readonly YEARLY_DIR;
    constructor();
    private 초기화한다;
    시간별_백업을_실행한다(): Promise<void>;
    일일_백업을_실행한다(): Promise<void>;
    주간_백업을_실행한다(): Promise<void>;
    월간_백업을_실행한다(): Promise<void>;
    private 백업을_실행한다;
    private 오래된_백업을_삭제한다;
    private 타임스탬프를_생성한다;
    수동_백업을_실행한다(type?: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<string>;
    백업_상태를_조회한다(): {
        hourly: number;
        daily: number;
        weekly: number;
        monthly: number;
        yearly: number;
    };
    private 백업_파일_개수를_조회한다;
}
