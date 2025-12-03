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
exports.NotificationModule = exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const notification_service_factory_1 = require("./notification.service.factory");
const notification_helper_service_1 = require("./notification-helper.service");
const sso_1 = require("../sso");
exports.NotificationService = notification_helper_service_1.NOTIFICATION_SERVICE_TOKEN;
let NotificationModule = class NotificationModule {
    factory;
    constructor(factory) {
        this.factory = factory;
    }
    async onModuleInit() {
        await this.factory.initialize();
    }
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, sso_1.SSOModule],
        providers: [
            {
                provide: 'NOTIFICATION_CONFIG',
                useFactory: (configService) => {
                    const config = {
                        baseUrl: configService.get('MAIL_SERVER_URL') ||
                            'http://localhost:3001',
                        timeoutMs: configService.get('NOTIFICATION_TIMEOUT_MS') || 30000,
                        retries: configService.get('NOTIFICATION_RETRIES') || 2,
                        retryDelay: configService.get('NOTIFICATION_RETRY_DELAY') || 1000,
                        enableLogging: false,
                    };
                    const useMockService = configService.get('NOTIFICATION_USE_MOCK') === 'true' ||
                        configService.get('NODE_ENV') === 'test';
                    if (!useMockService && !config.baseUrl) {
                        throw new Error('MAIL_SERVER_URL 환경 변수가 필요합니다.');
                    }
                    return config;
                },
                inject: [config_1.ConfigService],
            },
            notification_service_factory_1.NotificationServiceFactory,
            {
                provide: notification_helper_service_1.NOTIFICATION_SERVICE_TOKEN,
                useFactory: (factory) => {
                    return factory.create();
                },
                inject: [notification_service_factory_1.NotificationServiceFactory],
            },
            notification_helper_service_1.NotificationHelperService,
        ],
        exports: [
            'NOTIFICATION_CONFIG',
            notification_helper_service_1.NOTIFICATION_SERVICE_TOKEN,
            notification_service_factory_1.NotificationServiceFactory,
            notification_helper_service_1.NotificationHelperService,
        ],
    }),
    __metadata("design:paramtypes", [notification_service_factory_1.NotificationServiceFactory])
], NotificationModule);
//# sourceMappingURL=notification.module.js.map