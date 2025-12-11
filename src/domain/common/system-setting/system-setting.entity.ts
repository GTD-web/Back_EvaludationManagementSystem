import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SystemSettingDto } from './system-setting.types';

/**
 * 시스템 설정 엔티티
 *
 * 시스템 전역 설정을 저장합니다.
 * key-value 형태로 다양한 설정을 저장할 수 있습니다.
 */
@Entity('system_setting')
@Index(['key'], { unique: true })
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '설정 키',
  })
  key: string;

  @Column({
    type: 'json',
    comment: '설정 값 (JSON)',
  })
  value: unknown;

  @Column({
    type: 'text',
    nullable: true,
    comment: '설정 설명',
  })
  description?: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: '생성 일시',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: '수정 일시',
  })
  updatedAt: Date;

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): SystemSettingDto {
    return {
      id: this.id,
      key: this.key,
      value: this.value,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 정적 팩토리 메서드: 새 설정을 생성한다
   */
  static 생성한다(
    key: string,
    value: unknown,
    description?: string,
  ): SystemSetting {
    const setting = new SystemSetting();
    setting.key = key;
    setting.value = value;
    setting.description = description;
    return setting;
  }

  /**
   * 설정 값을 업데이트한다
   */
  값을_업데이트한다(value: unknown): void {
    this.value = value;
  }
}




