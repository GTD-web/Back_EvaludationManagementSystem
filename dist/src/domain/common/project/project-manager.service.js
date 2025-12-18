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
exports.ProjectManagerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_manager_entity_1 = require("./project-manager.entity");
let ProjectManagerService = class ProjectManagerService {
    projectManagerRepository;
    constructor(projectManagerRepository) {
        this.projectManagerRepository = projectManagerRepository;
    }
    async 생성한다(data, createdBy) {
        const existing = await this.projectManagerRepository.findOne({
            where: { managerId: data.managerId },
        });
        if (existing) {
            throw new common_1.ConflictException(`이미 등록된 매니저 ID입니다: ${data.managerId}`);
        }
        const manager = project_manager_entity_1.ProjectManager.생성한다(data, createdBy);
        const saved = await this.projectManagerRepository.save(manager);
        return saved.DTO로_변환한다();
    }
    async 목록_조회한다(options = {}) {
        const page = options.page || 1;
        const limit = options.limit || 50;
        const skip = (page - 1) * limit;
        const queryBuilder = this.projectManagerRepository.createQueryBuilder('pm');
        if (!options.filter?.includeDeleted) {
            queryBuilder.where('pm.deletedAt IS NULL');
        }
        if (options.filter?.isActive !== undefined) {
            queryBuilder.andWhere('pm.isActive = :isActive', {
                isActive: options.filter.isActive,
            });
        }
        if (options.filter?.search) {
            queryBuilder.andWhere('(pm.name LIKE :search OR pm.email LIKE :search OR pm.employeeNumber LIKE :search)', { search: `%${options.filter.search}%` });
        }
        queryBuilder.orderBy('pm.name', 'ASC').skip(skip).take(limit);
        const [managers, total] = await queryBuilder.getManyAndCount();
        return {
            managers: managers.map((m) => m.DTO로_변환한다()),
            total,
            page,
            limit,
        };
    }
    async ID로_조회한다(id) {
        const manager = await this.projectManagerRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return manager ? manager.DTO로_변환한다() : null;
    }
    async managerId로_조회한다(managerId) {
        const manager = await this.projectManagerRepository.findOne({
            where: { managerId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return manager ? manager.DTO로_변환한다() : null;
    }
    async 수정한다(id, data, updatedBy) {
        const manager = await this.projectManagerRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!manager) {
            throw new common_1.NotFoundException(`ID ${id}에 해당하는 PM을 찾을 수 없습니다.`);
        }
        manager.업데이트한다(data, updatedBy);
        const saved = await this.projectManagerRepository.save(manager);
        return saved.DTO로_변환한다();
    }
    async 삭제한다(id, deletedBy) {
        const manager = await this.projectManagerRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!manager) {
            throw new common_1.NotFoundException(`ID ${id}에 해당하는 PM을 찾을 수 없습니다.`);
        }
        manager.삭제한다(deletedBy);
        await this.projectManagerRepository.save(manager);
    }
    async 활성화된_managerId_목록_조회한다() {
        const managers = await this.projectManagerRepository.find({
            where: { isActive: true, deletedAt: (0, typeorm_2.IsNull)() },
            select: ['managerId'],
        });
        return managers.map((m) => m.managerId);
    }
    async managerId로_조회한다_삭제포함(managerId) {
        const manager = await this.projectManagerRepository.findOne({
            where: { managerId },
        });
        return manager ? manager.DTO로_변환한다() : null;
    }
    async managerId로_수정한다(managerId, data, updatedBy) {
        const manager = await this.projectManagerRepository.findOne({
            where: { managerId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!manager) {
            throw new common_1.NotFoundException(`매니저 ID ${managerId}에 해당하는 PM을 찾을 수 없습니다.`);
        }
        manager.업데이트한다(data, updatedBy);
        const saved = await this.projectManagerRepository.save(manager);
        return saved.DTO로_변환한다();
    }
    async managerId로_삭제한다(managerId, deletedBy) {
        const manager = await this.projectManagerRepository.findOne({
            where: { managerId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!manager) {
            throw new common_1.NotFoundException(`매니저 ID ${managerId}에 해당하는 PM을 찾을 수 없습니다.`);
        }
        manager.삭제한다(deletedBy);
        await this.projectManagerRepository.save(manager);
    }
    async managerId로_복구한다(managerId, restoredBy) {
        const manager = await this.projectManagerRepository.findOne({
            where: { managerId },
        });
        if (!manager) {
            throw new common_1.NotFoundException(`매니저 ID ${managerId}에 해당하는 PM을 찾을 수 없습니다.`);
        }
        manager.deletedAt = undefined;
        manager.updatedBy = restoredBy;
        const saved = await this.projectManagerRepository.save(manager);
        return saved.DTO로_변환한다();
    }
};
exports.ProjectManagerService = ProjectManagerService;
exports.ProjectManagerService = ProjectManagerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_manager_entity_1.ProjectManager)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProjectManagerService);
//# sourceMappingURL=project-manager.service.js.map