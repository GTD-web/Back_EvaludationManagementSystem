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
exports.GetAuditLogStatsHandler = exports.GetAuditLogStatsQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("../../../../domain/common/audit-log/audit-log.entity");
class GetAuditLogStatsQuery {
    startDate;
    endDate;
    interval;
    constructor(startDate, endDate, interval = 60) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.interval = interval;
    }
}
exports.GetAuditLogStatsQuery = GetAuditLogStatsQuery;
let GetAuditLogStatsHandler = class GetAuditLogStatsHandler {
    auditLogRepository;
    constructor(auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    async execute(query) {
        const { startDate, endDate, interval } = query;
        const end = endDate || new Date();
        const start = startDate || new Date(end.getTime() - 24 * 60 * 60 * 1000);
        const timeGroupExpression = `date_trunc('hour', auditLog.requestStartTime) + 
         (FLOOR(EXTRACT(MINUTE FROM auditLog.requestStartTime) / :interval) * :interval || ' minutes')::INTERVAL`;
        const queryBuilder = this.auditLogRepository
            .createQueryBuilder('auditLog')
            .select(timeGroupExpression, 'timeGroup')
            .addSelect(`SUM(CASE WHEN auditLog.responseStatusCode >= 200 AND auditLog.responseStatusCode < 400 THEN 1 ELSE 0 END)`, 'success')
            .addSelect(`SUM(CASE WHEN auditLog.responseStatusCode >= 400 THEN 1 ELSE 0 END)`, 'errors')
            .addSelect('COUNT(*)', 'total')
            .where('auditLog.requestStartTime >= :start', { start })
            .andWhere('auditLog.requestStartTime <= :end', { end })
            .setParameter('interval', interval)
            .groupBy(timeGroupExpression)
            .orderBy('"timeGroup"', 'ASC');
        const rawResults = await queryBuilder.getRawMany();
        const stats = this.시간대별_통계를_생성한다(start, end, interval, rawResults);
        return { stats };
    }
    시간대별_통계를_생성한다(startDate, endDate, interval, rawResults) {
        const stats = [];
        const intervalMs = interval * 60 * 1000;
        const startTime = new Date(Math.floor(startDate.getTime() / intervalMs) * intervalMs);
        let currentTime = new Date(startTime);
        while (currentTime <= endDate) {
            const timestamp = currentTime.getTime();
            const matchingResult = rawResults.find((result) => {
                const resultTime = new Date(result.timeGroup).getTime();
                return Math.abs(resultTime - timestamp) < intervalMs;
            });
            stats.push({
                time: this.시간을_HHmm_형식으로_변환한다(currentTime),
                timestamp,
                success: matchingResult ? parseInt(matchingResult.success, 10) : 0,
                errors: matchingResult ? parseInt(matchingResult.errors, 10) : 0,
                total: matchingResult ? parseInt(matchingResult.total, 10) : 0,
            });
            currentTime = new Date(currentTime.getTime() + intervalMs);
        }
        return stats;
    }
    시간을_HHmm_형식으로_변환한다(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
};
exports.GetAuditLogStatsHandler = GetAuditLogStatsHandler;
exports.GetAuditLogStatsHandler = GetAuditLogStatsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetAuditLogStatsQuery),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetAuditLogStatsHandler);
//# sourceMappingURL=get-audit-log-stats.handler.js.map