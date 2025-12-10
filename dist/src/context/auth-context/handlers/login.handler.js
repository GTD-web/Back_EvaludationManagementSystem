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
var LoginHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginHandler = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const sso_1 = require("../../../domain/common/sso");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
let LoginHandler = LoginHandler_1 = class LoginHandler {
    ssoService;
    employeeService;
    logger = new common_1.Logger(LoginHandler_1.name);
    constructor(ssoService, employeeService) {
        this.ssoService = ssoService;
        this.employeeService = employeeService;
    }
    async execute(command) {
        const { email, password } = command;
        this.logger.log(`로그인 시도: ${email}`);
        let loginResult;
        try {
            loginResult = await this.ssoService.로그인한다(email, password);
            this.logger.log(`로그인 성공: ${email}`);
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            const errorMessage = error?.message ||
                error?.details ||
                '로그인 처리 중 오류가 발생했습니다.';
            const errorCode = error?.code;
            const errorStatus = error?.status;
            if (errorCode) {
                switch (errorCode) {
                    case 'NOT_FOUND':
                    case 'AUTHENTICATION_FAILED':
                    case 'INVALID_CREDENTIALS':
                    case 'AUTHENTICATION_ERROR':
                        const authErrorMessage = errorMessage &&
                            errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
                            ? errorMessage
                            : '이메일 또는 패스워드가 올바르지 않습니다.';
                        this.logger.warn(`로그인 실패: ${email} - ${authErrorMessage}`);
                        throw new common_1.UnauthorizedException(authErrorMessage);
                    case 'FORBIDDEN':
                        throw new common_1.ForbiddenException(errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
                            ? errorMessage
                            : '이 시스템에 대한 접근 권한이 없습니다.');
                    default:
                        this.logger.error(`예상치 못한 SSO 에러: ${errorCode} (status: ${errorStatus})`, error);
                        throw new common_1.InternalServerErrorException(errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
                            ? errorMessage
                            : '로그인 처리 중 오류가 발생했습니다.');
                }
            }
            if (errorStatus) {
                if (errorStatus === 401) {
                    const authErrorMessage = errorMessage &&
                        errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
                        ? errorMessage
                        : '이메일 또는 패스워드가 올바르지 않습니다.';
                    this.logger.warn(`로그인 실패: ${email} - ${authErrorMessage}`);
                    throw new common_1.UnauthorizedException(authErrorMessage);
                }
                else if (errorStatus === 403) {
                    throw new common_1.ForbiddenException(errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
                        ? errorMessage
                        : '이 시스템에 대한 접근 권한이 없습니다.');
                }
            }
            this.logger.error('알 수 없는 SSO 에러:', error);
            throw new common_1.InternalServerErrorException(errorMessage !== '로그인 처리 중 오류가 발생했습니다.'
                ? errorMessage
                : '로그인 처리 중 오류가 발생했습니다.');
        }
        this.logger.log(`로그인 성공: ${loginResult.email} (${loginResult.employeeNumber})`);
        const employee = await this.employeeService.findByEmployeeNumber(loginResult.employeeNumber);
        if (!employee) {
            this.logger.warn(`시스템에 등록되지 않은 직원의 로그인 시도: ${loginResult.employeeNumber} (${loginResult.email})`);
            throw new common_1.ForbiddenException('시스템에 등록되지 않은 사용자입니다. 관리자에게 문의하세요.');
        }
        const roles = loginResult.systemRoles?.['EMS-PROD'] || [];
        this.logger.log(`로그인 결과의 systemRoles: ${JSON.stringify(loginResult.systemRoles)}`);
        this.logger.log(`추출된 EMS-PROD roles: [${roles.join(', ')}]`);
        if (roles.includes('admin') && !employee.isAccessible) {
            this.logger.warn(`접근 권한이 없는 관리자의 로그인 시도: ${employee.employeeNumber} (${employee.email})`);
            throw new common_1.ForbiddenException('시스템 접근 권한이 없습니다. 관리자에게 문의하세요.');
        }
        try {
            await this.employeeService.updateRoles(employee.id, roles);
            this.logger.log(`직원 ${employee.employeeNumber}의 역할 정보를 업데이트했습니다.`);
        }
        catch (error) {
            this.logger.error(`직원 ${employee.employeeNumber}의 역할 업데이트 실패:`, error.message);
        }
        const userInfo = {
            id: employee.id,
            externalId: employee.externalId,
            email: employee.email,
            name: employee.name,
            employeeNumber: employee.employeeNumber,
            roles: roles,
            status: employee.status,
        };
        return {
            user: userInfo,
            accessToken: loginResult.accessToken,
            refreshToken: loginResult.refreshToken,
        };
    }
};
exports.LoginHandler = LoginHandler;
exports.LoginHandler = LoginHandler = LoginHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(sso_1.SSOService)),
    __metadata("design:paramtypes", [Object, employee_service_1.EmployeeService])
], LoginHandler);
//# sourceMappingURL=login.handler.js.map