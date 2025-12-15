import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

/**
 * WBS 평가기준 생성 DTO
 */
export class CreateWbsEvaluationCriteriaDto {
  @ApiProperty({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  @IsString()
  @IsUUID()
  wbsItemId: string;

  @ApiProperty({
    description: '평가기준 내용',
    example: '코드 품질 및 성능 최적화',
  })
  @IsString()
  criteria: string;

  @ApiProperty({
    description: '중요도 (1~5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  importance: number;
}

/**
 * WBS 평가기준 저장 (Upsert) DTO
 * - wbsItemId에 평가기준이 없으면 생성
 * - wbsItemId에 평가기준이 있으면 수정
 * - WBS 항목당 하나의 평가기준만 존재
 * - 빈 문자열도 허용하여 평가기준 내용을 초기화할 수 있음
 *
 * Note: actionBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class UpsertWbsEvaluationCriteriaBodyDto {
  @ApiProperty({
    description: '평가기준 내용 (빈 문자열 허용)',
    example: '코드 품질 및 성능 최적화',
  })
  @IsString()
  criteria: string;

  @ApiProperty({
    description: '중요도 (1~5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  importance: number;

  @ApiPropertyOptional({
    description: '세부 프로젝트 (서브 프로젝트)',
    example: '모바일 앱 개발',
  })
  @IsOptional()
  @IsString()
  subProject?: string;
}

/**
 * WBS 평가기준 수정 DTO
 */
export class UpdateWbsEvaluationCriteriaDto {
  @ApiPropertyOptional({
    description: '평가기준 내용',
    example: '코드 품질 및 성능 최적화',
  })
  @IsOptional()
  @IsString()
  criteria?: string;

  @ApiPropertyOptional({
    description: '중요도 (1~5)',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  importance?: number;

  @ApiPropertyOptional({
    description: '세부 프로젝트 (서브 프로젝트)',
    example: '모바일 앱 개발',
  })
  @IsOptional()
  @IsString()
  subProject?: string;
}

/**
 * WBS 평가기준 필터 DTO
 */
export class WbsEvaluationCriteriaFilterDto {
  @ApiPropertyOptional({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  wbsItemId?: string;

  @ApiPropertyOptional({
    description: '기준 내용 검색 (부분 일치)',
    example: '코드 품질',
  })
  @IsOptional()
  @IsString()
  criteriaSearch?: string;

  @ApiPropertyOptional({
    description: '기준 내용 완전 일치',
    example: '코드 품질 및 성능 최적화',
  })
  @IsOptional()
  @IsString()
  criteriaExact?: string;
}

/**
 * 평가기간 수동 설정 상태 DTO
 */
export class EvaluationPeriodManualSettingsDto {
  @ApiProperty({
    description: '평가 기준 설정 수동 허용 여부',
    example: true,
  })
  criteriaSettingEnabled: boolean;

  @ApiProperty({
    description: '자기 평가 설정 수동 허용 여부',
    example: false,
  })
  selfEvaluationSettingEnabled: boolean;

  @ApiProperty({
    description: '하향/동료평가 설정 수동 허용 여부',
    example: false,
  })
  finalEvaluationSettingEnabled: boolean;
}

/**
 * WBS 평가기준 DTO
 */
export class WbsEvaluationCriteriaDto {
  @ApiProperty({
    description: '평가기준 ID',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  })
  id: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '평가기준 내용',
    example: '코드 품질 및 성능 최적화',
  })
  criteria: string;

  @ApiProperty({
    description: '중요도 (1~5)',
    example: 3,
  })
  importance: number;

  @ApiPropertyOptional({
    description: '세부 프로젝트 (서브 프로젝트)',
    example: '모바일 앱 개발',
    nullable: true,
  })
  subProject?: string | null;

  @ApiProperty({ description: '생성일시', example: '2024-10-01T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-10-01T09:00:00Z' })
  updatedAt: Date;
}

/**
 * WBS 평가기준 목록 조회 응답 DTO (평가기간 수동 설정 상태 포함)
 */
export class WbsEvaluationCriteriaListResponseDto {
  @ApiProperty({
    description: '평가기준 목록',
    type: [WbsEvaluationCriteriaDto],
  })
  criteria: WbsEvaluationCriteriaDto[];

  @ApiProperty({
    description: '평가기간 수동 설정 상태 정보',
    type: EvaluationPeriodManualSettingsDto,
  })
  evaluationPeriodSettings: EvaluationPeriodManualSettingsDto;
}

/**
 * WBS 평가기준 상세 DTO (WBS 항목 정보 포함)
 */
export class WbsEvaluationCriteriaDetailDto {
  @ApiProperty({
    description: '평가기준 ID',
    example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  })
  id: string;

  @ApiProperty({
    description: '평가기준 내용',
    example: '코드 품질 및 성능 최적화',
  })
  criteria: string;

  @ApiProperty({
    description: '중요도 (1~5)',
    example: 3,
  })
  importance: number;

  @ApiProperty({ description: '생성일시', example: '2024-10-01T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시', example: '2024-10-01T09:00:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'WBS 항목 정보',
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      wbsCode: { type: 'string' },
      title: { type: 'string' },
      status: { type: 'string' },
      level: { type: 'number' },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      progressPercentage: { type: 'string' },
    },
  })
  wbsItem?: {
    id: string;
    wbsCode: string;
    title: string;
    status: string;
    level: number;
    startDate: Date;
    endDate: Date;
    progressPercentage: string;
  } | null;
}

/**
 * WBS 항목별 평가기준 조회 응답 DTO
 */
export class WbsItemEvaluationCriteriaResponseDto {
  @ApiProperty({
    description: 'WBS 항목 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '평가기준 목록',
    type: [WbsEvaluationCriteriaDto],
  })
  criteria: WbsEvaluationCriteriaDto[];
}

/**
 * 평가기준 제출 요청 DTO
 */
export class SubmitEvaluationCriteriaDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsString()
  @IsUUID()
  evaluationPeriodId: string;

  @ApiProperty({
    description: '직원 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  @IsString()
  @IsUUID()
  employeeId: string;
}

/**
 * 평가기준 제출 응답 DTO
 */
export class EvaluationCriteriaSubmissionResponseDto {
  @ApiProperty({
    description: '맵핑 ID',
    example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7',
  })
  id: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  evaluationPeriodId: string;

  @ApiProperty({
    description: '직원 ID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가기준 제출 여부',
    example: true,
  })
  isCriteriaSubmitted: boolean;

  @ApiPropertyOptional({
    description: '평가기준 제출 일시',
    example: '2024-01-15T10:30:00.000Z',
  })
  criteriaSubmittedAt?: Date | null;

  @ApiPropertyOptional({
    description: '평가기준 제출 처리자 ID',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8',
  })
  criteriaSubmittedBy?: string | null;
}
