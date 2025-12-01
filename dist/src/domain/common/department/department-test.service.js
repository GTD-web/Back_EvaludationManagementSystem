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
exports.DepartmentTestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_entity_1 = require("./department.entity");
let DepartmentTestService = class DepartmentTestService {
    departmentRepository;
    constructor(departmentRepository) {
        this.departmentRepository = departmentRepository;
    }
    async 테스트용_목데이터를_생성한다() {
        await this.테스트_데이터를_정리한다();
        const testDepartments = [
            {
                name: '루미르 주식회사',
                code: '루미르',
                order: 0,
                externalId: 'test-dept-001',
                externalCreatedAt: new Date(),
                externalUpdatedAt: new Date(),
            },
            {
                name: '개발본부',
                code: '개발본부',
                order: 1,
                parentDepartmentId: 'test-dept-001',
                externalId: 'test-dept-002',
                externalCreatedAt: new Date(),
                externalUpdatedAt: new Date(),
            },
            {
                name: '개발팀',
                code: '개발팀',
                order: 2,
                parentDepartmentId: 'test-dept-002',
                externalId: 'test-dept-003',
                externalCreatedAt: new Date(),
                externalUpdatedAt: new Date(),
            },
        ];
        const departments = testDepartments.map((dept) => {
            const department = new department_entity_1.Department(dept.name, dept.code, dept.externalId, dept.order, undefined, dept.parentDepartmentId, dept.externalCreatedAt, dept.externalUpdatedAt);
            department.createdBy = 'TEST_SYSTEM';
            department.updatedBy = 'TEST_SYSTEM';
            return department;
        });
        const savedDepartments = await this.departmentRepository.save(departments);
        console.log(`부서 생성 완료: ${savedDepartments.length}개`);
        return savedDepartments.map((department) => department.DTO로_변환한다());
    }
    async 테스트_데이터를_정리한다() {
        return await this.모든_테스트데이터를_삭제한다();
    }
    async 모든_테스트데이터를_삭제한다() {
        const result = await this.departmentRepository
            .createQueryBuilder()
            .delete()
            .execute();
        return result.affected || 0;
    }
};
exports.DepartmentTestService = DepartmentTestService;
exports.DepartmentTestService = DepartmentTestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DepartmentTestService);
//# sourceMappingURL=department-test.service.js.map