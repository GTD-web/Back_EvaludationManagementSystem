import { SystemSettingDto } from './system-setting.types';
export declare class SystemSetting {
    id: string;
    key: string;
    value: unknown;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    DTO로_변환한다(): SystemSettingDto;
    static 생성한다(key: string, value: unknown, description?: string): SystemSetting;
    값을_업데이트한다(value: unknown): void;
}
