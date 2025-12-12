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
var GetWbsSelfEvaluationDetailHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWbsSelfEvaluationDetailHandler = exports.GetWbsSelfEvaluationDetailQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_self_evaluation_entity_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
class GetWbsSelfEvaluationDetailQuery {
    evaluationId;
    constructor(evaluationId) {
        this.evaluationId = evaluationId;
    }
}
exports.GetWbsSelfEvaluationDetailQuery = GetWbsSelfEvaluationDetailQuery;
let GetWbsSelfEvaluationDetailHandler = GetWbsSelfEvaluationDetailHandler_1 = class GetWbsSelfEvaluationDetailHandler {
    wbsSelfEvaluationRepository;
    logger = new common_1.Logger(GetWbsSelfEvaluationDetailHandler_1.name);
    constructor(wbsSelfEvaluationRepository) {
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
    }
    async execute(query) {
        const { evaluationId } = query;
        this.logger.log('WBS 자기평가 상세정보 조회 핸들러 실행', { evaluationId });
        const result = await this.wbsSelfEvaluationRepository
            .createQueryBuilder('evaluation')
            .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id = evaluation.periodId AND period.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id = evaluation.employeeId AND employee.deletedAt IS NULL')
            .leftJoin(wbs_item_entity_1.WbsItem, 'wbsitem', 'wbsitem.id = evaluation.wbsItemId AND wbsitem.deletedAt IS NULL')
            .select([
            'evaluation.id AS evaluation_id',
            'evaluation.periodId AS evaluation_periodid',
            'evaluation.employeeId AS evaluation_employeeid',
            'evaluation.wbsItemId AS evaluation_wbsitemid',
            'evaluation.assignedBy AS evaluation_assignedby',
            'evaluation.assignedDate AS evaluation_assigneddate',
            'evaluation.submittedToEvaluator AS evaluation_submittedtoevaluator',
            'evaluation.submittedToEvaluatorAt AS evaluation_submittedtoevaluatorat',
            'evaluation.submittedToManager AS evaluation_submittedtomanager',
            'evaluation.submittedToManagerAt AS evaluation_submittedtomanagerat',
            'evaluation.evaluationDate AS evaluation_evaluationdate',
            'evaluation.performanceResult AS evaluation_performanceresult',
            'evaluation.selfEvaluationContent AS evaluation_selfevaluationcontent',
            'evaluation.selfEvaluationScore AS evaluation_selfevaluationscore',
            'evaluation.subProject AS evaluation_subproject',
            'evaluation.createdAt AS evaluation_createdat',
            'evaluation.updatedAt AS evaluation_updatedat',
            'evaluation.deletedAt AS evaluation_deletedat',
            'evaluation.createdBy AS evaluation_createdby',
            'evaluation.updatedBy AS evaluation_updatedby',
            'evaluation.version AS evaluation_version',
            'period.id AS period_id',
            'period.name AS period_name',
            'period.startDate AS period_startdate',
            'period.status AS period_status',
            'period.description AS period_description',
            'employee.id AS employee_id',
            'employee.employeeNumber AS employee_employeenumber',
            'employee.name AS employee_name',
            'employee.email AS employee_email',
            'employee.departmentId AS employee_departmentid',
            'wbsitem.id AS wbsitem_id',
            'wbsitem.wbsCode AS wbsitem_wbscode',
            'wbsitem.title AS wbsitem_title',
            'wbsitem.startDate AS wbsitem_startdate',
            'wbsitem.endDate AS wbsitem_enddate',
            'wbsitem.status AS wbsitem_status',
            'wbsitem.progressPercentage AS wbsitem_progresspercentage',
            'wbsitem.projectId AS wbsitem_projectid',
        ])
            .where('evaluation.id = :evaluationId', { evaluationId })
            .andWhere('evaluation.deletedAt IS NULL')
            .getRawOne();
        if (!result || !result.evaluation_id) {
            throw new common_1.NotFoundException('존재하지 않는 자기평가입니다.');
        }
        this.logger.log('WBS 자기평가 상세정보 조회 완료', { evaluationId });
        return {
            id: result.evaluation_id,
            periodId: result.evaluation_periodid,
            employeeId: result.evaluation_employeeid,
            wbsItemId: result.evaluation_wbsitemid,
            assignedBy: result.evaluation_assignedby,
            assignedDate: result.evaluation_assigneddate,
            submittedToEvaluator: result.evaluation_submittedtoevaluator,
            submittedToEvaluatorAt: result.evaluation_submittedtoevaluatorat,
            submittedToManager: result.evaluation_submittedtomanager,
            submittedToManagerAt: result.evaluation_submittedtomanagerat,
            evaluationDate: result.evaluation_evaluationdate,
            performanceResult: result.evaluation_performanceresult,
            selfEvaluationContent: result.evaluation_selfevaluationcontent,
            selfEvaluationScore: result.evaluation_selfevaluationscore,
            subProject: result.evaluation_subproject || null,
            createdAt: result.evaluation_createdat,
            updatedAt: result.evaluation_updatedat,
            deletedAt: result.evaluation_deletedat,
            createdBy: result.evaluation_createdby,
            updatedBy: result.evaluation_updatedby,
            version: result.evaluation_version,
            evaluationPeriod: result.period_id
                ? {
                    id: result.period_id,
                    name: result.period_name,
                    startDate: result.period_startdate,
                    status: result.period_status,
                    description: result.period_description,
                }
                : null,
            employee: result.employee_id
                ? {
                    id: result.employee_id,
                    employeeNumber: result.employee_employeenumber,
                    name: result.employee_name,
                    email: result.employee_email,
                    departmentId: result.employee_departmentid,
                }
                : null,
            wbsItem: result.wbsitem_id
                ? {
                    id: result.wbsitem_id,
                    wbsCode: result.wbsitem_wbscode,
                    title: result.wbsitem_title,
                    startDate: result.wbsitem_startdate,
                    endDate: result.wbsitem_enddate,
                    status: result.wbsitem_status,
                    progressPercentage: result.wbsitem_progresspercentage,
                    projectId: result.wbsitem_projectid,
                }
                : null,
        };
    }
};
exports.GetWbsSelfEvaluationDetailHandler = GetWbsSelfEvaluationDetailHandler;
exports.GetWbsSelfEvaluationDetailHandler = GetWbsSelfEvaluationDetailHandler = GetWbsSelfEvaluationDetailHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetWbsSelfEvaluationDetailQuery),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetWbsSelfEvaluationDetailHandler);
//# sourceMappingURL=get-wbs-self-evaluation-detail.handler.js.map