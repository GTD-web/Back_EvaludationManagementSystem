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
var SubmitDownwardEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitDownwardEvaluationHandler = exports.SubmitDownwardEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const downward_evaluation_exceptions_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.exceptions");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_period_employee_mapping_entity_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_evaluation_step_approval_service_1 = require("../../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service");
const employee_evaluation_step_approval_types_1 = require("../../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types");
const notification_1 = require("../../../../../domain/common/notification");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
const step_approval_context_service_1 = require("../../../../step-approval-context/step-approval-context.service");
const employee_service_1 = require("../../../../../domain/common/employee/employee.service");
class SubmitDownwardEvaluationCommand {
    evaluationId;
    submittedBy;
    constructor(evaluationId, submittedBy = '시스템') {
        this.evaluationId = evaluationId;
        this.submittedBy = submittedBy;
    }
}
exports.SubmitDownwardEvaluationCommand = SubmitDownwardEvaluationCommand;
let SubmitDownwardEvaluationHandler = SubmitDownwardEvaluationHandler_1 = class SubmitDownwardEvaluationHandler {
    downwardEvaluationService;
    transactionManager;
    mappingRepository;
    stepApprovalService;
    notificationHelper;
    evaluationPeriodService;
    stepApprovalContext;
    employeeService;
    logger = new common_1.Logger(SubmitDownwardEvaluationHandler_1.name);
    constructor(downwardEvaluationService, transactionManager, mappingRepository, stepApprovalService, notificationHelper, evaluationPeriodService, stepApprovalContext, employeeService) {
        this.downwardEvaluationService = downwardEvaluationService;
        this.transactionManager = transactionManager;
        this.mappingRepository = mappingRepository;
        this.stepApprovalService = stepApprovalService;
        this.notificationHelper = notificationHelper;
        this.evaluationPeriodService = evaluationPeriodService;
        this.stepApprovalContext = stepApprovalContext;
        this.employeeService = employeeService;
    }
    async execute(command) {
        const { evaluationId, submittedBy } = command;
        this.logger.log('하향평가 제출 핸들러 실행', { evaluationId });
        await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.downwardEvaluationService.조회한다(evaluationId);
            if (!evaluation) {
                throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(evaluationId);
            }
            if (evaluation.완료되었는가()) {
                throw new downward_evaluation_exceptions_1.DownwardEvaluationAlreadyCompletedException(evaluationId);
            }
            await this.downwardEvaluationService.수정한다(evaluationId, { isCompleted: true }, submittedBy);
            this.logger.debug(`단계 승인 상태를 pending으로 변경 시작 - 피평가자: ${evaluation.employeeId}, 평가기간: ${evaluation.periodId}, 평가유형: ${evaluation.evaluationType}`);
            const mapping = await this.mappingRepository.findOne({
                where: {
                    evaluationPeriodId: evaluation.periodId,
                    employeeId: evaluation.employeeId,
                    deletedAt: null,
                },
            });
            if (mapping) {
                let stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
                if (!stepApproval) {
                    this.logger.log(`단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}`);
                    stepApproval = await this.stepApprovalService.생성한다({
                        evaluationPeriodEmployeeMappingId: mapping.id,
                        createdBy: submittedBy,
                    });
                }
                if (evaluation.evaluationType === 'primary') {
                    this.stepApprovalService.단계_상태를_변경한다(stepApproval, 'primary', employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING, submittedBy);
                }
                else if (evaluation.evaluationType === 'secondary') {
                    this.stepApprovalService.단계_상태를_변경한다(stepApproval, 'secondary', employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING, submittedBy);
                }
                await this.stepApprovalService.저장한다(stepApproval);
                this.logger.debug(`단계 승인 상태를 pending으로 변경 완료 - 피평가자: ${evaluation.employeeId}, 평가유형: ${evaluation.evaluationType}`);
            }
            if (evaluation.evaluationType === 'primary') {
                this.이차평가자에게_알림을전송한다(evaluation.employeeId, evaluation.periodId, evaluation.wbsId, evaluation.evaluatorId).catch((error) => {
                    this.logger.error('2차 평가자 알림 전송 실패 (무시됨)', error.stack);
                });
            }
            this.logger.log('하향평가 제출 완료', { evaluationId });
        });
    }
    async 이차평가자에게_알림을전송한다(employeeId, periodId, wbsId, primaryEvaluatorId) {
        try {
            const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(periodId);
            if (!evaluationPeriod) {
                this.logger.warn(`평가기간을 찾을 수 없어 알림을 전송하지 않습니다. periodId=${periodId}`);
                return;
            }
            const primaryEvaluator = await this.employeeService.findById(primaryEvaluatorId);
            if (!primaryEvaluator) {
                this.logger.warn(`1차 평가자 정보를 찾을 수 없어 알림을 전송하지 않습니다. primaryEvaluatorId=${primaryEvaluatorId}`);
                return;
            }
            const secondaryEvaluatorId = await this.stepApprovalContext.이차평가자를_조회한다(periodId, employeeId, wbsId);
            if (!secondaryEvaluatorId) {
                this.logger.warn(`2차 평가자를 찾을 수 없어 알림을 전송하지 않습니다. employeeId=${employeeId}, periodId=${periodId}, wbsId=${wbsId}`);
                return;
            }
            const secondaryEvaluator = await this.employeeService.findById(secondaryEvaluatorId);
            if (!secondaryEvaluator) {
                this.logger.warn(`2차 평가자 정보를 찾을 수 없어 알림을 전송하지 않습니다. secondaryEvaluatorId=${secondaryEvaluatorId}`);
                return;
            }
            await this.notificationHelper.직원에게_알림을_전송한다({
                sender: 'system',
                title: '1차 하향평가 제출 알림',
                content: `${evaluationPeriod.name} 평가기간의 ${primaryEvaluator.name} 1차 평가자가 1차 하향평가를 제출했습니다.`,
                employeeNumber: secondaryEvaluator.employeeNumber,
                sourceSystem: 'EMS',
                linkUrl: `/current/user/employee-evaluation?periodId=${periodId}&employeeId=${employeeId}`,
                metadata: {
                    type: 'downward-evaluation-submitted',
                    evaluationType: 'primary',
                    priority: 'medium',
                    employeeId,
                    periodId,
                    wbsId,
                    primaryEvaluatorName: primaryEvaluator.name,
                },
            });
            this.logger.log(`2차 평가자에게 1차 하향평가 제출 알림 전송 완료: 1차 평가자=${primaryEvaluator.name}, 2차 평가자=${secondaryEvaluatorId}, 직원번호=${secondaryEvaluator.employeeNumber}`);
        }
        catch (error) {
            this.logger.error('2차 평가자 알림 전송 중 오류 발생', error.stack);
            throw error;
        }
    }
};
exports.SubmitDownwardEvaluationHandler = SubmitDownwardEvaluationHandler;
exports.SubmitDownwardEvaluationHandler = SubmitDownwardEvaluationHandler = SubmitDownwardEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(SubmitDownwardEvaluationCommand),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [downward_evaluation_service_1.DownwardEvaluationService,
        transaction_manager_service_1.TransactionManagerService,
        typeorm_2.Repository,
        employee_evaluation_step_approval_service_1.EmployeeEvaluationStepApprovalService,
        notification_1.NotificationHelperService,
        evaluation_period_service_1.EvaluationPeriodService,
        step_approval_context_service_1.StepApprovalContextService,
        employee_service_1.EmployeeService])
], SubmitDownwardEvaluationHandler);
//# sourceMappingURL=submit-downward-evaluation.handler.js.map