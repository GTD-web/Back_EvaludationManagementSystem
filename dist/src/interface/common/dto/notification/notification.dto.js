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
exports.MarkAllAsReadResponseDto = exports.MarkNotificationAsReadResponseDto = exports.GetNotificationsResponseDto = exports.GetNotificationsQueryDto = exports.NotificationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../decorators");
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
    (0, decorators_1.ToBoolean)(undefined),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
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
//# sourceMappingURL=notification.dto.js.map