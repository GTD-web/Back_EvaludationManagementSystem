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
var Phase1OrganizationGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Phase1OrganizationGenerator = void 0;
const department_entity_1 = require("../../../domain/common/department/department.entity");
const department_service_1 = require("../../../domain/common/department/department.service");
const organization_management_context_1 = require("../../organization-management-context");
const employee_entity_1 = require("../../../domain/common/employee/employee.entity");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
const employee_sync_service_1 = require("../../organization-management-context/employee-sync.service");
const project_entity_1 = require("../../../domain/common/project/project.entity");
const project_types_1 = require("../../../domain/common/project/project.types");
const wbs_item_entity_1 = require("../../../domain/common/wbs-item/wbs-item.entity");
const wbs_item_types_1 = require("../../../domain/common/wbs-item/wbs-item.types");
const faker_1 = require("@faker-js/faker");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const types_1 = require("../types");
const utils_1 = require("../utils");
const BATCH_SIZE = 500;
let Phase1OrganizationGenerator = Phase1OrganizationGenerator_1 = class Phase1OrganizationGenerator {
    departmentRepository;
    employeeRepository;
    projectRepository;
    wbsItemRepository;
    departmentService;
    employeeService;
    departmentSyncService;
    employeeSyncService;
    logger = new common_1.Logger(Phase1OrganizationGenerator_1.name);
    constructor(departmentRepository, employeeRepository, projectRepository, wbsItemRepository, departmentService, employeeService, departmentSyncService, employeeSyncService) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.projectRepository = projectRepository;
        this.wbsItemRepository = wbsItemRepository;
        this.departmentService = departmentService;
        this.employeeService = employeeService;
        this.departmentSyncService = departmentSyncService;
        this.employeeSyncService = employeeSyncService;
    }
    async generate(config) {
        const startTime = Date.now();
        const dist = {
            ...types_1.DEFAULT_STATE_DISTRIBUTION,
            ...config.stateDistribution,
        };
        this.logger.log('Phase 1 시작: 조직 데이터 생성');
        this.logger.log(`Phase 1 설정: useRealDepartments=${config.useRealDepartments}, useRealEmployees=${config.useRealEmployees}, departmentCount=${config.dataScale.departmentCount}, employeeCount=${config.dataScale.employeeCount}`);
        let departmentIds;
        if (config.useRealDepartments) {
            departmentIds = await this.조회_실제_Department들();
            this.logger.log(`실제 부서 사용: Department ${departmentIds.length}개`);
        }
        else {
            departmentIds = await this.생성_Department들(config.dataScale.departmentCount, dist);
            this.logger.log(`생성 완료: Department ${departmentIds.length}개`);
        }
        if (departmentIds.length === 0) {
            this.logger.warn('부서가 없어 기본 부서 1개를 생성합니다.');
            departmentIds = await this.생성_Department들(1, dist);
        }
        const allDepartments = await this.departmentService.findAll();
        let employeeIds;
        if (config.useRealEmployees) {
            employeeIds = await this.조회_실제_Employee들();
            this.logger.log(`실제 직원 사용: Employee ${employeeIds.length}개`);
        }
        else {
            employeeIds = await this.생성_Employee들(config.dataScale.employeeCount, allDepartments, dist, config.clearExisting);
            this.logger.log(`생성 완료: Employee ${employeeIds.length}개`);
        }
        if (employeeIds.length === 0) {
            this.logger.warn('직원이 없어 기본 직원 1명을 생성합니다.');
            employeeIds = await this.생성_Employee들(1, allDepartments, dist, true);
        }
        const systemAdminId = employeeIds[0];
        if (!config.useRealDepartments) {
            await this.업데이트_Department_생성자(departmentIds, systemAdminId);
            this.logger.log(`Department createdBy 업데이트 완료`);
        }
        if (!config.useRealEmployees) {
            await this.업데이트_Employee_생성자(employeeIds, systemAdminId);
            this.logger.log(`Employee createdBy/excludedBy 업데이트 완료`);
        }
        this.logger.log(`🔍 부서장 설정 조건 확인 - useRealDepartments: ${config.useRealDepartments}, useRealEmployees: ${config.useRealEmployees}, currentUserId: ${config.currentUserId || 'undefined'}`);
        if (!config.useRealDepartments &&
            !config.useRealEmployees &&
            !config.currentUserId) {
            this.logger.log('✅ 부서장 설정 시작');
            const latestDepartments = await this.departmentService.findAll();
            this.logger.log(`📊 조회된 부서: ${latestDepartments.length}개, 직원: ${employeeIds.length}명`);
            await this.부서장을_설정한다(employeeIds, latestDepartments);
            this.logger.log(`✅ 부서장 설정 완료`);
        }
        else {
            if (config.currentUserId) {
                this.logger.log('⏭️ 부서장 설정 건너뜀 (currentUserId 설정으로 인해 모든 직원의 managerId가 덮어써지므로)');
            }
            else {
                this.logger.log('⏭️ 부서장 설정 건너뜀 (실제 데이터 사용 중)');
            }
        }
        this.logger.log(`🔍 currentUserId 확인: ${config.currentUserId || 'undefined'}`);
        console.log(`🔍 [Phase1] currentUserId 확인: ${config.currentUserId || 'undefined'}`);
        if (config.currentUserId) {
            this.logger.log(`✅ 현재 사용자를 모든 직원의 관리자로 설정 시작 (currentUserId: ${config.currentUserId})`);
            console.log(`✅ [Phase1] 현재 사용자를 모든 직원의 관리자로 설정 시작 (currentUserId: ${config.currentUserId})`);
            await this.현재_사용자를_모든_직원의_관리자로_설정한다(employeeIds, config.currentUserId);
            this.logger.log(`✅ 현재 사용자를 모든 직원의 관리자로 설정 완료`);
            console.log(`✅ [Phase1] 현재 사용자를 모든 직원의 관리자로 설정 완료`);
        }
        else {
            this.logger.log('⚠️ currentUserId가 없어 관리자 설정을 건너뜁니다.');
            console.log('⚠️ [Phase1] currentUserId가 없어 관리자 설정을 건너뜁니다.');
        }
        const projectIds = await this.생성_Project들(config.dataScale.projectCount, employeeIds, dist, systemAdminId);
        this.logger.log(`생성 완료: Project ${projectIds.length}개`);
        const wbsIds = await this.생성_WbsItem들(projectIds, config.dataScale.wbsPerProject, employeeIds, dist, systemAdminId);
        this.logger.log(`생성 완료: WbsItem ${wbsIds.length}개`);
        const duration = Date.now() - startTime;
        this.logger.log(`Phase 1 완료 (${duration}ms)`);
        return {
            phase: 'Phase1',
            entityCounts: {
                Department: departmentIds.length,
                Employee: employeeIds.length,
                Project: projectIds.length,
                WbsItem: wbsIds.length,
            },
            generatedIds: {
                departmentIds,
                employeeIds,
                projectIds,
                wbsIds,
                systemAdminId,
            },
            duration,
        };
    }
    async 생성_Department들(count, dist) {
        const hierarchy = dist.departmentHierarchy;
        const departments = [];
        const companyCount = 1;
        const headquarterCount = Math.ceil((count - companyCount) * 0.3);
        const partCount = count - companyCount - headquarterCount;
        let deptCounter = 0;
        for (let i = 0; i < companyCount; i++) {
            const dept = new department_entity_1.Department();
            dept.name = `${faker_1.faker.company.name()} 회사`;
            dept.code = `COMP-${String(i + 1).padStart(3, '0')}`;
            dept.order = deptCounter++;
            dept.externalId = faker_1.faker.string.uuid();
            dept.externalCreatedAt = new Date();
            dept.externalUpdatedAt = new Date();
            dept.createdBy = 'temp-system';
            departments.push(dept);
        }
        const savedCompanies = await this.부서를_배치로_저장한다(departments);
        const headquarterDepts = [];
        const hqPerCompany = Math.ceil(headquarterCount / savedCompanies.length);
        for (const company of savedCompanies) {
            const hqCount = Math.min(hqPerCompany, headquarterCount - headquarterDepts.length);
            for (let i = 0; i < hqCount; i++) {
                const dept = new department_entity_1.Department();
                dept.name = `${faker_1.faker.commerce.department()} 본부`;
                dept.code = `HQ-${String(deptCounter + 1).padStart(3, '0')}`;
                dept.order = deptCounter++;
                dept.parentDepartmentId = company.externalId;
                dept.externalId = faker_1.faker.string.uuid();
                dept.externalCreatedAt = new Date();
                dept.externalUpdatedAt = new Date();
                dept.createdBy = 'temp-system';
                headquarterDepts.push(dept);
                departments.push(dept);
            }
        }
        const savedHeadquarters = await this.부서를_배치로_저장한다(headquarterDepts);
        const partDepts = [];
        const partPerHq = Math.ceil(partCount / savedHeadquarters.length);
        for (const hq of savedHeadquarters) {
            const pCount = Math.min(partPerHq, partCount - partDepts.length);
            for (let i = 0; i < pCount; i++) {
                const dept = new department_entity_1.Department();
                dept.name = `${faker_1.faker.commerce.productAdjective()} 파트`;
                dept.code = `PART-${String(deptCounter + 1).padStart(3, '0')}`;
                dept.order = deptCounter++;
                dept.parentDepartmentId = hq.externalId;
                dept.externalId = faker_1.faker.string.uuid();
                dept.externalCreatedAt = new Date();
                dept.externalUpdatedAt = new Date();
                dept.createdBy = 'temp-system';
                partDepts.push(dept);
                departments.push(dept);
            }
        }
        await this.부서를_배치로_저장한다(partDepts);
        return departments.map((d) => d.id);
    }
    async 업데이트_Department_생성자(departmentIds, adminId) {
        await this.departmentRepository
            .createQueryBuilder()
            .update(department_entity_1.Department)
            .set({ createdBy: adminId })
            .where('id IN (:...ids)', { ids: departmentIds })
            .execute();
    }
    async 생성_Employee들(count, departments, dist, clearExisting = true) {
        const employees = [];
        const timestamp = Date.now().toString().slice(-6);
        let existingAdminId = null;
        if (!clearExisting) {
            const existingAdminDto = await this.employeeService.이메일로_조회한다('admin@system.com');
            if (existingAdminDto) {
                this.logger.log('기존 시스템 관리자 계정 사용: admin@system.com');
                existingAdminId = existingAdminDto.id;
            }
        }
        if (!existingAdminId) {
            const adminEmp = new employee_entity_1.Employee();
            adminEmp.employeeNumber = `EMP${timestamp}001`;
            adminEmp.name = '시스템 관리자';
            adminEmp.email = 'admin@system.com';
            adminEmp.phoneNumber =
                faker_1.faker.string.numeric(3) +
                    '-' +
                    faker_1.faker.string.numeric(4) +
                    '-' +
                    faker_1.faker.string.numeric(4);
            adminEmp.dateOfBirth = faker_1.faker.date.birthdate({
                min: 30,
                max: 50,
                mode: 'age',
            });
            adminEmp.gender = 'MALE';
            adminEmp.hireDate = utils_1.DateGeneratorUtil.generatePastDate(3650);
            adminEmp.status = '재직중';
            adminEmp.isExcludedFromList = false;
            const firstDept = departments[0];
            adminEmp.departmentId = firstDept.externalId;
            adminEmp.externalId = faker_1.faker.string.uuid();
            adminEmp.externalCreatedAt = new Date();
            adminEmp.externalUpdatedAt = new Date();
            adminEmp.createdBy = 'temp-system';
            employees.push(adminEmp);
        }
        const startIndex = existingAdminId ? 0 : 1;
        const partLeaderCount = Math.max(2, Math.ceil((count - startIndex) * 0.2));
        let partLeadersCreated = 0;
        for (let i = startIndex; i < count; i++) {
            const emp = new employee_entity_1.Employee();
            emp.employeeNumber = `EMP${timestamp}${String(i + 1).padStart(3, '0')}`;
            emp.name = faker_1.faker.person.fullName();
            emp.email = faker_1.faker.internet.email();
            emp.phoneNumber =
                faker_1.faker.string.numeric(3) +
                    '-' +
                    faker_1.faker.string.numeric(4) +
                    '-' +
                    faker_1.faker.string.numeric(4);
            emp.dateOfBirth = faker_1.faker.date.birthdate({ min: 25, max: 55, mode: 'age' });
            emp.gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
            emp.hireDate = utils_1.DateGeneratorUtil.generatePastDate(3650);
            const statusKey = utils_1.ProbabilityUtil.selectByProbability(dist.employeeStatus);
            emp.status =
                statusKey === 'active'
                    ? '재직중'
                    : statusKey === 'onLeave'
                        ? '휴직중'
                        : '퇴사';
            emp.isExcludedFromList = utils_1.ProbabilityUtil.rollDice(dist.excludedFromList);
            if (emp.isExcludedFromList) {
                emp.excludeReason = this.생성_제외_사유(emp.status);
                emp.excludedBy = 'temp-system';
                emp.excludedAt = new Date();
            }
            const randomDept = departments[Math.floor(Math.random() * departments.length)];
            emp.departmentId = randomDept.id;
            if (partLeadersCreated < partLeaderCount && emp.status === '재직중') {
                emp.positionId = faker_1.faker.string.uuid();
                partLeadersCreated++;
            }
            emp.externalId = faker_1.faker.string.uuid();
            emp.externalCreatedAt = new Date();
            emp.externalUpdatedAt = new Date();
            emp.createdBy = 'temp-system';
            employees.push(emp);
        }
        this.logger.log(`직원 생성 완료: 총 ${employees.length}명 (파트장: ${partLeadersCreated}명)`);
        let saved = [];
        if (employees.length > 0) {
            saved = await this.직원을_배치로_저장한다(employees);
        }
        if (existingAdminId) {
            return [existingAdminId, ...saved.map((e) => e.id)];
        }
        const employeeIds = saved.map((e) => e.id);
        return employeeIds;
    }
    async 업데이트_Employee_생성자(employeeIds, adminId) {
        await this.employeeRepository
            .createQueryBuilder()
            .update(employee_entity_1.Employee)
            .set({ createdBy: adminId })
            .where('id IN (:...ids)', { ids: employeeIds })
            .andWhere("createdBy = 'temp-system'")
            .execute();
        await this.employeeRepository
            .createQueryBuilder()
            .update(employee_entity_1.Employee)
            .set({ excludedBy: adminId })
            .where('id IN (:...ids)', { ids: employeeIds })
            .andWhere("excludedBy = 'temp-system'")
            .andWhere('isExcludedFromList = :isExcluded', { isExcluded: true })
            .execute();
    }
    생성_제외_사유(status) {
        const reasons = {
            퇴사: [
                '퇴사 처리 완료',
                '퇴직금 정산 완료 후 제외',
                '계약 종료로 인한 퇴사',
                '자진 퇴사 처리 완료',
            ],
            휴직중: [
                '장기 휴직으로 평가 불가',
                '육아휴직 중 (1년 이상)',
                '병가 휴직 중',
                '무급 휴직 중',
            ],
            재직중: [
                '임원으로 평가 대상 제외',
                '외부 파견 근무 중',
                '계열사 파견 중',
                '별도 평가 체계 적용',
            ],
        };
        const reasonList = reasons[status] || reasons['재직중'];
        return reasonList[Math.floor(Math.random() * reasonList.length)];
    }
    async 생성_Project들(count, employeeIds, dist, systemAdminId) {
        const projects = [];
        const now = new Date();
        const employees = await this.employeeRepository
            .createQueryBuilder('employee')
            .select(['employee.id', 'employee.externalId'])
            .where('employee.id IN (:...ids)', { ids: employeeIds })
            .andWhere('employee.deletedAt IS NULL')
            .getMany();
        const idToExternalIdMap = new Map(employees.map((emp) => [emp.id, emp.externalId]));
        for (let i = 0; i < count; i++) {
            const project = new project_entity_1.Project();
            project.name = `${faker_1.faker.company.catchPhrase()} 프로젝트`;
            project.projectCode = `PRJ-${String(i + 1).padStart(4, '0')}`;
            const statusKey = utils_1.ProbabilityUtil.selectByProbability(dist.projectStatus);
            project.status =
                statusKey === 'active'
                    ? project_types_1.ProjectStatus.ACTIVE
                    : statusKey === 'completed'
                        ? project_types_1.ProjectStatus.COMPLETED
                        : project_types_1.ProjectStatus.CANCELLED;
            const { startDate, endDate } = utils_1.DateGeneratorUtil.generateDateRange(utils_1.DateGeneratorUtil.addMonths(now, -6), dist.dateGeneration.project.durationMonths.min, dist.dateGeneration.project.durationMonths.max, 'months');
            project.startDate = startDate;
            project.endDate = endDate;
            const nonSystemAdminEmployees = employeeIds.filter((id) => id !== systemAdminId);
            if (nonSystemAdminEmployees.length > 0) {
                const selectedEmployeeId = nonSystemAdminEmployees[Math.floor(Math.random() * nonSystemAdminEmployees.length)];
                project.managerId = idToExternalIdMap.get(selectedEmployeeId);
            }
            else {
                if (utils_1.ProbabilityUtil.rollDice(dist.projectManagerAssignmentRatio)) {
                    const selectedEmployeeId = employeeIds[Math.floor(Math.random() * employeeIds.length)];
                    project.managerId = idToExternalIdMap.get(selectedEmployeeId);
                }
            }
            project.createdBy = systemAdminId;
            projects.push(project);
        }
        const saved = await this.프로젝트를_배치로_저장한다(projects);
        return saved.map((p) => p.id);
    }
    async 생성_WbsItem들(projectIds, wbsPerProject, employeeIds, dist, systemAdminId) {
        const allWbsItems = [];
        const hierarchy = dist.wbsHierarchy;
        for (const projectId of projectIds) {
            const wbsItems = [];
            let wbsCounter = 1;
            const rootCount = Math.min(wbsPerProject, 5);
            for (let i = 0; i < rootCount; i++) {
                const wbs = this.생성_WbsItem(projectId, wbsCounter++, 1, null, employeeIds, dist, systemAdminId);
                wbsItems.push(wbs);
            }
            const savedRoots = await this.WBS를_배치로_저장한다(wbsItems);
            let currentLevel = savedRoots;
            let currentDepth = 1;
            let totalWbs = savedRoots.length;
            while (totalWbs < wbsPerProject && currentDepth < hierarchy.maxDepth) {
                const nextLevel = [];
                for (const parent of currentLevel) {
                    if (totalWbs >= wbsPerProject)
                        break;
                    const childCount = utils_1.ProbabilityUtil.randomInt(hierarchy.childrenPerParent.min, Math.min(hierarchy.childrenPerParent.max, wbsPerProject - totalWbs));
                    for (let i = 0; i < childCount; i++) {
                        const wbs = this.생성_WbsItem(projectId, wbsCounter++, currentDepth + 1, parent.id, employeeIds, dist, systemAdminId);
                        nextLevel.push(wbs);
                        wbsItems.push(wbs);
                        totalWbs++;
                    }
                }
                if (nextLevel.length > 0) {
                    const saved = await this.WBS를_배치로_저장한다(nextLevel);
                    currentLevel = saved;
                }
                currentDepth++;
            }
            allWbsItems.push(...wbsItems);
        }
        return allWbsItems.map((w) => w.id);
    }
    생성_WbsItem(projectId, counter, level, parentWbsId, employeeIds, dist, systemAdminId) {
        const wbs = new wbs_item_entity_1.WbsItem();
        wbs.projectId = projectId;
        wbs.wbsCode = `WBS-${String(counter).padStart(4, '0')}`;
        wbs.title = `${faker_1.faker.hacker.verb()} ${faker_1.faker.hacker.noun()} ${level > 1 ? '세부 작업' : ''}`;
        wbs.level = level;
        if (parentWbsId) {
            wbs.parentWbsId = parentWbsId;
        }
        const statusKey = utils_1.ProbabilityUtil.selectByProbability(dist.wbsStatus);
        wbs.status =
            statusKey === 'pending'
                ? wbs_item_types_1.WbsItemStatus.PENDING
                : statusKey === 'inProgress'
                    ? wbs_item_types_1.WbsItemStatus.IN_PROGRESS
                    : wbs_item_types_1.WbsItemStatus.COMPLETED;
        const { startDate, endDate } = utils_1.DateGeneratorUtil.generateDateRange(new Date(), dist.dateGeneration.wbs.durationDays.min, dist.dateGeneration.wbs.durationDays.max, 'days');
        wbs.startDate = startDate;
        wbs.endDate = endDate;
        if (wbs.status === wbs_item_types_1.WbsItemStatus.COMPLETED) {
            wbs.progressPercentage = 100;
        }
        else if (wbs.status === wbs_item_types_1.WbsItemStatus.IN_PROGRESS) {
            wbs.progressPercentage = utils_1.ProbabilityUtil.randomInt(10, 90);
        }
        else {
            wbs.progressPercentage = 0;
        }
        if (utils_1.ProbabilityUtil.rollDice(dist.wbsAssignmentRatio)) {
            wbs.assignedToId =
                employeeIds[Math.floor(Math.random() * employeeIds.length)];
        }
        wbs.createdBy = systemAdminId;
        return wbs;
    }
    async 조회_실제_Department들() {
        try {
            this.logger.log('외부 서버에서 부서 데이터를 동기화합니다...');
            const syncResult = await this.departmentSyncService.syncDepartments(true);
            if (!syncResult.success) {
                this.logger.warn(`부서 동기화 실패: ${syncResult.errors.join(', ')}. Faker 데이터로 대체됩니다.`);
                return [];
            }
            this.logger.log(`부서 동기화 완료: ${syncResult.created}개 생성, ${syncResult.updated}개 업데이트`);
            const departments = await this.departmentService.findAll();
            if (departments.length === 0) {
                this.logger.warn('동기화된 부서 데이터가 없습니다. Faker 데이터로 대체됩니다.');
                return [];
            }
            this.logger.log(`동기화된 부서 ${departments.length}개를 사용합니다.`);
            return departments.map((d) => d.id);
        }
        catch (error) {
            this.logger.error('부서 동기화/조회 실패:', error.message);
            this.logger.warn('Faker 데이터로 대체됩니다.');
            return [];
        }
    }
    async 조회_실제_Employee들() {
        try {
            this.logger.log('외부 서버에서 직원 데이터를 동기화합니다...');
            const syncResult = await this.employeeSyncService.syncEmployees(true);
            if (!syncResult.success) {
                this.logger.warn(`직원 동기화 실패: ${syncResult.errors.join(', ')}. Faker 데이터로 대체됩니다.`);
                return [];
            }
            this.logger.log(`직원 동기화 완료: ${syncResult.created}개 생성, ${syncResult.updated}개 업데이트`);
            const allEmployees = await this.employeeService.findAll(false);
            const employees = allEmployees.filter((emp) => emp.status === '재직중');
            if (employees.length === 0) {
                this.logger.warn('재직중인 직원 데이터가 없습니다. Faker 데이터로 대체됩니다.');
                return [];
            }
            this.logger.log(`재직중인 직원 ${employees.length}명을 평가 대상으로 사용합니다.`);
            return employees.map((e) => e.id);
        }
        catch (error) {
            this.logger.error('직원 동기화/조회 실패:', error.message);
            this.logger.warn('Faker 데이터로 대체됩니다.');
            return [];
        }
    }
    async 부서를_배치로_저장한다(departments) {
        const saved = [];
        for (let i = 0; i < departments.length; i += BATCH_SIZE) {
            const batch = departments.slice(i, i + BATCH_SIZE);
            const result = await this.departmentRepository.save(batch);
            saved.push(...result);
            this.logger.log(`부서 저장 진행: ${Math.min(i + BATCH_SIZE, departments.length)}/${departments.length}`);
        }
        return saved;
    }
    async 직원을_배치로_저장한다(employees) {
        const saved = [];
        for (let i = 0; i < employees.length; i += BATCH_SIZE) {
            const batch = employees.slice(i, i + BATCH_SIZE);
            const result = await this.employeeRepository.save(batch);
            saved.push(...result);
            this.logger.log(`직원 저장 진행: ${Math.min(i + BATCH_SIZE, employees.length)}/${employees.length}`);
        }
        return saved;
    }
    async 프로젝트를_배치로_저장한다(projects) {
        const saved = [];
        for (let i = 0; i < projects.length; i += BATCH_SIZE) {
            const batch = projects.slice(i, i + BATCH_SIZE);
            const result = await this.projectRepository.save(batch);
            saved.push(...result);
            this.logger.log(`프로젝트 저장 진행: ${Math.min(i + BATCH_SIZE, projects.length)}/${projects.length}`);
        }
        return saved;
    }
    async WBS를_배치로_저장한다(wbsItems) {
        const saved = [];
        for (let i = 0; i < wbsItems.length; i += BATCH_SIZE) {
            const batch = wbsItems.slice(i, i + BATCH_SIZE);
            const result = await this.wbsItemRepository.save(batch);
            saved.push(...result);
            this.logger.log(`WBS 저장 진행: ${Math.min(i + BATCH_SIZE, wbsItems.length)}/${wbsItems.length}`);
        }
        return saved;
    }
    async 부서장을_설정한다(employeeIds, departments) {
        this.logger.log('부서장 설정 시작');
        const departmentEmployeeMap = new Map();
        const allEmployees = await this.employeeService.findAll(true);
        const employees = allEmployees
            .filter((emp) => employeeIds.includes(emp.id))
            .sort((a, b) => {
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
        for (const employee of employees) {
            if (employee.departmentId) {
                if (!departmentEmployeeMap.has(employee.departmentId)) {
                    departmentEmployeeMap.set(employee.departmentId, []);
                }
                departmentEmployeeMap.get(employee.departmentId).push(employee.id);
            }
        }
        for (const [departmentId, employeeIdsInDept] of departmentEmployeeMap) {
            if (employeeIdsInDept.length > 0) {
                const managerId = employeeIdsInDept[0];
                const department = departments.find((dept) => dept.id === departmentId);
                if (department) {
                    await this.departmentRepository.update(department.id, {
                        managerId: managerId,
                        updatedAt: new Date(),
                    });
                    this.logger.debug(`부서장 설정: 부서 ${department.name} → 직원 ${managerId}`);
                }
                for (const employeeId of employeeIdsInDept) {
                    if (employeeId !== managerId) {
                        await this.employeeRepository.update(employeeId, {
                            managerId: managerId,
                            updatedAt: new Date(),
                        });
                    }
                }
            }
        }
        this.logger.log(`부서장 설정 완료: ${departmentEmployeeMap.size}개 부서`);
    }
    async 현재_사용자를_모든_직원의_관리자로_설정한다(employeeIds, currentUserId) {
        this.logger.log(`현재 사용자를 모든 직원의 관리자로 설정: ${employeeIds.length}명`);
        console.log(`[Phase1] 현재 사용자를 모든 직원의 관리자로 설정: ${employeeIds.length}명, currentUserId: ${currentUserId}`);
        const targetEmployeeIds = employeeIds.filter((id) => id !== currentUserId);
        console.log(`[Phase1] 대상 직원 수: ${targetEmployeeIds.length}명 (전체: ${employeeIds.length}명, 현재 사용자 제외)`);
        if (targetEmployeeIds.length > 0) {
            const updateResult = await this.employeeRepository
                .createQueryBuilder()
                .update(employee_entity_1.Employee)
                .set({ managerId: currentUserId, updatedAt: new Date() })
                .where('id IN (:...ids)', { ids: targetEmployeeIds })
                .execute();
            this.logger.log(`✅ ${targetEmployeeIds.length}명의 직원에게 현재 사용자를 관리자로 설정 완료`);
            console.log(`✅ [Phase1] ${updateResult.affected}명의 직원에게 현재 사용자를 관리자로 설정 완료 (영향받은 행: ${updateResult.affected})`);
        }
        else {
            this.logger.log('⚠️ 설정할 직원이 없습니다 (모든 직원이 현재 사용자)');
            console.log('⚠️ [Phase1] 설정할 직원이 없습니다 (모든 직원이 현재 사용자)');
        }
    }
};
exports.Phase1OrganizationGenerator = Phase1OrganizationGenerator;
exports.Phase1OrganizationGenerator = Phase1OrganizationGenerator = Phase1OrganizationGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(3, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        department_service_1.DepartmentService,
        employee_service_1.EmployeeService,
        organization_management_context_1.DepartmentSyncService,
        employee_sync_service_1.EmployeeSyncService])
], Phase1OrganizationGenerator);
//# sourceMappingURL=phase1-organization.generator.js.map