import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAuditLogStatsQueryDto {
  @ApiPropertyOptional({
    description: '시작 날짜 (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '시간 간격 (분 단위)',
    default: 60,
    example: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  interval?: number;
}

