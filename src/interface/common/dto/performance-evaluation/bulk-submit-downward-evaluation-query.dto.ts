import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { ToBoolean } from '@interface/common/decorators';

/**
 * 하향평가 일괄 제출 쿼리 DTO
 */
export class BulkSubmitDownwardEvaluationQueryDto {
  @ApiProperty({
    description: '평가 유형 (primary 또는 secondary)',
    enum: DownwardEvaluationType,
    required: true,
    example: DownwardEvaluationType.PRIMARY,
  })
  @IsEnum(DownwardEvaluationType, {
    message: 'evaluationType은 primary 또는 secondary여야 합니다.',
  })
  evaluationType: DownwardEvaluationType;

  @ApiPropertyOptional({
    description: '하위 단계 자동 승인 여부 (기본값: true)',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @ToBoolean(true)
  @IsBoolean()
  approveAllBelow?: boolean;
}

