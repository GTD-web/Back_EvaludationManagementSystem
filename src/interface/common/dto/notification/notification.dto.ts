import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 알림 정보 DTO
 */
export class NotificationDto {
  @ApiProperty({ description: '알림 ID' })
  id: string;

  @ApiProperty({ description: '발신자 ID' })
  sender: string;

  @ApiProperty({ description: '수신자 ID' })
  recipientId: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ description: '내용' })
  content: string;

  @ApiProperty({ description: '읽음 여부' })
  isRead: boolean;

  @ApiProperty({ description: '출처 시스템' })
  sourceSystem: string;

  @ApiPropertyOptional({ description: '링크 URL' })
  linkUrl?: string;

  @ApiPropertyOptional({ description: '메타데이터' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: '생성일시' })
  createdAt: Date;

  @ApiPropertyOptional({ description: '읽은 일시' })
  readAt?: Date;
}

/**
 * 알림 목록 조회 Query DTO
 */
export class GetNotificationsQueryDto {
  @ApiPropertyOptional({
    description: '읽음 여부 필터',
    type: String,
    example: 'false',
  })
  @IsOptional()
  @IsString()
  isRead?: string;  // string으로 받아서 컨트롤러에서 변환

  @ApiPropertyOptional({
    description: '건너뛸 개수',
    type: Number,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  skip?: number;

  @ApiPropertyOptional({
    description: '가져올 개수',
    type: Number,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  take?: number;
}

/**
 * 알림 목록 조회 응답 DTO
 */
export class GetNotificationsResponseDto {
  @ApiProperty({ description: '알림 목록', type: [NotificationDto] })
  notifications: NotificationDto[];

  @ApiProperty({ description: '전체 개수' })
  total: number;

  @ApiProperty({ description: '읽지 않은 개수' })
  unreadCount: number;
}

/**
 * 알림 읽음 처리 응답 DTO
 */
export class MarkNotificationAsReadResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiPropertyOptional({ description: '메시지' })
  message?: string;
}

/**
 * 전체 알림 읽음 처리 응답 DTO
 */
export class MarkAllAsReadResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '메시지' })
  message: string;

  @ApiProperty({ description: '업데이트된 알림 개수' })
  updatedCount: number;
}

