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
var EvaluationPeriodManagementController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodManagementController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const evaluation_period_management_service_1 = require("../../../context/evaluation-period-management-context/evaluation-period-management.service");
const evaluation_period_business_service_1 = require("../../../business/evaluation-period/evaluation-period-business.service");
const parse_uuid_decorator_1 = require("../../common/decorators/parse-uuid.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const evaluation_period_api_decorators_1 = require("../../common/decorators/evaluation-period/evaluation-period-api.decorators");
const evaluation_management_dto_1 = require("../../common/dto/evaluation-period/evaluation-management.dto");
const default_grade_ranges_constant_1 = require("../../common/constants/default-grade-ranges.constant");
let EvaluationPeriodManagementController = EvaluationPeriodManagementController_1 = class EvaluationPeriodManagementController {
    evaluationPeriodBusinessService;
    evaluationPeriodManagementService;
    logger = new common_1.Logger(EvaluationPeriodManagementController_1.name);
    constructor(evaluationPeriodBusinessService, evaluationPeriodManagementService) {
        this.evaluationPeriodBusinessService = evaluationPeriodBusinessService;
        this.evaluationPeriodManagementService = evaluationPeriodManagementService;
    }
    async getDefaultGradeRanges() {
        return (0, default_grade_ranges_constant_1.getDefaultGradeRanges)();
    }
    async updateDefaultGradeRanges(updateData) {
        const gradeRanges = updateData.gradeRanges.map((range) => ({
            grade: range.grade,
            minRange: range.minRange,
            maxRange: range.maxRange,
        }));
        const grades = gradeRanges.map((r) => r.grade);
        const uniqueGrades = new Set(grades);
        if (grades.length !== uniqueGrades.size) {
            throw new common_1.BadRequestException('중복된 등급이 있습니다.');
        }
        for (const range of gradeRanges) {
            if (range.minRange < 0 || range.minRange > 1000) {
                throw new common_1.BadRequestException('최소 범위는 0-1000 사이여야 합니다.');
            }
            if (range.maxRange < 0 || range.maxRange > 1000) {
                throw new common_1.BadRequestException('최대 범위는 0-1000 사이여야 합니다.');
            }
            if (range.minRange >= range.maxRange) {
                throw new common_1.BadRequestException('최소 범위는 최대 범위보다 작아야 합니다.');
            }
        }
        const sortedRanges = [...gradeRanges].sort((a, b) => a.minRange - b.minRange);
        for (let i = 0; i < sortedRanges.length - 1; i++) {
            const current = sortedRanges[i];
            const next = sortedRanges[i + 1];
            if (current.maxRange > next.minRange) {
                throw new common_1.BadRequestException('등급 구간이 겹칩니다.');
            }
        }
        (0, default_grade_ranges_constant_1.setDefaultGradeRanges)(gradeRanges);
        return (0, default_grade_ranges_constant_1.getDefaultGradeRanges)();
    }
    async getActiveEvaluationPeriods() {
        return await this.evaluationPeriodManagementService.활성평가기간_조회한다();
    }
    async getEvaluationPeriods(query) {
        const { page = 1, limit = 10 } = query;
        return await this.evaluationPeriodManagementService.평가기간목록_조회한다(page, limit);
    }
    async getEvaluationPeriodDetail(periodId) {
        return await this.evaluationPeriodManagementService.평가기간상세_조회한다(periodId);
    }
    async createEvaluationPeriod(createData, user) {
        const createdBy = user.id;
        const contextDto = {
            name: createData.name,
            startDate: createData.startDate,
            peerEvaluationDeadline: createData.peerEvaluationDeadline,
            description: createData.description,
            maxSelfEvaluationRate: createData.maxSelfEvaluationRate || 120,
            gradeRanges: createData.gradeRanges?.map((range) => ({
                grade: range.grade,
                minRange: range.minRange,
                maxRange: range.maxRange,
            })) || [],
        };
        const result = await this.evaluationPeriodBusinessService.평가기간을_생성한다(contextDto, createdBy);
        return result.evaluationPeriod;
    }
    async startEvaluationPeriod(periodId, user) {
        const startedBy = user.id;
        const result = await this.evaluationPeriodManagementService.평가기간_시작한다(periodId, startedBy);
        return { success: Boolean(result) };
    }
    async completeEvaluationPeriod(periodId, user) {
        const completedBy = user.id;
        const result = await this.evaluationPeriodManagementService.평가기간_완료한다(periodId, completedBy);
        return { success: Boolean(result) };
    }
    async updateEvaluationPeriodBasicInfo(periodId, updateData, user) {
        const updatedBy = user.id;
        const contextDto = {
            name: updateData.name,
            description: updateData.description,
            maxSelfEvaluationRate: updateData.maxSelfEvaluationRate,
        };
        return await this.evaluationPeriodManagementService.평가기간기본정보_수정한다(periodId, contextDto, updatedBy);
    }
    async updateEvaluationPeriodSchedule(periodId, scheduleData, user) {
        const updatedBy = user.id;
        const contextDto = {
            startDate: scheduleData.startDate,
            evaluationSetupDeadline: scheduleData.evaluationSetupDeadline,
            performanceDeadline: scheduleData.performanceDeadline,
            selfEvaluationDeadline: scheduleData.selfEvaluationDeadline,
            peerEvaluationDeadline: scheduleData.peerEvaluationDeadline,
        };
        return await this.evaluationPeriodManagementService.평가기간일정_수정한다(periodId, contextDto, updatedBy);
    }
    async updateEvaluationPeriodStartDate(periodId, startDateData, user) {
        const updatedBy = user.id;
        const contextDto = {
            startDate: startDateData.startDate,
        };
        return await this.evaluationPeriodManagementService.평가기간시작일_수정한다(periodId, contextDto, updatedBy);
    }
    async updateEvaluationSetupDeadline(periodId, deadlineData, user) {
        const updatedBy = user.id;
        const contextDto = {
            evaluationSetupDeadline: deadlineData.evaluationSetupDeadline,
        };
        return await this.evaluationPeriodManagementService.평가설정단계마감일_수정한다(periodId, contextDto, updatedBy);
    }
    async updatePerformanceDeadline(periodId, deadlineData, user) {
        const updatedBy = user.id;
        const contextDto = {
            performanceDeadline: deadlineData.performanceDeadline,
        };
        return await this.evaluationPeriodManagementService.업무수행단계마감일_수정한다(periodId, contextDto, updatedBy);
    }
    async updateSelfEvaluationDeadline(periodId, deadlineData, user) {
        const updatedBy = user.id;
        const contextDto = {
            selfEvaluationDeadline: deadlineData.selfEvaluationDeadline,
        };
        return await this.evaluationPeriodManagementService.자기평가단계마감일_수정한다(periodId, contextDto, updatedBy);
    }
    async updatePeerEvaluationDeadline(periodId, deadlineData, user) {
        const updatedBy = user.id;
        const contextDto = {
            peerEvaluationDeadline: deadlineData.peerEvaluationDeadline,
        };
        return await this.evaluationPeriodManagementService.하향동료평가단계마감일_수정한다(periodId, contextDto, updatedBy);
    }
    async updateEvaluationPeriodGradeRanges(periodId, gradeData, user) {
        const updatedBy = user.id;
        const contextDto = {
            gradeRanges: gradeData.gradeRanges.map((range) => ({
                grade: range.grade,
                minRange: range.minRange,
                maxRange: range.maxRange,
            })),
        };
        return await this.evaluationPeriodManagementService.평가기간등급구간_수정한다(periodId, contextDto, updatedBy);
    }
    async updateCriteriaSettingPermission(periodId, permissionData, user) {
        const changedBy = user.id;
        const contextDto = {
            enabled: permissionData.allowManualSetting,
        };
        return await this.evaluationPeriodManagementService.평가기준설정수동허용_변경한다(periodId, contextDto, changedBy);
    }
    async updateSelfEvaluationSettingPermission(periodId, permissionData, user) {
        const changedBy = user.id;
        const contextDto = {
            enabled: permissionData.allowManualSetting,
        };
        return await this.evaluationPeriodManagementService.자기평가설정수동허용_변경한다(periodId, contextDto, changedBy);
    }
    async updateFinalEvaluationSettingPermission(periodId, permissionData, user) {
        const changedBy = user.id;
        const contextDto = {
            enabled: permissionData.allowManualSetting,
        };
        return await this.evaluationPeriodManagementService.최종평가설정수동허용_변경한다(periodId, contextDto, changedBy);
    }
    async updateManualSettingPermissions(periodId, permissionData, user) {
        const changedBy = user.id;
        const contextDto = {
            criteriaSettingEnabled: permissionData.allowCriteriaManualSetting,
            selfEvaluationSettingEnabled: permissionData.allowSelfEvaluationManualSetting,
            finalEvaluationSettingEnabled: permissionData.allowFinalEvaluationManualSetting,
        };
        return await this.evaluationPeriodManagementService.전체수동허용설정_변경한다(periodId, contextDto, changedBy);
    }
    async copyEvaluationPeriod(periodId, copyData, user) {
        const updatedBy = user.id;
        return await this.evaluationPeriodManagementService.평가기간_복제한다(periodId, copyData.sourceEvaluationPeriodId, updatedBy);
    }
    async deleteEvaluationPeriod(periodId, user) {
        const deletedBy = user.id;
        const result = await this.evaluationPeriodManagementService.평가기간_삭제한다(periodId, deletedBy);
        return { success: result };
    }
    async changeEvaluationPeriodPhase(periodId, changePhaseDto, user) {
        const changedBy = user.id;
        const targetPhase = changePhaseDto.targetPhase;
        const result = await this.evaluationPeriodBusinessService.단계_변경한다(periodId, targetPhase, changedBy);
        return result;
    }
    async triggerAutoPhaseTransition() {
        const result = await this.evaluationPeriodBusinessService.자동_단계_전이를_실행한다();
        return {
            success: true,
            transitionedCount: result,
            message: `${result}개의 평가기간이 자동 단계 전이되었습니다.`,
        };
    }
};
exports.EvaluationPeriodManagementController = EvaluationPeriodManagementController;
__decorate([
    (0, evaluation_period_api_decorators_1.GetDefaultGradeRanges)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "getDefaultGradeRanges", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateDefaultGradeRanges)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluation_management_dto_1.UpdateDefaultGradeRangesApiDto]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateDefaultGradeRanges", null);
__decorate([
    (0, evaluation_period_api_decorators_1.GetActiveEvaluationPeriods)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "getActiveEvaluationPeriods", null);
__decorate([
    (0, evaluation_period_api_decorators_1.GetEvaluationPeriods)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluation_management_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "getEvaluationPeriods", null);
__decorate([
    (0, evaluation_period_api_decorators_1.GetEvaluationPeriodDetail)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "getEvaluationPeriodDetail", null);
__decorate([
    (0, evaluation_period_api_decorators_1.CreateEvaluationPeriod)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [evaluation_management_dto_1.CreateEvaluationPeriodApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "createEvaluationPeriod", null);
__decorate([
    (0, evaluation_period_api_decorators_1.StartEvaluationPeriod)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "startEvaluationPeriod", null);
__decorate([
    (0, evaluation_period_api_decorators_1.CompleteEvaluationPeriod)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "completeEvaluationPeriod", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateEvaluationPeriodBasicInfo)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.UpdateEvaluationPeriodBasicApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateEvaluationPeriodBasicInfo", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateEvaluationPeriodSchedule)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.UpdateEvaluationPeriodScheduleApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateEvaluationPeriodSchedule", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateEvaluationPeriodStartDate)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.UpdateEvaluationPeriodStartDateApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateEvaluationPeriodStartDate", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateEvaluationSetupDeadline)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.UpdateEvaluationSetupDeadlineApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateEvaluationSetupDeadline", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdatePerformanceDeadline)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.UpdatePerformanceDeadlineApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updatePerformanceDeadline", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateSelfEvaluationDeadline)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.UpdateSelfEvaluationDeadlineApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateSelfEvaluationDeadline", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdatePeerEvaluationDeadline)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.UpdatePeerEvaluationDeadlineApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updatePeerEvaluationDeadline", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateEvaluationPeriodGradeRanges)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.UpdateGradeRangesApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateEvaluationPeriodGradeRanges", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateCriteriaSettingPermission)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.ManualPermissionSettingDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateCriteriaSettingPermission", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateSelfEvaluationSettingPermission)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.ManualPermissionSettingDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateSelfEvaluationSettingPermission", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateFinalEvaluationSettingPermission)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.ManualPermissionSettingDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateFinalEvaluationSettingPermission", null);
__decorate([
    (0, evaluation_period_api_decorators_1.UpdateManualSettingPermissions)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.UpdateManualSettingPermissionsApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "updateManualSettingPermissions", null);
__decorate([
    (0, evaluation_period_api_decorators_1.CopyEvaluationPeriod)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.CopyEvaluationPeriodApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "copyEvaluationPeriod", null);
__decorate([
    (0, evaluation_period_api_decorators_1.DeleteEvaluationPeriod)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "deleteEvaluationPeriod", null);
__decorate([
    (0, evaluation_period_api_decorators_1.ChangeEvaluationPeriodPhase)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, evaluation_management_dto_1.ChangeEvaluationPeriodPhaseApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "changeEvaluationPeriodPhase", null);
__decorate([
    (0, common_1.Post)('auto-phase-transition'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "triggerAutoPhaseTransition", null);
exports.EvaluationPeriodManagementController = EvaluationPeriodManagementController = EvaluationPeriodManagementController_1 = __decorate([
    (0, swagger_1.ApiTags)('A-2. 관리자 - 평가기간'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/evaluation-periods'),
    __metadata("design:paramtypes", [evaluation_period_business_service_1.EvaluationPeriodBusinessService,
        evaluation_period_management_service_1.EvaluationPeriodManagementContextService])
], EvaluationPeriodManagementController);
//# sourceMappingURL=evaluation-period-management.controller.js.map