"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNotifications = GetNotifications;
exports.MarkNotificationAsRead = MarkNotificationAsRead;
exports.MarkAllNotificationsAsRead = MarkAllNotificationsAsRead;
exports.SendNotification = SendNotification;
exports.SendSimpleNotification = SendSimpleNotification;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notification_dto_1 = require("../../dto/notification/notification.dto");
function GetNotifications() {
    return (0, common_1.applyDecorators)((0, common_1.Get)(':recipientId'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
        summary: '알림 목록 조회',
        description: `**중요**: 특정 수신자의 알림 목록을 조회합니다. 읽음 여부 필터링 및 페이지네이션을 지원하며, 무한 스크롤 구현에 필요한 전체 개수 정보를 제공합니다.

**동작:**
- 수신자 ID로 알림 목록 조회
- **자동으로 sourceSystem='EMS'인 알림만 조회** (백엔드에서 자동 필터링)
- 읽음 여부 필터링 가능 (isRead 파라미터)
- 페이지네이션 지원 (skip, take 파라미터)
- 필터 조건에 맞는 전체 알림 개수(total) 반환
- 읽지 않은 알림 개수(unreadCount) 반환
- 현재 페이지의 알림 목록(notifications) 반환

**응답 구조 (무한 스크롤 구현용):**
- notifications: 현재 페이지의 알림 목록 (skip, take에 따라 결정)
- total: 필터 조건(isRead)에 해당하는 전체 알림 개수 (take 값과 무관)
  - isRead 미지정 시: 전체 알림 개수
  - isRead=false 시: 읽지 않은 알림 전체 개수
  - isRead=true 시: 읽은 알림 전체 개수
  - 💡 무한 스크롤 구현 시: notifications.length < total이면 더 불러올 데이터가 있음
- unreadCount: 현재 페이지(notifications)에서 읽지 않은 알림 개수

**total 계산 예시:**
\`\`\`
전체 알림: 100개 (읽은 알림 40개 + 읽지 않은 알림 60개)

// isRead=true&take=10 요청
→ total: 40 (읽은 알림 전체 개수)
→ notifications: 10개 (take만큼만 반환)

// isRead=false&take=20 요청
→ total: 60 (읽지 않은 알림 전체 개수)
→ notifications: 20개 (take만큼만 반환)

// isRead 미지정&take=30 요청
→ total: 100 (전체 알림 개수)
→ notifications: 30개 (take만큼만 반환)
\`\`\`

**무한 스크롤 구현 예시:**
\`\`\`
// 1차 요청: skip=0, take=20
{ notifications: [...20개], total: 50, unreadCount: 30 }
// → 더 불러올 데이터 있음 (20 < 50)

// 2차 요청: skip=20, take=20
{ notifications: [...20개], total: 50, unreadCount: 30 }
// → 더 불러올 데이터 있음 (40 < 50)

// 3차 요청: skip=40, take=20
{ notifications: [...10개], total: 50, unreadCount: 30 }
// → 마지막 페이지 (50 = 50)
\`\`\`

**테스트 케이스:**
- 기본 조회: 수신자의 EMS 알림 목록을 조회할 수 있어야 한다 (sourceSystem='EMS'만 자동 필터링)
- 읽지 않은 알림만 조회: isRead=false로 필터링
- 읽은 알림만 조회: isRead=true로 필터링
- 페이지네이션: skip, take 파라미터로 페이지네이션 가능
- 빈 결과: 알림이 없는 경우 빈 배열 반환
- 필드 검증: id, sender, recipientId, title, content, isRead, sourceSystem, createdAt 등 포함
- sourceSystem 검증: 모든 알림의 sourceSystem이 'EMS'여야 함
- 개수 검증: total과 unreadCount가 응답에 포함되어야 함
- total 정확성: 필터 조건에 맞는 전체 개수가 정확해야 함
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
function SendNotification() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('send'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '알림 전송',
        description: `**중요**: 지정된 수신자들에게 알림을 전송합니다. FCM 토큰을 사용하여 푸시 알림을 발송하고 알림 서버에 저장합니다.

**동작:**
- 수신자 목록에 알림 전송
- FCM 토큰을 통한 푸시 알림 발송
- 알림 서버에 알림 저장
- 성공/실패 결과 반환

**테스트 케이스:**
- 기본 알림 전송: 제목, 내용, 수신자 정보로 알림 전송
- 링크 URL 포함: 링크 URL이 있는 알림 전송
- 메타데이터 포함: 추가 메타데이터가 있는 알림 전송
- 여러 수신자: 여러 수신자에게 동시 전송
- 필수 필드 누락: sender, title, content 누락 시 400 에러
- 빈 수신자 목록: 수신자가 없는 경우 400 에러`,
    }), (0, swagger_1.ApiBody)({
        type: notification_dto_1.SendNotificationRequestDto,
        description: '알림 전송 정보',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '알림이 성공적으로 전송되었습니다.',
        type: notification_dto_1.SendNotificationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '알림 전송 중 오류가 발생했습니다.',
    }));
}
function SendSimpleNotification() {
    return (0, common_1.applyDecorators)((0, common_1.Post)('send-simple'), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
        summary: '[Deprecated] 간편 알림 전송',
        description: `**⚠️ DEPRECATED**: 이 API는 더 이상 권장되지 않습니다. \`/api/notifications/send\` API를 사용하세요.

**변경 이유:**
- 환경변수(\`MAIL_NOTIFICATION_SSO\`)에 의존하는 방식은 유연성이 떨어짐
- 수신자를 명시적으로 지정하는 것이 더 명확하고 안전함
- Portal 알림이 필요한 경우 직접 수신자를 지정하여 전송 가능

**대안:**
\`\`\`typescript
// 기존 방식 (deprecated)
POST /api/notifications/send-simple?title=제목&content=내용

// 새로운 방식 (권장)
POST /api/notifications/send
{
  "sender": "system",
  "title": "제목",
  "content": "내용",
  "recipients": [
    {
      "employeeNumber": "25030",
      "tokens": [] // FCM 토큰은 백엔드에서 자동 조회
    }
  ],
  "sourceSystem": "EMS"
}
\`\`\`

**동작 (레거시):**
- 수신자 직원 번호를 파라미터로 받아야 함 (employeeNumber 필수)
- SSO에서 FCM 토큰 자동 조회
- deviceType에 'portal'이 포함된 토큰만 필터링
- 알림 서버로 전송

**자동 설정 값:**
- sender: 'system'
- sourceSystem: 'EMS'`,
    }), (0, swagger_1.ApiQuery)({
        name: 'title',
        required: true,
        description: '알림 제목',
        type: String,
        example: '자기평가가 제출되었습니다',
    }), (0, swagger_1.ApiQuery)({
        name: 'content',
        required: true,
        description: '알림 내용',
        type: String,
        example: '홍길동님이 자기평가를 제출했습니다.',
    }), (0, swagger_1.ApiQuery)({
        name: 'employeeNumber',
        required: true,
        description: '수신자 직원 번호 (필수)',
        type: String,
        example: '25030',
    }), (0, swagger_1.ApiQuery)({
        name: 'linkUrl',
        required: false,
        description: '링크 URL',
        type: String,
        example: '/evaluations/12345',
    }), (0, swagger_1.ApiBody)({
        type: notification_dto_1.SendSimpleNotificationBodyDto,
        description: '알림 메타데이터 (선택사항)',
        required: false,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: '알림이 성공적으로 전송되었습니다.',
        type: notification_dto_1.SendNotificationResponseDto,
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 데이터입니다. employeeNumber가 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.UNAUTHORIZED,
        description: '인증이 필요합니다.',
    }), (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: '알림 전송 중 오류가 발생했습니다.',
    }));
}
//# sourceMappingURL=notification-api.decorators.js.map