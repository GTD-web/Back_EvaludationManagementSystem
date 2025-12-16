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
var EvaluationCriteriaManagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationCriteriaManagementService = void 0;
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const evaluation_line_entity_1 = require("../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_types_1 = require("../../domain/core/evaluation-line/evaluation-line.types");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_assignment_validation_service_1 = require("./services/wbs-assignment-validation.service");
const evaluation_period_employee_mapping_service_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_evaluation_step_approval_1 = require("../../domain/sub/employee-evaluation-step-approval");
const project_assignment_1 = require("./handlers/project-assignment");
const wbs_assignment_1 = require("./handlers/wbs-assignment");
const wbs_evaluation_criteria_1 = require("./handlers/wbs-evaluation-criteria");
const wbs_item_1 = require("./handlers/wbs-item");
const evaluation_line_1 = require("./handlers/evaluation-line");
let EvaluationCriteriaManagementService = EvaluationCriteriaManagementService_1 = class EvaluationCriteriaManagementService {
    commandBus;
    queryBus;
    evaluationLineMappingRepository;
    evaluationLineRepository;
    evaluationPeriodEmployeeMappingRepository;
    wbsAssignmentValidationService;
    evaluationPeriodEmployeeMappingService;
    stepApprovalService;
    logger = new common_1.Logger(EvaluationCriteriaManagementService_1.name);
    constructor(commandBus, queryBus, evaluationLineMappingRepository, evaluationLineRepository, evaluationPeriodEmployeeMappingRepository, wbsAssignmentValidationService, evaluationPeriodEmployeeMappingService, stepApprovalService) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
        this.evaluationLineRepository = evaluationLineRepository;
        this.evaluationPeriodEmployeeMappingRepository = evaluationPeriodEmployeeMappingRepository;
        this.wbsAssignmentValidationService = wbsAssignmentValidationService;
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
        this.stepApprovalService = stepApprovalService;
    }
    async 프로젝트를_할당한다(data, assignedBy) {
        const command = new project_assignment_1.CreateProjectAssignmentCommand(data, assignedBy);
        return await this.commandBus.execute(command);
    }
    async 프로젝트_할당을_취소한다(id, cancelledBy) {
        const command = new project_assignment_1.CancelProjectAssignmentCommand(id, cancelledBy);
        await this.commandBus.execute(command);
    }
    async 프로젝트_할당_목록을_조회한다(filter) {
        const query = new project_assignment_1.GetProjectAssignmentListQuery(filter);
        return await this.queryBus.execute(query);
    }
    async 특정_평가기간에_직원에게_할당된_프로젝트를_조회한다(employeeId, periodId) {
        const query = new project_assignment_1.GetEmployeeProjectAssignmentsQuery(employeeId, periodId);
        return await this.queryBus.execute(query);
    }
    async 프로젝트_할당_상세를_조회한다(assignmentId) {
        const query = new project_assignment_1.GetProjectAssignmentDetailQuery(assignmentId);
        return await this.queryBus.execute(query);
    }
    async 특정_평가기간에_프로젝트에_할당된_직원을_조회한다(projectId, periodId) {
        const query = new project_assignment_1.GetProjectAssignedEmployeesQuery(projectId, periodId);
        return await this.queryBus.execute(query);
    }
    async 특정_평가기간에_프로젝트가_할당되지_않은_직원_목록을_조회한다(periodId, projectId) {
        const query = new project_assignment_1.GetUnassignedEmployeesQuery(periodId, projectId);
        return await this.queryBus.execute(query);
    }
    async 프로젝트를_대량으로_할당한다(assignments, assignedBy) {
        const command = new project_assignment_1.BulkCreateProjectAssignmentCommand(assignments, assignedBy);
        return await this.commandBus.execute(command);
    }
    async 프로젝트_할당_순서를_변경한다(assignmentId, direction, updatedBy) {
        const command = new project_assignment_1.ChangeProjectAssignmentOrderCommand(assignmentId, direction, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 프로젝트_할당을_프로젝트_ID로_취소한다(employeeId, projectId, periodId, cancelledBy) {
        const assignmentList = await this.프로젝트_할당_목록을_조회한다({
            employeeId,
            projectId,
            periodId,
            page: 1,
            limit: 1,
        });
        if (!assignmentList.assignments ||
            assignmentList.assignments.length === 0) {
            return;
        }
        const assignmentId = assignmentList.assignments[0].id;
        await this.프로젝트_할당을_취소한다(assignmentId, cancelledBy);
    }
    async 프로젝트_할당_순서를_프로젝트_ID로_변경한다(employeeId, projectId, periodId, direction, updatedBy) {
        const assignmentList = await this.프로젝트_할당_목록을_조회한다({
            employeeId,
            projectId,
            periodId,
            page: 1,
            limit: 1,
        });
        if (!assignmentList.assignments ||
            assignmentList.assignments.length === 0) {
            throw new common_1.NotFoundException(`프로젝트 할당을 찾을 수 없습니다. (employeeId: ${employeeId}, projectId: ${projectId}, periodId: ${periodId})`);
        }
        const assignmentId = assignmentList.assignments[0].id;
        return await this.프로젝트_할당_순서를_변경한다(assignmentId, direction, updatedBy);
    }
    async WBS_할당_생성_비즈니스_규칙을_검증한다(data, manager) {
        await this.wbsAssignmentValidationService.할당생성비즈니스규칙검증한다(data, manager);
    }
    async WBS를_할당한다(data, assignedBy) {
        const command = new wbs_assignment_1.CreateWbsAssignmentCommand(data, assignedBy);
        return await this.commandBus.execute(command);
    }
    async WBS_할당을_취소한다(id, cancelledBy) {
        const command = new wbs_assignment_1.CancelWbsAssignmentCommand(id, cancelledBy);
        await this.commandBus.execute(command);
    }
    async WBS_할당_목록을_조회한다(filter, page, limit, orderBy, orderDirection) {
        const query = new wbs_assignment_1.GetWbsAssignmentListQuery(filter, page, limit, orderBy, orderDirection);
        return await this.queryBus.execute(query);
    }
    async 특정_평가기간에_직원에게_할당된_WBS를_조회한다(employeeId, periodId) {
        const query = new wbs_assignment_1.GetEmployeeWbsAssignmentsQuery(employeeId, periodId);
        return await this.queryBus.execute(query);
    }
    async 특정_평가기간에_프로젝트의_WBS_할당을_조회한다(projectId, periodId) {
        const query = new wbs_assignment_1.GetProjectWbsAssignmentsQuery(projectId, periodId);
        return await this.queryBus.execute(query);
    }
    async WBS_할당_상세를_조회한다(employeeId, wbsItemId, projectId, periodId) {
        const query = new wbs_assignment_1.GetWbsAssignmentDetailQuery(employeeId, wbsItemId, projectId, periodId);
        return await this.queryBus.execute(query);
    }
    async 특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId, periodId) {
        const query = new wbs_assignment_1.GetWbsItemAssignmentsQuery(wbsItemId, periodId);
        return await this.queryBus.execute(query);
    }
    async 특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(projectId, periodId, employeeId) {
        const query = new wbs_assignment_1.GetUnassignedWbsItemsQuery(projectId, periodId, employeeId);
        return await this.queryBus.execute(query);
    }
    async WBS를_대량으로_할당한다(assignments, assignedBy) {
        const command = new wbs_assignment_1.BulkCreateWbsAssignmentCommand(assignments, assignedBy);
        return await this.commandBus.execute(command);
    }
    async 평가기간의_WBS_할당을_초기화한다(periodId, resetBy) {
        const command = new wbs_assignment_1.ResetPeriodWbsAssignmentsCommand(periodId, resetBy);
        await this.commandBus.execute(command);
    }
    async 프로젝트의_WBS_할당을_초기화한다(projectId, periodId, resetBy) {
        const command = new wbs_assignment_1.ResetProjectWbsAssignmentsCommand(projectId, periodId, resetBy);
        await this.commandBus.execute(command);
    }
    async 직원의_WBS_할당을_초기화한다(employeeId, periodId, resetBy) {
        const command = new wbs_assignment_1.ResetEmployeeWbsAssignmentsCommand(employeeId, periodId, resetBy);
        await this.commandBus.execute(command);
    }
    async WBS_할당_순서를_변경한다(assignmentId, direction, updatedBy) {
        const command = new wbs_assignment_1.ChangeWbsAssignmentOrderCommand(assignmentId, direction, updatedBy);
        return await this.commandBus.execute(command);
    }
    async 특정_평가자가_평가해야_하는_피평가자_목록을_조회한다(evaluationPeriodId, evaluatorId) {
        const query = new evaluation_line_1.GetEvaluatorEmployeesQuery(evaluationPeriodId, evaluatorId);
        return await this.queryBus.execute(query);
    }
    async 평가기간의_평가자_목록을_조회한다(periodId, type) {
        const query = new evaluation_line_1.GetEvaluatorsByPeriodQuery(periodId, type);
        return await this.queryBus.execute(query);
    }
    async 직원_WBS별_평가라인을_구성한다(employeeId, wbsItemId, periodId, createdBy) {
        const command = new evaluation_line_1.ConfigureEmployeeWbsEvaluationLineCommand(employeeId, wbsItemId, periodId, createdBy);
        return await this.commandBus.execute(command);
    }
    async 일차_평가자를_구성한다(employeeId, periodId, evaluatorId, createdBy) {
        const command = new evaluation_line_1.ConfigurePrimaryEvaluatorCommand(employeeId, periodId, evaluatorId, createdBy);
        return await this.commandBus.execute(command);
    }
    async 평가기간의_모든_직원에_대해_managerId로_1차_평가자를_자동_구성한다(periodId, createdBy) {
        const command = new evaluation_line_1.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand(periodId, createdBy);
        return await this.commandBus.execute(command);
    }
    async 이차_평가자를_구성한다(employeeId, wbsItemId, periodId, evaluatorId, createdBy) {
        const command = new evaluation_line_1.ConfigureSecondaryEvaluatorCommand(employeeId, wbsItemId, periodId, evaluatorId, createdBy);
        return await this.commandBus.execute(command);
    }
    async 여러_피평가자의_일차_평가자를_일괄_구성한다(periodId, assignments, createdBy) {
        const logger = new common_1.Logger('EvaluationCriteriaManagementService');
        logger.log(`여러 피평가자의 1차 평가자 일괄 구성 시작 - 평가기간: ${periodId}, 건수: ${assignments.length}`);
        const results = [];
        let totalCreatedLines = 0;
        let totalCreatedMappings = 0;
        let successCount = 0;
        let failureCount = 0;
        for (const assignment of assignments) {
            try {
                const result = await this.일차_평가자를_구성한다(assignment.employeeId, periodId, assignment.evaluatorId, createdBy);
                totalCreatedLines += result.createdLines;
                totalCreatedMappings += result.createdMappings;
                successCount++;
                results.push({
                    employeeId: assignment.employeeId,
                    evaluatorId: assignment.evaluatorId,
                    status: 'success',
                    message: result.message,
                    mapping: result.mapping,
                });
            }
            catch (error) {
                failureCount++;
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`1차 평가자 구성 실패 - 직원: ${assignment.employeeId}, 평가자: ${assignment.evaluatorId}, 오류: ${errorMessage}`);
                results.push({
                    employeeId: assignment.employeeId,
                    evaluatorId: assignment.evaluatorId,
                    status: 'error',
                    error: errorMessage,
                });
            }
        }
        logger.log(`여러 피평가자의 1차 평가자 일괄 구성 완료 - 평가기간: ${periodId}, 전체: ${assignments.length}, 성공: ${successCount}, 실패: ${failureCount}`);
        return {
            periodId,
            totalCount: assignments.length,
            successCount,
            failureCount,
            createdLines: totalCreatedLines,
            createdMappings: totalCreatedMappings,
            results,
        };
    }
    async 여러_피평가자의_이차_평가자를_일괄_구성한다(periodId, assignments, createdBy) {
        const logger = new common_1.Logger('EvaluationCriteriaManagementService');
        logger.log(`여러 피평가자의 2차 평가자 일괄 구성 시작 - 평가기간: ${periodId}, 건수: ${assignments.length}`);
        const results = [];
        let totalCreatedLines = 0;
        let totalCreatedMappings = 0;
        let successCount = 0;
        let failureCount = 0;
        for (const assignment of assignments) {
            try {
                const result = await this.이차_평가자를_구성한다(assignment.employeeId, assignment.wbsItemId, periodId, assignment.evaluatorId, createdBy);
                totalCreatedLines += result.createdLines;
                totalCreatedMappings += result.createdMappings;
                successCount++;
                results.push({
                    employeeId: assignment.employeeId,
                    wbsItemId: assignment.wbsItemId,
                    evaluatorId: assignment.evaluatorId,
                    status: 'success',
                    message: result.message,
                    mapping: result.mapping,
                });
            }
            catch (error) {
                failureCount++;
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`2차 평가자 구성 실패 - 직원: ${assignment.employeeId}, WBS: ${assignment.wbsItemId}, 평가자: ${assignment.evaluatorId}, 오류: ${errorMessage}`);
                results.push({
                    employeeId: assignment.employeeId,
                    wbsItemId: assignment.wbsItemId,
                    evaluatorId: assignment.evaluatorId,
                    status: 'error',
                    error: errorMessage,
                });
            }
        }
        logger.log(`여러 피평가자의 2차 평가자 일괄 구성 완료 - 평가기간: ${periodId}, 전체: ${assignments.length}, 성공: ${successCount}, 실패: ${failureCount}`);
        return {
            periodId,
            totalCount: assignments.length,
            successCount,
            failureCount,
            createdLines: totalCreatedLines,
            createdMappings: totalCreatedMappings,
            results,
        };
    }
    async WBS_평가기준을_생성한다(data, createdBy) {
        const command = new wbs_evaluation_criteria_1.CreateWbsEvaluationCriteriaCommand(data, createdBy);
        return await this.commandBus.execute(command);
    }
    async WBS_평가기준을_수정한다(id, data, updatedBy) {
        const command = new wbs_evaluation_criteria_1.UpdateWbsEvaluationCriteriaCommand(id, data, updatedBy);
        return await this.commandBus.execute(command);
    }
    async WBS_평가기준을_저장한다(wbsItemId, criteria, importance, subProject, actionBy) {
        const existingCriteria = await this.특정_WBS항목의_평가기준을_조회한다(wbsItemId);
        if (existingCriteria && existingCriteria.length > 0) {
            const criteriaToUpdate = existingCriteria[0];
            return await this.WBS_평가기준을_수정한다(criteriaToUpdate.id, { criteria, importance, subProject }, actionBy);
        }
        else {
            return await this.WBS_평가기준을_생성한다({ wbsItemId, criteria, importance, subProject }, actionBy);
        }
    }
    async WBS_평가기준을_삭제한다(id, deletedBy) {
        const command = new wbs_evaluation_criteria_1.DeleteWbsEvaluationCriteriaCommand(id, deletedBy);
        return await this.commandBus.execute(command);
    }
    async WBS_항목을_생성한다(data, createdBy) {
        const command = new wbs_item_1.CreateWbsItemCommand(data, createdBy);
        const result = await this.commandBus.execute(command);
        return result.wbsItem;
    }
    async WBS_항목을_생성하고_코드를_자동_생성한다(data, createdBy) {
        const wbsCode = await this.WBS_코드를_자동_생성한다(data.projectId);
        const wbsItemData = {
            ...data,
            wbsCode,
        };
        return await this.WBS_항목을_생성한다(wbsItemData, createdBy);
    }
    async WBS_코드를_자동_생성한다(projectId) {
        const existingWbsItems = await this.프로젝트별_WBS_목록을_조회한다(projectId);
        const nextNumber = existingWbsItems.length + 1;
        const wbsCode = `WBS-${nextNumber.toString().padStart(3, '0')}`;
        this.logger.log('WBS 코드 자동 생성', {
            projectId,
            existingCount: existingWbsItems.length,
            generatedCode: wbsCode,
        });
        return wbsCode;
    }
    async WBS_항목을_수정한다(id, data, updatedBy) {
        const command = new wbs_item_1.UpdateWbsItemCommand(id, data, updatedBy);
        const result = await this.commandBus.execute(command);
        return result.wbsItem;
    }
    async 프로젝트별_WBS_목록을_조회한다(projectId) {
        const query = new wbs_item_1.GetWbsItemsByProjectQuery(projectId);
        const result = await this.queryBus.execute(query);
        return result.wbsItems;
    }
    async WBS_항목의_평가기준을_전체삭제한다(wbsItemId, deletedBy) {
        const command = new wbs_evaluation_criteria_1.DeleteWbsItemEvaluationCriteriaCommand(wbsItemId, deletedBy);
        return await this.commandBus.execute(command);
    }
    async WBS_평가기준_목록을_조회한다(filter) {
        const query = new wbs_evaluation_criteria_1.GetWbsEvaluationCriteriaListQuery(filter);
        return await this.queryBus.execute(query);
    }
    async WBS_평가기준_상세를_조회한다(id) {
        const query = new wbs_evaluation_criteria_1.GetWbsEvaluationCriteriaDetailQuery(id);
        return await this.queryBus.execute(query);
    }
    async 특정_WBS항목의_평가기준을_조회한다(wbsItemId) {
        const query = new wbs_evaluation_criteria_1.GetWbsItemEvaluationCriteriaQuery(wbsItemId);
        return await this.queryBus.execute(query);
    }
    async 특정_평가기간에_직원의_평가설정을_통합_조회한다(employeeId, periodId) {
        const query = new evaluation_line_1.GetEmployeeEvaluationSettingsQuery(employeeId, periodId);
        return await this.queryBus.execute(query);
    }
    async 평가라인을_검증한다(evaluateeId, evaluatorId, wbsId, evaluationType) {
        this.logger.debug('평가라인 검증 시작', {
            evaluateeId,
            evaluatorId,
            wbsId,
            evaluationType,
        });
        const expectedEvaluatorType = evaluationType === 'primary'
            ? evaluation_line_types_1.EvaluatorType.PRIMARY
            : evaluation_line_types_1.EvaluatorType.SECONDARY;
        const evaluationLine = await this.evaluationLineRepository.findOne({
            where: {
                evaluatorType: expectedEvaluatorType,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
        });
        if (!evaluationLine) {
            this.logger.error('평가라인을 찾을 수 없습니다', {
                evaluatorType: expectedEvaluatorType,
            });
            throw new common_1.ForbiddenException(`${evaluationType === 'primary' ? '1차' : '2차'} 평가라인 정보를 찾을 수 없습니다.`);
        }
        let mapping;
        if (evaluationType === 'primary') {
            mapping = await this.evaluationLineMappingRepository.findOne({
                where: {
                    employeeId: evaluateeId,
                    evaluatorId: evaluatorId,
                    wbsItemId: (0, typeorm_2.IsNull)(),
                    evaluationLineId: evaluationLine.id,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
        }
        else {
            mapping = await this.evaluationLineMappingRepository.findOne({
                where: {
                    employeeId: evaluateeId,
                    evaluatorId: evaluatorId,
                    wbsItemId: wbsId,
                    evaluationLineId: evaluationLine.id,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
        }
        if (!mapping) {
            this.logger.warn('평가라인 매핑을 찾을 수 없습니다', {
                evaluateeId,
                evaluatorId,
                wbsId,
                evaluationLineId: evaluationLine.id,
                evaluationType,
            });
            throw new common_1.ForbiddenException(`해당 평가자는 이 WBS 항목에 대한 ${evaluationType === 'primary' ? '1차' : '2차'} 평가 권한이 없습니다. (피평가자: ${evaluateeId}, 평가자: ${evaluatorId}, WBS: ${wbsId})`);
        }
        this.logger.debug('평가라인 검증 완료', {
            evaluateeId,
            evaluatorId,
            wbsId,
            evaluationType,
            evaluationLineId: evaluationLine.id,
        });
    }
    async 할당_가능한_프로젝트_목록을_조회한다(periodId, options = {}) {
        const query = new project_assignment_1.GetAvailableProjectsQuery(periodId, options);
        return await this.queryBus.execute(query);
    }
    async 평가기준을_제출한다(evaluationPeriodId, employeeId, submittedBy) {
        return await this.evaluationPeriodEmployeeMappingService.평가기준을_제출한다(evaluationPeriodId, employeeId, submittedBy);
    }
    async 평가기준_제출을_초기화한다(evaluationPeriodId, employeeId, updatedBy) {
        const result = await this.evaluationPeriodEmployeeMappingService.평가기준_제출을_초기화한다(evaluationPeriodId, employeeId, updatedBy);
        try {
            const mapping = await this.evaluationPeriodEmployeeMappingRepository.findOne({
                where: {
                    evaluationPeriodId,
                    employeeId,
                    deletedAt: null,
                },
            });
            if (mapping) {
                const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
                if (stepApproval) {
                    stepApproval.평가기준설정_대기로_변경한다(updatedBy);
                    await this.stepApprovalService.저장한다(stepApproval);
                    this.logger.log(`평가기준 제출 초기화 시 StepApproval 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`);
                }
            }
        }
        catch (error) {
            this.logger.warn(`평가기준 제출 초기화 시 StepApproval 상태 초기화 실패 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`, error);
        }
        return result;
    }
};
exports.EvaluationCriteriaManagementService = EvaluationCriteriaManagementService;
exports.EvaluationCriteriaManagementService = EvaluationCriteriaManagementService = EvaluationCriteriaManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __param(3, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __param(4, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        wbs_assignment_validation_service_1.WbsAssignmentValidationService,
        evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService,
        employee_evaluation_step_approval_1.EmployeeEvaluationStepApprovalService])
], EvaluationCriteriaManagementService);
//# sourceMappingURL=evaluation-criteria-management.service.js.map