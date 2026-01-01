import { ApiProperty } from '@nestjs/swagger';

export class AuditLogStatsItemDto {
  @ApiProperty({ description: '시간 (HH:mm 형식)', example: '13:24' })
  time: string;

  @ApiProperty({ description: '타임스탬프 (밀리초)', example: 1765949086323 })
  timestamp: number;

  @ApiProperty({ description: '성공 요청 개수', example: 44 })
  success: number;

  @ApiProperty({ description: '실패 요청 개수', example: 0 })
  errors: number;

  @ApiProperty({ description: '총 요청 개수', example: 44 })
  total: number;
}

export class AuditLogStatsResponseDto {
  @ApiProperty({
    description: '시간대별 통계 데이터',
    type: [AuditLogStatsItemDto],
  })
  stats: AuditLogStatsItemDto[];
}

