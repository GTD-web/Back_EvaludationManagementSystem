"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../../common/decorators");
const audit_log_context_service_1 = require("../../../context/audit-log-context/audit-log-context.service");
const audit_log_response_dto_1 = require("../../common/dto/audit-log/audit-log-response.dto");
const get_audit_log_list_query_dto_1 = require("../../common/dto/audit-log/get-audit-log-list-query.dto");
const audit_log_response_dto_2 = require("../../common/dto/audit-log/audit-log-response.dto");
const get_audit_log_stats_query_dto_1 = require("../../common/dto/audit-log/get-audit-log-stats-query.dto");
const audit_log_stats_response_dto_1 = require("../../common/dto/audit-log/audit-log-stats-response.dto");
let AuditLogController = class AuditLogController {
    auditLogContextService;
    constructor(auditLogContextService) {
        this.auditLogContextService = auditLogContextService;
    }
    async getAuditLogStats(query) {
        const { startDate, endDate, interval = 60 } = query;
        const result = await this.auditLogContextService.audit로그통계를_조회한다(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, interval);
        return {
            stats: result.stats,
        };
    }
    async getAuditLogs(query) {
        const { userId, userEmail, employeeNumber, requestMethod, requestUrl, responseStatusCode, startDate, endDate, page = 1, limit = 10, } = query;
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
        return await this.auditLogContextService.audit로그목록을_조회한다(filter, parseInt(page.toString(), 10), parseInt(limit.toString(), 10));
    }
    async getAuditLogDetail(id) {
        const auditLog = await this.auditLogContextService.audit로그상세를_조회한다(id);
        if (!auditLog) {
            throw new common_1.NotFoundException('Audit 로그를 찾을 수 없습니다.');
        }
        return auditLog;
    }
};
exports.AuditLogController = AuditLogController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Audit 로그 통계 조회',
        description: '시간 범위에 따라 시간대별 요청 통계를 조회합니다.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audit 로그 통계 조회 성공',
        type: audit_log_stats_response_dto_1.AuditLogStatsResponseDto,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'startDate',
        required: false,
        description: '시작 날짜 (ISO 8601)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endDate',
        required: false,
        description: '종료 날짜 (ISO 8601)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'interval',
        required: false,
        description: '시간 간격 (분 단위, 기본값: 60)',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_audit_log_stats_query_dto_1.GetAuditLogStatsQueryDto]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getAuditLogStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Audit 로그 목록 조회',
        description: '필터 조건에 따라 Audit 로그 목록을 페이징으로 조회합니다.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audit 로그 목록 조회 성공',
        type: audit_log_response_dto_1.AuditLogListResponseDto,
    }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: '사용자 ID' }),
    (0, swagger_1.ApiQuery)({
        name: 'userEmail',
        required: false,
        description: '사용자 이메일',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'employeeNumber',
        required: false,
        description: '직원 번호',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'requestMethod',
        required: false,
        description: 'HTTP 메서드 (GET, POST, PUT, DELETE 등)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'requestUrl',
        required: false,
        description: '요청 URL (부분 일치)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'responseStatusCode',
        required: false,
        description: '응답 상태 코드',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'startDate',
        required: false,
        description: '시작 날짜 (ISO 8601)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'endDate',
        required: false,
        description: '종료 날짜 (ISO 8601)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        description: '페이지 번호 (기본값: 1)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        description: '페이지 크기 (기본값: 10)',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_audit_log_list_query_dto_1.GetAuditLogListQueryDto]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Audit 로그 상세 조회',
        description: 'Audit 로그의 상세 정보를 조회합니다.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Audit 로그 상세 조회 성공',
        type: audit_log_response_dto_2.AuditLogResponseDto,
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "getAuditLogDetail", null);
exports.AuditLogController = AuditLogController = __decorate([
    (0, swagger_1.ApiTags)('A-0-5. 관리자 - 감사 로그'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/audit-logs'),
    __metadata("design:paramtypes", [audit_log_context_service_1.AuditLogContextService])
], AuditLogController);
//# sourceMappingURL=audit-log.controller.js.map