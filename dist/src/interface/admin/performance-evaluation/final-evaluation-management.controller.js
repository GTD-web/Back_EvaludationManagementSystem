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
exports.FinalEvaluationManagementController = void 0;
const performance_evaluation_service_1 = require("../../../context/performance-evaluation-context/performance-evaluation.service");
const final_evaluation_business_service_1 = require("../../../business/final-evaluation/final-evaluation-business.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const parse_uuid_decorator_1 = require("../../common/decorators/parse-uuid.decorator");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const final_evaluation_1 = require("../../../context/performance-evaluation-context/handlers/final-evaluation");
const final_evaluation_api_decorators_1 = require("../../common/decorators/performance-evaluation/final-evaluation-api.decorators");
const final_evaluation_dto_1 = require("../../common/dto/performance-evaluation/final-evaluation.dto");
let FinalEvaluationManagementController = class FinalEvaluationManagementController {
    performanceEvaluationService;
    finalEvaluationBusinessService;
    constructor(performanceEvaluationService, finalEvaluationBusinessService) {
        this.performanceEvaluationService = performanceEvaluationService;
        this.finalEvaluationBusinessService = finalEvaluationBusinessService;
    }
    async upsertFinalEvaluation(employeeId, periodId, dto, user) {
        const actionBy = user.id;
        const evaluationId = await this.finalEvaluationBusinessService.최종평가를_저장한다(employeeId, periodId, dto.evaluationGrade, dto.jobGrade, dto.jobDetailedGrade, dto.finalComments, actionBy);
        return {
            id: evaluationId,
            message: '최종평가가 성공적으로 저장되었습니다.',
        };
    }
    async confirmFinalEvaluation(id, user) {
        await this.performanceEvaluationService.최종평가를_확정한다(id, user.id);
        return {
            message: '최종평가가 성공적으로 확정되었습니다.',
        };
    }
    async cancelConfirmationFinalEvaluation(id, user) {
        await this.performanceEvaluationService.최종평가_확정을_취소한다(id, user.id);
        return {
            message: '최종평가 확정이 성공적으로 취소되었습니다.',
        };
    }
    async getFinalEvaluation(id) {
        const query = new final_evaluation_1.GetFinalEvaluationQuery(id);
        return await this.performanceEvaluationService.최종평가를_조회한다(query);
    }
    async getFinalEvaluationList(filter) {
        const query = new final_evaluation_1.GetFinalEvaluationListQuery(filter.employeeId, filter.periodId, filter.evaluationGrade, filter.jobGrade, filter.jobDetailedGrade, filter.confirmedOnly, filter.page || 1, filter.limit || 10);
        return await this.performanceEvaluationService.최종평가_목록을_조회한다(query);
    }
    async getFinalEvaluationByEmployeePeriod(employeeId, periodId) {
        const query = new final_evaluation_1.GetFinalEvaluationByEmployeePeriodQuery(employeeId, periodId);
        return await this.performanceEvaluationService.직원_평가기간별_최종평가를_조회한다(query);
    }
};
exports.FinalEvaluationManagementController = FinalEvaluationManagementController;
__decorate([
    (0, final_evaluation_api_decorators_1.UpsertFinalEvaluation)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('periodId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, final_evaluation_dto_1.UpsertFinalEvaluationBodyDto, Object]),
    __metadata("design:returntype", Promise)
], FinalEvaluationManagementController.prototype, "upsertFinalEvaluation", null);
__decorate([
    (0, final_evaluation_api_decorators_1.ConfirmFinalEvaluation)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinalEvaluationManagementController.prototype, "confirmFinalEvaluation", null);
__decorate([
    (0, final_evaluation_api_decorators_1.CancelConfirmationFinalEvaluation)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinalEvaluationManagementController.prototype, "cancelConfirmationFinalEvaluation", null);
__decorate([
    (0, final_evaluation_api_decorators_1.GetFinalEvaluation)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinalEvaluationManagementController.prototype, "getFinalEvaluation", null);
__decorate([
    (0, final_evaluation_api_decorators_1.GetFinalEvaluationList)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [final_evaluation_dto_1.FinalEvaluationFilterDto]),
    __metadata("design:returntype", Promise)
], FinalEvaluationManagementController.prototype, "getFinalEvaluationList", null);
__decorate([
    (0, final_evaluation_api_decorators_1.GetFinalEvaluationByEmployeePeriod)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('periodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FinalEvaluationManagementController.prototype, "getFinalEvaluationByEmployeePeriod", null);
exports.FinalEvaluationManagementController = FinalEvaluationManagementController = __decorate([
    (0, swagger_1.ApiTags)('C-6. 관리자 - 성과평가 - 최종평가'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/performance-evaluation/final-evaluations'),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        final_evaluation_business_service_1.FinalEvaluationBusinessService])
], FinalEvaluationManagementController);
//# sourceMappingURL=final-evaluation-management.controller.js.map