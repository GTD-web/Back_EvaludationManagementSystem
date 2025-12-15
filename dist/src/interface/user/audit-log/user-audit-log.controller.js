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
exports.UserAuditLogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../../common/decorators");
const audit_log_context_service_1 = require("../../../context/audit-log-context/audit-log-context.service");
const get_audit_log_list_query_dto_1 = require("../../common/dto/audit-log/get-audit-log-list-query.dto");
let UserAuditLogController = class UserAuditLogController {
    auditLogContextService;
    constructor(auditLogContextService) {
        this.auditLogContextService = auditLogContextService;
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
exports.UserAuditLogController = UserAuditLogController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_audit_log_list_query_dto_1.GetAuditLogListQueryDto]),
    __metadata("design:returntype", Promise)
], UserAuditLogController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserAuditLogController.prototype, "getAuditLogDetail", null);
exports.UserAuditLogController = UserAuditLogController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('web'),
    (0, common_1.Controller)('user/audit-logs'),
    __metadata("design:paramtypes", [audit_log_context_service_1.AuditLogContextService])
], UserAuditLogController);
//# sourceMappingURL=user-audit-log.controller.js.map