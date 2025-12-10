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
var DownwardEvaluationManagementController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownwardEvaluationManagementController = void 0;
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const downward_evaluation_1 = require("../../../context/performance-evaluation-context/handlers/downward-evaluation");
const performance_evaluation_service_1 = require("../../../context/performance-evaluation-context/performance-evaluation.service");
const downward_evaluation_business_service_1 = require("../../../business/downward-evaluation/downward-evaluation-business.service");
const downward_evaluation_api_decorators_1 = require("../../common/decorators/performance-evaluation/downward-evaluation-api.decorators");
const downward_evaluation_dto_1 = require("../../common/dto/performance-evaluation/downward-evaluation.dto");
const bulk_submit_downward_evaluation_query_dto_1 = require("../../common/dto/performance-evaluation/bulk-submit-downward-evaluation-query.dto");
let DownwardEvaluationManagementController = DownwardEvaluationManagementController_1 = class DownwardEvaluationManagementController {
    performanceEvaluationService;
    downwardEvaluationBusinessService;
    logger = new common_1.Logger(DownwardEvaluationManagementController_1.name);
    constructor(performanceEvaluationService, downwardEvaluationBusinessService) {
        this.performanceEvaluationService = performanceEvaluationService;
        this.downwardEvaluationBusinessService = downwardEvaluationBusinessService;
    }
    async upsertPrimaryDownwardEvaluation(evaluateeId, periodId, wbsId, dto, user) {
        const actionBy = user.id;
        const evaluatorId = dto.evaluatorId;
        const evaluationId = await this.downwardEvaluationBusinessService.일차_하향평가를_저장한다({
            evaluatorId,
            evaluateeId,
            periodId,
            wbsId,
            selfEvaluationId: dto.selfEvaluationId,
            downwardEvaluationContent: dto.downwardEvaluationContent,
            downwardEvaluationScore: dto.downwardEvaluationScore,
            actionBy,
        });
        return {
            id: evaluationId,
            evaluatorId,
            message: '1차 하향평가가 성공적으로 저장되었습니다.',
        };
    }
    async upsertSecondaryDownwardEvaluation(evaluateeId, periodId, wbsId, dto, user) {
        const actionBy = user.id;
        const evaluatorId = dto.evaluatorId;
        const evaluationId = await this.downwardEvaluationBusinessService.이차_하향평가를_저장한다({
            evaluatorId,
            evaluateeId,
            periodId,
            wbsId,
            selfEvaluationId: dto.selfEvaluationId,
            downwardEvaluationContent: dto.downwardEvaluationContent,
            downwardEvaluationScore: dto.downwardEvaluationScore,
            actionBy,
        });
        return {
            id: evaluationId,
            evaluatorId,
            message: '2차 하향평가가 성공적으로 저장되었습니다.',
        };
    }
    async submitPrimaryDownwardEvaluation(evaluateeId, periodId, wbsId, queryDto, submitDto, user) {
        const evaluatorId = submitDto.evaluatorId;
        const submittedBy = user.id;
        const approveAllBelow = queryDto.approveAllBelow || false;
        await this.downwardEvaluationBusinessService.일차_하향평가를_제출하고_재작성요청을_완료한다(evaluateeId, periodId, wbsId, evaluatorId, submittedBy, approveAllBelow);
    }
    async submitSecondaryDownwardEvaluation(evaluateeId, periodId, wbsId, queryDto, submitDto, user) {
        const evaluatorId = submitDto.evaluatorId;
        const submittedBy = user.id;
        const approveAllBelow = queryDto.approveAllBelow || false;
        await this.downwardEvaluationBusinessService.이차_하향평가를_제출하고_재작성요청을_완료한다(evaluateeId, periodId, wbsId, evaluatorId, submittedBy, approveAllBelow);
    }
    async resetPrimaryDownwardEvaluation(evaluateeId, periodId, wbsId, submitDto, user) {
        const evaluatorId = submitDto.evaluatorId;
        const resetBy = user.id;
        await this.performanceEvaluationService.일차_하향평가를_초기화한다(evaluateeId, periodId, wbsId, evaluatorId, resetBy);
        return {
            message: '1차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
        };
    }
    async resetSecondaryDownwardEvaluation(evaluateeId, periodId, wbsId, submitDto, user) {
        const evaluatorId = submitDto.evaluatorId;
        const resetBy = user.id;
        this.logger.log('2차 하향평가 미제출 상태 변경 API 호출', {
            evaluateeId,
            periodId,
            wbsId,
            evaluatorId,
            resetBy,
            userId: user.id,
        });
        try {
            await this.performanceEvaluationService.이차_하향평가를_초기화한다(evaluateeId, periodId, wbsId, evaluatorId, resetBy);
            this.logger.log('2차 하향평가 미제출 상태 변경 성공', {
                evaluateeId,
                periodId,
                wbsId,
                evaluatorId,
            });
            return {
                message: '2차 하향평가가 성공적으로 미제출 상태로 변경되었습니다.',
            };
        }
        catch (error) {
            this.logger.error('2차 하향평가 미제출 상태 변경 실패', error.stack, {
                evaluateeId,
                periodId,
                wbsId,
                evaluatorId,
                resetBy,
                errorName: error.name,
                errorMessage: error.message,
            });
            throw error;
        }
    }
    async submitDownwardEvaluation(id, user) {
        const submittedBy = user.id;
        await this.performanceEvaluationService.하향평가를_제출한다(id, submittedBy);
    }
    async bulkSubmitDownwardEvaluations(evaluateeId, periodId, queryDto, submitDto, user) {
        const evaluatorId = submitDto.evaluatorId;
        const submittedBy = user.id;
        return await this.downwardEvaluationBusinessService.피평가자의_모든_하향평가를_일괄_제출한다(evaluatorId, evaluateeId, periodId, queryDto.evaluationType, submittedBy);
    }
    async bulkResetDownwardEvaluations(evaluateeId, periodId, queryDto, submitDto, user) {
        const evaluatorId = submitDto.evaluatorId;
        const resetBy = user.id;
        return await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_초기화한다(evaluatorId, evaluateeId, periodId, queryDto.evaluationType, resetBy);
    }
    async getEvaluatorDownwardEvaluations(evaluatorId, filter) {
        const query = new downward_evaluation_1.GetDownwardEvaluationListQuery(evaluatorId, filter.evaluateeId, filter.periodId, filter.wbsId, filter.evaluationType, filter.isCompleted, filter.page || 1, filter.limit || 10);
        return await this.performanceEvaluationService.하향평가_목록을_조회한다(query);
    }
    async getDownwardEvaluationDetail(id) {
        const query = new downward_evaluation_1.GetDownwardEvaluationDetailQuery(id);
        return await this.performanceEvaluationService.하향평가_상세정보를_조회한다(query);
    }
};
exports.DownwardEvaluationManagementController = DownwardEvaluationManagementController;
__decorate([
    (0, downward_evaluation_api_decorators_1.UpsertPrimaryDownwardEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('wbsId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, downward_evaluation_dto_1.CreatePrimaryDownwardEvaluationBodyDto, Object]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "upsertPrimaryDownwardEvaluation", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.UpsertSecondaryDownwardEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('wbsId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, downward_evaluation_dto_1.CreateSecondaryDownwardEvaluationBodyDto, Object]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "upsertSecondaryDownwardEvaluation", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.SubmitPrimaryDownwardEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('wbsId')),
    __param(3, (0, common_1.Query)()),
    __param(4, (0, common_1.Body)()),
    __param(5, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, downward_evaluation_dto_1.SubmitDownwardEvaluationQueryDto,
        downward_evaluation_dto_1.SubmitDownwardEvaluationDto, Object]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "submitPrimaryDownwardEvaluation", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.SubmitSecondaryDownwardEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('wbsId')),
    __param(3, (0, common_1.Query)()),
    __param(4, (0, common_1.Body)()),
    __param(5, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, downward_evaluation_dto_1.SubmitDownwardEvaluationQueryDto,
        downward_evaluation_dto_1.SubmitDownwardEvaluationDto, Object]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "submitSecondaryDownwardEvaluation", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.ResetPrimaryDownwardEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('wbsId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, downward_evaluation_dto_1.SubmitDownwardEvaluationDto, Object]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "resetPrimaryDownwardEvaluation", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.ResetSecondaryDownwardEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, decorators_1.ParseUUID)('wbsId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, downward_evaluation_dto_1.SubmitDownwardEvaluationDto, Object]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "resetSecondaryDownwardEvaluation", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.SubmitDownwardEvaluation)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "submitDownwardEvaluation", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.BulkSubmitDownwardEvaluations)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, bulk_submit_downward_evaluation_query_dto_1.BulkSubmitDownwardEvaluationQueryDto,
        downward_evaluation_dto_1.SubmitDownwardEvaluationDto, Object]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "bulkSubmitDownwardEvaluations", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.BulkResetDownwardEvaluations)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluateeId')),
    __param(1, (0, decorators_1.ParseUUID)('periodId')),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, bulk_submit_downward_evaluation_query_dto_1.BulkSubmitDownwardEvaluationQueryDto,
        downward_evaluation_dto_1.SubmitDownwardEvaluationDto, Object]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "bulkResetDownwardEvaluations", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.GetEvaluatorDownwardEvaluations)(),
    __param(0, (0, decorators_1.ParseUUID)('evaluatorId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, downward_evaluation_dto_1.DownwardEvaluationFilterDto]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "getEvaluatorDownwardEvaluations", null);
__decorate([
    (0, downward_evaluation_api_decorators_1.GetDownwardEvaluationDetail)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DownwardEvaluationManagementController.prototype, "getDownwardEvaluationDetail", null);
exports.DownwardEvaluationManagementController = DownwardEvaluationManagementController = DownwardEvaluationManagementController_1 = __decorate([
    (0, swagger_1.ApiTags)('C-3. 관리자 - 성과평가 - 하향평가'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/performance-evaluation/downward-evaluations'),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        downward_evaluation_business_service_1.DownwardEvaluationBusinessService])
], DownwardEvaluationManagementController);
//# sourceMappingURL=downward-evaluation-management.controller.js.map