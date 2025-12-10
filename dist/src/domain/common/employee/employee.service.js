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
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("./employee.entity");
let EmployeeService = class EmployeeService {
    employeeRepository;
    constructor(employeeRepository) {
        this.employeeRepository = employeeRepository;
    }
    async ID로_조회한다(id) {
        const employee = await this.employeeRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return employee ? employee.DTO로_변환한다() : null;
    }
    async 직원번호로_조회한다(employeeNumber) {
        const employee = await this.employeeRepository.findOne({
            where: { employeeNumber, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return employee ? employee.DTO로_변환한다() : null;
    }
    async 이메일로_조회한다(email) {
        const employee = await this.employeeRepository.findOne({
            where: { email, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return employee ? employee.DTO로_변환한다() : null;
    }
    async 필터_조회한다(filter) {
        const queryBuilder = this.employeeRepository.createQueryBuilder('employee');
        queryBuilder.where('employee.deletedAt IS NULL');
        if (filter.departmentId) {
            queryBuilder.andWhere('employee.departmentId = :departmentId', {
                departmentId: filter.departmentId,
            });
        }
        if (filter.positionId) {
            queryBuilder.andWhere('employee.positionId = :positionId', {
                positionId: filter.positionId,
            });
        }
        if (filter.rankId) {
            queryBuilder.andWhere('employee.rankId = :rankId', {
                rankId: filter.rankId,
            });
        }
        if (filter.status) {
            queryBuilder.andWhere('employee.status = :status', {
                status: filter.status,
            });
        }
        if (filter.gender) {
            queryBuilder.andWhere('employee.gender = :gender', {
                gender: filter.gender,
            });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('employee.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.includeExcluded !== true) {
            queryBuilder.andWhere('employee.isExcludedFromList = :isExcluded', {
                isExcluded: false,
            });
        }
        const employees = await queryBuilder.getMany();
        return employees.map((employee) => employee.DTO로_변환한다());
    }
    async 목록_조회한다(options = {}) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', filter = {}, } = options;
        const queryBuilder = this.employeeRepository.createQueryBuilder('employee');
        queryBuilder.where('employee.deletedAt IS NULL');
        if (filter.departmentId) {
            queryBuilder.andWhere('employee.departmentId = :departmentId', {
                departmentId: filter.departmentId,
            });
        }
        if (filter.positionId) {
            queryBuilder.andWhere('employee.positionId = :positionId', {
                positionId: filter.positionId,
            });
        }
        if (filter.rankId) {
            queryBuilder.andWhere('employee.rankId = :rankId', {
                rankId: filter.rankId,
            });
        }
        if (filter.status) {
            queryBuilder.andWhere('employee.status = :status', {
                status: filter.status,
            });
        }
        if (filter.gender) {
            queryBuilder.andWhere('employee.gender = :gender', {
                gender: filter.gender,
            });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('employee.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.includeExcluded !== true) {
            queryBuilder.andWhere('employee.isExcludedFromList = :isExcluded', {
                isExcluded: false,
            });
        }
        queryBuilder.orderBy(`employee.${sortBy}`, sortOrder);
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        const [employees, total] = await queryBuilder.getManyAndCount();
        return {
            employees: employees.map((employee) => employee.DTO로_변환한다()),
            total,
            page,
            limit,
        };
    }
    async 전체_조회한다(includeExcluded = false) {
        const where = { deletedAt: (0, typeorm_2.IsNull)() };
        if (!includeExcluded) {
            where.isExcludedFromList = false;
        }
        const employees = await this.employeeRepository.find({
            where,
            order: { name: 'ASC' },
        });
        return employees.map((employee) => employee.DTO로_변환한다());
    }
    async 부서별_조회한다(departmentId, includeExcluded = false) {
        const where = { departmentId, deletedAt: (0, typeorm_2.IsNull)() };
        if (!includeExcluded) {
            where.isExcludedFromList = false;
        }
        const employees = await this.employeeRepository.find({
            where,
            order: { name: 'ASC' },
        });
        return employees.map((employee) => employee.DTO로_변환한다());
    }
    async 매니저별_조회한다(managerId, includeExcluded = false) {
        const where = { managerId, deletedAt: (0, typeorm_2.IsNull)() };
        if (!includeExcluded) {
            where.isExcludedFromList = false;
        }
        const employees = await this.employeeRepository.find({
            where,
            order: { name: 'ASC' },
        });
        return employees.map((employee) => employee.DTO로_변환한다());
    }
    async 재직중_조회한다(includeExcluded = false) {
        const where = { status: '재직중', deletedAt: (0, typeorm_2.IsNull)() };
        if (!includeExcluded) {
            where.isExcludedFromList = false;
        }
        const employees = await this.employeeRepository.find({
            where,
            order: { name: 'ASC' },
        });
        return employees.map((employee) => employee.DTO로_변환한다());
    }
    async 존재하는가(id) {
        const count = await this.employeeRepository.count({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 직원번호가_존재하는가(employeeNumber) {
        const count = await this.employeeRepository.count({
            where: { employeeNumber, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 이메일이_존재하는가(email) {
        const count = await this.employeeRepository.count({
            where: { email, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 조회에서_제외한다(id, excludeReason, excludedBy) {
        const employee = await this.employeeRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!employee) {
            return null;
        }
        employee.isExcludedFromList = true;
        employee.excludeReason = excludeReason;
        employee.excludedBy = excludedBy;
        employee.excludedAt = new Date();
        employee.updatedBy = excludedBy;
        const updated = await this.employeeRepository.save(employee);
        return updated.DTO로_변환한다();
    }
    async 조회에_포함한다(id, updatedBy) {
        const employee = await this.employeeRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!employee) {
            return null;
        }
        employee.isExcludedFromList = false;
        employee.excludeReason = null;
        employee.excludedBy = null;
        employee.excludedAt = null;
        employee.updatedBy = updatedBy;
        const updated = await this.employeeRepository.save(employee);
        return updated.DTO로_변환한다();
    }
    async 조회에서_제외되었는가(id) {
        const employee = await this.employeeRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return employee ? employee.isExcludedFromList : false;
    }
    async 사번으로_관리자권한있는가(employeeNumber) {
        const employee = await this.employeeRepository.findOne({
            where: { employeeNumber, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return employee ? employee.isAccessible : false;
    }
    async 관리자권한있는가(id) {
        const employee = await this.employeeRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return employee ? employee.isAccessible : false;
    }
    async 관리자권한변경한다(id, isAdmin, updatedBy) {
        const employee = await this.employeeRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!employee) {
            return null;
        }
        employee.isAccessible = isAdmin;
        employee.updatedBy = updatedBy;
        const updated = await this.employeeRepository.save(employee);
        return updated.DTO로_변환한다();
    }
    async 여러직원관리자권한변경한다(ids, isAdmin, updatedBy) {
        const result = {
            totalProcessed: ids.length,
            succeeded: 0,
            failed: 0,
            failedIds: [],
            errors: [],
        };
        for (const id of ids) {
            try {
                const employee = await this.employeeRepository.findOne({
                    where: { id, deletedAt: (0, typeorm_2.IsNull)() },
                });
                if (!employee) {
                    result.failed++;
                    result.failedIds.push(id);
                    result.errors.push(`직원을 찾을 수 없습니다: ${id}`);
                    continue;
                }
                employee.isAccessible = isAdmin;
                employee.updatedBy = updatedBy;
                await this.employeeRepository.save(employee);
                result.succeeded++;
            }
            catch (error) {
                result.failed++;
                result.failedIds.push(id);
                result.errors.push(`직원 ${id} 처리 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return result;
    }
    async findById(id) {
        return this.employeeRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async findByEmployeeNumber(employeeNumber) {
        return this.employeeRepository
            .createQueryBuilder('employee')
            .where('employee.employeeNumber = :employeeNumber', { employeeNumber })
            .andWhere('employee.deletedAt IS NULL')
            .getOne();
    }
    async create(data) {
        const employee = this.employeeRepository.create(data);
        return this.employeeRepository.save(employee);
    }
    async update(id, data) {
        const employee = await this.findById(id);
        if (!employee) {
            return null;
        }
        Object.assign(employee, data);
        return this.employeeRepository.save(employee);
    }
    async updateRoles(id, roles) {
        const employee = await this.employeeRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!employee) {
            return null;
        }
        employee.roles = roles;
        return this.employeeRepository.save(employee);
    }
    async findByExternalId(externalId) {
        return this.employeeRepository.findOne({
            where: { externalId },
        });
    }
    async findAll(includeExcluded = false) {
        const where = {};
        if (!includeExcluded) {
            where.isExcludedFromList = false;
        }
        return this.employeeRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }
    async findByFilter(filter) {
        const queryBuilder = this.employeeRepository.createQueryBuilder('employee');
        if (filter.departmentId) {
            queryBuilder.andWhere('employee.departmentId = :departmentId', {
                departmentId: filter.departmentId,
            });
        }
        if (filter.positionId) {
            queryBuilder.andWhere('employee.positionId = :positionId', {
                positionId: filter.positionId,
            });
        }
        if (filter.rankId) {
            queryBuilder.andWhere('employee.rankId = :rankId', {
                rankId: filter.rankId,
            });
        }
        if (filter.status) {
            queryBuilder.andWhere('employee.status = :status', {
                status: filter.status,
            });
        }
        if (filter.gender) {
            queryBuilder.andWhere('employee.gender = :gender', {
                gender: filter.gender,
            });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('employee.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.includeExcluded !== true) {
            queryBuilder.andWhere('employee.isExcludedFromList = :isExcluded', {
                isExcluded: false,
            });
        }
        return queryBuilder.orderBy('employee.name', 'ASC').getMany();
    }
    async save(employee) {
        return this.employeeRepository.save(employee);
    }
    async saveMany(employees) {
        return this.employeeRepository.save(employees);
    }
    async findByEmail(email) {
        return this.employeeRepository.findOne({
            where: { email },
        });
    }
    async findByDepartmentId(departmentId) {
        return this.employeeRepository.find({
            where: { departmentId },
            order: { name: 'ASC' },
        });
    }
    async findByStatus(status, options = {}) {
        const { includeExcluded = false } = options;
        const where = {
            status,
            deletedAt: (0, typeorm_2.IsNull)(),
        };
        if (!includeExcluded) {
            where.isExcludedFromList = false;
        }
        return this.employeeRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }
    async findByGender(gender) {
        return this.employeeRepository.find({
            where: { gender },
            order: { name: 'ASC' },
        });
    }
    async findByPositionId(positionId) {
        return this.employeeRepository.find({
            where: { positionId },
            order: { name: 'ASC' },
        });
    }
    async findByRankId(rankId) {
        return this.employeeRepository.find({
            where: { rankId },
            order: { name: 'ASC' },
        });
    }
    async findActiveEmployees() {
        return this.employeeRepository.find({
            where: { status: '재직중' },
            order: { name: 'ASC' },
        });
    }
    async searchByName(searchTerm) {
        return this.employeeRepository
            .createQueryBuilder('employee')
            .where('employee.name ILIKE :searchTerm', {
            searchTerm: `%${searchTerm}%`,
        })
            .orderBy('employee.name', 'ASC')
            .getMany();
    }
    async getEmployeeStats() {
        const [totalEmployees, activeEmployees, onLeaveEmployees, resignedEmployees,] = await Promise.all([
            this.employeeRepository.count(),
            this.employeeRepository.count({ where: { status: '재직중' } }),
            this.employeeRepository.count({ where: { status: '휴직중' } }),
            this.employeeRepository.count({ where: { status: '퇴사' } }),
        ]);
        const departmentStats = await this.employeeRepository
            .createQueryBuilder('employee')
            .select('employee.departmentId', 'departmentId')
            .addSelect('COUNT(*)', 'count')
            .where('employee.departmentId IS NOT NULL')
            .groupBy('employee.departmentId')
            .getRawMany();
        const positionStats = await this.employeeRepository
            .createQueryBuilder('employee')
            .select('employee.positionId', 'positionId')
            .addSelect('COUNT(*)', 'count')
            .where('employee.positionId IS NOT NULL')
            .groupBy('employee.positionId')
            .getRawMany();
        const rankStats = await this.employeeRepository
            .createQueryBuilder('employee')
            .select('employee.rankId', 'rankId')
            .addSelect('COUNT(*)', 'count')
            .where('employee.rankId IS NOT NULL')
            .groupBy('employee.rankId')
            .getRawMany();
        const genderStats = await this.employeeRepository
            .createQueryBuilder('employee')
            .select('employee.gender', 'gender')
            .addSelect('COUNT(*)', 'count')
            .where('employee.gender IS NOT NULL')
            .groupBy('employee.gender')
            .getRawMany();
        const statusStats = await this.employeeRepository
            .createQueryBuilder('employee')
            .select('employee.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('employee.status')
            .getRawMany();
        const lastSyncResult = await this.employeeRepository
            .createQueryBuilder('employee')
            .select('MAX(employee.lastSyncAt)', 'lastSyncAt')
            .getRawOne();
        return {
            totalEmployees,
            activeEmployees,
            onLeaveEmployees,
            resignedEmployees,
            employeesByDepartment: departmentStats.reduce((acc, stat) => {
                acc[stat.departmentId] = parseInt(stat.count);
                return acc;
            }, {}),
            employeesByPosition: positionStats.reduce((acc, stat) => {
                acc[stat.positionId] = parseInt(stat.count);
                return acc;
            }, {}),
            employeesByRank: rankStats.reduce((acc, stat) => {
                acc[stat.rankId] = parseInt(stat.count);
                return acc;
            }, {}),
            employeesByGender: genderStats.reduce((acc, stat) => {
                acc[stat.gender] = parseInt(stat.count);
                return acc;
            }, {}),
            employeesByStatus: statusStats.reduce((acc, stat) => {
                acc[stat.status] = parseInt(stat.count);
                return acc;
            }, {}),
            lastSyncAt: lastSyncResult.lastSyncAt
                ? new Date(lastSyncResult.lastSyncAt)
                : undefined,
        };
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EmployeeService);
//# sourceMappingURL=employee.service.js.map