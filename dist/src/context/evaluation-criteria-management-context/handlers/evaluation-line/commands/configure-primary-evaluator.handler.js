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
var ConfigurePrimaryEvaluatorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurePrimaryEvaluatorHandler = exports.ConfigurePrimaryEvaluatorCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const evaluation_line_service_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.service");
const evaluation_line_mapping_service_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
class ConfigurePrimaryEvaluatorCommand {
    employeeId;
    periodId;
    evaluatorId;
    createdBy;
    constructor(employeeId, periodId, evaluatorId, createdBy) {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.evaluatorId = evaluatorId;
        this.createdBy = createdBy;
    }
}
exports.ConfigurePrimaryEvaluatorCommand = ConfigurePrimaryEvaluatorCommand;
let ConfigurePrimaryEvaluatorHandler = ConfigurePrimaryEvaluatorHandler_1 = class ConfigurePrimaryEvaluatorHandler {
    evaluationLineService;
    evaluationLineMappingService;
    downwardEvaluationService;
    logger = new common_1.Logger(ConfigurePrimaryEvaluatorHandler_1.name);
    constructor(evaluationLineService, evaluationLineMappingService, downwardEvaluationService) {
        this.evaluationLineService = evaluationLineService;
        this.evaluationLineMappingService = evaluationLineMappingService;
        this.downwardEvaluationService = downwardEvaluationService;
    }
    async execute(command) {
        const { employeeId, periodId, evaluatorId, createdBy } = command;
        this.logger.log(`1차 평가자 구성 시작 - 직원: ${employeeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`);
        try {
            let createdLines = 0;
            let createdMappings = 0;
            const evaluationLines = await this.evaluationLineService.필터_조회한다({
                evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
                orderFrom: 1,
                orderTo: 1,
            });
            let primaryEvaluationLine;
            if (evaluationLines.length > 0) {
                primaryEvaluationLine = evaluationLines[0];
            }
            else {
                primaryEvaluationLine = await this.evaluationLineService.생성한다({
                    evaluatorType: evaluation_line_types_1.EvaluatorType.PRIMARY,
                    order: 1,
                    isRequired: true,
                    isAutoAssigned: false,
                });
                createdLines++;
            }
            const evaluationLineId = primaryEvaluationLine.DTO로_변환한다().id;
            const existingMappings = await this.evaluationLineMappingService.필터_조회한다({
                evaluationPeriodId: periodId,
                employeeId,
                evaluationLineId,
            });
            const primaryMappings = existingMappings.filter((mapping) => !mapping.wbsItemId);
            let mappingEntity;
            if (primaryMappings.length > 0) {
                const existingMapping = primaryMappings[0];
                const mappingId = existingMapping.DTO로_변환한다().id;
                const previousEvaluatorId = existingMapping.evaluatorId;
                if (previousEvaluatorId && previousEvaluatorId !== evaluatorId) {
                    this.logger.log(`1차 평가자 변경 감지 - 기존 평가자: ${previousEvaluatorId}, 새 평가자: ${evaluatorId}`);
                    const existingDownwardEvaluations = await this.downwardEvaluationService.필터_조회한다({
                        employeeId,
                        evaluatorId: previousEvaluatorId,
                        periodId,
                        evaluationType: downward_evaluation_types_1.DownwardEvaluationType.PRIMARY,
                    });
                    for (const downwardEval of existingDownwardEvaluations) {
                        if (!downwardEval.deletedAt) {
                            await this.downwardEvaluationService.삭제한다(downwardEval.id, createdBy || evaluatorId);
                            this.logger.log(`기존 1차 평가자의 하향평가 삭제 - 하향평가 ID: ${downwardEval.id}, WBS: ${downwardEval.wbsId}`);
                        }
                    }
                }
                mappingEntity = await this.evaluationLineMappingService.업데이트한다(mappingId, {
                    evaluatorId,
                    updatedBy: createdBy || evaluatorId,
                }, createdBy || evaluatorId);
                this.logger.log(`기존 1차 평가자 매핑 업데이트 - 매핑 ID: ${mappingId}, 새 평가자: ${evaluatorId}`);
            }
            else {
                mappingEntity = await this.evaluationLineMappingService.생성한다({
                    evaluationPeriodId: command.periodId,
                    employeeId,
                    evaluatorId,
                    wbsItemId: undefined,
                    evaluationLineId,
                    createdBy,
                });
                createdMappings++;
                this.logger.log(`새 1차 평가자 매핑 생성 - 매핑 ID: ${mappingEntity.DTO로_변환한다().id}`);
            }
            const mappingDto = mappingEntity.DTO로_변환한다();
            const mapping = {
                id: mappingDto.id,
                employeeId: mappingDto.employeeId,
                evaluatorId: mappingDto.evaluatorId,
                wbsItemId: mappingDto.wbsItemId || null,
                evaluationLineId: mappingDto.evaluationLineId,
            };
            this.logger.log(`1차 평가자 구성 완료 - 피평가자: ${employeeId}, 평가자: ${evaluatorId}`);
            const result = {
                message: `직원 ${employeeId}의 1차 평가자(고정 담당자) 구성이 완료되었습니다.`,
                createdLines,
                createdMappings,
                mapping,
            };
            return result;
        }
        catch (error) {
            this.logger.error(`1차 평가자 구성 실패 - 직원: ${employeeId}, 평가자: ${evaluatorId}`, error.stack);
            throw error;
        }
    }
};
exports.ConfigurePrimaryEvaluatorHandler = ConfigurePrimaryEvaluatorHandler;
exports.ConfigurePrimaryEvaluatorHandler = ConfigurePrimaryEvaluatorHandler = ConfigurePrimaryEvaluatorHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(ConfigurePrimaryEvaluatorCommand),
    __metadata("design:paramtypes", [evaluation_line_service_1.EvaluationLineService,
        evaluation_line_mapping_service_1.EvaluationLineMappingService,
        downward_evaluation_service_1.DownwardEvaluationService])
], ConfigurePrimaryEvaluatorHandler);
//# sourceMappingURL=configure-primary-evaluator.handler.js.map