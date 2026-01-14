import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, ValidateIf } from 'class-validator';
import { ToBoolean } from '@interface/common/decorators';

/**
 * 평가 제출 여부 업데이트 DTO
 */
export class UpdateEvaluationSubmissionDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  periodId: string;

  @ApiProperty({
    description: '제출 여부 (true: 제출, false: 미제출)',
    example: true,
    type: Boolean,
  })
  @ToBoolean()
  @IsBoolean()
  @IsNotEmpty()
  isSubmitted: boolean;

  @ApiPropertyOptional({
    description: '평가자 ID (2차 하향평가의 경우 필수)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ValidateIf((o) => o.evaluationType === 'secondary-downward')
  @IsString()
  @IsNotEmpty()
  evaluatorId?: string;
}
