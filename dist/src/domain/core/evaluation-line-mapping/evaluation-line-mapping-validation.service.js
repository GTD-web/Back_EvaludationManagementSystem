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
var EvaluationLineMappingValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationLineMappingValidationService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_line_mapping_entity_1 = require("./evaluation-line-mapping.entity");
const evaluation_line_mapping_exceptions_1 = require("./evaluation-line-mapping.exceptions");
let EvaluationLineMappingValidationService = EvaluationLineMappingValidationService_1 = class EvaluationLineMappingValidationService {
    evaluationLineMappingRepository;
    transactionManager;
    logger = new common_1.Logger(EvaluationLineMappingValidationService_1.name);
    constructor(evaluationLineMappingRepository, transactionManager) {
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.transactionManager = transactionManager;
    }
    async 생성데이터검증한다(createData, manager) {
        this.필수데이터검증한다(createData);
        this.데이터형식검증한다(createData);
        await this.비즈니스규칙검증한다(createData, manager);
        await this.중복검증한다(createData, manager);
        await this.참조무결성검증한다(createData, manager);
    }
    async 업데이트데이터검증한다(id, updateData, manager) {
        this.logger.debug(`평가 라인 맵핑 업데이트 데이터 검증 시작 - ID: ${id}`);
        if (Object.keys(updateData).length === 0) {
            throw new evaluation_line_mapping_exceptions_1.EvaluationLineMappingRequiredDataMissingException('업데이트할 데이터가 없습니다.');
        }
        this.업데이트데이터형식검증한다(updateData);
        if (updateData.evaluationLineId !== undefined) {
        }
        this.logger.debug(`평가 라인 맵핑 업데이트 데이터 검증 완료 - ID: ${id}`);
    }
    필수데이터검증한다(createData) {
        if (!createData.evaluationPeriodId) {
            throw new evaluation_line_mapping_exceptions_1.EvaluationLineMappingRequiredDataMissingException('평가기간 ID는 필수입니다.');
        }
        if (!createData.employeeId) {
            throw new evaluation_line_mapping_exceptions_1.EvaluationLineMappingRequiredDataMissingException('피평가자 ID는 필수입니다.');
        }
        if (!createData.evaluatorId) {
            throw new evaluation_line_mapping_exceptions_1.EvaluationLineMappingRequiredDataMissingException('평가자 ID는 필수입니다.');
        }
        if (!createData.evaluationLineId) {
            throw new evaluation_line_mapping_exceptions_1.EvaluationLineMappingRequiredDataMissingException('평가 라인 ID는 필수입니다.');
        }
    }
    데이터형식검증한다(createData) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(createData.evaluationPeriodId)) {
            throw new evaluation_line_mapping_exceptions_1.InvalidEvaluationLineMappingDataFormatException('평가기간 ID는 유효한 UUID 형식이어야 합니다.');
        }
        if (!uuidRegex.test(createData.employeeId)) {
            throw new evaluation_line_mapping_exceptions_1.InvalidEvaluationLineMappingDataFormatException('피평가자 ID는 유효한 UUID 형식이어야 합니다.');
        }
        if (!uuidRegex.test(createData.evaluatorId)) {
            throw new evaluation_line_mapping_exceptions_1.InvalidEvaluationLineMappingDataFormatException('평가자 ID는 유효한 UUID 형식이어야 합니다.');
        }
        if (!uuidRegex.test(createData.evaluationLineId)) {
            throw new evaluation_line_mapping_exceptions_1.InvalidEvaluationLineMappingDataFormatException('평가 라인 ID는 유효한 UUID 형식이어야 합니다.');
        }
        if (createData.wbsItemId && !uuidRegex.test(createData.wbsItemId)) {
            throw new evaluation_line_mapping_exceptions_1.InvalidEvaluationLineMappingDataFormatException('WBS 항목 ID는 유효한 UUID 형식이어야 합니다.');
        }
    }
    업데이트데이터형식검증한다(updateData) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (updateData.evaluationLineId !== undefined &&
            !uuidRegex.test(updateData.evaluationLineId)) {
            throw new evaluation_line_mapping_exceptions_1.InvalidEvaluationLineMappingDataFormatException('평가 라인 ID는 유효한 UUID 형식이어야 합니다.');
        }
        if (updateData.wbsItemId !== undefined &&
            updateData.wbsItemId !== null &&
            !uuidRegex.test(updateData.wbsItemId)) {
            throw new evaluation_line_mapping_exceptions_1.InvalidEvaluationLineMappingDataFormatException('WBS 항목 ID는 유효한 UUID 형식이어야 합니다.');
        }
    }
    async 비즈니스규칙검증한다(createData, manager) {
    }
    async 중복검증한다(createData, manager) {
        const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
        let queryBuilder = repository
            .createQueryBuilder('mapping')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId: createData.evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', {
            employeeId: createData.employeeId,
        })
            .andWhere('mapping.evaluatorId = :evaluatorId', {
            evaluatorId: createData.evaluatorId,
        })
            .andWhere('mapping.evaluationLineId = :evaluationLineId', {
            evaluationLineId: createData.evaluationLineId,
        });
        if (createData.wbsItemId) {
            queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', {
                wbsItemId: createData.wbsItemId,
            });
        }
        else {
            queryBuilder.andWhere('mapping.wbsItemId IS NULL');
        }
        const existingMapping = await queryBuilder.getOne();
        if (existingMapping) {
            throw new evaluation_line_mapping_exceptions_1.EvaluationLineMappingDuplicateException('동일한 평가 관계가 이미 존재합니다.');
        }
    }
    async 참조무결성검증한다(createData, manager) {
    }
    async 맵핑존재확인한다(id, manager) {
        const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
        const count = await repository.count({ where: { id } });
        return count > 0;
    }
    async 평가관계존재확인한다(employeeId, evaluatorId, wbsItemId, manager) {
        const repository = this.transactionManager.getRepository(evaluation_line_mapping_entity_1.EvaluationLineMapping, this.evaluationLineMappingRepository, manager);
        let queryBuilder = repository
            .createQueryBuilder('mapping')
            .where('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId });
        if (wbsItemId) {
            queryBuilder.andWhere('mapping.wbsItemId = :wbsItemId', { wbsItemId });
        }
        else {
            queryBuilder.andWhere('mapping.wbsItemId IS NULL');
        }
        const count = await queryBuilder.getCount();
        return count > 0;
    }
};
exports.EvaluationLineMappingValidationService = EvaluationLineMappingValidationService;
exports.EvaluationLineMappingValidationService = EvaluationLineMappingValidationService = EvaluationLineMappingValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], EvaluationLineMappingValidationService);
//# sourceMappingURL=evaluation-line-mapping-validation.service.js.map