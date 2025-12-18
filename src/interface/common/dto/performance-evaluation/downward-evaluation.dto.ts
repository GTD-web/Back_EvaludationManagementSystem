import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from '@interface/common/decorators';

/**
 * 1차 하향평가 생성 Body DTO (경로 파라미터 제외)
 *
 * Note: createdBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class CreatePrimaryDownwardEvaluationBodyDto {
  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  evaluatorId: string;

  @ApiPropertyOptional({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  selfEvaluationId?: string;

  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '팀원의 업무 수행 능력이 우수합니다.',
  })
  @IsOptional()
  @IsString()
  downwardEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (양의 정수만 가능)',
    example: 4,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  downwardEvaluationScore?: number;
}

/**
 * 2차 하향평가 생성 Body DTO (경로 파라미터 제외)
 *
 * Note: createdBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class CreateSecondaryDownwardEvaluationBodyDto {
  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  evaluatorId: string;

  @ApiPropertyOptional({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  selfEvaluationId?: string;

  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '팀원의 업무 수행 능력이 우수합니다.',
  })
  @IsOptional()
  @IsString()
  downwardEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (양의 정수만 가능)',
    example: 4,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  downwardEvaluationScore?: number;
}

/**
 * 하향평가 수정 DTO
 */
export class UpdateDownwardEvaluationDto {
  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '수정된 하향평가 내용입니다.',
  })
  @IsOptional()
  @IsString()
  downwardEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (양의 정수만 가능)',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  downwardEvaluationScore?: number;
}

/**
 * 하향평가 제출 DTO
 *
 * Note: submittedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 * Note: evaluationType은 쿼리 스트링으로 제공됩니다.
 */
export class SubmitDownwardEvaluationDto {
  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  evaluatorId: string;
}

/**
 * 하향평가 제출 쿼리 DTO
 */
export class SubmitDownwardEvaluationQueryDto {
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

/**
 * 하향평가 필터 DTO
 */
export class DownwardEvaluationFilterDto {
  @ApiPropertyOptional({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  evaluateeId?: string;

  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({
    description: 'WBS ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  @IsOptional()
  @IsUUID()
  wbsId?: string;

  @ApiPropertyOptional({
    description: '평가 유형',
    example: 'primary',
    enum: ['primary', 'secondary'],
  })
  @IsOptional()
  @IsEnum(['primary', 'secondary'])
  evaluationType?: string;

  @ApiPropertyOptional({
    description: '완료 여부',
    example: false,
  })
  @IsOptional()
  @ToBoolean(false)
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * 하향평가 기본 정보 DTO
 */
export class DownwardEvaluationBasicDto {
  @ApiProperty({
    description: '하향평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '피평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  evaluatorId: string;

  @ApiProperty({
    description: 'WBS ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  wbsId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  periodId: string;

  @ApiPropertyOptional({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  selfEvaluationId?: string;

  @ApiProperty({
    description: '평가일',
    example: '2024-01-15T09:00:00Z',
  })
  evaluationDate: Date;

  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '팀원의 업무 수행 능력이 우수합니다.',
  })
  downwardEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (양의 정수)',
    example: 4,
  })
  downwardEvaluationScore?: number;

  @ApiProperty({
    description: '평가 유형',
    example: 'primary',
    enum: ['primary', 'secondary'],
  })
  evaluationType: string;

  @ApiProperty({
    description: '완료 여부',
    example: false,
  })
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: '완료 일시',
    example: '2024-01-15T11:00:00Z',
  })
  completedAt?: Date;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '삭제 일시',
    example: '2024-01-15T12:00:00Z',
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440006',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440007',
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전 번호',
    example: 1,
  })
  version: number;
}

/**
 * 하향평가 응답 DTO
 */
export class DownwardEvaluationResponseDto {
  @ApiProperty({
    description: '하향평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가자 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluatorId: string;

  @ApiProperty({
    description: '결과 메시지',
    example: '하향평가가 성공적으로 생성되었습니다.',
  })
  message: string;
}

/**
 * 하향평가 초기화 응답 DTO
 */
export class ResetDownwardEvaluationResponseDto {
  @ApiProperty({
    description: '결과 메시지',
    example: '1차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
  })
  message: string;
}

/**
 * 하향평가 목록 응답 DTO
 */
export class DownwardEvaluationListResponseDto {
  @ApiProperty({
    description: '하향평가 목록',
    type: [DownwardEvaluationBasicDto],
  })
  evaluations: DownwardEvaluationBasicDto[];

  @ApiProperty({
    description: '전체 개수',
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

/**
 * 하향평가 상세 응답 DTO
 * 관련 엔티티 정보를 객체로 포함합니다.
 */
export class DownwardEvaluationDetailResponseDto {
  @ApiProperty({
    description: '하향평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가일',
    example: '2024-01-15T09:00:00Z',
  })
  evaluationDate: Date;

  @ApiPropertyOptional({
    description: '하향평가 내용',
    example: '팀원의 업무 수행 능력이 우수합니다.',
  })
  downwardEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '하향평가 점수 (양의 정수)',
    example: 4,
  })
  downwardEvaluationScore?: number;

  @ApiProperty({
    description: '평가 유형',
    example: 'primary',
    enum: ['primary', 'secondary'],
  })
  evaluationType: string;

  @ApiProperty({
    description: '완료 여부',
    example: false,
  })
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: '완료 일시',
    example: '2024-01-15T11:00:00Z',
  })
  completedAt?: Date;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '삭제 일시',
    example: '2024-01-15T12:00:00Z',
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440006',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440007',
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전 번호',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: '피평가자 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
      name: { type: 'string', example: '홍길동' },
      employeeNumber: { type: 'string', example: 'EMP001' },
      email: { type: 'string', example: 'hong@example.com' },
      departmentId: { type: 'string', example: 'DEPT001' },
      status: { type: 'string', example: 'ACTIVE' },
    },
  })
  employee?: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;

  @ApiPropertyOptional({
    description: '평가자 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' },
      name: { type: 'string', example: '김철수' },
      employeeNumber: { type: 'string', example: 'EMP002' },
      email: { type: 'string', example: 'kim@example.com' },
      departmentId: { type: 'string', example: 'DEPT001' },
      status: { type: 'string', example: 'ACTIVE' },
    },
  })
  evaluator?: {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentId: string;
    status: string;
  } | null;

