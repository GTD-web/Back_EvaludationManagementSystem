import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 재작성 요청 생성 DTO
 * 재작성 요청 전용 엔드포인트에서 사용하는 DTO입니다.
 */
export class CreateRevisionRequestDto {
  @ApiProperty({
    description: '재작성 요청 코멘트',
    example: '평가기준이 명확하지 않습니다. 다시 작성해 주세요.',
  })
  @IsString()
  @IsNotEmpty()
  revisionComment: string;
}
