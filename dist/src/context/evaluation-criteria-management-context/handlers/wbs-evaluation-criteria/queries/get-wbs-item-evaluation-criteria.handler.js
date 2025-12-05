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
var GetWbsItemEvaluationCriteriaHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWbsItemEvaluationCriteriaHandler = exports.GetWbsItemEvaluationCriteriaQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_evaluation_criteria_entity_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
class GetWbsItemEvaluationCriteriaQuery {
    wbsItemId;
    constructor(wbsItemId) {
        this.wbsItemId = wbsItemId;
    }
}
exports.GetWbsItemEvaluationCriteriaQuery = GetWbsItemEvaluationCriteriaQuery;
let GetWbsItemEvaluationCriteriaHandler = GetWbsItemEvaluationCriteriaHandler_1 = class GetWbsItemEvaluationCriteriaHandler {
    wbsEvaluationCriteriaRepository;
    logger = new common_1.Logger(GetWbsItemEvaluationCriteriaHandler_1.name);
    constructor(wbsEvaluationCriteriaRepository) {
        this.wbsEvaluationCriteriaRepository = wbsEvaluationCriteriaRepository;
    }
    async execute(query) {
        const { wbsItemId } = query;
        try {
            const criteriaList = await this.wbsEvaluationCriteriaRepository.find({
                where: { wbsItemId },
                order: { createdAt: 'DESC' },
            });
            const result = criteriaList.map((criteria) => criteria.DTO로_변환한다());
            return result;
        }
        catch (error) {
            this.logger.error(`WBS 항목별 평가기준 조회 실패 - WBS 항목 ID: ${wbsItemId}`, error.stack);
            throw error;
        }
    }
};
exports.GetWbsItemEvaluationCriteriaHandler = GetWbsItemEvaluationCriteriaHandler;
exports.GetWbsItemEvaluationCriteriaHandler = GetWbsItemEvaluationCriteriaHandler = GetWbsItemEvaluationCriteriaHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetWbsItemEvaluationCriteriaQuery),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetWbsItemEvaluationCriteriaHandler);
//# sourceMappingURL=get-wbs-item-evaluation-criteria.handler.js.map