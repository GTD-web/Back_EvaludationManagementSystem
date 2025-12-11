import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ToBoolean } from '@interface/common/decorators';

/**
 * 하위 프로젝트 일괄 삭제 요청 DTO
 */
export class DeleteChildProjectsDto {
  @ApiProperty({
    description: `할당이 있는 프로젝트도 강제로 삭제할지 여부
    
- true: 할당 체크를 건너뛰고 강제 삭제 (⚠️ 위험)
- false: 할당이 있으면 삭제 실패 (기본값, 안전)`,
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @ToBoolean(false)
  forceDelete?: boolean = false;

  @ApiProperty({
    description: `영구 삭제(Hard Delete) 여부
    
- true: 데이터베이스에서 영구 삭제
- false: Soft Delete (deletedAt만 설정, 기본값)`,
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @ToBoolean(false)
  hardDelete?: boolean = false;
}

/**
 * 하위 프로젝트 일괄 삭제 결과 DTO
 */
export class DeleteChildProjectsResultDto {
  @ApiProperty({
    description: '삭제된 하위 프로젝트 수',
    example: 25,
  })
  deletedCount: number;

  @ApiProperty({
    description: '삭제 유형 (soft 또는 hard)',
    example: 'soft',
    enum: ['soft', 'hard'],
  })
  deleteType: 'soft' | 'hard';

  @ApiProperty({
    description: '할당 체크 여부',
    example: true,
  })
  assignmentCheckPerformed: boolean;

  @ApiProperty({
    description: '삭제된 프로젝트 상세 정보',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        projectCode: { type: 'string' },
        parentProjectId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
    example: [
      {
        id: 'uuid-1',
        name: 'PRJ-001 프로젝트 - 1차 하위 프로젝트',
        projectCode: 'PRJ-001-SUB1',
        parentProjectId: 'uuid-parent',
      },
      {
        id: 'uuid-2',
        name: 'PRJ-001 프로젝트 - 2차 하위 프로젝트',
        projectCode: 'PRJ-001-SUB2',
        parentProjectId: 'uuid-1',
      },
    ],
  })
  deletedProjects: Array<{
    id: string;
    name: string;
    projectCode: string;
    parentProjectId: string | null;
  }>;

  @ApiProperty({
    description: '실행 시간 (초)',
    example: 1.234,
  })
  executionTimeSeconds: number;
}


