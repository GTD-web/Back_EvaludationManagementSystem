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
var EvaluationPeriodManagementContextService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodManagementContextService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downward_evaluation_exceptions_1 = require("../../domain/core/downward-evaluation/downward-evaluation.exceptions");
const evaluation_period_service_1 = require("../../domain/core/evaluation-period/evaluation-period.service");
const evaluation_period_auto_phase_service_1 = require("../../domain/core/evaluation-period/evaluation-period-auto-phase.service");
const evaluation_project_assignment_entity_1 = require("../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_project_assignment_service_1 = require("../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service");
const evaluation_wbs_assignment_entity_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const evaluation_wbs_assignment_service_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_mapping_service_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
const evaluation_period_employee_mapping_service_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
const project_entity_1 = require("../../domain/common/project/project.entity");
const wbs_item_entity_1 = require("../../domain/common/wbs-item/wbs-item.entity");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const wbs_evaluation_criteria_entity_1 = require("../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const evaluation_line_entity_1 = require("../../domain/core/evaluation-line/evaluation-line.entity");
const handlers_1 = require("./handlers");
const handlers_2 = require("./handlers");
let EvaluationPeriodManagementContextService = EvaluationPeriodManagementContextService_1 = class EvaluationPeriodManagementContextService {
    commandBus;
    queryBus;
    evaluationPeriodService;
    evaluationPeriodAutoPhaseService;
    evaluationProjectAssignmentService;
    evaluationWbsAssignmentService;
    evaluationLineMappingService;
    evaluationPeriodEmployeeMappingService;
    projectAssignmentRepository;
    wbsAssignmentRepository;
    lineMappingRepository;
    projectRepository;
    wbsItemRepository;
    employeeRepository;
    wbsEvaluationCriteriaRepository;
    evaluationLineRepository;
    logger = new common_1.Logger(EvaluationPeriodManagementContextService_1.name);
    constructor(commandBus, queryBus, evaluationPeriodService, evaluationPeriodAutoPhaseService, evaluationProjectAssignmentService, evaluationWbsAssignmentService, evaluationLineMappingService, evaluationPeriodEmployeeMappingService, projectAssignmentRepository, wbsAssignmentRepository, lineMappingRepository, projectRepository, wbsItemRepository, employeeRepository, wbsEvaluationCriteriaRepository, evaluationLineRepository) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.evaluationPeriodService = evaluationPeriodService;
        this.evaluationPeriodAutoPhaseService = evaluationPeriodAutoPhaseService;
        this.evaluationProjectAssignmentService = evaluationProjectAssignmentService;
        this.evaluationWbsAssignmentService = evaluationWbsAssignmentService;
        this.evaluationLineMappingService = evaluationLineMappingService;
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.lineMappingRepository = lineMappingRepository;
        this.projectRepository = projectRepository;
        this.wbsItemRepository = wbsItemRepository;
        this.employeeRepository = employeeRepository;
        this.wbsEvaluationCriteriaRepository = wbsEvaluationCriteriaRepository;
        this.evaluationLineRepository = evaluationLineRepository;
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
    async 이전_평가기간_데이터를_복사한다(targetPeriodId, sourcePeriodId, employeeId, copiedBy, projects) {
        this.logger.log(`이전 평가기간 데이터 복사 시작 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}, 직원: ${employeeId}`);
        const sourcePeriod = await this.평가기간상세_조회한다(sourcePeriodId);
        if (!sourcePeriod) {
            throw new common_1.NotFoundException(`원본 평가기간을 찾을 수 없습니다. (id: ${sourcePeriodId})`);
        }
        const targetPeriod = await this.평가기간상세_조회한다(targetPeriodId);
        if (!targetPeriod) {
            throw new common_1.NotFoundException(`대상 평가기간을 찾을 수 없습니다. (id: ${targetPeriodId})`);
        }
        const targetMapping = await this.evaluationPeriodEmployeeMappingService.평가대상_여부를_확인한다(targetPeriodId, employeeId);
        if (!targetMapping) {
            this.logger.warn(`대상 평가기간에 직원이 등록되지 않았습니다. 자동으로 등록합니다. - 평가기간: ${targetPeriodId}, 직원: ${employeeId}`);
            await this.평가대상자_등록한다(targetPeriodId, employeeId, copiedBy);
        }
        const sourceProjectAssignments = await this.projectAssignmentRepository.find({
            where: {
                periodId: sourcePeriodId,
                employeeId: employeeId,
            },
            order: {
                displayOrder: 'ASC',
            },
        });
        this.logger.log(`원본 평가기간의 프로젝트 할당 ${sourceProjectAssignments.length}개 발견`);
        const projectIds = projects?.map((p) => p.projectId);
        const filteredProjectAssignments = projectIds
            ? sourceProjectAssignments.filter((assignment) => projectIds.includes(assignment.projectId))
            : sourceProjectAssignments;
        const projectWbsMap = new Map();
        if (projects) {
            for (const project of projects) {
                if (project.wbsIds && project.wbsIds.length > 0) {
                    projectWbsMap.set(project.projectId, project.wbsIds);
                }
            }
        }
        let copiedProjectAssignmentsCount = 0;
        const copiedProjectIds = new Set();
        for (const assignment of filteredProjectAssignments) {
            try {
                await this.evaluationProjectAssignmentService.생성한다({
                    periodId: targetPeriodId,
                    employeeId: employeeId,
                    projectId: assignment.projectId,
                    assignedBy: copiedBy,
                    displayOrder: assignment.displayOrder,
                });
                copiedProjectAssignmentsCount++;
                copiedProjectIds.add(assignment.projectId);
                this.logger.log(`프로젝트 할당 복사 완료 - 프로젝트: ${assignment.projectId}`);
            }
            catch (error) {
                if (error.message?.includes('이미 존재') ||
                    error.code === 'DUPLICATE_ASSIGNMENT') {
                    copiedProjectIds.add(assignment.projectId);
                    this.logger.log(`프로젝트 할당 건너뜀 (이미 존재): 프로젝트=${assignment.projectId}`);
                }
                else {
                    this.logger.error(`프로젝트 할당 복사 실패 - 프로젝트: ${assignment.projectId}`, error.stack);
                }
            }
        }
        const sourceWbsAssignments = await this.wbsAssignmentRepository.find({
            where: {
                periodId: sourcePeriodId,
                employeeId: employeeId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            order: {
                displayOrder: 'ASC',
            },
        });
        this.logger.log(`원본 평가기간의 WBS 할당 ${sourceWbsAssignments.length}개 발견`);
        let copiedWbsAssignmentsCount = 0;
        const copiedWbsIds = new Set();
        for (const wbsAssignment of sourceWbsAssignments) {
            if (copiedProjectIds.has(wbsAssignment.projectId)) {
                const allowedWbsIds = projectWbsMap.get(wbsAssignment.projectId);
                const shouldCopyWbs = !allowedWbsIds || allowedWbsIds.includes(wbsAssignment.wbsItemId);
                if (shouldCopyWbs) {
                    try {
                        await this.evaluationWbsAssignmentService.생성한다({
                            periodId: targetPeriodId,
                            employeeId: employeeId,
                            projectId: wbsAssignment.projectId,
                            wbsItemId: wbsAssignment.wbsItemId,
                            assignedBy: copiedBy,
                        });
                        copiedWbsAssignmentsCount++;
                        copiedWbsIds.add(wbsAssignment.wbsItemId);
                        this.logger.log(`WBS 할당 복사 완료 - WBS: ${wbsAssignment.wbsItemId}, 프로젝트: ${wbsAssignment.projectId}`);
                    }
                    catch (error) {
                        if (error.message?.includes('이미 존재') ||
                            error.code === 'DUPLICATE_ASSIGNMENT') {
                            copiedWbsIds.add(wbsAssignment.wbsItemId);
                            this.logger.log(`WBS 할당 건너뜀 (이미 존재): WBS=${wbsAssignment.wbsItemId}, 프로젝트=${wbsAssignment.projectId}`);
                        }
                        else {
                            this.logger.error(`WBS 할당 복사 실패 - WBS: ${wbsAssignment.wbsItemId}`, error.stack);
                        }
                    }
                }
            }
        }
        const sourceLineMappings = await this.lineMappingRepository.find({
            where: {
                evaluationPeriodId: sourcePeriodId,
                employeeId: employeeId,
            },
        });
        this.logger.log(`원본 평가기간의 평가라인 매핑 ${sourceLineMappings.length}개 발견`);
        let filteredLineMappings = sourceLineMappings.filter((mapping) => !mapping.wbsItemId || copiedWbsIds.has(mapping.wbsItemId));
        this.logger.log(`필터링 후 평가라인 매핑 ${filteredLineMappings.length}개`);
        let copiedLineMappingsCount = 0;
        for (const mapping of filteredLineMappings) {
            try {
                await this.evaluationLineMappingService.생성한다({
                    evaluationPeriodId: targetPeriodId,
                    employeeId: employeeId,
                    evaluatorId: mapping.evaluatorId,
                    wbsItemId: mapping.wbsItemId,
                    evaluationLineId: mapping.evaluationLineId,
                    createdBy: copiedBy,
                });
                copiedLineMappingsCount++;
                this.logger.log(`평가라인 매핑 복사 완료 - WBS: ${mapping.wbsItemId}, 평가자: ${mapping.evaluatorId}`);
            }
            catch (error) {
                if (error.message?.includes('이미 존재') ||
                    error.code === 'DUPLICATE_MAPPING') {
                    this.logger.log(`평가라인 매핑 건너뜀 (이미 존재): WBS=${mapping.wbsItemId}, 평가자=${mapping.evaluatorId}`);
                }
                else {
                    this.logger.error(`평가라인 매핑 복사 실패 - WBS: ${mapping.wbsItemId}`, error.stack);
                }
            }
        }
        let copiedCriteriaCount = 0;
        if (copiedWbsIds.size > 0) {
            this.logger.log(`복사된 WBS ${copiedWbsIds.size}개의 평가 기준 복사 시작`);
            for (const wbsItemId of copiedWbsIds) {
                const sourceCriteria = await this.wbsEvaluationCriteriaRepository.find({
                    where: {
                        wbsItemId: wbsItemId,
                        deletedAt: (0, typeorm_2.IsNull)(),
                    },
                });
                if (sourceCriteria.length > 0) {
                    this.logger.log(`WBS ${wbsItemId}의 평가 기준 ${sourceCriteria.length}개 복사 시작`);
                    for (const criteria of sourceCriteria) {
                        try {
                            const existingCriteria = await this.wbsEvaluationCriteriaRepository.findOne({
                                where: {
                                    wbsItemId: criteria.wbsItemId,
                                    criteria: criteria.criteria,
                                    deletedAt: (0, typeorm_2.IsNull)(),
                                },
                            });
                            if (!existingCriteria) {
                                const newCriteria = this.wbsEvaluationCriteriaRepository.create({
                                    wbsItemId: criteria.wbsItemId,
                                    criteria: criteria.criteria,
                                    importance: criteria.importance,
                                    createdBy: copiedBy,
                                });
                                await this.wbsEvaluationCriteriaRepository.save(newCriteria);
                                copiedCriteriaCount++;
                                this.logger.log(`평가 기준 복사 완료 - WBS: ${criteria.wbsItemId}, 기준: "${criteria.criteria}", 중요도: ${criteria.importance}`);
                            }
                            else {
                                this.logger.log(`평가 기준 건너뜀 (이미 존재): WBS=${criteria.wbsItemId}, 기준="${criteria.criteria}"`);
                            }
                        }
                        catch (error) {
                            this.logger.error(`평가 기준 복사 실패 - WBS: ${criteria.wbsItemId}, 기준: "${criteria.criteria}"`, error.stack);
                        }
                    }
                }
            }
        }
        this.logger.log(`이전 평가기간 데이터 복사 완료 - 원본: ${sourcePeriodId}, 대상: ${targetPeriodId}, 직원: ${employeeId}, 프로젝트 할당: ${copiedProjectAssignmentsCount}개, WBS 할당: ${copiedWbsAssignmentsCount}개, 평가라인 매핑: ${copiedLineMappingsCount}개, WBS 평가 기준: ${copiedCriteriaCount}개`);
        return {
            copiedProjectAssignments: copiedProjectAssignmentsCount,
            copiedWbsAssignments: copiedWbsAssignmentsCount,
            copiedEvaluationLineMappings: copiedLineMappingsCount,
            copiedWbsEvaluationCriteria: copiedCriteriaCount,
        };
    }
    async 직원_평가기간별_할당정보_조회한다(periodId, employeeId) {
        this.logger.log(`직원 평가기간별 할당정보 조회 시작 - 평가기간: ${periodId}, 직원: ${employeeId}`);
        const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(periodId);
        if (!evaluationPeriod) {
            throw new common_1.NotFoundException(`평가기간을 찾을 수 없습니다. (ID: ${periodId})`);
        }
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`직원을 찾을 수 없습니다. (ID: ${employeeId})`);
        }
        const primaryEvaluatorMapping = await this.lineMappingRepository
            .createQueryBuilder('mapping')
            .select([
            'mapping.id AS mapping_id',
            'mapping.evaluatorId AS mapping_evaluator_id',
            'evaluator.name AS evaluator_name',
        ])
            .leftJoin(employee_entity_1.Employee, 'evaluator', '(evaluator.id = mapping.evaluatorId OR evaluator.externalId = "mapping"."evaluatorId"::text) AND evaluator.deletedAt IS NULL')
            .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId: periodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.wbsItemId IS NULL')
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: 'primary',
        })
            .getRawOne();
        this.logger.log(`직원별 고정 1차 평가자 매핑: ${primaryEvaluatorMapping ? '발견 - ' + primaryEvaluatorMapping.evaluator_name : '없음'}`);
        const lineMappings = await this.lineMappingRepository.find({
            where: {
                evaluationPeriodId: periodId,
                employeeId: employeeId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        this.logger.log(`평가라인 매핑 총 ${lineMappings.length}개 발견 (직원별 고정 포함)`);
        if (lineMappings.length > 0) {
            this.logger.log('평가라인 매핑 상세:');
            lineMappings.forEach((mapping, index) => {
                this.logger.log(`  [${index + 1}] WBS: ${mapping.wbsItemId ? mapping.wbsItemId.substring(0, 8) + '...' : 'NULL(직원별 고정)'}, 평가라인: ${mapping.evaluationLineId?.substring(0, 8)}..., 평가자: ${mapping.evaluatorId?.substring(0, 8)}...`);
            });
        }
        const projectAssignments = await this.projectAssignmentRepository.find({
            where: {
                periodId: periodId,
                employeeId: employeeId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        this.logger.log(`프로젝트 할당 ${projectAssignments.length}개 발견`);
        const wbsAssignments = await this.wbsAssignmentRepository.find({
            where: {
                periodId: periodId,
                employeeId: employeeId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        this.logger.log(`WBS 할당 ${wbsAssignments.length}개 발견`);
        const assignedWbsIds = wbsAssignments.map((assignment) => assignment.wbsItemId);
        this.logger.log(`실제 할당된 WBS ${assignedWbsIds.length}개`);
        if (assignedWbsIds.length === 0) {
            const periodDto = evaluationPeriod.DTO로_변환한다();
            return {
                evaluationPeriod: {
                    id: periodDto.id,
                    name: periodDto.name,
                    startDate: periodDto.startDate,
                    endDate: periodDto.peerEvaluationDeadline ?? undefined,
                    status: periodDto.status,
                },
                employee: {
                    id: employee.id,
                    name: employee.name,
                    employeeNumber: employee.employeeNumber,
                },
                projects: [],
                totalProjects: 0,
                totalWbs: 0,
            };
        }
        const assignedWbsList = await this.wbsItemRepository.find({
            where: {
                id: (0, typeorm_2.In)(assignedWbsIds),
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            order: { level: 'ASC', wbsCode: 'ASC' },
        });
        this.logger.log(`조회된 WBS 아이템 ${assignedWbsList.length}개`);
        const projectWbsMap = new Map();
        for (const wbs of assignedWbsList) {
            if (!projectWbsMap.has(wbs.projectId)) {
                projectWbsMap.set(wbs.projectId, []);
            }
            projectWbsMap.get(wbs.projectId).push(wbs);
        }
        const projectIds = Array.from(projectWbsMap.keys());
        const projectsList = await this.projectRepository.find({
            where: {
                id: (0, typeorm_2.In)(projectIds),
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        this.logger.log(`프로젝트 ${projectsList.length}개 조회됨`);
        projectsList.forEach((project) => {
            this.logger.log(`  프로젝트 ${project.name} (${project.projectCode}): managerId=${project.managerId || 'null'}`);
        });
        const projectsMap = new Map();
        for (const project of projectsList) {
            projectsMap.set(project.id, project);
        }
        const wbsWithEvaluationLineSet = new Set(assignedWbsIds);
        const wbsCriteria = await this.wbsEvaluationCriteriaRepository.find({
            where: {
                wbsItemId: (0, typeorm_2.In)(assignedWbsIds),
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            order: {
                createdAt: 'ASC',
            },
        });
        this.logger.log(`WBS 평가기준 ${wbsCriteria.length}개 조회됨`);
        const wbsCriteriaMap = new Map();
        for (const criteria of wbsCriteria) {
            if (!wbsCriteriaMap.has(criteria.wbsItemId)) {
                wbsCriteriaMap.set(criteria.wbsItemId, []);
            }
            wbsCriteriaMap.get(criteria.wbsItemId).push(criteria);
        }
        const evaluationLineIds = [
            ...new Set(lineMappings
                .map((mapping) => mapping.evaluationLineId)
                .filter((id) => id)),
        ];
        this.logger.log(`평가라인 ID ${evaluationLineIds.length}개: ${JSON.stringify(evaluationLineIds)}`);
        const evaluationLines = evaluationLineIds.length > 0
            ? await this.evaluationLineRepository.find({
                where: {
                    id: (0, typeorm_2.In)(evaluationLineIds),
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            })
            : [];
        this.logger.log(`평가라인 ${evaluationLines.length}개 조회됨`);
        if (evaluationLines.length > 0) {
            this.logger.log('평가라인 상세:');
            evaluationLines.forEach((line) => {
                this.logger.log(`  평가라인 ${line.id.substring(0, 8)}...: type=${line.evaluatorType}, order=${line.order}, isRequired=${line.isRequired}`);
            });
        }
        else {
            this.logger.warn('조회된 평가라인이 없습니다!');
        }
        const evaluationLineMap = new Map();
        for (const line of evaluationLines) {
            evaluationLineMap.set(line.id, line);
        }
        const evaluatorIds = [
            ...new Set(lineMappings.map((mapping) => mapping.evaluatorId).filter((id) => id)),
        ];
        if (primaryEvaluatorMapping?.mapping_evaluator_id) {
            if (!evaluatorIds.includes(primaryEvaluatorMapping.mapping_evaluator_id)) {
                evaluatorIds.push(primaryEvaluatorMapping.mapping_evaluator_id);
            }
        }
        this.logger.log(`평가자 ID ${evaluatorIds.length}개 (직원별 고정 1차 포함): ${JSON.stringify(evaluatorIds)}`);
        const evaluators = evaluatorIds.length > 0
            ? await this.employeeRepository
                .createQueryBuilder('employee')
                .where('(employee.id::text IN (:...evaluatorIds) OR employee.externalId IN (:...evaluatorIds))', { evaluatorIds })
                .getMany()
            : [];
        this.logger.log(`평가자 ${evaluators.length}명 조회됨: ${evaluators.map((e) => `${e.name}${e.deletedAt ? ' (삭제됨)' : ''}`).join(', ')}`);
        const evaluatorMap = new Map();
        for (const evaluator of evaluators) {
            evaluatorMap.set(evaluator.id, evaluator);
            if (evaluator.externalId) {
                evaluatorMap.set(evaluator.externalId, evaluator);
            }
        }
        const wbsPrimaryEvaluatorMap = new Map();
        const wbsSecondaryEvaluatorMap = new Map();
        if (primaryEvaluatorMapping?.mapping_evaluator_id) {
            const evaluatorId = primaryEvaluatorMapping.mapping_evaluator_id;
            const evaluatorName = primaryEvaluatorMapping.evaluator_name || '';
            this.logger.log(`직원별 고정 1차 평가자 발견: ${evaluatorName} (ID: ${evaluatorId.substring(0, 8)}...)`);
            assignedWbsIds.forEach((wbsId) => {
                wbsPrimaryEvaluatorMap.set(wbsId, {
                    evaluatorId,
                    evaluatorName,
                });
            });
            this.logger.log(`모든 WBS ${assignedWbsIds.length}개에 고정 1차 평가자 할당: ${evaluatorName}`);
        }
        else {
            this.logger.log(`직원별 고정 1차 평가자 없음 - WBS별 매핑에서 조회`);
        }
        for (const mapping of lineMappings) {
            if (!mapping.wbsItemId)
                continue;
            const evaluationLine = evaluationLineMap.get(mapping.evaluationLineId);
            const evaluator = evaluatorMap.get(mapping.evaluatorId);
            if (evaluationLine && evaluator) {
                const evaluatorInfo = {
                    evaluatorId: evaluator.id,
                    evaluatorName: evaluator.name,
                };
                if (evaluationLine.evaluatorType === 'primary') {
                    wbsPrimaryEvaluatorMap.set(mapping.wbsItemId, evaluatorInfo);
                    this.logger.log(`  WBS ${mapping.wbsItemId.substring(0, 8)}...에 WBS별 1차 평가자 추가: ${evaluator.name}`);
                }
                else if (evaluationLine.evaluatorType === 'secondary') {
                    wbsSecondaryEvaluatorMap.set(mapping.wbsItemId, evaluatorInfo);
                    this.logger.log(`  WBS ${mapping.wbsItemId.substring(0, 8)}...에 2차 평가자 추가: ${evaluator.name}`);
                }
            }
            else {
                this.logger.warn(`  평가라인 또는 평가자 정보 누락 - lineId: ${mapping.evaluationLineId}, evaluatorId: ${mapping.evaluatorId}`);
            }
        }
        this.logger.log(`WBS별 평가자 매핑 완료: 1차 ${wbsPrimaryEvaluatorMap.size}개, 2차 ${wbsSecondaryEvaluatorMap.size}개`);
        const managerIds = [
            ...new Set(projectsList
                .map((project) => project.managerId)
                .filter((id) => !!id)),
        ];
        this.logger.log(`프로젝트 매니저 ID ${managerIds.length}개 발견: ${JSON.stringify(managerIds)}`);
        const managers = managerIds.length > 0
            ? await this.employeeRepository.find({
                where: {
                    externalId: (0, typeorm_2.In)(managerIds),
                },
            })
            : [];
        this.logger.log(`프로젝트 매니저 ${managers.length}명 조회됨: ${managers.map((m) => `${m.name}${m.deletedAt ? ' (삭제됨)' : ''}`).join(', ')}`);
        const managerMap = new Map();
        for (const manager of managers) {
            if (manager.externalId) {
                managerMap.set(manager.externalId, manager);
            }
        }
        const projects = [];
        let totalWbs = 0;
        for (const [projectId, wbsList] of projectWbsMap.entries()) {
            const project = projectsMap.get(projectId);
            if (!project)
                continue;
            const wbsItemDtos = wbsList.map((wbs) => {
                totalWbs++;
                const wbsCriteriaList = wbsCriteriaMap.get(wbs.id) || [];
                const criteriaDto = wbsCriteriaList.map((criteria) => ({
                    criterionId: criteria.id,
                    criteria: criteria.criteria,
                    importance: criteria.importance,
                    createdAt: criteria.createdAt,
                }));
                return {
                    wbsId: wbs.id,
                    wbsName: wbs.title,
                    wbsCode: wbs.wbsCode,
                    criteria: criteriaDto,
                    primaryDownwardEvaluation: wbsPrimaryEvaluatorMap.get(wbs.id),
                    secondaryDownwardEvaluation: wbsSecondaryEvaluatorMap.get(wbs.id),
                };
            });
            let projectManagerInfo = undefined;
            if (project.managerId) {
                const manager = managerMap.get(project.managerId);
                if (manager) {
                    projectManagerInfo = {
                        id: manager.id,
                        name: manager.name,
                    };
                    this.logger.log(`  프로젝트 ${project.name}에 PM 할당: ${manager.name}`);
                }
                else {
                    this.logger.warn(`  프로젝트 ${project.name}의 PM을 찾을 수 없음: managerId=${project.managerId}`);
                }
            }
            else {
                this.logger.log(`  프로젝트 ${project.name}에 PM이 설정되지 않음`);
            }
            const primaryCount = wbsItemDtos.filter((w) => w.primaryDownwardEvaluation).length;
            const secondaryCount = wbsItemDtos.filter((w) => w.secondaryDownwardEvaluation).length;
            this.logger.log(`  프로젝트 ${project.name}: WBS ${wbsItemDtos.length}개, 1차 평가자 ${primaryCount}개, 2차 평가자 ${secondaryCount}개`);
            projects.push({
                projectId: project.id,
                projectName: project.name,
                projectCode: project.projectCode ?? '',
                projectManager: projectManagerInfo,
                wbsList: wbsItemDtos,
            });
        }
        const periodDto = evaluationPeriod.DTO로_변환한다();
        const response = {
            evaluationPeriod: {
                id: periodDto.id,
                name: periodDto.name,
                startDate: periodDto.startDate,
                endDate: periodDto.peerEvaluationDeadline ?? undefined,
                status: periodDto.status,
            },
            employee: {
                id: employee.id,
                name: employee.name,
                employeeNumber: employee.employeeNumber,
            },
            projects,
            totalProjects: projects.length,
            totalWbs,
        };
        this.logger.log(`직원 평가기간별 할당정보 조회 완료 - 프로젝트: ${projects.length}개, WBS: ${totalWbs}개`);
        return response;
    }
};
exports.EvaluationPeriodManagementContextService = EvaluationPeriodManagementContextService;
exports.EvaluationPeriodManagementContextService = EvaluationPeriodManagementContextService = EvaluationPeriodManagementContextService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(8, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(9, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(10, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(11, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(12, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __param(13, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(14, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __param(15, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus,
        evaluation_period_service_1.EvaluationPeriodService,
        evaluation_period_auto_phase_service_1.EvaluationPeriodAutoPhaseService,
        evaluation_project_assignment_service_1.EvaluationProjectAssignmentService,
        evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
        evaluation_line_mapping_service_1.EvaluationLineMappingService,
        evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EvaluationPeriodManagementContextService);
//# sourceMappingURL=evaluation-period-management.service.js.map