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
var WbsSelfEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsSelfEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const wbs_self_evaluation_entity_1 = require("./wbs-self-evaluation.entity");
const wbs_self_evaluation_exceptions_1 = require("./wbs-self-evaluation.exceptions");
let WbsSelfEvaluationService = WbsSelfEvaluationService_1 = class WbsSelfEvaluationService {
    wbsSelfEvaluationRepository;
    transactionManager;
    logger = new common_1.Logger(WbsSelfEvaluationService_1.name);
    constructor(wbsSelfEvaluationRepository, transactionManager) {
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
        this.transactionManager = transactionManager;
    }
    async executeSafeDomainOperation(operation, context) {
        return this.transactionManager.executeSafeOperation(operation, context);
    }
    async 생성한다(createData, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.유효성을_검사한다(createData);
            const repository = this.transactionManager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation, this.wbsSelfEvaluationRepository, manager);
            await this.중복_검사를_수행한다(createData.periodId, createData.employeeId, createData.wbsItemId, repository);
            const wbsSelfEvaluation = new wbs_self_evaluation_entity_1.WbsSelfEvaluation(createData);
            const saved = await repository.save(wbsSelfEvaluation);
            return saved;
        }, '생성한다');
    }
    async 수정한다(id, updateData, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation, this.wbsSelfEvaluationRepository, manager);
            const wbsSelfEvaluation = await repository.findOne({ where: { id } });
            if (!wbsSelfEvaluation) {
                throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationNotFoundException(id);
            }
            if (updateData.selfEvaluationScore !== undefined &&
                updateData.selfEvaluationScore !== null) {
                this.점수_유효성을_검사한다(updateData.selfEvaluationScore);
            }
            if (updateData.assignedBy !== undefined) {
                wbsSelfEvaluation.assignedBy = updateData.assignedBy;
            }
            if (updateData.submittedToEvaluator !== undefined) {
                if (updateData.submittedToEvaluator) {
                    wbsSelfEvaluation.피평가자가_1차평가자에게_제출한다();
                }
                else {
                    wbsSelfEvaluation.피평가자_제출을_취소한다();
                }
            }
            if (updateData.submittedToManager !== undefined) {
                if (updateData.submittedToManager) {
                    wbsSelfEvaluation.일차평가자가_관리자에게_제출한다();
                }
                else {
                    if (updateData.resetSubmittedToManagerAt) {
                        wbsSelfEvaluation.일차평가자_제출을_완전히_초기화한다();
                    }
                    else {
                        wbsSelfEvaluation.일차평가자_제출을_취소한다();
                    }
                }
            }
            if (updateData.selfEvaluationContent !== undefined ||
                updateData.selfEvaluationScore !== undefined ||
                updateData.performanceResult !== undefined) {
                wbsSelfEvaluation.자가평가를_수정한다(updateData.selfEvaluationContent, updateData.selfEvaluationScore, updateData.performanceResult, updatedBy);
            }
            const saved = await repository.save(wbsSelfEvaluation);
            return saved;
        }, '수정한다');
    }
    async 피평가자가_1차평가자에게_제출한다(wbsSelfEvaluation, submittedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.log(`피평가자가 1차 평가자에게 자기평가 제출 시작 - ID: ${wbsSelfEvaluation.id}`);
            const repository = this.transactionManager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation, this.wbsSelfEvaluationRepository, manager);
            wbsSelfEvaluation.피평가자가_1차평가자에게_제출한다();
            wbsSelfEvaluation.수정자를_설정한다(submittedBy);
            const saved = await repository.save(wbsSelfEvaluation);
            this.logger.log(`피평가자가 1차 평가자에게 자기평가 제출 완료 - ID: ${wbsSelfEvaluation.id}`);
            return saved;
        }, '피평가자가_1차평가자에게_제출한다');
    }
    async 일차평가자가_관리자에게_제출한다(wbsSelfEvaluation, submittedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.log(`1차 평가자가 관리자에게 자기평가 제출 시작 - ID: ${wbsSelfEvaluation.id}`);
            const repository = this.transactionManager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation, this.wbsSelfEvaluationRepository, manager);
            wbsSelfEvaluation.일차평가자가_관리자에게_제출한다();
            wbsSelfEvaluation.수정자를_설정한다(submittedBy);
            const saved = await repository.save(wbsSelfEvaluation);
            this.logger.log(`1차 평가자가 관리자에게 자기평가 제출 완료 - ID: ${wbsSelfEvaluation.id}`);
            return saved;
        }, '일차평가자가_관리자에게_제출한다');
    }
    async 피평가자가_1차평가자에게_제출한_것을_취소한다(id, resetBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.log(`피평가자가 1차 평가자에게 제출한 것을 취소 시작 - ID: ${id}`);
            const repository = this.transactionManager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation, this.wbsSelfEvaluationRepository, manager);
            const wbsSelfEvaluation = await repository.findOne({ where: { id } });
            if (!wbsSelfEvaluation) {
                throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationNotFoundException(id);
            }
            if (!wbsSelfEvaluation.피평가자가_1차평가자에게_제출했는가()) {
                throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationValidationException('이미 1차 평가자에게 미제출 상태인 자기평가입니다.');
            }
            wbsSelfEvaluation.피평가자_제출을_취소한다();
            wbsSelfEvaluation.메타데이터를_업데이트한다(resetBy);
            const saved = await repository.save(wbsSelfEvaluation);
            this.logger.log(`피평가자가 1차 평가자에게 제출한 것을 취소 완료 - ID: ${id}`);
            return saved;
        }, '피평가자가_1차평가자에게_제출한_것을_취소한다');
    }
    async 삭제한다(id, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.log(`WBS 자가평가 삭제 시작 - ID: ${id}`);
            const repository = this.transactionManager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation, this.wbsSelfEvaluationRepository, manager);
            const wbsSelfEvaluation = await repository.findOne({ where: { id } });
            if (!wbsSelfEvaluation) {
                throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationNotFoundException(id);
            }
            wbsSelfEvaluation.메타데이터를_업데이트한다(deletedBy);
            wbsSelfEvaluation.삭제한다();
            await repository.save(wbsSelfEvaluation);
            this.logger.log(`WBS 자가평가 삭제 완료 - ID: ${id}`);
        }, '삭제한다');
    }
    async 조회한다(id, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation, this.wbsSelfEvaluationRepository, manager);
            return await repository.findOne({ where: { id } });
        }, '조회한다');
    }
    async 필터_조회한다(filter, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation, this.wbsSelfEvaluationRepository, manager);
            let queryBuilder = repository.createQueryBuilder('evaluation');
            queryBuilder.andWhere('evaluation.deletedAt IS NULL');
            if (filter.periodId) {
                queryBuilder.andWhere('evaluation.periodId = :periodId', {
                    periodId: filter.periodId,
                });
            }
            if (filter.employeeId) {
                queryBuilder.andWhere('evaluation.employeeId = :employeeId', {
                    employeeId: filter.employeeId,
                });
            }
            if (filter.wbsItemId) {
                queryBuilder.andWhere('evaluation.wbsItemId = :wbsItemId', {
                    wbsItemId: filter.wbsItemId,
                });
            }
            if (filter.assignedBy) {
                queryBuilder.andWhere('evaluation.assignedBy = :assignedBy', {
                    assignedBy: filter.assignedBy,
                });
            }
            if (filter.submittedToEvaluatorOnly) {
                queryBuilder.andWhere('evaluation.submittedToEvaluator = :submittedToEvaluator', {
                    submittedToEvaluator: true,
                });
            }
            if (filter.notSubmittedToEvaluatorOnly) {
                queryBuilder.andWhere('evaluation.submittedToEvaluator = :submittedToEvaluator', {
                    submittedToEvaluator: false,
                });
            }
            if (filter.submittedToManagerOnly) {
                queryBuilder.andWhere('evaluation.submittedToManager = :submittedToManager', {
                    submittedToManager: true,
                });
            }
            if (filter.notSubmittedToManagerOnly) {
                queryBuilder.andWhere('evaluation.submittedToManager = :submittedToManager', {
                    submittedToManager: false,
                });
            }
            if (filter.assignedDateFrom) {
                queryBuilder.andWhere('evaluation.assignedDate >= :assignedDateFrom', {
                    assignedDateFrom: filter.assignedDateFrom,
                });
            }
            if (filter.assignedDateTo) {
                queryBuilder.andWhere('evaluation.assignedDate <= :assignedDateTo', {
                    assignedDateTo: filter.assignedDateTo,
                });
            }
            if (filter.submittedToEvaluatorDateFrom) {
                queryBuilder.andWhere('evaluation.submittedToEvaluatorAt >= :submittedToEvaluatorDateFrom', {
                    submittedToEvaluatorDateFrom: filter.submittedToEvaluatorDateFrom,
                });
            }
            if (filter.submittedToEvaluatorDateTo) {
                queryBuilder.andWhere('evaluation.submittedToEvaluatorAt <= :submittedToEvaluatorDateTo', {
                    submittedToEvaluatorDateTo: filter.submittedToEvaluatorDateTo,
                });
            }
            if (filter.submittedToManagerDateFrom) {
                queryBuilder.andWhere('evaluation.submittedToManagerAt >= :submittedToManagerDateFrom', {
                    submittedToManagerDateFrom: filter.submittedToManagerDateFrom,
                });
            }
            if (filter.submittedToManagerDateTo) {
                queryBuilder.andWhere('evaluation.submittedToManagerAt <= :submittedToManagerDateTo', {
                    submittedToManagerDateTo: filter.submittedToManagerDateTo,
                });
            }
            if (filter.evaluationDateFrom) {
                queryBuilder.andWhere('evaluation.evaluationDate >= :evaluationDateFrom', {
                    evaluationDateFrom: filter.evaluationDateFrom,
                });
            }
            if (filter.evaluationDateTo) {
                queryBuilder.andWhere('evaluation.evaluationDate <= :evaluationDateTo', {
                    evaluationDateTo: filter.evaluationDateTo,
                });
            }
            if (filter.scoreFrom !== undefined) {
                queryBuilder.andWhere('evaluation.selfEvaluationScore >= :scoreFrom', {
                    scoreFrom: filter.scoreFrom,
                });
            }
            if (filter.scoreTo !== undefined) {
                queryBuilder.andWhere('evaluation.selfEvaluationScore <= :scoreTo', {
                    scoreTo: filter.scoreTo,
                });
            }
            const orderBy = filter.orderBy || 'evaluationDate';
            const orderDirection = filter.orderDirection || 'DESC';
            queryBuilder.orderBy(`evaluation.${orderBy}`, orderDirection);
            if (filter.page && filter.limit) {
                const offset = (filter.page - 1) * filter.limit;
                queryBuilder.skip(offset).take(filter.limit);
            }
            return await queryBuilder.getMany();
        }, '필터_조회한다');
    }
    async 평가기간별_조회한다(periodId, manager) {
        return this.필터_조회한다({ periodId }, manager);
    }
    async 직원별_조회한다(employeeId, manager) {
        return this.필터_조회한다({ employeeId }, manager);
    }
    async WBS항목별_조회한다(wbsItemId, manager) {
        return this.필터_조회한다({ wbsItemId }, manager);
    }
    async 중복_검사를_수행한다(periodId, employeeId, wbsItemId, repository) {
        const existing = await repository.findOne({
            where: {
                periodId,
                employeeId,
                wbsItemId,
            },
        });
        if (existing) {
            throw new wbs_self_evaluation_exceptions_1.DuplicateWbsSelfEvaluationException(periodId, employeeId, wbsItemId);
        }
    }
    유효성을_검사한다(data) {
        if (!data.periodId?.trim()) {
            throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationValidationException('평가 기간 ID는 필수입니다.');
        }
        if (!data.employeeId?.trim()) {
            throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationValidationException('직원 ID는 필수입니다.');
        }
        if (!data.wbsItemId?.trim()) {
            throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationValidationException('WBS 항목 ID는 필수입니다.');
        }
        if (!data.assignedBy?.trim()) {
            throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationValidationException('할당자 ID는 필수입니다.');
        }
        if (data.selfEvaluationScore !== undefined &&
            data.selfEvaluationScore !== null) {
            this.점수_유효성을_검사한다(data.selfEvaluationScore);
        }
    }
    점수_유효성을_검사한다(score) {
        if (score < 0) {
            throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationValidationException('자가평가 점수는 0 이상이어야 합니다.');
        }
    }
    async 내용을_초기화한다(evaluationId, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.log(`WBS 자가평가 내용 초기화 시작: ${evaluationId}`);
            const repository = manager
                ? manager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation)
                : this.wbsSelfEvaluationRepository;
            const evaluation = await repository.findOne({
                where: { id: evaluationId },
            });
            if (!evaluation) {
                throw new wbs_self_evaluation_exceptions_1.WbsSelfEvaluationNotFoundException(evaluationId);
            }
            evaluation.자가평가_내용을_초기화한다(updatedBy);
            const saved = await repository.save(evaluation);
            this.logger.log(`WBS 자가평가 내용 초기화 완료: ${evaluationId}`);
            return saved;
        }, 'WBS 자가평가 내용 초기화');
    }
};
exports.WbsSelfEvaluationService = WbsSelfEvaluationService;
exports.WbsSelfEvaluationService = WbsSelfEvaluationService = WbsSelfEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], WbsSelfEvaluationService);
//# sourceMappingURL=wbs-self-evaluation.service.js.map