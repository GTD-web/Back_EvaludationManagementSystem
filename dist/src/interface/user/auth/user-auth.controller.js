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
exports.UserAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("../../../context/auth-context/auth.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const auth_decorators_1 = require("../../common/decorators/auth/auth.decorators");
const login_dto_1 = require("../../common/dto/auth/login.dto");
let UserAuthController = class UserAuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto) {
        const result = await this.authService.로그인한다(loginDto.email, loginDto.password);
        return {
            user: {
                id: result.user.id,
                externalId: result.user.externalId,
                email: result.user.email,
                name: result.user.name,
                employeeNumber: result.user.employeeNumber,
                roles: result.user.roles,
                status: result.user.status,
            },
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        };
    }
    async getMe(user) {
        const userInfo = await this.authService.역할포함사용자조회(user.employeeNumber);
        if (!userInfo.user) {
            return {
                id: user.id,
                externalId: '',
                email: user.email,
                name: user.name,
                employeeNumber: user.employeeNumber,
                roles: user.roles,
                status: '',
            };
        }
        return {
            id: userInfo.user.id,
            externalId: userInfo.user.externalId,
            email: userInfo.user.email,
            name: userInfo.user.name,
            employeeNumber: userInfo.user.employeeNumber,
            roles: userInfo.user.roles,
            status: userInfo.user.status,
        };
    }
};
exports.UserAuthController = UserAuthController;
__decorate([
    (0, auth_decorators_1.Login)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], UserAuthController.prototype, "login", null);
__decorate([
    (0, auth_decorators_1.GetMeAsUser)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserAuthController.prototype, "getMe", null);
exports.UserAuthController = UserAuthController = __decorate([
    (0, swagger_1.ApiTags)('A-0-0. 인증'),
    (0, common_1.Controller)('user/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], UserAuthController);
//# sourceMappingURL=user-auth.controller.js.map