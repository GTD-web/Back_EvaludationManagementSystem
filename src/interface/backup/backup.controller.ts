import { Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BackupSchedulerService } from '../../context/backup-context/backup-scheduler.service';
import { Roles } from '../common/decorators';

/**
 * 백업 관리 컨트롤러
 */
@ApiTags('백업 관리')
@ApiBearerAuth('Bearer')
@Roles('admin')
@Controller('admin/backups')
export class BackupController {
  constructor(
    private readonly backupSchedulerService: BackupSchedulerService,
  ) {}

  /**
   * 백업 상태 조회
   */
  @Get('status')
  @ApiOperation({
    summary: '백업 상태 조회',
    description: '각 백업 타입별 파일 개수를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '백업 상태 조회 성공',
    schema: {
      example: {
        hourly: 6,
        daily: 30,
        weekly: 12,
        monthly: 12,
        yearly: 8,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 (admin 역할 필요)',
  })
  백업_상태_조회() {
    return this.backupSchedulerService.백업_상태를_조회한다();
  }

  /**
   * 수동 백업 실행
   */
  @Post('manual')
  @ApiOperation({
    summary: '수동 백업 실행',
    description: '지정된 타입의 백업을 즉시 실행합니다.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    description: '백업 타입 (기본값: daily)',
  })
  @ApiResponse({
    status: 201,
    description: '백업 실행 성공',
    schema: {
      example: {
        message: 'daily 백업이 완료되었습니다.',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 (admin 역할 필요)',
  })
  @ApiResponse({
    status: 500,
    description: 'Vercel 환경에서는 사용 불가',
    schema: {
      example: {
        statusCode: 500,
        message:
          'Vercel 환경에서는 백업 기능을 사용할 수 없습니다. EC2 환경을 사용해주세요.',
      },
    },
  })
  async 수동_백업_실행(
    @Query('type') type: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    const message = await this.backupSchedulerService.수동_백업을_실행한다(
      type,
    );
    return { message };
  }
}


