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
var PeerEvaluationBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerEvaluationBusinessService = void 0;
const common_1 = require("@nestjs/common");
const performance_evaluation_service_1 = require("../../context/performance-evaluation-context/performance-evaluation.service");
const peer_evaluation_1 = require("../../context/performance-evaluation-context/handlers/peer-evaluation");
let PeerEvaluationBusinessService = PeerEvaluationBusinessService_1 = class PeerEvaluationBusinessService {
    performanceEvaluationService;
    logger = new common_1.Logger(PeerEvaluationBusinessService_1.name);
    constructor(performanceEvaluationService) {
        this.performanceEvaluationService = performanceEvaluationService;
    }
    async 동료평가를_요청한다(params) {
        this.logger.log('동료평가 요청 비즈니스 로직 시작', {
            evaluatorId: params.evaluatorId,
            evaluateeId: params.evaluateeId,
            periodId: params.periodId,
            requestDeadline: params.requestDeadline,
            questionCount: params.questionIds?.length || 0,
        });
        const evaluationId = await this.performanceEvaluationService.동료평가를_생성한다(params.evaluatorId, params.evaluateeId, params.periodId, '', params.requestDeadline, undefined, undefined, params.requestedBy);
        if (params.questionIds && params.questionIds.length > 0) {
            await this.performanceEvaluationService.동료평가에_질문을_매핑한다(evaluationId, params.questionIds, params.requestedBy);
            this.logger.log(`동료평가 질문 매핑 완료 - 질문 개수: ${params.questionIds.length}`);
        }
        this.logger.log('동료평가 요청 및 알림 발송 완료', { evaluationId });
        return evaluationId;
    }
    async 여러_평가자에게_동료평가를_요청한다(params) {
        const filteredEvaluatorIds = params.evaluatorIds.filter((evaluatorId) => evaluatorId !== params.evaluateeId);
        this.logger.log('여러 평가자에게 동료평가 요청 비즈니스 로직 시작', {
            originalEvaluatorCount: params.evaluatorIds.length,
            filteredEvaluatorCount: filteredEvaluatorIds.length,
            evaluateeId: params.evaluateeId,
            periodId: params.periodId,
            requestDeadline: params.requestDeadline,
            questionCount: params.questionIds?.length || 0,
        });
        const results = [];
        for (const evaluatorId of filteredEvaluatorIds) {
            try {
                const evaluationId = await this.동료평가를_요청한다({
                    evaluatorId,
                    evaluateeId: params.evaluateeId,
                    periodId: params.periodId,
                    requestDeadline: params.requestDeadline,
                    questionIds: params.questionIds,
                    requestedBy: params.requestedBy,
                });
                results.push({
                    evaluatorId,
                    evaluateeId: params.evaluateeId,
                    success: true,
                    evaluationId,
                });
            }
            catch (error) {
                this.logger.error(`평가자 ${evaluatorId}에 대한 요청 생성 실패`, error);
                results.push({
                    evaluatorId,
                    evaluateeId: params.evaluateeId,
                    success: false,
                    error: {
                        code: error.name || 'UNKNOWN_ERROR',
                        message: error.message || '알 수 없는 오류가 발생했습니다.',
                    },
                });
            }
        }
        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;
        this.logger.log('여러 평가자에게 동료평가 요청 완료', {
            totalRequested: filteredEvaluatorIds.length,
            successCount,
            failedCount,
        });
        return {
            results,
            summary: {
                total: results.length,
                success: successCount,
                failed: failedCount,
            },
        };
    }
    async 여러_피평가자에_대한_동료평가를_요청한다(params) {
        const filteredEvaluateeIds = params.evaluateeIds.filter((evaluateeId) => evaluateeId !== params.evaluatorId);
        this.logger.log('여러 피평가자에 대한 동료평가 요청 비즈니스 로직 시작', {
            evaluatorId: params.evaluatorId,
            originalEvaluateeCount: params.evaluateeIds.length,
            filteredEvaluateeCount: filteredEvaluateeIds.length,
            periodId: params.periodId,
            requestDeadline: params.requestDeadline,
            questionCount: params.questionIds?.length || 0,
        });
        const results = [];
        for (const evaluateeId of filteredEvaluateeIds) {
            try {
                const evaluationId = await this.동료평가를_요청한다({
                    evaluatorId: params.evaluatorId,
                    evaluateeId,
                    periodId: params.periodId,
                    requestDeadline: params.requestDeadline,
                    questionIds: params.questionIds,
                    requestedBy: params.requestedBy,
                });
                results.push({
                    evaluatorId: params.evaluatorId,
                    evaluateeId,
                    success: true,
                    evaluationId,
                });
            }
            catch (error) {
                this.logger.error(`피평가자 ${evaluateeId}에 대한 요청 생성 실패`, error);
                results.push({
                    evaluatorId: params.evaluatorId,
                    evaluateeId,
                    success: false,
                    error: {
                        code: error.name || 'UNKNOWN_ERROR',
                        message: error.message || '알 수 없는 오류가 발생했습니다.',
                    },
                });
            }
        }
        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;
        this.logger.log('여러 피평가자에 대한 동료평가 요청 완료', {
            totalRequested: filteredEvaluateeIds.length,
            successCount,
            failedCount,
        });
        return {
            results,
            summary: {
                total: results.length,
                success: successCount,
                failed: failedCount,
            },
        };
    }
    async 파트장들_간_동료평가를_요청한다(params) {
        const { periodId, partLeaderIds, requestDeadline, questionIds, requestedBy, } = params;
        this.logger.log('파트장들 간 동료평가 요청 비즈니스 로직 시작', {
            partLeaderCount: partLeaderIds.length,
            periodId,
            requestDeadline,
            questionCount: questionIds?.length || 0,
        });
        const results = [];
        for (const evaluatorId of partLeaderIds) {
            const evaluateeIds = partLeaderIds.filter((id) => id !== evaluatorId);
            for (const evaluateeId of evaluateeIds) {
                try {
                    const evaluationId = await this.동료평가를_요청한다({
                        evaluatorId,
                        evaluateeId,
                        periodId,
                        requestDeadline,
                        questionIds,
                        requestedBy,
                    });
                    results.push({
                        evaluatorId,
                        evaluateeId,
                        success: true,
                        evaluationId,
                    });
                }
                catch (error) {
                    this.logger.error(`파트장 간 동료평가 요청 생성 실패 (평가자: ${evaluatorId}, 피평가자: ${evaluateeId})`, error);
                    results.push({
                        evaluatorId,
                        evaluateeId,
                        success: false,
                        error: {
                            code: error.name || 'UNKNOWN_ERROR',
                            message: error.message || '알 수 없는 오류가 발생했습니다.',
                        },
                    });
                }
            }
        }
        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;
        this.logger.log('파트장들 간 동료평가 요청 완료', {
            partLeaderCount: partLeaderIds.length,
            totalRequested: results.length,
            successCount,
            failedCount,
        });
        return {
            results,
            summary: {
                total: results.length,
                success: successCount,
                failed: failedCount,
                partLeaderCount: partLeaderIds.length,
            },
        };
    }
    async 동료평가를_생성한다(params) {
        this.logger.log('동료평가 생성 비즈니스 로직 시작', {
            evaluatorId: params.evaluatorId,
            evaluateeId: params.evaluateeId,
        });
        const evaluationId = await this.performanceEvaluationService.동료평가를_생성한다(params.evaluatorId, params.evaluateeId, params.periodId, params.projectId, undefined, params.peerEvaluationContent, params.peerEvaluationScore, params.createdBy);
        this.logger.log('동료평가 생성 및 알림 발송 완료', { evaluationId });
        return evaluationId;
    }
    async 동료평가를_수정한다(params) {
        this.logger.log('동료평가 수정 비즈니스 로직 시작', {
            evaluationId: params.evaluationId,
        });
        await this.performanceEvaluationService.동료평가를_수정한다(params.evaluationId, params.peerEvaluationContent, params.peerEvaluationScore, params.updatedBy);
        this.logger.log('동료평가 수정 완료', {
            evaluationId: params.evaluationId,
        });
    }
    async 동료평가_요청을_취소한다(params) {
        this.logger.log('동료평가 요청 취소 비즈니스 로직 시작', {
            evaluationId: params.evaluationId,
        });
        await this.performanceEvaluationService.동료평가를_취소한다(params.evaluationId, params.cancelledBy);
        this.logger.log('동료평가 요청 취소 완료', {
            evaluationId: params.evaluationId,
        });
    }
    async 피평가자의_동료평가_요청을_일괄_취소한다(params) {
        this.logger.log('피평가자의 동료평가 요청 일괄 취소 비즈니스 로직 시작', {
            evaluateeId: params.evaluateeId,
            periodId: params.periodId,
        });
        const result = await this.performanceEvaluationService.피평가자의_동료평가를_일괄_취소한다(params.evaluateeId, params.periodId, params.cancelledBy);
        this.logger.log('피평가자의 동료평가 요청 일괄 취소 완료', {
            cancelledCount: result.cancelledCount,
        });
        return result;
    }
    async 동료평가를_제출한다(params) {
        this.logger.log('동료평가 제출 비즈니스 로직 시작', {
            evaluationId: params.evaluationId,
        });
        await this.performanceEvaluationService.동료평가를_제출한다(params.evaluationId, params.submittedBy);
        this.logger.log('동료평가 제출 및 알림 발송 완료', {
            evaluationId: params.evaluationId,
        });
    }
    async 동료평가_목록을_조회한다(params) {
        const query = new peer_evaluation_1.GetPeerEvaluationListQuery(params.evaluatorId, params.evaluateeId, params.periodId, params.status, params.page, params.limit);
        return await this.performanceEvaluationService.동료평가_목록을_조회한다(query);
    }
    async 동료평가_상세정보를_조회한다(params) {
        this.logger.log('동료평가 상세정보 조회 비즈니스 로직', {
            evaluationId: params.evaluationId,
        });
        const query = new peer_evaluation_1.GetPeerEvaluationDetailQuery(params.evaluationId);
        return await this.performanceEvaluationService.동료평가_상세정보를_조회한다(query);
    }
    async 평가자에게_할당된_피평가자_목록을_조회한다(params) {
        this.logger.log('평가자에게 할당된 피평가자 목록 조회 비즈니스 로직', {
            evaluatorId: params.evaluatorId,
            periodId: params.periodId,
        });
        const query = new peer_evaluation_1.GetEvaluatorAssignedEvaluateesQuery(params.evaluatorId, params.periodId, params.includeCompleted || false);
        return await this.performanceEvaluationService.평가자에게_할당된_피평가자_목록을_조회한다(query);
    }
    async 동료평가_답변을_저장한다(params) {
        this.logger.log('동료평가 답변 저장 비즈니스 로직 시작', {
            peerEvaluationId: params.peerEvaluationId,
            answersCount: params.answers.length,
        });
        const savedCount = await this.performanceEvaluationService.동료평가_답변을_저장한다(params.peerEvaluationId, params.answers, params.answeredBy);
        this.logger.log('동료평가 답변 저장 완료', {
            peerEvaluationId: params.peerEvaluationId,
            savedCount,
        });
        return { savedCount };
    }
};
exports.PeerEvaluationBusinessService = PeerEvaluationBusinessService;
exports.PeerEvaluationBusinessService = PeerEvaluationBusinessService = PeerEvaluationBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [performance_evaluation_service_1.PerformanceEvaluationService])
], PeerEvaluationBusinessService);
//# sourceMappingURL=peer-evaluation-business.service.js.map