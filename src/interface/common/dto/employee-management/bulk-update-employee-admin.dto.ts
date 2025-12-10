import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

/**
 * 여러 직원의 관리자 권한 일괄 변경 요청 DTO
 */
export class BulkUpdateEmployeeAdminDto {
  @ApiProperty({
    description: '직원 ID 목록 (UUID 배열)',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '223e4567-e89b-12d3-a456-426614174001',
    ],
    type: [String],
    isArray: true,
  })
  @IsArray({ message: 'employeeIds는 배열이어야 합니다.' })
  @ArrayNotEmpty({ message: '최소 1명 이상의 직원 ID가 필요합니다.' })
  @IsUUID('4', { each: true, message: '모든 직원 ID는 유효한 UUID여야 합니다.' })
  employeeIds!: string[];
}

/**
 * 여러 직원의 관리자 권한 일괄 변경 응답 DTO
 */
export class BulkUpdateEmployeeAdminResponseDto {
  @ApiProperty({
    description: '성공 여부',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: '처리된 직원 수',
    example: 5,
  })
  totalProcessed!: number;

  @ApiProperty({
    description: '성공한 직원 수',
    example: 4,
  })
  succeeded!: number;

  @ApiProperty({
    description: '실패한 직원 수',
    example: 1,
  })
  failed!: number;

  @ApiProperty({
    description: '실패한 직원 ID 목록',
    example: ['invalid-uuid'],
    type: [String],
  })
  failedIds!: string[];

  @ApiProperty({
    description: '오류 메시지 목록',
    example: ['직원을 찾을 수 없습니다: invalid-uuid'],
    type: [String],
  })
  errors!: string[];

  @ApiProperty({
    description: '처리 완료 시각 (ISO 8601 형식)',
    example: '2024-01-15T09:30:00.000Z',
  })
  processedAt!: Date;
}

