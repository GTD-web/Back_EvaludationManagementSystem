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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const system_setting_entity_1 = require("./system-setting.entity");
const system_setting_types_1 = require("./system-setting.types");
let SystemSettingService = class SystemSettingService {
    systemSettingRepository;
    constructor(systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }
    async 설정을_조회한다(key) {
        const setting = await this.systemSettingRepository.findOne({
            where: { key },
        });
        return setting ? setting.value : null;
    }
    async 설정을_저장한다(key, value, description) {
        let setting = await this.systemSettingRepository.findOne({
            where: { key },
        });
        if (setting) {
            setting.값을_업데이트한다(value);
        }
        else {
            setting = system_setting_entity_1.SystemSetting.생성한다(key, value, description);
        }
        await this.systemSettingRepository.save(setting);
    }
    async 기본등급구간_조회한다() {
        const gradeRanges = await this.설정을_조회한다(system_setting_types_1.SystemSettingKey.DEFAULT_GRADE_RANGES);
        if (!gradeRanges) {
            await this.설정을_저장한다(system_setting_types_1.SystemSettingKey.DEFAULT_GRADE_RANGES, system_setting_types_1.DEFAULT_GRADE_RANGES_INITIAL, '평가 기간 생성 시 사용되는 기본 등급 구간');
            return system_setting_types_1.DEFAULT_GRADE_RANGES_INITIAL;
        }
        return gradeRanges;
    }
    async 기본등급구간_변경한다(gradeRanges) {
        await this.설정을_저장한다(system_setting_types_1.SystemSettingKey.DEFAULT_GRADE_RANGES, gradeRanges, '평가 기간 생성 시 사용되는 기본 등급 구간');
        return gradeRanges;
    }
};
exports.SystemSettingService = SystemSettingService;
exports.SystemSettingService = SystemSettingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(system_setting_entity_1.SystemSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SystemSettingService);
//# sourceMappingURL=system-setting.service.js.map