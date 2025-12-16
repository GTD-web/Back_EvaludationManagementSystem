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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const backup_scheduler_service_1 = require("../../context/backup-context/backup-scheduler.service");
const decorators_1 = require("../common/decorators");
let BackupController = class BackupController {
    backupSchedulerService;
    constructor(backupSchedulerService) {
        this.backupSchedulerService = backupSchedulerService;
    }
    백업_상태_조회() {
        return this.backupSchedulerService.백업_상태를_조회한다();
    }
    async 수동_백업_실행(type = 'daily') {
        const message = await this.backupSchedulerService.수동_백업을_실행한다(type);
        return { message };
    }
};
exports.BackupController = BackupController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({
        summary: '백업 상태 조회',
        description: '각 백업 타입별 파일 개수를 조회합니다.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '백업 상태 조회 성공',
        schema: {
            example: {
                hourly: 6,
                daily: 30,
                weekly: 12,
                monthly: 12,
                yearly: 8,
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '인증 실패',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 (admin 역할 필요)',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "\uBC31\uC5C5_\uC0C1\uD0DC_\uC870\uD68C", null);
__decorate([
    (0, common_1.Post)('manual'),
    (0, swagger_1.ApiOperation)({
        summary: '수동 백업 실행',
        description: '지정된 타입의 백업을 즉시 실행합니다.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: false,
        enum: ['hourly', 'daily', 'weekly', 'monthly'],
        description: '백업 타입 (기본값: daily)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '백업 실행 성공',
        schema: {
            example: {
                message: 'daily 백업이 완료되었습니다.',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '인증 실패',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '권한 없음 (admin 역할 필요)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Vercel 환경에서는 사용 불가',
        schema: {
            example: {
                statusCode: 500,
                message: 'Vercel 환경에서는 백업 기능을 사용할 수 없습니다. EC2 환경을 사용해주세요.',
            },
        },
    }),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "\uC218\uB3D9_\uBC31\uC5C5_\uC2E4\uD589", null);
exports.BackupController = BackupController = __decorate([
    (0, swagger_1.ApiTags)('백업 관리'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/backups'),
    __metadata("design:paramtypes", [backup_scheduler_service_1.BackupSchedulerService])
], BackupController);
//# sourceMappingURL=backup.controller.js.map