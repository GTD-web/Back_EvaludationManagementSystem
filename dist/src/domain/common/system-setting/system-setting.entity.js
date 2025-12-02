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
var SystemSetting_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSetting = void 0;
const typeorm_1 = require("typeorm");
let SystemSetting = SystemSetting_1 = class SystemSetting {
    id;
    key;
    value;
    description;
    createdAt;
    updatedAt;
    DTO로_변환한다() {
        return {
            id: this.id,
            key: this.key,
            value: this.value,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
    static 생성한다(key, value, description) {
        const setting = new SystemSetting_1();
        setting.key = key;
        setting.value = value;
        setting.description = description;
        return setting;
    }
    값을_업데이트한다(value) {
        this.value = value;
    }
};
exports.SystemSetting = SystemSetting;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SystemSetting.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 100,
        comment: '설정 키',
    }),
    __metadata("design:type", String)
], SystemSetting.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'json',
        comment: '설정 값 (JSON)',
    }),
    __metadata("design:type", Object)
], SystemSetting.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '설정 설명',
    }),
    __metadata("design:type", String)
], SystemSetting.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'timestamp with time zone',
        comment: '생성 일시',
    }),
    __metadata("design:type", Date)
], SystemSetting.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'timestamp with time zone',
        comment: '수정 일시',
    }),
    __metadata("design:type", Date)
], SystemSetting.prototype, "updatedAt", void 0);
exports.SystemSetting = SystemSetting = SystemSetting_1 = __decorate([
    (0, typeorm_1.Entity)('system_setting'),
    (0, typeorm_1.Index)(['key'], { unique: true })
], SystemSetting);
//# sourceMappingURL=system-setting.entity.js.map