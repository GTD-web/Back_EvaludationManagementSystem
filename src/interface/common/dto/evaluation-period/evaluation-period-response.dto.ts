import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApprovalStatus,
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
  EvaluationPeriodDto,
} from '@domain/core/evaluation-period/evaluation-period.types';

/**
 * 등급 구간 응답 DTO
 */
export class GradeRangeResponseDto {
  @ApiProperty({
    description: '등급',
    example: 'S',
  })
  grade: string;

  @ApiProperty({
    description: '최소 범위',
    example: 90,
    minimum: 0,
    maximum: 200,
  })
  minRange: number;

  @ApiProperty({
    description: '최대 범위',
    example: 100,
    minimum: 0,
    maximum: 200,
  })
  maxRange: number;
}

/**
 * 평가 기간 응답 DTO (Swagger용)
 */
export class EvaluationPeriodResponseDto implements EvaluationPeriodDto {
  @ApiProperty({
    description: '평가 기간 고유 식별자',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '평가 기간명',
    example: '2024년 상반기 평가',
  })
  name: string;

  @ApiProperty({
    description: '평가 기간 시작일',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiPropertyOptional({
    description: '평가 기간 설명',
    example: '2024년 상반기 직원 평가를 진행합니다.',
  })
  description?: string;

  @ApiProperty({
    description: '평가 기간 상태',
    enum: EvaluationPeriodStatus,
    example: EvaluationPeriodStatus.IN_PROGRESS,
  })
  status: EvaluationPeriodStatus;

  @ApiPropertyOptional({
    description: '현재 진행 단계',
    enum: EvaluationPeriodPhase,
    example: EvaluationPeriodPhase.SELF_EVALUATION,
  })
  currentPhase?: EvaluationPeriodPhase;

  @ApiPropertyOptional({
    description: '평가설정 단계 마감일',
    example: '2024-01-15T23:59:59.999Z',
  })
  evaluationSetupDeadline?: Date;

  @ApiPropertyOptional({
    description: '업무 수행 단계 마감일',
    example: '2024-05-31T23:59:59.999Z',
  })
  performanceDeadline?: Date;

  @ApiPropertyOptional({
    description: '자기 평가 단계 마감일',
    example: '2024-06-15T23:59:59.999Z',
  })
  selfEvaluationDeadline?: Date;

  @ApiPropertyOptional({
    description: '하향/동료평가 단계 마감일',
    example: '2024-06-30T23:59:59.999Z',
  })
  peerEvaluationDeadline?: Date;

  @ApiPropertyOptional({
    description: '평가 완료일',
    example: '2024-07-01T00:00:00.000Z',
  })
  completedDate?: Date;

  @ApiProperty({
    description: '평가 기준 설정 수동 허용 여부',
    example: true,
  })
  criteriaSettingEnabled: boolean;

  @ApiProperty({
    description: '자기 평가 설정 수동 허용 여부',
    example: true,
  })
  selfEvaluationSettingEnabled: boolean;

  @ApiProperty({
    description: '하향/동료평가 설정 수동 허용 여부',
    example: false,
  })
  finalEvaluationSettingEnabled: boolean;

  @ApiProperty({
    description: '자기평가 달성률 최대값 (%)',
    example: 120,
    minimum: 100,
    maximum: 200,
  })
  maxSelfEvaluationRate: number;

  @ApiProperty({
    description: '등급 구간 설정',
    type: [GradeRangeResponseDto],
  })
  gradeRanges: GradeRangeResponseDto[];

  @ApiPropertyOptional({
    description: '결재 문서 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  approvalDocumentId?: string;

  @ApiProperty({
    description: '결재 상태',
    enum: ApprovalStatus,
    example: ApprovalStatus.NONE,
  })
  approvalStatus: ApprovalStatus;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

/**
 * 평가 기간 목록 응답 DTO
 */
export class EvaluationPeriodListResponseDto {
  @ApiProperty({
    description: '평가 기간 목록',
    type: [EvaluationPeriodResponseDto],
  })
  items: EvaluationPeriodResponseDto[];

  @ApiProperty({
    description: '전체 데이터 개수',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 10,
  })
  limit: number;
}
