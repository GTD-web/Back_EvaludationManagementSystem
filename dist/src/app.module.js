"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const database_module_1 = require("../libs/database/database.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const common_domain_module_1 = require("./domain/common/common-domain.module");
const core_domain_module_1 = require("./domain/core/core-domain.module");
const sub_domain_module_1 = require("./domain/sub/sub-domain.module");
const domain_context_module_1 = require("./context/domain-context.module");
const backup_context_module_1 = require("./context/backup-context/backup-context.module");
const business_module_1 = require("./business/business.module");
const interface_module_1 = require("./interface/interface.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            schedule_1.ScheduleModule.forRoot(),
            database_module_1.DatabaseModule,
            common_domain_module_1.CommonDomainModule,
            core_domain_module_1.CoreDomainModule,
            sub_domain_module_1.SubDomainModule,
            domain_context_module_1.DomainContextModule,
            backup_context_module_1.BackupContextModule,
            business_module_1.BusinessModule,
            interface_module_1.InterfaceModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map