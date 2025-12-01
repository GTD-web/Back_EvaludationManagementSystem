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
exports.EmployeeTestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_entity_1 = require("./employee.entity");
const department_entity_1 = require("../department/department.entity");
let EmployeeTestService = class EmployeeTestService {
    employeeRepository;
    departmentRepository;
    constructor(employeeRepository, departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }
    async 직원_데이터를_확인하고_생성한다(minCount = 5) {
        const existingEmployees = await this.employeeRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
            take: minCount,
        });
        if (existingEmployees.length >= minCount) {
            console.log(`기존 직원 데이터 사용: ${existingEmployees.length}명 (최소 필요: ${minCount}명)`);
            return existingEmployees.map((emp) => emp.DTO로_변환한다());
        }
        const neededCount = minCount - existingEmployees.length;
        console.log(`직원 데이터 부족: ${neededCount}명 추가 생성 필요`);
        const departments = await this.departmentRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
            take: 1,
        });
        const departmentId = departments.length > 0 ? departments[0].id : undefined;
        const newEmployees = [];
        const timestamp = Date.now().toString().slice(-6);
        for (let i = 0; i < neededCount; i++) {
            const employee = new employee_entity_1.Employee();
            employee.employeeNumber = `TEST${timestamp}${String(i + 1).padStart(3, '0')}`;
            employee.name = `테스트 직원 ${i + 1}`;
            employee.email = `test${i + 1}@test.com`;
            employee.phoneNumber = `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`;
            employee.dateOfBirth = new Date(1990, 0, 1);
            employee.gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
            employee.hireDate = new Date(2020, 0, 1);
            employee.status = '재직중';
            employee.isExcludedFromList = false;
            employee.departmentId = departmentId;
            employee.externalId = `test-emp-${timestamp}-${i + 1}`;
            employee.externalCreatedAt = new Date();
            employee.externalUpdatedAt = new Date();
            employee.createdBy = 'TEST_SYSTEM';
            employee.updatedBy = 'TEST_SYSTEM';
            newEmployees.push(employee);
        }
        const savedEmployees = await this.employeeRepository.save(newEmployees);
        console.log(`직원 생성 완료: ${savedEmployees.length}명`);
        const allEmployees = [...existingEmployees, ...savedEmployees];
        return allEmployees.map((emp) => emp.DTO로_변환한다());
    }
    async 테스트용_목데이터를_생성한다() {
        await this.테스트_데이터를_정리한다();
        const departments = await this.departmentRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
            take: 1,
        });
        const departmentId = departments.length > 0 ? departments[0].id : undefined;
        const testEmployees = [
            {
                employeeNumber: 'TEST001',
                name: '테스트 직원 1',
                email: 'test1@test.com',
                phoneNumber: '010-0001-0001',
                dateOfBirth: new Date(1990, 0, 1),
                gender: 'MALE',
                hireDate: new Date(2020, 0, 1),
                status: '재직중',
                isExcludedFromList: false,
                departmentId,
                externalId: 'test-emp-001',
            },
            {
                employeeNumber: 'TEST002',
                name: '테스트 직원 2',
                email: 'test2@test.com',
                phoneNumber: '010-0002-0002',
                dateOfBirth: new Date(1991, 0, 1),
                gender: 'FEMALE',
                hireDate: new Date(2020, 1, 1),
                status: '재직중',
                isExcludedFromList: false,
                departmentId,
                externalId: 'test-emp-002',
            },
            {
                employeeNumber: 'TEST003',
                name: '테스트 직원 3',
                email: 'test3@test.com',
                phoneNumber: '010-0003-0003',
                dateOfBirth: new Date(1992, 0, 1),
                gender: 'MALE',
                hireDate: new Date(2020, 2, 1),
                status: '재직중',
                isExcludedFromList: false,
                departmentId,
                externalId: 'test-emp-003',
            },
        ];
        const employees = testEmployees.map((emp) => {
            const employee = new employee_entity_1.Employee();
            Object.assign(employee, emp);
            employee.externalCreatedAt = new Date();
            employee.externalUpdatedAt = new Date();
            employee.createdBy = 'TEST_SYSTEM';
            employee.updatedBy = 'TEST_SYSTEM';
            return employee;
        });
        const savedEmployees = await this.employeeRepository.save(employees);
        return savedEmployees.map((emp) => emp.DTO로_변환한다());
    }
    async 현재_직원_수를_조회한다() {
        const count = await this.employeeRepository.count({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count;
    }
    async 부서별_직원_테스트데이터를_생성한다(departmentId, count = 5) {
        const employees = [];
        const timestamp = Date.now().toString().slice(-6);
        for (let i = 0; i < count; i++) {
            const employee = new employee_entity_1.Employee();
            employee.employeeNumber = `DEPT${timestamp}${String(i + 1).padStart(3, '0')}`;
            employee.name = `부서 직원 ${i + 1}`;
            employee.email = `dept${i + 1}@test.com`;
            employee.phoneNumber = `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`;
            employee.dateOfBirth = new Date(1990 + i, 0, 1);
            employee.gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
            employee.hireDate = new Date(2020, 0, 1);
            employee.status = '재직중';
            employee.isExcludedFromList = false;
            employee.departmentId = departmentId;
            employee.externalId = `test-dept-emp-${timestamp}-${i + 1}`;
            employee.externalCreatedAt = new Date();
            employee.externalUpdatedAt = new Date();
            employee.createdBy = 'TEST_SYSTEM';
            employee.updatedBy = 'TEST_SYSTEM';
            employees.push(employee);
        }
        const savedEmployees = await this.employeeRepository.save(employees);
        return savedEmployees.map((emp) => emp.DTO로_변환한다());
    }
    async 매니저_하위직원_테스트데이터를_생성한다(managerCount, employeesPerManager = 5) {
        if (typeof managerCount === 'number') {
            const managers = await this.employeeRepository.find({
                where: { deletedAt: (0, typeorm_2.IsNull)() },
                take: managerCount,
            });
            if (managers.length === 0) {
                throw new Error('매니저로 사용할 직원이 없습니다.');
            }
            const allEmployees = [];
            for (const manager of managers) {
                const subordinates = await this.매니저_하위직원_테스트데이터를_생성한다(manager.id, employeesPerManager);
                allEmployees.push(...subordinates.map((e) => e));
            }
            return allEmployees.map((emp) => emp.DTO로_변환한다());
        }
        const managerId = managerCount;
        const count = employeesPerManager;
        const manager = await this.employeeRepository.findOne({
            where: { id: managerId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!manager) {
            throw new Error(`매니저를 찾을 수 없습니다: ${managerId}`);
        }
        const employees = [];
        const timestamp = Date.now().toString().slice(-6);
        for (let i = 0; i < count; i++) {
            const employee = new employee_entity_1.Employee();
            employee.employeeNumber = `MGR${timestamp}${String(i + 1).padStart(3, '0')}`;
            employee.name = `하위 직원 ${i + 1}`;
            employee.email = `sub${i + 1}@test.com`;
            employee.phoneNumber = `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`;
            employee.dateOfBirth = new Date(1990 + i, 0, 1);
            employee.gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
            employee.hireDate = new Date(2020, 0, 1);
            employee.status = '재직중';
            employee.isExcludedFromList = false;
            employee.departmentId = manager.departmentId;
            employee.managerId = managerId;
            employee.externalId = `test-mgr-sub-${timestamp}-${i + 1}`;
            employee.externalCreatedAt = new Date();
            employee.externalUpdatedAt = new Date();
            employee.createdBy = 'TEST_SYSTEM';
            employee.updatedBy = 'TEST_SYSTEM';
            employees.push(employee);
        }
        const savedEmployees = await this.employeeRepository.save(employees);
        return savedEmployees.map((emp) => emp.DTO로_변환한다());
    }
    async 특정_직원_테스트데이터를_생성한다(employeeData) {
        const employee = new employee_entity_1.Employee();
        Object.assign(employee, {
            employeeNumber: employeeData.employeeNumber || 'TEST001',
            name: employeeData.name || '테스트 직원',
            email: employeeData.email || 'test@test.com',
            phoneNumber: employeeData.phoneNumber || '010-0000-0000',
            dateOfBirth: employeeData.dateOfBirth || new Date(1990, 0, 1),
            gender: employeeData.gender || 'MALE',
            hireDate: employeeData.hireDate || new Date(2020, 0, 1),
            status: employeeData.status || '재직중',
            isExcludedFromList: employeeData.isExcludedFromList || false,
            departmentId: employeeData.departmentId,
            managerId: employeeData.managerId,
            externalId: employeeData.externalId || `test-emp-${Date.now()}`,
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
            createdBy: 'TEST_SYSTEM',
            updatedBy: 'TEST_SYSTEM',
        });
        const savedEmployee = await this.employeeRepository.save(employee);
        return savedEmployee.DTO로_변환한다();
    }
    async 랜덤_테스트데이터를_생성한다(count = 10) {
        const departments = await this.departmentRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
        });
        const employees = [];
        const timestamp = Date.now().toString().slice(-6);
        for (let i = 0; i < count; i++) {
            const employee = new employee_entity_1.Employee();
            employee.employeeNumber = `RAND${timestamp}${String(i + 1).padStart(3, '0')}`;
            employee.name = `랜덤 직원 ${i + 1}`;
            employee.email = `random${i + 1}@test.com`;
            employee.phoneNumber = `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`;
            employee.dateOfBirth = new Date(1990 + (i % 20), i % 12, (i % 28) + 1);
            employee.gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
            employee.hireDate = new Date(2020 + (i % 3), i % 12, (i % 28) + 1);
            employee.status = ['재직중', '휴직중', '퇴사'][i % 3];
            employee.isExcludedFromList = i % 10 === 0;
            employee.departmentId =
                departments.length > 0
                    ? departments[i % departments.length].id
                    : undefined;
            employee.externalId = `test-random-${timestamp}-${i + 1}`;
            employee.externalCreatedAt = new Date();
            employee.externalUpdatedAt = new Date();
            employee.createdBy = 'TEST_SYSTEM';
            employee.updatedBy = 'TEST_SYSTEM';
            employees.push(employee);
        }
        const savedEmployees = await this.employeeRepository.save(employees);
        return savedEmployees.map((emp) => emp.DTO로_변환한다());
    }
    async 테스트_데이터를_정리한다() {
        return await this.모든_테스트데이터를_삭제한다();
    }
    async 모든_테스트데이터를_삭제한다() {
        const result = await this.employeeRepository
            .createQueryBuilder()
            .delete()
            .execute();
        return result.affected || 0;
    }
};
exports.EmployeeTestService = EmployeeTestService;
exports.EmployeeTestService = EmployeeTestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(1, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EmployeeTestService);
//# sourceMappingURL=employee-test.service.js.map