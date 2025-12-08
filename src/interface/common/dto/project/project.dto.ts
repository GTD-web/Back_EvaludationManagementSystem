import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  Matches,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DateToUTC, OptionalDateToUTC } from '@interface/common/decorators';
import { ProjectStatus } from '@domain/common/project/project.types';

/**
 * 프로젝트 생성 DTO
 */
export class CreateProjectDto {
  @ApiProperty({
    description: '프로젝트명',
    example: 'EMS 프로젝트',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: '프로젝트 코드',
    example: 'EMS-2024',
  })
  @IsOptional()
  @IsString()
  projectCode?: string;

  @ApiProperty({
    description: '프로젝트 상태 (ACTIVE: 진행중, COMPLETED: 완료, CANCELLED: 취소)',
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
    example: ProjectStatus.ACTIVE,
  })
  @IsNotEmpty()
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiPropertyOptional({
    description: '시작일 (YYYY-MM-DD)',
    example: '2024-01-01',
    type: String,
  })
  @IsOptional()
  @OptionalDateToUTC()
  startDate?: Date;

  @ApiPropertyOptional({
    description: '종료일 (YYYY-MM-DD)',
    example: '2024-12-31',
    type: String,
  })
  @IsOptional()
  @OptionalDateToUTC()
  endDate?: Date;

  @ApiPropertyOptional({
    description: '프로젝트 매니저 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'managerId must be a UUID',
  })
  managerId?: string;
}

/**
 * 프로젝트 일괄 생성 DTO
 */
export class CreateProjectsBulkDto {
  @ApiProperty({
    description: '생성할 프로젝트 목록',
    type: [CreateProjectDto],
    example: [
      {
        name: 'EMS 프로젝트',
        projectCode: 'EMS-2024',
        status: 'ACTIVE',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        managerId: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        name: 'HRM 프로젝트',
        projectCode: 'HRM-2024',
        status: 'COMPLETED',
        startDate: '2024-02-01',
        endDate: '2024-11-30',
        managerId: '550e8400-e29b-41d4-a716-446655440001',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectDto)
  projects: CreateProjectDto[];
}

/**
 * 프로젝트 수정 DTO
 */
export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: '프로젝트명',
    example: 'EMS 프로젝트',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '프로젝트 코드',
    example: 'EMS-2024',
  })
  @IsOptional()
  @IsString()
  projectCode?: string;

  @ApiPropertyOptional({
    description: '프로젝트 상태 (ACTIVE: 진행중, COMPLETED: 완료, CANCELLED: 취소)',
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
    example: ProjectStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: '시작일 (YYYY-MM-DD)',
    example: '2024-01-01',
    type: String,
  })
  @IsOptional()
  @OptionalDateToUTC()
  startDate?: Date;

  @ApiPropertyOptional({
    description: '종료일 (YYYY-MM-DD)',
    example: '2024-12-31',
    type: String,
  })
  @IsOptional()
  @OptionalDateToUTC()
  endDate?: Date;

  @ApiPropertyOptional({
    description: '프로젝트 매니저 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'managerId must be a UUID',
  })
  managerId?: string;
}

/**
 * 프로젝트 목록 조회 필터 DTO
 */
export class GetProjectListQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: '정렬 기준',
    enum: ['name', 'projectCode', 'startDate', 'endDate', 'createdAt'],
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'projectCode' | 'startDate' | 'endDate' | 'createdAt' =
    'createdAt';

  @ApiPropertyOptional({
    description: '정렬 방향',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: '프로젝트 상태 필터 (ACTIVE: 진행중, COMPLETED: 완료, CANCELLED: 취소)',
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
    example: ProjectStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    description: '프로젝트 매니저 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'managerId must be a UUID',
  })
  managerId?: string;

  @ApiPropertyOptional({
    description: '시작일 범위 시작 (YYYY-MM-DD)',
    example: '2024-01-01',
    type: String,
  })
  @IsOptional()
  @OptionalDateToUTC()
  startDateFrom?: Date;

  @ApiPropertyOptional({
    description: '시작일 범위 끝 (YYYY-MM-DD)',
    example: '2024-12-31',
    type: String,
  })
  @IsOptional()
  @OptionalDateToUTC()
  startDateTo?: Date;

  @ApiPropertyOptional({
    description: '종료일 범위 시작 (YYYY-MM-DD)',
    example: '2024-01-01',
    type: String,
  })
  @IsOptional()
  @OptionalDateToUTC()
  endDateFrom?: Date;

  @ApiPropertyOptional({
    description: '종료일 범위 끝 (YYYY-MM-DD)',
    example: '2024-12-31',
    type: String,
  })
  @IsOptional()
  @OptionalDateToUTC()
  endDateTo?: Date;
}

/**
 * 프로젝트 매니저 정보 DTO
 */
export class ManagerInfoDto {
  @ApiProperty({
    description: '매니저 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '매니저 이름',
    example: '홍길동',
  })
  name: string;

  @ApiPropertyOptional({
    description: '이메일',
    example: 'hong@example.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: '전화번호',
    example: '010-1234-5678',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: '부서명',
    example: '개발팀',
  })
  departmentName?: string;

