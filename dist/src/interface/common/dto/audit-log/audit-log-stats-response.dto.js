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
exports.AuditLogStatsResponseDto = exports.AuditLogStatsItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuditLogStatsItemDto {
    time;
    timestamp;
    success;
    errors;
    total;
}
exports.AuditLogStatsItemDto = AuditLogStatsItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '시간 (HH:mm 형식)', example: '13:24' }),
    __metadata("design:type", String)
], AuditLogStatsItemDto.prototype, "time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '타임스탬프 (밀리초)', example: 1765949086323 }),
    __metadata("design:type", Number)
], AuditLogStatsItemDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '성공 요청 개수', example: 44 }),
    __metadata("design:type", Number)
], AuditLogStatsItemDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '실패 요청 개수', example: 0 }),
    __metadata("design:type", Number)
], AuditLogStatsItemDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '총 요청 개수', example: 44 }),
    __metadata("design:type", Number)
], AuditLogStatsItemDto.prototype, "total", void 0);
class AuditLogStatsResponseDto {
    stats;
}
exports.AuditLogStatsResponseDto = AuditLogStatsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시간대별 통계 데이터',
        type: [AuditLogStatsItemDto],
    }),
    __metadata("design:type", Array)
], AuditLogStatsResponseDto.prototype, "stats", void 0);
//# sourceMappingURL=audit-log-stats-response.dto.js.map