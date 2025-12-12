import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * WBS 자기평가 생성 Body DTO (경로 파라미터 제외)
 */
export class CreateWbsSelfEvaluationBodyDto {
  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  @IsOptional()
  @IsString()
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description:
      '자기평가 점수 (달성률 %, 0 ~ 평가기간의 maxSelfEvaluationRate)',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  selfEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '성과 입력 (실제 달성한 성과 및 결과)',
    example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
  })
  @IsOptional()
  @IsString()
  performanceResult?: string;

  @ApiPropertyOptional({
    description: '세부 프로젝트 (서브 프로젝트)',
    example: '모바일 앱 개발',
  })
  @IsOptional()
  @IsString()
  subProject?: string;

  // Swagger에 표시하지 않기 위해 @Api 데코레이터 제거
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}

/**
 * WBS 자기평가 수정 DTO
 */
export class UpdateWbsSelfEvaluationDto {
  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '수정된 자기평가 내용입니다.',
  })
  @IsOptional()
  @IsString()
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description:
      '자기평가 점수 (달성률 %, 0 ~ 평가기간의 maxSelfEvaluationRate)',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  selfEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '성과 입력 (실제 달성한 성과 및 결과)',
    example: 'WBS 항목 B를 완료하였으며, 목표 대비 120% 달성했습니다.',
  })
  @IsOptional()
  @IsString()
  performanceResult?: string;
}

/**
 * WBS 자기평가 제출 DTO
 *
 * Note: Body가 비어있으므로 컨트롤러에서 @Body() 사용하지 않습니다.
 * submittedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class SubmitWbsSelfEvaluationDto {
  // 이 DTO는 더 이상 필드가 없습니다.
}

/**
 * WBS 자기평가 필터 DTO
 */
export class WbsSelfEvaluationFilterDto {
  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * 자기평가 기본 정보 DTO
 */
export class WbsSelfEvaluationBasicDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  periodId: string;

  @ApiProperty({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  employeeId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '할당자 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  assignedBy: string;

  @ApiProperty({
    description: '할당일',
    example: '2024-01-01T09:00:00Z',
  })
  assignedDate: Date;

  @ApiProperty({
    description: '피평가자가 1차 평가자에게 제출한 여부',
    example: false,
  })
  submittedToEvaluator: boolean;

  @ApiPropertyOptional({
    description: '1차 평가자에게 제출한 일시',
    example: '2024-01-15T10:00:00Z',
  })
  submittedToEvaluatorAt?: Date;

  @ApiProperty({
    description: '1차 평가자가 관리자에게 제출한 여부',
    example: false,
  })
  submittedToManager: boolean;

  @ApiPropertyOptional({
    description: '관리자에게 제출한 일시',
    example: '2024-01-15T15:00:00Z',
  })
  submittedToManagerAt?: Date;

  @ApiProperty({
    description: '평가일',
    example: '2024-01-15T09:00:00Z',
  })
  evaluationDate: Date;

  @ApiPropertyOptional({
    description: '성과 입력 (실제 달성한 성과 및 결과)',
    example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
  })
  performanceResult?: string;

  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
    example: 100,
  })
  selfEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '세부 프로젝트 (서브 프로젝트)',
    example: '모바일 앱 개발',
    nullable: true,
  })
  subProject?: string | null;

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

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;
}

/**
 * WBS 자기평가 응답 DTO
 */
export class WbsSelfEvaluationResponseDto extends WbsSelfEvaluationBasicDto {}

/**
 * WBS 자기평가 상세 응답 DTO
 */
export class WbsSelfEvaluationDetailResponseDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  periodId: string;

  @ApiProperty({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  employeeId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '할당자 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  assignedBy: string;

  @ApiProperty({
    description: '할당일',
    example: '2024-01-01T09:00:00Z',
  })
  assignedDate: Date;

  @ApiProperty({
    description: '피평가자가 1차 평가자에게 제출한 여부',
    example: false,
  })
  submittedToEvaluator: boolean;

  @ApiPropertyOptional({
    description: '1차 평가자에게 제출한 일시',
    example: '2024-01-15T10:00:00Z',
  })
  submittedToEvaluatorAt?: Date;

  @ApiProperty({
    description: '1차 평가자가 관리자에게 제출한 여부',
    example: false,
  })
  submittedToManager: boolean;

  @ApiPropertyOptional({
    description: '관리자에게 제출한 일시',
    example: '2024-01-15T15:00:00Z',
  })
  submittedToManagerAt?: Date;

  @ApiProperty({
    description: '평가일',
    example: '2024-01-15T09:00:00Z',
  })
  evaluationDate: Date;

  @ApiPropertyOptional({
    description: '성과 입력 (실제 달성한 성과 및 결과)',
    example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
  })
  performanceResult?: string;

  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
    example: 100,
  })
  selfEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '세부 프로젝트 (서브 프로젝트)',
    example: '모바일 앱 개발',
    nullable: true,
  })
  subProject?: string | null;

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
    example: '2024-01-15T11:00:00Z',
  })
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: '평가기간 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440005' },
      name: { type: 'string', example: '2024년 1분기 평가' },
      startDate: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00Z',
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        example: '2024-03-31T23:59:59Z',
      },
      status: { type: 'string', example: 'ACTIVE' },
      description: { type: 'string', example: '2024년 1분기 성과평가 기간' },
    },
  })
  evaluationPeriod?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    description?: string;
  };

  @ApiPropertyOptional({
    description: '직원 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440006' },
      employeeNumber: { type: 'string', example: 'EMP001' },
      name: { type: 'string', example: '김철수' },
      email: { type: 'string', example: 'kim.chulsoo@company.com' },
      departmentId: { type: 'string', example: 'DEPT001' },
    },
  })
  employee?: {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    departmentId: string;
  };

  @ApiPropertyOptional({
    description: 'WBS 항목 정보',
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440007' },
      wbsCode: { type: 'string', example: 'WBS-001' },
      title: { type: 'string', example: '시스템 개발' },
      startDate: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T09:00:00Z',
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        example: '2024-03-31T18:00:00Z',
      },
      status: { type: 'string', example: 'IN_PROGRESS' },
      progressPercentage: { type: 'number', example: 75 },
      projectId: {
        type: 'string',
        example: '550e8400-e29b-41d4-a716-446655440008',
      },
    },
  })
  wbsItem?: {
    id: string;
    wbsCode: string;
    title: string;
    startDate?: Date;
    endDate?: Date;
    status: string;
    progressPercentage?: number;
    projectId: string;
  };
}

/**
 * 직원 자기평가 목록 응답 DTO
 */
export class EmployeeSelfEvaluationsResponseDto {
  @ApiProperty({
    description: '자기평가 목록',
    type: [WbsSelfEvaluationBasicDto],
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        periodId: '550e8400-e29b-41d4-a716-446655440005',
        employeeId: '550e8400-e29b-41d4-a716-446655440002',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440003',
        assignedBy: '550e8400-e29b-41d4-a716-446655440004',
        assignedDate: '2024-01-01T09:00:00Z',
        submittedToEvaluator: false,
        submittedToEvaluatorAt: null,
        submittedToManager: false,
        submittedToManagerAt: null,
        evaluationDate: '2024-01-15T09:00:00Z',
        performanceResult:
          'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
        selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
        selfEvaluationScore: 100,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        version: 1,
      },
    ],
  })
  evaluations: WbsSelfEvaluationBasicDto[];

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
 * 제출된 WBS 자기평가 상세 정보
 */
export class SubmittedWbsSelfEvaluationDetailDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluationId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  wbsItemId: string;

  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
    example: 100,
  })
  selfEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '성과 입력 (실제 달성한 성과 및 결과)',
    example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
  })
  performanceResult?: string;

  @ApiPropertyOptional({
    description: '관리자에게 제출한 일시 (1차 평가자 → 관리자 제출 시 사용)',
    example: '2024-01-15T15:00:00Z',
  })
  submittedToManagerAt?: Date;

  @ApiPropertyOptional({
    description:
      '1차 평가자에게 제출한 일시 (피평가자 → 1차 평가자 제출 시 사용)',
    example: '2024-01-15T10:00:00Z',
  })
  submittedToEvaluatorAt?: Date;
}

