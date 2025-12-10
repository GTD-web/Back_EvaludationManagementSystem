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
exports.BulkUpdateEmployeeAdminResponseDto = exports.BulkUpdateEmployeeAdminDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class BulkUpdateEmployeeAdminDto {
    employeeIds;
}
exports.BulkUpdateEmployeeAdminDto = BulkUpdateEmployeeAdminDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID 목록 (UUID 배열)',
        example: [
            '123e4567-e89b-12d3-a456-426614174000',
            '223e4567-e89b-12d3-a456-426614174001',
        ],
        type: [String],
        isArray: true,
    }),
    (0, class_validator_1.IsArray)({ message: 'employeeIds는 배열이어야 합니다.' }),
    (0, class_validator_1.ArrayNotEmpty)({ message: '최소 1명 이상의 직원 ID가 필요합니다.' }),
    (0, class_validator_1.IsUUID)('4', { each: true, message: '모든 직원 ID는 유효한 UUID여야 합니다.' }),
    __metadata("design:type", Array)
], BulkUpdateEmployeeAdminDto.prototype, "employeeIds", void 0);
class BulkUpdateEmployeeAdminResponseDto {
    success;
    totalProcessed;
    succeeded;
    failed;
    failedIds;
    errors;
    processedAt;
}
exports.BulkUpdateEmployeeAdminResponseDto = BulkUpdateEmployeeAdminResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], BulkUpdateEmployeeAdminResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '처리된 직원 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], BulkUpdateEmployeeAdminResponseDto.prototype, "totalProcessed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공한 직원 수',
        example: 4,
    }),
    __metadata("design:type", Number)
], BulkUpdateEmployeeAdminResponseDto.prototype, "succeeded", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 직원 수',
        example: 1,
    }),
    __metadata("design:type", Number)
], BulkUpdateEmployeeAdminResponseDto.prototype, "failed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 직원 ID 목록',
        example: ['invalid-uuid'],
        type: [String],
    }),
    __metadata("design:type", Array)
], BulkUpdateEmployeeAdminResponseDto.prototype, "failedIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '오류 메시지 목록',
        example: ['직원을 찾을 수 없습니다: invalid-uuid'],
        type: [String],
    }),
    __metadata("design:type", Array)
], BulkUpdateEmployeeAdminResponseDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '처리 완료 시각 (ISO 8601 형식)',
        example: '2024-01-15T09:30:00.000Z',
    }),
    __metadata("design:type", Date)
], BulkUpdateEmployeeAdminResponseDto.prototype, "processedAt", void 0);
//# sourceMappingURL=bulk-update-employee-admin.dto.js.map