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
var GetAllEmployeesEvaluationPeriodStatusHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllEmployeesEvaluationPeriodStatusHandler = exports.GetAllEmployeesEvaluationPeriodStatusQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_entity_1 = require("../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_entity_1 = require("../../../../domain/common/employee/employee.entity");
const get_employee_evaluation_period_status_1 = require("./get-employee-evaluation-period-status");
class GetAllEmployeesEvaluationPeriodStatusQuery {
    evaluationPeriodId;
    includeUnregistered;
    constructor(evaluationPeriodId, includeUnregistered = false) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.includeUnregistered = includeUnregistered;
    }
}
exports.GetAllEmployeesEvaluationPeriodStatusQuery = GetAllEmployeesEvaluationPeriodStatusQuery;
let GetAllEmployeesEvaluationPeriodStatusHandler = GetAllEmployeesEvaluationPeriodStatusHandler_1 = class GetAllEmployeesEvaluationPeriodStatusHandler {
    mappingRepository;
    singleStatusHandler;
    logger = new common_1.Logger(GetAllEmployeesEvaluationPeriodStatusHandler_1.name);
    constructor(mappingRepository, singleStatusHandler) {
        this.mappingRepository = mappingRepository;
        this.singleStatusHandler = singleStatusHandler;
    }
    async execute(query) {
        const { evaluationPeriodId, includeUnregistered } = query;
        try {
            const queryBuilder = this.mappingRepository
                .createQueryBuilder('mapping')
                .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id = mapping.employeeId AND employee.deletedAt IS NULL')
                .select('mapping.employeeId', 'employeeId')
                .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('employee.isExcludedFromList = :isExcludedFromList', {
                isExcludedFromList: false,
            });
            if (!includeUnregistered) {
                queryBuilder.andWhere('mapping.deletedAt IS NULL');
            }
            const sql = queryBuilder.getSql();
            if (includeUnregistered) {
                queryBuilder.withDeleted();
            }
            const mappings = await queryBuilder.getRawMany();
            const statusPromises = mappings.map(async (mapping) => {
                try {
                    const singleQuery = new get_employee_evaluation_period_status_1.GetEmployeeEvaluationPeriodStatusQuery(evaluationPeriodId, mapping.employeeId, includeUnregistered);
                    const status = await this.singleStatusHandler.execute(singleQuery);
                    return status;
                }
                catch (error) {
                    this.logger.error(`직원 현황 조회 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${mapping.employeeId}`, error.stack);
                    return null;
                }
            });
            const allStatuses = await Promise.all(statusPromises);
            const results = allStatuses.filter((status) => status !== null);
            return results;
        }
        catch (error) {
            this.logger.error(`평가기간의 모든 피평가자 현황 조회 실패 - 평가기간: ${evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
};
exports.GetAllEmployeesEvaluationPeriodStatusHandler = GetAllEmployeesEvaluationPeriodStatusHandler;
exports.GetAllEmployeesEvaluationPeriodStatusHandler = GetAllEmployeesEvaluationPeriodStatusHandler = GetAllEmployeesEvaluationPeriodStatusHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetAllEmployeesEvaluationPeriodStatusQuery),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        get_employee_evaluation_period_status_1.GetEmployeeEvaluationPeriodStatusHandler])
], GetAllEmployeesEvaluationPeriodStatusHandler);
//# sourceMappingURL=get-all-employees-evaluation-period-status.query.js.map