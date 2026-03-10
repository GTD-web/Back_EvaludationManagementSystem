import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 토큰 갱신 요청 DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty({ message: '리프레시 토큰은 필수입니다.' })
  @IsString()
  refreshToken: string;
}
