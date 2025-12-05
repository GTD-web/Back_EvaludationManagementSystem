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
var GetMyEvaluationTargetsStatusHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMyEvaluationTargetsStatusHandler = exports.GetMyEvaluationTargetsStatusQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_line_mapping_entity_1 = require("../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_entity_1 = require("../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const downward_evaluation_entity_1 = require("../../../../domain/core/downward-evaluation/downward-evaluation.entity");
const evaluation_project_assignment_entity_1 = require("../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_evaluation_criteria_entity_1 = require("../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const wbs_self_evaluation_entity_1 = require("../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const evaluation_period_entity_1 = require("../../../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_activity_log_entity_1 = require("../../../../domain/core/evaluation-activity-log/evaluation-activity-log.entity");
const evaluation_line_types_1 = require("../../../../domain/core/evaluation-line/evaluation-line.types");
const downward_evaluation_score_utils_1 = require("../queries/get-employee-evaluation-period-status/downward-evaluation-score.utils");
const self_evaluation_utils_1 = require("../queries/get-employee-evaluation-period-status/self-evaluation.utils");
const evaluation_line_utils_1 = require("../queries/get-employee-evaluation-period-status/evaluation-line.utils");
const evaluation_criteria_utils_1 = require("../queries/get-employee-evaluation-period-status/evaluation-criteria.utils");
const employee_evaluation_step_approval_service_1 = require("../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service");
class GetMyEvaluationTargetsStatusQuery {
    evaluationPeriodId;
    evaluatorId;
    constructor(evaluationPeriodId, evaluatorId) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.evaluatorId = evaluatorId;
    }
}
exports.GetMyEvaluationTargetsStatusQuery = GetMyEvaluationTargetsStatusQuery;
let GetMyEvaluationTargetsStatusHandler = GetMyEvaluationTargetsStatusHandler_1 = class GetMyEvaluationTargetsStatusHandler {
    lineMappingRepository;
    lineRepository;
    mappingRepository;
    downwardEvaluationRepository;
    projectAssignmentRepository;
    wbsAssignmentRepository;
    wbsCriteriaRepository;
    wbsSelfEvaluationRepository;
    evaluationPeriodRepository;
    activityLogRepository;
    stepApprovalService;
    logger = new common_1.Logger(GetMyEvaluationTargetsStatusHandler_1.name);
    constructor(lineMappingRepository, lineRepository, mappingRepository, downwardEvaluationRepository, projectAssignmentRepository, wbsAssignmentRepository, wbsCriteriaRepository, wbsSelfEvaluationRepository, evaluationPeriodRepository, activityLogRepository, stepApprovalService) {
        this.lineMappingRepository = lineMappingRepository;
        this.lineRepository = lineRepository;
        this.mappingRepository = mappingRepository;
        this.downwardEvaluationRepository = downwardEvaluationRepository;
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.wbsCriteriaRepository = wbsCriteriaRepository;
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.activityLogRepository = activityLogRepository;
        this.stepApprovalService = stepApprovalService;
    }
    async execute(query) {
        const { evaluationPeriodId, evaluatorId } = query;
        try {
            const myTargetMappings = await this.lineMappingRepository
                .createQueryBuilder('mapping')
                .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
                .where('mapping.evaluatorId = :evaluatorId', { evaluatorId })
                .andWhere('mapping.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('mapping.deletedAt IS NULL')
                .getMany();
            if (myTargetMappings.length === 0) {
                this.logger.debug(`담당하는 평가 대상자가 없습니다 - 평가자: ${evaluatorId}`);
                return [];
            }
            const evaluationLineIds = [
                ...new Set(myTargetMappings.map((m) => m.evaluationLineId)),
            ];
            const evaluationLines = await this.lineRepository.findByIds(evaluationLineIds);
            const lineMap = new Map(evaluationLines.map((line) => [line.id, line.evaluatorType]));
            const employeeIds = [
                ...new Set(myTargetMappings.map((m) => m.employeeId)),
            ];
            const employeeMappings = await this.mappingRepository
                .createQueryBuilder('mapping')
                .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('mapping.employeeId IN (:...employeeIds)', { employeeIds })
                .getMany();
            if (employeeMappings.length === 0) {
                this.logger.debug(`해당 평가기간에 활성화된 평가 대상자가 없습니다 - 평가기간: ${evaluationPeriodId}`);
                return [];
            }
            const activeEmployeeIds = new Set(employeeMappings.map((m) => m.employeeId));
            const results = [];
            for (const mapping of employeeMappings) {
                try {
                    const employeeId = mapping.employeeId;
                    const myMappings = myTargetMappings.filter((m) => m.employeeId === employeeId &&
                        activeEmployeeIds.has(m.employeeId));
                    const evaluatorTypes = [
                        ...new Set(myMappings
                            .map((m) => lineMap.get(m.evaluationLineId))
                            .filter((type) => type !== undefined)),
                    ];
                    if (evaluatorTypes.length === 0) {
                        continue;
                    }
                    const exclusionInfo = {
                        isExcluded: mapping.isExcluded,
                        excludeReason: mapping.excludeReason ?? null,
                        excludedAt: mapping.excludedAt ?? null,
                    };
                    const projectCount = await this.projectAssignmentRepository.count({
                        where: {
                            periodId: evaluationPeriodId,
                            employeeId: employeeId,
                            deletedAt: (0, typeorm_2.IsNull)(),
                        },
                    });
                    const wbsCount = await this.wbsAssignmentRepository.count({
                        where: {
                            periodId: evaluationPeriodId,
                            employeeId: employeeId,
                            deletedAt: (0, typeorm_2.IsNull)(),
                        },
                    });
                    const evaluationCriteriaStatus = this.평가항목_상태를_계산한다(projectCount, wbsCount);
                    const assignedWbsList = await this.wbsAssignmentRepository.find({
                        where: {
                            periodId: evaluationPeriodId,
                            employeeId: employeeId,
                            deletedAt: (0, typeorm_2.IsNull)(),
                        },
                        select: ['wbsItemId'],
                    });
                    let wbsWithCriteriaCount = 0;
                    if (assignedWbsList.length > 0) {
                        const wbsItemIds = assignedWbsList.map((wbs) => wbs.wbsItemId);
                        const distinctWbsIdsWithCriteria = await this.wbsCriteriaRepository
                            .createQueryBuilder('criteria')
                            .select('DISTINCT criteria.wbsItemId', 'wbsItemId')
                            .where('criteria.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
                            .andWhere('criteria.deletedAt IS NULL')
                            .getRawMany();
                        wbsWithCriteriaCount = distinctWbsIdsWithCriteria.length;
                    }
                    const wbsCriteriaStatus = this.WBS평가기준_상태를_계산한다(wbsCount, wbsWithCriteriaCount);
                    const { hasPrimaryEvaluator, hasSecondaryEvaluator } = await (0, evaluation_line_utils_1.평가라인_지정_여부를_확인한다)(evaluationPeriodId, employeeId, this.lineRepository, this.lineMappingRepository);
                    const evaluationLineStatus = (0, evaluation_line_utils_1.평가라인_상태를_계산한다)(hasPrimaryEvaluator, hasSecondaryEvaluator);
                    const { totalWbsCount: perfTotalWbsCount, inputCompletedCount } = await this.성과입력_상태를_조회한다(evaluationPeriodId, employeeId);
                    const performanceInputStatus = this.성과입력_상태를_계산한다(perfTotalWbsCount, inputCompletedCount);
                    const selfEvaluationStatus = await (0, self_evaluation_utils_1.자기평가_진행_상태를_조회한다)(evaluationPeriodId, employeeId, this.wbsSelfEvaluationRepository, this.wbsAssignmentRepository, this.evaluationPeriodRepository);
                    const selfEvaluationStatusType = (0, self_evaluation_utils_1.자기평가_상태를_계산한다)(selfEvaluationStatus.totalMappingCount, selfEvaluationStatus.completedMappingCount);
                    const downwardEvaluationStatus = await this.내가_담당하는_하향평가_현황을_조회한다(evaluationPeriodId, employeeId, evaluatorId, evaluatorTypes);
                    const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
                    const setupStatus = (0, evaluation_criteria_utils_1.평가기준설정_상태를_계산한다)(evaluationCriteriaStatus, wbsCriteriaStatus, stepApproval?.criteriaSettingStatus ?? null, mapping.isCriteriaSubmitted || false);
                    const primaryEvaluationSubmitted = await this.일차평가_제출_여부를_확인한다(evaluationPeriodId, employeeId);
                    let viewedStatus = null;
                    if (selfEvaluationStatus.isSubmittedToEvaluator ||
                        primaryEvaluationSubmitted) {
                        viewedStatus = await this.평가자_확인여부를_계산한다(evaluationPeriodId, employeeId, evaluatorId, evaluatorTypes);
                    }
                    const selfEvaluationResult = {
                        status: selfEvaluationStatusType,
                        totalMappingCount: selfEvaluationStatus.totalMappingCount,
                        completedMappingCount: selfEvaluationStatus.completedMappingCount,
                        totalSelfEvaluations: selfEvaluationStatus.totalMappingCount,
                        submittedToEvaluatorCount: selfEvaluationStatus.submittedToEvaluatorCount,
                        isSubmittedToEvaluator: selfEvaluationStatus.isSubmittedToEvaluator,
                        submittedToManagerCount: selfEvaluationStatus.submittedToManagerCount,
                        isSubmittedToManager: selfEvaluationStatus.isSubmittedToManager,
                        totalScore: selfEvaluationStatus.totalScore,
                        grade: selfEvaluationStatus.grade,
                    };
                    if (viewedStatus) {
                        if (evaluatorTypes.includes(evaluation_line_types_1.EvaluatorType.PRIMARY)) {
                            selfEvaluationResult.viewedByPrimaryEvaluator =
                                viewedStatus.viewedByPrimaryEvaluator;
                        }
                        if (evaluatorTypes.includes(evaluation_line_types_1.EvaluatorType.SECONDARY)) {
                            selfEvaluationResult.viewedBySecondaryEvaluator =
                                viewedStatus.viewedBySecondaryEvaluator;
                        }
                    }
                    results.push({
                        employeeId,
                        isEvaluationTarget: !mapping.isExcluded,
                        exclusionInfo,
                        evaluationCriteria: {
                            status: evaluationCriteriaStatus,
                            assignedProjectCount: projectCount,
                            assignedWbsCount: wbsCount,
                        },
                        wbsCriteria: {
                            status: wbsCriteriaStatus,
                            wbsWithCriteriaCount,
                        },
                        evaluationLine: {
                            status: evaluationLineStatus,
                            hasPrimaryEvaluator,
                            hasSecondaryEvaluator,
                        },
                        setup: {
                            status: setupStatus,
                        },
                        performanceInput: {
                            status: performanceInputStatus,
                            totalWbsCount: perfTotalWbsCount,
                            inputCompletedCount,
                        },
                        myEvaluatorTypes: evaluatorTypes,
                        selfEvaluation: selfEvaluationResult,
                        downwardEvaluation: {
                            ...downwardEvaluationStatus,
                            secondaryStatus: downwardEvaluationStatus.secondaryStatus
                                ? this.이차평가_상태에_일차평가확인여부를_추가한다(downwardEvaluationStatus.secondaryStatus, viewedStatus, primaryEvaluationSubmitted, evaluatorTypes)
                                : null,
                        },
                    });
                }
                catch (error) {
                    this.logger.error(`피평가자 현황 조회 실패 - 직원: ${mapping.employeeId}`, error.stack);
                    continue;
                }
            }
            return results;
        }
        catch (error) {
            this.logger.error(`내가 담당하는 평가 대상자 현황 조회 실패 - 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`, error.stack);
            throw error;
        }
    }
    async 내가_담당하는_하향평가_현황을_조회한다(evaluationPeriodId, employeeId, evaluatorId, evaluatorTypes) {
        const isPrimary = evaluatorTypes.includes(evaluation_line_types_1.EvaluatorType.PRIMARY);
        const isSecondary = evaluatorTypes.includes(evaluation_line_types_1.EvaluatorType.SECONDARY);
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
                isExcluded: false,
            },
        });
        let primaryStatus = null;
        let secondaryStatus = null;
        if (isPrimary) {
            const evaluations = await this.downwardEvaluationRepository
                .createQueryBuilder('eval')
                .where('eval.periodId = :periodId', {
                periodId: evaluationPeriodId,
            })
                .andWhere('eval.employeeId = :employeeId', { employeeId })
                .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
                .andWhere('eval.evaluationType = :evaluationType', {
                evaluationType: 'primary',
            })
                .andWhere('eval.deletedAt IS NULL')
                .getMany();
            const assignedWbsCount = evaluations.length;
            const completedEvaluationCount = evaluations.filter((e) => e.downwardEvaluationScore !== null &&
                e.downwardEvaluationScore !== undefined).length;
            let totalScore = null;
            let grade = null;
            if (assignedWbsCount > 0 &&
                completedEvaluationCount === assignedWbsCount) {
                totalScore = await (0, downward_evaluation_score_utils_1.가중치_기반_1차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, [evaluatorId], this.downwardEvaluationRepository, this.wbsAssignmentRepository, this.evaluationPeriodRepository);
                if (totalScore !== null) {
                    grade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, totalScore, this.evaluationPeriodRepository);
                }
            }
            let status;
            if (assignedWbsCount === 0) {
                status = 'none';
            }
            else if (assignedWbsCount === completedEvaluationCount) {
                status = 'complete';
            }
            else {
                status = 'in_progress';
            }
            primaryStatus = {
                status,
                assignedWbsCount,
                completedEvaluationCount,
                totalScore,
                grade,
            };
        }
        if (isSecondary) {
            const evaluations = await this.downwardEvaluationRepository
                .createQueryBuilder('eval')
                .where('eval.periodId = :periodId', {
                periodId: evaluationPeriodId,
            })
                .andWhere('eval.employeeId = :employeeId', { employeeId })
                .andWhere('eval.evaluatorId = :evaluatorId', { evaluatorId })
                .andWhere('eval.evaluationType = :evaluationType', {
                evaluationType: 'secondary',
            })
                .andWhere('eval.deletedAt IS NULL')
                .getMany();
            const assignedWbsCount = evaluations.length;
            const completedEvaluationCount = evaluations.filter((e) => e.downwardEvaluationScore !== null &&
                e.downwardEvaluationScore !== undefined).length;
            let totalScore = null;
            let grade = null;
            if (assignedWbsCount > 0 &&
                completedEvaluationCount === assignedWbsCount) {
                totalScore = await (0, downward_evaluation_score_utils_1.가중치_기반_2차_하향평가_점수를_계산한다)(evaluationPeriodId, employeeId, [evaluatorId], this.downwardEvaluationRepository, this.wbsAssignmentRepository, this.evaluationPeriodRepository);
                if (totalScore !== null) {
                    grade = await (0, downward_evaluation_score_utils_1.하향평가_등급을_조회한다)(evaluationPeriodId, totalScore, this.evaluationPeriodRepository);
                }
            }
            let status;
            if (assignedWbsCount === 0) {
                status = 'none';
            }
            else if (assignedWbsCount === completedEvaluationCount) {
                status = 'complete';
            }
            else {
                status = 'in_progress';
            }
            secondaryStatus = {
                status,
                assignedWbsCount,
                completedEvaluationCount,
                totalScore,
                grade,
            };
        }
        const primaryStatusValue = primaryStatus?.status || 'none';
        const secondaryStatusValue = secondaryStatus?.status || 'none';
        let integratedStatus;
        if (primaryStatusValue === 'complete' ||
            secondaryStatusValue === 'complete') {
            integratedStatus = 'complete';
        }
        else if (primaryStatusValue === 'in_progress' ||
            secondaryStatusValue === 'in_progress') {
            integratedStatus = 'in_progress';
        }
        else {
            integratedStatus = 'none';
        }
        return {
            isPrimary,
            isSecondary,
            status: integratedStatus,
            primaryStatus,
            secondaryStatus,
        };
    }
    async 성과입력_상태를_조회한다(evaluationPeriodId, employeeId) {
        const totalWbsCount = await this.wbsSelfEvaluationRepository.count({
            where: {
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        const selfEvaluations = await this.wbsSelfEvaluationRepository.find({
            where: {
                periodId: evaluationPeriodId,
                employeeId: employeeId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        const inputCompletedCount = selfEvaluations.filter((evaluation) => evaluation.performanceResult &&
            evaluation.performanceResult.trim().length > 0).length;
        return { totalWbsCount, inputCompletedCount };
    }
    성과입력_상태를_계산한다(totalWbsCount, inputCompletedCount) {
        if (totalWbsCount === 0) {
            return 'none';
        }
        if (inputCompletedCount === 0) {
            return 'none';
        }
        else if (inputCompletedCount === totalWbsCount) {
            return 'complete';
        }
        else {
            return 'in_progress';
        }
    }
    평가항목_상태를_계산한다(projectCount, wbsCount) {
        const hasProject = projectCount > 0;
        const hasWbs = wbsCount > 0;
        if (hasProject && hasWbs) {
            return 'complete';
        }
        else if (hasProject || hasWbs) {
            return 'in_progress';
        }
        else {
            return 'none';
        }
    }
    WBS평가기준_상태를_계산한다(totalWbsCount, wbsWithCriteriaCount) {
        if (totalWbsCount === 0) {
            return 'none';
        }
        if (wbsWithCriteriaCount === 0) {
            return 'none';
        }
        else if (wbsWithCriteriaCount === totalWbsCount) {
            return 'complete';
        }
        else {
            return 'in_progress';
        }
    }
    async 일차평가_제출_여부를_확인한다(evaluationPeriodId, employeeId) {
        const primaryEvaluation = await this.downwardEvaluationRepository
            .createQueryBuilder('de')
            .where('de.periodId = :periodId', { periodId: evaluationPeriodId })
            .andWhere('de.employeeId = :employeeId', { employeeId })
            .andWhere('de.evaluationType = :type', { type: 'primary' })
            .andWhere('de.isCompleted = true')
            .andWhere('de.completedAt IS NOT NULL')
            .andWhere('de.deletedAt IS NULL')
            .limit(1)
            .getOne();
        return !!primaryEvaluation;
    }
    이차평가_상태에_일차평가확인여부를_추가한다(secondaryStatus, viewedStatus, primaryEvaluationSubmitted, evaluatorTypes) {
        const result = { ...secondaryStatus };
        if (evaluatorTypes.includes(evaluation_line_types_1.EvaluatorType.SECONDARY) &&
            viewedStatus &&
            primaryEvaluationSubmitted) {
            result.primaryEvaluationViewed = viewedStatus.primaryEvaluationViewed;
        }
        return result;
    }
    async 평가자_확인여부를_계산한다(evaluationPeriodId, employeeId, evaluatorId, evaluatorTypes) {
        const lastSelfEvaluationSubmitTime = await this.wbsSelfEvaluationRepository
            .createQueryBuilder('self')
            .where('self.periodId = :periodId', { periodId: evaluationPeriodId })
            .andWhere('self.employeeId = :employeeId', { employeeId })
            .andWhere('self.submittedToEvaluator = true')
            .andWhere('self.submittedToEvaluatorAt IS NOT NULL')
            .andWhere('self.deletedAt IS NULL')
            .orderBy('self.submittedToEvaluatorAt', 'DESC')
            .limit(1)
            .getOne();
        const lastPrimaryEvaluationSubmitTime = await this.downwardEvaluationRepository
            .createQueryBuilder('de')
            .where('de.periodId = :periodId', { periodId: evaluationPeriodId })
            .andWhere('de.employeeId = :employeeId', { employeeId })
            .andWhere('de.evaluationType = :type', { type: 'primary' })
            .andWhere('de.isCompleted = true')
            .andWhere('de.completedAt IS NOT NULL')
            .andWhere('de.deletedAt IS NULL')
            .orderBy('de.completedAt', 'DESC')
            .limit(1)
            .getOne();
        const lastViewedActivity = await this.activityLogRepository
            .createQueryBuilder('log')
            .where('log.periodId = :periodId', { periodId: evaluationPeriodId })
            .andWhere('log.employeeId = :employeeId', { employeeId })
            .andWhere('log.performedBy = :evaluatorId', { evaluatorId })
            .andWhere('log.activityAction = :action', { action: 'viewed' })
            .andWhere('log.activityType = :activityType', {
            activityType: 'downward_evaluation',
        })
            .andWhere('log.deletedAt IS NULL')
            .orderBy('log.activityDate', 'DESC')
            .limit(1)
            .getOne();
        const lastViewedTime = lastViewedActivity?.activityDate;
        let viewedByPrimaryEvaluator = false;
        let viewedBySecondaryEvaluator = false;
        let primaryEvaluationViewed = false;
        if (lastViewedTime) {
            if (evaluatorTypes.includes(evaluation_line_types_1.EvaluatorType.PRIMARY)) {
                if (lastSelfEvaluationSubmitTime?.submittedToEvaluatorAt &&
                    lastViewedTime >= lastSelfEvaluationSubmitTime.submittedToEvaluatorAt) {
                    viewedByPrimaryEvaluator = true;
                }
            }
            if (evaluatorTypes.includes(evaluation_line_types_1.EvaluatorType.SECONDARY)) {
                if (lastSelfEvaluationSubmitTime?.submittedToEvaluatorAt &&
                    lastViewedTime >= lastSelfEvaluationSubmitTime.submittedToEvaluatorAt) {
                    viewedBySecondaryEvaluator = true;
                }
                if (lastPrimaryEvaluationSubmitTime?.completedAt &&
                    lastViewedTime >= lastPrimaryEvaluationSubmitTime.completedAt) {
                    primaryEvaluationViewed = true;
                }
            }
        }
        return {
            viewedByPrimaryEvaluator,
            viewedBySecondaryEvaluator,
            primaryEvaluationViewed,
        };
    }
};
exports.GetMyEvaluationTargetsStatusHandler = GetMyEvaluationTargetsStatusHandler;
exports.GetMyEvaluationTargetsStatusHandler = GetMyEvaluationTargetsStatusHandler = GetMyEvaluationTargetsStatusHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetMyEvaluationTargetsStatusQuery),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __param(3, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(5, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(6, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __param(7, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __param(8, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(9, (0, typeorm_1.InjectRepository)(evaluation_activity_log_entity_1.EvaluationActivityLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        employee_evaluation_step_approval_service_1.EmployeeEvaluationStepApprovalService])
], GetMyEvaluationTargetsStatusHandler);
//# sourceMappingURL=get-my-evaluation-targets-status.query.js.map