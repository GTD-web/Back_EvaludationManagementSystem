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
exports.GetRevisionRequestsQueryDto = exports.RevisionRequestStepEnum = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../decorators");
var RevisionRequestStepEnum;
(function (RevisionRequestStepEnum) {
    RevisionRequestStepEnum["CRITERIA"] = "criteria";
    RevisionRequestStepEnum["SELF"] = "self";
    RevisionRequestStepEnum["PRIMARY"] = "primary";
    RevisionRequestStepEnum["SECONDARY"] = "secondary";
})(RevisionRequestStepEnum || (exports.RevisionRequestStepEnum = RevisionRequestStepEnum = {}));
class GetRevisionRequestsQueryDto {
    evaluationPeriodId;
    employeeId;
    requestedBy;
    isRead;
    isCompleted;
    step;
}
exports.GetRevisionRequestsQueryDto = GetRevisionRequestsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 ID',
        type: 'string',
        format: 'uuid',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetRevisionRequestsQueryDto.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '피평가자 ID (관리자용)',
        type: 'string',
        format: 'uuid',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetRevisionRequestsQueryDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '요청자 ID (관리자용)',
        type: 'string',
        format: 'uuid',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetRevisionRequestsQueryDto.prototype, "requestedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '읽음 여부 (기본값: false, 가능값: "true", "false", "1", "0")',
        type: String,
        example: 'false',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(false),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GetRevisionRequestsQueryDto.prototype, "isRead", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재작성 완료 여부 (기본값: false, 가능값: "true", "false", "1", "0")',
        type: String,
        example: 'false',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(false),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GetRevisionRequestsQueryDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '단계',
        enum: RevisionRequestStepEnum,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RevisionRequestStepEnum),
    __metadata("design:type", String)
], GetRevisionRequestsQueryDto.prototype, "step", void 0);
//# sourceMappingURL=get-revision-requests-query.dto.js.map