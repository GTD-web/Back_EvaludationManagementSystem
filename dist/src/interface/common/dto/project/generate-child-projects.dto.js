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
exports.GenerateChildProjectDetailDto = exports.GenerateChildProjectsResultDto = exports.GenerateChildProjectsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const decorators_1 = require("../../decorators");
class GenerateChildProjectsDto {
    childCountPerProject;
    skipIfExists = true;
}
exports.GenerateChildProjectsDto = GenerateChildProjectsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재귀 트리 깊이 (1차 → 2차 → ... → N차)\n' +
            '- 각 상위 프로젝트마다 1개의 하위가 연쇄적으로 생성됩니다\n' +
            '- 예: depth=5 → 1차 밑에 2차, 2차 밑에 3차, ... 5차까지\n' +
            '- 기본값: 5단계 (지정하지 않으면 5차까지 생성)',
        example: 5,
        minimum: 1,
        maximum: 10,
        default: 5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], GenerateChildProjectsDto.prototype, "childCountPerProject", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이미 하위 프로젝트가 있는 상위 프로젝트를 건너뛸지 여부\n' +
            '- true (기본값): 하위가 이미 있으면 건너뜀\n' +
            '- false: 하위가 있어도 추가 생성 (중복 가능)\n' +
            '- 허용 값: true, false, "true", "false", "1", "0"',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GenerateChildProjectsDto.prototype, "skipIfExists", void 0);
class GenerateChildProjectsResultDto {
    success;
    processedParentProjects;
    skippedParentProjects;
    totalChildProjectsCreated;
    failedChildProjects;
    details;
    errors;
    duration;
}
exports.GenerateChildProjectsResultDto = GenerateChildProjectsResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], GenerateChildProjectsResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '처리된 최상위 프로젝트 수 (parentProjectId가 null인 프로젝트)',
        example: 11,
    }),
    __metadata("design:type", Number)
], GenerateChildProjectsResultDto.prototype, "processedParentProjects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '건너뛴 최상위 프로젝트 수 (이미 하위가 있는 경우)',
        example: 0,
    }),
    __metadata("design:type", Number)
], GenerateChildProjectsResultDto.prototype, "skippedParentProjects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 전체 하위 프로젝트 수 (모든 레벨 합산)\n' +
            '- 예: depth=5, 상위 11개 → 11 × 5 = 55개 생성',
        example: 55,
    }),
    __metadata("design:type", Number)
], GenerateChildProjectsResultDto.prototype, "totalChildProjectsCreated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 하위 프로젝트 수',
        example: 0,
    }),
    __metadata("design:type", Number)
], GenerateChildProjectsResultDto.prototype, "failedChildProjects", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '상세 결과 (최상위 프로젝트별)\n' +
            '- childrenCreated: 해당 최상위 아래 생성된 총 하위 개수 (재귀 합산)',
        example: [
            {
                parentProjectId: '98518c2c-d290-49ec-af5a-c2594a184296',
                parentProjectName: '대박인ㄴ데ㅛㅇ',
                childrenCreated: 5,
                skipped: false,
                errors: [],
            },
        ],
    }),
    __metadata("design:type", Array)
], GenerateChildProjectsResultDto.prototype, "details", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '전체 오류 메시지',
        example: [],
    }),
    __metadata("design:type", Array)
], GenerateChildProjectsResultDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '소요 시간 (초)',
        example: 5.2,
    }),
    __metadata("design:type", Number)
], GenerateChildProjectsResultDto.prototype, "duration", void 0);
class GenerateChildProjectDetailDto {
    parentProjectId;
    parentProjectName;
    childrenCreated;
    skipped;
    errors;
}
exports.GenerateChildProjectDetailDto = GenerateChildProjectDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최상위 프로젝트 ID',
        example: '98518c2c-d290-49ec-af5a-c2594a184296',
    }),
    __metadata("design:type", String)
], GenerateChildProjectDetailDto.prototype, "parentProjectId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최상위 프로젝트명',
        example: '대박인ㄴ데ㅛㅇ',
    }),
    __metadata("design:type", String)
], GenerateChildProjectDetailDto.prototype, "parentProjectName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 하위 프로젝트 수 (재귀 트리 전체)\n' +
            '- 예: depth=5 → 5개 생성 (1차 → 2차 → 3차 → 4차 → 5차)',
        example: 5,
    }),
    __metadata("design:type", Number)
], GenerateChildProjectDetailDto.prototype, "childrenCreated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '건너뛰었는지 여부 (이미 하위가 있는 경우)',
        example: false,
    }),
    __metadata("design:type", Boolean)
], GenerateChildProjectDetailDto.prototype, "skipped", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '오류 메시지 목록 (생성 중 발생한 에러)',
        example: [],
    }),
    __metadata("design:type", Array)
], GenerateChildProjectDetailDto.prototype, "errors", void 0);
//# sourceMappingURL=generate-child-projects.dto.js.map