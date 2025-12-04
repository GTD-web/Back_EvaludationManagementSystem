import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { ToBoolean } from '@interface/common/decorators';

/**
 * 재작성 요청 단계 enum
 */
export enum RevisionRequestStepEnum {
  CRITERIA = 'criteria',
  SELF = 'self',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

/**
 * 재작성 요청 목록 조회 쿼리 DTO
 */
export class GetRevisionRequestsQueryDto {
  @ApiPropertyOptional({
    description: '평가기간 ID',
    type: 'string',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evaluationPeriodId?: string;

  @ApiPropertyOptional({
    description: '피평가자 ID (관리자용)',
    type: 'string',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: '요청자 ID (관리자용)',
    type: 'string',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestedBy?: string;

  @ApiPropertyOptional({
    description: '읽음 여부 (기본값: false, 가능값: "true", "false", "1", "0")',
    type: String,
    example: 'false',
  })
  @IsOptional()
  @ToBoolean(false)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    description:
      '재작성 완료 여부 (기본값: false, 가능값: "true", "false", "1", "0")',
    type: String,
    example: 'false',
  })
  @IsOptional()
  @ToBoolean(false)
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional({
    description: '단계',
    enum: RevisionRequestStepEnum,
  })
  @IsOptional()
  @IsEnum(RevisionRequestStepEnum)
  step?: RevisionRequestStepEnum;
}
