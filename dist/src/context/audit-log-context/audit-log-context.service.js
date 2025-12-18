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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogContextService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const create_audit_log_handler_1 = require("./handlers/commands/create-audit-log.handler");
const get_audit_log_list_handler_1 = require("./handlers/queries/get-audit-log-list.handler");
const get_audit_log_detail_handler_1 = require("./handlers/queries/get-audit-log-detail.handler");
const get_audit_log_stats_handler_1 = require("./handlers/queries/get-audit-log-stats.handler");
let AuditLogContextService = class AuditLogContextService {
    commandBus;
    queryBus;
    constructor(commandBus, queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    async audit로그를생성한다(data) {
        const command = new create_audit_log_handler_1.CreateAuditLogCommand(data);
        return await this.commandBus.execute(command);
    }
    async audit로그목록을_조회한다(filter, page = 1, limit = 10) {
        const query = new get_audit_log_list_handler_1.GetAuditLogListQuery(filter, page, limit);
        return await this.queryBus.execute(query);
    }
    async audit로그상세를_조회한다(id) {
        const query = new get_audit_log_detail_handler_1.GetAuditLogDetailQuery(id);
        return await this.queryBus.execute(query);
    }
    async audit로그통계를_조회한다(startDate, endDate, interval = 60) {
        const query = new get_audit_log_stats_handler_1.GetAuditLogStatsQuery(startDate, endDate, interval);
        return await this.queryBus.execute(query);
    }
};
exports.AuditLogContextService = AuditLogContextService;
exports.AuditLogContextService = AuditLogContextService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus])
], AuditLogContextService);
//# sourceMappingURL=audit-log-context.service.js.map