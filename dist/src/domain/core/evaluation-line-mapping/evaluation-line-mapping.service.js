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
var EvaluationLineMappingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationLineMappingService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_line_mapping_validation_service_1 = require("./evaluation-line-mapping-validation.service");
const evaluation_line_mapping_entity_1 = require("./evaluation-line-mapping.entity");
const evaluation_line_mapping_exceptions_1 = require("./evaluation-line-mapping.exceptions");
let EvaluationLineMappingService = EvaluationLineMappingService_1 = class EvaluationLineMappingService {
    evaluationLineMappingRepository;
    transactionManager;
    validationService;
    logger = new common_1.Logger(EvaluationLineMappingService_1.name);
    constructor(evaluationLineMappingRepository, transactionManager, validationService) {
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.transactionManager = transactionManager;
        this.validationService = validationService;
    }
    async executeSafeDomainOperation(operation, context) {
        return this.transactionManager.executeSafeOperation(operation, context);
    }
    async ID로_조회한다(id, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mapping = await repository.findOne({
                where: { id },
            });
            this.logger.debug(`평가 라인 맵핑 조회 완료 - ID: ${id}`);
            return mapping;
        }, 'ID로_조회한다');
    }
    async 전체_조회한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mappings = await repository.find({
                order: { createdAt: 'DESC' },
            });
            this.logger.debug(`전체 평가 라인 맵핑 조회 완료 - 개수: ${mappings.length}`);
            return mappings;
        }, '전체_조회한다');
    }
    async 직원별_조회한다(employeeId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mappings = await repository.find({
                where: { employeeId },
                order: { createdAt: 'DESC' },
            });
            this.logger.debug(`직원별 평가 라인 맵핑 조회 완료 - 직원 ID: ${employeeId}, 개수: ${mappings.length}`);
            return mappings;
        }, '직원별_조회한다');
    }
    async 평가자별_조회한다(evaluatorId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mappings = await repository.find({
                where: { evaluatorId },
                order: { createdAt: 'DESC' },
            });
            this.logger.debug(`평가자별 평가 라인 맵핑 조회 완료 - 평가자 ID: ${evaluatorId}, 개수: ${mappings.length}`);
            return mappings;
        }, '평가자별_조회한다');
    }
    async WBS항목별_조회한다(wbsItemId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mappings = await repository.find({
                where: { wbsItemId },
                order: { createdAt: 'DESC' },
            });
            this.logger.debug(`WBS 항목별 평가 라인 맵핑 조회 완료 - WBS 항목 ID: ${wbsItemId}, 개수: ${mappings.length}`);
            return mappings;
        }, 'WBS항목별_조회한다');
    }
    async 생성자별_조회한다(createdBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mappings = await repository.find({
                where: { createdBy },
                order: { createdAt: 'DESC' },
            });
            this.logger.debug(`생성자별 평가 라인 맵핑 조회 완료 - 생성자 ID: ${createdBy}, 개수: ${mappings.length}`);
            return mappings;
        }, '생성자별_조회한다');
    }
    async 수정자별_조회한다(updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mappings = await repository.find({
                where: { updatedBy },
                order: { updatedAt: 'DESC' },
            });
            this.logger.debug(`수정자별 평가 라인 맵핑 조회 완료 - 수정자 ID: ${updatedBy}, 개수: ${mappings.length}`);
            return mappings;
        }, '수정자별_조회한다');
    }
    async 필터_조회한다(filter, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            let queryBuilder = repository.createQueryBuilder('mapping');
            queryBuilder.andWhere('mapping.deletedAt IS NULL');
            if (filter.evaluationPeriodId) {
                queryBuilder.andWhere('mapping.evaluationPeriodId = :evaluationPeriodId', {
                    evaluationPeriodId: filter.evaluationPeriodId,
                });
            }
            if (filter.employeeId) {
                queryBuilder.andWhere('mapping.employeeId = :employeeId', {
                    employeeId: filter.employeeId,
                });
            }
            if (filter.evaluatorId) {
                queryBuilder.andWhere('mapping.evaluatorId = :evaluatorId', {
                    evaluatorId: filter.evaluatorId,
                });
            }
            if (filter.wbsItemId) {
                queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', {
                    wbsItemId: filter.wbsItemId,
                });
            }
            if (filter.evaluationLineId) {
                queryBuilder.andWhere('mapping.evaluationLineId = :evaluationLineId', {
                    evaluationLineId: filter.evaluationLineId,
                });
            }
            if (filter.createdBy) {
                queryBuilder.andWhere('mapping.createdBy = :createdBy', {
                    createdBy: filter.createdBy,
                });
            }
            if (filter.updatedBy) {
                queryBuilder.andWhere('mapping.updatedBy = :updatedBy', {
                    updatedBy: filter.updatedBy,
                });
            }
            if (filter.withWbsItem !== undefined) {
                if (filter.withWbsItem) {
                    queryBuilder.andWhere('mapping.wbsItemId IS NOT NULL');
                }
                else {
                    queryBuilder.andWhere('mapping.wbsItemId IS NULL');
                }
            }
            queryBuilder.orderBy('mapping.createdAt', 'DESC');
            const mappings = await queryBuilder.getMany();
            this.logger.debug(`필터 조건 평가 라인 맵핑 조회 완료 - 개수: ${mappings.length}`);
            return mappings;
        }, '필터_조회한다');
    }
    async 생성한다(createData, manager) {
        return this.executeSafeDomainOperation(async () => {
            await this.validationService.생성데이터검증한다(createData, manager);
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mapping = repository.create({
                evaluationPeriodId: createData.evaluationPeriodId,
                employeeId: createData.employeeId,
                evaluatorId: createData.evaluatorId,
                wbsItemId: createData.wbsItemId,
                evaluationLineId: createData.evaluationLineId,
                createdBy: createData.createdBy,
            });
            const savedMapping = await repository.save(mapping);
            this.logger.log(`평가 라인 맵핑 생성 완료 - ID: ${savedMapping.id}, 평가기간: ${savedMapping.evaluationPeriodId}, 피평가자: ${savedMapping.employeeId}, 평가자: ${savedMapping.evaluatorId}`);
            return savedMapping;
        }, '생성한다');
    }
    async 업데이트한다(id, updateData, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mapping = await repository.findOne({ where: { id } });
            if (!mapping) {
                throw new evaluation_line_mapping_exceptions_1.EvaluationLineMappingNotFoundException(id);
            }
            await this.validationService.업데이트데이터검증한다(id, updateData, manager);
            if (updateData.evaluatorId !== undefined) {
                mapping.평가자를_변경한다(updateData.evaluatorId);
            }
            if (updateData.evaluationLineId !== undefined) {
                mapping.평가라인을_변경한다(updateData.evaluationLineId);
            }
            if (updateData.wbsItemId !== undefined) {
                mapping.WBS항목을_변경한다(updateData.wbsItemId);
            }
            if (updateData.updatedBy) {
                mapping.수정자를_설정한다(updateData.updatedBy);
            }
            const updatedMapping = await repository.save(mapping);
            this.logger.log(`평가 라인 맵핑 업데이트 완료 - ID: ${id}, 수정자: ${updatedBy}`);
            return updatedMapping;
        }, '업데이트한다');
    }
    async 삭제한다(id, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mapping = await repository.findOne({ where: { id } });
            if (!mapping) {
                throw new evaluation_line_mapping_exceptions_1.EvaluationLineMappingNotFoundException(id);
            }
            await repository.delete(id);
            this.logger.log(`평가 라인 맵핑 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
        }, '삭제한다');
    }
    async 평가관계_존재_확인한다(evaluationPeriodId, employeeId, evaluatorId, wbsItemId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            let queryBuilder = repository
                .createQueryBuilder('mapping')
                .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('mapping.employeeId = :employeeId', { employeeId })
                .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId });
            if (wbsItemId) {
                queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', { wbsItemId });
            }
            else {
                queryBuilder.andWhere('mapping.wbsItemId IS NULL');
            }
            const count = await queryBuilder.getCount();
            return count > 0;
        }, '평가관계_존재_확인한다');
    }
    async 직원_맵핑_전체삭제한다(employeeId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mappings = await repository.find({
                where: [{ employeeId }, { evaluatorId: employeeId }],
            });
            for (const mapping of mappings) {
                await repository.delete(mapping.id);
            }
            this.logger.log(`직원 맵핑 전체 삭제 완료 - 직원 ID: ${employeeId}, 삭제자: ${deletedBy}, 삭제된 맵핑 수: ${mappings.length}`);
        }, '직원_맵핑_전체삭제한다');
    }
    async WBS항목_맵핑_전체삭제한다(wbsItemId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
            const mappings = await repository.find({
                where: { wbsItemId },
            });
            for (const mapping of mappings) {
                await repository.delete(mapping.id);
            }
            this.logger.log(`WBS 항목 맵핑 전체 삭제 완료 - WBS 항목 ID: ${wbsItemId}, 삭제자: ${deletedBy}, 삭제된 맵핑 수: ${mappings.length}`);
        }, 'WBS항목_맵핑_전체삭제한다');
    }
};
exports.EvaluationLineMappingService = EvaluationLineMappingService;
exports.EvaluationLineMappingService = EvaluationLineMappingService = EvaluationLineMappingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService,
        evaluation_line_mapping_validation_service_1.EvaluationLineMappingValidationService])
], EvaluationLineMappingService);
//# sourceMappingURL=evaluation-line-mapping.service.js.map