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
var EmployeeSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeSyncService = void 0;
const sso_1 = require("../../domain/common/sso");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const employee_service_1 = require("../../domain/common/employee/employee.service");
let EmployeeSyncService = EmployeeSyncService_1 = class EmployeeSyncService {
    employeeService;
    configService;
    ssoService;
    logger = new common_1.Logger(EmployeeSyncService_1.name);
    syncEnabled;
    systemUserId = 'SYSTEM_SYNC';
    ADMIN_EMPLOYEE_NAMES = [
        '남명용',
        '이봉은',
        '우은진',
        '전무현',
        '우창욱',
        '김종식',
    ];
    constructor(employeeService, configService, ssoService) {
        this.employeeService = employeeService;
        this.configService = configService;
        this.ssoService = ssoService;
        this.syncEnabled = this.configService.get('EMPLOYEE_SYNC_ENABLED', true);
    }
    async onModuleInit() {
        if (!this.syncEnabled) {
            this.logger.log('직원 동기화가 비활성화되어 있어 초기 동기화를 건너뜁니다.');
            return;
        }
        try {
            this.logger.log('모듈 초기화: 직원 데이터 확인 중...');
            const stats = await this.employeeService.getEmployeeStats();
            if (stats.totalEmployees === 0) {
                this.logger.log('직원 데이터가 없습니다. 초기 동기화를 시작합니다...');
                const result = await this.syncEmployees(true);
                if (result.success) {
                    this.logger.log(`초기 동기화 완료: ${result.created}개 생성, ${result.updated}개 업데이트`);
                }
                else {
                    this.logger.error(`초기 동기화 실패: ${result.errors.join(', ')}`);
                }
            }
            else {
                this.logger.log(`기존 직원 데이터 ${stats.totalEmployees}개 확인됨. 초기 동기화를 건너뜁니다.`);
            }
        }
        catch (error) {
            this.logger.error(`모듈 초기화 중 오류 발생: ${error.message}`);
        }
    }
    async fetchExternalEmployees(useHierarchyAPI = false) {
        try {
            let employees;
            if (useHierarchyAPI) {
                this.logger.log('부서 계층 구조 API를 사용하여 모든 직원 정보를 조회합니다...');
                employees = await this.ssoService.모든직원정보를조회한다({
                    includeEmptyDepartments: true,
                });
                this.logger.log(`부서 계층 구조 API에서 ${employees.length}개의 직원 데이터를 조회했습니다.`);
            }
            else {
                this.logger.log('직원 목록 API(getEmployees)를 사용하여 모든 직원 정보를 조회합니다...');
                employees = await this.ssoService.여러직원원시정보를조회한다({
                    withDetail: true,
                    includeTerminated: false,
                });
                this.logger.log(`직원 목록 API에서 ${employees.length}개의 직원 데이터를 조회했습니다.`);
            }
            return employees;
        }
        catch (error) {
            this.logger.error('SSO 직원 API 조회 실패:', error.message);
            throw new common_1.HttpException('SSO 직원 데이터 조회에 실패했습니다.', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    mapSSOEmployeeToDto(ssoEmployee) {
        const departmentId = ssoEmployee.department?.id;
        const departmentName = ssoEmployee.department?.departmentName;
        const departmentCode = ssoEmployee.department?.departmentCode;
        const positionId = ssoEmployee.position?.id;
        const rankId = ssoEmployee.rank?.id;
        const rankName = ssoEmployee.rank?.rankName;
        const rankCode = ssoEmployee.rank?.rankCode;
        const rankLevel = ssoEmployee.rank?.level;
        let status = '재직중';
        if (ssoEmployee.status) {
            if (ssoEmployee.status === '재직중' ||
                ssoEmployee.status === 'ACTIVE' ||
                ssoEmployee.status === 'active') {
                status = '재직중';
            }
            else if (ssoEmployee.status === '휴직중' ||
                ssoEmployee.status === 'ON_LEAVE') {
                status = '휴직중';
            }
            else if (ssoEmployee.status === '퇴사' ||
                ssoEmployee.status === 'TERMINATED' ||
                ssoEmployee.status === 'terminated') {
                status = '퇴사';
            }
        }
        else if (ssoEmployee.isTerminated) {
            status = '퇴사';
        }
        let dateOfBirth;
        if (ssoEmployee.dateOfBirth) {
            try {
                dateOfBirth = new Date(ssoEmployee.dateOfBirth);
                if (isNaN(dateOfBirth.getTime())) {
                    dateOfBirth = undefined;
                }
            }
            catch {
                dateOfBirth = undefined;
            }
        }
        let hireDate;
        if (ssoEmployee.hireDate) {
            try {
                hireDate = new Date(ssoEmployee.hireDate);
                if (isNaN(hireDate.getTime())) {
                    hireDate = undefined;
                }
            }
            catch {
                hireDate = undefined;
            }
        }
        let gender;
        if (ssoEmployee.gender) {
            const genderUpper = ssoEmployee.gender.toUpperCase();
            if (genderUpper === 'MALE' || genderUpper === 'M') {
                gender = 'MALE';
            }
            else if (genderUpper === 'FEMALE' || genderUpper === 'F') {
                gender = 'FEMALE';
            }
        }
        const phoneNumber = ssoEmployee.phoneNumber && ssoEmployee.phoneNumber.trim() !== ''
            ? ssoEmployee.phoneNumber
            : undefined;
        const managerId = ssoEmployee.managerId ? ssoEmployee.managerId : undefined;
        return {
            employeeNumber: ssoEmployee.employeeNumber,
            name: ssoEmployee.name,
            email: ssoEmployee.email,
            phoneNumber: phoneNumber,
            dateOfBirth: dateOfBirth,
            gender: gender,
            hireDate: hireDate,
            managerId: managerId,
            status: status,
            departmentId: departmentId,
            departmentName: departmentName,
            departmentCode: departmentCode,
            positionId: positionId,
            rankId: rankId,
            rankName: rankName,
            rankCode: rankCode,
            rankLevel: rankLevel,
            externalId: ssoEmployee.id,
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
            roles: undefined,
        };
    }
    async syncEmployees(forceSync = false, useHierarchyAPI = false) {
        if (!this.syncEnabled && !forceSync) {
            this.logger.warn('직원 동기화가 비활성화되어 있습니다.');
            return {
                success: false,
                totalProcessed: 0,
                created: 0,
                updated: 0,
                errors: ['동기화가 비활성화되어 있습니다.'],
                syncedAt: new Date(),
            };
        }
        const syncStartTime = new Date();
        let totalProcessed = 0;
        let created = 0;
        let updated = 0;
        const errors = [];
        try {
            this.logger.log('직원 데이터 동기화를 시작합니다...');
            const ssoEmployees = await this.fetchExternalEmployees(useHierarchyAPI);
            totalProcessed = ssoEmployees.length;
            this.logger.log(`SSO에서 ${totalProcessed}개의 직원 데이터를 조회했습니다.`);
            this.logger.log('관리자 정보를 조회합니다...');
            let managerMap = new Map();
            try {
                const managersResponse = await this.ssoService.직원관리자정보를조회한다();
                for (const empManager of managersResponse.employees) {
                    let foundManagerId = null;
                    for (const deptManager of empManager.departments) {
                        const sortedManagerLine = [...deptManager.managerLine].sort((a, b) => a.depth - b.depth);
                        for (const managerLine of sortedManagerLine) {
                            if (managerLine.managers && managerLine.managers.length > 0) {
                                foundManagerId = managerLine.managers[0].employeeId;
                                break;
                            }
                        }
                        if (foundManagerId) {
                            break;
                        }
                    }
                    managerMap.set(empManager.employeeId, foundManagerId);
                }
                const managerCount = Array.from(managerMap.values()).filter((id) => id !== null).length;
                this.logger.log(`관리자 정보 ${managerCount}개를 조회했습니다. (null: ${managerMap.size - managerCount}개) 동기화를 시작합니다...`);
            }
            catch (managerError) {
                this.logger.warn(`관리자 정보 조회 실패 (동기화는 계속 진행): ${managerError.message}`);
            }
            const employeesToSave = [];
            for (const ssoEmp of ssoEmployees) {
                const managerId = managerMap.get(ssoEmp.id);
                ssoEmp.managerId = managerId || undefined;
                const result = await this.직원을_처리한다(ssoEmp, forceSync, syncStartTime);
                if (result.success && result.employee) {
                    employeesToSave.push(result.employee);
                    if (result.isNew) {
                        created++;
                    }
                    else {
                        updated++;
                    }
                }
                else if (result.error) {
                    errors.push(result.error);
                }
            }
            this.logger.log(`처리 완료: 총 ${totalProcessed}개 중 ${created}개 생성, ${updated}개 업데이트, ${errors.length}개 오류`);
            if (employeesToSave.length > 0) {
                await this.직원들을_저장한다(employeesToSave, errors);
            }
            let terminatedCount = 0;
            try {
                terminatedCount = await this.SSO에_없는_직원을_퇴사_처리한다(ssoEmployees, syncStartTime);
                if (terminatedCount > 0) {
                    this.logger.log(`SSO에 없는 직원 ${terminatedCount}명을 퇴사 상태로 변경했습니다.`);
                }
            }
            catch (terminateError) {
                this.logger.error(`SSO에 없는 직원 퇴사 처리 중 오류 발생: ${terminateError.message}`);
                errors.push(`퇴사 처리 실패: ${terminateError.message}`);
            }
            const result = {
                success: true,
                totalProcessed,
                created,
                updated,
                errors,
                syncedAt: syncStartTime,
            };
            this.logger.log(`직원 동기화 완료: 총 ${totalProcessed}개 처리, ${created}개 생성, ${updated}개 업데이트, ${terminatedCount}개 퇴사 처리`);
            return result;
        }
        catch (error) {
            const errorMsg = `직원 동기화 실패: ${error.message}`;
            this.logger.error(errorMsg);
            return {
                success: false,
                totalProcessed,
                created,
                updated,
                errors: [...errors, errorMsg],
                syncedAt: syncStartTime,
            };
        }
    }
    async scheduledSync() {
        const scheduledSyncEnabledValue = this.configService.get('SCHEDULED_SYNC_ENABLED', 'true');
        const scheduledSyncEnabled = scheduledSyncEnabledValue === 'false' ||
            scheduledSyncEnabledValue === false
            ? false
            : true;
        if (!scheduledSyncEnabled) {
            this.logger.debug('스케줄된 직원 동기화가 비활성화되어 있습니다.');
            return;
        }
        this.logger.log('스케줄된 직원 동기화를 시작합니다...');
        await this.syncEmployees();
    }
    async triggerManualSync() {
        this.logger.log('수동 직원 동기화를 시작합니다...');
        return this.syncEmployees(true);
    }
    async getEmployees(forceRefresh = false) {
        try {
            const localEmployees = await this.employeeService.findAll();
            if (forceRefresh || localEmployees.length === 0) {
                this.logger.log('직원 데이터를 외부 API에서 동기화합니다...');
                await this.syncEmployees(forceRefresh);
                return this.employeeService.findAll();
            }
            const stats = await this.employeeService.getEmployeeStats();
            const lastSyncAt = stats.lastSyncAt;
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            if (!lastSyncAt || lastSyncAt < twentyFourHoursAgo) {
                this.logger.log('24시간 이상 동기화되지 않아 백그라운드에서 동기화를 시작합니다...');
                this.syncEmployees().catch((error) => {
                    this.logger.error('백그라운드 동기화 실패:', error.message);
                });
            }
            return localEmployees;
        }
        catch (error) {
            this.logger.error('직원 데이터 조회 실패:', error.message);
            throw new common_1.HttpException('직원 데이터 조회에 실패했습니다.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getEmployeeById(id, forceRefresh = false) {
        try {
            let employee = await this.employeeService.findById(id);
            if (!employee || forceRefresh) {
                await this.syncEmployees(forceRefresh);
                employee = await this.employeeService.findById(id);
            }
            return employee;
        }
        catch (error) {
            this.logger.error(`직원 ID ${id} 조회 실패:`, error.message);
            throw new common_1.HttpException('직원 조회에 실패했습니다.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getEmployeeByExternalId(externalId, forceRefresh = false) {
        try {
            let employee = await this.employeeService.findByExternalId(externalId);
            if (!employee || forceRefresh) {
                await this.syncEmployees(forceRefresh);
                employee = await this.employeeService.findByExternalId(externalId);
            }
            return employee;
        }
        catch (error) {
            this.logger.error(`외부 직원 ID ${externalId} 조회 실패:`, error.message);
            throw new common_1.HttpException('직원 조회에 실패했습니다.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getEmployeeByEmployeeNumber(employeeNumber, forceRefresh = false) {
        try {
            let employee = await this.employeeService.findByEmployeeNumber(employeeNumber);
            if (!employee || forceRefresh) {
                await this.syncEmployees(forceRefresh);
                employee =
                    await this.employeeService.findByEmployeeNumber(employeeNumber);
            }
            return employee;
        }
        catch (error) {
            this.logger.error(`직원 번호 ${employeeNumber} 조회 실패:`, error.message);
            throw new common_1.HttpException('직원 조회에 실패했습니다.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getEmployeeByEmail(email, forceRefresh = false) {
        try {
            let employee = await this.employeeService.findByEmail(email);
            if (!employee || forceRefresh) {
                await this.syncEmployees(forceRefresh);
                employee = await this.employeeService.findByEmail(email);
            }
            return employee;
        }
        catch (error) {
            this.logger.error(`이메일 ${email} 조회 실패:`, error.message);
            throw new common_1.HttpException('직원 조회에 실패했습니다.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPartLeaders(forceRefresh = false) {
        try {
            const employees = await this.getEmployees(forceRefresh);
            try {
                const ssoEmployees = await this.fetchExternalEmployees();
                const partLeaderExternalIds = new Set(ssoEmployees
                    .filter((emp) => emp.position &&
                    (emp.position.positionName?.includes('파트장') ||
                        emp.position.positionCode?.includes('파트장')))
                    .map((emp) => emp.id));
                const partLeaders = employees.filter((emp) => partLeaderExternalIds.has(emp.externalId));
                this.logger.log(`파트장 ${partLeaders.length}명 조회 완료 (전체 직원: ${employees.length}명)`);
                return partLeaders;
            }
            catch (ssoError) {
                this.logger.warn(`SSO 조회 실패, 로컬 DB 데이터로 파트장 추정: ${ssoError.message}`);
                const partLeaders = employees.filter((emp) => emp.positionId);
                this.logger.log(`파트장 ${partLeaders.length}명 추정 완료 (positionId 기반, 전체 직원: ${employees.length}명)`);
                return partLeaders;
            }
        }
        catch (error) {
            this.logger.error(`파트장 목록 조회 실패:`, error.message);
            return [];
        }
    }
    async SSO에_없는_직원을_퇴사_처리한다(ssoEmployees, syncStartTime) {
        const syncDeleteMissing = this.configService.get('SYNC_DELETE_MISSING_EMPLOYEES', 'true');
        const syncDeleteMissingEnabled = syncDeleteMissing === 'false' || syncDeleteMissing === false
            ? false
            : true;
        if (!syncDeleteMissingEnabled) {
            this.logger.debug('SSO에 없는 직원 퇴사 처리가 비활성화되어 있습니다. (SYNC_DELETE_MISSING_EMPLOYEES=false)');
            return 0;
        }
        const ssoExternalIds = new Set(ssoEmployees.map((emp) => emp.id).filter((id) => id));
        const allLocalEmployees = await this.employeeService.findAll(true);
        const oneDayAgo = new Date(syncStartTime.getTime() - 24 * 60 * 60 * 1000);
        const employeesToTerminate = allLocalEmployees.filter((emp) => emp.externalId &&
            !ssoExternalIds.has(emp.externalId) &&
            emp.status !== '퇴사' &&
            emp.lastSyncAt &&
            new Date(emp.lastSyncAt) > oneDayAgo);
        if (employeesToTerminate.length === 0) {
            return 0;
        }
        this.logger.log(`SSO에 없는 직원 ${employeesToTerminate.length}명을 퇴사 상태로 변경합니다.`);
        let terminatedCount = 0;
        const employeesToSave = [];
        for (const employee of employeesToTerminate) {
            try {
                employee.status = '퇴사';
                employee.lastSyncAt = syncStartTime;
                employee.updatedBy = this.systemUserId;
                employeesToSave.push(employee);
                terminatedCount++;
                this.logger.debug(`직원 ${employee.name} (${employee.employeeNumber}, externalId: ${employee.externalId})를 퇴사 상태로 변경합니다.`);
            }
            catch (error) {
                this.logger.error(`직원 ${employee.name} (${employee.employeeNumber}) 퇴사 처리 실패: ${error.message}`);
            }
        }
        if (employeesToSave.length > 0) {
            try {
                await this.employeeService.saveMany(employeesToSave);
                this.logger.log(`${terminatedCount}명의 직원을 퇴사 상태로 변경했습니다.`);
            }
            catch (saveError) {
                this.logger.error(`퇴사 처리된 직원 저장 실패: ${saveError.message}`);
                throw saveError;
            }
        }
        return terminatedCount;
    }
    async 직원을_처리한다(ssoEmp, forceSync, syncStartTime) {
        try {
            let existingEmployee = await this.employeeService.findByEmployeeNumber(ssoEmp.employeeNumber);
            if (!existingEmployee) {
                existingEmployee = await this.employeeService.findByExternalId(ssoEmp.id);
            }
            const mappedData = this.mapSSOEmployeeToDto(ssoEmp);
            if (existingEmployee) {
                const wasTerminated = existingEmployee.status === '퇴사';
                const isRehired = wasTerminated && mappedData.status !== '퇴사';
                if (isRehired) {
                    this.logger.log(`직원 ${existingEmployee.name} (${existingEmployee.employeeNumber}): 퇴사 상태에서 재직중으로 복귀`);
                }
                const needsUpdate = isRehired ||
                    this.업데이트가_필요한가(existingEmployee, mappedData, forceSync);
                if (needsUpdate) {
                    Object.assign(existingEmployee, {
                        employeeNumber: mappedData.employeeNumber,
                        name: mappedData.name,
                        email: mappedData.email,
                        phoneNumber: mappedData.phoneNumber,
                        dateOfBirth: mappedData.dateOfBirth,
                        gender: mappedData.gender,
                        hireDate: mappedData.hireDate,
                        managerId: mappedData.managerId,
                        status: mappedData.status,
                        departmentId: mappedData.departmentId,
                        departmentName: mappedData.departmentName,
                        departmentCode: mappedData.departmentCode,
                        positionId: mappedData.positionId,
                        rankId: mappedData.rankId,
                        rankName: mappedData.rankName,
                        rankCode: mappedData.rankCode,
                        rankLevel: mappedData.rankLevel,
                        externalId: mappedData.externalId,
                        externalUpdatedAt: mappedData.externalUpdatedAt,
                        lastSyncAt: syncStartTime,
                        updatedBy: this.systemUserId,
                    });
                    return { success: true, employee: existingEmployee, isNew: false };
                }
                return { success: false };
            }
            else {
                const newEmployee = new employee_entity_1.Employee(mappedData.employeeNumber, mappedData.name, mappedData.email, mappedData.externalId, mappedData.phoneNumber, mappedData.dateOfBirth, mappedData.gender, mappedData.hireDate, mappedData.managerId, mappedData.status, mappedData.departmentId, mappedData.departmentName, mappedData.departmentCode, mappedData.positionId, mappedData.rankId, mappedData.rankName, mappedData.rankCode, mappedData.rankLevel, mappedData.externalCreatedAt, mappedData.externalUpdatedAt);
                newEmployee.lastSyncAt = syncStartTime;
                newEmployee.createdBy = this.systemUserId;
                newEmployee.updatedBy = this.systemUserId;
                newEmployee.isAccessible = this.ADMIN_EMPLOYEE_NAMES.includes(newEmployee.name);
                if (newEmployee.isAccessible) {
                    this.logger.log(`신규 직원 ${newEmployee.name}에게 관리자 권한 부여 (isAccessible=true)`);
                }
                return { success: true, employee: newEmployee, isNew: true };
            }
        }
        catch (error) {
            const errorMsg = `직원 ${ssoEmp.name} 처리 실패: ${error.message}`;
            this.logger.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    }
    업데이트가_필요한가(existingEmployee, mappedData, forceSync) {
        if (forceSync) {
            return true;
        }
        if (mappedData.externalUpdatedAt && existingEmployee.externalUpdatedAt) {
            const externalUpdatedAt = new Date(mappedData.externalUpdatedAt);
            const existingExternalUpdatedAt = new Date(existingEmployee.externalUpdatedAt);
            if (externalUpdatedAt > existingExternalUpdatedAt) {
                this.logger.debug(`직원 ${existingEmployee.name} (${existingEmployee.employeeNumber}): 외부 서버에서 업데이트됨 (외부: ${externalUpdatedAt.toISOString()}, 로컬: ${existingExternalUpdatedAt.toISOString()})`);
                return true;
            }
        }
        if (existingEmployee.employeeNumber !== mappedData.employeeNumber) {
            return true;
        }
        if (existingEmployee.name !== mappedData.name) {
            return true;
        }
        if (existingEmployee.email !== mappedData.email) {
            return true;
        }
        const existingPhone = existingEmployee.phoneNumber || '';
        const mappedPhone = mappedData.phoneNumber || '';
        if (existingPhone !== mappedPhone) {
            return true;
        }
        const existingManagerId = existingEmployee.managerId || null;
        const mappedManagerId = mappedData.managerId || null;
        if (existingManagerId !== mappedManagerId) {
            return true;
        }
        if (existingEmployee.status !== mappedData.status) {
            return true;
        }
        if (existingEmployee.departmentId !== mappedData.departmentId ||
            existingEmployee.departmentName !== mappedData.departmentName ||
            existingEmployee.departmentCode !== mappedData.departmentCode) {
            return true;
        }
        if (existingEmployee.rankId !== mappedData.rankId ||
            existingEmployee.rankName !== mappedData.rankName ||
            existingEmployee.rankCode !== mappedData.rankCode ||
            existingEmployee.rankLevel !== mappedData.rankLevel) {
            return true;
        }
        if (existingEmployee.positionId !== mappedData.positionId) {
            return true;
        }
        if (mappedData.hireDate) {
            const existingHireDate = existingEmployee.hireDate
                ? new Date(existingEmployee.hireDate)
                : null;
            const mappedHireDate = new Date(mappedData.hireDate);
            if (!existingHireDate ||
                existingHireDate.getTime() !== mappedHireDate.getTime()) {
                return true;
            }
        }
        else if (existingEmployee.hireDate) {
        }
        if (mappedData.dateOfBirth) {
            const existingDateOfBirth = existingEmployee.dateOfBirth
                ? new Date(existingEmployee.dateOfBirth)
                : null;
            const mappedDateOfBirth = new Date(mappedData.dateOfBirth);
            if (!existingDateOfBirth ||
                existingDateOfBirth.getTime() !== mappedDateOfBirth.getTime()) {
                return true;
            }
        }
        else if (existingEmployee.dateOfBirth) {
        }
        if (mappedData.gender && existingEmployee.gender !== mappedData.gender) {
            return true;
        }
        if (existingEmployee.externalId !== mappedData.externalId) {
            this.logger.warn(`직원 ${existingEmployee.name} (${existingEmployee.employeeNumber}): externalId 불일치 (기존: ${existingEmployee.externalId}, SSO: ${mappedData.externalId})`);
            return true;
        }
        return false;
    }
    async 직원들을_저장한다(employeesToSave, errors) {
        try {
            await this.employeeService.saveMany(employeesToSave);
            this.logger.log(`${employeesToSave.length}개의 직원 데이터를 저장했습니다.`);
        }
        catch (saveError) {
            if (saveError?.code === '23505' ||
                saveError?.message?.includes('duplicate key')) {
                this.logger.warn('일괄 저장 중 중복 키 에러 발생, 개별 저장으로 재시도합니다.');
                await this.개별_저장으로_재시도한다(employeesToSave, errors);
            }
            else {
                throw saveError;
            }
        }
    }
    async 개별_저장으로_재시도한다(employeesToSave, errors) {
        let savedCount = 0;
        let skippedCount = 0;
        for (const employee of employeesToSave) {
            const result = await this.직원을_개별_저장한다(employee);
            if (result.success) {
                savedCount++;
            }
            else {
                errors.push(result.error);
                skippedCount++;
            }
        }
        this.logger.log(`개별 저장 완료: ${savedCount}개 저장, ${skippedCount}개 건너뜀`);
    }
    async 직원을_개별_저장한다(employee) {
        try {
            await this.employeeService.save(employee);
            return { success: true };
        }
        catch (individualError) {
            if (individualError?.code === '23505' ||
                individualError?.message?.includes('duplicate key')) {
                const result = await this.중복_키_에러_처리한다(employee);
                if (result.success) {
                    return { success: true };
                }
                else {
                    return { success: false, error: result.error };
                }
            }
            else {
                const errorMsg = `직원 ${employee.name} 저장 실패: ${individualError.message}`;
                this.logger.error(errorMsg);
                return { success: false, error: errorMsg };
            }
        }
    }
    async 중복_키_에러_처리한다(employee) {
        try {
            let existingEmployee = await this.employeeService.findByEmployeeNumber(employee.employeeNumber);
            if (!existingEmployee) {
                existingEmployee = await this.employeeService.findByEmail(employee.email);
            }
            if (!existingEmployee) {
                existingEmployee = await this.employeeService.findByExternalId(employee.externalId);
            }
            if (existingEmployee) {
                Object.assign(existingEmployee, {
                    employeeNumber: employee.employeeNumber,
                    name: employee.name,
                    email: employee.email,
                    phoneNumber: employee.phoneNumber,
                    dateOfBirth: employee.dateOfBirth,
                    gender: employee.gender,
                    hireDate: employee.hireDate,
                    managerId: employee.managerId,
                    status: employee.status,
                    departmentId: employee.departmentId,
                    departmentName: employee.departmentName,
                    departmentCode: employee.departmentCode,
                    positionId: employee.positionId,
                    rankId: employee.rankId,
                    rankName: employee.rankName,
                    rankCode: employee.rankCode,
                    rankLevel: employee.rankLevel,
                    externalId: employee.externalId,
                    externalCreatedAt: employee.externalCreatedAt,
                    externalUpdatedAt: employee.externalUpdatedAt,
                    lastSyncAt: employee.lastSyncAt,
                    updatedBy: this.systemUserId,
                });
                await this.employeeService.save(existingEmployee);
                return { success: true };
            }
            else {
                const errorMsg = `직원 ${employee.name} (${employee.employeeNumber}) 재조회 실패, 건너뜀. externalId=${employee.externalId}, employeeNumber=${employee.employeeNumber}, email=${employee.email}`;
                this.logger.warn(errorMsg);
                return { success: false, error: errorMsg };
            }
        }
        catch (error) {
            const errorMsg = `직원 ${employee.name} 재조회/업데이트 실패: ${error.message}`;
            this.logger.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    }
};
exports.EmployeeSyncService = EmployeeSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmployeeSyncService.prototype, "scheduledSync", null);
exports.EmployeeSyncService = EmployeeSyncService = EmployeeSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(sso_1.SSOService)),
    __metadata("design:paramtypes", [employee_service_1.EmployeeService,
        config_1.ConfigService, Object])
], EmployeeSyncService);
//# sourceMappingURL=employee-sync.service.js.map