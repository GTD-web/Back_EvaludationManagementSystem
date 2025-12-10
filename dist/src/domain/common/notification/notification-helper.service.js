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
var NotificationHelperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationHelperService = exports.NOTIFICATION_SERVICE_TOKEN = void 0;
const common_1 = require("@nestjs/common");
const sso_1 = require("../sso");
exports.NOTIFICATION_SERVICE_TOKEN = 'NotificationService';
let NotificationHelperService = NotificationHelperService_1 = class NotificationHelperService {
    ssoService;
    notificationService;
    logger = new common_1.Logger(NotificationHelperService_1.name);
    constructor(ssoService, notificationService) {
        this.ssoService = ssoService;
        this.notificationService = notificationService;
    }
    async 직원들에게_알림을_전송한다(params) {
        const { employeeNumbers, sender, title, content, sourceSystem, linkUrl, metadata, } = params;
        this.logger.log(`알림 전송 시작: 제목="${title}", 수신자 수=${employeeNumbers.length}`);
        try {
            this.logger.debug(`FCM 토큰 조회 중: ${employeeNumbers.join(', ')}`);
            const fcmTokensInfo = await this.ssoService.여러직원의FCM토큰을조회한다({
                employeeNumbers,
            });
            const recipients = fcmTokensInfo.byEmployee
                .map((emp) => ({
                employeeNumber: emp.employeeNumber,
                tokens: emp.tokens
                    .filter((token) => token.deviceType.toLowerCase().includes('portal'))
                    .map((t) => t.fcmToken),
            }))
                .filter((emp) => emp.tokens.length > 0);
            if (recipients.length === 0) {
                this.logger.warn(`FCM 토큰이 있는 수신자가 없습니다. 요청된 직원: ${employeeNumbers.join(', ')}`);
                return {
                    success: false,
                    message: 'FCM 토큰이 있는 수신자가 없습니다.',
                };
            }
            const totalPortalTokens = recipients.reduce((sum, r) => sum + r.tokens.length, 0);
            this.logger.debug(`Portal FCM 토큰 조회 완료: ${recipients.length}명의 수신자, 총 ${totalPortalTokens}개 토큰 (전체 ${fcmTokensInfo.totalTokens}개 중)`);
            recipients.forEach((recipient) => {
                const portalTokens = fcmTokensInfo.byEmployee
                    .find((emp) => emp.employeeNumber === recipient.employeeNumber)
                    ?.tokens.filter((t) => t.deviceType.toLowerCase().includes('portal')) || [];
                if (portalTokens.length > 0) {
                    this.logger.debug(`직원 ${recipient.employeeNumber}: ${portalTokens.length}개 Portal 토큰 - ${portalTokens.map((t) => `${t.deviceType}(${t.fcmToken.substring(0, 20)}...)`).join(', ')}`);
                }
            });
            const notificationParams = {
                sender,
                title,
                content,
                recipients,
                sourceSystem,
                linkUrl,
                metadata,
            };
            const result = await this.notificationService.알림을전송한다(notificationParams);
            const isSuccess = result.success || (result.successCount && result.successCount > 0) || false;
            if (isSuccess) {
                this.logger.log(`알림 전송 성공: notificationId=${result.notificationId}, 수신자=${recipients.length}명`);
                if (result.successCount !== undefined) {
                    this.logger.log(`알림 전송 상세: 성공 ${result.successCount}건, 실패 ${result.failureCount || 0}건`);
                }
            }
            else {
                this.logger.error(`알림 전송 실패: ${result.error || result.message}`);
            }
            if (!result.success && result.successCount && result.successCount > 0) {
                return {
                    ...result,
                    success: true,
                };
            }
            return result;
        }
        catch (error) {
            this.logger.error(`알림 전송 중 오류 발생: ${error.message}`, error.stack);
            return {
                success: false,
                message: '알림 전송 중 오류가 발생했습니다.',
                error: error.message,
            };
        }
    }
    async 직원에게_알림을_전송한다(params) {
        return this.직원들에게_알림을_전송한다({
            ...params,
            employeeNumbers: [params.employeeNumber],
        });
    }
    async Portal사용자에게_알림을_전송한다(params) {
        const { sender, title, content, sourceSystem, linkUrl, metadata, employeeNumber } = params;
        this.logger.warn(`[DEPRECATED] Portal사용자에게_알림을_전송한다() 메서드는 deprecated되었습니다. ` +
            `직원에게_알림을_전송한다() 메서드를 사용하세요.`);
        if (!employeeNumber) {
            this.logger.error('employeeNumber 파라미터가 필요합니다. Portal 알림은 더 이상 환경변수를 사용하지 않습니다.');
            return {
                success: false,
                message: 'employeeNumber 파라미터가 필요합니다.',
            };
        }
        return this.직원에게_알림을_전송한다({
            sender,
            title,
            content,
            employeeNumber,
            sourceSystem,
            linkUrl,
            metadata,
        });
    }
};
exports.NotificationHelperService = NotificationHelperService;
exports.NotificationHelperService = NotificationHelperService = NotificationHelperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sso_1.SSOService)),
    __param(1, (0, common_1.Inject)(exports.NOTIFICATION_SERVICE_TOKEN)),
    __metadata("design:paramtypes", [Object, Object])
], NotificationHelperService);
//# sourceMappingURL=notification-helper.service.js.map