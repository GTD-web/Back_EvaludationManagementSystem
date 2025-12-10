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
var RolesGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = exports.ROLES_GUARD_OPTIONS = void 0;
const organization_management_context_1 = require("../../../context/organization-management-context");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const public_decorator_1 = require("../decorators/public.decorator");
exports.ROLES_GUARD_OPTIONS = 'ROLES_GUARD_OPTIONS';
let RolesGuard = RolesGuard_1 = class RolesGuard {
    reflector;
    organizationManagementService;
    options;
    logger = new common_1.Logger(RolesGuard_1.name);
    rolesRequiringAccessibilityCheck;
    constructor(reflector, organizationManagementService, options) {
        this.reflector = reflector;
        this.organizationManagementService = organizationManagementService;
        this.options = options;
        this.rolesRequiringAccessibilityCheck =
            options?.rolesRequiringAccessibilityCheck ?? [];
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            this.logger.error('사용자 정보가 없습니다. JwtAuthGuard가 먼저 실행되어야 합니다.');
            throw new common_1.ForbiddenException('인증 정보가 없습니다.');
        }
        const userRoles = user.roles || [];
        const requiredRoles = this.reflector.getAllAndOverride('roles', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (requiredRoles && requiredRoles.length > 0) {
            const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));
            if (!hasRequiredRole) {
                this.logger.warn(`접근 거부: 사용자 ${user.email}은(는) 필요한 역할이 없습니다. ` +
                    `필요 역할: [${requiredRoles.join(', ')}], ` +
                    `보유 역할: [${userRoles.join(', ')}]`);
                throw new common_1.ForbiddenException(`이 작업을 수행할 권한이 없습니다. 필요한 역할: ${requiredRoles.join(', ')}`);
            }
        }
        const needsAccessibilityCheck = this.rolesRequiringAccessibilityCheck.some((role) => userRoles.includes(role));
        if (needsAccessibilityCheck) {
            const isAccessible = await this.organizationManagementService.사번으로_관리자권한있는가(user.employeeNumber);
            if (!isAccessible) {
                this.logger.warn(`접근 거부: 사용자 ${user.email}(${user.employeeNumber})은(는) ` +
                    `역할을 가지고 있지만 관리자 권한이 없습니다. ` +
                    `역할: [${userRoles.join(', ')}]`);
                throw new common_1.ForbiddenException('EMS 관리자 권한이 없습니다. EMS 관리자에게 문의하세요.');
            }
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = RolesGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)(exports.ROLES_GUARD_OPTIONS)),
    __metadata("design:paramtypes", [core_1.Reflector,
        organization_management_context_1.OrganizationManagementService, Object])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map