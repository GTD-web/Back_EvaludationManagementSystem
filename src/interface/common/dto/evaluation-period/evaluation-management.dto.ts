import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DateToUTC,
  OptionalDateToUTC,
} from '@interface/common/decorators/date-transform.decorator';

/**
 * 페이징 쿼리 DTO
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '페이지 번호는 숫자여야 합니다.' })
  @Min(1, { message: '페이지 번호는 1 이상이어야 합니다.' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber({}, { message: '페이지 크기는 숫자여야 합니다.' })
  @Min(1, { message: '페이지 크기는 1 이상이어야 합니다.' })
  @Max(100, { message: '페이지 크기는 100 이하여야 합니다.' })
  @Type(() => Number)
  limit?: number = 10;
}

/**
 * 페이징 응답 DTO
 */
export class PaginationResponseDto<T> {
  @ApiProperty({ description: '데이터 목록' })
  items: T[];

  @ApiProperty({ description: '전체 데이터 개수' })
  total: number;

  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지 크기' })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부' })
  hasNext: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부' })
  hasPrev: boolean;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}

/**
 * 등급 구간 생성 DTO (API용)
 */
export class CreateGradeRangeApiDto {
  @ApiProperty({
    description: '등급',
    example: 'S',
  })
  @IsString({ message: '등급은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '등급은 필수 입력 항목입니다.' })
  grade: string;

  @ApiProperty({
    description: '최소 범위',
    example: 90,
  })
  @IsNumber({}, { message: '최소 범위는 숫자여야 합니다.' })
  @Min(0, { message: '최소 범위는 0 이상이어야 합니다.' })
  @Max(1000, { message: '최소 범위는 1000 이하여야 합니다.' })
  minRange: number;

  @ApiProperty({
    description: '최대 범위',
    example: 100,
  })
  @IsNumber({}, { message: '최대 범위는 숫자여야 합니다.' })
  @Min(0, { message: '최대 범위는 0 이상이어야 합니다.' })
  @Max(1000, { message: '최대 범위는 1000 이하여야 합니다.' })
  maxRange: number;
}

/**
 * 평가 기간 생성 API DTO
 */
export class CreateEvaluationPeriodApiDto {
  @ApiProperty({
    description: '평가 기간명',
    example: '2024년 상반기 평가',
  })
  @IsString({ message: '평가 기간명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '평가 기간명은 필수 입력 항목입니다.' })
  name: string;

  @ApiProperty({
    description: '평가 기간 시작일 (UTC 기준)',
    example: '2024-01-01',
  })
  @IsNotEmpty({ message: '평가 기간 시작일은 필수 입력 항목입니다.' })
  @DateToUTC()
  startDate: string;

  @ApiProperty({
    description: '하향/동료평가 마감일 (UTC 기준)',
    example: '2024-06-30',
  })
  @IsNotEmpty({ message: '하향/동료평가 마감일은 필수 입력 항목입니다.' })
  @DateToUTC()
  peerEvaluationDeadline: string;

  @ApiPropertyOptional({
    description: '평가 기간 설명',
    example: '2024년 상반기 직원 평가를 진행합니다.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '자기평가 달성률 최대값 (%)',
    example: 120,
    minimum: 100,
    maximum: 200,
    default: 120,
  })
  @IsOptional()
  @IsNumber({}, { message: '자기평가 달성률 최대값은 숫자여야 합니다.' })
  @Min(100, { message: '자기평가 달성률 최대값은 100% 이상이어야 합니다.' })
  @Max(200, { message: '자기평가 달성률 최대값은 200% 이하여야 합니다.' })
  maxSelfEvaluationRate?: number;

  @ApiPropertyOptional({
    description: '등급 구간 설정',
    type: [CreateGradeRangeApiDto],
  })
  @IsOptional()
  @IsArray({ message: '등급 구간 설정은 배열이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CreateGradeRangeApiDto)
  gradeRanges?: CreateGradeRangeApiDto[];

  @ApiPropertyOptional({
    description:
      '복사할 원본 평가기간 ID (지정 시 원본의 평가항목과 평가라인을 복사)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString({ message: '원본 평가기간 ID는 문자열이어야 합니다.' })
  sourcePeriodId?: string;
}

/**
 * 평가 기간 기본 정보 수정 API DTO
 */
export class UpdateEvaluationPeriodBasicApiDto {
  @ApiPropertyOptional({
    description: '평가 기간명',
    example: '2024년 상반기 평가 (수정)',
  })
  @IsOptional()
  @IsString({ message: '평가 기간명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '평가 기간명이 제공된 경우 빈 값일 수 없습니다.' })
  name?: string;

  @ApiPropertyOptional({
    description: '평가 기간 설명',
    example: '수정된 평가 기간 설명',
  })
  @IsOptional()
  @IsString({ message: '평가 기간 설명은 문자열이어야 합니다.' })
  description?: string;

  @ApiPropertyOptional({
    description: '자기평가 달성률 최대값 (%)',
    example: 130,
    minimum: 100,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber({}, { message: '자기평가 달성률 최대값은 숫자여야 합니다.' })
  @Min(100, { message: '자기평가 달성률 최대값은 100% 이상이어야 합니다.' })
  @Max(200, { message: '자기평가 달성률 최대값은 200% 이하여야 합니다.' })
  maxSelfEvaluationRate?: number;
}

/**
 * 평가 기간 일정 수정 API DTO
 */
export class UpdateEvaluationPeriodScheduleApiDto {
  @ApiPropertyOptional({
    description: '평가 기간 시작일 (UTC 기준)',
    example: '2024-01-01',
  })
  @IsOptional()
  @OptionalDateToUTC()
  @IsDate()
  startDate?: string;

  @ApiPropertyOptional({
    description: '평가 설정 마감일 (UTC 기준)',
    example: '2024-01-15',
  })
  @IsOptional()
  @OptionalDateToUTC()
  @IsDate()
  evaluationSetupDeadline?: string;

  @ApiPropertyOptional({
    description: '성과 입력 마감일 (UTC 기준)',
    example: '2024-05-31',
  })
  @IsOptional()
  @OptionalDateToUTC()
  @IsDate()
  performanceDeadline?: string;

  @ApiPropertyOptional({
    description: '자기평가 마감일 (UTC 기준)',
    example: '2024-06-15',
  })
  @IsOptional()
  @OptionalDateToUTC()
  @IsDate()
  selfEvaluationDeadline?: string;

  @ApiPropertyOptional({
    description: '하향/동료평가 마감일 (UTC 기준)',
    example: '2024-06-30',
  })
  @IsOptional()
  @OptionalDateToUTC()
  @IsDate()
  peerEvaluationDeadline?: string;
}

/**
 * 평가 기간 시작일 수정 API DTO
 */
export class UpdateEvaluationPeriodStartDateApiDto {
  @ApiProperty({
    description: '평가 기간 시작일 (UTC 기준)',
    example: '2024-01-01',
  })
  @IsNotEmpty({ message: '평가 기간 시작일은 필수 입력 항목입니다.' })
  @DateToUTC()
  startDate: string;
}

/**
 * 평가 기간 복제 API DTO
 */
export class CopyEvaluationPeriodApiDto {
  @ApiProperty({
    description: '복사할 소스 평가기간 ID (이 평가기간의 설정을 복사)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: '소스 평가기간 ID는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '소스 평가기간 ID는 필수 입력 항목입니다.' })
  sourceEvaluationPeriodId: string;
}

/**
 * 평가설정 단계 마감일 수정 API DTO
 */
export class UpdateEvaluationSetupDeadlineApiDto {
  @ApiProperty({
    description: '평가설정 단계 마감일 (UTC 기준)',
    example: '2024-01-15',
  })
  @IsNotEmpty({ message: '평가설정 단계 마감일은 필수 입력 항목입니다.' })
  @DateToUTC()
  evaluationSetupDeadline: string;
}

/**
 * 업무 수행 단계 마감일 수정 API DTO
 */
export class UpdatePerformanceDeadlineApiDto {
  @ApiProperty({
    description: '업무 수행 단계 마감일 (UTC 기준)',
    example: '2024-05-31',
  })
  @IsNotEmpty({ message: '업무 수행 단계 마감일은 필수 입력 항목입니다.' })
  @DateToUTC()
  performanceDeadline: string;
}

/**
 * 자기 평가 단계 마감일 수정 API DTO
 */
export class UpdateSelfEvaluationDeadlineApiDto {
  @ApiProperty({
    description: '자기 평가 단계 마감일 (UTC 기준)',
    example: '2024-06-15',
  })
  @IsNotEmpty({ message: '자기 평가 단계 마감일은 필수 입력 항목입니다.' })
  @DateToUTC()
  selfEvaluationDeadline: string;
}

/**
 * 하향/동료평가 단계 마감일 수정 API DTO
 */
export class UpdatePeerEvaluationDeadlineApiDto {
  @ApiProperty({
    description: '하향/동료평가 단계 마감일 (UTC 기준)',
    example: '2024-06-30',
  })
  @IsNotEmpty({ message: '하향/동료평가 단계 마감일은 필수 입력 항목입니다.' })
  @DateToUTC()
  peerEvaluationDeadline: string;
}

/**
 * 등급 구간 수정 API DTO
 */
export class UpdateGradeRangesApiDto {
  @ApiProperty({
    description: '등급 구간 목록',
    type: [CreateGradeRangeApiDto],
  })
  @IsArray({ message: '등급 구간 목록은 배열이어야 합니다.' })
  @ArrayNotEmpty({ message: '등급 구간 목록은 최소 1개 이상이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CreateGradeRangeApiDto)
  gradeRanges: CreateGradeRangeApiDto[];
}

/**
 * 기본 등급 구간 변경 API DTO
 */
export class UpdateDefaultGradeRangesApiDto {
  @ApiProperty({
    description: '기본 등급 구간 목록',
    type: [CreateGradeRangeApiDto],
  })
  @IsArray({ message: '등급 구간 목록은 배열이어야 합니다.' })
  @ArrayNotEmpty({ message: '등급 구간 목록은 최소 1개 이상이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CreateGradeRangeApiDto)
  gradeRanges: CreateGradeRangeApiDto[];
}

/**
 * 수동 허용 설정 DTO
 */
export class ManualPermissionSettingDto {
  @ApiProperty({
    description: '수동 허용 여부 (true: 허용, false: 비허용)',
    example: true,
    type: 'boolean',
  })
  @IsBoolean({ message: '수동 허용 여부는 불린 값(true/false)이어야 합니다.' })
  @IsNotEmpty({ message: '수동 허용 여부는 필수 입력 항목입니다.' })
  allowManualSetting: boolean;
}

/**
 * 전체 수동 허용 설정 API DTO
 */
export class UpdateManualSettingPermissionsApiDto {
  @ApiPropertyOptional({
    description: '평가 기준 설정 수동 허용',
    example: true,
  })
  @IsOptional()
  @IsBoolean({
    message: '평가 기준 설정 수동 허용은 불린 값(true/false)이어야 합니다.',
  })
  allowCriteriaManualSetting?: boolean;

  @ApiPropertyOptional({
    description: '자기평가 설정 수동 허용',
    example: true,
  })
  @IsOptional()
  @IsBoolean({
    message: '자기평가 설정 수동 허용은 불린 값(true/false)이어야 합니다.',
  })
  allowSelfEvaluationManualSetting?: boolean;

  @ApiPropertyOptional({
    description: '최종평가 설정 수동 허용',
    example: false,
  })
  @IsOptional()
  @IsBoolean({
    message: '최종평가 설정 수동 허용은 불린 값(true/false)이어야 합니다.',
  })
  allowFinalEvaluationManualSetting?: boolean;
}

/**
 * 평가기간 단계 변경 API DTO
 */
export class ChangeEvaluationPeriodPhaseApiDto {
  @ApiProperty({
    description: '변경할 단계',
    example: 'performance',
    enum: [
      'waiting',
      'evaluation-setup',
      'performance',
      'self-evaluation',
      'peer-evaluation',
      'closure',
    ],
  })
  @IsString({ message: '단계는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '단계는 필수 입력 항목입니다.' })
  targetPhase: string;
}

/**
 * 복사할 프로젝트 및 WBS 선택 DTO
 */
export class CopyProjectWithWbsDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'projectId는 유효한 UUID여야 합니다.' })
  projectId: string;

  @ApiPropertyOptional({
    description: '복사할 WBS ID 목록 (선택사항, 미지정 시 프로젝트 내 모든 WBS 복사)',
    example: ['123e4567-e89b-12d3-a456-426614174001'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'wbsIds는 배열이어야 합니다.' })
  @IsUUID('4', { each: true, message: '각 wbsId는 유효한 UUID여야 합니다.' })
  wbsIds?: string[];
}

/**
 * 이전 평가기간 데이터 복사 요청 DTO
 */
export class CopyPreviousPeriodDataApiDto {
  @ApiPropertyOptional({
    description: '복사할 프로젝트 및 WBS 목록 (선택사항, 미지정 시 모든 프로젝트와 WBS 복사)',
    example: [
      {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        wbsIds: ['123e4567-e89b-12d3-a456-426614174001'],
      },
    ],
    type: [CopyProjectWithWbsDto],
  })
  @IsOptional()
  @IsArray({ message: 'projects는 배열이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CopyProjectWithWbsDto)
  projects?: CopyProjectWithWbsDto[];
}

/**
 * 이전 평가기간 데이터 복사 응답 DTO
 */
export class CopyPreviousPeriodDataResponseDto {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: '이전 평가기간 데이터를 성공적으로 복사했습니다.',
  })
  message: string;

  @ApiProperty({
    description: '복사된 프로젝트 할당 수',
    example: 3,
  })
  copiedProjectAssignments: number;

  @ApiProperty({
    description: '복사된 WBS 할당 수',
    example: 8,
  })
  copiedWbsAssignments: number;

  @ApiProperty({
    description: '복사된 평가라인 매핑 수',
    example: 12,
  })
  copiedEvaluationLineMappings: number;

  @ApiProperty({
    description: '복사된 WBS 평가 기준 수',
    example: 15,
  })
  copiedWbsEvaluationCriteria: number;
}

/**
 * API 응답 기본 형태
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '응답 메시지' })
  message: string;

  @ApiProperty({ description: '응답 데이터' })
  data?: T;

  @ApiProperty({ description: '오류 정보' })
  error?: any;

  constructor(success: boolean, message: string, data?: T, error?: any) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
  }
}
