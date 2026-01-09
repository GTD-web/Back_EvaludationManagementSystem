import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@interface/common/decorators';
import { AuditLogContextService } from '@context/audit-log-context/audit-log-context.service';
import { AuditLogListResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';
import { GetAuditLogListQueryDto } from '@interface/common/dto/audit-log/get-audit-log-list-query.dto';
import { AuditLogResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';
import { GetAuditLogStatsQueryDto } from '@interface/common/dto/audit-log/get-audit-log-stats-query.dto';
import { AuditLogStatsResponseDto } from '@interface/common/dto/audit-log/audit-log-stats-response.dto';

@ApiTags('A-0-5. 관리자 - 감사 로그')
@ApiBearerAuth('Bearer')
@Roles('web', 'admin')
@Controller('admin/audit-logs')
export class AuditLogController {
  constructor(
    private readonly auditLogContextService: AuditLogContextService,
  ) {}

  /**
   * Audit 로그 시간대별 통계를 조회한다
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Audit 로그 통계 조회',
    description: '시간 범위에 따라 시간대별 요청 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit 로그 통계 조회 성공',
    type: AuditLogStatsResponseDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '시작 날짜 (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '종료 날짜 (ISO 8601)',
  })
  @ApiQuery({
    name: 'interval',
    required: false,
    description: '시간 간격 (분 단위, 기본값: 60)',
  })
  async getAuditLogStats(
    @Query() query: GetAuditLogStatsQueryDto,
  ): Promise<AuditLogStatsResponseDto> {
    const { startDate, endDate, interval = 60 } = query;

    const result = await this.auditLogContextService.audit로그통계를_조회한다(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      interval,
    );

    return {
      stats: result.stats,
    };
  }

  /**
   * Audit 로그 목록을 조회한다
   */
  @Get()
  @ApiOperation({
    summary: 'Audit 로그 목록 조회',
    description: '필터 조건에 따라 Audit 로그 목록을 페이징으로 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit 로그 목록 조회 성공',
    type: AuditLogListResponseDto,
  })
  @ApiQuery({ name: 'userId', required: false, description: '사용자 ID' })
  @ApiQuery({
    name: 'userEmail',
    required: false,
    description: '사용자 이메일',
  })
  @ApiQuery({
    name: 'employeeNumber',
    required: false,
    description: '직원 번호',
  })
  @ApiQuery({
    name: 'requestMethod',
    required: false,
    description: 'HTTP 메서드 (GET, POST, PUT, DELETE 등)',
  })
  @ApiQuery({
    name: 'requestUrl',
    required: false,
    description: '요청 URL (부분 일치)',
  })
  @ApiQuery({
    name: 'responseStatusCode',
    required: false,
    description: '응답 상태 코드',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '시작 날짜 (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '종료 날짜 (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 크기 (기본값: 10)',
  })
  async getAuditLogs(
    @Query() query: GetAuditLogListQueryDto,
  ): Promise<AuditLogListResponseDto> {
    const {
      userId,
      userEmail,
      employeeNumber,
      requestMethod,
      requestUrl,
      responseStatusCode,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    const filter = {
      userId,
      userEmail,
      employeeNumber,
      requestMethod,
      requestUrl,
      responseStatusCode: responseStatusCode
        ? parseInt(responseStatusCode.toString(), 10)
        : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return await this.auditLogContextService.audit로그목록을_조회한다(
      filter,
      parseInt(page.toString(), 10),
      parseInt(limit.toString(), 10),
    );
  }

  /**
   * Audit 로그 상세 정보를 조회한다
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Audit 로그 상세 조회',
    description: 'Audit 로그의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit 로그 상세 조회 성공',
    type: AuditLogResponseDto,
  })
  async getAuditLogDetail(
    @Param('id') id: string,
  ): Promise<AuditLogResponseDto> {
    const auditLog =
      await this.auditLogContextService.audit로그상세를_조회한다(id);

    if (!auditLog) {
      throw new NotFoundException('Audit 로그를 찾을 수 없습니다.');
    }

    return auditLog;
  }
}
