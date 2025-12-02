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
var ConfigureSecondaryEvaluatorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigureSecondaryEvaluatorHandler = exports.ConfigureSecondaryEvaluatorCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const evaluation_line_service_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.service");
const evaluation_line_mapping_service_1 = require("../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service");
const evaluation_line_types_1 = require("../../../../../domain/core/evaluation-line/evaluation-line.types");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
class ConfigureSecondaryEvaluatorCommand {
    employeeId;
    wbsItemId;
    periodId;
    evaluatorId;
    createdBy;
    constructor(employeeId, wbsItemId, periodId, evaluatorId, createdBy) {
        this.employeeId = employeeId;
        this.wbsItemId = wbsItemId;
        this.periodId = periodId;
        this.evaluatorId = evaluatorId;
        this.createdBy = createdBy;
    }
}
exports.ConfigureSecondaryEvaluatorCommand = ConfigureSecondaryEvaluatorCommand;
let ConfigureSecondaryEvaluatorHandler = ConfigureSecondaryEvaluatorHandler_1 = class ConfigureSecondaryEvaluatorHandler {
    evaluationLineService;
    evaluationLineMappingService;
    downwardEvaluationService;
    logger = new common_1.Logger(ConfigureSecondaryEvaluatorHandler_1.name);
    constructor(evaluationLineService, evaluationLineMappingService, downwardEvaluationService) {
        this.evaluationLineService = evaluationLineService;
        this.evaluationLineMappingService = evaluationLineMappingService;
        this.downwardEvaluationService = downwardEvaluationService;
    }
    async execute(command) {
        const { employeeId, wbsItemId, periodId, evaluatorId, createdBy } = command;
        this.logger.log(`2차 평가자 구성 시작 - 직원: ${employeeId}, WBS: ${wbsItemId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`);
        try {
            let createdLines = 0;
            let createdMappings = 0;
            const evaluationLines = await this.evaluationLineService.필터_조회한다({
                evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
                orderFrom: 2,
                orderTo: 2,
            });
            let secondaryEvaluationLine;
            if (evaluationLines.length > 0) {
                secondaryEvaluationLine = evaluationLines[0];
            }
            else {
                secondaryEvaluationLine = await this.evaluationLineService.생성한다({
                    evaluatorType: evaluation_line_types_1.EvaluatorType.SECONDARY,
                    order: 2,
                    isRequired: true,
                    isAutoAssigned: false,
                });
                createdLines++;
            }
            const evaluationLineId = secondaryEvaluationLine.DTO로_변환한다().id;
            const existingMappings = await this.evaluationLineMappingService.필터_조회한다({
                evaluationPeriodId: periodId,
                employeeId,
                wbsItemId,
                evaluationLineId,
            });
            if (existingMappings.length > 0) {
                for (const existingMapping of existingMappings) {
                    const mappingId = existingMapping.DTO로_변환한다().id;
                    const previousEvaluatorId = existingMapping.evaluatorId;
                    if (previousEvaluatorId && previousEvaluatorId !== evaluatorId) {
                        this.logger.log(`2차 평가자 변경 감지 - WBS: ${wbsItemId}, 기존 평가자: ${previousEvaluatorId}, 새 평가자: ${evaluatorId}`);
                        const existingDownwardEvaluations = await this.downwardEvaluationService.필터_조회한다({
                            employeeId,
                            evaluatorId: previousEvaluatorId,
                            periodId,
                            wbsId: wbsItemId,
                            evaluationType: downward_evaluation_types_1.DownwardEvaluationType.SECONDARY,
                        });
                        for (const downwardEval of existingDownwardEvaluations) {
                            if (!downwardEval.deletedAt) {
                                await this.downwardEvaluationService.삭제한다(downwardEval.id, createdBy || evaluatorId);
                                this.logger.log(`기존 2차 평가자의 하향평가 삭제 - 하향평가 ID: ${downwardEval.id}, WBS: ${downwardEval.wbsId}`);
                            }
                        }
                    }
                    await this.evaluationLineMappingService.삭제한다(mappingId, createdBy || evaluatorId);
                    this.logger.log(`기존 2차 평가자 매핑 삭제 - 매핑 ID: ${mappingId}, 기존 평가자: ${existingMapping.evaluatorId}`);
                }
            }
            const mappingEntity = await this.evaluationLineMappingService.생성한다({
                evaluationPeriodId: command.periodId,
                employeeId,
                evaluatorId,
                wbsItemId,
                evaluationLineId,
                createdBy,
            });
            createdMappings++;
            this.logger.log(`새 2차 평가자 매핑 생성 - 매핑 ID: ${mappingEntity.DTO로_변환한다().id}, 평가자: ${evaluatorId}`);
            const mappingDto = mappingEntity.DTO로_변환한다();
            const mapping = {
                id: mappingDto.id,
                employeeId: mappingDto.employeeId,
                evaluatorId: mappingDto.evaluatorId,
                wbsItemId: mappingDto.wbsItemId || '',
                evaluationLineId: mappingDto.evaluationLineId,
            };
            this.logger.log(`2차 평가자 구성 완료 - 피평가자: ${employeeId}, 평가자: ${evaluatorId}`);
            const result = {
                message: `직원 ${employeeId}의 WBS 항목 ${wbsItemId}에 대한 2차 평가자 구성이 완료되었습니다.`,
                createdLines,
                createdMappings,
                mapping,
            };
            return result;
        }
        catch (error) {
            this.logger.error(`2차 평가자 구성 실패 - 직원: ${employeeId}, WBS: ${wbsItemId}, 평가자: ${evaluatorId}`, error.stack);
            throw error;
        }
    }
};
exports.ConfigureSecondaryEvaluatorHandler = ConfigureSecondaryEvaluatorHandler;
exports.ConfigureSecondaryEvaluatorHandler = ConfigureSecondaryEvaluatorHandler = ConfigureSecondaryEvaluatorHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(ConfigureSecondaryEvaluatorCommand),
    __metadata("design:paramtypes", [evaluation_line_service_1.EvaluationLineService,
        evaluation_line_mapping_service_1.EvaluationLineMappingService,
        downward_evaluation_service_1.DownwardEvaluationService])
], ConfigureSecondaryEvaluatorHandler);
//# sourceMappingURL=configure-secondary-evaluator.handler.js.map