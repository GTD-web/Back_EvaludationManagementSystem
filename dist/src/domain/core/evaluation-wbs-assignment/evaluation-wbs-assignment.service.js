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
var EvaluationWbsAssignmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationWbsAssignmentService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_wbs_assignment_validation_service_1 = require("./evaluation-wbs-assignment-validation.service");
const evaluation_wbs_assignment_entity_1 = require("./evaluation-wbs-assignment.entity");
const evaluation_wbs_assignment_exceptions_1 = require("./evaluation-wbs-assignment.exceptions");
let EvaluationWbsAssignmentService = EvaluationWbsAssignmentService_1 = class EvaluationWbsAssignmentService {
    evaluationWbsAssignmentRepository;
    dataSource;
    transactionManager;
    validationService;
    logger = new common_1.Logger(EvaluationWbsAssignmentService_1.name);
    constructor(evaluationWbsAssignmentRepository, dataSource, transactionManager, validationService) {
        this.evaluationWbsAssignmentRepository = evaluationWbsAssignmentRepository;
        this.dataSource = dataSource;
        this.transactionManager = transactionManager;
        this.validationService = validationService;
    }
    async executeSafeDomainOperation(operation, context) {
        return this.transactionManager.executeSafeOperation(operation, context);
    }
    async ID로_조회한다(id, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            const assignment = await repository.findOne({ where: { id } });
            return assignment || null;
        }, 'ID로_조회한다');
    }
    async 전체_조회한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            return await repository.find({
                order: { assignedDate: 'DESC' },
            });
        }, '전체_조회한다');
    }
    async 평가기간별_조회한다(periodId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            return await repository.find({
                where: { periodId },
                order: { assignedDate: 'DESC' },
            });
        }, '평가기간별_조회한다');
    }
    async 직원별_조회한다(employeeId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            return await repository.find({
                where: { employeeId },
                order: { assignedDate: 'DESC' },
            });
        }, '직원별_조회한다');
    }
    async 프로젝트별_조회한다(projectId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            return await repository.find({
                where: { projectId },
                order: { assignedDate: 'DESC' },
            });
        }, '프로젝트별_조회한다');
    }
    async WBS항목별_조회한다(wbsItemId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            return await repository.find({
                where: { wbsItemId },
                order: { assignedDate: 'DESC' },
            });
        }, 'WBS항목별_조회한다');
    }
    async 평가기간_직원별_조회한다(periodId, employeeId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            return await repository.find({
                where: { periodId, employeeId },
                order: { assignedDate: 'DESC' },
            });
        }, '평가기간_직원별_조회한다');
    }
    async 프로젝트_WBS별_조회한다(projectId, wbsItemId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            return await repository.find({
                where: { projectId, wbsItemId },
                order: { assignedDate: 'DESC' },
            });
        }, '프로젝트_WBS별_조회한다');
    }
    async 필터_조회한다(filter, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            const queryBuilder = repository.createQueryBuilder('assignment');
            queryBuilder.andWhere('assignment.deletedAt IS NULL');
            queryBuilder.leftJoin('evaluation_project_assignment', 'projectAssignment', 'projectAssignment.projectId = assignment.projectId AND projectAssignment.periodId = assignment.periodId AND projectAssignment.employeeId = assignment.employeeId AND projectAssignment.deletedAt IS NULL');
            queryBuilder.andWhere('projectAssignment.id IS NOT NULL');
            if (filter.periodId) {
                queryBuilder.andWhere('assignment.periodId = :periodId', {
                    periodId: filter.periodId,
                });
            }
            if (filter.employeeId) {
                queryBuilder.andWhere('assignment.employeeId = :employeeId', {
                    employeeId: filter.employeeId,
                });
            }
            if (filter.projectId) {
                queryBuilder.andWhere('assignment.projectId = :projectId', {
                    projectId: filter.projectId,
                });
            }
            if (filter.wbsItemId) {
                queryBuilder.andWhere('assignment.wbsItemId = :wbsItemId', {
                    wbsItemId: filter.wbsItemId,
                });
            }
            if (filter.assignedBy) {
                queryBuilder.andWhere('assignment.assignedBy = :assignedBy', {
                    assignedBy: filter.assignedBy,
                });
            }
            if (filter.assignedDateFrom) {
                queryBuilder.andWhere('assignment.assignedDate >= :assignedDateFrom', {
                    assignedDateFrom: filter.assignedDateFrom,
                });
            }
            if (filter.assignedDateTo) {
                queryBuilder.andWhere('assignment.assignedDate <= :assignedDateTo', {
                    assignedDateTo: filter.assignedDateTo,
                });
            }
            return await queryBuilder
                .orderBy('assignment.assignedDate', 'DESC')
                .getMany();
        }, '필터_조회한다');
    }
    async 생성한다(createData, manager) {
        return this.executeSafeDomainOperation(async () => {
            const entityManager = manager || this.dataSource.manager;
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, entityManager);
            const lastAssignment = await repository.findOne({
                where: {
                    periodId: createData.periodId,
                    projectId: createData.projectId,
                    employeeId: createData.employeeId,
                },
                order: { displayOrder: 'DESC' },
            });
            const assignment = new evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment(createData);
            assignment.displayOrder = lastAssignment
                ? lastAssignment.displayOrder + 1
                : 0;
            const savedAssignment = await repository.save(assignment);
            this.logger.log(`평가 WBS 할당 생성 완료 - ID: ${savedAssignment.id}`);
            return savedAssignment;
        }, '생성한다');
    }
    async 업데이트한다(id, updateData, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const entityManager = manager || this.dataSource.manager;
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, entityManager);
            const assignment = await repository.findOne({ where: { id } });
            if (!assignment) {
                throw new evaluation_wbs_assignment_exceptions_1.EvaluationWbsAssignmentNotFoundException(id);
            }
            await this.validationService.할당업데이트비즈니스규칙검증한다(id, updateData, entityManager);
            const filteredUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined));
            Object.assign(assignment, filteredUpdateData, {
                updatedBy,
                updatedAt: new Date(),
            });
            const savedAssignment = await repository.save(assignment);
            this.logger.log(`평가 WBS 할당 업데이트 완료 - ID: ${id}, 업데이트자: ${updatedBy}`);
            return savedAssignment;
        }, '업데이트한다');
    }
    async 삭제한다(id, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            const assignment = await repository.findOne({ where: { id } });
            if (!assignment) {
                this.logger.log(`삭제할 할당을 찾을 수 없습니다 - ID: ${id} (이미 삭제되었을 수 있음)`);
                return;
            }
            await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
            await repository.delete(id);
            this.logger.log(`평가 WBS 할당 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
        }, '삭제한다');
    }
    async 할당_존재_확인한다(periodId, employeeId, projectId, wbsItemId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            const count = await repository.count({
                where: { periodId, employeeId, projectId, wbsItemId },
            });
            return count > 0;
        }, '할당_존재_확인한다');
    }
    async 평가기간_할당_전체삭제한다(periodId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            const assignments = await repository.find({ where: { periodId } });
            for (const assignment of assignments) {
                await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
            }
            await repository.delete({ periodId });
            this.logger.log(`평가기간 WBS 할당 전체 삭제 완료 - 평가기간 ID: ${periodId}, 삭제자: ${deletedBy}`);
        }, '평가기간_할당_전체삭제한다');
    }
    async 직원_할당_전체삭제한다(employeeId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            const assignments = await repository.find({ where: { employeeId } });
            for (const assignment of assignments) {
                await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
            }
            await repository.delete({ employeeId });
            this.logger.log(`직원 WBS 할당 전체 삭제 완료 - 직원 ID: ${employeeId}, 삭제자: ${deletedBy}`);
        }, '직원_할당_전체삭제한다');
    }
    async 프로젝트_할당_전체삭제한다(projectId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            const assignments = await repository.find({ where: { projectId } });
            for (const assignment of assignments) {
                await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
            }
            await repository.delete({ projectId });
            this.logger.log(`프로젝트 WBS 할당 전체 삭제 완료 - 프로젝트 ID: ${projectId}, 삭제자: ${deletedBy}`);
        }, '프로젝트_할당_전체삭제한다');
    }
    async WBS항목_할당_전체삭제한다(wbsItemId, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, manager);
            const assignments = await repository.find({ where: { wbsItemId } });
            for (const assignment of assignments) {
                await this.validationService.할당삭제비즈니스규칙검증한다(assignment);
            }
            await repository.delete({ wbsItemId });
            this.logger.log(`WBS 항목 할당 전체 삭제 완료 - WBS 항목 ID: ${wbsItemId}, 삭제자: ${deletedBy}`);
        }, 'WBS항목_할당_전체삭제한다');
    }
    async 순서를_변경한다(assignmentId, direction, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const entityManager = manager || this.dataSource.manager;
            const repository = this.transactionManager.getRepository(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment, this.evaluationWbsAssignmentRepository, entityManager);
            const currentAssignment = await repository.findOne({
                where: { id: assignmentId },
            });
            if (!currentAssignment) {
                this.logger.log(`순서를 변경할 할당을 찾을 수 없습니다 - ID: ${assignmentId}`);
                return null;
            }
            const allAssignments = await repository.find({
                where: {
                    periodId: currentAssignment.periodId,
                    projectId: currentAssignment.projectId,
                    employeeId: currentAssignment.employeeId,
                },
                order: { displayOrder: 'ASC' },
            });
            const currentIndex = allAssignments.findIndex((a) => a.id === assignmentId);
            if (direction === 'up' && currentIndex === 0) {
                this.logger.warn(`이미 첫 번째 항목입니다 - ID: ${assignmentId}`);
                return currentAssignment;
            }
            if (direction === 'down' && currentIndex === allAssignments.length - 1) {
                this.logger.warn(`이미 마지막 항목입니다 - ID: ${assignmentId}`);
                return currentAssignment;
            }
            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            const targetAssignment = allAssignments[targetIndex];
            const tempOrder = currentAssignment.displayOrder;
            currentAssignment.순서를_변경한다(targetAssignment.displayOrder);
            targetAssignment.순서를_변경한다(tempOrder);
            currentAssignment.메타데이터를_업데이트한다(updatedBy);
            targetAssignment.메타데이터를_업데이트한다(updatedBy);
            await repository.save([currentAssignment, targetAssignment]);
            this.logger.log(`WBS 할당 순서 변경 완료 - ID: ${assignmentId}, 방향: ${direction}`);
            return currentAssignment;
        }, '순서를_변경한다');
    }
};
exports.EvaluationWbsAssignmentService = EvaluationWbsAssignmentService;
exports.EvaluationWbsAssignmentService = EvaluationWbsAssignmentService = EvaluationWbsAssignmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(1, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        transaction_manager_service_1.TransactionManagerService,
        evaluation_wbs_assignment_validation_service_1.EvaluationWbsAssignmentValidationService])
], EvaluationWbsAssignmentService);
//# sourceMappingURL=evaluation-wbs-assignment.service.js.map