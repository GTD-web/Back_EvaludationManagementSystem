import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from '@interface/common/decorators';

/**
 * 하위 프로젝트 자동 생성 요청 DTO
 *
 * 재귀 트리 구조로 하위 프로젝트를 생성합니다:
 * - childCountPerProject=5 → 5단계 깊이의 트리
 *   - 상위 프로젝트
 *     - 1차 하위
 *       - 2차 하위
 *         - 3차 하위
 *           - 4차 하위
 *             - 5차 하위
 */
export class GenerateChildProjectsDto {
  @ApiPropertyOptional({
    description:
      '재귀 트리 깊이 (1차 → 2차 → ... → N차)\n' +
      '- 각 상위 프로젝트마다 1개의 하위가 연쇄적으로 생성됩니다\n' +
      '- 예: depth=5 → 1차 밑에 2차, 2차 밑에 3차, ... 5차까지\n' +
      '- 기본값: 5단계 (지정하지 않으면 5차까지 생성)',
    example: 5,
    minimum: 1,
    maximum: 10,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  childCountPerProject?: number;

  @ApiPropertyOptional({
    description:
      '이미 하위 프로젝트가 있는 상위 프로젝트를 건너뛸지 여부\n' +
      '- true (기본값): 하위가 이미 있으면 건너뜀\n' +
      '- false: 하위가 있어도 추가 생성 (중복 가능)\n' +
      '- 허용 값: true, false, "true", "false", "1", "0"',
    example: true,
    default: true,
  })
  @IsOptional()
  @ToBoolean(true) // ✅ 공용 데코레이터 사용 (기본값 true)
  @IsBoolean()
  skipIfExists?: boolean = true;
}

/**
 * 하위 프로젝트 자동 생성 응답 DTO
 *
 * 재귀 트리 구조로 생성된 결과를 반환합니다.
 */
export class GenerateChildProjectsResultDto {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '처리된 최상위 프로젝트 수 (parentProjectId가 null인 프로젝트)',
    example: 11,
  })
  processedParentProjects: number;

  @ApiProperty({
    description: '건너뛴 최상위 프로젝트 수 (이미 하위가 있는 경우)',
    example: 0,
  })
  skippedParentProjects: number;

  @ApiProperty({
    description:
      '생성된 전체 하위 프로젝트 수 (모든 레벨 합산)\n' +
      '- 예: depth=5, 상위 11개 → 11 × 5 = 55개 생성',
    example: 55,
  })
  totalChildProjectsCreated: number;

  @ApiProperty({
    description: '실패한 하위 프로젝트 수',
    example: 0,
  })
  failedChildProjects: number;

  @ApiPropertyOptional({
    description:
      '상세 결과 (최상위 프로젝트별)\n' +
      '- childrenCreated: 해당 최상위 아래 생성된 총 하위 개수 (재귀 합산)',
    example: [
      {
        parentProjectId: '98518c2c-d290-49ec-af5a-c2594a184296',
        parentProjectName: '대박인ㄴ데ㅛㅇ',
        childrenCreated: 5,
        skipped: false,
        errors: [],
      },
    ],
  })
  details?: GenerateChildProjectDetailDto[];

  @ApiPropertyOptional({
    description: '전체 오류 메시지',
    example: [],
  })
  errors?: string[];

  @ApiProperty({
    description: '소요 시간 (초)',
    example: 5.2,
  })
  duration: number;
}

/**
 * 프로젝트별 상세 결과 DTO
 *
 * 각 최상위 프로젝트별 재귀 트리 생성 결과
 */
export class GenerateChildProjectDetailDto {
  @ApiProperty({
    description: '최상위 프로젝트 ID',
    example: '98518c2c-d290-49ec-af5a-c2594a184296',
  })
  parentProjectId: string;

  @ApiProperty({
    description: '최상위 프로젝트명',
    example: '대박인ㄴ데ㅛㅇ',
  })
  parentProjectName: string;

  @ApiProperty({
    description:
      '생성된 하위 프로젝트 수 (재귀 트리 전체)\n' +
      '- 예: depth=5 → 5개 생성 (1차 → 2차 → 3차 → 4차 → 5차)',
    example: 5,
  })
  childrenCreated: number;

  @ApiProperty({
    description: '건너뛰었는지 여부 (이미 하위가 있는 경우)',
    example: false,
  })
  skipped: boolean;

  @ApiPropertyOptional({
    description: '오류 메시지 목록 (생성 중 발생한 에러)',
    example: [],
  })
  errors?: string[];
}

