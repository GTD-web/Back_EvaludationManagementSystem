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
var GetDownwardEvaluationListHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDownwardEvaluationListHandler = exports.GetDownwardEvaluationListQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downward_evaluation_entity_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.entity");
class GetDownwardEvaluationListQuery {
    evaluatorId;
    evaluateeId;
    periodId;
    wbsId;
    evaluationType;
    isCompleted;
    page;
    limit;
    constructor(evaluatorId, evaluateeId, periodId, wbsId, evaluationType, isCompleted, page = 1, limit = 10) {
        this.evaluatorId = evaluatorId;
        this.evaluateeId = evaluateeId;
        this.periodId = periodId;
        this.wbsId = wbsId;
        this.evaluationType = evaluationType;
        this.isCompleted = isCompleted;
        this.page = page;
        this.limit = limit;
    }
}
exports.GetDownwardEvaluationListQuery = GetDownwardEvaluationListQuery;
let GetDownwardEvaluationListHandler = GetDownwardEvaluationListHandler_1 = class GetDownwardEvaluationListHandler {
    downwardEvaluationRepository;
    logger = new common_1.Logger(GetDownwardEvaluationListHandler_1.name);
    constructor(downwardEvaluationRepository) {
        this.downwardEvaluationRepository = downwardEvaluationRepository;
    }
    async execute(query) {
        const { evaluatorId, evaluateeId, periodId, wbsId, evaluationType, isCompleted, page, limit, } = query;
        const queryBuilder = this.downwardEvaluationRepository
            .createQueryBuilder('evaluation')
            .where('evaluation.deletedAt IS NULL');
        if (evaluatorId) {
            queryBuilder.andWhere('evaluation.evaluatorId = :evaluatorId', {
                evaluatorId,
            });
        }
        if (evaluateeId) {
            queryBuilder.andWhere('evaluation.employeeId = :evaluateeId', {
                evaluateeId,
            });
        }
        if (periodId) {
            queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
        }
        if (wbsId) {
            queryBuilder.andWhere('evaluation.wbsId = :wbsId', { wbsId });
        }
        if (evaluationType) {
            queryBuilder.andWhere('evaluation.evaluationType = :evaluationType', {
                evaluationType: evaluationType,
            });
        }
        if (isCompleted !== undefined) {
            queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
                isCompleted,
            });
        }
        queryBuilder.orderBy('evaluation.createdAt', 'DESC');
        if (page && limit) {
            const offset = (page - 1) * limit;
            queryBuilder.skip(offset).take(limit);
        }
        const evaluations = await queryBuilder.getMany();
        const result = {
            evaluations: evaluations.map((evaluation) => evaluation.DTO로_변환한다()),
            total: evaluations.length,
            page,
            limit,
        };
        return result;
    }
};
exports.GetDownwardEvaluationListHandler = GetDownwardEvaluationListHandler;
exports.GetDownwardEvaluationListHandler = GetDownwardEvaluationListHandler = GetDownwardEvaluationListHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetDownwardEvaluationListQuery),
    __param(0, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetDownwardEvaluationListHandler);
//# sourceMappingURL=get-downward-evaluation-list.handler.js.map