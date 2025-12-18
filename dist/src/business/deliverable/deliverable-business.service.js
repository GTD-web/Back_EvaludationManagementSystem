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
var DeliverableBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliverableBusinessService = void 0;
const common_1 = require("@nestjs/common");
const performance_evaluation_service_1 = require("../../context/performance-evaluation-context/performance-evaluation.service");
const evaluation_activity_log_context_service_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
const evaluation_criteria_management_service_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management.service");
const deliverable_exceptions_1 = require("../../domain/core/deliverable/deliverable.exceptions");
let DeliverableBusinessService = DeliverableBusinessService_1 = class DeliverableBusinessService {
    performanceEvaluationService;
    activityLogContextService;
    evaluationCriteriaManagementService;
    logger = new common_1.Logger(DeliverableBusinessService_1.name);
    constructor(performanceEvaluationService, activityLogContextService, evaluationCriteriaManagementService) {
        this.performanceEvaluationService = performanceEvaluationService;
        this.activityLogContextService = activityLogContextService;
        this.evaluationCriteriaManagementService = evaluationCriteriaManagementService;
    }
    async 산출물을_생성한다(data) {
        this.logger.log('산출물 생성 시작', {
            employeeId: data.employeeId,
            wbsItemId: data.wbsItemId,
        });
        const deliverable = await this.performanceEvaluationService.산출물을_생성한다(data);
        try {
            const periodId = await this.평가기간을_조회한다(data.employeeId, data.wbsItemId);
            if (periodId) {
                await this.activityLogContextService.활동내역을_기록한다({
                    periodId,
                    employeeId: data.employeeId,
                    activityType: 'deliverable',
                    activityAction: 'created',
                    activityTitle: '산출물 생성',
                    relatedEntityType: 'deliverable',
                    relatedEntityId: deliverable.id,
                    performedBy: data.createdBy,
                    activityMetadata: {
                        deliverableName: data.name,
                        deliverableType: data.type,
                        wbsItemId: data.wbsItemId,
                    },
                });
            }
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                employeeId: data.employeeId,
                wbsItemId: data.wbsItemId,
                error: error.message,
            });
        }
        this.logger.log('산출물 생성 완료', { id: deliverable.id });
        return deliverable;
    }
    async 산출물을_수정한다(data) {
        this.logger.log('산출물 수정 시작', { id: data.id });
        const existingDeliverable = await this.performanceEvaluationService.산출물을_ID로_조회한다(data.id);
        if (!existingDeliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(data.id);
        }
        const deliverable = await this.performanceEvaluationService.산출물을_수정한다(data);
        try {
            const employeeId = data.employeeId || existingDeliverable.employeeId;
            const wbsItemId = data.wbsItemId || existingDeliverable.wbsItemId;
            if (employeeId && wbsItemId) {
                const periodId = await this.평가기간을_조회한다(employeeId, wbsItemId);
                if (periodId) {
                    await this.activityLogContextService.활동내역을_기록한다({
                        periodId,
                        employeeId,
                        activityType: 'deliverable',
                        activityAction: 'updated',
                        activityTitle: '산출물 수정',
                        relatedEntityType: 'deliverable',
                        relatedEntityId: deliverable.id,
                        performedBy: data.updatedBy,
                        activityMetadata: {
                            deliverableName: deliverable.name,
                            deliverableType: deliverable.type,
                            wbsItemId,
                        },
                    });
                }
            }
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                id: data.id,
                error: error.message,
            });
        }
        this.logger.log('산출물 수정 완료', { id: deliverable.id });
        return deliverable;
    }
    async 산출물을_삭제한다(id, deletedBy) {
        this.logger.log('산출물 삭제 시작', { id });
        const existingDeliverable = await this.performanceEvaluationService.산출물을_ID로_조회한다(id);
        if (!existingDeliverable) {
            throw new deliverable_exceptions_1.DeliverableNotFoundException(id);
        }
        await this.performanceEvaluationService.산출물을_삭제한다(id, deletedBy);
        try {
            if (existingDeliverable.employeeId && existingDeliverable.wbsItemId) {
                const periodId = await this.평가기간을_조회한다(existingDeliverable.employeeId, existingDeliverable.wbsItemId);
                if (periodId) {
                    await this.activityLogContextService.활동내역을_기록한다({
                        periodId,
                        employeeId: existingDeliverable.employeeId,
                        activityType: 'deliverable',
                        activityAction: 'deleted',
                        activityTitle: '산출물 삭제',
                        relatedEntityType: 'deliverable',
                        relatedEntityId: id,
                        performedBy: deletedBy,
                        activityMetadata: {
                            deliverableName: existingDeliverable.name,
                            deliverableType: existingDeliverable.type,
                            wbsItemId: existingDeliverable.wbsItemId,
                        },
                    });
                }
            }
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                id,
                error: error.message,
            });
        }
        this.logger.log('산출물 삭제 완료', { id });
    }
    async 산출물을_벌크_생성한다(data) {
        this.logger.log('산출물 벌크 생성 시작', {
            count: data.deliverables.length,
        });
        const result = await this.performanceEvaluationService.산출물을_벌크_생성한다(data);
        try {
            for (const deliverableData of data.deliverables) {
                if (result.createdIds.length > 0) {
                    const periodId = await this.평가기간을_조회한다(deliverableData.employeeId, deliverableData.wbsItemId);
                    if (periodId) {
                        await this.activityLogContextService.활동내역을_기록한다({
                            periodId,
                            employeeId: deliverableData.employeeId,
                            activityType: 'deliverable',
                            activityAction: 'created',
                            activityTitle: '산출물 생성',
                            relatedEntityType: 'deliverable',
                            performedBy: data.createdBy,
                            activityMetadata: {
                                deliverableName: deliverableData.name,
                                deliverableType: deliverableData.type,
                                wbsItemId: deliverableData.wbsItemId,
                                bulkOperation: true,
                            },
                        });
                    }
                }
            }
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                error: error.message,
            });
        }
        this.logger.log('산출물 벌크 생성 완료', {
            successCount: result.successCount,
            failedCount: result.failedCount,
        });
        return result;
    }
    async 산출물을_벌크_삭제한다(data) {
        this.logger.log('산출물 벌크 삭제 시작', { count: data.ids.length });
        const deliverables = await Promise.all(data.ids.map((id) => this.performanceEvaluationService.산출물을_ID로_조회한다(id)));
        const result = await this.performanceEvaluationService.산출물을_벌크_삭제한다(data);
        try {
            for (const deliverable of deliverables) {
                if (deliverable && deliverable.employeeId && deliverable.wbsItemId) {
                    const periodId = await this.평가기간을_조회한다(deliverable.employeeId, deliverable.wbsItemId);
                    if (periodId) {
                        await this.activityLogContextService.활동내역을_기록한다({
                            periodId,
                            employeeId: deliverable.employeeId,
                            activityType: 'deliverable',
                            activityAction: 'deleted',
                            activityTitle: '산출물 삭제',
                            relatedEntityType: 'deliverable',
                            relatedEntityId: deliverable.id,
                            performedBy: data.deletedBy,
                            activityMetadata: {
                                deliverableName: deliverable.name,
                                deliverableType: deliverable.type,
                                wbsItemId: deliverable.wbsItemId,
                                bulkOperation: true,
                            },
                        });
                    }
                }
            }
        }
        catch (error) {
            this.logger.warn('활동 내역 기록 실패', {
                error: error.message,
            });
        }
        this.logger.log('산출물 벌크 삭제 완료', {
            successCount: result.successCount,
            failedCount: result.failedCount,
        });
        return result;
    }
    async 직원별_산출물을_조회한다(employeeId, activeOnly = true) {
        return await this.performanceEvaluationService.직원별_산출물을_조회한다(employeeId, activeOnly);
    }
    async WBS항목별_산출물을_조회한다(wbsItemId, activeOnly = true) {
        return await this.performanceEvaluationService.WBS항목별_산출물을_조회한다(wbsItemId, activeOnly);
    }
    async 산출물_상세를_조회한다(id) {
        return await this.performanceEvaluationService.산출물_상세를_조회한다(id);
    }
    async 평가기간을_조회한다(employeeId, wbsItemId) {
        try {
            const wbsAssignments = await this.evaluationCriteriaManagementService.WBS항목에_할당된_모든_직원을_조회한다(wbsItemId);
            if (wbsAssignments && wbsAssignments.length > 0) {
                const assignment = wbsAssignments.find((a) => a.employeeId === employeeId);
                if (assignment) {
                    return assignment.periodId;
                }
            }
            return null;
        }
        catch (error) {
            this.logger.warn('평가기간 조회 실패', {
                employeeId,
                wbsItemId,
                error: error.message,
            });
            return null;
        }
    }
};
exports.DeliverableBusinessService = DeliverableBusinessService;
exports.DeliverableBusinessService = DeliverableBusinessService = DeliverableBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService,
        evaluation_criteria_management_service_1.EvaluationCriteriaManagementService])
], DeliverableBusinessService);
//# sourceMappingURL=deliverable-business.service.js.map