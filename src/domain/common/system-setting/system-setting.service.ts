import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './system-setting.entity';
import {
  SystemSettingKey,
  GradeRangeValue,
  DEFAULT_GRADE_RANGES_INITIAL,
} from './system-setting.types';

/**
 * 시스템 설정 서비스
 *
 * 시스템 전역 설정을 관리합니다.
 */
@Injectable()
export class SystemSettingService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly systemSettingRepository: Repository<SystemSetting>,
  ) {}

  /**
   * 설정을 조회한다
   */
  async 설정을_조회한다<T>(key: string): Promise<T | null> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });
    return setting ? (setting.value as T) : null;
  }

  /**
   * 설정을 저장한다
   */
  async 설정을_저장한다<T>(
    key: string,
    value: T,
    description?: string,
  ): Promise<void> {
    let setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (setting) {
      setting.값을_업데이트한다(value);
    } else {
      setting = SystemSetting.생성한다(key, value, description);
    }

    await this.systemSettingRepository.save(setting);
  }

  /**
   * 기본 등급 구간을 조회한다
   */
  async 기본등급구간_조회한다(): Promise<GradeRangeValue[]> {
    const gradeRanges = await this.설정을_조회한다<GradeRangeValue[]>(
      SystemSettingKey.DEFAULT_GRADE_RANGES,
    );

    if (!gradeRanges) {
      // DB에 없으면 초기값을 저장하고 반환
      await this.설정을_저장한다(
        SystemSettingKey.DEFAULT_GRADE_RANGES,
        DEFAULT_GRADE_RANGES_INITIAL,
        '평가 기간 생성 시 사용되는 기본 등급 구간',
      );
      return DEFAULT_GRADE_RANGES_INITIAL;
    }

    return gradeRanges;
  }

  /**
   * 기본 등급 구간을 변경한다
   */
  async 기본등급구간_변경한다(
    gradeRanges: GradeRangeValue[],
  ): Promise<GradeRangeValue[]> {
    await this.설정을_저장한다(
      SystemSettingKey.DEFAULT_GRADE_RANGES,
      gradeRanges,
      '평가 기간 생성 시 사용되는 기본 등급 구간',
    );
    return gradeRanges;
  }
}
