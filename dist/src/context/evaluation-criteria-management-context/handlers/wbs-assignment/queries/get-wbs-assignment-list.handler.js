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
exports.GetWbsAssignmentListHandler = exports.GetWbsAssignmentListQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_wbs_assignment_entity_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
class GetWbsAssignmentListQuery {
    filter;
    page;
    limit;
    orderBy;
    orderDirection;
    constructor(filter, page, limit, orderBy, orderDirection) {
        this.filter = filter;
        this.page = page;
        this.limit = limit;
        this.orderBy = orderBy;
        this.orderDirection = orderDirection;
    }
}
exports.GetWbsAssignmentListQuery = GetWbsAssignmentListQuery;
let GetWbsAssignmentListHandler = class GetWbsAssignmentListHandler {
    wbsAssignmentRepository;
    constructor(wbsAssignmentRepository) {
        this.wbsAssignmentRepository = wbsAssignmentRepository;
    }
    async execute(query) {
        const { filter, page, limit, orderBy, orderDirection } = query;
        const queryBuilder = this.createQueryBuilder(filter, orderBy, orderDirection);
        const totalCount = await queryBuilder.getCount();
        const currentPage = Math.max(1, page || 1);
        const currentLimit = Math.max(1, limit || 10);
        const offset = (currentPage - 1) * currentLimit;
        const assignments = await queryBuilder
            .leftJoinAndSelect(employee_entity_1.Employee, 'employee', 'employee.id = assignment.employeeId AND employee.deletedAt IS NULL')
            .leftJoinAndSelect(department_entity_1.Department, 'department', '"department"."externalId" = "employee"."departmentId" AND "department"."deletedAt" IS NULL')
            .leftJoinAndSelect(employee_entity_1.Employee, 'assignedBy', 'assignedBy.id = assignment.assignedBy AND assignedBy.deletedAt IS NULL')
            .leftJoinAndSelect(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
            .leftJoinAndSelect(wbs_item_entity_1.WbsItem, 'wbsItem', 'wbsItem.id = assignment.wbsItemId AND wbsItem.deletedAt IS NULL')
            .skip(offset)
            .take(currentLimit)
            .getMany();
        const assignmentsWithDetails = assignments.map((assignment) => {
            const employee = assignment.employee;
            const department = assignment.department;
            const assignedByEmployee = assignment.assignedBy;
            const project = assignment.project;
            const wbsItem = assignment.wbsItem;
            return {
                id: assignment.id,
                periodId: assignment.periodId,
                employeeId: assignment.employeeId,
                employeeName: employee?.name || '',
                departmentName: department?.name || '',
                projectId: assignment.projectId,
                projectName: project?.name || '',
                wbsItemId: assignment.wbsItemId,
                wbsItemTitle: wbsItem?.title || '',
                wbsItemCode: wbsItem?.code || '',
                assignedDate: assignment.assignedDate,
                assignedBy: assignment.assignedBy,
                assignedByName: assignedByEmployee?.name || '',
                displayOrder: assignment.displayOrder,
            };
        });
        return {
            assignments: assignmentsWithDetails,
            totalCount,
            page: currentPage,
            limit: currentLimit,
        };
    }
    createQueryBuilder(filter, orderBy, orderDirection) {
        const queryBuilder = this.wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .where('assignment.deletedAt IS NULL');
        if (filter.periodId) {
            queryBuilder.andWhere('assignment.periodId = :periodId', {
                periodId: filter.periodId,
            });
        }
        if (filter.employeeId) {
            queryBuilder.andWhere('assignment.employeeId = :employeeId', {
                employeeId: filter.employeeId,
            });
        }
        if (filter.projectId) {
            queryBuilder.andWhere('assignment.projectId = :projectId', {
                projectId: filter.projectId,
            });
        }
        if (filter.wbsItemId) {
            queryBuilder.andWhere('assignment.wbsItemId = :wbsItemId', {
                wbsItemId: filter.wbsItemId,
            });
        }
        if (filter.assignedBy) {
            queryBuilder.andWhere('assignment.assignedBy = :assignedBy', {
                assignedBy: filter.assignedBy,
            });
        }
        if (filter.assignedDateFrom) {
            queryBuilder.andWhere('assignment.assignedDate >= :assignedDateFrom', {
                assignedDateFrom: filter.assignedDateFrom,
            });
        }
        if (filter.assignedDateTo) {
            queryBuilder.andWhere('assignment.assignedDate <= :assignedDateTo', {
                assignedDateTo: filter.assignedDateTo,
            });
        }
        const sortBy = orderBy || 'assignedDate';
        const sortDirection = orderDirection || 'DESC';
        queryBuilder.orderBy(`assignment.${sortBy}`, sortDirection);
        return queryBuilder;
    }
};
exports.GetWbsAssignmentListHandler = GetWbsAssignmentListHandler;
exports.GetWbsAssignmentListHandler = GetWbsAssignmentListHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetWbsAssignmentListQuery),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetWbsAssignmentListHandler);
//# sourceMappingURL=get-wbs-assignment-list.handler.js.map