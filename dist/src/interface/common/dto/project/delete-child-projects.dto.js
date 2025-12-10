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
exports.DeleteChildProjectsResultDto = exports.DeleteChildProjectsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../decorators");
class DeleteChildProjectsDto {
    forceDelete = false;
    hardDelete = false;
}
exports.DeleteChildProjectsDto = DeleteChildProjectsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: `할당이 있는 프로젝트도 강제로 삭제할지 여부
    
- true: 할당 체크를 건너뛰고 강제 삭제 (⚠️ 위험)
- false: 할당이 있으면 삭제 실패 (기본값, 안전)`,
        example: false,
        default: false,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, decorators_1.ToBoolean)(false),
    __metadata("design:type", Boolean)
], DeleteChildProjectsDto.prototype, "forceDelete", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: `영구 삭제(Hard Delete) 여부
    
- true: 데이터베이스에서 영구 삭제
- false: Soft Delete (deletedAt만 설정, 기본값)`,
        example: false,
        default: false,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, decorators_1.ToBoolean)(false),
    __metadata("design:type", Boolean)
], DeleteChildProjectsDto.prototype, "hardDelete", void 0);
class DeleteChildProjectsResultDto {
    deletedCount;
    deleteType;
    assignmentCheckPerformed;
    deletedProjects;
    executionTimeSeconds;
}
exports.DeleteChildProjectsResultDto = DeleteChildProjectsResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제된 하위 프로젝트 수',
        example: 25,
    }),
    __metadata("design:type", Number)
], DeleteChildProjectsResultDto.prototype, "deletedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제 유형 (soft 또는 hard)',
        example: 'soft',
        enum: ['soft', 'hard'],
    }),
    __metadata("design:type", String)
], DeleteChildProjectsResultDto.prototype, "deleteType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당 체크 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], DeleteChildProjectsResultDto.prototype, "assignmentCheckPerformed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제된 프로젝트 상세 정보',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                projectCode: { type: 'string' },
                parentProjectId: { type: 'string', format: 'uuid', nullable: true },
            },
        },
        example: [
            {
                id: 'uuid-1',
                name: 'PRJ-001 프로젝트 - 1차 하위 프로젝트',
                projectCode: 'PRJ-001-SUB1',
                parentProjectId: 'uuid-parent',
            },
            {
                id: 'uuid-2',
                name: 'PRJ-001 프로젝트 - 2차 하위 프로젝트',
                projectCode: 'PRJ-001-SUB2',
                parentProjectId: 'uuid-1',
            },
        ],
    }),
    __metadata("design:type", Array)
], DeleteChildProjectsResultDto.prototype, "deletedProjects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실행 시간 (초)',
        example: 1.234,
    }),
    __metadata("design:type", Number)
], DeleteChildProjectsResultDto.prototype, "executionTimeSeconds", void 0);
//# sourceMappingURL=delete-child-projects.dto.js.map