import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { OptionalToBoolean } from '@interface/common/decorators';

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
    description:
      '읽음 여부 필터 (선택사항, 가능값: "true", "false", "1", "0", 미지정 시 모든 상태 조회)',
    type: String,
    example: 'false',
  })
  @IsOptional()
  @OptionalToBoolean()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    description:
      '재작성 완료 여부 필터 (선택사항, 가능값: "true", "false", "1", "0", 미지정 시 모든 상태 조회)',
    type: String,
    example: 'false',
  })
  @IsOptional()
  @OptionalToBoolean()
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
