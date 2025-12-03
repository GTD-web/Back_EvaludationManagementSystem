import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

// ==================== 질문 그룹 관련 DTO ====================

/**
 * 질문 그룹 생성 DTO
 *
 * Note: createdBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class CreateQuestionGroupDto {
  @ApiProperty({
    description: '그룹명',
    example: '기본 평가 질문',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '기본 그룹 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  isDefault?: boolean;
}

/**
 * 질문 그룹 수정 DTO
 *
 * Note: updatedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class UpdateQuestionGroupDto {
  @ApiPropertyOptional({
    description: '그룹명',
    example: '수정된 평가 질문',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '기본 그룹 여부',
    example: true,
  })
  @IsOptional()
  isDefault?: boolean;
}

/**
 * 질문 그룹 응답 DTO
 */
export class QuestionGroupResponseDto {
  @ApiProperty({
    description: '그룹 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '그룹명',
    example: '기본 평가 질문',
  })
  name: string;

  @ApiProperty({
    description: '기본 그룹 여부',
    example: false,
  })
  isDefault: boolean;

  @ApiProperty({
    description: '삭제 가능 여부',
    example: true,
  })
  isDeletable: boolean;

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

// ==================== 평가 질문 관련 DTO ====================

/**
 * 평가 질문 생성 DTO
 */
export class CreateEvaluationQuestionDto {
  @ApiProperty({
    description: '질문 내용',
    example: '프로젝트 수행 능력은 어떠한가요?',
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: '최소 점수',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minScore?: number;

  @ApiPropertyOptional({
    description: '최대 점수',
    example: 5,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Max(100)
  maxScore?: number;

  @ApiPropertyOptional({
    description: '그룹 ID (선택사항 - 제공 시 해당 그룹에 자동 추가)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({
    description:
      '표시 순서 (그룹 추가 시 사용, 생략 시 그룹의 마지막 순서로 자동 배치)',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

/**
 * 평가 질문 수정 DTO
 *
 * Note: updatedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class UpdateEvaluationQuestionDto {
  @ApiPropertyOptional({
    description: '질문 내용',
    example: '업무 수행 능력은 어떠한가요?',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: '최소 점수',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minScore?: number;

  @ApiPropertyOptional({
    description: '최대 점수',
    example: 5,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Max(100)
  maxScore?: number;
}

/**
 * 평가 질문 응답 DTO
 */
export class EvaluationQuestionResponseDto {
  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '질문 내용',
    example: '프로젝트 수행 능력은 어떠한가요?',
  })
  text: string;

  @ApiPropertyOptional({
    description: '최소 점수',
    example: 1,
    nullable: true,
  })
  minScore?: number;

  @ApiPropertyOptional({
    description: '최대 점수',
    example: 5,
    nullable: true,
  })
  maxScore?: number;

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

// ==================== 질문-그룹 매핑 관련 DTO ====================

/**
 * 그룹에 질문 추가 DTO
 *
 * Note: displayOrder를 생략하면 자동으로 그룹의 마지막 순서로 배치됩니다.
 */
export class AddQuestionToGroupDto {
  @ApiProperty({
    description: '그룹 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({
    description: '표시 순서 (생략 시 그룹의 마지막 순서로 자동 배치)',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

/**
 * 그룹에 여러 질문 추가 DTO
 *
 * Note: createdBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class AddMultipleQuestionsToGroupDto {
  @ApiProperty({
    description: '그룹 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @ApiProperty({
    description: '질문 ID 배열',
    example: [
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
      '123e4567-e89b-12d3-a456-426614174003',
    ],
    type: [String],
  })
  @IsNotEmpty()
  questionIds: string[];

  @ApiPropertyOptional({
    description: '시작 표시 순서 (첫 질문부터 순차적으로 할당)',
    example: 1,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  startDisplayOrder?: number;
}

/**
 * 그룹 내 질문 순서 재정의 DTO
 *
 * Note: updatedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class ReorderGroupQuestionsDto {
  @ApiProperty({
    description: '그룹 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @ApiProperty({
    description:
      '질문 ID 배열 (배열 순서대로 displayOrder가 0부터 순차 할당됨)',
    example: [
      '123e4567-e89b-12d3-a456-426614174003',
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
    ],
    type: [String],
  })
  @IsNotEmpty()
  questionIds: string[];
}

/**
 * 질문-그룹 매핑 응답 DTO
 */
export class QuestionGroupMappingResponseDto {
  @ApiProperty({
    description: '매핑 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '그룹 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  groupId: string;

  @ApiProperty({
    description: '질문 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  questionId: string;

  @ApiProperty({
    description: '표시 순서',
    example: 1,
  })
  displayOrder: number;

  @ApiPropertyOptional({
    description: '그룹 정보',
    type: QuestionGroupResponseDto,
  })
  group?: QuestionGroupResponseDto;

  @ApiPropertyOptional({
    description: '질문 정보',
    type: EvaluationQuestionResponseDto,
  })
  question?: EvaluationQuestionResponseDto;

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

// ==================== 공통 응답 DTO ====================

/**
 * 작업 성공 응답 DTO
 */
export class SuccessResponseDto {
  @ApiProperty({
    description: '생성/수정된 리소스 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '응답 메시지',
    example: '성공적으로 처리되었습니다.',
  })
  message: string;
}

/**
 * 배치 작업 성공 응답 DTO
 */
export class BatchSuccessResponseDto {
  @ApiProperty({
    description: '생성/수정된 리소스 ID 배열',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
    type: [String],
  })
  ids: string[];

  @ApiProperty({
    description: '응답 메시지',
    example: '성공적으로 처리되었습니다.',
  })
  message: string;

  @ApiProperty({
    description: '성공 개수',
    example: 2,
  })
  successCount: number;

  @ApiProperty({
    description: '전체 개수',
    example: 3,
  })
  totalCount: number;
}

// ==================== 파트장 질문 설정 관련 DTO ====================

/**
 * 파트장 질문 설정 응답 DTO
 */
export class PartLeaderQuestionSettingsResponseDto {
  @ApiProperty({
    description: '파트장 질문 그룹 정보',
    type: QuestionGroupResponseDto,
  })
  group: QuestionGroupResponseDto;

  @ApiProperty({
    description: '파트장 질문 목록 (displayOrder 순)',
    type: [QuestionGroupMappingResponseDto],
  })
  questions: QuestionGroupMappingResponseDto[];
}

/**
 * 파트장 질문 설정 업데이트 DTO
 */
export class UpdatePartLeaderQuestionSettingsDto {
  @ApiProperty({
    description: '파트장 평가에 사용할 질문 ID 목록 (순서대로 적용)',
    type: [String],
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
    ],
  })
  @IsUUID('4', { each: true })
  questionIds: string[];
}