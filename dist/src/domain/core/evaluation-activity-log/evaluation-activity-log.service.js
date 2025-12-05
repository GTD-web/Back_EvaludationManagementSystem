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
var EvaluationActivityLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationActivityLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_activity_log_entity_1 = require("./evaluation-activity-log.entity");
let EvaluationActivityLogService = EvaluationActivityLogService_1 = class EvaluationActivityLogService {
    activityLogRepository;
    logger = new common_1.Logger(EvaluationActivityLogService_1.name);
    constructor(activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }
    async 생성한다(data) {
        const activityLog = new evaluation_activity_log_entity_1.EvaluationActivityLog(data);
        const saved = await this.activityLogRepository.save(activityLog);
        return saved.DTO로_변환한다();
    }
    async 평가기간_피평가자_활동내역을_조회한다(params) {
        this.logger.log('평가기간 피평가자 활동 내역 조회 시작', {
            periodId: params.periodId,
            employeeId: params.employeeId,
        });
        const queryBuilder = this.activityLogRepository
            .createQueryBuilder('log')
            .where('log.periodId = :periodId', { periodId: params.periodId })
            .andWhere('log.employeeId = :employeeId', {
            employeeId: params.employeeId,
        })
            .andWhere('log.deletedAt IS NULL');
        if (params.activityType) {
            queryBuilder.andWhere('log.activityType = :activityType', {
                activityType: params.activityType,
            });
        }
        if (params.startDate) {
            queryBuilder.andWhere('log.activityDate >= :startDate', {
                startDate: params.startDate,
            });
        }
        if (params.endDate) {
            queryBuilder.andWhere('log.activityDate <= :endDate', {
                endDate: params.endDate,
            });
        }
        queryBuilder
            .orderBy('log.activityDate', 'DESC')
            .addOrderBy('log.createdAt', 'DESC');
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;
        const [items, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        this.logger.log('평가기간 피평가자 활동 내역 조회 완료', {
            total,
            page,
            limit,
        });
        return {
            items: items.map((item) => item.DTO로_변환한다()),
            total,
            page,
            limit,
        };
    }
};
exports.EvaluationActivityLogService = EvaluationActivityLogService;
exports.EvaluationActivityLogService = EvaluationActivityLogService = EvaluationActivityLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_activity_log_entity_1.EvaluationActivityLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EvaluationActivityLogService);
//# sourceMappingURL=evaluation-activity-log.service.js.map