  @ApiPropertyOptional({
    description: 'WBS 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440003' },
      name: { type: 'string', example: 'API 개발' },
      code: { type: 'string', example: 'WBS001' },
      status: { type: 'string', example: 'IN_PROGRESS' },
      startDate: { type: 'string', example: '2024-01-01T00:00:00Z' },
      endDate: { type: 'string', example: '2024-12-31T23:59:59Z' },
    },
  })
  wbs?: {
    id: string;
    name: string;
    code: string;
    status: string;
    startDate: Date;
    endDate: Date;
  } | null;

  @ApiPropertyOptional({
    description: '평가기간 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440004' },
      name: { type: 'string', example: '2024년 상반기 평가' },
      startDate: { type: 'string', example: '2024-01-01T00:00:00Z' },
      endDate: { type: 'string', example: '2024-06-30T23:59:59Z' },
      status: { type: 'string', example: 'IN_PROGRESS' },
    },
  })
  period?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  } | null;

  @ApiPropertyOptional({
    description: '자기평가 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440005' },
      wbsItemId: {
        type: 'string',
        example: '550e8400-e29b-41d4-a716-446655440010',
      },
      performanceResult: {
        type: 'string',
        example: '프로젝트 성공적으로 완료',
      },
      selfEvaluationContent: {
        type: 'string',
        example: '목표를 초과 달성했습니다.',
      },
      selfEvaluationScore: { type: 'number', example: 5 },
      isCompleted: { type: 'boolean', example: true },
      completedAt: { type: 'string', example: '2024-01-15T10:00:00Z' },
      evaluationDate: { type: 'string', example: '2024-01-15T09:00:00Z' },
    },
  })
  selfEvaluation?: {
    id: string;
    wbsItemId: string;
    performanceResult: string | null;
    selfEvaluationContent: string | null;
    selfEvaluationScore: number | null;
    isCompleted: boolean;
    completedAt: Date | null;
    evaluationDate: Date;
  } | null;
}
