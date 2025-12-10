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
var GetPeerEvaluationListHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPeerEvaluationListHandler = exports.GetPeerEvaluationListQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const peer_evaluation_entity_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const peer_evaluation_question_mapping_entity_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.entity");
const evaluation_question_entity_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.entity");
class GetPeerEvaluationListQuery {
    evaluatorId;
    evaluateeId;
    periodId;
    status;
    page;
    limit;
    constructor(evaluatorId, evaluateeId, periodId, status, page = 1, limit = 10) {
        this.evaluatorId = evaluatorId;
        this.evaluateeId = evaluateeId;
        this.periodId = periodId;
        this.status = status;
        this.page = page;
        this.limit = limit;
    }
}
exports.GetPeerEvaluationListQuery = GetPeerEvaluationListQuery;
let GetPeerEvaluationListHandler = GetPeerEvaluationListHandler_1 = class GetPeerEvaluationListHandler {
    peerEvaluationRepository;
    questionMappingRepository;
    logger = new common_1.Logger(GetPeerEvaluationListHandler_1.name);
    constructor(peerEvaluationRepository, questionMappingRepository) {
        this.peerEvaluationRepository = peerEvaluationRepository;
        this.questionMappingRepository = questionMappingRepository;
    }
    async execute(query) {
        const { evaluatorId, evaluateeId, periodId, status, page, limit } = query;
        const queryBuilder = this.peerEvaluationRepository
            .createQueryBuilder('evaluation')
            .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id = evaluation.periodId AND period.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'evaluator', 'evaluator.id = evaluation.evaluatorId AND evaluator.deletedAt IS NULL')
            .leftJoin(department_entity_1.Department, 'evaluatorDepartment', 'evaluatorDepartment.externalId = evaluator.departmentId AND evaluatorDepartment.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'evaluatee', 'evaluatee.id = evaluation.evaluateeId AND evaluatee.deletedAt IS NULL')
            .leftJoin(department_entity_1.Department, 'evaluateeDepartment', 'evaluateeDepartment.externalId = evaluatee.departmentId AND evaluateeDepartment.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'mappedByEmployee', '"mappedByEmployee"."id" = "evaluation"."mappedBy"::UUID AND "mappedByEmployee"."deletedAt" IS NULL')
            .select([
            'evaluation.id AS evaluation_id',
            'evaluation.evaluationDate AS evaluation_evaluationdate',
            'evaluation.status AS evaluation_status',
            'evaluation.isCompleted AS evaluation_iscompleted',
            'evaluation.completedAt AS evaluation_completedat',
            'evaluation.requestDeadline AS evaluation_requestdeadline',
            'evaluation.mappedDate AS evaluation_mappeddate',
            'evaluation.isActive AS evaluation_isactive',
            'evaluation.createdAt AS evaluation_createdat',
            'evaluation.updatedAt AS evaluation_updatedat',
            'evaluation.deletedAt AS evaluation_deletedat',
            'evaluation.version AS evaluation_version',
            'period.id AS period_id',
            'period.name AS period_name',
            'period.startDate AS period_startdate',
            'period.status AS period_status',
            'evaluator.id AS evaluator_id',
            'evaluator.name AS evaluator_name',
            'evaluator.employeeNumber AS evaluator_employeenumber',
            'evaluator.email AS evaluator_email',
            'evaluator.departmentId AS evaluator_departmentid',
            'evaluator.status AS evaluator_status',
            'evaluator.rankName AS evaluator_rankname',
            'evaluator.roles AS evaluator_roles',
            'evaluatorDepartment.id AS evaluatordepartment_id',
            'evaluatorDepartment.name AS evaluatordepartment_name',
            'evaluatorDepartment.code AS evaluatordepartment_code',
            'evaluatee.id AS evaluatee_id',
            'evaluatee.name AS evaluatee_name',
            'evaluatee.employeeNumber AS evaluatee_employeenumber',
            'evaluatee.email AS evaluatee_email',
            'evaluatee.departmentId AS evaluatee_departmentid',
            'evaluatee.status AS evaluatee_status',
            'evaluateeDepartment.id AS evaluateedepartment_id',
            'evaluateeDepartment.name AS evaluateedepartment_name',
            'evaluateeDepartment.code AS evaluateedepartment_code',
            'mappedByEmployee.id AS mappedby_id',
            'mappedByEmployee.name AS mappedby_name',
            'mappedByEmployee.employeeNumber AS mappedby_employeenumber',
            'mappedByEmployee.email AS mappedby_email',
            'mappedByEmployee.status AS mappedby_status',
        ])
            .where('evaluation.deletedAt IS NULL');
        if (evaluatorId) {
            queryBuilder.andWhere('evaluation.evaluatorId = :evaluatorId', {
                evaluatorId,
            });
        }
        if (evaluateeId) {
            queryBuilder.andWhere('evaluation.evaluateeId = :evaluateeId', {
                evaluateeId,
            });
        }
        if (periodId) {
            queryBuilder.andWhere('evaluation.periodId = :periodId', { periodId });
        }
        if (status) {
            queryBuilder.andWhere('evaluation.status = :status', {
                status: status,
            });
        }
        queryBuilder.orderBy('evaluation.createdAt', 'DESC');
        if (page && limit) {
            const offset = (page - 1) * limit;
            queryBuilder.skip(offset).take(limit);
        }
        const evaluations = await queryBuilder.getRawMany();
        const evaluationsWithQuestions = [];
        for (const evaluation of evaluations) {
            const questions = await this.questionMappingRepository
                .createQueryBuilder('mapping')
                .leftJoin(evaluation_question_entity_1.EvaluationQuestion, 'question', 'question.id = mapping.questionId AND question.deletedAt IS NULL')
                .select([
                'mapping.displayOrder AS displayorder',
                'mapping.answer AS mapping_answer',
                'mapping.score AS mapping_score',
                'mapping.answeredAt AS mapping_answeredat',
                'mapping.answeredBy AS mapping_answeredby',
                'question.id AS question_id',
                'question.text AS question_text',
                'question.minScore AS question_minscore',
                'question.maxScore AS question_maxscore',
            ])
                .where('mapping.peerEvaluationId = :evaluationId', {
                evaluationId: evaluation.evaluation_id,
            })
                .andWhere('mapping.deletedAt IS NULL')
                .orderBy('mapping.displayOrder', 'ASC')
                .getRawMany();
            evaluationsWithQuestions.push({
                id: evaluation.evaluation_id,
                evaluationDate: evaluation.evaluation_evaluationdate,
                status: evaluation.evaluation_status,
                isCompleted: evaluation.evaluation_iscompleted,
                completedAt: evaluation.evaluation_completedat,
                requestDeadline: evaluation.evaluation_requestdeadline,
                mappedDate: evaluation.evaluation_mappeddate,
                isActive: evaluation.evaluation_isactive,
                createdAt: evaluation.evaluation_createdat,
                updatedAt: evaluation.evaluation_updatedat,
                deletedAt: evaluation.evaluation_deletedat,
                version: evaluation.evaluation_version,
                period: evaluation.period_id
                    ? {
                        id: evaluation.period_id,
                        name: evaluation.period_name,
                        startDate: evaluation.period_startdate,
                        status: evaluation.period_status,
                    }
                    : null,
                evaluator: evaluation.evaluator_id
                    ? {
                        id: evaluation.evaluator_id,
                        name: evaluation.evaluator_name,
                        employeeNumber: evaluation.evaluator_employeenumber,
                        email: evaluation.evaluator_email,
                        departmentId: evaluation.evaluator_departmentid,
                        status: evaluation.evaluator_status,
                        rankName: evaluation.evaluator_rankname || '',
                        roles: evaluation.evaluator_roles || [],
                    }
                    : null,
                evaluatorDepartment: evaluation.evaluatordepartment_id
                    ? {
                        id: evaluation.evaluatordepartment_id,
                        name: evaluation.evaluatordepartment_name,
                        code: evaluation.evaluatordepartment_code,
                    }
                    : null,
                evaluatee: evaluation.evaluatee_id
                    ? {
                        id: evaluation.evaluatee_id,
                        name: evaluation.evaluatee_name,
                        employeeNumber: evaluation.evaluatee_employeenumber,
                        email: evaluation.evaluatee_email,
                        departmentId: evaluation.evaluatee_departmentid,
                        status: evaluation.evaluatee_status,
                    }
                    : null,
                evaluateeDepartment: evaluation.evaluateedepartment_id
                    ? {
                        id: evaluation.evaluateedepartment_id,
                        name: evaluation.evaluateedepartment_name,
                        code: evaluation.evaluateedepartment_code,
                    }
                    : null,
                mappedBy: evaluation.mappedby_id
                    ? {
                        id: evaluation.mappedby_id,
                        name: evaluation.mappedby_name,
                        employeeNumber: evaluation.mappedby_employeenumber,
                        email: evaluation.mappedby_email,
                        status: evaluation.mappedby_status,
                    }
                    : null,
                questions: questions.map((q) => ({
                    id: q.question_id,
                    text: q.question_text,
                    minScore: q.question_minscore,
                    maxScore: q.question_maxscore,
                    displayOrder: q.displayorder,
                    answer: q.mapping_answer,
                    score: q.mapping_score,
                    answeredAt: q.mapping_answeredat,
                    answeredBy: q.mapping_answeredby,
                })),
            });
        }
        const result = {
            evaluations: evaluationsWithQuestions,
            total: evaluationsWithQuestions.length,
            page,
            limit,
        };
        return result;
    }
};
exports.GetPeerEvaluationListHandler = GetPeerEvaluationListHandler;
exports.GetPeerEvaluationListHandler = GetPeerEvaluationListHandler = GetPeerEvaluationListHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetPeerEvaluationListQuery),
    __param(0, (0, typeorm_1.InjectRepository)(peer_evaluation_entity_1.PeerEvaluation)),
    __param(1, (0, typeorm_1.InjectRepository)(peer_evaluation_question_mapping_entity_1.PeerEvaluationQuestionMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GetPeerEvaluationListHandler);
//# sourceMappingURL=get-peer-evaluation-list.handler.js.map