import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEmail,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PM 생성 DTO
 */
export class CreateProjectManagerDto {
  @ApiProperty({
    description: '직원 ID (Employee UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  employeeId: string;

  @ApiPropertyOptional({
    description: '활성 상태',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '비고',
    example: 'PM 역할 추가',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * PM 수정 DTO
 */
export class UpdateProjectManagerDto {
  @ApiPropertyOptional({
    description: '매니저 이름',
    example: '김철수',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '이메일',
    example: 'kim@lumir.space',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: '사번',
    example: '24001',
  })
  @IsOptional()
  @IsString()
  employeeNumber?: string;

  @ApiPropertyOptional({
    description: '부서명',
    example: '연구소',
  })
  @IsOptional()
  @IsString()
  departmentName?: string;

  @ApiPropertyOptional({
    description: '활성 상태',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '비고',
    example: 'PM 역할 수정',
  })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * PM 응답 DTO
 */
export class ProjectManagerResponseDto {
  @ApiProperty({
    description: 'PM ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'SSO의 매니저 ID',
    example: 'ff463c9b-69ba-4df4-9126-997b1a13aa3b',
  })
  managerId: string;

  @ApiProperty({
    description: '매니저 이름',
    example: '김철수',
  })
  name: string;

  @ApiPropertyOptional({
    description: '이메일',
    example: 'kim@lumir.space',
  })
  email?: string;

  @ApiPropertyOptional({
    description: '사번',
    example: '24001',
  })
  employeeNumber?: string;

  @ApiPropertyOptional({
    description: '부서명',
    example: '연구소',
  })
  departmentName?: string;

  @ApiProperty({
    description: '활성 상태',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: '비고',
    example: 'PM 역할',
  })
  note?: string;

  @ApiProperty({
    description: '생성 일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '삭제 일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  deletedAt?: Date;
}

/**
 * PM 목록 조회 쿼리 DTO
 */
export class GetProjectManagersQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 20,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: '활성 상태 필터',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '검색어 (이름, 이메일, 사번)',
    example: '김철수',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * PM 목록 응답 DTO
 */
export class ProjectManagerListResponseDto {
  @ApiProperty({
    description: 'PM 목록',
    type: [ProjectManagerResponseDto],
  })
  managers: ProjectManagerResponseDto[];

  @ApiProperty({
    description: '전체 개수',
    example: 10,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 50,
  })
  limit: number;

  @ApiProperty({
    description: '전체 페이지 수',
    example: 1,
  })
  totalPages: number;
}
