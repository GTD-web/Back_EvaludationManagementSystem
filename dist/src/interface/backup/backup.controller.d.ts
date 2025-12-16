import { BackupSchedulerService } from '../../context/backup-context/backup-scheduler.service';
export declare class BackupController {
    private readonly backupSchedulerService;
    constructor(backupSchedulerService: BackupSchedulerService);
    백업_상태_조회(): {
        hourly: number;
        daily: number;
        weekly: number;
        monthly: number;
        yearly: number;
    };
    수동_백업_실행(type?: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<{
        message: string;
    }>;
}
