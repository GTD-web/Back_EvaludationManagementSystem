import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ToBooleanStrict } from '@interface/common/decorators';

/**
 * 직원 조회 제외 요청 DTO
 */
export class ExcludeEmployeeFromListDto {
  @ApiProperty({
    description: '조회 제외 사유',
    example: '퇴사 예정',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  excludeReason!: string;
}

/**
 * 직원 조회 포함 요청 DTO
 *
 * 빈 DTO이지만 향후 확장을 위해 유지
 */
export class IncludeEmployeeInListDto {}

/**
 * 직원 관리자 권한 변경 쿼리 DTO
 */
export class UpdateEmployeeAdminQueryDto {
  @ApiProperty({
    description: '관리자 권한 여부 (가능값: "true", "false", "1", "0")',
    example: 'true',
    type: String,
  })
  @IsNotEmpty({ message: 'isAdmin 쿼리 파라미터는 필수입니다.' })
  @ToBooleanStrict(undefined, 'isAdmin')
  isAdmin!: string;
}

// 참고: API에서는 isAdmin을 사용하지만, 내부적으로는 isAccessible 필드로 매핑됩니다.

/**
 * 직원 목록 조회 쿼리 DTO
 */
export class GetEmployeesQueryDto {
  @ApiPropertyOptional({
    description: '부서 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description: '제외된 직원 포함 여부 (기본값: false)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeExcluded?: boolean;
}

/**
 * 직원 응답 DTO
 */
export class EmployeeResponseDto {
  @ApiProperty({
    description: '직원 ID (UUID 형식)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: '직원 번호 (사번)',
    example: 'EMP001',
  })
  employeeNumber!: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  name!: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong.gildong@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    description: '직책명',
    example: '부장',
    nullable: true,
  })
  rankName?: string;

  @ApiPropertyOptional({
    description: '직책 코드',
    example: 'RANK_04',
    nullable: true,
  })
  rankCode?: string;

  @ApiPropertyOptional({
    description: '직책 레벨 (숫자가 클수록 높은 직책)',
    example: 4,
    nullable: true,
  })
  rankLevel?: number;

  @ApiPropertyOptional({
    description: '소속 부서명',
    example: '기술본부',
    nullable: true,
  })
  departmentName?: string;

  @ApiPropertyOptional({
    description: '소속 부서 코드',
    example: 'TECH',
    nullable: true,
  })
  departmentCode?: string;

  @ApiProperty({
    description: '재직 여부 (true: 재직, false: 퇴사)',
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    description: '목록 조회 제외 여부 (true: 제외됨, false: 포함됨)',
    example: false,
  })
  isExcludedFromList!: boolean;

  @ApiPropertyOptional({
    description: '조회 제외 사유 (제외된 경우에만 값 존재)',
    example: '퇴사 예정',
    nullable: true,
  })
  excludeReason?: string;

  @ApiPropertyOptional({
    description: '조회 제외 설정자 ID (제외된 경우에만 값 존재)',
    example: 'admin-user-id',
    nullable: true,
  })
  excludedBy?: string;

  @ApiPropertyOptional({
    description: '조회 제외 설정 일시 (제외된 경우에만 값 존재, ISO 8601 형식)',
    example: '2024-01-15T09:30:00.000Z',
    nullable: true,
  })
  excludedAt?: Date;

  @ApiProperty({
    description: '생성 일시 (ISO 8601 형식)',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '수정 일시 (ISO 8601 형식)',
    example: '2024-01-15T09:30:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: '시스템 접근 가능 여부 (관리자 기능 접근 가능 여부)',
    example: true,
  })
  isAccessible!: boolean;
}

/**
 * 파트장 목록 조회 쿼리 DTO
 */
export class GetPartLeadersQueryDto {
  @ApiPropertyOptional({
    description: 'SSO에서 강제로 최신 데이터를 가져올지 여부 (기본값: false)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  forceRefresh?: boolean;
}

/**
 * 파트장 목록 응답 DTO
 */
export class PartLeadersResponseDto {
  @ApiProperty({
    description: '파트장 목록',
    type: [EmployeeResponseDto],
  })
  partLeaders!: EmployeeResponseDto[];

  @ApiProperty({
    description: '파트장 수',
    example: 5,
  })
  count!: number;
}
