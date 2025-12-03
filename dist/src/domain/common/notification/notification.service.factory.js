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
var NotificationServiceFactory_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationServiceFactory = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const notification_service_impl_1 = require("./notification.service.impl");
const notification_service_mock_1 = require("./notification.service.mock");
let NotificationServiceFactory = NotificationServiceFactory_1 = class NotificationServiceFactory {
    config;
    configService;
    logger = new common_1.Logger(NotificationServiceFactory_1.name);
    serviceInstance = null;
    constructor(config, configService) {
        this.config = config;
        this.configService = configService;
    }
    create() {
        if (this.serviceInstance) {
            return this.serviceInstance;
        }
        const useMockService = this.configService.get('NOTIFICATION_USE_MOCK') === 'true' ||
            this.configService.get('NODE_ENV') === 'test';
        if (useMockService) {
            this.logger.log('Mock 알림 서비스를 사용합니다');
            this.serviceInstance = new notification_service_mock_1.MockNotificationService();
        }
        else {
            this.logger.log('실제 알림 서비스를 사용합니다 (메일 서버 연동)');
            this.serviceInstance = new notification_service_impl_1.NotificationServiceImpl(this.config);
        }
        return this.serviceInstance;
    }
    async initialize() {
        const service = this.create();
        await service.초기화한다();
    }
};
exports.NotificationServiceFactory = NotificationServiceFactory;
exports.NotificationServiceFactory = NotificationServiceFactory = NotificationServiceFactory_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('NOTIFICATION_CONFIG')),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], NotificationServiceFactory);
//# sourceMappingURL=notification.service.factory.js.map