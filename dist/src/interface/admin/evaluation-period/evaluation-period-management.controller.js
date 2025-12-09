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
const wbs_evaluation_criteria_service_1 = require("../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service");
const evaluation_line_service_1 = require("../../../domain/core/evaluation-line/evaluation-line.service");
const evaluation_line_mapping_service_1 = require("../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
const parse_uuid_decorator_1 = require("../../common/decorators/parse-uuid.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const evaluation_period_api_decorators_1 = require("../../common/decorators/evaluation-period/evaluation-period-api.decorators");
const evaluation_management_dto_1 = require("../../common/dto/evaluation-period/evaluation-management.dto");
const system_setting_service_1 = require("../../../domain/common/system-setting/system-setting.service");
let EvaluationPeriodManagementController = EvaluationPeriodManagementController_1 = class EvaluationPeriodManagementController {
    evaluationPeriodBusinessService;
    evaluationPeriodManagementService;
    systemSettingService;
    wbsEvaluationCriteriaService;
    evaluationLineService;
    evaluationLineMappingService;
    logger = new common_1.Logger(EvaluationPeriodManagementController_1.name);
    constructor(evaluationPeriodBusinessService, evaluationPeriodManagementService, systemSettingService, wbsEvaluationCriteriaService, evaluationLineService, evaluationLineMappingService) {
        this.evaluationPeriodBusinessService = evaluationPeriodBusinessService;
        this.evaluationPeriodManagementService = evaluationPeriodManagementService;
        this.systemSettingService = systemSettingService;
        this.wbsEvaluationCriteriaService = wbsEvaluationCriteriaService;
        this.evaluationLineService = evaluationLineService;
        this.evaluationLineMappingService = evaluationLineMappingService;
    }
    async getDefaultGradeRanges() {
        const gradeRanges = await this.systemSettingService.기본등급구간_조회한다();
        return gradeRanges;
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
        const updatedRanges = await this.systemSettingService.기본등급구간_변경한다(gradeRanges);
        return updatedRanges;
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
    async getEmployeePeriodAssignments(periodId, employeeId) {
        return await this.evaluationPeriodManagementService.직원_평가기간별_할당정보_조회한다(periodId, employeeId);
    }
    async getEvaluationPeriodForCopy(periodId) {
        const evaluationPeriod = await this.evaluationPeriodManagementService.평가기간상세_조회한다(periodId);
        if (!evaluationPeriod) {
            throw new common_1.BadRequestException(`평가 기간을 찾을 수 없습니다. (ID: ${periodId})`);
        }
        const evaluationLines = await this.evaluationLineService.전체_조회한다();
        const evaluationLineMappings = await this.evaluationLineMappingService.필터_조회한다({
            evaluationPeriodId: periodId,
        });
        const wbsItemIds = [
            ...new Set(evaluationLineMappings
                .map((m) => m.wbsItemId)
                .filter((id) => id !== null && id !== undefined)),
        ];
        let evaluationCriteria = [];
        if (wbsItemIds.length > 0) {
            const criteriaPromises = wbsItemIds.map((wbsItemId) => this.wbsEvaluationCriteriaService.WBS항목별_조회한다(wbsItemId));
            const criteriaResults = await Promise.all(criteriaPromises);
            evaluationCriteria = criteriaResults
                .flat()
                .map((c) => c.DTO로_변환한다());
        }
        return {
            evaluationPeriod,
            evaluationCriteria,
            evaluationLines: {
                lines: evaluationLines.map((line) => line.DTO로_변환한다()),
                mappings: evaluationLineMappings.map((mapping) => mapping.DTO로_변환한다()),
            },
        };
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
        if (createData.sourcePeriodId) {
            await this.평가항목과_평가라인을_복사한다(createData.sourcePeriodId, result.evaluationPeriod.id, createdBy);
        }
        return result.evaluationPeriod;
    }
    async 평가항목과_평가라인을_복사한다(sourcePeriodId, targetPeriodId, createdBy) {
        this.logger.log(`평가항목과 평가라인 복사 시작 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}`);
        try {
            const sourceLineMappings = await this.evaluationLineMappingService.필터_조회한다({
                evaluationPeriodId: sourcePeriodId,
            });
            if (sourceLineMappings.length === 0) {
                this.logger.warn(`원본 평가기간에 복사할 평가라인이 없습니다: ${sourcePeriodId}`);
                return;
            }
            this.logger.log(`${sourceLineMappings.length}개의 평가라인 매핑을 복사합니다`);
            const wbsItemIds = [
                ...new Set(sourceLineMappings
                    .map((m) => m.wbsItemId)
                    .filter((id) => id !== null && id !== undefined)),
            ];
            let criteriaCopyCount = 0;
            let criteriaSkipCount = 0;
            for (const wbsItemId of wbsItemIds) {
                const sourceCriteria = await this.wbsEvaluationCriteriaService.WBS항목별_조회한다(wbsItemId);
                if (sourceCriteria.length > 0) {
                    this.logger.log(`WBS ${wbsItemId}의 ${sourceCriteria.length}개 평가 기준을 복사합니다`);
                    for (const criteria of sourceCriteria) {
                        try {
                            await this.wbsEvaluationCriteriaService.생성한다({
                                wbsItemId: criteria.wbsItemId,
                                criteria: criteria.criteria,
                                importance: criteria.importance,
                            });
                            criteriaCopyCount++;
                        }
                        catch (error) {
                            if (error.code === 'DUPLICATE_WBS_EVALUATION_CRITERIA') {
                                this.logger.log(`평가 기준 건너뜀 (이미 존재): WBS=${wbsItemId}, criteria="${criteria.criteria}"`);
                                criteriaSkipCount++;
                            }
                            else {
                                throw error;
                            }
                        }
                    }
                }
            }
            let mappingCopyCount = 0;
            let mappingSkipCount = 0;
            for (const mapping of sourceLineMappings) {
                try {
                    await this.evaluationLineMappingService.생성한다({
                        evaluationPeriodId: targetPeriodId,
                        evaluationLineId: mapping.evaluationLineId,
                        employeeId: mapping.employeeId,
                        evaluatorId: mapping.evaluatorId,
                        wbsItemId: mapping.wbsItemId,
                        createdBy,
                    });
                    mappingCopyCount++;
                }
                catch (error) {
                    if (error.code === 'EVALUATION_LINE_MAPPING_DUPLICATE') {
                        this.logger.log(`평가라인 매핑 건너뜀 (이미 존재): employee=${mapping.employeeId}, evaluator=${mapping.evaluatorId}`);
                        mappingSkipCount++;
                    }
                    else {
                        throw error;
                    }
                }
            }
            this.logger.log(`평가항목과 평가라인 복사 완료 - WBS 평가기준: ${criteriaCopyCount}개 복사, ${criteriaSkipCount}개 건너뜀, 평가라인 매핑: ${mappingCopyCount}개 복사, ${mappingSkipCount}개 건너뜀`);
        }
        catch (error) {
            this.logger.error(`평가항목과 평가라인 복사 실패 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}`, error.stack);
            throw error;
        }
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
    async copyEvaluationPeriod(targetPeriodId, sourcePeriodId, user) {
        const updatedBy = user.id;
        return await this.evaluationPeriodManagementService.평가기간_복제한다(targetPeriodId, sourcePeriodId, updatedBy);
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
    async copyPreviousPeriodData(targetPeriodId, sourcePeriodId, body, user) {
        const employeeId = user.id;
        const copiedBy = user.id;
        this.logger.log(`이전 평가기간 데이터 복사 요청 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}, 직원: ${employeeId}`);
        const result = await this.evaluationPeriodManagementService.이전_평가기간_데이터를_복사한다(targetPeriodId, sourcePeriodId, employeeId, copiedBy, body.projects);
        return {
            success: true,
            message: '이전 평가기간 데이터를 성공적으로 복사했습니다.',
            copiedProjectAssignments: result.copiedProjectAssignments,
            copiedEvaluationLineMappings: result.copiedEvaluationLineMappings,
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
    (0, evaluation_period_api_decorators_1.GetEmployeePeriodAssignments)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('periodId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "getEmployeePeriodAssignments", null);
__decorate([
    (0, evaluation_period_api_decorators_1.GetEvaluationPeriodForCopy)(),
    __param(0, (0, parse_uuid_decorator_1.ParseId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "getEvaluationPeriodForCopy", null);
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
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('targetId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('sourceId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
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
__decorate([
    (0, evaluation_period_api_decorators_1.CopyPreviousPeriodData)(),
    __param(0, (0, parse_uuid_decorator_1.ParseUUID)('targetPeriodId')),
    __param(1, (0, parse_uuid_decorator_1.ParseUUID)('sourcePeriodId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, evaluation_management_dto_1.CopyPreviousPeriodDataApiDto, Object]),
    __metadata("design:returntype", Promise)
], EvaluationPeriodManagementController.prototype, "copyPreviousPeriodData", null);
exports.EvaluationPeriodManagementController = EvaluationPeriodManagementController = EvaluationPeriodManagementController_1 = __decorate([
    (0, swagger_1.ApiTags)('A-2. 관리자 - 평가기간'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, common_1.Controller)('admin/evaluation-periods'),
    __metadata("design:paramtypes", [evaluation_period_business_service_1.EvaluationPeriodBusinessService,
        evaluation_period_management_service_1.EvaluationPeriodManagementContextService,
        system_setting_service_1.SystemSettingService,
        wbs_evaluation_criteria_service_1.WbsEvaluationCriteriaService,
        evaluation_line_service_1.EvaluationLineService,
        evaluation_line_mapping_service_1.EvaluationLineMappingService])
], EvaluationPeriodManagementController);
//# sourceMappingURL=evaluation-period-management.controller.js.map