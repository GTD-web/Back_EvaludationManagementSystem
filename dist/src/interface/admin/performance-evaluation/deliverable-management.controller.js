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
exports.DeliverableManagementController = void 0;
const deliverable_business_service_1 = require("../../../business/deliverable/deliverable-business.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const decorators_1 = require("../../common/decorators");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deliverable_api_decorators_1 = require("../../common/decorators/performance-evaluation/deliverable-api.decorators");
const deliverable_dto_1 = require("../../common/dto/performance-evaluation/deliverable.dto");
let DeliverableManagementController = class DeliverableManagementController {
    deliverableBusinessService;
    constructor(deliverableBusinessService) {
        this.deliverableBusinessService = deliverableBusinessService;
    }
    async createDeliverable(dto, user) {
        const createdBy = user.id;
        const deliverable = await this.deliverableBusinessService.산출물을_생성한다({
            name: dto.name,
            type: dto.type,
            employeeId: dto.employeeId,
            wbsItemId: dto.wbsItemId,
            description: dto.description,
            filePath: dto.filePath,
            createdBy,
        });
        return this.toResponseDto(deliverable);
    }
    async bulkCreateDeliverables(dto, user) {
        const createdBy = user.id;
        const result = await this.deliverableBusinessService.산출물을_벌크_생성한다({
            deliverables: dto.deliverables.map((d) => ({
                name: d.name,
                description: d.description,
                type: d.type,
                filePath: d.filePath,
                employeeId: d.employeeId,
                wbsItemId: d.wbsItemId,
            })),
            createdBy,
        });
        return {
            successCount: result.successCount,
            failedCount: result.failedCount,
            createdIds: result.createdIds,
            failedItems: result.failedItems,
        };
    }
    async bulkDeleteDeliverables(dto, user) {
        const deletedBy = user.id;
        const result = await this.deliverableBusinessService.산출물을_벌크_삭제한다({
            ids: dto.deliverableIds,
            deletedBy,
        });
        return {
            successCount: result.successCount,
            failedCount: result.failedCount,
            failedIds: result.failedIds,
        };
    }
    async updateDeliverable(id, dto, user) {
        const updatedBy = user.id;
        const deliverable = await this.deliverableBusinessService.산출물을_수정한다({
            id,
            updatedBy,
            name: dto.name,
            type: dto.type,
            description: dto.description,
            filePath: dto.filePath,
            employeeId: dto.employeeId,
            wbsItemId: dto.wbsItemId,
            isActive: dto.isActive,
        });
        return this.toResponseDto(deliverable);
    }
    async deleteDeliverable(id, user) {
        const deletedBy = user.id;
        await this.deliverableBusinessService.산출물을_삭제한다(id, deletedBy);
    }
    async getEmployeeDeliverables(employeeId, query) {
        const activeOnly = query.activeOnly ?? true;
        const deliverables = await this.deliverableBusinessService.직원별_산출물을_조회한다(employeeId, activeOnly);
        return {
            deliverables: deliverables.map((d) => this.toResponseDto(d)),
            total: deliverables.length,
        };
    }
    async getWbsDeliverables(wbsItemId, query) {
        const activeOnly = query.activeOnly ?? true;
        const deliverables = await this.deliverableBusinessService.WBS항목별_산출물을_조회한다(wbsItemId, activeOnly);
        return {
            deliverables: deliverables.map((d) => this.toResponseDto(d)),
            total: deliverables.length,
        };
    }
    async getDeliverableDetail(id) {
        const deliverable = await this.deliverableBusinessService.산출물_상세를_조회한다(id);
        return this.toResponseDto(deliverable);
    }
    toResponseDto(deliverable) {
        return {
            id: deliverable.id,
            name: deliverable.name,
            description: deliverable.description,
            type: deliverable.type,
            filePath: deliverable.filePath,
            employeeId: deliverable.employeeId,
            wbsItemId: deliverable.wbsItemId,
            mappedDate: deliverable.mappedDate,
            mappedBy: deliverable.mappedBy,
            isActive: deliverable.isActive,
            createdAt: deliverable.createdAt,
            updatedAt: deliverable.updatedAt,
            deletedAt: deliverable.deletedAt,
            createdBy: deliverable.createdBy,
            updatedBy: deliverable.updatedBy,
            version: deliverable.version,
        };
    }
};
exports.DeliverableManagementController = DeliverableManagementController;
__decorate([
    (0, deliverable_api_decorators_1.CreateDeliverable)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deliverable_dto_1.CreateDeliverableDto, Object]),
    __metadata("design:returntype", Promise)
], DeliverableManagementController.prototype, "createDeliverable", null);
__decorate([
    (0, deliverable_api_decorators_1.BulkCreateDeliverables)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deliverable_dto_1.BulkCreateDeliverablesDto, Object]),
    __metadata("design:returntype", Promise)
], DeliverableManagementController.prototype, "bulkCreateDeliverables", null);
__decorate([
    (0, deliverable_api_decorators_1.BulkDeleteDeliverables)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [deliverable_dto_1.BulkDeleteDeliverablesDto, Object]),
    __metadata("design:returntype", Promise)
], DeliverableManagementController.prototype, "bulkDeleteDeliverables", null);
__decorate([
    (0, deliverable_api_decorators_1.UpdateDeliverable)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, deliverable_dto_1.UpdateDeliverableDto, Object]),
    __metadata("design:returntype", Promise)
], DeliverableManagementController.prototype, "updateDeliverable", null);
__decorate([
    (0, deliverable_api_decorators_1.DeleteDeliverable)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeliverableManagementController.prototype, "deleteDeliverable", null);
__decorate([
    (0, deliverable_api_decorators_1.GetEmployeeDeliverables)(),
    __param(0, (0, decorators_1.ParseUUID)('employeeId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, deliverable_dto_1.GetDeliverablesQueryDto]),
    __metadata("design:returntype", Promise)
], DeliverableManagementController.prototype, "getEmployeeDeliverables", null);
__decorate([
    (0, deliverable_api_decorators_1.GetWbsDeliverables)(),
    __param(0, (0, decorators_1.ParseUUID)('wbsItemId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, deliverable_dto_1.GetDeliverablesQueryDto]),
    __metadata("design:returntype", Promise)
], DeliverableManagementController.prototype, "getWbsDeliverables", null);
__decorate([
    (0, deliverable_api_decorators_1.GetDeliverableDetail)(),
    __param(0, (0, decorators_1.ParseUUID)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliverableManagementController.prototype, "getDeliverableDetail", null);
exports.DeliverableManagementController = DeliverableManagementController = __decorate([
    (0, swagger_1.ApiTags)('C-2. 관리자 - 성과평가 - 산출물'),
    (0, swagger_1.ApiBearerAuth)('Bearer'),
    (0, decorators_1.Roles)('admin'),
    (0, common_1.Controller)('admin/performance-evaluation/deliverables'),
    __metadata("design:paramtypes", [deliverable_business_service_1.DeliverableBusinessService])
], DeliverableManagementController);
//# sourceMappingURL=deliverable-management.controller.js.map