/**
 * 제출 실패한 WBS 자기평가 정보
 */
export class FailedWbsSelfEvaluationDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  evaluationId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440015',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '실패 이유',
    example: '평가 내용과 점수가 입력되지 않았습니다.',
  })
  reason: string;

  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '',
  })
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (1-5)',
    example: null,
  })
  selfEvaluationScore?: number;
}

/**
 * 전체 WBS 자기평가 제출 응답 DTO
 */
export class SubmitAllWbsSelfEvaluationsResponseDto {
  @ApiProperty({
    description: '제출된 평가 개수',
    example: 5,
  })
  submittedCount: number;

  @ApiProperty({
    description: '제출 실패한 평가 개수',
    example: 0,
  })
  failedCount: number;

  @ApiProperty({
    description: '총 평가 개수',
    example: 5,
  })
  totalCount: number;

  @ApiProperty({
    description: '완료된 평가 상세 정보',
    type: [SubmittedWbsSelfEvaluationDetailDto],
    example: [
      {
        evaluationId: '550e8400-e29b-41d4-a716-446655440001',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
        selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
        selfEvaluationScore: 4,
        performanceResult:
          'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
        submittedToManagerAt: '2024-01-15T15:00:00Z',
      },
    ],
  })
  completedEvaluations: SubmittedWbsSelfEvaluationDetailDto[];

  @ApiProperty({
    description: '실패한 평가 상세 정보 (비어있으면 모든 평가가 성공)',
    type: [FailedWbsSelfEvaluationDto],
    example: [
      {
        evaluationId: '550e8400-e29b-41d4-a716-446655440005',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440015',
        reason: '평가 내용과 점수가 입력되지 않았습니다.',
        selfEvaluationContent: '',
        selfEvaluationScore: null,
      },
    ],
  })
  failedEvaluations: FailedWbsSelfEvaluationDto[];
}

/**
 * 초기화된 WBS 자기평가 상세 정보
 */
export class ResetWbsSelfEvaluationDetailDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluationId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  wbsItemId: string;

  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
    example: 100,
  })
  selfEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '성과 입력 (실제 달성한 성과 및 결과)',
    example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
  })
  performanceResult?: string;

  @ApiProperty({
    description: '초기화 전 관리자에게 제출 상태였는지 여부',
    example: true,
  })
  wasSubmittedToManager: boolean;
}

/**
 * 초기화 실패한 WBS 자기평가 정보
 */
export class FailedResetWbsSelfEvaluationDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  evaluationId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440015',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '실패 이유',
    example: '알 수 없는 오류가 발생했습니다.',
  })
  reason: string;
}

/**
 * 전체 WBS 자기평가 초기화 응답 DTO
 */
export class ResetAllWbsSelfEvaluationsResponseDto {
  @ApiProperty({
    description: '초기화된 평가 개수',
    example: 2,
  })
  resetCount: number;

  @ApiProperty({
    description: '초기화 실패한 평가 개수',
    example: 1,
  })
  failedCount: number;

  @ApiProperty({
    description: '총 평가 개수',
    example: 5,
  })
  totalCount: number;

  @ApiProperty({
    description: '초기화된 평가 상세 정보',
    type: [ResetWbsSelfEvaluationDetailDto],
    example: [
      {
        evaluationId: '550e8400-e29b-41d4-a716-446655440001',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
        selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
        selfEvaluationScore: 4,
        performanceResult:
          'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
        wasCompleted: true,
      },
    ],
  })
  resetEvaluations: ResetWbsSelfEvaluationDetailDto[];

