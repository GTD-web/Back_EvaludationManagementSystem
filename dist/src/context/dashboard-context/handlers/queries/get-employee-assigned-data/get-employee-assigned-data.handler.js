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
exports.GetEmployeeAssignedDataHandler = exports.GetEmployeeAssignedDataQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_wbs_assignment_entity_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const wbs_evaluation_criteria_entity_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const wbs_self_evaluation_entity_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_entity_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.entity");
const evaluation_line_entity_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_mapping_entity_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const deliverable_entity_1 = require("../../../../../domain/core/deliverable/deliverable.entity");
const evaluation_period_employee_mapping_exceptions_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.exceptions");
const evaluation_activity_log_context_service_1 = require("../../../../evaluation-activity-log-context/evaluation-activity-log-context.service");
const project_wbs_utils_1 = require("./project-wbs.utils");
const summary_calculation_utils_1 = require("./summary-calculation.utils");
const typeorm_3 = require("typeorm");
class GetEmployeeAssignedDataQuery {
    evaluationPeriodId;
    employeeId;
    viewerId;
    constructor(evaluationPeriodId, employeeId, viewerId) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.employeeId = employeeId;
        this.viewerId = viewerId;
    }
}
exports.GetEmployeeAssignedDataQuery = GetEmployeeAssignedDataQuery;
let GetEmployeeAssignedDataHandler = class GetEmployeeAssignedDataHandler {
    evaluationPeriodRepository;
    employeeRepository;
    departmentRepository;
    mappingRepository;
    projectAssignmentRepository;
    wbsAssignmentRepository;
    wbsItemRepository;
    criteriaRepository;
    selfEvaluationRepository;
    downwardEvaluationRepository;
    evaluationLineRepository;
    evaluationLineMappingRepository;
    deliverableRepository;
    activityLogContextService;
    logger = { log: () => { }, warn: () => { }, error: () => { }, debug: () => { } };
    constructor(evaluationPeriodRepository, employeeRepository, departmentRepository, mappingRepository, projectAssignmentRepository, wbsAssignmentRepository, wbsItemRepository, criteriaRepository, selfEvaluationRepository, downwardEvaluationRepository, evaluationLineRepository, evaluationLineMappingRepository, deliverableRepository, activityLogContextService) {
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.mappingRepository = mappingRepository;
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.wbsItemRepository = wbsItemRepository;
        this.criteriaRepository = criteriaRepository;
        this.selfEvaluationRepository = selfEvaluationRepository;
        this.downwardEvaluationRepository = downwardEvaluationRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.deliverableRepository = deliverableRepository;
        this.activityLogContextService = activityLogContextService;
    }
    async execute(query) {
        const { evaluationPeriodId, employeeId, viewerId } = query;
        this.logger.log('사용자 할당 정보 조회 시작', {
            evaluationPeriodId,
            employeeId,
            viewerId,
        });
        const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
            where: { id: evaluationPeriodId },
        });
        if (!evaluationPeriod) {
            throw new common_1.NotFoundException(`평가기간을 찾을 수 없습니다. (evaluationPeriodId: ${evaluationPeriodId})`);
        }
        const employee = await this.employeeRepository.findOne({
            where: { id: employeeId },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`직원을 찾을 수 없습니다. (employeeId: ${employeeId})`);
        }
        let departmentName;
        if (employee.departmentId) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employee.departmentId);
            const department = await this.departmentRepository.findOne({
                where: isUUID
                    ? { id: employee.departmentId }
                    : { code: employee.departmentId },
            });
            departmentName = department?.name;
        }
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
            },
        });
        if (!mapping) {
            throw new common_1.NotFoundException(`평가기간에 등록되지 않은 직원입니다. (evaluationPeriodId: ${evaluationPeriodId}, employeeId: ${employeeId})`);
        }
        if (mapping.isExcluded) {
            throw new evaluation_period_employee_mapping_exceptions_1.ExcludedEvaluationTargetAccessException(evaluationPeriodId, employeeId);
        }
        const projects = await (0, project_wbs_utils_1.getProjectsWithWbs)(evaluationPeriodId, employeeId, mapping, this.projectAssignmentRepository, this.wbsAssignmentRepository, this.wbsItemRepository, this.criteriaRepository, this.selfEvaluationRepository, this.downwardEvaluationRepository, this.evaluationLineMappingRepository, this.deliverableRepository, this.employeeRepository);
        let completedPerformances = 0;
        const totalWbs = projects.reduce((sum, project) => {
            project.wbsList.forEach((wbs) => {
                if (wbs.performance?.isCompleted)
                    completedPerformances++;
            });
            return sum + project.wbsList.length;
        }, 0);
        const totalSelfEvaluations = await this.selfEvaluationRepository
            .createQueryBuilder('self_eval')
            .leftJoin('evaluation_wbs_assignment', 'wbs_assignment', 'wbs_assignment.wbsItemId = self_eval.wbsItemId AND wbs_assignment.periodId = self_eval.periodId AND wbs_assignment.employeeId = self_eval.employeeId AND wbs_assignment.deletedAt IS NULL')
            .leftJoin('evaluation_project_assignment', 'project_assignment', 'project_assignment.projectId = wbs_assignment.projectId AND project_assignment.periodId = wbs_assignment.periodId AND project_assignment.employeeId = wbs_assignment.employeeId AND project_assignment.deletedAt IS NULL')
            .where('self_eval.periodId = :periodId', { periodId: evaluationPeriodId })
            .andWhere('self_eval.employeeId = :employeeId', { employeeId })
            .andWhere('self_eval.deletedAt IS NULL')
            .andWhere('project_assignment.id IS NOT NULL')
            .getCount();
        const submittedToEvaluatorCount = await this.selfEvaluationRepository
            .createQueryBuilder('self_eval')
            .leftJoin('evaluation_wbs_assignment', 'wbs_assignment', 'wbs_assignment.wbsItemId = self_eval.wbsItemId AND wbs_assignment.periodId = self_eval.periodId AND wbs_assignment.employeeId = self_eval.employeeId AND wbs_assignment.deletedAt IS NULL')
            .leftJoin('evaluation_project_assignment', 'project_assignment', 'project_assignment.projectId = wbs_assignment.projectId AND project_assignment.periodId = wbs_assignment.periodId AND project_assignment.employeeId = wbs_assignment.employeeId AND project_assignment.deletedAt IS NULL')
            .where('self_eval.periodId = :periodId', { periodId: evaluationPeriodId })
            .andWhere('self_eval.employeeId = :employeeId', { employeeId })
            .andWhere('self_eval.submittedToEvaluator = :submittedToEvaluator', {
            submittedToEvaluator: true,
        })
            .andWhere('self_eval.deletedAt IS NULL')
            .andWhere('project_assignment.id IS NOT NULL')
            .getCount();
        const submittedToManagerCount = await this.selfEvaluationRepository
            .createQueryBuilder('self_eval')
            .leftJoin('evaluation_wbs_assignment', 'wbs_assignment', 'wbs_assignment.wbsItemId = self_eval.wbsItemId AND wbs_assignment.periodId = self_eval.periodId AND wbs_assignment.employeeId = self_eval.employeeId AND wbs_assignment.deletedAt IS NULL')
            .leftJoin('evaluation_project_assignment', 'project_assignment', 'project_assignment.projectId = wbs_assignment.projectId AND project_assignment.periodId = wbs_assignment.periodId AND project_assignment.employeeId = wbs_assignment.employeeId AND project_assignment.deletedAt IS NULL')
            .where('self_eval.periodId = :periodId', { periodId: evaluationPeriodId })
            .andWhere('self_eval.employeeId = :employeeId', { employeeId })
            .andWhere('self_eval.submittedToManager = :submittedToManager', {
            submittedToManager: true,
        })
            .andWhere('self_eval.deletedAt IS NULL')
            .andWhere('project_assignment.id IS NOT NULL')
            .getCount();
        const completedSelfEvaluations = submittedToManagerCount;
        const selfEvaluationScore = await (0, summary_calculation_utils_1.calculateSelfEvaluationScore)(evaluationPeriodId, employeeId, completedSelfEvaluations, this.selfEvaluationRepository, this.wbsAssignmentRepository, this.evaluationPeriodRepository);
        const isSubmittedToEvaluator = totalSelfEvaluations > 0 &&
            submittedToEvaluatorCount === totalSelfEvaluations;
        const isSubmittedToManager = totalSelfEvaluations > 0 &&
            submittedToManagerCount === totalSelfEvaluations;
        const selfEvaluation = {
            ...selfEvaluationScore,
            totalSelfEvaluations,
            submittedToEvaluatorCount,
            submittedToManagerCount,
            isSubmittedToEvaluator,
            isSubmittedToManager,
        };
        const primaryDownwardEvaluation = await (0, summary_calculation_utils_1.calculatePrimaryDownwardEvaluationScore)(evaluationPeriodId, employeeId, this.evaluationLineMappingRepository, this.downwardEvaluationRepository, this.wbsAssignmentRepository, this.evaluationPeriodRepository);
        const secondaryDownwardEvaluation = await (0, summary_calculation_utils_1.calculateSecondaryDownwardEvaluationScore)(evaluationPeriodId, employeeId, this.evaluationLineMappingRepository, this.downwardEvaluationRepository, this.wbsAssignmentRepository, this.evaluationPeriodRepository, this.employeeRepository);
        const summary = {
            totalProjects: projects.length,
            totalWbs,
            completedPerformances,
            completedSelfEvaluations,
            selfEvaluation,
            primaryDownwardEvaluation,
            secondaryDownwardEvaluation,
            criteriaSubmission: {
                isSubmitted: mapping.isCriteriaSubmitted || false,
                submittedAt: mapping.criteriaSubmittedAt || null,
                submittedBy: mapping.criteriaSubmittedBy || null,
            },
        };
        if (viewerId) {
            try {
                const evaluationMappings = await this.evaluationLineMappingRepository.find({
                    where: {
                        evaluationPeriodId,
                        evaluatorId: viewerId,
                        employeeId,
                        deletedAt: (0, typeorm_3.IsNull)(),
                    },
                });
                if (evaluationMappings.length > 0) {
                    const evaluationLineIds = [
                        ...new Set(evaluationMappings.map((m) => m.evaluationLineId)),
                    ];
                    const evaluationLines = await this.evaluationLineRepository.find({
                        where: {
                            id: (0, typeorm_3.In)(evaluationLineIds),
                            deletedAt: (0, typeorm_3.IsNull)(),
                        },
                    });
                    const evaluatorTypes = evaluationLines.map((line) => line.evaluatorType);
                    await this.activityLogContextService.활동내역을_기록한다({
                        periodId: evaluationPeriodId,
                        employeeId,
                        activityType: 'downward_evaluation',
                        activityAction: 'viewed',
                        activityTitle: '피평가자 할당 정보 조회',
                        performedBy: viewerId,
                        activityDate: new Date(),
                        activityMetadata: {
                            evaluatorTypes,
                        },
                    });
                    this.logger.log('평가자 활동 로그 기록 완료', {
                        evaluatorId: viewerId,
                        employeeId,
                        evaluatorTypes,
                    });
                }
                else {
                    this.logger.log('평가자-피평가자 관계 없음 - Activity Log 기록 생략', {
                        viewerId,
                        employeeId,
                    });
                }
            }
            catch (error) {
                this.logger.warn('활동 내역 기록 실패', {
                    viewerId,
                    employeeId,
                    error: error.message,
                    stack: error.stack,
                });
            }
        }
        return {
            evaluationPeriod: {
                id: evaluationPeriod.id,
                name: evaluationPeriod.name,
                startDate: evaluationPeriod.startDate,
                status: evaluationPeriod.status,
                currentPhase: evaluationPeriod.currentPhase,
                description: evaluationPeriod.description,
                criteriaSettingEnabled: evaluationPeriod.criteriaSettingEnabled,
                selfEvaluationSettingEnabled: evaluationPeriod.selfEvaluationSettingEnabled,
                finalEvaluationSettingEnabled: evaluationPeriod.finalEvaluationSettingEnabled,
                maxSelfEvaluationRate: evaluationPeriod.maxSelfEvaluationRate,
            },
            employee: {
                id: employee.id,
                employeeNumber: employee.employeeNumber,
                name: employee.name,
                email: employee.email,
                phoneNumber: employee.phoneNumber,
                departmentId: employee.departmentId || '',
                departmentName,
                status: employee.status,
            },
            projects,
            summary,
        };
    }
};
exports.GetEmployeeAssignedDataHandler = GetEmployeeAssignedDataHandler;
exports.GetEmployeeAssignedDataHandler = GetEmployeeAssignedDataHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEmployeeAssignedDataQuery),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(3, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(5, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(6, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __param(7, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __param(8, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __param(9, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __param(10, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(11, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(12, (0, typeorm_1.InjectRepository)(deliverable_entity_1.Deliverable)),
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
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService])
], GetEmployeeAssignedDataHandler);
//# sourceMappingURL=get-employee-assigned-data.handler.js.map