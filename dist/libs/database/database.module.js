"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const transaction_manager_service_1 = require("./transaction-manager.service");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const nodeEnv = configService.get('NODE_ENV', 'development');
                    const isTest = nodeEnv === 'test';
                    const isDevelopment = nodeEnv === 'development';
                    const isServerless = !!process.env.VERCEL;
                    const host = configService.get('DATABASE_HOST');
                    const port = configService.get('DATABASE_PORT', 5432);
                    const username = configService.get('DATABASE_USERNAME');
                    const password = configService.get('DATABASE_PASSWORD', '');
                    const database = configService.get('DATABASE_NAME');
                    const needsSSL = configService.get('DATABASE_SSL', 'false') === 'true';
                    if (!host || !username || !database) {
                        throw new Error('데이터베이스 연결 정보가 누락되었습니다. ' +
                            'DATABASE_HOST, DATABASE_USERNAME, DATABASE_NAME 환경 변수를 설정해주세요.');
                    }
                    return {
                        type: 'postgres',
                        host,
                        port,
                        username,
                        password,
                        database,
                        autoLoadEntities: true,
                        synchronize: true,
                        logging: configService.get('DB_LOGGING', isDevelopment && !isTest),
                        ssl: needsSSL ? { rejectUnauthorized: false } : false,
                        extra: {
                            max: configService.get('DATABASE_POOL_MAX', isServerless ? 2 : 10),
                            connectionTimeoutMillis: configService.get('DATABASE_CONNECTION_TIMEOUT', isServerless ? 5000 : 10000),
                            idleTimeoutMillis: configService.get('DATABASE_IDLE_TIMEOUT', isServerless ? 10000 : 20000),
                            statement_timeout: configService.get('DATABASE_STATEMENT_TIMEOUT', isServerless ? 20000 : 30000),
                            keepAlive: !isServerless,
                            ...(!isServerless && { keepAliveInitialDelayMillis: 10000 }),
                            ...(needsSSL && { ssl: { rejectUnauthorized: false } }),
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [transaction_manager_service_1.TransactionManagerService],
        exports: [transaction_manager_service_1.TransactionManagerService, typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map