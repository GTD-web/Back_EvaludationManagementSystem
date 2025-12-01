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
var SeedDataService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedDataService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const commands_1 = require("./handlers/commands");
const queries_1 = require("./handlers/queries");
let SeedDataService = SeedDataService_1 = class SeedDataService {
    commandBus;
    queryBus;
    logger = new common_1.Logger(SeedDataService_1.name);
    constructor(commandBus, queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    async 시드_데이터를_생성한다(config) {
        this.logger.log(`시드 데이터 생성 요청 - 시나리오: ${config.scenario}`);
        console.log(`시드 데이터 생성 요청 - 시나리오: ${config.scenario}`);
        if (config.clearExisting) {
            await this.시드_데이터를_삭제한다(true);
        }
        const results = await this.commandBus.execute(new commands_1.GenerateSeedDataCommand(config));
        return results;
    }
    async 시드_데이터를_삭제한다(clearAll) {
        this.logger.log(`시드 데이터 삭제 요청 - 전체 삭제: ${clearAll}`);
        await this.commandBus.execute(new commands_1.ClearSeedDataCommand());
    }
    async 시드_데이터_상태를_조회한다() {
        const status = await this.queryBus.execute(new queries_1.GetSeedDataStatusQuery());
        return status;
    }
};
exports.SeedDataService = SeedDataService;
exports.SeedDataService = SeedDataService = SeedDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus])
], SeedDataService);
//# sourceMappingURL=seed-data.service.js.map