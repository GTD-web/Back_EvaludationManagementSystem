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
exports.StepApprovalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const step_approval_context_1 = require("../../../context/step-approval-context");
const wbs_self_evaluation_business_service_1 = require("../../../business/wbs-self-evaluation/wbs-self-evaluation-business.service");
const downward_evaluation_business_service_1 = require("../../../business/downward-evaluation/downward-evaluation-business.service");
const step_approval_business_service_1 = require("../../../business/step-approval/step-approval-business.service");
const update_step_approval_dto_1 = require("../../common/dto/step-approval/update-step-approval.dto");
const update_secondary_step_approval_dto_1 = require("../../common/dto/step-approval/update-secondary-step-approval.dto");
const step_approval_api_decorators_1 = require("../../common/decorators/step-approval/step-approval-api.decorators");
const step_approval_enums_api_decorators_1 = require("../../common/decorators/step-approval/step-approval-enums-api.decorators");
const update_step_approval_dto_2 = require("../../common/dto/step-approval/update-step-approval.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
let StepApprovalController = class StepApprovalController {
    stepApprovalContextService;
    wbsSelfEvaluationBusinessService;
    downwardEvaluationBusinessService;
    stepApprovalBusinessService;
    constructor(stepApprovalContextService, wbsSelfEvaluationBusinessService, downwardEvaluationBusinessService, stepApprovalBusinessService) {
        this.stepApprovalContextService = stepApprovalContextService;
        this.wbsSelfEvaluationBusinessService = wbsSelfEvaluationBusinessService;
        this.downwardEvaluationBusinessService = downwardEvaluationBusinessService;
        this.stepApprovalBusinessService = stepApprovalBusinessService;
    }
    async getStepApprovalEnums() {
        return {
            steps: Object.values(update_step_approval_dto_2.StepTypeEnum),
            statuses: Object.values(update_step_approval_dto_2.StepApprovalStatusEnum),
        };
    }
    async updateCriteriaStepApproval(evaluationPeriodId, employeeId, dto, updatedBy) {
        console.log(`[CONTROLLER] 평가기준 설정 단계 승인 상태 변경 호출`);
        console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
        console.log(`[CONTROLLER] employeeId: ${employeeId}`);
        console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
        console.log(`[CONTROLLER] updatedBy: ${updatedBy}`);
        if (dto.status === update_step_approval_dto_2.StepApprovalStatusEnum.REVISION_REQUESTED) {
            if (!dto.revisionComment || dto.revisionComment.trim() === '') {
                throw new common_1.BadRequestException('재작성 요청 코멘트는 필수입니다.');
            }
            await this.stepApprovalBusinessService.평가기준설정_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId, employeeId, dto.revisionComment, updatedBy);
        }
        else {
            if (dto.status === update_step_approval_dto_2.StepApprovalStatusEnum.APPROVED) {
                await this.stepApprovalBusinessService.평가기준설정_승인_시_제출상태_변경(evaluationPeriodId, employeeId, updatedBy);
            }
            await this.stepApprovalBusinessService.평가기준설정_확인상태를_변경한다({
                evaluationPeriodId,
                employeeId,
                status: dto.status,
                revisionComment: dto.revisionComment,
                updatedBy,
            });
        }
    }
    async updateSelfStepApproval(evaluationPeriodId, employeeId, dto, updatedBy) {
        console.log(`[CONTROLLER] 자기평가 단계 승인 상태 변경 호출`);
        console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
        console.log(`[CONTROLLER] employeeId: ${employeeId}`);
        console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
        console.log(`[CONTROLLER] updatedBy: ${updatedBy}`);
        if (dto.status === update_step_approval_dto_2.StepApprovalStatusEnum.REVISION_REQUESTED) {
            if (!dto.revisionComment || dto.revisionComment.trim() === '') {
                throw new common_1.BadRequestException('재작성 요청 코멘트는 필수입니다.');
            }
            await this.wbsSelfEvaluationBusinessService.자기평가_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId, employeeId, dto.revisionComment, updatedBy);
        }
        else {
            if (dto.status === update_step_approval_dto_2.StepApprovalStatusEnum.APPROVED) {
                await this.stepApprovalBusinessService.자기평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, updatedBy);
                if (dto.approveSubsequentSteps) {
                    await this.stepApprovalBusinessService.자기평가_승인_시_하위평가들을_승인한다(evaluationPeriodId, employeeId, updatedBy);
                }
            }
            await this.stepApprovalBusinessService.자기평가_확인상태를_변경한다({
                evaluationPeriodId,
                employeeId,
                status: dto.status,
                revisionComment: dto.revisionComment,
                updatedBy,
            });
        }
    }
    async updatePrimaryStepApproval(evaluationPeriodId, employeeId, dto, updatedBy) {
        console.log(`[CONTROLLER] 1차 하향평가 단계 승인 상태 변경 호출`);
        console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
        console.log(`[CONTROLLER] employeeId: ${employeeId}`);
        console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
        console.log(`[CONTROLLER] updatedBy: ${updatedBy}`);
        if (dto.status === update_step_approval_dto_2.StepApprovalStatusEnum.REVISION_REQUESTED) {
            if (!dto.revisionComment || dto.revisionComment.trim() === '') {
                throw new common_1.BadRequestException('재작성 요청 코멘트는 필수입니다.');
            }
            await this.downwardEvaluationBusinessService.일차_하향평가_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId, employeeId, dto.revisionComment, updatedBy);
        }
        else {
            if (dto.status === update_step_approval_dto_2.StepApprovalStatusEnum.APPROVED) {
                await this.stepApprovalBusinessService.일차_하향평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, updatedBy);
                if (dto.approveSubsequentSteps) {
                    await this.stepApprovalBusinessService.일차하향평가_승인_시_상위평가를_승인한다(evaluationPeriodId, employeeId, updatedBy);
                }
            }
            await this.stepApprovalBusinessService.일차하향평가_확인상태를_변경한다({
                evaluationPeriodId,
                employeeId,
                status: dto.status,
                revisionComment: dto.revisionComment,
                updatedBy,
            });
        }
    }
    async updateSecondaryStepApproval(evaluationPeriodId, employeeId, evaluatorId, dto, updatedBy) {
        console.log(`[CONTROLLER] 2차 하향평가 단계 승인 상태 변경 호출`);
        console.log(`[CONTROLLER] evaluationPeriodId: ${evaluationPeriodId}`);
        console.log(`[CONTROLLER] employeeId: ${employeeId}`);
        console.log(`[CONTROLLER] evaluatorId: ${evaluatorId}`);
        console.log(`[CONTROLLER] dto:`, JSON.stringify(dto, null, 2));
        console.log(`[CONTROLLER] updatedBy: ${updatedBy}`);
        let approval;
        if (dto.status === update_step_approval_dto_2.StepApprovalStatusEnum.REVISION_REQUESTED) {
            if (!dto.revisionComment || dto.revisionComment.trim() === '') {
                throw new common_1.BadRequestException('재작성 요청 코멘트는 필수입니다.');
            }
            approval =
                await this.downwardEvaluationBusinessService.이차_하향평가_재작성요청_생성_및_제출상태_초기화(evaluationPeriodId, employeeId, evaluatorId, dto.revisionComment, updatedBy);
        }
        else {
            if (dto.status === update_step_approval_dto_2.StepApprovalStatusEnum.APPROVED) {
                await this.stepApprovalBusinessService.이차_하향평가_승인_시_제출상태_변경(evaluationPeriodId, employeeId, evaluatorId, updatedBy);
                if (dto.approveSubsequentSteps) {
                    await this.stepApprovalBusinessService.이차하향평가_승인_시_상위평가들을_승인한다(evaluationPeriodId, employeeId, updatedBy);
                }
            }
            approval =
                await this.stepApprovalBusinessService.이차하향평가_확인상태를_변경한다({
                    evaluationPeriodId,
                    employeeId,
                    evaluatorId,
                    status: dto.status,
                    revisionComment: dto.revisionComment,
                    updatedBy,
                });
        }
        const dto_result = approval.DTO로_변환한다();
        return {
            id: dto_result.id,
            evaluationPeriodEmployeeMappingId: dto_result.evaluationPeriodEmployeeMappingId,
            evaluatorId: dto_result.evaluatorId,
            status: dto_result.status,
            approvedBy: dto_result.approvedBy,
            approvedAt: dto_result.approvedAt,
            revisionRequestId: dto_result.revisionRequestId,
            createdAt: dto_result.createdAt,
            updatedAt: dto_result.updatedAt,
        };
    }
};
exports.StepApprovalController = StepApprovalController;
__decorate([
    (0, step_approval_enums_api_decorators_1.GetStepApprovalEnums)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StepApprovalController.prototype, "getStepApprovalEnums", null);
__decorate([
    (0, step_approval_api_decorators_1.UpdateCriteriaStepApproval)(),
    __param(0, (0, common_1.Param)('evaluationPeriodId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_step_approval_dto_1.UpdateStepApprovalDto, String]),
    __metadata("design:returntype", Promise)
], StepApprovalController.prototype, "updateCriteriaStepApproval", null);
__decorate([
    (0, step_approval_api_decorators_1.UpdateSelfStepApproval)(),
    __param(0, (0, common_1.Param)('evaluationPeriodId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_step_approval_dto_1.UpdateStepApprovalDto, String]),
    __metadata("design:returntype", Promise)
], StepApprovalController.prototype, "updateSelfStepApproval", null);
__decorate([
    (0, step_approval_api_decorators_1.UpdatePrimaryStepApproval)(),
    __param(0, (0, common_1.Param)('evaluationPeriodId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_step_approval_dto_1.UpdateStepApprovalDto, String]),
    __metadata("design:returntype", Promise)
], StepApprovalController.prototype, "updatePrimaryStepApproval", null);
__decorate([
    (0, step_approval_api_decorators_1.UpdateSecondaryStepApproval)(),
    __param(0, (0, common_1.Param)('evaluationPeriodId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('employeeId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('evaluatorId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, update_secondary_step_approval_dto_1.UpdateSecondaryStepApprovalDto, String]),
    __metadata("design:returntype", Promise)
], StepApprovalController.prototype, "updateSecondaryStepApproval", null);
exports.StepApprovalController = StepApprovalController = __decorate([
    (0, swagger_1.ApiTags)('A-0-3. 관리자 - 단계 승인'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/step-approvals'),
    __metadata("design:paramtypes", [step_approval_context_1.StepApprovalContextService,
        wbs_self_evaluation_business_service_1.WbsSelfEvaluationBusinessService,
        downward_evaluation_business_service_1.DownwardEvaluationBusinessService,
        step_approval_business_service_1.StepApprovalBusinessService])
], StepApprovalController);
//# sourceMappingURL=step-approval.controller.js.map