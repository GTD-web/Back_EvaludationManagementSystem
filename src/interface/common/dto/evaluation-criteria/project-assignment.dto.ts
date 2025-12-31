import { OrderDirection } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * 프로젝트 할당 생성 DTO
 *
 * Note: assignedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class CreateProjectAssignmentDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  periodId: string;
}

/**
 * 프로젝트 할당 대량 생성 DTO
 */
export class BulkCreateProjectAssignmentDto {
  @ApiProperty({
    description: '프로젝트 할당 목록',
    type: [CreateProjectAssignmentDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '할당 목록은 최소 1개 이상이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CreateProjectAssignmentDto)
  assignments: CreateProjectAssignmentDto[];
}

/**
 * 프로젝트 할당 순서 변경 Query DTO
 */
export class ChangeProjectAssignmentOrderQueryDto {
  @ApiProperty({
    description: '이동 방향 (up: 위로, down: 아래로)',
    example: OrderDirection.UP,
    enum: OrderDirection,
    enumName: 'OrderDirection',
  })
  @IsEnum(OrderDirection, { message: '이동 방향은 up 또는 down이어야 합니다.' })
  direction: OrderDirection;
}

/**
 * 프로젝트 할당 순서 변경 Body DTO
 *
 * Note: 이 DTO는 현재 빈 클래스이지만, 향후 추가 필드가 필요할 경우를 대비해 유지합니다.
 * updatedBy는 @CurrentUser() 데코레이터를 통해 자동으로 처리됩니다.
 */
export class ChangeProjectAssignmentOrderBodyDto {
  // 현재 필요한 필드 없음 - @CurrentUser()를 통해 updatedBy 자동 처리
}

/**
 * 프로젝트 ID 기반 할당 취소 Body DTO
 */
export class CancelProjectAssignmentByProjectDto {
  @ApiProperty({
    description: '직원 ID (UUID 형식)',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: '평가기간 ID (UUID 형식)',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  periodId: string;
}

/**
 * 프로젝트 ID 기반 할당 순서 변경 Body DTO
 */
export class ChangeProjectAssignmentOrderByProjectDto {
  @ApiProperty({
    description: '직원 ID (UUID 형식)',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    description: '평가기간 ID (UUID 형식)',
    example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  periodId: string;

  @ApiProperty({
    description: '이동 방향 (up: 위로, down: 아래로)',
    example: OrderDirection.UP,
    enum: OrderDirection,
    enumName: 'OrderDirection',
  })
  @IsEnum(OrderDirection, { message: '이동 방향은 up 또는 down이어야 합니다.' })
  direction: OrderDirection;
}

/**
 * 프로젝트 할당 필터 DTO
 */
export class ProjectAssignmentFilterDto {
  @ApiPropertyOptional({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '정렬 기준',
    example: 'assignedDate',
    default: 'assignedDate',
  })
  @IsOptional()
  @IsString()
  orderBy?: string = 'assignedDate';

  @ApiPropertyOptional({
    description: '정렬 방향',
    example: 'DESC',
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * 프로젝트 할당 응답 DTO
 */
export class ProjectAssignmentResponseDto {
  @ApiProperty({
    description: '할당 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  id: string;

  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  employeeId: string;

  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  projectId: string;

  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  periodId: string;

  @ApiProperty({
    description: '할당일',
    example: '2024-01-01T00:00:00.000Z',
  })
  assignedDate: Date;

  @ApiProperty({
    description: '할당자 ID',
    example: 'admin',
  })
  assignedBy: string;

  @ApiProperty({
    description: '표시 순서 (같은 직원-평가기간 내에서의 순서)',
    example: 0,
  })
  displayOrder: number;

  @ApiPropertyOptional({
    description: '생성자 ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: '수정자 ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  updatedBy?: string;

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

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: '프로젝트 정보',
    type: () => ProjectInfoDto,
  })
  project?: ProjectInfoDto | null;
}

/**
 * 평가기간 정보 DTO
 */
export class EvaluationPeriodInfoDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  id: string;

  @ApiProperty({
    description: '평가기간명',
    example: '2024년 상반기 평가',
  })
  name: string;

  @ApiProperty({
    description: '시작일',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: '종료일',
    example: '2024-06-30T23:59:59.999Z',
    required: false,
  })
  endDate?: Date;

  @ApiProperty({
    description: '상태',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: '설명',
    example: '2024년 상반기 직원 평가를 진행합니다.',
    required: false,
  })
  description?: string;
}

/**
 * 직원 정보 DTO
 */
export class EmployeeInfoDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: '사번',
    example: 'EMP001',
  })
  employeeNumber: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '이메일',
    example: 'hong@company.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: '상태',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: '부서 ID',
    example: 'DEPT001',
    required: false,
  })
  departmentId?: string;

  @ApiProperty({
    description: '부서명',
    example: '개발팀',
    required: false,
  })
  departmentName?: string;
}

/**
 * 프로젝트 정보 DTO
 */
export class ProjectInfoDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: '프로젝트명',
    example: '루미르 통합 포털 개발',
  })
  name: string;

  @ApiProperty({
    description: '프로젝트 코드',
    example: 'PROJ001',
  })
  projectCode: string;

  @ApiProperty({
    description: '상태',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: '시작일',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  startDate?: Date;

  @ApiProperty({
    description: '종료일',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  endDate?: Date;

  @ApiProperty({
    description: '프로젝트 매니저 ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
    required: false,
  })
  managerId?: string;
}

/**
 * 프로젝트 할당 상세 응답 DTO (관련 정보 포함)
 */
export class ProjectAssignmentDetailResponseDto {
  @ApiProperty({
    description: '할당 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  id: string;

  @ApiProperty({
    description: '할당일',
    example: '2024-01-01T00:00:00.000Z',
  })
  assignedDate: Date;

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

  @ApiProperty({
    description: '삭제일시',
    example: null,
    required: false,
  })
  deletedAt?: Date;

  @ApiProperty({
    description: '생성자 ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
    required: false,
  })
  createdBy?: string;

  @ApiProperty({
    description: '수정자 ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
    required: false,
  })
  updatedBy?: string;

  @ApiProperty({
    description: '버전',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: '평가기간 정보',
    type: EvaluationPeriodInfoDto,
  })
  evaluationPeriod?: EvaluationPeriodInfoDto | null;

  @ApiPropertyOptional({
    description: '직원 정보',
    type: EmployeeInfoDto,
  })
  employee?: EmployeeInfoDto | null;

  @ApiPropertyOptional({
    description: '프로젝트 정보',
    type: ProjectInfoDto,
  })
  project?: ProjectInfoDto | null;

  @ApiPropertyOptional({
    description: '할당자 정보',
    type: EmployeeInfoDto,
  })
  assignedBy?: EmployeeInfoDto | null;
}

/**
 * 직원 프로젝트 목록 응답 DTO (프로젝트 정보만 포함)
 */
export class EmployeeProjectsResponseDto {
  @ApiProperty({
    description: '할당된 프로젝트 목록',
    type: [ProjectInfoDto],
  })
  projects: ProjectInfoDto[];
}

/**
 * 프로젝트 직원 목록 응답 DTO (직원 정보만 포함)
 */
export class ProjectEmployeesResponseDto {
  @ApiProperty({
    description: '할당된 직원 목록',
    type: [EmployeeInfoDto],
  })
  employees: EmployeeInfoDto[];
}

/**
 * 할당되지 않은 직원 목록 조회 쿼리 DTO
 */
export class GetUnassignedEmployeesQueryDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'periodId는 필수 항목입니다.' })
  @IsUUID('4', { message: 'periodId는 올바른 UUID 형식이어야 합니다.' })
  periodId: string;

  @ApiPropertyOptional({
    description: '프로젝트 ID (선택적)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'projectId는 올바른 UUID 형식이어야 합니다.' })
  projectId?: string;
}

/**
 * 할당되지 않은 직원 목록 응답 DTO (직원 정보만 포함)
 */
export class UnassignedEmployeesResponseDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  periodId: string;

  @ApiProperty({
    description: '프로젝트 ID (선택적)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  projectId?: string;

  @ApiProperty({
    description: '할당되지 않은 직원 목록',
    type: [EmployeeInfoDto],
  })
  employees: EmployeeInfoDto[];
}

/**
 * 프로젝트 할당 목록 응답 DTO
 */
export class ProjectAssignmentListResponseDto {
  @ApiProperty({
    description: '프로젝트 할당 목록',
    type: [ProjectAssignmentResponseDto],
  })
  items: ProjectAssignmentResponseDto[];

  @ApiProperty({
    description: '총 개수',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '페이지 번호',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: '총 페이지 수',
    example: 10,
  })
  totalPages: number;
}

/**
 * 할당 가능한 프로젝트 목록 조회 쿼리 DTO
 */
export class GetAvailableProjectsQueryDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'periodId는 필수 항목입니다.' })
  @IsUUID('4', { message: 'periodId는 올바른 UUID 형식이어야 합니다.' })
  periodId: string;

  @ApiPropertyOptional({
    description: '프로젝트 상태 필터',
    example: 'ACTIVE',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: '검색어 (프로젝트명, 프로젝트코드, 매니저명으로 검색)',
    example: '루미르',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: '페이지 번호는 1 이상이어야 합니다.' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 20,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: '페이지 크기는 1 이상이어야 합니다.' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: '정렬 기준',
    example: 'name',
    enum: ['name', 'projectCode', 'startDate', 'endDate', 'managerName'],
    default: 'name',
    required: false,
  })
  @IsOptional()
  @IsIn(['name', 'projectCode', 'startDate', 'endDate', 'managerName'], {
    message:
      '정렬 기준은 name, projectCode, startDate, endDate, managerName 중 하나여야 합니다.',
  })
  sortBy?: string = 'name';

  @ApiPropertyOptional({
    description: '정렬 방향',
    example: 'ASC',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

/**
 * 매니저 정보 DTO (프로젝트에서 사용)
 */
export class ProjectManagerInfoDto {
  @ApiProperty({
    description: '매니저 ID (SSO의 직원 ID)',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  managerId: string;

  @ApiPropertyOptional({
    description: '로컬 Employee ID (로컬 DB의 직원 ID)',
    example: '234e5678-f90c-23d4-b567-537725285111',
  })
  employeeId?: string;

  @ApiProperty({
    description: '매니저 이름',
    example: '김매니저',
  })
  name: string;

  @ApiProperty({
    description: '매니저 이메일',
    example: 'manager@company.com',
    required: false,
  })
  email?: string;

  @ApiProperty({
    description: '매니저 전화번호',
    example: '010-1234-5678',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: '매니저 부서명',
    example: '개발팀',
    required: false,
  })
  departmentName?: string;
}

/**
 * 할당 가능한 프로젝트 정보 DTO (매니저 정보 포함)
 */
export class AvailableProjectInfoDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: '프로젝트명',
    example: '루미르 통합 포털 개발',
  })
  name: string;

  @ApiProperty({
    description: '프로젝트 코드',
    example: 'PROJ001',
    required: false,
  })
  projectCode?: string;

  @ApiPropertyOptional({
    description: '프로젝트 매니저 정보',
    type: ProjectManagerInfoDto,
  })
  manager?: ProjectManagerInfoDto | null;

  @ApiPropertyOptional({
    description: '실 PM',
    example: '김실무',
    required: false,
  })
  realPM?: string | null;
}

/**
 * 할당 가능한 프로젝트 목록 응답 DTO
 */
export class AvailableProjectsResponseDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  periodId: string;

  @ApiProperty({
    description: '할당 가능한 프로젝트 목록',
    type: [AvailableProjectInfoDto],
  })
  projects: AvailableProjectInfoDto[];

  @ApiProperty({
    description: '총 개수',
    example: 15,
  })
  total: number;

  @ApiProperty({
    description: '페이지 번호',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '페이지 크기',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: '총 페이지 수',
    example: 1,
  })
  totalPages: number;

  @ApiProperty({
    description: '검색어',
    example: '루미르',
    required: false,
  })
  search?: string;

  @ApiProperty({
    description: '정렬 기준',
    example: 'name',
  })
  sortBy: string;

  @ApiProperty({
    description: '정렬 방향',
    example: 'ASC',
  })
  sortOrder: string;
}
