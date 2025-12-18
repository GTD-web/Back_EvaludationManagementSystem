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
var WbsAssignmentBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsAssignmentBusinessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_criteria_management_service_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const evaluation_activity_log_context_service_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
const performance_evaluation_service_1 = require("../../context/performance-evaluation-context/performance-evaluation.service");
const employee_service_1 = require("../../domain/common/employee/employee.service");
const project_service_1 = require("../../domain/common/project/project.service");
const evaluation_line_service_1 = require("../../domain/core/evaluation-line/evaluation-line.service");
const evaluation_line_mapping_service_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
const evaluation_wbs_assignment_service_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
const evaluation_wbs_assignment_entity_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const evaluation_line_types_1 = require("../../domain/core/evaluation-line/evaluation-line.types");
const wbs_item_types_1 = require("../../domain/common/wbs-item/wbs-item.types");
let WbsAssignmentBusinessService = WbsAssignmentBusinessService_1 = class WbsAssignmentBusinessService {
    evaluationCriteriaManagementService;
    activityLogContextService;
    performanceEvaluationService;
    employeeService;
    projectService;
    evaluationLineService;
    evaluationLineMappingService;
    evaluationWbsAssignmentService;
    wbsAssignmentRepository;
    logger = new common_1.Logger(WbsAssignmentBusinessService_1.name);
    constructor(evaluationCriteriaManagementService, activityLogContextService, performanceEvaluationService, employeeService, projectService, evaluationLineService, evaluationLineMappingService, evaluationWbsAssignmentService, wbsAssignmentRepository) {
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
        this.activityLogContextService = activityLogContextService;
        this.performanceEvaluationService = performanceEvaluationService;
        this.employeeService = employeeService;
        this.projectService = projectService;
        this.evaluationLineService = evaluationLineService;
        this.evaluationLineMappingService = evaluationLineMappingService;
        this.evaluationWbsAssignmentService = evaluationWbsAssignmentService;
        this.wbsAssignmentRepository = wbsAssignmentRepository;
    }
    async WBS를_할당한다(params) {
        this.logger.log('WBS 할당 비즈니스 로직 시작', {
            employeeId: params.employeeId,
            wbsItemId: params.wbsItemId,
            projectId: params.projectId,
        });
        const data = {
            employeeId: params.employeeId,
            wbsItemId: params.wbsItemId,
            projectId: params.projectId,
            periodId: params.periodId,
            assignedBy: params.assignedBy,
        };
        const assignment = await this.evaluationCriteriaManagementService.WBS를_할당한다(data, params.assignedBy);
        const existingCriteria = await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(params.wbsItemId);
        if (!existingCriteria || existingCriteria.length === 0) {
            this.logger.log('WBS 평가기준이 없어 빈 기준을 생성합니다', {
                wbsItemId: params.wbsItemId,
            });
            await this.evaluationCriteriaManagementService.WBS_평가기준을_생성한다({
                wbsItemId: params.wbsItemId,
                criteria: '',
                importance: 5,
            }, params.assignedBy);
        }
        await this.평가라인을_자동으로_구성한다(params.employeeId, params.wbsItemId, params.projectId, params.periodId, params.assignedBy);
        this.logger.log('WBS별 평가라인 구성 시작', {
            employeeId: params.employeeId,
            wbsItemId: params.wbsItemId,
            periodId: params.periodId,
        });
        const wbsEvaluationLineResult = await this.evaluationCriteriaManagementService.직원_WBS별_평가라인을_구성한다(params.employeeId, params.wbsItemId, params.periodId, params.assignedBy);
        this.logger.log('WBS별 평가라인 구성 완료', {
            createdLines: wbsEvaluationLineResult.createdLines,
            createdMappings: wbsEvaluationLineResult.createdMappings,
        });
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId: params.periodId,
                employeeId: params.employeeId,
                activityType: 'wbs_assignment',
                activityAction: 'created',
                activityTitle: 'WBS 할당',
                relatedEntityType: 'wbs_assignment',
                relatedEntityId: assignment.id,
                performedBy: params.assignedBy,
                activityMetadata: {
                    wbsItemId: params.wbsItemId,
                    projectId: params.projectId,
                },
            });
        }
        catch (error) {
            this.logger.warn('WBS 할당 생성 활동 내역 기록 실패', {
                assignmentId: assignment.id,
                error: error.message,
            });
        }
        this.logger.log('WBS 할당, 평가기준 생성, 평가라인 구성 완료', {
            assignmentId: assignment.id,
        });
        return assignment;
    }
    async WBS_할당을_취소한다(params) {
        this.logger.log('WBS 할당 취소 비즈니스 로직 시작', {
            assignmentId: params.assignmentId,
        });
        const assignment = await this.evaluationWbsAssignmentService.ID로_조회한다(params.assignmentId);
        if (!assignment) {
            this.logger.log('WBS 할당을 찾을 수 없습니다. 평가기준 정리를 생략합니다.', {
                assignmentId: params.assignmentId,
            });
            return;
        }
        const employeeId = assignment.employeeId;
        const wbsItemId = assignment.wbsItemId;
        const periodId = assignment.periodId;
        this.logger.log('🔵 [STEP 1] WBS 할당 정보 확인 완료, 자기평가 삭제 시작', {
            employeeId,
            wbsItemId,
            periodId,
            hasPerformanceEvaluationService: !!this.performanceEvaluationService,
        });
        let deletionResult = {
            deletedCount: 0,
            deletedEvaluations: [],
        };
        try {
            this.logger.log('🔵 [STEP 1-1] 자기평가 삭제 호출 시작');
            deletionResult =
                await this.performanceEvaluationService.WBS할당_자기평가를_삭제한다({
                    employeeId,
                    periodId,
                    wbsItemId,
                    deletedBy: params.cancelledBy,
                });
            this.logger.log('🔵 [STEP 1-2] 자기평가 삭제 호출 완료', {
                deletedCount: deletionResult.deletedCount,
                deletedEvaluations: deletionResult.deletedEvaluations,
            });
            if (deletionResult.deletedCount > 0) {
                this.logger.log(`✅ 자기평가 ${deletionResult.deletedCount}개 삭제 완료`, {
                    assignmentId: params.assignmentId,
                    wbsItemId,
                    deletedEvaluations: deletionResult.deletedEvaluations,
                });
            }
            else {
                this.logger.log('ℹ️ 삭제할 자기평가가 없습니다', {
                    employeeId,
                    periodId,
                    wbsItemId,
                });
            }
        }
        catch (error) {
            this.logger.error('❌ 자기평가 삭제 중 에러 발생', {
                error: error.message,
                stack: error.stack,
                employeeId,
                periodId,
                wbsItemId,
            });
        }
        this.logger.log('🔵 [STEP 2] 남은 WBS 할당 확인 시작', { wbsItemId });
        const remainingAssignments = await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId, periodId);
        if (!remainingAssignments || remainingAssignments.length === 0) {
            this.logger.log('🔵 [STEP 3] 마지막 WBS 할당이므로 평가기준 삭제 시작', {
                wbsItemId,
            });
            await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(wbsItemId, params.cancelledBy);
            this.logger.log('✅ 평가기준 삭제 완료', { wbsItemId });
        }
        else {
            this.logger.log('ℹ️ 남은 WBS 할당이 있어 평가기준은 유지합니다', {
                wbsItemId,
                remainingCount: remainingAssignments.length,
            });
        }
        this.logger.log('🔵 [STEP 4] 평가라인 매핑 삭제 시작', {
            employeeId,
            wbsItemId,
            periodId,
        });
        await this.평가라인_매핑을_삭제한다(employeeId, wbsItemId, periodId, params.cancelledBy);
        this.logger.log('✅ 평가라인 매핑 삭제 완료');
        this.logger.log('🔵 [STEP 5] WBS 할당 취소 시작', {
            assignmentId: params.assignmentId,
        });
        await this.evaluationCriteriaManagementService.WBS_할당을_취소한다(params.assignmentId, params.cancelledBy);
        this.logger.log('✅ WBS 할당 취소 완료', {
            assignmentId: params.assignmentId,
        });
        this.logger.log('🔵 [STEP 6] 활동 내역 기록 시작');
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId,
                employeeId,
                activityType: 'wbs_assignment',
                activityAction: 'cancelled',
                activityTitle: 'WBS 할당 취소',
                relatedEntityType: 'wbs_assignment',
                relatedEntityId: params.assignmentId,
                performedBy: params.cancelledBy,
                activityMetadata: {
                    wbsItemId,
                    projectId: assignment.projectId,
                },
            });
            this.logger.log('✅ 활동 내역 기록 완료');
        }
        catch (error) {
            this.logger.warn('⚠️ 활동 내역 기록 실패 (계속 진행)', {
                assignmentId: params.assignmentId,
                error: error.message,
            });
        }
        this.logger.log('🎉 WBS 할당 취소 프로세스 완료', {
            assignmentId: params.assignmentId,
            자기평가_삭제: deletionResult.deletedCount,
            평가기준_삭제: !remainingAssignments || remainingAssignments.length === 0,
        });
    }
    async WBS_할당을_WBS_ID로_취소한다(params) {
        this.logger.log('WBS ID 기반 할당 취소 비즈니스 로직 시작', {
            employeeId: params.employeeId,
            wbsItemId: params.wbsItemId,
            projectId: params.projectId,
            periodId: params.periodId,
        });
        const assignmentDetail = await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(params.employeeId, params.wbsItemId, params.projectId, params.periodId);
        if (!assignmentDetail) {
            this.logger.log('WBS 할당을 찾을 수 없습니다. 평가기준 정리를 생략합니다.', {
                employeeId: params.employeeId,
                wbsItemId: params.wbsItemId,
                projectId: params.projectId,
                periodId: params.periodId,
            });
            return;
        }
        await this.WBS_할당을_취소한다({
            assignmentId: assignmentDetail.id,
            cancelledBy: params.cancelledBy,
        });
    }
    async WBS를_대량으로_할당한다(params) {
        this.logger.log('WBS 대량 할당 비즈니스 로직 시작', {
            count: params.assignments.length,
        });
        const assignmentsData = params.assignments.map((assignment) => ({
            employeeId: assignment.employeeId,
            wbsItemId: assignment.wbsItemId,
            projectId: assignment.projectId,
            periodId: assignment.periodId,
            assignedBy: params.assignedBy,
        }));
        const assignments = await this.evaluationCriteriaManagementService.WBS를_대량으로_할당한다(assignmentsData, params.assignedBy);
        const uniqueWbsItemIds = [
            ...new Set(params.assignments.map((a) => a.wbsItemId)),
        ];
        await Promise.all(uniqueWbsItemIds.map(async (wbsItemId) => {
            const existingCriteria = await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(wbsItemId);
            if (!existingCriteria || existingCriteria.length === 0) {
                this.logger.log('WBS 평가기준이 없어 빈 기준을 생성합니다', {
                    wbsItemId,
                });
                await this.evaluationCriteriaManagementService.WBS_평가기준을_생성한다({
                    wbsItemId,
                    criteria: '',
                    importance: 5,
                }, params.assignedBy);
            }
        }));
        await Promise.all(params.assignments.map(async (assignment) => {
            await this.평가라인을_자동으로_구성한다(assignment.employeeId, assignment.wbsItemId, assignment.projectId, assignment.periodId, params.assignedBy);
        }));
        await Promise.all(assignments.map(async (assignment) => {
            try {
                await this.activityLogContextService.활동내역을_기록한다({
                    periodId: assignment.periodId,
                    employeeId: assignment.employeeId,
                    activityType: 'wbs_assignment',
                    activityAction: 'created',
                    activityTitle: 'WBS 할당',
                    relatedEntityType: 'wbs_assignment',
                    relatedEntityId: assignment.id,
                    performedBy: params.assignedBy,
                    activityMetadata: {
                        wbsItemId: assignment.wbsItemId,
                        projectId: assignment.projectId,
                    },
                });
            }
            catch (error) {
                this.logger.warn('WBS 대량 할당 활동 내역 기록 실패', {
                    assignmentId: assignment.id,
                    error: error.message,
                });
            }
        }));
        this.logger.log('WBS 대량 할당, 평가기준 생성, 평가라인 구성 완료', {
            count: assignments.length,
        });
        return assignments;
    }
    async WBS_할당_순서를_변경한다(params) {
        this.logger.log('WBS 할당 순서 변경 비즈니스 로직 시작', {
            assignmentId: params.assignmentId,
            direction: params.direction,
        });
        const assignment = await this.evaluationCriteriaManagementService.WBS_할당_순서를_변경한다(params.assignmentId, params.direction, params.updatedBy);
        this.logger.log('WBS 할당 순서 변경 완료', {
            assignmentId: params.assignmentId,
        });
        return assignment;
    }
    async WBS_할당_순서를_WBS_ID로_변경한다(params) {
        this.logger.log('WBS ID 기반 할당 순서 변경 비즈니스 로직 시작', {
            employeeId: params.employeeId,
            wbsItemId: params.wbsItemId,
            projectId: params.projectId,
            periodId: params.periodId,
            direction: params.direction,
        });
        const assignmentDetail = await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(params.employeeId, params.wbsItemId, params.projectId, params.periodId);
        if (!assignmentDetail) {
            throw new common_1.NotFoundException(`WBS 할당을 찾을 수 없습니다. (employeeId: ${params.employeeId}, wbsItemId: ${params.wbsItemId}, projectId: ${params.projectId}, periodId: ${params.periodId})`);
        }
        const assignment = await this.evaluationCriteriaManagementService.WBS_할당_순서를_변경한다(assignmentDetail.id, params.direction, params.updatedBy);
        this.logger.log('WBS ID 기반 할당 순서 변경 완료', {
            assignmentId: assignmentDetail.id,
        });
        return assignment;
    }
    async 평가기간의_WBS_할당을_초기화한다(params) {
        this.logger.log('평가기간 WBS 할당 초기화 비즈니스 로직 시작', {
            periodId: params.periodId,
        });
        const allAssignments = await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다({ periodId: params.periodId }, 1, 10000);
        const affectedWbsItemIds = [
            ...new Set(allAssignments.assignments.map((a) => a.wbsItemId)),
        ];
        await this.evaluationCriteriaManagementService.평가기간의_WBS_할당을_초기화한다(params.periodId, params.resetBy);
        await Promise.all(affectedWbsItemIds.map(async (wbsItemId) => {
            const remainingAssignments = await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId, params.periodId);
            if (!remainingAssignments || remainingAssignments.length === 0) {
                this.logger.log('고아 평가기준 삭제', { wbsItemId });
                await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(wbsItemId, params.resetBy);
            }
        }));
        this.logger.log('평가기간 WBS 할당 초기화 및 평가기준 정리 완료', {
            periodId: params.periodId,
            cleanedWbsItems: affectedWbsItemIds.length,
        });
    }
    async 프로젝트의_WBS_할당을_초기화한다(params) {
        this.logger.log('프로젝트 WBS 할당 초기화 비즈니스 로직 시작', {
            projectId: params.projectId,
            periodId: params.periodId,
        });
        const allAssignments = await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다({ projectId: params.projectId, periodId: params.periodId }, 1, 10000);
        const affectedWbsItemIds = [
            ...new Set(allAssignments.assignments.map((a) => a.wbsItemId)),
        ];
        await this.evaluationCriteriaManagementService.프로젝트의_WBS_할당을_초기화한다(params.projectId, params.periodId, params.resetBy);
        await Promise.all(affectedWbsItemIds.map(async (wbsItemId) => {
            const remainingAssignments = await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId, params.periodId);
            if (!remainingAssignments || remainingAssignments.length === 0) {
                this.logger.log('고아 평가기준 삭제', { wbsItemId });
                await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(wbsItemId, params.resetBy);
            }
        }));
        this.logger.log('프로젝트 WBS 할당 초기화 및 평가기준 정리 완료', {
            projectId: params.projectId,
            cleanedWbsItems: affectedWbsItemIds.length,
        });
    }
    async 직원의_WBS_할당을_초기화한다(params) {
        this.logger.log('직원 WBS 할당 초기화 비즈니스 로직 시작', {
            employeeId: params.employeeId,
            periodId: params.periodId,
        });
        const allAssignments = await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다({ employeeId: params.employeeId, periodId: params.periodId }, 1, 10000);
        const affectedWbsItemIds = [
            ...new Set(allAssignments.assignments.map((a) => a.wbsItemId)),
        ];
        await this.evaluationCriteriaManagementService.직원의_WBS_할당을_초기화한다(params.employeeId, params.periodId, params.resetBy);
        await Promise.all(affectedWbsItemIds.map(async (wbsItemId) => {
            const remainingAssignments = await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId, params.periodId);
            if (!remainingAssignments || remainingAssignments.length === 0) {
                this.logger.log('고아 평가기준 삭제', { wbsItemId });
                await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(wbsItemId, params.resetBy);
            }
        }));
        this.logger.log('직원 WBS 할당 초기화 및 평가기준 정리 완료', {
            employeeId: params.employeeId,
            cleanedWbsItems: affectedWbsItemIds.length,
        });
    }
    async WBS_할당_목록을_조회한다(params) {
        this.logger.log('WBS 할당 목록 조회 비즈니스 로직', {
            periodId: params.periodId,
            employeeId: params.employeeId,
        });
        const filter = {
            periodId: params.periodId,
            employeeId: params.employeeId,
            wbsItemId: params.wbsItemId,
            projectId: params.projectId,
        };
        return await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(filter, params.page, params.limit, params.orderBy, params.orderDirection);
    }
    async WBS_할당_상세를_조회한다(employeeId, wbsItemId, projectId, periodId) {
        this.logger.log('WBS 할당 상세 조회 비즈니스 로직', {
            employeeId,
            wbsItemId,
            projectId,
            periodId,
        });
        return await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(employeeId, wbsItemId, projectId, periodId);
    }
    async 특정_평가기간에_직원에게_할당된_WBS를_조회한다(employeeId, periodId) {
        this.logger.log('직원 WBS 할당 조회 비즈니스 로직', {
            employeeId,
            periodId,
        });
        return await this.evaluationCriteriaManagementService.특정_평가기간에_직원에게_할당된_WBS를_조회한다(employeeId, periodId);
    }
    async 특정_평가기간에_프로젝트의_WBS_할당을_조회한다(projectId, periodId) {
        this.logger.log('프로젝트 WBS 할당 조회 비즈니스 로직', {
            projectId,
            periodId,
        });
        return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트의_WBS_할당을_조회한다(projectId, periodId);
    }
    async 특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId, periodId) {
        this.logger.log('WBS 항목 할당 직원 조회 비즈니스 로직', {
            wbsItemId,
            periodId,
        });
        return await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(wbsItemId, periodId);
    }
    async 특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(projectId, periodId, employeeId) {
        this.logger.log('할당되지 않은 WBS 항목 조회 비즈니스 로직', {
            projectId,
            periodId,
            employeeId,
        });
        return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(projectId, periodId, employeeId);
    }
    async 평가라인을_자동으로_구성한다(employeeId, wbsItemId, projectId, periodId, createdBy) {
        this.logger.log('평가라인 자동 구성 시작', {
            employeeId,
            wbsItemId,
            projectId,
        });
        const employee = await this.employeeService.ID로_조회한다(employeeId);
        if (!employee) {
            this.logger.warn('직원을 찾을 수 없습니다', { employeeId });
            return;
        }
        console.log('🔍 직원 정보:', {
            id: employee.id,
            name: employee.name,
            managerId: employee.managerId,
            departmentId: employee.departmentId,
        });
        const project = await this.projectService.ID로_조회한다(projectId);
        if (!project) {
            this.logger.warn('프로젝트를 찾을 수 없습니다', { projectId });
            return;
        }
        console.log('🔍 프로젝트 정보:', {
            id: project.id,
            name: project.name,
            managerId: project.manager?.managerId,
            employeeId: project.manager?.employeeId,
        });
        const existingPrimaryEvaluator = await this.기존_1차_평가자를_조회한다(employeeId, periodId);
        let primaryEvaluatorId = existingPrimaryEvaluator;
        if (!primaryEvaluatorId && employee.managerId) {
            primaryEvaluatorId = employee.managerId;
            this.logger.log('기존 1차 평가자가 없어 담당 평가자를 사용', {
                evaluatorId: employee.managerId,
            });
        }
        else if (existingPrimaryEvaluator) {
            this.logger.log('기존 1차 평가자를 사용', {
                evaluatorId: existingPrimaryEvaluator,
            });
        }
        if (primaryEvaluatorId) {
            await this.evaluationCriteriaManagementService.일차_평가자를_구성한다(employeeId, periodId, primaryEvaluatorId, createdBy);
        }
        else {
            this.logger.warn('1차 평가자를 설정할 수 없습니다', {
                employeeId,
                hasExistingEvaluator: !!existingPrimaryEvaluator,
                hasManagerId: !!employee.managerId,
            });
        }
        const projectManagerExternalId = project.managerId;
        const projectManagerEmployeeId = project.manager?.employeeId;
        let evaluatorId = null;
        if (projectManagerEmployeeId) {
            evaluatorId = projectManagerEmployeeId;
        }
        else if (projectManagerExternalId) {
            const managerEmployee = await this.employeeService.findByExternalId(projectManagerExternalId);
            if (managerEmployee) {
                evaluatorId = managerEmployee.id;
                this.logger.log('프로젝트 PM externalId를 Employee id로 변환', {
                    externalId: projectManagerExternalId,
                    employeeId: managerEmployee.id,
                });
            }
            else {
                this.logger.warn('프로젝트 PM Employee를 찾을 수 없습니다', {
                    externalId: projectManagerExternalId,
                });
            }
        }
        if (evaluatorId) {
            const employeeManager = employee.managerId
                ? await this.employeeService.findByExternalId(employee.managerId)
                : null;
            const employeeManagerId = employeeManager?.id;
            if (!employeeManagerId || evaluatorId !== employeeManagerId) {
                this.logger.log('2차 평가자(프로젝트 PM) 구성', {
                    evaluatorId,
                    employeeId,
                });
                await this.evaluationCriteriaManagementService.이차_평가자를_구성한다(employeeId, wbsItemId, periodId, evaluatorId, createdBy);
            }
            else {
                this.logger.log('프로젝트 PM이 관리자와 동일하여 2차 평가자로 설정하지 않습니다', {
                    projectId,
                    evaluatorId,
                });
            }
        }
        else {
            this.logger.warn('프로젝트 PM(managerId)이 설정되지 않았거나 Employee를 찾을 수 없습니다', {
                projectId,
                managerId: projectManagerExternalId,
            });
        }
        this.logger.log('평가라인 자동 구성 완료', {
            employeeId,
            wbsItemId,
            primaryEvaluator: employee.managerId,
            secondaryEvaluator: projectManagerEmployeeId &&
                projectManagerEmployeeId !== employee.managerId
                ? projectManagerEmployeeId
                : null,
        });
    }
    async 평가라인_매핑을_삭제한다(employeeId, wbsItemId, periodId, deletedBy) {
        this.logger.log('평가라인 매핑 삭제 시작', {
            employeeId,
            wbsItemId,
            periodId,
        });
        const mappings = await this.evaluationLineMappingService.필터_조회한다({
            evaluationPeriodId: periodId,
            employeeId,
            wbsItemId,
        });
        for (const mapping of mappings) {
            const mappingId = mapping.DTO로_변환한다().id;
            await this.evaluationLineMappingService.삭제한다(mappingId, deletedBy);
            this.logger.log('평가라인 매핑 삭제 완료', {
                mappingId,
                evaluatorId: mapping.DTO로_변환한다().evaluatorId,
            });
        }
        this.logger.log('평가라인 매핑 삭제 완료', {
            deletedCount: mappings.length,
        });
    }
    async 기존_1차_평가자를_조회한다(employeeId, periodId) {
        const evaluationLines = await this.evaluationLineService.필터_조회한다({
            evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
            orderFrom: 1,
            orderTo: 1,
        });
        if (evaluationLines.length === 0) {
            return null;
        }
        const primaryEvaluationLineId = evaluationLines[0].DTO로_변환한다().id;
        const existingMappings = await this.evaluationLineMappingService.필터_조회한다({
            evaluationPeriodId: periodId,
            employeeId,
            evaluationLineId: primaryEvaluationLineId,
        });
        const primaryMappings = existingMappings.filter((mapping) => !mapping.wbsItemId);
        if (primaryMappings.length > 0) {
            return primaryMappings[0].DTO로_변환한다().evaluatorId;
        }
        return null;
    }
    async WBS를_생성하고_할당한다(params) {
        this.logger.log('WBS 생성 및 할당 비즈니스 로직 시작', {
            title: params.title,
            projectId: params.projectId,
            employeeId: params.employeeId,
        });
        const wbsItem = await this.evaluationCriteriaManagementService.WBS_항목을_생성하고_코드를_자동_생성한다({
            title: params.title,
            status: wbs_item_types_1.WbsItemStatus.PENDING,
            level: 1,
            assignedToId: params.employeeId,
            projectId: params.projectId,
            parentWbsId: undefined,
            startDate: undefined,
            endDate: undefined,
            progressPercentage: 0,
        }, params.createdBy);
        this.logger.log('WBS 항목 생성 완료', {
            wbsItemId: wbsItem.id,
            wbsCode: wbsItem.wbsCode,
        });
        const assignment = await this.WBS를_할당한다({
            employeeId: params.employeeId,
            wbsItemId: wbsItem.id,
            projectId: params.projectId,
            periodId: params.periodId,
            assignedBy: params.createdBy,
        });
        this.logger.log('WBS 생성 및 할당 완료', {
            wbsItemId: wbsItem.id,
            assignmentId: assignment.id,
        });
        return {
            wbsItem,
            assignment,
        };
    }
    async WBS를_사이에_생성하고_할당한다(params) {
        this.logger.log('WBS 사이에 생성 및 할당 비즈니스 로직 시작', {
            title: params.title,
            projectId: params.projectId,
            employeeId: params.employeeId,
            previousWbsItemId: params.previousWbsItemId,
            nextWbsItemId: params.nextWbsItemId,
        });
        const wbsItem = await this.evaluationCriteriaManagementService.WBS_항목을_생성하고_코드를_자동_생성한다({
            title: params.title,
            status: wbs_item_types_1.WbsItemStatus.PENDING,
            level: 1,
            assignedToId: params.employeeId,
            projectId: params.projectId,
            parentWbsId: undefined,
            startDate: undefined,
            endDate: undefined,
            progressPercentage: 0,
        }, params.createdBy);
        this.logger.log('WBS 항목 생성 완료', {
            wbsItemId: wbsItem.id,
            wbsCode: wbsItem.wbsCode,
        });
        let targetIndex = undefined;
        if (params.previousWbsItemId || params.nextWbsItemId) {
            const allAssignments = await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다({
                employeeId: params.employeeId,
                projectId: params.projectId,
                periodId: params.periodId,
            }, 1, 1000, 'displayOrder', 'ASC');
            const sortedAssignments = allAssignments.assignments.sort((a, b) => {
                if (a.displayOrder !== b.displayOrder) {
                    return a.displayOrder - b.displayOrder;
                }
                return (new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime());
            });
            this.logger.log('기존 WBS 할당 목록 조회', {
                count: sortedAssignments.length,
                assignments: sortedAssignments.map((a) => ({
                    wbsItemId: a.wbsItemId,
                    displayOrder: a.displayOrder,
                    assignedDate: a.assignedDate,
                })),
            });
            if (params.previousWbsItemId && params.nextWbsItemId) {
                const prevIndex = sortedAssignments.findIndex((a) => a.wbsItemId === params.previousWbsItemId);
                const nextIdx = sortedAssignments.findIndex((a) => a.wbsItemId === params.nextWbsItemId);
                if (prevIndex !== -1 && nextIdx !== -1) {
                    targetIndex = prevIndex + 1;
                }
                else {
                    targetIndex = sortedAssignments.length;
                }
            }
            else if (params.previousWbsItemId) {
                const prevIndex = sortedAssignments.findIndex((a) => a.wbsItemId === params.previousWbsItemId);
                if (prevIndex !== -1) {
                    targetIndex = prevIndex + 1;
                }
                else {
                    targetIndex = sortedAssignments.length;
                }
            }
            else if (params.nextWbsItemId) {
                const nextIdx = sortedAssignments.findIndex((a) => a.wbsItemId === params.nextWbsItemId);
                if (nextIdx !== -1) {
                    targetIndex = nextIdx;
                }
                else {
                    targetIndex = 0;
                }
            }
            this.logger.log('삽입 위치 계산', { targetIndex });
        }
        const data = {
            employeeId: params.employeeId,
            wbsItemId: wbsItem.id,
            projectId: params.projectId,
            periodId: params.periodId,
            assignedBy: params.createdBy,
            displayOrder: 999999,
        };
        const assignment = await this.evaluationCriteriaManagementService.WBS를_할당한다(data, params.createdBy);
        const existingCriteria = await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(wbsItem.id);
        if (!existingCriteria || existingCriteria.length === 0) {
            this.logger.log('WBS 평가기준이 없어 빈 기준을 생성합니다', {
                wbsItemId: wbsItem.id,
            });
            await this.evaluationCriteriaManagementService.WBS_평가기준을_생성한다({
                wbsItemId: wbsItem.id,
                criteria: '',
                importance: 5,
            }, params.createdBy);
        }
        await this.평가라인을_자동으로_구성한다(params.employeeId, wbsItem.id, params.projectId, params.periodId, params.createdBy);
        this.logger.log('WBS별 평가라인 구성 시작', {
            employeeId: params.employeeId,
            wbsItemId: wbsItem.id,
            periodId: params.periodId,
        });
        const wbsEvaluationLineResult = await this.evaluationCriteriaManagementService.직원_WBS별_평가라인을_구성한다(params.employeeId, wbsItem.id, params.periodId, params.createdBy);
        this.logger.log('WBS별 평가라인 구성 완료', {
            createdLines: wbsEvaluationLineResult.createdLines,
            createdMappings: wbsEvaluationLineResult.createdMappings,
        });
        try {
            await this.activityLogContextService.활동내역을_기록한다({
                periodId: params.periodId,
                employeeId: params.employeeId,
                activityType: 'wbs_assignment',
                activityAction: 'created',
                activityTitle: 'WBS 사이에 생성 및 할당',
                relatedEntityType: 'wbs_assignment',
                relatedEntityId: assignment.id,
                performedBy: params.createdBy,
                activityMetadata: {
                    wbsItemId: wbsItem.id,
                    projectId: params.projectId,
                    previousWbsItemId: params.previousWbsItemId,
                    nextWbsItemId: params.nextWbsItemId,
                    displayOrder: assignment.displayOrder,
                },
            });
        }
        catch (error) {
            this.logger.warn('WBS 사이에 생성 활동 내역 기록 실패', {
                assignmentId: assignment.id,
                error: error.message,
            });
        }
        await this.전체_WBS_할당_순서를_재정렬한다(params.employeeId, params.projectId, params.periodId, params.createdBy, wbsItem.id, targetIndex);
        this.logger.log('WBS 사이에 생성, 할당, 평가기준 생성, 평가라인 구성 완료', {
            wbsItemId: wbsItem.id,
            assignmentId: assignment.id,
            displayOrder: assignment.displayOrder,
        });
        return {
            wbsItem,
            assignment,
        };
    }
    async 전체_WBS_할당_순서를_재정렬한다(employeeId, projectId, periodId, updatedBy, newWbsItemId, targetIndex) {
        this.logger.log('WBS 할당 순서 재정렬 시작', {
            employeeId,
            projectId,
            periodId,
            newWbsItemId,
            targetIndex,
        });
        const allAssignments = await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다({
            employeeId,
            projectId,
            periodId,
        }, 1, 1000, 'displayOrder', 'ASC');
        let existingAssignments = allAssignments.assignments;
        let newAssignment = undefined;
        if (newWbsItemId) {
            newAssignment = existingAssignments.find((a) => a.wbsItemId === newWbsItemId);
            existingAssignments = existingAssignments.filter((a) => a.wbsItemId !== newWbsItemId);
        }
        const sortedExistingAssignments = existingAssignments.sort((a, b) => {
            if (a.displayOrder !== b.displayOrder) {
                return a.displayOrder - b.displayOrder;
            }
            return (new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime());
        });
        let finalSortedAssignments = [...sortedExistingAssignments];
        if (newAssignment && targetIndex !== undefined) {
            finalSortedAssignments.splice(targetIndex, 0, newAssignment);
            this.logger.log('새 WBS 삽입', {
                newWbsItemId,
                targetIndex,
                wbsItemId: newAssignment.wbsItemId,
            });
        }
        this.logger.log('정렬된 WBS 할당 목록', {
            count: finalSortedAssignments.length,
            assignments: finalSortedAssignments.map((a, index) => ({
                index,
                wbsItemId: a.wbsItemId,
                currentDisplayOrder: a.displayOrder,
                willBeDisplayOrder: index,
            })),
        });
        const updatePromises = [];
        for (let i = 0; i < finalSortedAssignments.length; i++) {
            const assignment = finalSortedAssignments[i];
            if (assignment.displayOrder !== i) {
                this.logger.log('displayOrder 업데이트 예정', {
                    assignmentId: assignment.id,
                    wbsItemId: assignment.wbsItemId,
                    oldOrder: assignment.displayOrder,
                    newOrder: i,
                });
                const updatePromise = this.wbsAssignmentRepository.update({ id: assignment.id }, {
                    displayOrder: i,
                    updatedAt: new Date(),
                    updatedBy: updatedBy,
                });
                updatePromises.push(updatePromise);
            }
        }
        await Promise.all(updatePromises);
        this.logger.log('WBS 할당 순서 재정렬 완료', {
            count: finalSortedAssignments.length,
            updatedCount: updatePromises.length,
        });
    }
    async WBS_항목_이름을_수정한다(params) {
        this.logger.log('WBS 항목 이름 수정 시작', {
            wbsItemId: params.wbsItemId,
            title: params.title,
        });
        const updatedWbsItem = await this.evaluationCriteriaManagementService.WBS_항목을_수정한다(params.wbsItemId, { title: params.title }, params.updatedBy);
        this.logger.log('WBS 항목 이름 수정 완료', {
            wbsItemId: params.wbsItemId,
            newTitle: params.title,
        });
        return updatedWbsItem;
    }
};
exports.WbsAssignmentBusinessService = WbsAssignmentBusinessService;
exports.WbsAssignmentBusinessService = WbsAssignmentBusinessService = WbsAssignmentBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(8, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __metadata("design:paramtypes", [evaluation_criteria_management_service_1.EvaluationCriteriaManagementService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService,
        performance_evaluation_service_1.PerformanceEvaluationService,
        employee_service_1.EmployeeService,
        project_service_1.ProjectService,
        evaluation_line_service_1.EvaluationLineService,
        evaluation_line_mapping_service_1.EvaluationLineMappingService,
        evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
        typeorm_2.Repository])
], WbsAssignmentBusinessService);
//# sourceMappingURL=wbs-assignment-business.service.js.map