  @ApiProperty({
    description: '초기화 실패한 평가 정보 (비어있으면 모든 초기화 성공)',
    type: [FailedResetWbsSelfEvaluationDto],
    example: [
      {
        evaluationId: '550e8400-e29b-41d4-a716-446655440005',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440015',
        reason: '데이터베이스 제약 조건 위반으로 초기화에 실패했습니다.',
      },
    ],
  })
  failedResets: FailedResetWbsSelfEvaluationDto[];
}

/**
 * 프로젝트별 제출된 WBS 자기평가 상세 정보
 */
export class SubmittedWbsSelfEvaluationByProjectDetailDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluationId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  wbsItemId: string;

  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
    example: 100,
  })
  selfEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '성과 입력 (실제 달성한 성과 및 결과)',
    example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
  })
  performanceResult?: string;

  @ApiProperty({
    description: '관리자에게 제출한 일시',
    example: '2024-01-15T09:30:00Z',
  })
  submittedToManagerAt?: Date;
  submittedToEvaluatorAt?: Date;
}

/**
 * 프로젝트별 실패한 WBS 자기평가 정보
 */
export class FailedWbsSelfEvaluationByProjectDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  evaluationId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440015',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '실패 이유',
    example: '평가 내용과 점수가 입력되지 않았습니다.',
  })
  reason: string;

  @ApiPropertyOptional({
    description: '자기평가 내용 (입력된 경우)',
    example: '',
  })
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (입력된 경우)',
    example: null,
  })
  selfEvaluationScore?: number;
}

/**
 * 프로젝트별 WBS 자기평가 제출 응답 DTO
 */
export class SubmitWbsSelfEvaluationsByProjectResponseDto {
  @ApiProperty({
    description: '제출된 평가 개수',
    example: 2,
  })
  submittedCount: number;

  @ApiProperty({
    description: '제출 실패한 평가 개수',
    example: 1,
  })
  failedCount: number;

  @ApiProperty({
    description: '총 평가 개수',
    example: 3,
  })
  totalCount: number;

  @ApiProperty({
    description: '제출된 평가 상세 정보',
    type: [SubmittedWbsSelfEvaluationByProjectDetailDto],
    example: [
      {
        evaluationId: '550e8400-e29b-41d4-a716-446655440001',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
        selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
        selfEvaluationScore: 4,
        performanceResult:
          'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
        submittedToManagerAt: '2024-01-15T09:30:00Z',
      },
    ],
  })
  completedEvaluations: SubmittedWbsSelfEvaluationByProjectDetailDto[];

  @ApiProperty({
    description: '제출 실패한 평가 상세 정보 (비어있으면 모든 평가가 성공)',
    type: [FailedWbsSelfEvaluationByProjectDto],
    example: [
      {
        evaluationId: '550e8400-e29b-41d4-a716-446655440005',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440015',
        reason: '평가 내용과 점수가 입력되지 않았습니다.',
        selfEvaluationContent: '',
        selfEvaluationScore: null,
      },
    ],
  })
  failedEvaluations: FailedWbsSelfEvaluationByProjectDto[];
}

/**
 * 프로젝트별 초기화된 WBS 자기평가 상세 정보
 */
export class ResetWbsSelfEvaluationByProjectDetailDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  evaluationId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  wbsItemId: string;

  @ApiPropertyOptional({
    description: '자기평가 내용',
    example: '이번 분기 목표를 성공적으로 달성했습니다.',
  })
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '자기평가 점수 (0-maxSelfEvaluationRate, 기본값 120)',
    example: 100,
  })
  selfEvaluationScore?: number;

  @ApiPropertyOptional({
    description: '성과 입력 (실제 달성한 성과 및 결과)',
    example: 'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
  })
  performanceResult?: string;

  @ApiProperty({
    description: '초기화 전 관리자에게 제출 상태였는지 여부',
    example: true,
  })
  wasSubmittedToManager: boolean;
}

/**
 * 프로젝트별 초기화 실패한 WBS 자기평가 정보
 */
