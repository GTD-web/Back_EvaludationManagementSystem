"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonDomainModule = void 0;
const common_1 = require("@nestjs/common");
const employee_module_1 = require("./employee/employee.module");
const department_module_1 = require("./department/department.module");
const project_module_1 = require("./project/project.module");
const wbs_item_module_1 = require("./wbs-item/wbs-item.module");
const sso_module_1 = require("./sso/sso.module");
const audit_log_module_1 = require("./audit-log/audit-log.module");
const system_setting_module_1 = require("./system-setting/system-setting.module");
let CommonDomainModule = class CommonDomainModule {
};
exports.CommonDomainModule = CommonDomainModule;
exports.CommonDomainModule = CommonDomainModule = __decorate([
    (0, common_1.Module)({
        imports: [
            employee_module_1.EmployeeModule,
            department_module_1.DepartmentModule,
            project_module_1.ProjectModule,
            wbs_item_module_1.WbsItemModule,
            sso_module_1.SSOModule,
            audit_log_module_1.AuditLogModule,
            system_setting_module_1.SystemSettingModule,
        ],
        exports: [
            employee_module_1.EmployeeModule,
            department_module_1.DepartmentModule,
            project_module_1.ProjectModule,
            wbs_item_module_1.WbsItemModule,
            sso_module_1.SSOModule,
            audit_log_module_1.AuditLogModule,
            system_setting_module_1.SystemSettingModule,
        ],
    })
], CommonDomainModule);
//# sourceMappingURL=common-domain.module.js.map