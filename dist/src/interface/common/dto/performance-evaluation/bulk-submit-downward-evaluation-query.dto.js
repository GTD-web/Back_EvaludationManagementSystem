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
exports.BulkSubmitDownwardEvaluationQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const downward_evaluation_types_1 = require("../../../../domain/core/downward-evaluation/downward-evaluation.types");
const decorators_1 = require("../../decorators");
class BulkSubmitDownwardEvaluationQueryDto {
    evaluationType;
    approveAllBelow;
}
exports.BulkSubmitDownwardEvaluationQueryDto = BulkSubmitDownwardEvaluationQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 유형 (primary 또는 secondary)',
        enum: downward_evaluation_types_1.DownwardEvaluationType,
        required: true,
        example: downward_evaluation_types_1.DownwardEvaluationType.PRIMARY,
    }),
    (0, class_validator_1.IsEnum)(downward_evaluation_types_1.DownwardEvaluationType, {
        message: 'evaluationType은 primary 또는 secondary여야 합니다.',
    }),
    __metadata("design:type", String)
], BulkSubmitDownwardEvaluationQueryDto.prototype, "evaluationType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하위 단계 자동 승인 여부 (기본값: true)',
        example: true,
        type: Boolean,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkSubmitDownwardEvaluationQueryDto.prototype, "approveAllBelow", void 0);
//# sourceMappingURL=bulk-submit-downward-evaluation-query.dto.js.map