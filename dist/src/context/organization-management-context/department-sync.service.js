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
var DepartmentSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentSyncService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const department_entity_1 = require("../../domain/common/department/department.entity");
const department_service_1 = require("../../domain/common/department/department.service");
const common_2 = require("@nestjs/common");
const sso_1 = require("../../domain/common/sso");
let DepartmentSyncService = DepartmentSyncService_1 = class DepartmentSyncService {
    departmentService;
    configService;
    ssoService;
    logger = new common_1.Logger(DepartmentSyncService_1.name);
    syncEnabled;
    systemUserId = 'SYSTEM_SYNC';
    constructor(departmentService, configService, ssoService) {
        this.departmentService = departmentService;
        this.configService = configService;
        this.ssoService = ssoService;
        this.syncEnabled = this.configService.get('DEPARTMENT_SYNC_ENABLED', true);
    }
    async onModuleInit() {
        if (!this.syncEnabled) {
            this.logger.log('부서 동기화가 비활성화되어 있어 초기 동기화를 건너뜁니다.');
            return;
        }
        try {
            this.logger.log('모듈 초기화: 부서 데이터 확인 중...');
            const stats = await this.departmentService.getDepartmentStats();
            if (stats.totalDepartments === 0) {
                this.logger.log('부서 데이터가 없습니다. 초기 동기화를 시작합니다...');
                const result = await this.syncDepartments(true);
                if (result.success) {
                    this.logger.log(`초기 동기화 완료: ${result.created}개 생성, ${result.updated}개 업데이트`);
                }
                else {
                    this.logger.error(`초기 동기화 실패: ${result.errors.join(', ')}`);
                }
            }
            else {
                this.logger.log(`기존 부서 데이터 ${stats.totalDepartments}개 확인됨. 초기 동기화를 건너뜁니다.`);
            }
        }
        catch (error) {
            this.logger.error(`모듈 초기화 중 오류 발생: ${error.message}`);
        }
    }
    async fetchExternalDepartments() {
        try {
            const departments = await this.ssoService.모든부서정보를조회한다({
                includeEmptyDepartments: true,
            });
            this.logger.log(`SSO에서 ${departments.length}개의 부서 데이터를 조회했습니다.`);
            return departments;
        }
        catch (error) {
            if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
                this.logger.error(`SSO 부서 API 조회 타임아웃: ${error.message}. SSO 서버 응답이 지연되고 있습니다.`);
                throw new common_1.HttpException('SSO 부서 데이터 조회가 타임아웃되었습니다. 잠시 후 다시 시도해주세요.', common_1.HttpStatus.REQUEST_TIMEOUT);
            }
            this.logger.error('SSO 부서 API 조회 실패:', error.message);
            throw new common_1.HttpException('SSO 부서 데이터 조회에 실패했습니다.', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    mapSSODepartmentToDto(ssoDepartment, order = 0) {
        const name = ssoDepartment.departmentName || ssoDepartment.departmentCode || '미분류';
        return {
            name: name,
            code: ssoDepartment.departmentCode,
            externalId: ssoDepartment.id,
            order: order,
            managerId: undefined,
            parentDepartmentId: ssoDepartment.parentDepartmentId,
            externalCreatedAt: new Date(),
            externalUpdatedAt: new Date(),
        };
    }
    async syncDepartments(forceSync = false) {
        if (!this.syncEnabled && !forceSync) {
            this.logger.warn('부서 동기화가 비활성화되어 있습니다.');
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
            this.logger.log('부서 데이터 동기화를 시작합니다...');
            const ssoDepartments = await this.fetchExternalDepartments();
            totalProcessed = ssoDepartments.length;
            const departmentsToSave = [];
            let restoredCount = 0;
            for (let i = 0; i < ssoDepartments.length; i++) {
                const ssoDept = ssoDepartments[i];
                try {
                    let existingDepartment = await this.departmentService.findByExternalId(ssoDept.id);
                    if (!existingDepartment) {
                        const departmentsByCode = await this.departmentService.findByFilter({
                            code: ssoDept.departmentCode,
                        });
                        if (departmentsByCode.length > 0) {
                            existingDepartment = departmentsByCode[0];
                        }
                    }
                    const mappedData = this.mapSSODepartmentToDto(ssoDept, i);
                    if (existingDepartment) {
                        const wasDeleted = existingDepartment.deletedAt !== null;
                        const isRestored = wasDeleted;
                        if (isRestored) {
                            restoredCount++;
                            this.logger.log(`부서 ${existingDepartment.name} (${existingDepartment.code}): 삭제된 상태에서 복원`);
                        }
                        let needsUpdate = forceSync || isRestored;
                        if (existingDepartment.name !== mappedData.name ||
                            existingDepartment.code !== mappedData.code ||
                            existingDepartment.parentDepartmentId !==
                                mappedData.parentDepartmentId) {
                            needsUpdate = true;
                            this.logger.debug(`부서 ${existingDepartment.name}의 정보가 변경되어 업데이트합니다.`);
                        }
                        if (needsUpdate) {
                            Object.assign(existingDepartment, {
                                name: mappedData.name,
                                code: mappedData.code,
                                order: mappedData.order,
                                parentDepartmentId: mappedData.parentDepartmentId,
                                externalUpdatedAt: mappedData.externalUpdatedAt,
                                lastSyncAt: syncStartTime,
                                updatedBy: this.systemUserId,
                                deletedAt: null,
                            });
                            departmentsToSave.push(existingDepartment);
                            updated++;
                        }
                    }
                    else {
                        const newDepartment = new department_entity_1.Department(mappedData.name, mappedData.code, mappedData.externalId, mappedData.order, mappedData.managerId, mappedData.parentDepartmentId, mappedData.externalCreatedAt, mappedData.externalUpdatedAt);
                        newDepartment.lastSyncAt = syncStartTime;
                        newDepartment.createdBy = this.systemUserId;
                        newDepartment.updatedBy = this.systemUserId;
                        departmentsToSave.push(newDepartment);
                        created++;
                    }
                }
                catch (error) {
                    const errorMsg = `부서 ${ssoDept.departmentName} 처리 실패: ${error.message}`;
                    this.logger.error(errorMsg);
                    errors.push(errorMsg);
                }
            }
            if (departmentsToSave.length > 0) {
                try {
                    await this.departmentService.saveMany(departmentsToSave);
                    this.logger.log(`${departmentsToSave.length}개의 부서 데이터를 저장했습니다.`);
                }
                catch (saveError) {
                    if (saveError?.code === '23505' ||
                        saveError?.message?.includes('duplicate key')) {
                        this.logger.warn('일괄 저장 중 중복 키 에러 발생, 개별 저장으로 재시도합니다.');
                        let savedCount = 0;
                        let skippedCount = 0;
                        for (const department of departmentsToSave) {
                            try {
                                await this.departmentService.save(department);
                                savedCount++;
                            }
                            catch (individualError) {
                                if (individualError?.code === '23505' ||
                                    individualError?.message?.includes('duplicate key')) {
                                    this.logger.debug(`부서 ${department.name} (${department.code}) 중복 발생, 재조회 후 업데이트 시도`);
                                    try {
                                        let existingDepartment = await this.departmentService.findByExternalId(department.externalId);
                                        if (!existingDepartment) {
                                            const departmentsByCode = await this.departmentService.findByFilter({
                                                code: department.code,
                                            });
                                            if (departmentsByCode.length > 0) {
                                                existingDepartment = departmentsByCode[0];
                                            }
                                        }
                                        if (existingDepartment) {
                                            Object.assign(existingDepartment, {
                                                name: department.name,
                                                code: department.code,
                                                order: department.order,
                                                parentDepartmentId: department.parentDepartmentId,
                                                externalId: department.externalId,
                                                externalCreatedAt: department.externalCreatedAt,
                                                externalUpdatedAt: department.externalUpdatedAt,
                                                lastSyncAt: department.lastSyncAt,
                                                updatedBy: this.systemUserId,
                                            });
                                            await this.departmentService.save(existingDepartment);
                                            savedCount++;
                                            this.logger.debug(`부서 ${department.name} (${department.code}) 업데이트 완료`);
                                        }
                                        else {
                                            this.logger.warn(`부서 ${department.name} (${department.code}) 재조회 실패, 건너뜀. ` +
                                                `externalId=${department.externalId}, code=${department.code}`);
                                            skippedCount++;
                                        }
                                    }
                                    catch (retryError) {
                                        const errorMsg = `부서 ${department.name} 재조회/업데이트 실패: ${retryError.message}`;
                                        this.logger.error(errorMsg);
                                        errors.push(errorMsg);
                                        skippedCount++;
                                    }
                                }
                                else {
                                    const errorMsg = `부서 ${department.name} 저장 실패: ${individualError.message}`;
                                    this.logger.error(errorMsg);
                                    errors.push(errorMsg);
                                }
                            }
                        }
                        this.logger.log(`개별 저장 완료: ${savedCount}개 저장, ${skippedCount}개 건너뜀`);
                    }
                    else {
                        throw saveError;
                    }
                }
            }
            let deletedCount = 0;
            try {
                deletedCount = await this.SSO에_없는_부서를_삭제한다(ssoDepartments, syncStartTime);
                if (deletedCount > 0) {
                    this.logger.log(`SSO에 없는 부서 ${deletedCount}개를 삭제했습니다.`);
                }
            }
            catch (deleteError) {
                this.logger.error(`SSO에 없는 부서 삭제 처리 중 오류 발생: ${deleteError.message}`);
                errors.push(`부서 삭제 처리 실패: ${deleteError.message}`);
            }
            const result = {
                success: true,
                totalProcessed,
                created,
                updated,
                errors,
                syncedAt: syncStartTime,
            };
            this.logger.log(`부서 동기화 완료: 총 ${totalProcessed}개 처리, ${created}개 생성, ${updated}개 업데이트, ${restoredCount}개 복원, ${deletedCount}개 삭제`);
            return result;
        }
        catch (error) {
            let errorMsg;
            if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
                errorMsg = `부서 동기화 타임아웃: SSO 서버 응답이 지연되어 동기화를 완료할 수 없습니다. (${error.message})`;
                this.logger.warn(errorMsg +
                    ' 스케줄된 다음 동기화에서 재시도됩니다. SSO_TIMEOUT_MS 환경 변수를 늘려보세요.');
            }
            else {
                errorMsg = `부서 동기화 실패: ${error.message}`;
                this.logger.error(errorMsg);
            }
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
    async SSO에_없는_부서를_삭제한다(ssoDepartments, syncStartTime) {
        const syncDeleteMissing = this.configService.get('SYNC_DELETE_MISSING_DEPARTMENTS', 'true');
        const syncDeleteMissingEnabled = syncDeleteMissing === 'false' || syncDeleteMissing === false
            ? false
            : true;
        if (!syncDeleteMissingEnabled) {
            this.logger.debug('SSO에 없는 부서 삭제가 비활성화되어 있습니다. (SYNC_DELETE_MISSING_DEPARTMENTS=false)');
            return 0;
        }
        const ssoExternalIds = new Set(ssoDepartments.map((dept) => dept.id).filter((id) => id));
        const allLocalDepartments = await this.departmentService.findAll();
        const oneDayAgo = new Date(syncStartTime.getTime() - 24 * 60 * 60 * 1000);
        const departmentsToDelete = allLocalDepartments.filter((dept) => dept.externalId &&
            !ssoExternalIds.has(dept.externalId) &&
            !dept.deletedAt &&
            dept.lastSyncAt &&
            new Date(dept.lastSyncAt) > oneDayAgo);
        if (departmentsToDelete.length === 0) {
            return 0;
        }
        this.logger.log(`SSO에 없는 부서 ${departmentsToDelete.length}개를 삭제합니다.`);
        let deletedCount = 0;
        const departmentsToSave = [];
        for (const department of departmentsToDelete) {
            try {
                department.deletedAt = syncStartTime;
                department.lastSyncAt = syncStartTime;
                department.updatedBy = this.systemUserId;
                departmentsToSave.push(department);
                deletedCount++;
                this.logger.debug(`부서 ${department.name} (${department.code}, externalId: ${department.externalId})를 삭제합니다.`);
            }
            catch (error) {
                this.logger.error(`부서 ${department.name} (${department.code}) 삭제 처리 실패: ${error.message}`);
            }
        }
        if (departmentsToSave.length > 0) {
            try {
                await this.departmentService.saveMany(departmentsToSave);
                this.logger.log(`${deletedCount}개의 부서를 삭제했습니다.`);
            }
            catch (saveError) {
                this.logger.error(`삭제 처리된 부서 저장 실패: ${saveError.message}`);
                throw saveError;
            }
        }
        return deletedCount;
    }
    async scheduledSync() {
        const scheduledSyncEnabledValue = this.configService.get('SCHEDULED_SYNC_ENABLED', 'true');
        const scheduledSyncEnabled = scheduledSyncEnabledValue === 'false' ||
            scheduledSyncEnabledValue === false
            ? false
            : true;
        if (!scheduledSyncEnabled) {
            this.logger.debug('스케줄된 부서 동기화가 비활성화되어 있습니다.');
            return;
        }
        this.logger.log('스케줄된 부서 동기화를 시작합니다...');
        await this.syncDepartments();
    }
    async triggerManualSync() {
        this.logger.log('수동 부서 동기화를 시작합니다...');
        return this.syncDepartments(true);
    }
    async getDepartments(forceRefresh = false) {
        try {
            const localDepartments = await this.departmentService.findAll();
            if (forceRefresh || localDepartments.length === 0) {
                this.logger.log('부서 데이터를 SSO에서 동기화합니다...');
                await this.syncDepartments(forceRefresh);
                return this.departmentService.findAll();
            }
            const stats = await this.departmentService.getDepartmentStats();
            const lastSyncAt = stats.lastSyncAt;
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            if (!lastSyncAt || lastSyncAt < twentyFourHoursAgo) {
                this.logger.log('24시간 이상 동기화되지 않아 백그라운드에서 동기화를 시작합니다...');
                this.syncDepartments().catch((error) => {
                    this.logger.error('백그라운드 동기화 실패:', error.message);
                });
            }
            return localDepartments;
        }
        catch (error) {
            this.logger.error('부서 데이터 조회 실패:', error.message);
            throw new common_1.HttpException('부서 데이터 조회에 실패했습니다.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getDepartmentById(id, forceRefresh = false) {
        try {
            let department = await this.departmentService.findById(id);
            if (!department || forceRefresh) {
                await this.syncDepartments(forceRefresh);
                department = await this.departmentService.findById(id);
            }
            return department;
        }
        catch (error) {
            this.logger.error(`부서 ID ${id} 조회 실패:`, error.message);
            throw new common_1.HttpException('부서 조회에 실패했습니다.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getDepartmentByExternalId(externalId, forceRefresh = false) {
        try {
            let department = await this.departmentService.findByExternalId(externalId);
            if (!department || forceRefresh) {
                await this.syncDepartments(forceRefresh);
                department = await this.departmentService.findByExternalId(externalId);
            }
            return department;
        }
        catch (error) {
            this.logger.error(`외부 부서 ID ${externalId} 조회 실패:`, error.message);
            throw new common_1.HttpException('부서 조회에 실패했습니다.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.DepartmentSyncService = DepartmentSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DepartmentSyncService.prototype, "scheduledSync", null);
exports.DepartmentSyncService = DepartmentSyncService = DepartmentSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_2.Inject)(sso_1.SSOService)),
    __metadata("design:paramtypes", [department_service_1.DepartmentService,
        config_1.ConfigService, Object])
], DepartmentSyncService);
//# sourceMappingURL=department-sync.service.js.map