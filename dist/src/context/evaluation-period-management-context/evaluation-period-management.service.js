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
var EvaluationPeriodManagementContextService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodManagementContextService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const downward_evaluation_exceptions_1 = require("../../domain/core/downward-evaluation/downward-evaluation.exceptions");
const evaluation_period_service_1 = require("../../domain/core/evaluation-period/evaluation-period.service");
const evaluation_period_auto_phase_service_1 = require("../../domain/core/evaluation-period/evaluation-period-auto-phase.service");
const handlers_1 = require("./handlers");
const handlers_2 = require("./handlers");
let EvaluationPeriodManagementContextService = EvaluationPeriodManagementContextService_1 = class EvaluationPeriodManagementContextService {
    commandBus;
    queryBus;
    evaluationPeriodService;
    evaluationPeriodAutoPhaseService;
    logger = new common_1.Logger(EvaluationPeriodManagementContextService_1.name);
    constructor(commandBus, queryBus, evaluationPeriodService, evaluationPeriodAutoPhaseService) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.evaluationPeriodService = evaluationPeriodService;
        this.evaluationPeriodAutoPhaseService = evaluationPeriodAutoPhaseService;
    }
    async 평가기간_생성한다(createData, createdBy) {
        const command = new handlers_1.CreateEvaluationPeriodCommand(createData, createdBy);
        return await this.commandBus.execute(command);
    }
    async 평가기간_시작한다(periodId, startedBy) {
        const command = new handlers_1.StartEvaluationPeriodCommand(periodId, startedBy);
        return await this.commandBus.execute(command);
    }
    async 평가기간_완료한다(periodId, completedBy) {
        const command = new handlers_1.CompleteEvaluationPeriodCommand(periodId, completedBy);
        return await this.commandBus.execute(command);
    }
    async 평가기간기본정보_수정한다(periodId, updateData, updatedBy) {
        const command = new handlers_1.UpdateEvaluationPeriodBasicInfoCommand(periodId, updateData, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 평가기간일정_수정한다(periodId, scheduleData, updatedBy) {
        const command = new handlers_1.UpdateEvaluationPeriodScheduleCommand(periodId, scheduleData, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 평가설정단계마감일_수정한다(periodId, deadlineData, updatedBy) {
        const command = new handlers_1.UpdateEvaluationSetupDeadlineCommand(periodId, deadlineData, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 업무수행단계마감일_수정한다(periodId, deadlineData, updatedBy) {
        const command = new handlers_1.UpdatePerformanceDeadlineCommand(periodId, deadlineData, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 자기평가단계마감일_수정한다(periodId, deadlineData, updatedBy) {
        const command = new handlers_1.UpdateSelfEvaluationDeadlineCommand(periodId, deadlineData, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 하향동료평가단계마감일_수정한다(periodId, deadlineData, updatedBy) {
        const command = new handlers_1.UpdatePeerEvaluationDeadlineCommand(periodId, deadlineData, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 평가기간시작일_수정한다(periodId, startDateData, updatedBy) {
        const command = new handlers_1.UpdateEvaluationPeriodStartDateCommand(periodId, startDateData, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 평가기간등급구간_수정한다(periodId, gradeData, updatedBy) {
        const command = new handlers_1.UpdateEvaluationPeriodGradeRangesCommand(periodId, gradeData, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 평가기간_삭제한다(periodId, deletedBy) {
        const command = new handlers_1.DeleteEvaluationPeriodCommand(periodId, deletedBy);
        return await this.commandBus.execute(command);
    }
    async 활성평가기간_조회한다() {
        const query = new handlers_2.GetActiveEvaluationPeriodsQuery();
        return await this.queryBus.execute(query);
    }
    async 평가기간상세_조회한다(periodId) {
        const query = new handlers_2.GetEvaluationPeriodDetailQuery(periodId);
        return await this.queryBus.execute(query);
    }
    async 평가기간목록_조회한다(page, limit) {
        const query = new handlers_2.GetEvaluationPeriodListQuery(page, limit);
        return await this.queryBus.execute(query);
    }
    async 평가기준설정수동허용_변경한다(periodId, permissionData, changedBy) {
        const command = new handlers_1.UpdateCriteriaSettingPermissionCommand(periodId, permissionData, changedBy);
        return await this.commandBus.execute(command);
    }
    async 자기평가설정수동허용_변경한다(periodId, permissionData, changedBy) {
        const command = new handlers_1.UpdateSelfEvaluationSettingPermissionCommand(periodId, permissionData, changedBy);
        return await this.commandBus.execute(command);
    }
    async 최종평가설정수동허용_변경한다(periodId, permissionData, changedBy) {
        const command = new handlers_1.UpdateFinalEvaluationSettingPermissionCommand(periodId, permissionData, changedBy);
        return await this.commandBus.execute(command);
    }
    async 전체수동허용설정_변경한다(periodId, permissionData, changedBy) {
        const command = new handlers_1.UpdateManualSettingPermissionsCommand(periodId, permissionData, changedBy);
        return await this.commandBus.execute(command);
    }
    async 평가대상자_등록한다(evaluationPeriodId, employeeId, createdBy) {
        const command = new handlers_1.RegisterEvaluationTargetCommand(evaluationPeriodId, employeeId, createdBy);
        return await this.commandBus.execute(command);
    }
    async 평가대상자_대량_등록한다(evaluationPeriodId, employeeIds, createdBy) {
        const command = new handlers_1.RegisterBulkEvaluationTargetsCommand(evaluationPeriodId, employeeIds, createdBy);
        return await this.commandBus.execute(command);
    }
    async 평가대상에서_제외한다(evaluationPeriodId, employeeId, excludeReason, excludedBy) {
        const command = new handlers_1.ExcludeEvaluationTargetCommand(evaluationPeriodId, employeeId, excludeReason, excludedBy);
        return await this.commandBus.execute(command);
    }
    async 평가대상에_포함한다(evaluationPeriodId, employeeId, updatedBy) {
        const command = new handlers_1.IncludeEvaluationTargetCommand(evaluationPeriodId, employeeId, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 평가대상자_등록_해제한다(evaluationPeriodId, employeeId) {
        const command = new handlers_1.UnregisterEvaluationTargetCommand(evaluationPeriodId, employeeId);
        return await this.commandBus.execute(command);
    }
    async 평가기간의_모든_대상자_해제한다(evaluationPeriodId) {
        const command = new handlers_1.UnregisterAllEvaluationTargetsCommand(evaluationPeriodId);
        return await this.commandBus.execute(command);
    }
    async 평가기간의_평가대상자_조회한다(evaluationPeriodId, includeExcluded = false) {
        const query = new handlers_2.GetEvaluationTargetsQuery(evaluationPeriodId, includeExcluded);
        return await this.queryBus.execute(query);
    }
    async 평가기간의_제외된_대상자_조회한다(evaluationPeriodId) {
        const query = new handlers_2.GetExcludedEvaluationTargetsQuery(evaluationPeriodId);
        return await this.queryBus.execute(query);
    }
    async 직원의_평가기간_맵핑_조회한다(employeeId) {
        const query = new handlers_2.GetEmployeeEvaluationPeriodsQuery(employeeId);
        return await this.queryBus.execute(query);
    }
    async 평가대상_여부_확인한다(evaluationPeriodId, employeeId) {
        const query = new handlers_2.CheckEvaluationTargetQuery(evaluationPeriodId, employeeId);
        return await this.queryBus.execute(query);
    }
    async 필터로_평가대상자_조회한다(filter) {
        const query = new handlers_2.GetEvaluationTargetsByFilterQuery(filter);
        return await this.queryBus.execute(query);
    }
    async 평가기간에_등록되지_않은_직원_목록을_조회한다(evaluationPeriodId) {
        const query = new handlers_2.GetUnregisteredEmployeesQuery(evaluationPeriodId);
        return await this.queryBus.execute(query);
    }
    async 평가_점수를_검증한다(periodId, score) {
        this.logger.debug('평가 점수 검증 시작', { periodId, score });
        const period = await this.평가기간상세_조회한다(periodId);
        if (!period) {
            this.logger.error('평가기간을 찾을 수 없습니다', { periodId });
            throw new downward_evaluation_exceptions_1.InvalidDownwardEvaluationScoreException(score, 1, 120, `평가기간을 찾을 수 없습니다: ${periodId}`);
        }
        const maxRate = period.maxSelfEvaluationRate;
        if (score < 1 || score > maxRate) {
            this.logger.error('평가 점수가 유효 범위를 벗어났습니다', {
                score,
                minScore: 1,
                maxScore: maxRate,
                periodId,
            });
            throw new downward_evaluation_exceptions_1.InvalidDownwardEvaluationScoreException(score, 1, maxRate);
        }
        this.logger.debug('평가 점수 검증 완료', { periodId, score, maxRate });
    }
    async 평가기간을_대상자와_함께_생성한다(createData, createdBy) {
        return await this.commandBus.execute(new handlers_1.CreateEvaluationPeriodWithAutoTargetsCommand(createData, createdBy));
    }
    async 평가대상자를_자동평가자와_함께_등록한다(evaluationPeriodId, employeeId, createdBy) {
        return await this.commandBus.execute(new handlers_1.RegisterEvaluationTargetWithAutoEvaluatorCommand(evaluationPeriodId, employeeId, createdBy));
    }
    async 단계_변경한다(periodId, targetPhase, changedBy) {
        this.logger.log(`평가기간 단계 변경 컨텍스트 로직 시작 - 평가기간: ${periodId}, 대상 단계: ${targetPhase}`);
        const result = await this.evaluationPeriodService.단계_변경한다(periodId, targetPhase, changedBy);
        this.logger.log(`평가기간 단계 변경 컨텍스트 로직 완료 - 평가기간: ${periodId}, 변경된 단계: ${result.currentPhase}`);
        return result;
    }
    async 자동_단계_전이를_실행한다() {
        this.logger.log('자동 단계 전이 컨텍스트 로직 시작');
        const result = await this.evaluationPeriodAutoPhaseService.autoPhaseTransition();
        this.logger.log(`자동 단계 전이 컨텍스트 로직 완료 - 전이된 평가기간 수: ${result}`);
        return result;
    }
    async 평가기간_복제한다(targetPeriodId, sourcePeriodId, updatedBy) {
        this.logger.log(`평가기간 복제 시작 - 소스: ${sourcePeriodId}, 타겟: ${targetPeriodId}`);
        const sourcePeriod = await this.평가기간상세_조회한다(sourcePeriodId);
        if (!sourcePeriod) {
            throw new Error(`소스 평가기간을 찾을 수 없습니다. (id: ${sourcePeriodId})`);
        }
        const targetPeriod = await this.평가기간상세_조회한다(targetPeriodId);
        if (!targetPeriod) {
            throw new Error(`타겟 평가기간을 찾을 수 없습니다. (id: ${targetPeriodId})`);
        }
        await this.평가기간기본정보_수정한다(targetPeriodId, {
            name: targetPeriod.name,
            description: sourcePeriod.description,
            maxSelfEvaluationRate: sourcePeriod.maxSelfEvaluationRate,
        }, updatedBy);
        if (sourcePeriod.gradeRanges && sourcePeriod.gradeRanges.length > 0) {
            await this.평가기간등급구간_수정한다(targetPeriodId, {
                gradeRanges: sourcePeriod.gradeRanges.map((range) => ({
                    grade: range.grade,
                    minRange: range.minRange,
                    maxRange: range.maxRange,
                })),
            }, updatedBy);
        }
        await this.전체수동허용설정_변경한다(targetPeriodId, {
            criteriaSettingEnabled: sourcePeriod.criteriaSettingEnabled,
            selfEvaluationSettingEnabled: sourcePeriod.selfEvaluationSettingEnabled,
            finalEvaluationSettingEnabled: sourcePeriod.finalEvaluationSettingEnabled,
        }, updatedBy);
        this.logger.log(`평가기간 복제 완료 - 소스: ${sourcePeriodId}, 타겟: ${targetPeriodId}`);
        const updatedPeriod = await this.평가기간상세_조회한다(targetPeriodId);
        return updatedPeriod;
    }
};
exports.EvaluationPeriodManagementContextService = EvaluationPeriodManagementContextService;
exports.EvaluationPeriodManagementContextService = EvaluationPeriodManagementContextService = EvaluationPeriodManagementContextService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus,
        evaluation_period_service_1.EvaluationPeriodService,
        evaluation_period_auto_phase_service_1.EvaluationPeriodAutoPhaseService])
], EvaluationPeriodManagementContextService);
//# sourceMappingURL=evaluation-period-management.service.js.map