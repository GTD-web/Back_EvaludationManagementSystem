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
var BulkSubmitDownwardEvaluationsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkSubmitDownwardEvaluationsHandler = exports.BulkSubmitDownwardEvaluationsCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downward_evaluation_entity_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.entity");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
const evaluation_line_mapping_entity_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_entity_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
const evaluation_wbs_assignment_entity_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
class BulkSubmitDownwardEvaluationsCommand {
    evaluatorId;
    evaluateeId;
    periodId;
    evaluationType;
    submittedBy;
    forceSubmit;
    constructor(evaluatorId, evaluateeId, periodId, evaluationType, submittedBy = '시스템', forceSubmit = false) {
        this.evaluatorId = evaluatorId;
        this.evaluateeId = evaluateeId;
        this.periodId = periodId;
        this.evaluationType = evaluationType;
        this.submittedBy = submittedBy;
        this.forceSubmit = forceSubmit;
    }
}
exports.BulkSubmitDownwardEvaluationsCommand = BulkSubmitDownwardEvaluationsCommand;
let BulkSubmitDownwardEvaluationsHandler = BulkSubmitDownwardEvaluationsHandler_1 = class BulkSubmitDownwardEvaluationsHandler {
    downwardEvaluationRepository;
    evaluationLineMappingRepository;
    evaluationLineRepository;
    wbsAssignmentRepository;
    employeeRepository;
    downwardEvaluationService;
    transactionManager;
    logger = new common_1.Logger(BulkSubmitDownwardEvaluationsHandler_1.name);
    constructor(downwardEvaluationRepository, evaluationLineMappingRepository, evaluationLineRepository, wbsAssignmentRepository, employeeRepository, downwardEvaluationService, transactionManager) {
        this.downwardEvaluationRepository = downwardEvaluationRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.employeeRepository = employeeRepository;
        this.downwardEvaluationService = downwardEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluatorId, evaluateeId, periodId, evaluationType, submittedBy, forceSubmit } = command;
        this.logger.log('피평가자의 모든 하향평가 일괄 제출 핸들러 실행', {
            evaluatorId,
            evaluateeId,
            periodId,
            evaluationType,
            forceSubmit,
        });
        return await this.transactionManager.executeTransaction(async () => {
            await this.할당된_WBS에_대한_하향평가를_생성한다(evaluatorId, evaluateeId, periodId, evaluationType, submittedBy, forceSubmit);
            const evaluations = await this.downwardEvaluationRepository.find({
                where: {
                    evaluatorId,
                    employeeId: evaluateeId,
                    periodId,
                    evaluationType,
                    deletedAt: null,
                },
            });
            if (evaluations.length === 0) {
                this.logger.debug(`하향평가가 없어 제출을 건너뜀 - 평가자: ${evaluatorId}, 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가유형: ${evaluationType}`);
                return {
                    submittedCount: 0,
                    skippedCount: 0,
                    failedCount: 0,
                    submittedIds: [],
                    skippedIds: [],
                    failedItems: [],
                };
            }
            const submittedIds = [];
            const skippedIds = [];
            const failedItems = [];
            const submitter = await this.employeeRepository.findOne({
                where: { id: submittedBy, deletedAt: (0, typeorm_2.IsNull)() },
                select: ['id', 'name'],
            });
            const submitterName = submitter?.name || '평가자';
            for (const evaluation of evaluations) {
                try {
                    if (evaluation.완료되었는가()) {
                        skippedIds.push(evaluation.id);
                        this.logger.debug(`이미 완료된 평가는 건너뜀: ${evaluation.id}`);
                        continue;
                    }
                    const updateData = { isCompleted: true };
                    if (!evaluation.downwardEvaluationContent?.trim()) {
                        updateData.downwardEvaluationContent = `${submitterName}님이 미입력 상태에서 제출하였습니다.`;
                        this.logger.debug(`빈 content로 인한 기본 메시지 생성: ${evaluation.id}`);
                    }
                    await this.downwardEvaluationService.수정한다(evaluation.id, updateData, submittedBy);
                    submittedIds.push(evaluation.id);
                    this.logger.debug(`하향평가 제출 완료: ${evaluation.id}`);
                }
                catch (error) {
                    failedItems.push({
                        evaluationId: evaluation.id,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    this.logger.error(`하향평가 제출 실패: ${evaluation.id}`, error instanceof Error ? error.stack : undefined);
                }
            }
            const result = {
                submittedCount: submittedIds.length,
                skippedCount: skippedIds.length,
                failedCount: failedItems.length,
                submittedIds,
                skippedIds,
                failedItems,
            };
            this.logger.log('피평가자의 모든 하향평가 일괄 제출 완료', {
                totalCount: evaluations.length,
                ...result,
            });
            return result;
        });
    }
    async 할당된_WBS에_대한_하향평가를_생성한다(evaluatorId, evaluateeId, periodId, evaluationType, createdBy, isApprovalMode = false) {
        this.logger.log(`할당된 WBS에 대한 하향평가 생성 시작 - 평가자: ${evaluatorId}, 피평가자: ${evaluateeId}, 평가유형: ${evaluationType}, 승인모드: ${isApprovalMode}`);
        let approverName = '시스템';
        if (isApprovalMode) {
            const approver = await this.employeeRepository.findOne({
                where: { id: createdBy, deletedAt: (0, typeorm_2.IsNull)() },
                select: ['id', 'name'],
            });
            approverName = approver?.name || '관리자';
        }
        let assignedWbsIds = [];
        if (evaluationType === downward_evaluation_types_1.DownwardEvaluationType.SECONDARY) {
            const secondaryLine = await this.evaluationLineRepository.findOne({
                where: {
                    evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            if (!secondaryLine) {
                this.logger.warn('2차 평가라인을 찾을 수 없습니다.');
                return;
            }
            const assignedMappings = await this.evaluationLineMappingRepository
                .createQueryBuilder('mapping')
                .select(['mapping.wbsItemId'])
                .leftJoin(evaluation_line_entity_1.EvaluationLine, 'line', 'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL')
                .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId: periodId,
            })
                .andWhere('mapping.employeeId = :employeeId', { employeeId: evaluateeId })
                .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
                .andWhere('line.evaluatorType = :evaluatorType', {
                evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
            })
                .andWhere('mapping.deletedAt IS NULL')
                .andWhere('mapping.wbsItemId IS NOT NULL')
                .getRawMany();
            assignedWbsIds = assignedMappings
                .map((m) => m.mapping_wbsItemId)
                .filter((id) => id !== null);
        }
        else {
            const wbsAssignments = await this.wbsAssignmentRepository.find({
                where: {
                    periodId,
                    employeeId: evaluateeId,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
                select: ['wbsItemId'],
            });
            assignedWbsIds = wbsAssignments
                .map((assignment) => assignment.wbsItemId)
                .filter((id) => id !== null && id !== undefined);
        }
        if (assignedWbsIds.length === 0) {
            this.logger.debug('할당된 WBS가 없습니다.');
            return;
        }
        for (const wbsId of assignedWbsIds) {
            const existingEvaluation = await this.downwardEvaluationRepository.findOne({
                where: {
                    evaluatorId,
                    employeeId: evaluateeId,
                    periodId,
                    wbsId,
                    evaluationType,
                    deletedAt: null,
                },
            });
            if (!existingEvaluation) {
                try {
                    const evaluationData = {
                        employeeId: evaluateeId,
                        evaluatorId,
                        wbsId,
                        periodId,
                        evaluationType,
                        evaluationDate: new Date(),
                        isCompleted: false,
                        createdBy,
                    };
                    if (isApprovalMode) {
                        evaluationData.downwardEvaluationContent = `${approverName}님에 따라 하향평가가 승인 처리되었습니다.`;
                    }
                    await this.downwardEvaluationService.생성한다(evaluationData);
                    this.logger.debug(`할당된 WBS에 대한 하향평가 생성 완료 - WBS ID: ${wbsId}, 평가유형: ${evaluationType}`);
                }
                catch (error) {
                    this.logger.warn(`할당된 WBS에 대한 하향평가 생성 실패 - WBS ID: ${wbsId}, 평가유형: ${evaluationType}`, error instanceof Error ? error.message : String(error));
                }
            }
        }
        this.logger.log(`할당된 WBS에 대한 하향평가 생성 완료 - 평가자: ${evaluatorId}, 피평가자: ${evaluateeId}, 평가유형: ${evaluationType}`);
    }
};
exports.BulkSubmitDownwardEvaluationsHandler = BulkSubmitDownwardEvaluationsHandler;
exports.BulkSubmitDownwardEvaluationsHandler = BulkSubmitDownwardEvaluationsHandler = BulkSubmitDownwardEvaluationsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(BulkSubmitDownwardEvaluationsCommand),
    __param(0, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(3, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(4, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        downward_evaluation_service_1.DownwardEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], BulkSubmitDownwardEvaluationsHandler);
//# sourceMappingURL=bulk-submit-downward-evaluations.handler.js.map