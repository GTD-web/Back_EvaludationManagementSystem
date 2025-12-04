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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationServiceImpl_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationServiceImpl = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
let NotificationServiceImpl = NotificationServiceImpl_1 = class NotificationServiceImpl {
    config;
    logger = new common_1.Logger(NotificationServiceImpl_1.name);
    httpClient;
    initialized = false;
    constructor(config) {
        this.config = config;
        this.logger.log(`알림 서비스 클라이언트 초기화 중... baseUrl: ${this.config.baseUrl}, timeoutMs: ${this.config.timeoutMs || 30000}`);
        this.httpClient = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeoutMs || 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.httpClient.interceptors.response.use((response) => response, (error) => {
            this.logger.error(`API 요청 실패: ${error.message}`, error.stack);
            if (error.response) {
                this.logger.error(`응답 상태: ${error.response.status}, 데이터: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        });
        this.logger.log('알림 서비스 클라이언트 인스턴스 생성 완료');
    }
    async onModuleInit() {
        await this.초기화한다();
    }
    async 초기화한다() {
        if (this.initialized) {
            return;
        }
        try {
            this.logger.log(`알림 서비스 초기화 시작... baseUrl: ${this.config.baseUrl}`);
            const startTime = Date.now();
            const elapsedTime = Date.now() - startTime;
            this.initialized = true;
            this.logger.log(`알림 서비스 초기화 완료 (소요 시간: ${elapsedTime}ms)`);
        }
        catch (error) {
            this.logger.error(`알림 서비스 초기화 실패: ${error.message}`, error.stack);
            this.logger.warn('알림 서비스 초기화 실패했지만, 서비스는 계속 사용 가능합니다.');
            this.initialized = true;
        }
    }
    초기화확인() {
        if (!this.initialized) {
            throw new Error('알림 서비스가 초기화되지 않았습니다. 먼저 초기화한다()를 호출하세요.');
        }
    }
    async 알림을전송한다(params) {
        this.초기화확인();
        try {
            this.logger.log(`알림 전송 요청: 제목=${params.title}, 수신자 수=${params.recipients.length}`);
            const response = await this.httpClient.post('/api/portal/notifications/send', params);
            this.logger.log(`알림 전송 성공: notificationId=${response.data.notificationId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error('알림 전송 실패', error);
            return {
                success: false,
                message: '알림 전송 실패',
                error: error.message || '알 수 없는 오류',
            };
        }
    }
    async 알림목록을조회한다(params) {
        this.초기화확인();
        try {
            this.logger.log(`알림 목록 조회 요청: recipientId=${params.recipientId}, isRead=${params.isRead}, skip=${params.skip}, take=${params.take}`);
            const queryParams = {};
            if (params.isRead !== undefined) {
                queryParams.isRead = params.isRead;
            }
            if (params.skip !== undefined) {
                queryParams.skip = params.skip;
            }
            if (params.take !== undefined) {
                queryParams.take = params.take;
            }
            this.logger.debug(`알림 서버로 전송할 쿼리 파라미터: ${JSON.stringify(queryParams)}`);
            const response = await this.httpClient.get(`/api/portal/notifications/${params.recipientId}`, { params: queryParams });
            this.logger.log(`알림 서버 응답: 알림 수=${response.data.notifications?.length || 0}, 전체=${response.data.total || 0}`);
            let notifications = (response.data.notifications || []).map((notification) => ({
                id: notification.id,
                sender: notification.sender || 'system',
                recipientId: notification.recipient,
                title: notification.title,
                content: notification.content,
                isRead: notification.isRead,
                sourceSystem: notification.sourceSystem,
                linkUrl: notification.linkUrl,
                metadata: notification.metadata,
                createdAt: new Date(notification.createdAt),
                readAt: notification.readAt ? new Date(notification.readAt) : undefined,
            }));
            const originalCount = notifications.length;
            if (params.isRead !== undefined) {
                notifications = notifications.filter((n) => n.isRead === params.isRead);
                this.logger.log(`📌 isRead=${params.isRead} 필터 적용: ${originalCount}개 → ${notifications.length}개`);
            }
            const allNotifications = (response.data.notifications || []).map((notification) => ({
                isRead: notification.isRead,
            }));
            const unreadCount = allNotifications.filter((n) => !n.isRead).length;
            this.logger.log(`알림 목록 조회 완료: 조회=${notifications.length}개, 전체=${response.data.total || 0}개, 미읽음=${unreadCount}개`);
            return {
                notifications,
                total: params.isRead !== undefined
                    ? notifications.length
                    : response.data.total || originalCount,
                unreadCount: response.data.unreadCount || unreadCount,
            };
        }
        catch (error) {
            this.logger.error('알림 목록 조회 실패', error);
            if (error.response) {
                this.logger.error(`API 응답 에러: 상태=${error.response.status}, 데이터=${JSON.stringify(error.response.data)}`);
            }
            return {
                notifications: [],
                total: 0,
                unreadCount: 0,
            };
        }
    }
    async 알림을읽음처리한다(params) {
        this.초기화확인();
        try {
            this.logger.log(`알림 읽음 처리 요청: notificationId=${params.notificationId}`);
            const response = await this.httpClient.patch(`/api/portal/notifications/${params.notificationId}/read`);
            this.logger.log(`알림 읽음 처리 성공: notificationId=${params.notificationId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error('알림 읽음 처리 실패', error);
            return {
                success: false,
                message: '알림 읽음 처리 실패',
            };
        }
    }
    async 전체알림을읽음처리한다(params) {
        this.초기화확인();
        try {
            this.logger.log(`전체 알림 읽음 처리 요청: recipientId=${params.recipientId}`);
            const response = await this.httpClient.patch(`/api/portal/notifications/${params.recipientId}/read-all`);
            this.logger.log(`전체 알림 읽음 처리 성공: recipientId=${params.recipientId}, updatedCount=${response.data.updatedCount}`);
            return response.data;
        }
        catch (error) {
            this.logger.error('전체 알림 읽음 처리 실패', error);
            return {
                success: false,
                message: '전체 알림 읽음 처리 실패',
                updatedCount: 0,
            };
        }
    }
};
exports.NotificationServiceImpl = NotificationServiceImpl;
exports.NotificationServiceImpl = NotificationServiceImpl = NotificationServiceImpl_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('NOTIFICATION_CONFIG')),
    __metadata("design:paramtypes", [Object])
], NotificationServiceImpl);
//# sourceMappingURL=notification.service.impl.js.map