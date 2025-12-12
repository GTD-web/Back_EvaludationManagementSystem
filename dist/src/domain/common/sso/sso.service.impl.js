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
var SSOServiceImpl_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOServiceImpl = void 0;
const common_1 = require("@nestjs/common");
const interfaces_1 = require("./interfaces");
const json_storage_util_1 = require("./utils/json-storage.util");
let SSOServiceImpl = SSOServiceImpl_1 = class SSOServiceImpl {
    config;
    injectedSystemName;
    injectedEnableJsonStorage;
    logger = new common_1.Logger(SSOServiceImpl_1.name);
    sdkClient;
    systemName;
    initialized = false;
    enableJsonStorage;
    constructor(config, injectedSystemName, injectedEnableJsonStorage) {
        this.config = config;
        this.injectedSystemName = injectedSystemName;
        this.injectedEnableJsonStorage = injectedEnableJsonStorage;
        this.systemName = injectedSystemName;
        const isServerless = !!process.env.VERCEL ||
            !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
            !!process.env.GOOGLE_CLOUD_FUNCTION ||
            !!process.env.AZURE_FUNCTIONS_ENVIRONMENT;
        this.enableJsonStorage =
            !isServerless &&
                (injectedEnableJsonStorage ??
                    process.env.SSO_ENABLE_JSON_STORAGE === 'true');
        this.logger.log(`SSO 클라이언트 초기화 중... baseUrl: ${this.config.baseUrl}, timeoutMs: ${this.config.timeoutMs}, retries: ${this.config.retries}, retryDelay: ${this.config.retryDelay}, JSON 저장: ${this.enableJsonStorage}`);
        const { SSOClient: SDKSSOClientClass } = require('@lumir-company/sso-sdk');
        this.sdkClient = new SDKSSOClientClass({
            baseUrl: this.config.baseUrl,
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            systemName: this.config.systemName || this.systemName,
            timeoutMs: this.config.timeoutMs,
            retries: this.config.retries,
            retryDelay: this.config.retryDelay,
            enableLogging: this.config.enableLogging,
        });
        this.logger.log('SSO 클라이언트 인스턴스 생성 완료');
    }
    async onModuleInit() {
        await this.초기화한다();
    }
    async 초기화한다() {
        if (this.initialized) {
            return;
        }
        try {
            this.logger.log(`SSO 클라이언트 초기화 시작... baseUrl: ${this.config.baseUrl}, systemName: ${this.systemName}`);
            const startTime = Date.now();
            await this.sdkClient.initialize();
            const elapsedTime = Date.now() - startTime;
            this.initialized = true;
            this.logger.log(`SSO 클라이언트 초기화 완료 (소요 시간: ${elapsedTime}ms)`);
        }
        catch (error) {
            this.logger.error(`SSO 클라이언트 초기화 실패: ${error.message}`, error.stack);
            this.logger.error(`초기화 실패 상세: code=${error?.code}, status=${error?.status}, baseUrl=${this.config.baseUrl}`);
            throw error;
        }
    }
    초기화확인() {
        if (!this.initialized) {
            throw new Error('SSO 클라이언트가 초기화되지 않았습니다. 먼저 초기화한다()를 호출하세요.');
        }
    }
    저장한다(methodName, params, data) {
        if (this.enableJsonStorage) {
            json_storage_util_1.JsonStorageUtil.saveResponse(methodName, params, data);
        }
    }
    async 로그인한다(email, password) {
        this.초기화확인();
        let result;
        try {
            result = await this.sdkClient.sso.login(email, password);
            this.logger.log(`로그인 성공: ${email}`);
        }
        catch (error) {
            this.logger.error('로그인 실패', error);
            throw error;
        }
        this.logger.log(`로그인 결과: ${JSON.stringify(result)}`);
        this.저장한다('로그인한다', { email }, result);
        return result;
    }
    시스템역할을검증한다(loginResult) {
        const systemRoles = loginResult.systemRoles;
        if (!systemRoles) {
            this.logger.warn(`사용자 ${loginResult.email}의 systemRoles가 존재하지 않습니다.`);
            throw new common_1.ForbiddenException(`이 시스템(${this.systemName})에 대한 접근 권한이 없습니다.`);
        }
        const roles = systemRoles[this.systemName];
        if (!roles || roles.length === 0) {
            this.logger.warn(`사용자 ${loginResult.email}에게 ${this.systemName} 시스템 역할이 없습니다. ` +
                `보유 시스템: ${Object.keys(systemRoles).join(', ')}`);
            throw new common_1.ForbiddenException(`이 시스템(${this.systemName})에 대한 접근 권한이 없습니다. ` +
                `시스템 관리자에게 문의하세요.`);
        }
    }
    async 토큰을검증한다(accessToken) {
        this.초기화확인();
        const result = await this.sdkClient.sso.verifyToken(accessToken);
        if (!result.valid) {
            this.logger.warn('유효하지 않은 토큰 검증 시도');
            throw new common_1.UnauthorizedException('유효하지 않은 토큰입니다.');
        }
        this.저장한다('토큰을검증한다', { accessToken: '***' }, result);
        return result;
    }
    async 토큰을갱신한다(refreshToken) {
        this.초기화확인();
        const result = await this.sdkClient.sso.refreshToken(refreshToken);
        this.저장한다('토큰을갱신한다', { refreshToken: '***' }, result);
        return result;
    }
    async 비밀번호를확인한다(accessToken, password, email) {
        this.초기화확인();
        const result = await this.sdkClient.sso.checkPassword(accessToken, password, email);
        this.저장한다('비밀번호를확인한다', { accessToken: '***', email }, result);
        return result;
    }
    async 비밀번호를변경한다(accessToken, newPassword) {
        this.초기화확인();
        const result = await this.sdkClient.sso.changePassword(accessToken, newPassword);
        this.저장한다('비밀번호를변경한다', { accessToken: '***' }, result);
        return result;
    }
    async 직원정보를조회한다(params) {
        this.초기화확인();
        try {
            const result = await this.sdkClient.organization.getEmployee({
                employeeNumber: params.employeeNumber,
                employeeId: params.employeeId,
                withDetail: params.withDetail,
            });
            const employeeInfo = this.mapToEmployeeInfo(result);
            this.저장한다('직원정보를조회한다', params, employeeInfo);
            return employeeInfo;
        }
        catch (error) {
            this.logger.error('직원 정보 조회 실패', error);
            throw error;
        }
    }
    async 여러직원정보를조회한다(params) {
        this.초기화확인();
        try {
            const result = await this.sdkClient.organization.getEmployees({
                identifiers: params.identifiers,
                withDetail: params.withDetail,
                includeTerminated: params.includeTerminated,
            });
            const employees = Array.isArray(result)
                ? result
                : result?.employees || result?.data || [];
            if (!Array.isArray(employees)) {
                this.logger.warn('예상치 못한 응답 형식:', JSON.stringify(result).substring(0, 200));
                return [];
            }
            const employeeInfos = employees.map((emp) => this.mapToEmployeeInfo(emp));
            this.저장한다('여러직원정보를조회한다', params, employeeInfos);
            return employeeInfos;
        }
        catch (error) {
            this.logger.error('여러 직원 정보 조회 실패', error);
            throw error;
        }
    }
    async 여러직원원시정보를조회한다(params) {
        this.초기화확인();
        try {
            const result = await this.sdkClient.organization.getEmployees({
                identifiers: params.identifiers,
                withDetail: params.withDetail,
                includeTerminated: params.includeTerminated,
            });
            const employees = Array.isArray(result)
                ? result
                : result?.employees || result?.data || [];
            if (!Array.isArray(employees)) {
                this.logger.warn('예상치 못한 응답 형식:', JSON.stringify(result).substring(0, 200));
                return [];
            }
            this.저장한다('여러직원원시정보를조회한다', params, employees);
            return employees;
        }
        catch (error) {
            this.logger.error('여러 직원 원시 정보 조회 실패', error);
            throw error;
        }
    }
    async 부서계층구조를조회한다(params) {
        this.초기화확인();
        try {
            this.logger.log(`부서 계층구조 조회 요청 시작... baseUrl: ${this.config.baseUrl}`);
            const startTime = Date.now();
            const result = await this.sdkClient.organization.getDepartmentHierarchy({
                rootDepartmentId: params?.rootDepartmentId,
                maxDepth: params?.maxDepth,
                withEmployeeDetail: params?.withEmployeeDetail,
                includeEmptyDepartments: params?.includeEmptyDepartments,
            });
            const elapsedTime = Date.now() - startTime;
            this.logger.log(`부서 계층구조 조회 완료 (소요 시간: ${elapsedTime}ms)`);
            const hierarchy = {
                departments: result.departments.map((dept) => this.mapToDepartmentNode(dept)),
                totalDepartments: result.totalDepartments,
                totalEmployees: result.totalEmployees,
            };
            this.저장한다('부서계층구조를조회한다', params || {}, hierarchy);
            return hierarchy;
        }
        catch (error) {
            if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
                this.logger.error(`부서 계층구조 조회 타임아웃: ${error.message}. 현재 타임아웃 설정: ${this.config.timeoutMs}ms. SSO 서버 응답이 지연되고 있습니다.`);
                this.logger.error(`타임아웃 상세 정보: baseUrl=${this.config.baseUrl}, 요청이 SSO 서버에 도달했는지 확인이 필요합니다.`);
            }
            else {
                this.logger.error('부서 계층구조 조회 실패', error);
                this.logger.error(`에러 상세: code=${error?.code}, status=${error?.status}, message=${error?.message}, baseUrl=${this.config.baseUrl}`);
            }
            throw error;
        }
    }
    async FCM토큰을구독한다(params) {
        this.초기화확인();
        try {
            const result = await this.sdkClient.fcm.subscribe({
                employeeNumber: params.employeeNumber,
                fcmToken: params.fcmToken,
                deviceType: params.deviceType,
            });
            const subscribeResult = {
                success: true,
                fcmToken: result.fcmToken,
                employeeNumber: result.employeeNumber,
                deviceType: result.deviceType,
            };
            this.저장한다('FCM토큰을구독한다', params, subscribeResult);
            return subscribeResult;
        }
        catch (error) {
            this.logger.error('FCM 토큰 구독 실패', error);
            throw error;
        }
    }
    async FCM토큰을구독해지한다(params) {
        this.초기화확인();
        try {
            const result = await this.sdkClient.fcm.unsubscribe({
                employeeNumber: params.employeeNumber,
            });
            const unsubscribeResult = {
                success: result.success || true,
                deletedCount: result.deletedCount || 0,
                message: result.message,
            };
            this.저장한다('FCM토큰을구독해지한다', params, unsubscribeResult);
            return unsubscribeResult;
        }
        catch (error) {
            this.logger.error('FCM 토큰 구독 해지 실패', error);
            throw error;
        }
    }
    async FCM토큰을조회한다(params) {
        this.초기화확인();
        try {
            const result = await this.sdkClient.fcm.getToken({
                employeeNumber: params.employeeNumber,
            });
            const tokenInfo = {
                employeeNumber: result.employeeNumber,
                tokens: result.tokens.map((token) => ({
                    fcmToken: token.fcmToken,
                    deviceType: token.deviceType,
                    createdAt: new Date(token.createdAt),
                })),
            };
            this.저장한다('FCM토큰을조회한다', params, tokenInfo);
            return tokenInfo;
        }
        catch (error) {
            this.logger.error('FCM 토큰 조회 실패', error);
            throw error;
        }
    }
    async 여러직원의FCM토큰을조회한다(params) {
        this.초기화확인();
        try {
            const result = await this.sdkClient.fcm.getMultipleTokens({
                employeeNumbers: params.employeeNumbers,
            });
            const tokensInfo = {
                totalEmployees: result.totalEmployees,
                totalTokens: result.totalTokens,
                byEmployee: result.byEmployee.map((emp) => ({
                    employeeNumber: emp.employeeNumber,
                    tokens: emp.tokens.map((token) => ({
                        fcmToken: token.fcmToken,
                        deviceType: token.deviceType,
                        createdAt: new Date(token.createdAt),
                    })),
                })),
                allTokens: result.allTokens.map((token) => ({
                    fcmToken: token.fcmToken,
                    deviceType: token.deviceType,
                    createdAt: new Date(token.createdAt),
                })),
            };
            this.저장한다('여러직원의FCM토큰을조회한다', params, tokensInfo);
            return tokensInfo;
        }
        catch (error) {
            this.logger.error('여러 직원의 FCM 토큰 조회 실패', error);
            throw error;
        }
    }
    async 사번으로직원을조회한다(employeeNumber) {
        return this.직원정보를조회한다({
            employeeNumber,
            withDetail: true,
        });
    }
    async 이메일로직원을조회한다(email) {
        const employees = await this.여러직원정보를조회한다({
            withDetail: true,
        });
        return employees.find((emp) => emp.email === email) || null;
    }
    async 모든부서정보를조회한다(params) {
        const hierarchy = await this.부서계층구조를조회한다({
            ...params,
            includeEmptyDepartments: true,
            withEmployeeDetail: false,
        });
        const departments = [];
        const flattenDepartments = (nodes) => {
            for (const node of nodes) {
                departments.push({
                    id: node.id,
                    departmentCode: node.departmentCode,
                    departmentName: node.departmentName,
                    parentDepartmentId: node.parentDepartmentId,
                });
                if (node.children && node.children.length > 0) {
                    flattenDepartments(node.children);
                }
            }
        };
        flattenDepartments(hierarchy.departments);
        this.저장한다('모든부서정보를조회한다', params || {}, departments);
        return departments;
    }
    async 모든직원정보를조회한다(params) {
        const hierarchy = await this.부서계층구조를조회한다({
            ...params,
            includeEmptyDepartments: true,
            withEmployeeDetail: true,
        });
        const employees = [];
        const flattenEmployees = (nodes) => {
            for (const node of nodes) {
                if (node.employees && node.employees.length > 0) {
                    employees.push(...node.employees);
                }
                if (node.children && node.children.length > 0) {
                    flattenEmployees(node.children);
                }
            }
        };
        flattenEmployees(hierarchy.departments);
        this.저장한다('모든직원정보를조회한다', params || {}, employees);
        return employees;
    }
    async 직원관리자정보를조회한다() {
        this.초기화확인();
        try {
            this.logger.log(`직원 관리자 정보 조회 요청 시작... baseUrl: ${this.config.baseUrl}`);
            const startTime = Date.now();
            const result = await this.sdkClient.organization.getEmployeesManagers();
            const elapsedTime = Date.now() - startTime;
            this.logger.log(`직원 관리자 정보 조회 완료 (소요 시간: ${elapsedTime}ms)`);
            this.저장한다('직원관리자정보를조회한다', {}, result);
            return result;
        }
        catch (error) {
            if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
                this.logger.error(`직원 관리자 정보 조회 타임아웃: ${error.message}. 현재 타임아웃 설정: ${this.config.timeoutMs}ms. SSO 서버 응답이 지연되고 있습니다.`);
                this.logger.error(`타임아웃 상세 정보: baseUrl=${this.config.baseUrl}, 요청이 SSO 서버에 도달했는지 확인이 필요합니다.`);
            }
            else {
                this.logger.error('직원 관리자 정보 조회 실패', error);
                this.logger.error(`에러 상세: code=${error?.code}, status=${error?.status}, message=${error?.message}, baseUrl=${this.config.baseUrl}`);
            }
            throw error;
        }
    }
    mapToEmployeeInfo(data) {
        const mapStatusToEnum = (status) => {
            if (!status)
                return undefined;
            if (status === '재직중' || status === 'ACTIVE' || status === 'active') {
                return interfaces_1.EmployeeStatus.ACTIVE;
            }
            if (status === '휴직' || status === 'ON_LEAVE' || status === 'on_leave') {
                return interfaces_1.EmployeeStatus.ON_LEAVE;
            }
            if (status === '퇴사' || status === 'TERMINATED' || status === 'terminated') {
                return interfaces_1.EmployeeStatus.TERMINATED;
            }
            return undefined;
        };
        const employeeStatus = mapStatusToEnum(data.status);
        const isTerminated = data.isTerminated !== undefined
            ? data.isTerminated
            : employeeStatus === interfaces_1.EmployeeStatus.TERMINATED ||
                (employeeStatus !== interfaces_1.EmployeeStatus.ACTIVE && employeeStatus !== interfaces_1.EmployeeStatus.ON_LEAVE);
        return {
            id: data.id,
            employeeNumber: data.employeeNumber,
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber || undefined,
            isTerminated,
            status: employeeStatus,
            hireDate: data.hireDate,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            department: data.department
                ? {
                    id: data.department.id,
                    departmentCode: data.department.departmentCode,
                    departmentName: data.department.departmentName,
                    parentDepartmentId: data.department.parentDepartmentId,
                    type: data.department.type,
                    order: data.department.order,
                }
                : undefined,
            position: data.position
                ? {
                    id: data.position.id,
                    positionName: data.position.positionTitle || data.position.positionName,
                    positionLevel: data.position.level || data.position.positionLevel,
                    positionCode: data.position.positionCode,
                    hasManagementAuthority: data.position.hasManagementAuthority,
                }
                : undefined,
            jobTitle: data.rank
                ? {
                    id: data.rank.id,
                    jobTitleName: data.rank.rankName,
                    jobTitleLevel: data.rank.level,
                    jobTitleCode: data.rank.rankCode,
                }
                : data.jobTitle
                    ? {
                        id: data.jobTitle.id,
                        jobTitleName: data.jobTitle.jobTitleName,
                        jobTitleLevel: data.jobTitle.jobTitleLevel,
                        jobTitleCode: data.jobTitle.jobTitleCode,
                    }
                    : undefined,
        };
    }
    mapToDepartmentNode(data) {
        const childDepartments = data.childDepartments || data.children || [];
        return {
            id: data.id,
            departmentCode: data.departmentCode,
            departmentName: data.departmentName,
            parentDepartmentId: data.parentDepartmentId,
            depth: data.depth,
            employeeCount: data.employeeCount,
            employees: Array.isArray(data.employees)
                ? data.employees.map((emp) => this.mapToEmployeeInfo(emp))
                : [],
            children: Array.isArray(childDepartments)
                ? childDepartments.map((child) => this.mapToDepartmentNode(child))
                : [],
            type: data.type,
            order: data.order,
        };
    }
};
exports.SSOServiceImpl = SSOServiceImpl;
exports.SSOServiceImpl = SSOServiceImpl = SSOServiceImpl_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('SSO_CONFIG')),
    __param(1, (0, common_1.Inject)('SSO_SYSTEM_NAME')),
    __param(2, (0, common_1.Inject)('SSO_ENABLE_JSON_STORAGE')),
    __metadata("design:paramtypes", [Object, String, Boolean])
], SSOServiceImpl);
//# sourceMappingURL=sso.service.impl.js.map