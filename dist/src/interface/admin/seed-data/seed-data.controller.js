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
var SeedDataController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedDataController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../../common/decorators");
const seed_data_service_1 = require("../../../context/seed-data-context/seed-data.service");
const seed_data_1 = require("../../common/dto/seed-data");
const clear_seed_data_decorator_1 = require("../../common/decorators/seed-data/clear-seed-data.decorator");
const generate_seed_data_decorator_1 = require("../../common/decorators/seed-data/generate-seed-data.decorator");
const generate_seed_data_with_real_data_decorator_1 = require("../../common/decorators/seed-data/generate-seed-data-with-real-data.decorator");
const get_seed_data_status_decorator_1 = require("../../common/decorators/seed-data/get-seed-data-status.decorator");
const add_new_employees_decorator_1 = require("../../common/decorators/seed-data/add-new-employees.decorator");
const remove_all_new_employees_decorator_1 = require("../../common/decorators/seed-data/remove-all-new-employees.decorator");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
const department_service_1 = require("../../../domain/common/department/department.service");
const employee_entity_1 = require("../../../domain/common/employee/employee.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const ko_1 = require("@faker-js/faker/locale/ko");
let SeedDataController = SeedDataController_1 = class SeedDataController {
    seedDataService;
    employeeService;
    departmentService;
    employeeRepository;
    logger = new common_1.Logger(SeedDataController_1.name);
    constructor(seedDataService, employeeService, departmentService, employeeRepository) {
        this.seedDataService = seedDataService;
        this.employeeService = employeeService;
        this.departmentService = departmentService;
        this.employeeRepository = employeeRepository;
    }
    async generateSeedData(config, req) {
        const startTime = Date.now();
        const configWithUser = {
            ...config,
            currentUserId: config.includeCurrentUserAsEvaluator
                ? req.user?.id
                : undefined,
        };
        const results = await this.seedDataService.시드_데이터를_생성한다(configWithUser);
        const totalDuration = Date.now() - startTime;
        return {
            success: true,
            message: '시드 데이터가 성공적으로 생성되었습니다.',
            results,
            totalDuration,
        };
    }
    async generateSeedDataWithRealData(config, req) {
        const startTime = Date.now();
        const seedConfig = {
            scenario: config.scenario,
            clearExisting: config.clearExisting ?? false,
            dataScale: {
                departmentCount: 0,
                employeeCount: 0,
                projectCount: config.projectCount ?? 5,
                wbsPerProject: config.wbsPerProject ?? 10,
            },
            evaluationConfig: {
                periodCount: config.evaluationConfig?.periodCount ?? 1,
            },
            stateDistribution: config.stateDistribution,
            useRealDepartments: true,
            useRealEmployees: true,
            currentUserId: config.includeCurrentUserAsEvaluator
                ? req.user?.id
                : undefined,
        };
        if (config.stateDistribution) {
            console.log('[Controller] stateDistribution.selfEvaluationProgress:', JSON.stringify(config.stateDistribution.selfEvaluationProgress));
        }
        if (config.includeCurrentUserAsEvaluator) {
            console.log('[Controller] 현재 사용자를 평가자로 등록:', req.user?.id);
        }
        const results = await this.seedDataService.시드_데이터를_생성한다(seedConfig);
        const totalDuration = Date.now() - startTime;
        return {
            success: true,
            message: '실제 데이터 기반 시드 데이터가 성공적으로 생성되었습니다.',
            results,
            totalDuration,
        };
    }
    async clearSeedData() {
        await this.seedDataService.시드_데이터를_삭제한다(true);
        return {
            message: '시드 데이터가 성공적으로 삭제되었습니다.',
        };
    }
    async getSeedDataStatus() {
        const status = await this.seedDataService.시드_데이터_상태를_조회한다();
        return status;
    }
    async addNewEmployees(dto) {
        this.logger.log(`신규 입사자 자동 생성 요청 - 직원 수: ${dto.count}명`);
        const addedEmployeeIds = [];
        const errors = [];
        const timestamp = Date.now();
        const departmentNames = [
            '경영지원실',
            '사업개발실',
            'PM실',
            '시스템파트',
            'ES파트',
            '전력파트',
            '전자1파트',
            '전자2파트',
            'RF파트',
            '기구파트',
            'Web파트',
            '지상운용파트',
            '영상분석파트',
            '제조파트',
            'QA파트',
        ];
        const ranks = [
            { name: '제조원', code: '제조원', level: 9 },
            { name: '연구원', code: '연구원', level: 9 },
            { name: '매니저', code: '매니저', level: 9 },
            { name: '선임매니저', code: '선임매니저', level: 8 },
            { name: '선임제조원', code: '선임제조원', level: 8 },
            { name: '선임연구원', code: '선임연구원', level: 8 },
            { name: '책임연구원', code: '책임연구원', level: 7 },
            { name: '책임매니저', code: '책임매니저', level: 7 },
            { name: '책임제조원', code: '책임제조원', level: 7 },
            { name: '전문위원', code: '전문위원', level: 6 },
            { name: '이사', code: '이사', level: 5 },
            { name: '상무이사', code: '상무이사', level: 4 },
            { name: '전무이사', code: '전무이사', level: 3 },
            { name: '부사장', code: '부사장', level: 2 },
            { name: '사장', code: '사장', level: 1 },
        ];
        const positions = [
            { title: '임원', code: '임원', level: 1 },
            { title: '실장', code: '실장', level: 2 },
            { title: 'PM', code: 'PM', level: 3 },
            { title: '팀장', code: '팀장', level: 4 },
            { title: '파트장', code: '파트장', level: 5 },
            { title: '직원', code: '직원', level: 6 },
        ];
        for (let i = 0; i < dto.count; i++) {
            try {
                const employeeNumber = `NEW${timestamp}${String(i + 1).padStart(3, '0')}`;
                const lastName = ko_1.faker.person.lastName();
                const firstName = ko_1.faker.person.firstName();
                const name = `${lastName}${firstName}`;
                const email = `emp${timestamp}${String(i + 1).padStart(3, '0')}@company.com`;
                const phoneNumber = '010' + '-' + ko_1.faker.string.numeric(4) + '-' + ko_1.faker.string.numeric(4);
                const dateOfBirth = ko_1.faker.date.birthdate({
                    min: 25,
                    max: 55,
                    mode: 'age',
                });
                const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
                const hireDate = new Date();
                hireDate.setDate(hireDate.getDate() - Math.floor(Math.random() * 365));
                const selectedDepartmentName = departmentNames[Math.floor(Math.random() * departmentNames.length)];
                let department = null;
                try {
                    department = await this.departmentService.부서명으로_조회한다(selectedDepartmentName);
                }
                catch (error) {
                    this.logger.warn(`부서 조회 실패 (${selectedDepartmentName}): ${error.message}`);
                }
                const isHighRank = Math.random() > 0.8;
                const rank = isHighRank
                    ? ranks[Math.floor(Math.random() * Math.min(5, ranks.length))]
                    : ranks[Math.floor(Math.random() * 9) + 6];
                const positionRoll = Math.random();
                const position = positionRoll > 0.95
                    ? positions[Math.floor(Math.random() * 3)]
                    : positionRoll > 0.8
                        ? positions[Math.floor(Math.random() * 2) + 3]
                        : positions[5];
                const externalId = (0, uuid_1.v4)();
                const now = new Date();
                const newEmployee = await this.employeeService.create({
                    employeeNumber,
                    name,
                    email,
                    phoneNumber,
                    dateOfBirth,
                    gender,
                    hireDate,
                    status: '재직중',
                    departmentId: department?.id ?? undefined,
                    departmentName: department?.name || selectedDepartmentName,
                    departmentCode: department?.code ?? undefined,
                    rankName: rank.name,
                    rankCode: rank.code,
                    rankLevel: rank.level,
                    positionId: undefined,
                    externalId,
                    externalCreatedAt: now,
                    externalUpdatedAt: now,
                    lastSyncAt: now,
                    isExcludedFromList: false,
                    createdBy: 'system',
                });
                addedEmployeeIds.push(newEmployee.id);
                this.logger.log(`신규 입사자 추가 완료 [${i + 1}/${dto.count}] - ${newEmployee.name} (${newEmployee.employeeNumber})`);
            }
            catch (error) {
                const errorMsg = `직원 추가 실패 [${i + 1}/${dto.count}]: ${error.message}`;
                this.logger.error(errorMsg, error.stack);
                errors.push(errorMsg);
            }
        }
        const addedCount = addedEmployeeIds.length;
        const failedCount = errors.length;
        if (addedCount === 0 && failedCount > 0) {
            throw new common_1.InternalServerErrorException({
                success: false,
                message: '모든 신규 입사자 추가에 실패했습니다.',
                addedCount: 0,
                failedCount,
                errors,
                addedEmployeeIds: [],
            });
        }
        const message = failedCount > 0
            ? `신규 입사자 ${addedCount}명이 추가되었습니다. (실패: ${failedCount}명)`
            : `신규 입사자 ${addedCount}명이 성공적으로 추가되었습니다.`;
        this.logger.log(`신규 입사자 추가 완료 - 성공: ${addedCount}명, 실패: ${failedCount}명`);
        return {
            success: true,
            message,
            addedCount,
            failedCount,
            batchNumber: `NEW${timestamp}`,
            errors: errors.length > 0 ? errors : undefined,
            addedEmployeeIds,
        };
    }
    async removeAllNewEmployees() {
        this.logger.log('모든 배치 신규 입사자 삭제 요청');
        const targetEmployees = await this.employeeRepository
            .createQueryBuilder('employee')
            .where('employee.employeeNumber LIKE :pattern', {
            pattern: 'NEW%',
        })
            .getMany();
        if (targetEmployees.length === 0) {
            throw new common_1.NotFoundException('삭제할 신규 입사자를 찾을 수 없습니다.');
        }
        this.logger.log(`삭제 대상 직원: ${targetEmployees.length}명`);
        const removedEmployees = [];
        const employeeIds = targetEmployees.map((emp) => emp.id);
        try {
            await this.employeeRepository.delete(employeeIds);
            for (const emp of targetEmployees) {
                removedEmployees.push(`${emp.name} (${emp.employeeNumber})`);
                this.logger.log(`직원 삭제 완료 - ${emp.name} (${emp.employeeNumber})`);
            }
        }
        catch (error) {
            this.logger.error(`직원 삭제 실패: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(`직원 삭제 중 오류가 발생했습니다: ${error.message}`);
        }
        const message = `모든 신규 입사자 ${removedEmployees.length}명이 성공적으로 삭제되었습니다.`;
        this.logger.log(`모든 신규 입사자 삭제 완료 - 삭제: ${removedEmployees.length}명`);
        return {
            success: true,
            message,
            removedCount: removedEmployees.length,
            removedEmployees,
        };
    }
};
exports.SeedDataController = SeedDataController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, generate_seed_data_decorator_1.ApiGenerateSeedData)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [seed_data_1.SeedDataConfigDto, Object]),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "generateSeedData", null);
__decorate([
    (0, common_1.Post)('generate-with-real-data'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, generate_seed_data_with_real_data_decorator_1.ApiGenerateSeedDataWithRealData)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [seed_data_1.RealDataSeedConfigDto, Object]),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "generateSeedDataWithRealData", null);
__decorate([
    (0, common_1.Delete)('clear'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, clear_seed_data_decorator_1.ApiClearSeedData)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "clearSeedData", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, get_seed_data_status_decorator_1.ApiGetSeedDataStatus)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "getSeedDataStatus", null);
__decorate([
    (0, common_1.Post)('employees'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, add_new_employees_decorator_1.ApiAddNewEmployees)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [seed_data_1.AddNewEmployeesDto]),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "addNewEmployees", null);
__decorate([
    (0, common_1.Delete)('employees/all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, remove_all_new_employees_decorator_1.ApiRemoveAllNewEmployees)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedDataController.prototype, "removeAllNewEmployees", null);
exports.SeedDataController = SeedDataController = SeedDataController_1 = __decorate([
    (0, swagger_1.ApiTags)('A-0-1. Seed Data'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/seed'),
    __param(3, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [seed_data_service_1.SeedDataService,
        employee_service_1.EmployeeService,
        department_service_1.DepartmentService,
        typeorm_2.Repository])
], SeedDataController);
//# sourceMappingURL=seed-data.controller.js.map