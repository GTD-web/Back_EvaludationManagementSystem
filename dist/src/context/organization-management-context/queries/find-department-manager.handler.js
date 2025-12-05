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
var FindDepartmentManagerHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindDepartmentManagerHandler = exports.FindDepartmentManagerQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
const department_service_1 = require("../../../domain/common/department/department.service");
class FindDepartmentManagerQuery {
    employeeId;
    constructor(employeeId) {
        this.employeeId = employeeId;
    }
}
exports.FindDepartmentManagerQuery = FindDepartmentManagerQuery;
let FindDepartmentManagerHandler = FindDepartmentManagerHandler_1 = class FindDepartmentManagerHandler {
    employeeService;
    departmentService;
    logger = new common_1.Logger(FindDepartmentManagerHandler_1.name);
    constructor(employeeService, departmentService) {
        this.employeeService = employeeService;
        this.departmentService = departmentService;
    }
    async execute(query) {
        const { employeeId } = query;
        this.logger.log(`부서장 조회 시작 - 직원: ${employeeId}`);
        try {
            const employee = await this.employeeService.findById(employeeId);
            if (!employee) {
                this.logger.warn(`직원을 찾을 수 없습니다: ${employeeId}`);
                return null;
            }
            if (!employee.departmentId) {
                this.logger.warn(`직원의 부서가 설정되지 않았습니다: ${employeeId}`);
                return null;
            }
            const department = await this.departmentService.findById(employee.departmentId);
            if (!department) {
                this.logger.warn(`부서를 찾을 수 없습니다: ${employee.departmentId}`);
                return null;
            }
            const managerId = await this.부서장을_찾는다(employeeId, department, 0);
            if (managerId) {
                this.logger.log(`부서장 찾기 성공 - 직원: ${employeeId}, 부서장: ${managerId}`);
            }
            else {
                this.logger.warn(`부서장을 찾을 수 없습니다 - 직원: ${employeeId}`);
            }
            return managerId;
        }
        catch (error) {
            this.logger.error(`부서장 조회 실패 - 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
    async 부서장을_찾는다(employeeId, department, level) {
        if (level >= 3) {
            this.logger.warn(`최대 레벨(3)에 도달했습니다 - 직원: ${employeeId}, 레벨: ${level}`);
            return null;
        }
        if (!department.managerId) {
            this.logger.debug(`부서에 managerId가 없습니다 - 부서: ${department.id}, 레벨: ${level}`);
            if (department.parentDepartmentId) {
                const parentDepartment = await this.departmentService.findByExternalId(department.parentDepartmentId);
                if (parentDepartment) {
                    return await this.부서장을_찾는다(employeeId, parentDepartment, level + 1);
                }
            }
            return null;
        }
        if (department.managerId === employeeId) {
            this.logger.debug(`본인이 부서장입니다 - 직원: ${employeeId}, 부서: ${department.id}, 레벨: ${level}`);
            if (department.parentDepartmentId) {
                const parentDepartment = await this.departmentService.findByExternalId(department.parentDepartmentId);
                if (parentDepartment) {
                    return await this.부서장을_찾는다(employeeId, parentDepartment, level + 1);
                }
            }
            return null;
        }
        const manager = await this.employeeService.findById(department.managerId);
        if (!manager) {
            this.logger.warn(`부서장이 Employee 테이블에 존재하지 않습니다 - managerId: ${department.managerId}, 부서: ${department.id}`);
            if (department.parentDepartmentId) {
                const parentDepartment = await this.departmentService.findByExternalId(department.parentDepartmentId);
                if (parentDepartment) {
                    return await this.부서장을_찾는다(employeeId, parentDepartment, level + 1);
                }
            }
            return null;
        }
        return department.managerId;
    }
};
exports.FindDepartmentManagerHandler = FindDepartmentManagerHandler;
exports.FindDepartmentManagerHandler = FindDepartmentManagerHandler = FindDepartmentManagerHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(FindDepartmentManagerQuery),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService,
        department_service_1.DepartmentService])
], FindDepartmentManagerHandler);
//# sourceMappingURL=find-department-manager.handler.js.map