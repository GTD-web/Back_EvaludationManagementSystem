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
var DownwardEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownwardEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downward_evaluation_entity_1 = require("./downward-evaluation.entity");
const downward_evaluation_exceptions_1 = require("./downward-evaluation.exceptions");
let DownwardEvaluationService = DownwardEvaluationService_1 = class DownwardEvaluationService {
    downwardEvaluationRepository;
    logger = new common_1.Logger(DownwardEvaluationService_1.name);
    constructor(downwardEvaluationRepository) {
        this.downwardEvaluationRepository = downwardEvaluationRepository;
    }
    async 생성한다(createData) {
        this.logger.log(`하향평가 생성 시작 - 피평가자: ${createData.employeeId}, 평가자: ${createData.evaluatorId}, 유형: ${createData.evaluationType}`);
        await this.중복_검사를_수행한다(createData.employeeId, createData.evaluatorId, createData.periodId, createData.evaluationType, createData.wbsId);
        this.유효성을_검사한다(createData);
        try {
            const downwardEvaluation = new downward_evaluation_entity_1.DownwardEvaluation(createData);
            const saved = await this.downwardEvaluationRepository.save(downwardEvaluation);
            this.logger.log(`하향평가 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`하향평가 생성 실패 - 유형: ${createData.evaluationType}`, error.stack);
            throw error;
        }
    }
    async 수정한다(id, updateData, updatedBy) {
        this.logger.log(`하향평가 수정 시작 - ID: ${id}`);
        const downwardEvaluation = await this.조회한다(id);
        if (!downwardEvaluation) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(id);
        }
        try {
            if (updateData.evaluatorId !== undefined) {
                downwardEvaluation.evaluatorId = updateData.evaluatorId;
                downwardEvaluation.메타데이터를_업데이트한다(updatedBy);
            }
            downwardEvaluation.하향평가를_수정한다(updateData.downwardEvaluationContent, updateData.downwardEvaluationScore, updatedBy);
            if (updateData.isCompleted !== undefined) {
                if (updateData.isCompleted) {
                    downwardEvaluation.평가를_완료한다(updatedBy);
                }
                else {
                    downwardEvaluation.isCompleted = false;
                    downwardEvaluation.completedAt = undefined;
                    downwardEvaluation.메타데이터를_업데이트한다(updatedBy);
                }
            }
            if (updateData.selfEvaluationId !== undefined) {
                if (updateData.selfEvaluationId) {
                    downwardEvaluation.자기평가를_연결한다(updateData.selfEvaluationId, updatedBy);
                }
                else {
                    downwardEvaluation.자기평가_연결을_해제한다(updatedBy);
                }
            }
            const saved = await this.downwardEvaluationRepository.save(downwardEvaluation);
            this.logger.log(`하향평가 수정 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`하향평가 수정 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`하향평가 삭제 시작 - ID: ${id}`);
        const downwardEvaluation = await this.조회한다(id);
        if (!downwardEvaluation) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(id);
        }
        try {
            downwardEvaluation.메타데이터를_업데이트한다(deletedBy);
            downwardEvaluation.삭제한다();
            await this.downwardEvaluationRepository.save(downwardEvaluation);
            this.logger.log(`하향평가 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`하향평가 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 완전_삭제한다(id) {
        this.logger.log(`하향평가 완전 삭제 시작 - ID: ${id}`);
        try {
            const result = await this.downwardEvaluationRepository.delete(id);
            if (result.affected === 0) {
                this.logger.warn(`하향평가를 찾을 수 없음 - ID: ${id}`);
                return;
            }
            this.logger.log(`하향평가 완전 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`하향평가 완전 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 조회한다(id) {
        this.logger.debug(`하향평가 조회 - ID: ${id}`);
        try {
            return await this.downwardEvaluationRepository.findOne({
                where: { id },
            });
        }
        catch (error) {
            this.logger.error(`하향평가 조회 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 활성_조회한다(id) {
        this.logger.debug(`활성 하향평가 조회 - ID: ${id}`);
        try {
            return await this.downwardEvaluationRepository.findOne({
                where: { id, deletedAt: null },
            });
        }
        catch (error) {
            this.logger.error(`활성 하향평가 조회 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 필터_조회한다(filter) {
        this.logger.debug(`하향평가 필터 조회 - 필터: ${JSON.stringify(filter)}`);
        try {
            let queryBuilder = this.downwardEvaluationRepository.createQueryBuilder('evaluation');
            queryBuilder.andWhere('evaluation.deletedAt IS NULL');
            if (filter.employeeId) {
                queryBuilder.andWhere('evaluation.employeeId = :employeeId', {
                    employeeId: filter.employeeId,
                });
            }
            if (filter.evaluatorId) {
                queryBuilder.andWhere('evaluation.evaluatorId = :evaluatorId', {
                    evaluatorId: filter.evaluatorId,
                });
            }
            if (filter.wbsId) {
                queryBuilder.andWhere('evaluation.wbsId = :wbsId', {
                    wbsId: filter.wbsId,
                });
            }
            if (filter.periodId) {
                queryBuilder.andWhere('evaluation.periodId = :periodId', {
                    periodId: filter.periodId,
                });
            }
            if (filter.selfEvaluationId) {
                queryBuilder.andWhere('evaluation.selfEvaluationId = :selfEvaluationId', {
                    selfEvaluationId: filter.selfEvaluationId,
                });
            }
            if (filter.evaluationType) {
                queryBuilder.andWhere('evaluation.evaluationType = :evaluationType', {
                    evaluationType: filter.evaluationType,
                });
            }
            if (filter.withSelfEvaluation) {
                queryBuilder.andWhere('evaluation.selfEvaluationId IS NOT NULL');
            }
            if (filter.withoutSelfEvaluation) {
                queryBuilder.andWhere('evaluation.selfEvaluationId IS NULL');
            }
            if (filter.completedOnly) {
                queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
                    isCompleted: true,
                });
            }
            if (filter.uncompletedOnly) {
                queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
                    isCompleted: false,
                });
            }
            if (filter.scoreFrom !== undefined) {
                queryBuilder.andWhere('evaluation.downwardEvaluationScore >= :scoreFrom', {
                    scoreFrom: filter.scoreFrom,
                });
            }
            if (filter.scoreTo !== undefined) {
                queryBuilder.andWhere('evaluation.downwardEvaluationScore <= :scoreTo', {
                    scoreTo: filter.scoreTo,
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
            const orderBy = filter.orderBy || 'evaluationDate';
            const orderDirection = filter.orderDirection || 'DESC';
            queryBuilder.orderBy(`evaluation.${orderBy}`, orderDirection);
            if (filter.page && filter.limit) {
                const offset = (filter.page - 1) * filter.limit;
                queryBuilder.skip(offset).take(filter.limit);
            }
            return await queryBuilder.getMany();
        }
        catch (error) {
            this.logger.error(`하향평가 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`, error.stack);
            throw error;
        }
    }
    async 완료한다(id, completedBy) {
        this.logger.log(`하향평가 완료 처리 시작 - ID: ${id}`);
        const downwardEvaluation = await this.조회한다(id);
        if (!downwardEvaluation) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(id);
        }
        try {
            downwardEvaluation.평가를_완료한다(completedBy);
            const saved = await this.downwardEvaluationRepository.save(downwardEvaluation);
            this.logger.log(`하향평가 완료 처리 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`하향평가 완료 처리 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 피평가자별_조회한다(employeeId) {
        this.logger.debug(`피평가자별 하향평가 조회 - 피평가자: ${employeeId}`);
        try {
            return await this.필터_조회한다({ employeeId });
        }
        catch (error) {
            this.logger.error(`피평가자별 하향평가 조회 실패 - 피평가자: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async 평가자별_조회한다(evaluatorId) {
        this.logger.debug(`평가자별 하향평가 조회 - 평가자: ${evaluatorId}`);
        try {
            return await this.필터_조회한다({ evaluatorId });
        }
        catch (error) {
            this.logger.error(`평가자별 하향평가 조회 실패 - 평가자: ${evaluatorId}`, error.stack);
            throw error;
        }
    }
    async WBS별_조회한다(wbsId) {
        this.logger.debug(`WBS별 하향평가 조회 - WBS: ${wbsId}`);
        try {
            return await this.필터_조회한다({ wbsId });
        }
        catch (error) {
            this.logger.error(`WBS별 하향평가 조회 실패 - WBS: ${wbsId}`, error.stack);
            throw error;
        }
    }
    async 평가기간별_조회한다(periodId) {
        this.logger.debug(`평가기간별 하향평가 조회 - 기간: ${periodId}`);
        try {
            return await this.필터_조회한다({ periodId });
        }
        catch (error) {
            this.logger.error(`평가기간별 하향평가 조회 실패 - 기간: ${periodId}`, error.stack);
            throw error;
        }
    }
    async 중복_검사를_수행한다(employeeId, evaluatorId, periodId, evaluationType, wbsId) {
        const whereCondition = {
            employeeId,
            evaluatorId,
            periodId,
            evaluationType,
        };
        if (wbsId) {
            whereCondition.wbsId = wbsId;
        }
        const existing = await this.downwardEvaluationRepository.findOne({
            where: whereCondition,
        });
        if (existing) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationDuplicateException(employeeId, evaluatorId, periodId);
        }
    }
    유효성을_검사한다(data) {
        if (!data.employeeId) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationValidationException('피평가자 ID는 필수입니다.');
        }
        if (!data.evaluatorId) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationValidationException('평가자 ID는 필수입니다.');
        }
        if (!data.wbsId) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationValidationException('WBS ID는 필수입니다.');
        }
        if (!data.periodId) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationValidationException('평가 기간 ID는 필수입니다.');
        }
        if (!data.evaluationType) {
            throw new downward_evaluation_exceptions_1.DownwardEvaluationValidationException('평가 유형은 필수입니다.');
        }
    }
};
exports.DownwardEvaluationService = DownwardEvaluationService;
exports.DownwardEvaluationService = DownwardEvaluationService = DownwardEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DownwardEvaluationService);
//# sourceMappingURL=downward-evaluation.service.js.map