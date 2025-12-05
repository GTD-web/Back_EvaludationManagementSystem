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
var RevisionRequestBusinessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevisionRequestBusinessService = void 0;
const common_1 = require("@nestjs/common");
const revision_request_context_service_1 = require("../../context/revision-request-context/revision-request-context.service");
const evaluation_activity_log_context_service_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.service");
let RevisionRequestBusinessService = RevisionRequestBusinessService_1 = class RevisionRequestBusinessService {
    revisionRequestContextService;
    activityLogContextService;
    logger = new common_1.Logger(RevisionRequestBusinessService_1.name);
    constructor(revisionRequestContextService, activityLogContextService) {
        this.revisionRequestContextService = revisionRequestContextService;
        this.activityLogContextService = activityLogContextService;
    }
    async 재작성완료_응답을_제출한다(requestId, recipientId, responseComment) {
        this.logger.log(`재작성 완료 응답 제출 시작 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`);
        const request = await this.revisionRequestContextService.재작성완료_응답을_제출한다_내부(requestId, recipientId, responseComment);
        try {
            let allCompleted;
            if (request.step === 'secondary') {
                allCompleted =
                    await this.revisionRequestContextService.모든_2차평가자의_재작성요청이_완료했는가_내부(request.evaluationPeriodId, request.employeeId);
            }
            else {
                allCompleted =
                    await this.revisionRequestContextService.모든_수신자가_완료했는가_내부(requestId);
            }
            await this.activityLogContextService.재작성완료_활동내역을_기록한다({
                evaluationPeriodId: request.evaluationPeriodId,
                employeeId: request.employeeId,
                step: request.step,
                requestId,
                performedBy: recipientId,
                responseComment,
                allCompleted,
            });
        }
        catch (error) {
            this.logger.warn('재작성 완료 활동 내역 기록 실패', {
                requestId,
                recipientId,
                error: error.message,
            });
        }
        this.logger.log(`재작성 완료 응답 제출 완료 - 요청 ID: ${requestId}, 수신자 ID: ${recipientId}`);
    }
    async 평가기간_직원_평가자로_재작성완료_응답을_제출한다(evaluationPeriodId, employeeId, evaluatorId, step, responseComment) {
        this.logger.log(`재작성 완료 응답 제출 시작 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}, 단계: ${step}`);
        const request = await this.revisionRequestContextService.평가기간_직원_평가자로_재작성완료_응답을_제출한다_내부(evaluationPeriodId, employeeId, evaluatorId, step, responseComment);
        try {
            let allCompleted;
            if (request.step === 'secondary') {
                allCompleted =
                    await this.revisionRequestContextService.모든_2차평가자의_재작성요청이_완료했는가_내부(request.evaluationPeriodId, request.employeeId);
            }
            else {
                allCompleted =
                    await this.revisionRequestContextService.모든_수신자가_완료했는가_내부(request.id);
            }
            await this.activityLogContextService.재작성완료_활동내역을_기록한다({
                evaluationPeriodId: request.evaluationPeriodId,
                employeeId: request.employeeId,
                step: request.step,
                requestId: request.id,
                performedBy: evaluatorId,
                responseComment,
                allCompleted,
            });
        }
        catch (error) {
            this.logger.warn('재작성 완료 활동 내역 기록 실패', {
                evaluationPeriodId,
                employeeId,
                evaluatorId,
                error: error.message,
            });
        }
        this.logger.log(`재작성 완료 응답 제출 완료 (관리자용) - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 평가자: ${evaluatorId}`);
    }
};
exports.RevisionRequestBusinessService = RevisionRequestBusinessService;
exports.RevisionRequestBusinessService = RevisionRequestBusinessService = RevisionRequestBusinessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [revision_request_context_service_1.RevisionRequestContextService,
        evaluation_activity_log_context_service_1.EvaluationActivityLogContextService])
], RevisionRequestBusinessService);
//# sourceMappingURL=revision-request-business.service.js.map