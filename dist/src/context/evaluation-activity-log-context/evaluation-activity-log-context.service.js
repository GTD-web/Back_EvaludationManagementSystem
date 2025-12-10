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
var EvaluationActivityLogContextService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationActivityLogContextService = void 0;
const common_1 = require("@nestjs/common");
const evaluation_activity_log_service_1 = require("../../domain/core/evaluation-activity-log/evaluation-activity-log.service");
const employee_service_1 = require("../../domain/common/employee/employee.service");
const employee_evaluation_step_approval_1 = require("../../domain/sub/employee-evaluation-step-approval");
let EvaluationActivityLogContextService = EvaluationActivityLogContextService_1 = class EvaluationActivityLogContextService {
    activityLogService;
    employeeService;
    logger = new common_1.Logger(EvaluationActivityLogContextService_1.name);
    constructor(activityLogService, employeeService) {
        this.activityLogService = activityLogService;
        this.employeeService = employeeService;
    }
    async 활동내역을_기록한다(params) {
        let performedByName = params.performedByName;
        if (!performedByName && params.performedBy) {
            try {
                const employee = await this.employeeService.ID로_조회한다(params.performedBy);
                if (employee) {
                    performedByName = employee.name;
                }
            }
            catch (error) {
                this.logger.warn('활동 수행자 이름 조회 실패', {
                    performedBy: params.performedBy,
                    error: error.message,
                });
            }
        }
        let activityDescription = params.activityDescription;
        if (!activityDescription && performedByName && params.activityTitle) {
            const actionText = this.액션을_텍스트로_변환한다(params.activityAction);
            const objectName = this.객체명을_추출한다(params.activityTitle, actionText);
            const particle = this.조사를_결정한다(objectName);
            activityDescription = `${performedByName}님이 ${objectName}${particle} ${actionText}했습니다.`;
        }
        const result = await this.activityLogService.생성한다({
            periodId: params.periodId,
            employeeId: params.employeeId,
            activityType: params.activityType,
            activityAction: params.activityAction,
            activityTitle: params.activityTitle,
            activityDescription,
            relatedEntityType: params.relatedEntityType,
            relatedEntityId: params.relatedEntityId,
            performedBy: params.performedBy,
            performedByName,
            activityMetadata: params.activityMetadata,
            activityDate: params.activityDate,
        });
        return result;
    }
    async 평가기간_피평가자_활동내역을_조회한다(params) {
        this.logger.log('평가기간 피평가자 활동 내역 조회 시작', {
            periodId: params.periodId,
            employeeId: params.employeeId,
        });
        return await this.activityLogService.평가기간_피평가자_활동내역을_조회한다({
            periodId: params.periodId,
            employeeId: params.employeeId,
            activityType: params.activityType,
            startDate: params.startDate,
            endDate: params.endDate,
            page: params.page,
            limit: params.limit,
        });
    }
    async 단계승인_상태변경_활동내역을_기록한다(params) {
        let activityTitle = '';
        let activityAction = 'approved';
        switch (params.step) {
            case 'criteria':
                activityTitle = '평가기준 설정';
                break;
            case 'self':
                activityTitle = '자기평가';
                break;
            case 'primary':
                activityTitle = '1차 하향평가';
                break;
            case 'secondary':
                activityTitle = '2차 하향평가';
                break;
            default:
                activityTitle = '단계 승인';
        }
        if (params.status === employee_evaluation_step_approval_1.StepApprovalStatus.APPROVED) {
            activityAction = 'approved';
            activityTitle += ' 승인';
        }
        else if (params.status === employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_REQUESTED) {
            activityAction = 'revision_requested';
            activityTitle += ' 재작성 요청';
        }
        else {
            this.logger.log('기록하지 않는 상태입니다', {
                status: params.status,
            });
            throw new Error(`기록하지 않는 상태입니다: ${params.status}`);
        }
        return await this.활동내역을_기록한다({
            periodId: params.evaluationPeriodId,
            employeeId: params.employeeId,
            activityType: 'step_approval',
            activityAction,
            activityTitle,
            relatedEntityType: 'step_approval',
            performedBy: params.updatedBy,
            activityMetadata: {
                step: params.step,
                status: params.status,
                revisionComment: params.revisionComment,
                evaluatorId: params.evaluatorId,
            },
        });
    }
    async 재작성완료_활동내역을_기록한다(params) {
        let activityTitle = '';
        switch (params.step) {
            case 'criteria':
                activityTitle = '평가기준 설정 재작성 완료';
                break;
            case 'self':
                activityTitle = '자기평가 재작성 완료';
                break;
            case 'primary':
                activityTitle = '1차 하향평가 재작성 완료';
                break;
            case 'secondary':
                activityTitle = '2차 하향평가 재작성 완료';
                break;
            default:
                activityTitle = '재작성 완료';
        }
        return await this.활동내역을_기록한다({
            periodId: params.evaluationPeriodId,
            employeeId: params.employeeId,
            activityType: 'revision_request',
            activityAction: 'revision_completed',
            activityTitle,
            relatedEntityType: 'revision_request',
            relatedEntityId: params.requestId,
            performedBy: params.performedBy,
            activityMetadata: {
                step: params.step,
                responseComment: params.responseComment,
                allCompleted: params.allCompleted,
            },
        });
    }
    액션을_텍스트로_변환한다(action) {
        const actionMap = {
            created: '생성',
            updated: '수정',
            submitted: '제출',
            completed: '완료',
            cancelled: '취소',
            deleted: '삭제',
            assigned: '할당',
            unassigned: '할당 해제',
            approved: '승인',
            rejected: '거부',
            revision_requested: '재작성 요청',
            revision_completed: '재작성 완료',
        };
        return actionMap[action] || action;
    }
    객체명을_추출한다(activityTitle, actionText) {
        let objectName = activityTitle;
        if (objectName.includes(actionText)) {
            objectName = objectName
                .replace(new RegExp(`\\s*${actionText}\\s*`), '')
                .trim();
        }
        objectName = objectName.replace(/\s*\([^)]*\)\s*/g, '').trim();
        return objectName || activityTitle;
    }
    조사를_결정한다(text) {
        if (!text)
            return '를';
        const lastChar = text[text.length - 1];
        const lastCharCode = lastChar.charCodeAt(0);
        if (lastCharCode >= 0xac00 && lastCharCode <= 0xd7a3) {
            const hasBatchim = (lastCharCode - 0xac00) % 28 !== 0;
            return hasBatchim ? '을' : '를';
        }
        return '를';
    }
};
exports.EvaluationActivityLogContextService = EvaluationActivityLogContextService;
exports.EvaluationActivityLogContextService = EvaluationActivityLogContextService = EvaluationActivityLogContextService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_activity_log_service_1.EvaluationActivityLogService,
        employee_service_1.EmployeeService])
], EvaluationActivityLogContextService);
//# sourceMappingURL=evaluation-activity-log-context.service.js.map