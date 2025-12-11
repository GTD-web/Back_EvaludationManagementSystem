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
var DeleteWbsSelfEvaluationsByAssignmentHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteWbsSelfEvaluationsByAssignmentHandler = exports.DeleteWbsSelfEvaluationsByAssignmentCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
class DeleteWbsSelfEvaluationsByAssignmentCommand {
    employeeId;
    periodId;
    wbsItemId;
    deletedBy;
    constructor(employeeId, periodId, wbsItemId, deletedBy) {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.wbsItemId = wbsItemId;
        this.deletedBy = deletedBy;
    }
}
exports.DeleteWbsSelfEvaluationsByAssignmentCommand = DeleteWbsSelfEvaluationsByAssignmentCommand;
let DeleteWbsSelfEvaluationsByAssignmentHandler = DeleteWbsSelfEvaluationsByAssignmentHandler_1 = class DeleteWbsSelfEvaluationsByAssignmentHandler {
    wbsSelfEvaluationService;
    logger = new common_1.Logger(DeleteWbsSelfEvaluationsByAssignmentHandler_1.name);
    constructor(wbsSelfEvaluationService) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
    }
    async execute(command) {
        this.logger.log('WBS 할당 연결 자기평가 삭제 시작', {
            employeeId: command.employeeId,
            periodId: command.periodId,
            wbsItemId: command.wbsItemId,
        });
        const selfEvaluations = await this.wbsSelfEvaluationService.필터_조회한다({
            employeeId: command.employeeId,
            periodId: command.periodId,
            wbsItemId: command.wbsItemId,
        });
        if (selfEvaluations.length === 0) {
            this.logger.log('삭제할 자기평가가 없습니다', {
                employeeId: command.employeeId,
                periodId: command.periodId,
                wbsItemId: command.wbsItemId,
            });
            return {
                deletedCount: 0,
                deletedEvaluations: [],
            };
        }
        const deletedEvaluations = [];
        for (const evaluation of selfEvaluations) {
            const evaluationDto = evaluation.DTO로_변환한다();
            await this.wbsSelfEvaluationService.삭제한다(evaluationDto.id, command.deletedBy);
            deletedEvaluations.push({
                evaluationId: evaluationDto.id,
                wbsItemId: evaluationDto.wbsItemId,
            });
            this.logger.debug('자기평가 삭제 완료', {
                evaluationId: evaluationDto.id,
                wbsItemId: evaluationDto.wbsItemId,
            });
        }
        this.logger.log('WBS 할당 연결 자기평가 삭제 완료', {
            deletedCount: deletedEvaluations.length,
            wbsItemId: command.wbsItemId,
        });
        return {
            deletedCount: deletedEvaluations.length,
            deletedEvaluations,
        };
    }
};
exports.DeleteWbsSelfEvaluationsByAssignmentHandler = DeleteWbsSelfEvaluationsByAssignmentHandler;
exports.DeleteWbsSelfEvaluationsByAssignmentHandler = DeleteWbsSelfEvaluationsByAssignmentHandler = DeleteWbsSelfEvaluationsByAssignmentHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(DeleteWbsSelfEvaluationsByAssignmentCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService])
], DeleteWbsSelfEvaluationsByAssignmentHandler);
//# sourceMappingURL=delete-wbs-self-evaluations-by-assignment.handler.js.map