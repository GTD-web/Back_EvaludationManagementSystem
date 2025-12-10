"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMAND_HANDLERS = void 0;
__exportStar(require("./exclude-employee-from-list.handler"), exports);
__exportStar(require("./include-employee-in-list.handler"), exports);
__exportStar(require("./update-employee-admin.handler"), exports);
__exportStar(require("./bulk-update-employee-admin.handler"), exports);
const exclude_employee_from_list_handler_1 = require("./exclude-employee-from-list.handler");
const include_employee_in_list_handler_1 = require("./include-employee-in-list.handler");
const update_employee_admin_handler_1 = require("./update-employee-admin.handler");
const bulk_update_employee_admin_handler_1 = require("./bulk-update-employee-admin.handler");
exports.COMMAND_HANDLERS = [
    exclude_employee_from_list_handler_1.ExcludeEmployeeFromListHandler,
    include_employee_in_list_handler_1.IncludeEmployeeInListHandler,
    update_employee_admin_handler_1.UpdateEmployeeAdminHandler,
    bulk_update_employee_admin_handler_1.BulkUpdateEmployeeAdminHandler,
];
//# sourceMappingURL=index.js.map