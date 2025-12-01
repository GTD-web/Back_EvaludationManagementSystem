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
var EvaluationProjectAssignmentValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationProjectAssignmentValidationService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("./evaluation-project-assignment.entity");
const evaluation_project_assignment_exceptions_1 = require("./evaluation-project-assignment.exceptions");
let EvaluationProjectAssignmentValidationService = EvaluationProjectAssignmentValidationService_1 = class EvaluationProjectAssignmentValidationService {
    evaluationProjectAssignmentRepository;
    transactionManager;
    logger = new common_1.Logger(EvaluationProjectAssignmentValidationService_1.name);
    constructor(evaluationProjectAssignmentRepository, transactionManager) {
        this.evaluationProjectAssignmentRepository = evaluationProjectAssignmentRepository;
        this.transactionManager = transactionManager;
    }
    async 생성데이터검증한다(createData, manager) {
        this.필수데이터검증한다(createData);
        this.데이터형식검증한다(createData);
        await this.생성비즈니스규칙검증한다(createData, manager);
    }
    async 업데이트데이터검증한다(id, updateData, manager) {
        const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
        const existingAssignment = await repository.findOne({ where: { id } });
        if (!existingAssignment) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentRequiredDataMissingException('존재하지 않는 평가 프로젝트 할당입니다.');
        }
        if (updateData.assignedBy !== undefined) {
            this.할당자형식검증한다(updateData.assignedBy);
        }
        await this.업데이트비즈니스규칙검증한다(id, updateData, existingAssignment, manager);
    }
    필수데이터검증한다(createData) {
        if (!createData.periodId?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentRequiredDataMissingException('평가 기간 ID는 필수입니다.');
        }
        if (!createData.employeeId?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentRequiredDataMissingException('직원 ID는 필수입니다.');
        }
        if (!createData.projectId?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentRequiredDataMissingException('프로젝트 ID는 필수입니다.');
        }
        if (!createData.assignedBy?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentRequiredDataMissingException('할당자 ID는 필수입니다.');
        }
    }
    데이터형식검증한다(data) {
        if ('periodId' in data && data.periodId !== undefined) {
            this.ID형식검증한다(data.periodId, 'periodId');
        }
        if ('employeeId' in data && data.employeeId !== undefined) {
            this.ID형식검증한다(data.employeeId, 'employeeId');
        }
        if ('projectId' in data && data.projectId !== undefined) {
            this.ID형식검증한다(data.projectId, 'projectId');
        }
        if (data.assignedBy !== undefined) {
            this.할당자형식검증한다(data.assignedBy);
        }
    }
    ID형식검증한다(id, fieldName) {
        if (!id?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.InvalidEvaluationProjectAssignmentDataFormatException(fieldName, '공백이 아닌 문자열', id);
        }
        if (id.length > 255) {
            throw new evaluation_project_assignment_exceptions_1.InvalidEvaluationProjectAssignmentDataFormatException(fieldName, '255자 이하', id);
        }
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(id)) {
            throw new evaluation_project_assignment_exceptions_1.InvalidEvaluationProjectAssignmentDataFormatException(fieldName, 'UUID 형식', id);
        }
    }
    할당자형식검증한다(assignedBy) {
        if (!assignedBy?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.InvalidEvaluationProjectAssignmentDataFormatException('assignedBy', '공백이 아닌 문자열', assignedBy);
        }
        if (assignedBy.length > 255) {
            throw new evaluation_project_assignment_exceptions_1.InvalidEvaluationProjectAssignmentDataFormatException('assignedBy', '255자 이하', assignedBy);
        }
    }
    async 생성비즈니스규칙검증한다(createData, manager) {
        await this.중복할당검증한다(createData.periodId, createData.employeeId, createData.projectId, undefined, manager);
        await this.평가기간유효성검증한다(createData.periodId, manager);
        await this.직원유효성검증한다(createData.employeeId, manager);
        await this.프로젝트유효성검증한다(createData.projectId, manager);
    }
    async 업데이트비즈니스규칙검증한다(id, updateData, existingAssignment, manager) {
        if (updateData.assignedBy) {
            await this.할당자유효성검증한다(updateData.assignedBy, manager);
        }
    }
    async 할당생성비즈니스규칙검증한다(createData, manager) {
        await this.중복할당검증한다(createData.periodId, createData.employeeId, createData.projectId, undefined, manager);
    }
    async 할당업데이트비즈니스규칙검증한다(id, updateData, manager) {
        const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
        const existingAssignment = await repository.findOne({ where: { id } });
        if (!existingAssignment) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentRequiredDataMissingException('존재하지 않는 평가 프로젝트 할당입니다.');
        }
        await this.업데이트비즈니스규칙검증한다(id, updateData, existingAssignment, manager);
    }
    async 할당삭제비즈니스규칙검증한다(assignment) {
    }
    async 중복할당검증한다(periodId, employeeId, projectId, excludeId, manager) {
        const repository = this.transactionManager.getRepository(evaluation_project_assignment_entity_1.EvaluationProjectAssignment, this.evaluationProjectAssignmentRepository, manager);
        const queryBuilder = repository
            .createQueryBuilder('assignment')
            .where('assignment.periodId = :periodId', { periodId })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.projectId = :projectId', { projectId })
            .andWhere('assignment.deletedAt IS NULL');
        if (excludeId) {
            queryBuilder.andWhere('assignment.id != :excludeId', { excludeId });
        }
        const count = await queryBuilder.getCount();
        if (count > 0) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentDuplicateException(periodId, employeeId, projectId);
        }
    }
    async 평가기간유효성검증한다(periodId, manager) {
        if (!periodId?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentBusinessRuleViolationException('유효하지 않은 평가기간 ID입니다.');
        }
    }
    async 직원유효성검증한다(employeeId, manager) {
        if (!employeeId?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentBusinessRuleViolationException('유효하지 않은 직원 ID입니다.');
        }
    }
    async 프로젝트유효성검증한다(projectId, manager) {
        if (!projectId?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentBusinessRuleViolationException('유효하지 않은 프로젝트 ID입니다.');
        }
    }
    async 할당자유효성검증한다(assignedBy, manager) {
        if (!assignedBy?.trim()) {
            throw new evaluation_project_assignment_exceptions_1.EvaluationProjectAssignmentBusinessRuleViolationException('유효하지 않은 할당자 ID입니다.');
        }
    }
};
exports.EvaluationProjectAssignmentValidationService = EvaluationProjectAssignmentValidationService;
exports.EvaluationProjectAssignmentValidationService = EvaluationProjectAssignmentValidationService = EvaluationProjectAssignmentValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], EvaluationProjectAssignmentValidationService);
//# sourceMappingURL=evaluation-project-assignment-validation.service.js.map