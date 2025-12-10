import { Repository } from 'typeorm';
import { SystemSetting } from './system-setting.entity';
import { GradeRangeValue } from './system-setting.types';
export declare class SystemSettingService {
    private readonly systemSettingRepository;
    constructor(systemSettingRepository: Repository<SystemSetting>);
    설정을_조회한다<T>(key: string): Promise<T | null>;
    설정을_저장한다<T>(key: string, value: T, description?: string): Promise<void>;
    기본등급구간_조회한다(): Promise<GradeRangeValue[]>;
    기본등급구간_변경한다(gradeRanges: GradeRangeValue[]): Promise<GradeRangeValue[]>;
}
