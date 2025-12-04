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
exports.EvaluatorPeerEvaluationManagementController = void 0;
const peer_evaluation_business_service_1 = require("../../../business/peer-evaluation/peer-evaluation-business.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const parse_uuid_decorator_1 = require("../../common/decorators/parse-uuid.decorator");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const peer_evaluation_api_decorators_1 = require("../../common/decorators/performance-evaluation/peer-evaluation-api.decorators");
const peer_evaluation_dto_1 = require("../../common/dto/performance-evaluation/peer-evaluation.dto");
let EvaluatorPeerEvaluationManagementController = class EvaluatorPeerEvaluationManagementController {
    peerEvaluationBusinessService;
    constructor(peerEvaluationBusinessService) {
        this.peerEvaluationBusinessService = peerEvaluationBusinessService;
    }
    async getPeerEvaluations(filter) {
        return await this.peerEvaluationBusinessService.동료평가_목록을_조회한다({
            evaluatorId: filter.evaluatorId,
            evaluateeId: filter.evaluateeId,
            periodId: filter.periodId,
            status: filter.status,
            page: filter.page || 1,
            limit: filter.limit || 10,
        });
    }
    async getEvaluatorAssignedEvaluatees(evaluatorId, query) {
        return await this.peerEvaluationBusinessService.평가자에게_할당된_피평가자_목록을_조회한다({
            evaluatorId,
            periodId: query.periodId,
            includeCompleted: query.includeCompleted,
        });
    }
    async getPeerEvaluationDetail(id) {
        return await this.peerEvaluationBusinessService.동료평가_상세정보를_조회한다({
            evaluationId: id,
        });
    }
    async upsertPeerEvaluationAnswers(dto, user) {
        const answeredBy = user.id;
        const result = await this.peerEvaluationBusinessService.동료평가_답변을_저장한다({
            peerEvaluationId: dto.peerEvaluationId,
            answers: dto.answers.map((a) => ({
                questionId: a.questionId,
                answer: a.answer,
                score: a.score,
            })),
            answeredBy,
        });
        return {
            savedCount: result.savedCount,
            message: '답변이 성공적으로 저장되었습니다.',
        };
    }
    async submitPeerEvaluation(id, user) {
        const submittedBy = user.id;
        await this.peerEvaluationBusinessService.동료평가를_제출한다({
            evaluationId: id,
            submittedBy,
        });
    }
};
exports.EvaluatorPeerEvaluationManagementController = EvaluatorPeerEvaluationManagementController;
__decorate([
    (0, peer_evaluation_api_decorators_1.GetPeerEvaluations)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.PeerEvaluationFilterDto]),
    __metadata("design:returntype", Promise)
], EvaluatorPeerEvaluationManagementController.prototype, "getPeerEvaluations", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetEvaluatorAssignedEvaluatees)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('evaluatorId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, peer_evaluation_dto_1.GetEvaluatorAssignedEvaluateesQueryDto]),
    __metadata("design:returntype", Promise)
], EvaluatorPeerEvaluationManagementController.prototype, "getEvaluatorAssignedEvaluatees", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.GetPeerEvaluationDetail)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluatorPeerEvaluationManagementController.prototype, "getPeerEvaluationDetail", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.UpsertPeerEvaluationAnswers)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [peer_evaluation_dto_1.UpsertPeerEvaluationAnswersDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorPeerEvaluationManagementController.prototype, "upsertPeerEvaluationAnswers", null);
__decorate([
    (0, peer_evaluation_api_decorators_1.SubmitPeerEvaluation)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluatorPeerEvaluationManagementController.prototype, "submitPeerEvaluation", null);
exports.EvaluatorPeerEvaluationManagementController = EvaluatorPeerEvaluationManagementController = __decorate([
    (0, swagger_1.ApiTags)('C-5. 평가자 - 성과평가 - 동료평가'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('evaluator/performance-evaluation/peer-evaluations'),
    __metadata("design:paramtypes", [peer_evaluation_business_service_1.PeerEvaluationBusinessService])
], EvaluatorPeerEvaluationManagementController);
//# sourceMappingURL=evaluator-peer-evaluation-management.controller.js.map