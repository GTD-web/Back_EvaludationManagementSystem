import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
} from 'class-validator';

/**
 * 프로젝트 중요도 생성 DTO
 */
export class CreateProjectImportanceDto {
  @ApiProperty({
    description: '중요도 코드',
    example: '1A',
  })
  @IsString()
  @MaxLength(10)
  code: string;

  @ApiPropertyOptional({
    description: '중요도 이름 (설명)',
    example: '1A - 최우선',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: '표시 순서',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: '활성 여부',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 프로젝트 중요도 수정 DTO
 */
export class UpdateProjectImportanceDto {
  @ApiPropertyOptional({
    description: '중요도 코드',
    example: '1A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  code?: string;

  @ApiPropertyOptional({
    description: '중요도 이름 (설명)',
    example: '1A - 최우선',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: '표시 순서',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: '활성 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * 프로젝트 중요도 응답 DTO
 */
export class ProjectImportanceResponseDto {
  @ApiProperty({
    description: '고유 식별자 (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '중요도 코드',
    example: '1A',
  })
  code: string;

  @ApiPropertyOptional({
    description: '중요도 이름 (설명)',
    example: '1A - 최우선',
    nullable: true,
  })
  name?: string;

  @ApiProperty({
    description: '표시 순서',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: '활성 여부',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '생성 일시',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: '삭제 일시 (소프트 삭제)',
    example: '2025-01-01T00:00:00.000Z',
    nullable: true,
  })
  deletedAt?: Date;
}

/**
 * 프로젝트 중요도 목록 응답 DTO (단순화)
 */
export class ProjectImportanceListResponseDto {
  @ApiProperty({
    description: '프로젝트 중요도 목록',
    type: [ProjectImportanceResponseDto],
  })
  importances: ProjectImportanceResponseDto[];
}

