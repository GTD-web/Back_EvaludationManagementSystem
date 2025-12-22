import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 평가기간 정보 (간소화)
 */
export class SimplifiedEvaluationPeriodDto {
  @ApiProperty({
    description: '평가기간 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
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
    example: '2024-06-30T23:59:59.000Z',
    nullable: true,
  })
  endDate?: Date;

  @ApiProperty({
    description: '평가기간 상태',
    example: 'active',
    enum: ['waiting', 'active', 'completed', 'cancelled'],
  })
  status: string;
}

/**
 * 직원 정보 (간소화)
 */
export class SimplifiedEmployeeDto {
  @ApiProperty({
    description: '직원 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: '직원명',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '직원 번호',
    example: 'EMP-2024-001',
  })
  employeeNumber: string;
}

/**
 * 프로젝트 매니저 정보 (간소화)
 */
export class ProjectManagerInfoDto {
  @ApiProperty({
    description: '프로젝트 매니저 ID',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  id: string;

  @ApiProperty({
    description: '프로젝트 매니저 이름',
    example: '김상우',
  })
  name: string;
}

/**
 * 평가자 정보 (간소화)
 */
export class EvaluatorInfoDto {
  @ApiProperty({
    description: '평가자 ID',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  evaluatorId: string;

  @ApiProperty({
    description: '평가자 이름',
    example: '김평가',
  })
  evaluatorName: string;
}

/**
 * WBS 평가기준 정보
 */
export class WbsEvaluationCriterionDto {
  @ApiProperty({
    description: '평가기준 ID',
    example: '123e4567-e89b-12d3-a456-426614174006',
  })
  criterionId: string;

  @ApiProperty({
    description: '평가기준 내용',
    example: '프론트엔드 개발 품질 및 완성도',
  })
  criteria: string;

  @ApiProperty({
    description: '중요도 (1~10)',
    example: 8,
  })
  importance: number;

  @ApiPropertyOptional({
    description: '세부 프로젝트명 (평가기준에 연결된 경우)',
    example: '프로젝트 A 1차 개발',
    nullable: true,
  })
  subProject?: string | null;

  @ApiProperty({
    description: '생성일시',
    example: '2024-01-15T09:00:00.000Z',
  })
  createdAt: Date;
}

/**
 * WBS 할당 정보
 */
export class AssignedWbsItemDto {
  @ApiProperty({
    description: 'WBS ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  wbsId: string;

  @ApiProperty({
    description: 'WBS명',
    example: '프론트엔드 개발',
  })
  wbsName: string;

  @ApiProperty({
    description: 'WBS 코드',
    example: 'WBS-001-01',
  })
  wbsCode: string;

  @ApiProperty({
    description: '평가기준 목록 (각 평가기준에 subProject 포함)',
    type: [WbsEvaluationCriterionDto],
  })
  @Type(() => WbsEvaluationCriterionDto)
  criteria: WbsEvaluationCriterionDto[];

  @ApiProperty({
    description: '1차 평가자 정보',
    type: EvaluatorInfoDto,
    nullable: true,
  })
  @Type(() => EvaluatorInfoDto)
  primaryDownwardEvaluation?: EvaluatorInfoDto;

  @ApiProperty({
    description: '2차 평가자 정보',
    type: EvaluatorInfoDto,
    nullable: true,
  })
  @Type(() => EvaluatorInfoDto)
  secondaryDownwardEvaluation?: EvaluatorInfoDto;
}

/**
 * 프로젝트 할당 정보
 */
export class AssignedProjectDto {
  @ApiProperty({
    description: '프로젝트 ID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  projectId: string;

  @ApiProperty({
    description: '프로젝트명',
    example: '신규 ERP 시스템 개발',
  })
  projectName: string;

  @ApiProperty({
    description: '프로젝트 코드',
    example: 'PROJ-2024-001',
  })
  projectCode: string;

  @ApiProperty({
    description: '프로젝트 매니저 정보',
    type: ProjectManagerInfoDto,
    nullable: true,
  })
  @Type(() => ProjectManagerInfoDto)
  projectManager?: ProjectManagerInfoDto;

  @ApiProperty({
    description: '프로젝트에 할당된 WBS 목록',
    type: [AssignedWbsItemDto],
  })
  @Type(() => AssignedWbsItemDto)
  wbsList: AssignedWbsItemDto[];
}

/**
 * 직원의 평가기간별 할당 정보 응답 DTO
 */
export class EmployeePeriodAssignmentsResponseDto {
  @ApiProperty({
    description: '평가기간 정보',
    type: SimplifiedEvaluationPeriodDto,
  })
  @Type(() => SimplifiedEvaluationPeriodDto)
  evaluationPeriod: SimplifiedEvaluationPeriodDto;

  @ApiProperty({
    description: '직원 정보',
    type: SimplifiedEmployeeDto,
  })
  @Type(() => SimplifiedEmployeeDto)
  employee: SimplifiedEmployeeDto;

  @ApiProperty({
    description: '할당된 프로젝트 및 WBS 목록',
    type: [AssignedProjectDto],
  })
  @Type(() => AssignedProjectDto)
  projects: AssignedProjectDto[];

  @ApiProperty({
    description: '총 프로젝트 수',
    example: 3,
  })
  totalProjects: number;

  @ApiProperty({
    description: '총 WBS 수',
    example: 12,
  })
  totalWbs: number;
}
