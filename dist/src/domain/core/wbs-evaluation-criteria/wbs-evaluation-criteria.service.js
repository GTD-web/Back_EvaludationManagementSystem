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
var WbsEvaluationCriteriaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsEvaluationCriteriaService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_evaluation_criteria_validation_service_1 = require("./wbs-evaluation-criteria-validation.service");
const wbs_evaluation_criteria_entity_1 = require("./wbs-evaluation-criteria.entity");
const wbs_evaluation_criteria_exceptions_1 = require("./wbs-evaluation-criteria.exceptions");
let WbsEvaluationCriteriaService = WbsEvaluationCriteriaService_1 = class WbsEvaluationCriteriaService {
    wbsEvaluationCriteriaRepository;
    transactionManager;
    validationService;
    logger = new common_1.Logger(WbsEvaluationCriteriaService_1.name);
    constructor(wbsEvaluationCriteriaRepository, transactionManager, validationService) {
        this.wbsEvaluationCriteriaRepository = wbsEvaluationCriteriaRepository;
        this.transactionManager = transactionManager;
        this.validationService = validationService;
    }
    async executeSafeDomainOperation(operation, context) {
        return this.transactionManager.executeSafeOperation(operation, context);
    }
    async ID로_조회한다(id, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
            const criteria = await repository.findOne({
                where: { id },
            });
            this.logger.debug(`WBS 평가 기준 조회 완료 - ID: ${id}`);
            return criteria;
        }, 'ID로_조회한다');
    }
    async 전체_조회한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
            const criteriaList = await repository.find({
                order: { createdAt: 'DESC' },
            });
            this.logger.debug(`전체 WBS 평가 기준 조회 완료 - 개수: ${criteriaList.length}`);
            return criteriaList;
        }, '전체_조회한다');
    }
    async WBS항목별_조회한다(wbsItemId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
            const criteriaList = await repository.find({
                where: { wbsItemId },
                order: { createdAt: 'DESC' },
            });
            this.logger.debug(`WBS 항목별 평가 기준 조회 완료 - WBS 항목 ID: ${wbsItemId}, 개수: ${criteriaList.length}`);
            return criteriaList;
        }, 'WBS항목별_조회한다');
    }
    async 필터_조회한다(filter, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
            let queryBuilder = repository.createQueryBuilder('criteria');
            if (filter.wbsItemId) {
                queryBuilder.andWhere('criteria.wbsItemId = :wbsItemId', {
                    wbsItemId: filter.wbsItemId,
                });
            }
            if (filter.criteriaSearch) {
                queryBuilder.andWhere('criteria.criteria LIKE :criteriaSearch', {
                    criteriaSearch: `%${filter.criteriaSearch}%`,
                });
            }
            if (filter.criteriaExact) {
                queryBuilder.andWhere('TRIM(criteria.criteria) = :criteriaExact', {
                    criteriaExact: filter.criteriaExact.trim(),
                });
            }
            queryBuilder.orderBy('criteria.createdAt', 'DESC');
            const criteriaList = await queryBuilder.getMany();
            this.logger.debug(`필터 조건 WBS 평가 기준 조회 완료 - 개수: ${criteriaList.length}`);
            return criteriaList;
        }, '필터_조회한다');
    }
    async 생성한다(createData, manager) {
        return this.executeSafeDomainOperation(async () => {
            await this.validationService.생성데이터검증한다(createData, manager);
            const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
            const criteria = repository.create({
                wbsItemId: createData.wbsItemId,
                criteria: createData.criteria,
                importance: createData.importance,
            });
            const savedCriteria = await repository.save(criteria);
            this.logger.log(`WBS 평가 기준 생성 완료 - ID: ${savedCriteria.id}, WBS 항목: ${savedCriteria.wbsItemId}`);
            return savedCriteria;
        }, '생성한다');
    }
    async 업데이트한다(id, updateData, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
            const criteria = await repository.findOne({ where: { id } });
            if (!criteria) {
                throw new wbs_evaluation_criteria_exceptions_1.WbsEvaluationCriteriaNotFoundException(id);
            }
            await this.validationService.업데이트데이터검증한다(id, updateData, manager);
            if (updateData.criteria !== undefined ||
                updateData.importance !== undefined) {
                const newCriteria = updateData.criteria !== undefined
                    ? updateData.criteria
                    : criteria.criteria;
                const newImportance = updateData.importance ?? criteria.importance;
                criteria.기준내용업데이트한다(newCriteria, newImportance, updatedBy);
            }
            const updatedCriteria = await repository.save(criteria);
            this.logger.log(`WBS 평가 기준 업데이트 완료 - ID: ${id}, 수정자: ${updatedBy}`);
            return updatedCriteria;
        }, '업데이트한다');
    }
    async 삭제한다(id, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
            const criteria = await repository.findOne({ where: { id } });
            if (!criteria) {
                throw new wbs_evaluation_criteria_exceptions_1.WbsEvaluationCriteriaNotFoundException(id);
            }
            criteria.수정자를_설정한다(deletedBy);
            await repository.save(criteria);
            await repository.softDelete(id);
            this.logger.log(`WBS 평가 기준 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
        }, '삭제한다');
    }
    async 평가기준_존재_확인한다(wbsItemId, criteria, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
            const count = await repository
                .createQueryBuilder('criteria')
                .where('criteria.wbsItemId = :wbsItemId', { wbsItemId })
                .andWhere('TRIM(criteria.criteria) = :criteria', {
                criteria: criteria.trim(),
            })
                .getCount();
            return count > 0;
        }, '평가기준_존재_확인한다');
    }
    async WBS항목_평가기준_전체삭제한다(wbsItemId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
            const criteriaList = await repository.find({
                where: { wbsItemId },
            });
            for (const criteria of criteriaList) {
                criteria.수정자를_설정한다(deletedBy);
                await repository.save(criteria);
                await repository.softDelete(criteria.id);
            }
            this.logger.log(`WBS 항목 평가 기준 전체 삭제 완료 - WBS 항목 ID: ${wbsItemId}, 삭제자: ${deletedBy}, 삭제된 기준 수: ${criteriaList.length}`);
        }, 'WBS항목_평가기준_전체삭제한다');
    }
};
exports.WbsEvaluationCriteriaService = WbsEvaluationCriteriaService;
exports.WbsEvaluationCriteriaService = WbsEvaluationCriteriaService = WbsEvaluationCriteriaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService,
        wbs_evaluation_criteria_validation_service_1.WbsEvaluationCriteriaValidationService])
], WbsEvaluationCriteriaService);
//# sourceMappingURL=wbs-evaluation-criteria.service.js.map