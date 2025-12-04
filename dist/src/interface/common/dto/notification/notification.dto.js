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
exports.SendNotificationResponseDto = exports.SendSimpleNotificationBodyDto = exports.SendSimpleNotificationQueryDto = exports.SendNotificationRequestDto = exports.NotificationRecipientDto = exports.MarkAllAsReadResponseDto = exports.MarkNotificationAsReadResponseDto = exports.GetNotificationsResponseDto = exports.GetNotificationsQueryDto = exports.NotificationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class NotificationDto {
    id;
    sender;
    recipientId;
    title;
    content;
    isRead;
    sourceSystem;
    linkUrl;
    metadata;
    createdAt;
    readAt;
}
exports.NotificationDto = NotificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '알림 ID' }),
    __metadata("design:type", String)
], NotificationDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '발신자 ID' }),
    __metadata("design:type", String)
], NotificationDto.prototype, "sender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '수신자 ID' }),
    __metadata("design:type", String)
], NotificationDto.prototype, "recipientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '제목' }),
    __metadata("design:type", String)
], NotificationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '내용' }),
    __metadata("design:type", String)
], NotificationDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '읽음 여부' }),
    __metadata("design:type", Boolean)
], NotificationDto.prototype, "isRead", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '출처 시스템' }),
    __metadata("design:type", String)
], NotificationDto.prototype, "sourceSystem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '링크 URL' }),
    __metadata("design:type", String)
], NotificationDto.prototype, "linkUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '메타데이터' }),
    __metadata("design:type", Object)
], NotificationDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성일시' }),
    __metadata("design:type", Date)
], NotificationDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '읽은 일시' }),
    __metadata("design:type", Date)
], NotificationDto.prototype, "readAt", void 0);
class GetNotificationsQueryDto {
    isRead;
    skip;
    take;
}
exports.GetNotificationsQueryDto = GetNotificationsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '읽음 여부 필터',
        type: String,
        example: 'false',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetNotificationsQueryDto.prototype, "isRead", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '건너뛸 개수',
        type: Number,
        example: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetNotificationsQueryDto.prototype, "skip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '가져올 개수',
        type: Number,
        example: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetNotificationsQueryDto.prototype, "take", void 0);
class GetNotificationsResponseDto {
    notifications;
    total;
    unreadCount;
}
exports.GetNotificationsResponseDto = GetNotificationsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '알림 목록', type: [NotificationDto] }),
    __metadata("design:type", Array)
], GetNotificationsResponseDto.prototype, "notifications", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전체 개수' }),
    __metadata("design:type", Number)
], GetNotificationsResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '읽지 않은 개수' }),
    __metadata("design:type", Number)
], GetNotificationsResponseDto.prototype, "unreadCount", void 0);
class MarkNotificationAsReadResponseDto {
    success;
    message;
}
exports.MarkNotificationAsReadResponseDto = MarkNotificationAsReadResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '성공 여부' }),
    __metadata("design:type", Boolean)
], MarkNotificationAsReadResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '메시지' }),
    __metadata("design:type", String)
], MarkNotificationAsReadResponseDto.prototype, "message", void 0);
class MarkAllAsReadResponseDto {
    success;
    message;
    updatedCount;
}
exports.MarkAllAsReadResponseDto = MarkAllAsReadResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '성공 여부' }),
    __metadata("design:type", Boolean)
], MarkAllAsReadResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '메시지' }),
    __metadata("design:type", String)
], MarkAllAsReadResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '업데이트된 알림 개수' }),
    __metadata("design:type", Number)
], MarkAllAsReadResponseDto.prototype, "updatedCount", void 0);
class NotificationRecipientDto {
    employeeNumber;
    tokens;
}
exports.NotificationRecipientDto = NotificationRecipientDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '직원 번호 (사번)', example: 'emp001' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationRecipientDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'FCM 토큰 목록',
        type: [String],
        example: ['fcm-token-1', 'fcm-token-2'],
    }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], NotificationRecipientDto.prototype, "tokens", void 0);
class SendNotificationRequestDto {
    sender;
    title;
    content;
    recipients;
    sourceSystem;
    linkUrl;
    metadata;
}
exports.SendNotificationRequestDto = SendNotificationRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '발신자 ID', example: 'system' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendNotificationRequestDto.prototype, "sender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '알림 제목', example: '자기평가가 제출되었습니다' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendNotificationRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '알림 내용',
        example: '홍길동님이 자기평가를 제출했습니다.',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendNotificationRequestDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수신자 목록',
        type: [NotificationRecipientDto],
    }),
    (0, class_transformer_1.Type)(() => NotificationRecipientDto),
    __metadata("design:type", Array)
], SendNotificationRequestDto.prototype, "recipients", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '출처 시스템', example: 'EMS' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendNotificationRequestDto.prototype, "sourceSystem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '링크 URL',
        example: '/evaluations/12345',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendNotificationRequestDto.prototype, "linkUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '메타데이터',
        example: { type: 'self-evaluation', priority: 'high' },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendNotificationRequestDto.prototype, "metadata", void 0);
class SendSimpleNotificationQueryDto {
    title;
    content;
    linkUrl;
}
exports.SendSimpleNotificationQueryDto = SendSimpleNotificationQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '알림 제목',
        example: '자기평가가 제출되었습니다',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSimpleNotificationQueryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '알림 내용',
        example: '홍길동님이 자기평가를 제출했습니다.',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSimpleNotificationQueryDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '링크 URL',
        example: '/evaluations/12345',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendSimpleNotificationQueryDto.prototype, "linkUrl", void 0);
class SendSimpleNotificationBodyDto {
    metadata;
}
exports.SendSimpleNotificationBodyDto = SendSimpleNotificationBodyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '메타데이터',
        example: { type: 'self-evaluation', priority: 'high' },
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SendSimpleNotificationBodyDto.prototype, "metadata", void 0);
class SendNotificationResponseDto {
    success;
    message;
    notificationId;
    error;
}
exports.SendNotificationResponseDto = SendNotificationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '성공 여부' }),
    __metadata("design:type", Boolean)
], SendNotificationResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '메시지' }),
    __metadata("design:type", String)
], SendNotificationResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '알림 ID' }),
    __metadata("design:type", String)
], SendNotificationResponseDto.prototype, "notificationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '에러 메시지' }),
    __metadata("design:type", String)
], SendNotificationResponseDto.prototype, "error", void 0);
//# sourceMappingURL=notification.dto.js.map