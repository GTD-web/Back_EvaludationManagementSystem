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
var GenerateSeedDataHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateSeedDataHandler = exports.GenerateSeedDataCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const types_1 = require("../../types");
const generators_1 = require("../../generators");
class GenerateSeedDataCommand {
    config;
    constructor(config) {
        this.config = config;
    }
}
exports.GenerateSeedDataCommand = GenerateSeedDataCommand;
let GenerateSeedDataHandler = GenerateSeedDataHandler_1 = class GenerateSeedDataHandler {
    phase1Generator;
    phase2Generator;
    phase3Generator;
    phase4Generator;
    phase5Generator;
    phase6Generator;
    phase7Generator;
    phase8Generator;
    logger = new common_1.Logger(GenerateSeedDataHandler_1.name);
    constructor(phase1Generator, phase2Generator, phase3Generator, phase4Generator, phase5Generator, phase6Generator, phase7Generator, phase8Generator) {
        this.phase1Generator = phase1Generator;
        this.phase2Generator = phase2Generator;
        this.phase3Generator = phase3Generator;
        this.phase4Generator = phase4Generator;
        this.phase5Generator = phase5Generator;
        this.phase6Generator = phase6Generator;
        this.phase7Generator = phase7Generator;
        this.phase8Generator = phase8Generator;
    }
    async execute(command) {
        const { config } = command;
        const results = [];
        this.logger.log(`시드 데이터 생성 시작 - 시나리오: ${config.scenario}, 삭제: ${config.clearExisting}`);
        this.logger.log(`설정 확인 - useRealDepartments: ${config.useRealDepartments}, useRealEmployees: ${config.useRealEmployees}`);
        this.logger.log(`stateDistribution.excludedFromList: ${config.stateDistribution?.excludedFromList ?? '(undefined)'}`);
        console.log(`시드 데이터 생성 시작 - 시나리오: ${config.scenario}, 삭제: ${config.clearExisting}`);
        console.log(`설정 확인 - useRealDepartments: ${config.useRealDepartments}, useRealEmployees: ${config.useRealEmployees}`);
        this.logger.log(`shouldRunPhase(2, ${config.scenario}): ${this.shouldRunPhase(2, config.scenario)}`);
        this.logger.log(`shouldRunPhase(3, ${config.scenario}): ${this.shouldRunPhase(3, config.scenario)}`);
        this.logger.log(`shouldRunPhase(4, ${config.scenario}): ${this.shouldRunPhase(4, config.scenario)}`);
        try {
            const phase1Result = await this.phase1Generator.generate(config);
            results.push(phase1Result);
            if (this.shouldRunPhase(2, config.scenario)) {
                this.logger.log('Phase 2 실행 중...');
                const phase2Result = await this.phase2Generator.generate(config, phase1Result);
                results.push(phase2Result);
                this.logger.log('Phase 2 실행 완료');
                if (this.shouldRunPhase(3, config.scenario)) {
                    this.logger.log('Phase 3 실행 중...');
                    const phase3Result = await this.phase3Generator.generate(config, phase1Result, phase2Result);
                    results.push(phase3Result);
                    this.logger.log('Phase 3 실행 완료');
                    if (this.shouldRunPhase(4, config.scenario)) {
                        this.logger.log('Phase 4 실행 중...');
                        const phase4Result = await this.phase4Generator.generate(config, phase1Result, phase2Result, phase3Result);
                        results.push(phase4Result);
                        this.logger.log('Phase 4 실행 완료');
                        if (this.shouldRunPhase(5, config.scenario)) {
                            const phase5Result = await this.phase5Generator.generate(config, phase1Result, phase2Result);
                            results.push(phase5Result);
                            if (this.shouldRunPhase(6, config.scenario)) {
                                const phase6Result = await this.phase6Generator.generate(config, phase1Result);
                                results.push(phase6Result);
                                if (this.shouldRunPhase(7, config.scenario)) {
                                    const phase7Result = await this.phase7Generator.generate(config, phase1Result, phase2Result);
                                    results.push(phase7Result);
                                    if (this.shouldRunPhase(8, config.scenario)) {
                                        const phase8Result = await this.phase8Generator.generate(config, phase1Result, phase6Result, phase7Result);
                                        results.push(phase8Result);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            this.logger.log('시드 데이터 생성 완료');
            return results;
        }
        catch (error) {
            this.logger.error('시드 데이터 생성 실패', error.stack);
            throw error;
        }
    }
    shouldRunPhase(phase, scenario) {
        const phaseMap = {
            [types_1.SeedScenario.MINIMAL]: 1,
            [types_1.SeedScenario.WITH_PERIOD]: 7,
            [types_1.SeedScenario.WITH_ASSIGNMENTS]: 5,
            [types_1.SeedScenario.WITH_SETUP]: 6,
            [types_1.SeedScenario.FULL]: 8,
        };
        return phase <= phaseMap[scenario];
    }
};
exports.GenerateSeedDataHandler = GenerateSeedDataHandler;
exports.GenerateSeedDataHandler = GenerateSeedDataHandler = GenerateSeedDataHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(GenerateSeedDataCommand),
    __metadata("design:paramtypes", [generators_1.Phase1OrganizationGenerator,
        generators_1.Phase2EvaluationPeriodGenerator,
        generators_1.Phase3AssignmentGenerator,
        generators_1.Phase4EvaluationCriteriaGenerator,
        generators_1.Phase5DeliverableGenerator,
        generators_1.Phase6QuestionGenerator,
        generators_1.Phase7EvaluationGenerator,
        generators_1.Phase8ResponseGenerator])
], GenerateSeedDataHandler);
//# sourceMappingURL=generate-seed-data.command.js.map