  @ApiPropertyOptional({
    description: '직책명',
    example: '팀장',
  })
  rankName?: string;
}

/**
 * 프로젝트 응답 DTO
 */
export class ProjectResponseDto {
  @ApiProperty({
    description: '프로젝트 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: '프로젝트명',
    example: 'EMS 프로젝트',
  })
  name: string;

  @ApiPropertyOptional({
    description: '프로젝트 코드',
    example: 'EMS-2024',
  })
  projectCode?: string;

  @ApiProperty({
    description: '프로젝트 상태 (ACTIVE: 진행중, COMPLETED: 완료, CANCELLED: 취소)',
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
    example: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @ApiPropertyOptional({
    description: '시작일',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate?: Date;

  @ApiPropertyOptional({
    description: '종료일',
    example: '2024-12-31T00:00:00.000Z',
  })
  endDate?: Date;

  @ApiPropertyOptional({
    description: '프로젝트 매니저 ID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  managerId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 매니저 정보',
    type: ManagerInfoDto,
  })
  manager?: ManagerInfoDto;

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

  @ApiPropertyOptional({
    description: '삭제일시',
    example: '2024-01-01T00:00:00.000Z',
  })
  deletedAt?: Date;

  @ApiProperty({
    description: '활성 상태 여부',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: '완료 상태 여부',
    example: false,
  })
  isCompleted: boolean;

  @ApiProperty({
    description: '취소 상태 여부',
    example: false,
  })
  isCancelled: boolean;
}

/**
 * 프로젝트 목록 응답 DTO
 */
export class ProjectListResponseDto {
  @ApiProperty({
    description: '프로젝트 목록',
    type: [ProjectResponseDto],
  })
  projects: ProjectResponseDto[];

  @ApiProperty({
    description: '전체 항목 수',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '현재 페이지 번호',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지당 항목 수',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: '전체 페이지 수',
    example: 5,
  })
  totalPages: number;
}

/**
 * PM(프로젝트 매니저) 조회 필터 DTO
 */
export class GetProjectManagersQueryDto {
  @ApiPropertyOptional({
    description: '부서 ID로 필터링',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'departmentId must be a UUID',
  })
  departmentId?: string;

  @ApiPropertyOptional({
    description: '검색어 (이름, 사번, 이메일)',
    example: '홍길동',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * PM(프로젝트 매니저) 정보 DTO
 */
export class ProjectManagerDto {
  @ApiProperty({
    description: '매니저 ID (SSO의 직원 ID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiPropertyOptional({
    description: '로컬 Employee ID (로컬 DB의 직원 ID)',
    example: '660e9500-f30c-52e5-b827-557766551111',
  })
  employeeId?: string;

  @ApiProperty({
    description: '사번',
    example: 'E2023001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: '부서명',
    example: '개발팀',
  })
  departmentName?: string;

  @ApiPropertyOptional({
    description: '부서 코드',
    example: 'DEV',
  })
  departmentCode?: string;

  @ApiPropertyOptional({
    description: '직책명',
    example: '팀장',
  })
  positionName?: string;

  @ApiPropertyOptional({
    description: '직책 레벨',
    example: 3,
  })
  positionLevel?: number;

  @ApiPropertyOptional({
    description: '직급명',
    example: '과장',
  })
  jobTitleName?: string;

  @ApiPropertyOptional({
    description: '관리 권한 보유 여부',
    example: true,
  })
  hasManagementAuthority?: boolean;
}

/**
 * PM 목록 응답 DTO
 */
export class ProjectManagerListResponseDto {
  @ApiProperty({
    description: 'PM 목록',
    type: [ProjectManagerDto],
  })
  managers: ProjectManagerDto[];

  @ApiProperty({
    description: '전체 PM 수',
    example: 15,
  })
  total: number;
}

/**
 * 프로젝트 일괄 생성 실패 항목 DTO
 */
export class BulkCreateFailedItemDto {
  @ApiProperty({
    description: '실패한 항목의 인덱스 (0부터 시작)',
    example: 0,
  })
  index: number;

  @ApiProperty({
    description: '실패한 프로젝트 데이터',
    type: CreateProjectDto,
  })
  data: CreateProjectDto;

  @ApiProperty({
    description: '실패 사유',
    example: '프로젝트 코드 EMS-2024는 이미 사용 중입니다.',
  })
  error: string;
}

/**
 * 프로젝트 일괄 생성 응답 DTO
 */
export class ProjectsBulkCreateResponseDto {
  @ApiProperty({
    description: '성공적으로 생성된 프로젝트 목록',
    type: [ProjectResponseDto],
  })
  success: ProjectResponseDto[];

  @ApiProperty({
    description: '생성에 실패한 프로젝트 목록',
    type: [BulkCreateFailedItemDto],
  })
  failed: BulkCreateFailedItemDto[];

  @ApiProperty({
    description: '성공한 항목 수',
    example: 5,
  })
  successCount: number;

  @ApiProperty({
    description: '실패한 항목 수',
    example: 2,
  })
  failedCount: number;

  @ApiProperty({
    description: '전체 항목 수',
    example: 7,
  })
  totalCount: number;
}
