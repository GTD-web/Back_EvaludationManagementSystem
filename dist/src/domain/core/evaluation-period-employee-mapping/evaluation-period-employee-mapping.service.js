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
var EvaluationPeriodEmployeeMappingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodEmployeeMappingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_period_employee_mapping_entity_1 = require("./evaluation-period-employee-mapping.entity");
const evaluation_period_employee_mapping_exceptions_1 = require("./evaluation-period-employee-mapping.exceptions");
let EvaluationPeriodEmployeeMappingService = EvaluationPeriodEmployeeMappingService_1 = class EvaluationPeriodEmployeeMappingService {
    repository;
    logger = new common_1.Logger(EvaluationPeriodEmployeeMappingService_1.name);
    constructor(repository) {
        this.repository = repository;
    }
    async 평가대상자를_등록한다(data) {
        this.logger.log(`평가 대상자 등록 시작 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}`);
        this.유효성을_검사한다(data);
        const softDeletedMapping = await this.repository.findOne({
            where: {
                evaluationPeriodId: data.evaluationPeriodId,
                employeeId: data.employeeId,
            },
            withDeleted: true,
        });
        if (softDeletedMapping && softDeletedMapping.deletedAt) {
            this.logger.log(`소프트 삭제된 매핑 복구 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}`);
            await this.repository.restore(softDeletedMapping.id);
            const restored = await this.repository.findOne({
                where: { id: softDeletedMapping.id },
            });
            if (!restored) {
                throw new Error(`매핑 복구 후 조회 실패 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}`);
            }
            restored.메타데이터를_업데이트한다(data.createdBy);
            const saved = await this.repository.save(restored);
            this.logger.log(`평가 대상자 복구 완료 - ID: ${saved.id}`);
            return saved.DTO로_변환한다();
        }
        await this.중복_검사를_수행한다(data.evaluationPeriodId, data.employeeId);
        try {
            const mapping = new evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping(data);
            const saved = await this.repository.save(mapping);
            this.logger.log(`평가 대상자 등록 완료 - ID: ${saved.id}`);
            return saved.DTO로_변환한다();
        }
        catch (error) {
            this.logger.error(`평가 대상자 등록 실패 - 평가기간: ${data.evaluationPeriodId}, 직원: ${data.employeeId}`, error.stack);
            throw error;
        }
    }
    async 평가대상자를_대량_등록한다(evaluationPeriodId, employeeIds, createdBy) {
        this.logger.log(`평가 대상자 대량 등록 시작 - 평가기간: ${evaluationPeriodId}, 직원 수: ${employeeIds.length}`);
        if (!employeeIds || employeeIds.length === 0) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingValidationException('등록할 직원 ID가 없습니다.');
        }
        try {
            const uniqueEmployeeIds = Array.from(new Set(employeeIds));
            const existingMappings = await this.repository.find({
                where: {
                    evaluationPeriodId,
                    employeeId: (0, typeorm_2.In)(uniqueEmployeeIds),
                },
            });
            const existingEmployeeIds = new Set(existingMappings.map((m) => m.employeeId));
            const newEmployeeIds = uniqueEmployeeIds.filter((id) => !existingEmployeeIds.has(id));
            if (newEmployeeIds.length === 0) {
                this.logger.log('모든 직원이 이미 등록되어 있습니다.');
                return existingMappings.map((m) => m.DTO로_변환한다());
            }
            const newMappings = newEmployeeIds.map((employeeId) => new evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping({
                evaluationPeriodId,
                employeeId,
                createdBy,
            }));
            const savedMappings = await this.repository.save(newMappings);
            this.logger.log(`평가 대상자 대량 등록 완료 - 신규: ${savedMappings.length}개, 기존: ${existingMappings.length}개`);
            return [...existingMappings, ...savedMappings].map((m) => m.DTO로_변환한다());
        }
        catch (error) {
            this.logger.error(`평가 대상자 대량 등록 실패 - 평가기간: ${evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
    async 평가대상에서_제외한다(evaluationPeriodId, employeeId, data) {
        this.logger.log(`평가 대상 제외 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
        if (!mapping) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingNotFoundException(`평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        }
        if (mapping.제외되었는가()) {
            throw new evaluation_period_employee_mapping_exceptions_1.AlreadyExcludedEvaluationTargetException(evaluationPeriodId, employeeId);
        }
        try {
            mapping.평가대상에서_제외한다(data.excludeReason, data.excludedBy);
            const saved = await this.repository.save(mapping);
            this.logger.log(`평가 대상 제외 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
            return saved.DTO로_변환한다();
        }
        catch (error) {
            this.logger.error(`평가 대상 제외 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async 평가대상에_포함한다(evaluationPeriodId, employeeId, data) {
        this.logger.log(`평가 대상 포함 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
        if (!mapping) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingNotFoundException(`평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        }
        if (!mapping.제외되었는가()) {
            throw new evaluation_period_employee_mapping_exceptions_1.NotExcludedEvaluationTargetException(evaluationPeriodId, employeeId);
        }
        try {
            mapping.평가대상에_포함한다(data.updatedBy);
            const saved = await this.repository.save(mapping);
            this.logger.log(`평가 대상 포함 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
            return saved.DTO로_변환한다();
        }
        catch (error) {
            this.logger.error(`평가 대상 포함 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async 평가기간의_평가대상자를_조회한다(evaluationPeriodId, includeExcluded = false) {
        this.logger.debug(`평가기간 평가대상자 조회 - 평가기간: ${evaluationPeriodId}, 제외자 포함: ${includeExcluded}`);
        try {
            return await this.필터로_평가대상자를_조회한다({
                evaluationPeriodId,
                includeExcluded,
            });
        }
        catch (error) {
            this.logger.error(`평가기간 평가대상자 조회 실패 - 평가기간: ${evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
    async 평가기간의_제외된_대상자를_조회한다(evaluationPeriodId) {
        this.logger.debug(`평가기간 제외 대상자 조회 - 평가기간: ${evaluationPeriodId}`);
        try {
            return await this.필터로_평가대상자를_조회한다({
                evaluationPeriodId,
                excludedOnly: true,
            });
        }
        catch (error) {
            this.logger.error(`평가기간 제외 대상자 조회 실패 - 평가기간: ${evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
    async 직원의_평가기간_맵핑을_조회한다(employeeId) {
        this.logger.debug(`직원 평가기간 맵핑 조회 - 직원: ${employeeId}`);
        try {
            return await this.필터로_평가대상자를_조회한다({
                employeeId,
                includeExcluded: true,
            });
        }
        catch (error) {
            this.logger.error(`직원 평가기간 맵핑 조회 실패 - 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async 평가대상_여부를_확인한다(evaluationPeriodId, employeeId) {
        this.logger.debug(`평가 대상 여부 확인 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        try {
            const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
            return mapping ? mapping.평가대상인가() : false;
        }
        catch (error) {
            this.logger.error(`평가 대상 여부 확인 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async 평가대상자_등록을_해제한다(evaluationPeriodId, employeeId) {
        this.logger.log(`평가 대상자 등록 해제 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
        if (!mapping) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingNotFoundException(`평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        }
        try {
            mapping.삭제한다();
            await this.repository.save(mapping);
            this.logger.log(`평가 대상자 등록 해제 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`평가 대상자 등록 해제 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async 평가기간의_모든_대상자를_해제한다(evaluationPeriodId) {
        this.logger.log(`평가기간 전체 대상자 해제 시작 - 평가기간: ${evaluationPeriodId}`);
        try {
            const result = await this.repository
                .createQueryBuilder()
                .softDelete()
                .where('evaluationPeriodId = :evaluationPeriodId', {
                evaluationPeriodId,
            })
                .andWhere('deletedAt IS NULL')
                .execute();
            const deletedCount = result.affected || 0;
            this.logger.log(`평가기간 전체 대상자 해제 완료 - 평가기간: ${evaluationPeriodId}, 삭제 수: ${deletedCount}`);
            return deletedCount;
        }
        catch (error) {
            this.logger.error(`평가기간 전체 대상자 해제 실패 - 평가기간: ${evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
    async 필터로_평가대상자를_조회한다(filter) {
        this.logger.debug(`평가 대상자 필터 조회 - 필터: ${JSON.stringify(filter)}`);
        try {
            let queryBuilder = this.repository.createQueryBuilder('mapping');
            queryBuilder.where('mapping.deletedAt IS NULL');
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
            if (filter.excludedOnly) {
                queryBuilder.andWhere('mapping.isExcluded = :isExcluded', {
                    isExcluded: true,
                });
            }
            else if (!filter.includeExcluded) {
                queryBuilder.andWhere('mapping.isExcluded = :isExcluded', {
                    isExcluded: false,
                });
            }
            if (filter.excludedBy) {
                queryBuilder.andWhere('mapping.excludedBy = :excludedBy', {
                    excludedBy: filter.excludedBy,
                });
            }
            if (filter.excludedAtFrom) {
                queryBuilder.andWhere('mapping.excludedAt >= :excludedAtFrom', {
                    excludedAtFrom: filter.excludedAtFrom,
                });
            }
            if (filter.excludedAtTo) {
                queryBuilder.andWhere('mapping.excludedAt <= :excludedAtTo', {
                    excludedAtTo: filter.excludedAtTo,
                });
            }
            const orderBy = filter.orderBy || 'createdAt';
            const orderDirection = filter.orderDirection || 'DESC';
            queryBuilder.orderBy(`mapping.${orderBy}`, orderDirection);
            if (filter.page && filter.limit) {
                const offset = (filter.page - 1) * filter.limit;
                queryBuilder.skip(offset).take(filter.limit);
            }
            const mappings = await queryBuilder.getMany();
            return mappings.map((m) => m.DTO로_변환한다());
        }
        catch (error) {
            this.logger.error(`평가 대상자 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`, error.stack);
            throw error;
        }
    }
    async 맵핑을_조회한다(evaluationPeriodId, employeeId) {
        try {
            return await this.repository.findOne({
                where: { evaluationPeriodId, employeeId },
            });
        }
        catch (error) {
            this.logger.error(`맵핑 조회 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async 평가기간별_모든_평가_수정_가능_상태를_변경한다(evaluationPeriodId, isSelfEvaluationEditable, isPrimaryEvaluationEditable, isSecondaryEvaluationEditable, updatedBy) {
        this.logger.log(`평가기간별 모든 평가 수정 가능 상태 일괄 변경 시작 - 평가기간: ${evaluationPeriodId}`);
        try {
            const mappings = await this.repository.find({
                where: { evaluationPeriodId },
            });
            this.logger.log(`평가기간별 모든 평가 수정 가능 상태 일괄 변경 완료 - 평가기간: ${evaluationPeriodId}, 변경 수: ${mappings.length} (실제 변경 없음)`);
            return mappings.length;
        }
        catch (error) {
            this.logger.error(`평가기간별 모든 평가 수정 가능 상태 일괄 변경 실패 - 평가기간: ${evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
    async 중복_검사를_수행한다(evaluationPeriodId, employeeId) {
        const existing = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
        if (existing) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingDuplicateException(evaluationPeriodId, employeeId);
        }
    }
    async 평가기준을_제출한다(evaluationPeriodId, employeeId, submittedBy) {
        const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
        if (!mapping) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingNotFoundException(`평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        }
        if (mapping.평가기준이_제출되었는가()) {
            this.logger.warn(`이미 제출된 평가기준 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
            return mapping.DTO로_변환한다();
        }
        try {
            mapping.평가기준을_제출한다(submittedBy);
            const saved = await this.repository.save(mapping);
            return saved.DTO로_변환한다();
        }
        catch (error) {
            this.logger.error(`평가기준 제출 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async 평가기준_제출을_초기화한다(evaluationPeriodId, employeeId, updatedBy) {
        const mapping = await this.맵핑을_조회한다(evaluationPeriodId, employeeId);
        if (!mapping) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingNotFoundException(`평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        }
        if (!mapping.평가기준이_제출되었는가()) {
            this.logger.warn(`제출되지 않은 평가기준 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
            return mapping.DTO로_변환한다();
        }
        try {
            mapping.평가기준_제출을_초기화한다(updatedBy);
            const saved = await this.repository.save(mapping);
            return saved.DTO로_변환한다();
        }
        catch (error) {
            this.logger.error(`평가기준 제출 초기화 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    유효성을_검사한다(data) {
        if (!data.evaluationPeriodId) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingValidationException('평가기간 ID는 필수입니다.');
        }
        if (!data.employeeId) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingValidationException('직원 ID는 필수입니다.');
        }
        if (!data.createdBy) {
            throw new evaluation_period_employee_mapping_exceptions_1.EvaluationPeriodEmployeeMappingValidationException('생성자 ID는 필수입니다.');
        }
    }
};
exports.EvaluationPeriodEmployeeMappingService = EvaluationPeriodEmployeeMappingService;
exports.EvaluationPeriodEmployeeMappingService = EvaluationPeriodEmployeeMappingService = EvaluationPeriodEmployeeMappingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EvaluationPeriodEmployeeMappingService);
//# sourceMappingURL=evaluation-period-employee-mapping.service.js.map