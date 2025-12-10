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
exports.DatabaseConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let DatabaseConfigService = class DatabaseConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    createTypeOrmOptions() {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const isDevelopment = this.configService.get('NODE_ENV') === 'development';
        return {
            type: 'postgres',
            host: this.configService.get('DB_HOST', 'localhost'),
            port: this.configService.get('DB_PORT', 5432),
            username: this.configService.get('DB_USERNAME', 'lumir_admin'),
            password: this.configService.get('DB_PASSWORD', 'lumir_password_2024'),
            database: this.configService.get('DB_DATABASE', 'lumir_project_management'),
            migrations: ['dist/migrations/*{.ts,.js}'],
            migrationsRun: false,
            synchronize: false,
            logging: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
            extra: {
                connectionLimit: 10,
                acquireTimeout: 60000,
                timeout: 60000,
                reconnect: true,
            },
            cache: {
                type: 'database',
                duration: 30000,
            },
            ssl: isProduction ? { rejectUnauthorized: false } : false,
            retryAttempts: 3,
            retryDelay: 3000,
            autoLoadEntities: true,
            dropSchema: false,
        };
    }
};
exports.DatabaseConfigService = DatabaseConfigService;
exports.DatabaseConfigService = DatabaseConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseConfigService);
//# sourceMappingURL=database-config.service.js.map