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
 * 하위 프로젝트 생성 DTO
 * orderLevel로 계층 순서를 지정합니다.
 * 같은 orderLevel의 프로젝트들은 같은 부모를 가집니다.
 * 하위 프로젝트의 매니저는 항상 최상단 프로젝트의 PM으로 자동 설정됩니다.
 */
export class ChildProjectInputDto {
  @ApiProperty({
    description:
      '계층 레벨 (1~10)\n' +
      '• 1: 1차 하위 (상위 프로젝트 직속)\n' +
      '• 2: 2차 하위 (1차 하위의 하위)\n' +
      '• 3: 3차 하위 (2차 하위의 하위)\n' +
      '• 같은 orderLevel은 같은 부모 아래 형제 관계\n' +
      '• 예: orderLevel=1이 3개면 상위 아래 3개 형제',
    example: 1,
    minimum: 1,
    maximum: 10,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(10)
  orderLevel: number;

  @ApiProperty({
    description: '하위 프로젝트명',
    example: 'EMS 프로젝트 - 1차 하위 A',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description:
      '하위 프로젝트 코드\n' +
      '• 미입력 시 자동 생성: {상위코드}-SUB{orderLevel}-{인덱스}',
    example: 'EMS-2024-SUB1-A',
  })
  @IsOptional()
  @IsString()
  projectCode?: string;

  @ApiPropertyOptional({
    description:
      '하위 프로젝트 매니저 ID\n' +
      '⚠️ 이 필드는 사용되지 않습니다\n' +
      '• 하위 프로젝트는 항상 최상단 프로젝트의 PM으로 자동 설정됩니다\n' +
      '• 값을 입력해도 무시됩니다',
    example: '660e9500-f30c-52e5-b827-557766551111',
  })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'managerId must be a valid UUID format',
  })
  managerId?: string;
}

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
    description: '프로젝트 매니저 ID (UUID) - 상위 프로젝트: PM, 하위 프로젝트: DPM',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'managerId must be a UUID',
  })
  managerId?: string;

  @ApiPropertyOptional({
    description: '상위 프로젝트 ID (UUID) - 하위 프로젝트 생성 시 지정',
    example: '660e9500-f30c-52e5-b827-557766551111',
  })
  @IsOptional()
  @IsUUID()
  parentProjectId?: string;

  @ApiPropertyOptional({
    description:
      '하위 프로젝트 목록 (평면 구조)\n' +
      '• 같은 orderLevel은 같은 부모 아래 형제 관계\n' +
      '• orderLevel=1: 상위 프로젝트 직속 하위\n' +
      '• orderLevel=2: orderLevel=1 중 마지막 프로젝트의 하위\n' +
      '• orderLevel=3: orderLevel=2 중 마지막 프로젝트의 하위\n' +
      '• 각 하위마다 다른 managerId(PM) 지정 가능',
    type: [ChildProjectInputDto],
    example: [
      {
        orderLevel: 1,
        name: 'EMS 프로젝트 - 1차 하위 A',
        managerId: '550e8400-e29b-41d4-a716-446655440000',
      },
      {
        orderLevel: 1,
        name: 'EMS 프로젝트 - 1차 하위 B',
        managerId: '660e9500-f30c-52e5-b827-557766551111',
      },
      {
        orderLevel: 2,
        name: 'EMS 프로젝트 - 2차 하위',
        managerId: '770ea600-g40d-63f6-c938-668877662222',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildProjectInputDto)
  childProjects?: ChildProjectInputDto[];
}

/**
 * 프로젝트 일괄 생성 DTO
 */
export class CreateProjectsBulkDto {
  @ApiProperty({
    description:
      '생성할 프로젝트 목록\n' +
      '• 각 프로젝트마다 childProjects로 하위 프로젝트를 함께 생성 가능\n' +
      '• orderLevel로 계층 구조 형성 (같은 레벨은 형제 관계)',
    type: [CreateProjectDto],
    example: [
      {
        name: 'EMS 프로젝트',
        projectCode: 'EMS-2024',
        status: 'ACTIVE',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        managerId: '550e8400-e29b-41d4-a716-446655440000',
        childProjects: [
          {
            orderLevel: 1,
            name: 'EMS 프로젝트 - 백엔드',
            managerId: '660e9500-f30c-52e5-b827-557766551111',
          },
          {
            orderLevel: 1,
            name: 'EMS 프로젝트 - 프론트엔드',
            managerId: '770ea600-g40d-63f6-c938-668877662222',
          },
          {
            orderLevel: 2,
            name: 'EMS 프로젝트 - API 개발',
            managerId: '880fb700-h50e-74g7-d049-779988773333',
          },
        ],
      },
      {
        name: 'HRM 프로젝트',
        projectCode: 'HRM-2024',
        status: 'COMPLETED',
        startDate: '2024-02-01',
        endDate: '2024-11-30',
        managerId: '550e8400-e29b-41d4-a716-446655440001',
        childProjects: [
          {
            orderLevel: 1,
            name: 'HRM 프로젝트 - 인사관리',
            managerId: '990gc800-i60f-85h8-e150-880099884444',
          },
          {
            orderLevel: 1,
            name: 'HRM 프로젝트 - 급여관리',
            managerId: 'aa0hd900-j70g-96i9-f261-991100995555',
          },
        ],
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
    description: '프로젝트 매니저 ID (UUID) - 상위 프로젝트: PM, 하위 프로젝트: DPM',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'managerId must be a UUID',
  })
  managerId?: string;

  @ApiPropertyOptional({
    description: '상위 프로젝트 ID (UUID) - 하위 프로젝트로 변경 또는 상위 프로젝트 변경 시',
    example: '660e9500-f30c-52e5-b827-557766551111',
  })
  @IsOptional()
  @IsUUID()
  parentProjectId?: string;

  @ApiPropertyOptional({
    description:
      '하위 프로젝트 목록 (평면 구조)\n' +
      '• 기존 하위 프로젝트를 모두 삭제하고 새로 생성\n' +
      '• 같은 orderLevel은 형제 관계\n' +
      '• 각 하위마다 다른 managerId(PM) 지정\n' +
      '• undefined: 하위 변경 없음\n' +
      '• []: 모든 하위 삭제',
    type: [ChildProjectInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChildProjectInputDto)
  childProjects?: ChildProjectInputDto[];
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
    description: '상위 프로젝트 ID (UUID) - 특정 상위 프로젝트의 하위 프로젝트만 조회',
    example: '660e9500-f30c-52e5-b827-557766551111',
  })
  @IsOptional()
  @IsUUID()
  parentProjectId?: string;

  @ApiPropertyOptional({
    description: '계층 레벨 필터 (parent: 상위 프로젝트만, child: 하위 프로젝트만, all: 전체)',
    enum: ['parent', 'child', 'all'],
    example: 'all',
  })
  @IsOptional()
  @IsString()
  hierarchyLevel?: 'parent' | 'child' | 'all';

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

  @ApiPropertyOptional({
    description: '프로젝트명 검색 (부분 일치)',
    example: 'EMS',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

/**
 * 프로젝트 매니저 정보 DTO
 */
export class ManagerInfoDto {
  @ApiProperty({
    description: '매니저 ID (SSO의 직원 ID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  managerId: string;

  @ApiPropertyOptional({
    description: '로컬 Employee ID (로컬 DB의 직원 ID)',
    example: '660e9500-f30c-52e5-b827-557766551111',
  })
  employeeId?: string;

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
 * 프로젝트 응답 DTO (간단한 버전 - 순환 참조 방지용)
 */
export class SimpleProjectResponseDto {
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
    description: '프로젝트 상태',
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
  })
  status: ProjectStatus;

  @ApiPropertyOptional({
    description: '프로젝트 매니저 ID',
  })
  managerId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 매니저 정보',
    type: ManagerInfoDto,
  })
  manager?: ManagerInfoDto;

  @ApiPropertyOptional({
    description: '하위 프로젝트 목록 (재귀 구조)',
    type: [SimpleProjectResponseDto],
  })
  childProjects?: SimpleProjectResponseDto[];
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
    description: '프로젝트 매니저 ID (상위: PM, 하위: DPM)',
    example: '11111111-1111-1111-1111-111111111111',
  })
  managerId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 매니저 정보',
    type: ManagerInfoDto,
  })
  manager?: ManagerInfoDto;

  @ApiPropertyOptional({
    description: '상위 프로젝트 ID (하위 프로젝트인 경우)',
    example: '22222222-2222-2222-2222-222222222222',
  })
  parentProjectId?: string;

  @ApiPropertyOptional({
    description: '상위 프로젝트 정보 (하위 프로젝트인 경우)',
    type: SimpleProjectResponseDto,
  })
  parentProject?: SimpleProjectResponseDto;

  @ApiPropertyOptional({
    description: '하위 프로젝트 목록 (상위 프로젝트인 경우)',
    type: [SimpleProjectResponseDto],
  })
  childProjects?: SimpleProjectResponseDto[];

  @ApiPropertyOptional({
    description: '하위 프로젝트 수',
    example: 5,
  })
  childProjectCount?: number;

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
  managerId: string;

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
