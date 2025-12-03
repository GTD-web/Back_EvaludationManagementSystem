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
var GetEvaluatorAssignedEmployeesDataHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEvaluatorAssignedEmployeesDataHandler = exports.GetEvaluatorAssignedEmployeesDataQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_entity_1 = require("../../../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../domain/common/department/department.entity");
const evaluation_line_mapping_entity_1 = require("../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_entity_1 = require("../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const evaluation_activity_log_context_service_1 = require("../../../evaluation-activity-log-context/evaluation-activity-log-context.service");
const get_employee_assigned_data_1 = require("./get-employee-assigned-data");
class GetEvaluatorAssignedEmployeesDataQuery {
    evaluationPeriodId;
    evaluatorId;
    employeeId;
    constructor(evaluationPeriodId, evaluatorId, employeeId) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.evaluatorId = evaluatorId;
        this.employeeId = employeeId;
    }
}
exports.GetEvaluatorAssignedEmployeesDataQuery = GetEvaluatorAssignedEmployeesDataQuery;
let GetEvaluatorAssignedEmployeesDataHandler = GetEvaluatorAssignedEmployeesDataHandler_1 = class GetEvaluatorAssignedEmployeesDataHandler {
    evaluationPeriodRepository;
    employeeRepository;
    departmentRepository;
    lineMappingRepository;
    evaluationLineRepository;
    periodEmployeeMappingRepository;
    employeeAssignedDataHandler;
    activityLogContextService;
    logger = new common_1.Logger(GetEvaluatorAssignedEmployeesDataHandler_1.name);
    constructor(evaluationPeriodRepository, employeeRepository, departmentRepository, lineMappingRepository, evaluationLineRepository, periodEmployeeMappingRepository, employeeAssignedDataHandler, activityLogContextService) {
        this.evaluationPeriodRepository = evaluationPeriodRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.lineMappingRepository = lineMappingRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.periodEmployeeMappingRepository = periodEmployeeMappingRepository;
        this.employeeAssignedDataHandler = employeeAssignedDataHandler;
        this.activityLogContextService = activityLogContextService;
    }
    async execute(query) {
        const { evaluationPeriodId, evaluatorId, employeeId } = query;
        this.logger.log('담당자의 피평가자 할당 정보 조회 시작', {
            evaluationPeriodId,
            evaluatorId,
            employeeId,
        });
        const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
            where: { id: evaluationPeriodId },
        });
        if (!evaluationPeriod) {
            throw new common_1.NotFoundException(`평가기간을 찾을 수 없습니다. (evaluationPeriodId: ${evaluationPeriodId})`);
        }
        const evaluator = await this.employeeRepository.findOne({
            where: { id: evaluatorId },
        });
        if (!evaluator) {
            throw new common_1.NotFoundException(`평가자를 찾을 수 없습니다. (evaluatorId: ${evaluatorId})`);
        }
        let evaluatorDepartmentName;
        if (evaluator.departmentId) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evaluator.departmentId);
            const department = await this.departmentRepository.findOne({
                where: isUUID
                    ? { id: evaluator.departmentId }
                    : { code: evaluator.departmentId },
            });
            evaluatorDepartmentName = department?.name;
        }
        const employeeMapping = await this.periodEmployeeMappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
            },
        });
        if (!employeeMapping) {
            throw new common_1.NotFoundException(`평가기간에 등록되지 않은 직원입니다. (employeeId: ${employeeId})`);
        }
        const evaluationMappings = await this.lineMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.deletedAt IS NULL')
            .getMany();
        if (evaluationMappings.length === 0) {
            throw new common_1.NotFoundException(`평가자가 해당 피평가자를 담당하지 않습니다. (evaluatorId: ${evaluatorId}, employeeId: ${employeeId})`);
        }
        const evaluationLineIds = evaluationMappings.map((m) => m.evaluationLineId);
        const evaluationLines = await this.evaluationLineRepository.findByIds(evaluationLineIds);
        const evaluatorTypes = evaluationLines.map((line) => line.evaluatorType);
        this.logger.log('평가자-피평가자 관계 확인 완료', {
            evaluatorId,
            employeeId,
            mappingCount: evaluationMappings.length,
            evaluatorTypes,
        });
        const evaluateeData = await this.employeeAssignedDataHandler.execute({
            evaluationPeriodId,
            employeeId,
        });
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId: evaluationPeriodId,
                employeeId,
                activityType: 'downward_evaluation',
                activityAction: 'viewed',
                activityTitle: '피평가자 할당 정보 조회',
                performedBy: evaluatorId,
                activityDate: new Date(),
                activityMetadata: {
                    evaluatorTypes,
                },
            });
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                evaluatorId,
                employeeId,
                error: error.message,
            });
        }
        const { evaluationPeriod: _, ...evaluateeWithoutPeriod } = evaluateeData;
        this.logger.log('담당자의 피평가자 할당 정보 조회 완료', {
            evaluatorId,
            employeeId,
        });
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
            evaluator: {
                id: evaluator.id,
                employeeNumber: evaluator.employeeNumber,
                name: evaluator.name,
                email: evaluator.email,
                phoneNumber: evaluator.phoneNumber,
                departmentId: evaluator.departmentId || '',
                departmentName: evaluatorDepartmentName,
                status: evaluator.status,
            },
            evaluatee: evaluateeWithoutPeriod,
        };
    }
};
exports.GetEvaluatorAssignedEmployeesDataHandler = GetEvaluatorAssignedEmployeesDataHandler;
exports.GetEvaluatorAssignedEmployeesDataHandler = GetEvaluatorAssignedEmployeesDataHandler = GetEvaluatorAssignedEmployeesDataHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEvaluatorAssignedEmployeesDataQuery),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_entity_1.EvaluationPeriod)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(3, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(5, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        get_employee_assigned_data_1.GetEmployeeAssignedDataHandler,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService])
], GetEvaluatorAssignedEmployeesDataHandler);
//# sourceMappingURL=get-evaluator-assigned-employees-data.query.js.map