export class FailedResetWbsSelfEvaluationByProjectDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  evaluationId: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440015',
  })
  wbsItemId: string;

  @ApiProperty({
    description: '실패 이유',
    example: '데이터베이스 제약 조건 위반으로 초기화에 실패했습니다.',
  })
  reason: string;
}

/**
 * 프로젝트별 WBS 자기평가 초기화 응답 DTO
 */
export class ResetWbsSelfEvaluationsByProjectResponseDto {
  @ApiProperty({
    description: '초기화된 평가 개수',
    example: 2,
  })
  resetCount: number;

  @ApiProperty({
    description: '초기화 실패한 평가 개수',
    example: 1,
  })
  failedCount: number;

  @ApiProperty({
    description: '총 평가 개수',
    example: 3,
  })
  totalCount: number;

  @ApiProperty({
    description: '초기화된 평가 상세 정보',
    type: [ResetWbsSelfEvaluationByProjectDetailDto],
    example: [
      {
        evaluationId: '550e8400-e29b-41d4-a716-446655440001',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
        selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
        selfEvaluationScore: 4,
        performanceResult:
          'WBS 항목 A를 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
        wasCompleted: true,
      },
    ],
  })
  resetEvaluations: ResetWbsSelfEvaluationByProjectDetailDto[];

  @ApiProperty({
    description: '초기화 실패한 평가 정보 (비어있으면 모든 초기화 성공)',
    type: [FailedResetWbsSelfEvaluationByProjectDto],
    example: [
      {
        evaluationId: '550e8400-e29b-41d4-a716-446655440005',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440015',
        reason: '데이터베이스 제약 조건 위반으로 초기화에 실패했습니다.',
      },
    ],
  })
  failedResets: FailedResetWbsSelfEvaluationByProjectDto[];
}

/**
 * WBS 자기평가 내용 초기화된 상세 정보
 */
export class ClearedWbsSelfEvaluationDetailDto {
  @ApiProperty({
    description: '자기평가 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'WBS 항목 ID',
    example: '550e8400-e29b-41d4-a716-446655440010',
  })
  wbsItemId: string;

  @ApiPropertyOptional({
    description: '초기화된 자기평가 내용',
    example: '',
  })
  selfEvaluationContent?: string;

  @ApiPropertyOptional({
    description: '초기화된 자기평가 점수',
    example: 1,
  })
  selfEvaluationScore?: number;

  @ApiProperty({
    description: '초기화된 성과 입력 (빈 문자열)',
    example: '',
  })
  performanceResult?: string;
}

/**
 * 직원의 전체 WBS 자기평가 내용 초기화 응답 DTO
 */
export class ClearAllWbsSelfEvaluationsResponseDto {
  @ApiProperty({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  periodId: string;

  @ApiProperty({
    description: '내용이 초기화된 평가 개수',
    example: 5,
  })
  clearedCount: number;

  @ApiProperty({
    description: '초기화된 평가 상세 정보',
    type: [ClearedWbsSelfEvaluationDetailDto],
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
        selfEvaluationContent: '',
        selfEvaluationScore: 1,
        performanceResult: '',
      },
    ],
  })
  clearedEvaluations: ClearedWbsSelfEvaluationDetailDto[];
}

/**
 * 프로젝트별 WBS 자기평가 내용 초기화 응답 DTO
 */
export class ClearWbsSelfEvaluationsByProjectResponseDto {
  @ApiProperty({
    description: '직원 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  employeeId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  periodId: string;

  @ApiProperty({
    description: '프로젝트 ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  projectId: string;

  @ApiProperty({
    description: '내용이 초기화된 평가 개수',
    example: 3,
  })
  clearedCount: number;

  @ApiProperty({
    description: '초기화된 평가 상세 정보',
    type: [ClearedWbsSelfEvaluationDetailDto],
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        wbsItemId: '550e8400-e29b-41d4-a716-446655440010',
        selfEvaluationContent: '',
        selfEvaluationScore: 1,
        performanceResult: '',
      },
    ],
  })
  clearedEvaluations: ClearedWbsSelfEvaluationDetailDto[];
}
