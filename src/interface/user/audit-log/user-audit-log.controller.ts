import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeController,
} from '@nestjs/swagger';
import { Roles } from '@interface/common/decorators';
import { AuditLogContextService } from '@context/audit-log-context/audit-log-context.service';
import { AuditLogListResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';
import { GetAuditLogListQueryDto } from '@interface/common/dto/audit-log/get-audit-log-list-query.dto';
import { AuditLogResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';

@ApiExcludeController()
@ApiBearerAuth('Bearer')
@Roles('web')
@Controller('user/audit-logs')
export class UserAuditLogController {
  constructor(
    private readonly auditLogContextService: AuditLogContextService,
  ) {}

  /**
   * Audit 로그 목록을 조회한다 (Web 권한용)
   */
  @Get()
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
   * Audit 로그 상세 정보를 조회한다 (Web 권한용)
   */
  @Get(':id')
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

