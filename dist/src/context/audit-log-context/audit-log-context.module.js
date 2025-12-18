"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogContextModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const common_domain_module_1 = require("../../domain/common/common-domain.module");
const audit_log_entity_1 = require("../../domain/common/audit-log/audit-log.entity");
const audit_log_context_service_1 = require("./audit-log-context.service");
const handlers_1 = require("./handlers");
let AuditLogContextModule = class AuditLogContextModule {
};
exports.AuditLogContextModule = AuditLogContextModule;
exports.AuditLogContextModule = AuditLogContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            common_domain_module_1.CommonDomainModule,
            typeorm_1.TypeOrmModule.forFeature([audit_log_entity_1.AuditLog]),
        ],
        providers: [
            audit_log_context_service_1.AuditLogContextService,
            handlers_1.CreateAuditLogHandler,
            handlers_1.GetAuditLogListHandler,
            handlers_1.GetAuditLogDetailHandler,
            handlers_1.GetAuditLogStatsHandler,
        ],
        exports: [audit_log_context_service_1.AuditLogContextService],
    })
], AuditLogContextModule);
//# sourceMappingURL=audit-log-context.module.js.map