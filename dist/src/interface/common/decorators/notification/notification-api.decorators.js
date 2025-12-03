"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNotifications = GetNotifications;
exports.MarkNotificationAsRead = MarkNotificationAsRead;
exports.MarkAllNotificationsAsRead = MarkAllNotificationsAsRead;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notification_dto_1 = require("../../dto/notification/notification.dto");
function GetNotifications() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':recipientId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '알림 목록 조회',
        description: `**중요**: 특정 수신자의 알림 목록을 조회합니다. 읽음 여부 필터링 및 페이지네이션을 지원합니다.

**동작:**
- 수신자 ID로 알림 목록 조회
- 읽음 여부 필터링 가능 (isRead 파라미터)
- 페이지네이션 지원 (skip, take 파라미터)
- 전체 개수 및 읽지 않은 개수 반환

**테스트 케이스:**
- 기본 조회: 수신자의 알림 목록을 조회할 수 있어야 한다
- 읽지 않은 알림만 조회: isRead=false로 필터링
- 읽은 알림만 조회: isRead=true로 필터링
- 페이지네이션: skip, take 파라미터로 페이지네이션 가능
- 빈 결과: 알림이 없는 경우 빈 배열 반환
- 필드 검증: id, sender, recipientId, title, content, isRead, createdAt 등 포함
- UUID 검증: 잘못된 UUID 형식의 recipientId로 요청 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'recipientId',
        description: '수신자 ID (사번)',
        type: 'string',
        example: 'emp001',
    }), (0, swagger_1.ApiQuery)({
        name: 'isRead',
        required: false,
        description: '읽음 여부 필터 (기본값: 전체, 가능값: "true", "false")',
        type: String,
        example: 'false',
    }), (0, swagger_1.ApiQuery)({
        name: 'skip',
        required: false,
        description: '건너뛸 개수 (기본값: 0)',
        type: Number,
        example: 0,
    }), (0, swagger_1.ApiQuery)({
        name: 'take',
        required: false,
        description: '가져올 개수 (기본값: 20)',
        type: Number,
        example: 20,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '알림 목록이 성공적으로 조회되었습니다.',
        type: notification_dto_1.GetNotificationsResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }));
}
function MarkNotificationAsRead() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':notificationId/read'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '알림 읽음 처리',
        description: `**중요**: 특정 알림을 읽음 상태로 변경합니다. 읽음 일시가 자동으로 기록됩니다.

**동작:**
- 알림 ID로 알림 조회
- 읽음 상태(isRead)를 true로 변경
- 읽음 일시(readAt) 자동 기록
- 멱등성 보장 (이미 읽은 알림도 성공 반환)

**테스트 케이스:**
- 기본 동작: 알림을 읽음 상태로 변경
- 멱등성: 이미 읽은 알림을 다시 읽음 처리해도 성공
- 잘못된 UUID: UUID 형식이 아닌 notificationId로 요청 시 400 에러
- 존재하지 않는 알림: 유효하지 않은 notificationId로 요청 시 404 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'notificationId',
        description: '알림 ID',
        type: 'string',
        example: 'notification-123',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '알림이 성공적으로 읽음 처리되었습니다.',
        type: notification_dto_1.MarkNotificationAsReadResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: '알림을 찾을 수 없습니다.',
    }));
}
function MarkAllNotificationsAsRead() {
    return (0, common_1.applyDecorators)((0, common_1.Patch)(':recipientId/read-all'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '전체 알림 읽음 처리',
        description: `**중요**: 수신자의 모든 읽지 않은 알림을 읽음 상태로 변경합니다. 일괄 처리로 효율적으로 동작합니다.

**동작:**
- 수신자 ID로 읽지 않은 알림 조회
- 모든 읽지 않은 알림을 읽음 상태로 변경
- 업데이트된 알림 개수 반환
- 멱등성 보장

**테스트 케이스:**
- 기본 동작: 모든 읽지 않은 알림을 읽음 처리
- 업데이트 개수: updatedCount에 실제 업데이트된 개수 반환
- 읽지 않은 알림 없음: 읽지 않은 알림이 없는 경우 updatedCount=0 반환
- 잘못된 recipientId: 잘못된 형식의 recipientId로 요청 시 400 에러`,
    }), (0, swagger_1.ApiParam)({
        name: 'recipientId',
        description: '수신자 ID (사번)',
        type: 'string',
        example: 'emp001',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: '모든 알림이 성공적으로 읽음 처리되었습니다.',
        type: notification_dto_1.MarkAllAsReadResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }));
}
//# sourceMappingURL=notification-api.decorators.js.map