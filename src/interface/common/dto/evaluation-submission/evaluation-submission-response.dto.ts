import { ApiProperty } from '@nestjs/swagger';

/**
 * 평가 제출 여부 업데이트 응답 DTO
 */
export class UpdateEvaluationSubmissionResponseDto {
  @ApiProperty({
    description: '성공 여부',
    example: true,
    type: Boolean,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: '평가 제출 여부가 성공적으로 변경되었습니다.',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: '변경된 항목 수',
    example: 5,
    type: Number,
  })
  updatedCount: number;
}
