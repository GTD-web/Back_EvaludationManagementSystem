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
exports.ProjectService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("./project.entity");
const project_types_1 = require("./project.types");
const evaluation_project_assignment_entity_1 = require("../../core/evaluation-project-assignment/evaluation-project-assignment.entity");
const project_exceptions_1 = require("./project.exceptions");
let ProjectService = class ProjectService {
    projectRepository;
    evaluationProjectAssignmentRepository;
    constructor(projectRepository, evaluationProjectAssignmentRepository) {
        this.projectRepository = projectRepository;
        this.evaluationProjectAssignmentRepository = evaluationProjectAssignmentRepository;
    }
    async 생성한다(data, createdBy) {
        if (data.projectCode) {
            const existingProject = await this.projectRepository.findOne({
                where: { projectCode: data.projectCode, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (existingProject) {
                throw new common_1.BadRequestException(`프로젝트 코드 ${data.projectCode}는 이미 사용 중입니다.`);
            }
        }
        if (data.parentProjectId) {
            const parentProject = await this.projectRepository.findOne({
                where: { id: data.parentProjectId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (!parentProject) {
                throw new common_1.NotFoundException(`상위 프로젝트 ID ${data.parentProjectId}를 찾을 수 없습니다.`);
            }
        }
        const project = project_entity_1.Project.생성한다(data, createdBy);
        const savedProject = await this.projectRepository.save(project);
        if (data.childProjects && data.childProjects.length > 0) {
            await this.하위_프로젝트들_생성한다(savedProject.id, savedProject.projectCode || savedProject.id, data.childProjects, data.status, data.startDate, data.endDate, data.managerId, createdBy);
        }
        const result = await this.ID로_조회한다(savedProject.id, true);
        if (!result) {
            throw new common_1.NotFoundException(`생성된 프로젝트를 찾을 수 없습니다.`);
        }
        return result;
    }
    async 하위_프로젝트들_생성한다(topLevelProjectId, topLevelProjectCode, childProjects, status, startDate, endDate, defaultManagerId, createdBy = 'system') {
        const groupedByLevel = new Map();
        for (const child of childProjects) {
            const existing = groupedByLevel.get(child.orderLevel) || [];
            existing.push(child);
            groupedByLevel.set(child.orderLevel, existing);
        }
        const sortedLevels = Array.from(groupedByLevel.keys()).sort((a, b) => a - b);
        let lastCreatedIdOfPreviousLevel = topLevelProjectId;
        for (const level of sortedLevels) {
            const childrenInLevel = groupedByLevel.get(level) || [];
            let lastCreatedInThisLevel = null;
            for (let index = 0; index < childrenInLevel.length; index++) {
                const child = childrenInLevel[index];
                const childProjectCode = child.projectCode ||
                    `${topLevelProjectCode}-SUB${level}-${String.fromCharCode(65 + index)}`;
                const createdChild = await this.projectRepository.save(project_entity_1.Project.생성한다({
                    name: child.name,
                    projectCode: childProjectCode,
                    status,
                    startDate,
                    endDate,
                    managerId: child.managerId,
                    parentProjectId: lastCreatedIdOfPreviousLevel,
                }, createdBy));
                lastCreatedInThisLevel = createdChild;
            }
            if (lastCreatedInThisLevel) {
                lastCreatedIdOfPreviousLevel = lastCreatedInThisLevel.id;
            }
        }
    }
    async 일괄_생성한다(dataList, createdBy) {
        const success = [];
        const failed = [];
        const projectCodes = dataList
            .map((data) => data.projectCode)
            .filter((code) => !!code);
        if (projectCodes.length > 0) {
            const existingProjects = await this.projectRepository.find({
                where: projectCodes.map((code) => ({
                    projectCode: code,
                    deletedAt: (0, typeorm_2.IsNull)(),
                })),
            });
            const existingCodes = new Set(existingProjects.map((p) => p.projectCode));
            for (let i = 0; i < dataList.length; i++) {
                if (dataList[i].projectCode &&
                    existingCodes.has(dataList[i].projectCode)) {
                    failed.push({
                        index: i,
                        data: dataList[i],
                        error: `프로젝트 코드 ${dataList[i].projectCode}는 이미 사용 중입니다.`,
                    });
                }
            }
        }
        const failedIndices = new Set(failed.map((f) => f.index));
        for (let i = 0; i < dataList.length; i++) {
            if (failedIndices.has(i)) {
                continue;
            }
            try {
                const project = project_entity_1.Project.생성한다(dataList[i], createdBy);
                const savedProject = await this.projectRepository.save(project);
                const result = await this.ID로_조회한다(savedProject.id, true);
                if (result) {
                    success.push(result);
                }
            }
            catch (error) {
                failed.push({
                    index: i,
                    data: dataList[i],
                    error: error instanceof Error
                        ? error.message
                        : '프로젝트 생성 중 오류가 발생했습니다.',
                });
            }
        }
        return { success, failed };
    }
    async 수정한다(id, data, updatedBy) {
        const project = await this.projectRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!project) {
            throw new common_1.NotFoundException(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
        }
        if (data.projectCode && data.projectCode !== project.projectCode) {
            const existingProject = await this.projectRepository.findOne({
                where: { projectCode: data.projectCode, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (existingProject && existingProject.id !== id) {
                throw new common_1.BadRequestException(`프로젝트 코드 ${data.projectCode}는 이미 사용 중입니다.`);
            }
        }
        project.업데이트한다(data, updatedBy);
        await this.projectRepository.save(project);
        if (data.childProjects !== undefined) {
            const existingChildren = await this.모든_하위_프로젝트_조회한다(id);
            for (const child of existingChildren.reverse()) {
                await this.projectRepository.remove(child);
            }
            if (data.childProjects.length > 0) {
                await this.하위_프로젝트들_생성한다(id, project.projectCode || id, data.childProjects, project.status, project.startDate, project.endDate, project.managerId, updatedBy);
            }
        }
        const result = await this.ID로_조회한다(id, true);
        if (!result) {
            throw new common_1.NotFoundException(`수정된 프로젝트를 찾을 수 없습니다.`);
        }
        return result;
    }
    async 삭제한다(id, deletedBy) {
        const project = await this.projectRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!project) {
            throw new common_1.NotFoundException(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
        }
        const allChildProjects = await this.모든_하위_프로젝트_조회한다(id);
        const projectIdsToCheck = [id, ...allChildProjects.map((p) => p.id)];
        for (const projectId of projectIdsToCheck) {
            const assignmentCount = await this.evaluationProjectAssignmentRepository.count({
                where: { projectId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (assignmentCount > 0) {
                const projectToCheck = [project, ...allChildProjects].find((p) => p.id === projectId);
                throw new project_exceptions_1.ProjectHasAssignmentsException(projectId, assignmentCount, `프로젝트 "${projectToCheck?.name || projectId}"에 ${assignmentCount}개의 할당이 있어 삭제할 수 없습니다.`);
            }
        }
        for (const child of allChildProjects.reverse()) {
            child.삭제한다(deletedBy);
            await this.projectRepository.save(child);
        }
        project.삭제한다(deletedBy);
        await this.projectRepository.save(project);
    }
    async 모든_하위_프로젝트_조회한다(parentId) {
        const allChildren = [];
        const directChildren = await this.projectRepository.find({
            where: { parentProjectId: parentId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        for (const child of directChildren) {
            allChildren.push(child);
            const grandChildren = await this.모든_하위_프로젝트_조회한다(child.id);
            allChildren.push(...grandChildren);
        }
        return allChildren;
    }
    async ID로_조회한다(id, includeChildren = false) {
        const result = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('employee', 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
            .select([
            'project.id AS id',
            'project.name AS name',
            'project.projectCode AS "projectCode"',
            'project.status AS status',
            'project.startDate AS "startDate"',
            'project.endDate AS "endDate"',
            'project.createdAt AS "createdAt"',
            'project.updatedAt AS "updatedAt"',
            'project.deletedAt AS "deletedAt"',
            'project.managerId AS "managerId"',
            'project.parentProjectId AS "parentProjectId"',
            'manager.id AS manager_employee_id',
            'manager.externalId AS manager_external_id',
            'manager.name AS manager_name',
            'manager.email AS manager_email',
            'manager.phoneNumber AS manager_phone_number',
            'manager.departmentName AS manager_department_name',
            'manager.rankName AS manager_rank_name',
        ])
            .where('project.id = :id', { id })
            .andWhere('project.deletedAt IS NULL')
            .getRawOne();
        if (!result) {
            return null;
        }
        let childProjects;
        if (includeChildren) {
            childProjects = await this.하위_프로젝트_목록_조회한다(id);
        }
        return {
            id: result.id,
            name: result.name,
            projectCode: result.projectCode,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            deletedAt: result.deletedAt,
            managerId: result.managerId,
            parentProjectId: result.parentProjectId,
            manager: result.manager_external_id
                ? {
                    managerId: result.manager_external_id,
                    employeeId: result.manager_employee_id,
                    name: result.manager_name,
                    email: result.manager_email,
                    phoneNumber: result.manager_phone_number,
                    departmentName: result.manager_department_name,
                    rankName: result.manager_rank_name,
                }
                : undefined,
            childProjects,
            get isDeleted() {
                return result.deletedAt !== null && result.deletedAt !== undefined;
            },
            get isActive() {
                return result.status === 'ACTIVE';
            },
            get isCompleted() {
                return result.status === 'COMPLETED';
            },
            get isCancelled() {
                return result.status === 'CANCELLED';
            },
        };
    }
    async 프로젝트코드로_조회한다(projectCode) {
        const result = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('employee', 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
            .select([
            'project.id AS id',
            'project.name AS name',
            'project.projectCode AS "projectCode"',
            'project.status AS status',
            'project.startDate AS "startDate"',
            'project.endDate AS "endDate"',
            'project.createdAt AS "createdAt"',
            'project.updatedAt AS "updatedAt"',
            'project.deletedAt AS "deletedAt"',
            'manager.id AS manager_employee_id',
            'manager.externalId AS manager_external_id',
            'manager.name AS manager_name',
            'manager.email AS manager_email',
            'manager.phoneNumber AS manager_phone_number',
            'manager.departmentName AS manager_department_name',
            'manager.rankName AS manager_rank_name',
        ])
            .where('project.projectCode = :projectCode', { projectCode })
            .andWhere('project.deletedAt IS NULL')
            .getRawOne();
        if (!result) {
            return null;
        }
        return {
            id: result.id,
            name: result.name,
            projectCode: result.projectCode,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            deletedAt: result.deletedAt,
            manager: result.manager_external_id
                ? {
                    managerId: result.manager_external_id,
                    employeeId: result.manager_employee_id,
                    name: result.manager_name,
                    email: result.manager_email,
                    phoneNumber: result.manager_phone_number,
                    departmentName: result.manager_department_name,
                    rankName: result.manager_rank_name,
                }
                : undefined,
            get isDeleted() {
                return result.deletedAt !== null && result.deletedAt !== undefined;
            },
            get isActive() {
                return result.status === 'ACTIVE';
            },
            get isCompleted() {
                return result.status === 'COMPLETED';
            },
            get isCancelled() {
                return result.status === 'CANCELLED';
            },
        };
    }
    async 프로젝트명으로_조회한다(name) {
        const result = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('employee', 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
            .select([
            'project.id AS id',
            'project.name AS name',
            'project.projectCode AS "projectCode"',
            'project.status AS status',
            'project.startDate AS "startDate"',
            'project.endDate AS "endDate"',
            'project.createdAt AS "createdAt"',
            'project.updatedAt AS "updatedAt"',
            'project.deletedAt AS "deletedAt"',
            'manager.id AS manager_employee_id',
            'manager.externalId AS manager_external_id',
            'manager.name AS manager_name',
            'manager.email AS manager_email',
            'manager.phoneNumber AS manager_phone_number',
            'manager.departmentName AS manager_department_name',
            'manager.rankName AS manager_rank_name',
        ])
            .where('project.name = :name', { name })
            .andWhere('project.deletedAt IS NULL')
            .getRawOne();
        if (!result) {
            return null;
        }
        return {
            id: result.id,
            name: result.name,
            projectCode: result.projectCode,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            deletedAt: result.deletedAt,
            manager: result.manager_external_id
                ? {
                    managerId: result.manager_external_id,
                    employeeId: result.manager_employee_id,
                    name: result.manager_name,
                    email: result.manager_email,
                    phoneNumber: result.manager_phone_number,
                    departmentName: result.manager_department_name,
                    rankName: result.manager_rank_name,
                }
                : undefined,
            get isDeleted() {
                return result.deletedAt !== null && result.deletedAt !== undefined;
            },
            get isActive() {
                return result.status === 'ACTIVE';
            },
            get isCompleted() {
                return result.status === 'COMPLETED';
            },
            get isCancelled() {
                return result.status === 'CANCELLED';
            },
        };
    }
    async 필터_조회한다(filter) {
        const queryBuilder = this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('employee', 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
            .select([
            'project.id AS id',
            'project.name AS name',
            'project.projectCode AS "projectCode"',
            'project.status AS status',
            'project.startDate AS "startDate"',
            'project.endDate AS "endDate"',
            'project.createdAt AS "createdAt"',
            'project.updatedAt AS "updatedAt"',
            'project.deletedAt AS "deletedAt"',
            'manager.id AS manager_employee_id',
            'manager.externalId AS manager_external_id',
            'manager.name AS manager_name',
            'manager.email AS manager_email',
            'manager.phoneNumber AS manager_phone_number',
            'manager.departmentName AS manager_department_name',
            'manager.rankName AS manager_rank_name',
        ])
            .where('project.deletedAt IS NULL');
        if (filter.status) {
            queryBuilder.andWhere('project.status = :status', {
                status: filter.status,
            });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('project.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.startDateFrom) {
            queryBuilder.andWhere('project.startDate >= :startDateFrom', {
                startDateFrom: filter.startDateFrom,
            });
        }
        if (filter.startDateTo) {
            queryBuilder.andWhere('project.startDate <= :startDateTo', {
                startDateTo: filter.startDateTo,
            });
        }
        if (filter.endDateFrom) {
            queryBuilder.andWhere('project.endDate >= :endDateFrom', {
                endDateFrom: filter.endDateFrom,
            });
        }
        if (filter.endDateTo) {
            queryBuilder.andWhere('project.endDate <= :endDateTo', {
                endDateTo: filter.endDateTo,
            });
        }
        if (filter.parentProjectId !== undefined) {
            queryBuilder.andWhere('project.parentProjectId = :parentProjectId', {
                parentProjectId: filter.parentProjectId,
            });
        }
        if (filter.hierarchyLevel) {
            if (filter.hierarchyLevel === 'parent') {
                queryBuilder.andWhere('project.parentProjectId IS NULL');
            }
            else if (filter.hierarchyLevel === 'child') {
                queryBuilder.andWhere('project.parentProjectId IS NOT NULL');
            }
        }
        const results = await queryBuilder.getRawMany();
        return results.map((result) => ({
            id: result.id,
            name: result.name,
            projectCode: result.projectCode,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            deletedAt: result.deletedAt,
            manager: result.manager_external_id
                ? {
                    managerId: result.manager_external_id,
                    employeeId: result.manager_employee_id,
                    name: result.manager_name,
                    email: result.manager_email,
                    phoneNumber: result.manager_phone_number,
                    departmentName: result.manager_department_name,
                    rankName: result.manager_rank_name,
                }
                : undefined,
            get isDeleted() {
                return result.deletedAt !== null && result.deletedAt !== undefined;
            },
            get isActive() {
                return result.status === 'ACTIVE';
            },
            get isCompleted() {
                return result.status === 'COMPLETED';
            },
            get isCancelled() {
                return result.status === 'CANCELLED';
            },
        }));
    }
    async 목록_조회한다(options = {}) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', filter = {}, } = options;
        const countQueryBuilder = this.projectRepository.createQueryBuilder('project');
        countQueryBuilder.where('project.deletedAt IS NULL');
        if (filter.status) {
            countQueryBuilder.andWhere('project.status = :status', {
                status: filter.status,
            });
        }
        if (filter.managerId) {
            countQueryBuilder.andWhere('project.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.startDateFrom) {
            countQueryBuilder.andWhere('project.startDate >= :startDateFrom', {
                startDateFrom: filter.startDateFrom,
            });
        }
        if (filter.startDateTo) {
            countQueryBuilder.andWhere('project.startDate <= :startDateTo', {
                startDateTo: filter.startDateTo,
            });
        }
        if (filter.endDateFrom) {
            countQueryBuilder.andWhere('project.endDate >= :endDateFrom', {
                endDateFrom: filter.endDateFrom,
            });
        }
        if (filter.endDateTo) {
            countQueryBuilder.andWhere('project.endDate <= :endDateTo', {
                endDateTo: filter.endDateTo,
            });
        }
        if (filter.search) {
            countQueryBuilder.andWhere('project.name ILIKE :search', {
                search: `%${filter.search}%`,
            });
        }
        if (filter.parentProjectId !== undefined) {
            countQueryBuilder.andWhere('project.parentProjectId = :parentProjectId', {
                parentProjectId: filter.parentProjectId,
            });
        }
        if (filter.hierarchyLevel) {
            if (filter.hierarchyLevel === 'parent') {
                countQueryBuilder.andWhere('project.parentProjectId IS NULL');
            }
            else if (filter.hierarchyLevel === 'child') {
                countQueryBuilder.andWhere('project.parentProjectId IS NOT NULL');
            }
        }
        const total = await countQueryBuilder.getCount();
        const queryBuilder = this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('employee', 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
            .select([
            'project.id AS id',
            'project.name AS name',
            'project.projectCode AS "projectCode"',
            'project.status AS status',
            'project.startDate AS "startDate"',
            'project.endDate AS "endDate"',
            'project.createdAt AS "createdAt"',
            'project.updatedAt AS "updatedAt"',
            'project.deletedAt AS "deletedAt"',
            'project.managerId AS "managerId"',
            'project.parentProjectId AS "parentProjectId"',
            'manager.id AS manager_employee_id',
            'manager.externalId AS manager_external_id',
            'manager.name AS manager_name',
            'manager.email AS manager_email',
            'manager.phoneNumber AS manager_phone_number',
            'manager.departmentName AS manager_department_name',
            'manager.rankName AS manager_rank_name',
        ])
            .where('project.deletedAt IS NULL');
        if (filter.status) {
            queryBuilder.andWhere('project.status = :status', {
                status: filter.status,
            });
        }
        if (filter.managerId) {
            queryBuilder.andWhere('project.managerId = :managerId', {
                managerId: filter.managerId,
            });
        }
        if (filter.startDateFrom) {
            queryBuilder.andWhere('project.startDate >= :startDateFrom', {
                startDateFrom: filter.startDateFrom,
            });
        }
        if (filter.startDateTo) {
            queryBuilder.andWhere('project.startDate <= :startDateTo', {
                startDateTo: filter.startDateTo,
            });
        }
        if (filter.endDateFrom) {
            queryBuilder.andWhere('project.endDate >= :endDateFrom', {
                endDateFrom: filter.endDateFrom,
            });
        }
        if (filter.endDateTo) {
            queryBuilder.andWhere('project.endDate <= :endDateTo', {
                endDateTo: filter.endDateTo,
            });
        }
        if (filter.search) {
            queryBuilder.andWhere('project.name ILIKE :search', {
                search: `%${filter.search}%`,
            });
        }
        if (filter.parentProjectId !== undefined) {
            queryBuilder.andWhere('project.parentProjectId = :parentProjectId', {
                parentProjectId: filter.parentProjectId,
            });
        }
        if (filter.hierarchyLevel) {
            if (filter.hierarchyLevel === 'parent') {
                queryBuilder.andWhere('project.parentProjectId IS NULL');
            }
            else if (filter.hierarchyLevel === 'child') {
                queryBuilder.andWhere('project.parentProjectId IS NOT NULL');
            }
        }
        queryBuilder.orderBy(`project.${sortBy}`, sortOrder);
        const offset = (page - 1) * limit;
        queryBuilder.offset(offset).limit(limit);
        const results = await queryBuilder.getRawMany();
        const projects = results.map((result) => ({
            id: result.id,
            name: result.name,
            projectCode: result.projectCode,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            deletedAt: result.deletedAt,
            managerId: result.managerId,
            parentProjectId: result.parentProjectId,
            manager: result.manager_external_id
                ? {
                    managerId: result.manager_external_id,
                    employeeId: result.manager_employee_id,
                    name: result.manager_name,
                    email: result.manager_email,
                    phoneNumber: result.manager_phone_number,
                    departmentName: result.manager_department_name,
                    rankName: result.manager_rank_name,
                }
                : undefined,
            get isDeleted() {
                return result.deletedAt !== null && result.deletedAt !== undefined;
            },
            get isActive() {
                return result.status === 'ACTIVE';
            },
            get isCompleted() {
                return result.status === 'COMPLETED';
            },
            get isCancelled() {
                return result.status === 'CANCELLED';
            },
        }));
        return {
            projects,
            total,
            page,
            limit,
        };
    }
    async 전체_조회한다() {
        const results = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('employee', 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
            .select([
            'project.id AS id',
            'project.name AS name',
            'project.projectCode AS "projectCode"',
            'project.status AS status',
            'project.startDate AS "startDate"',
            'project.endDate AS "endDate"',
            'project.createdAt AS "createdAt"',
            'project.updatedAt AS "updatedAt"',
            'project.deletedAt AS "deletedAt"',
            'manager.id AS manager_employee_id',
            'manager.externalId AS manager_external_id',
            'manager.name AS manager_name',
            'manager.email AS manager_email',
            'manager.phoneNumber AS manager_phone_number',
            'manager.departmentName AS manager_department_name',
            'manager.rankName AS manager_rank_name',
        ])
            .where('project.deletedAt IS NULL')
            .orderBy('project.name', 'ASC')
            .getRawMany();
        return results.map((result) => ({
            id: result.id,
            name: result.name,
            projectCode: result.projectCode,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            deletedAt: result.deletedAt,
            manager: result.manager_external_id
                ? {
                    managerId: result.manager_external_id,
                    employeeId: result.manager_employee_id,
                    name: result.manager_name,
                    email: result.manager_email,
                    phoneNumber: result.manager_phone_number,
                    departmentName: result.manager_department_name,
                    rankName: result.manager_rank_name,
                }
                : undefined,
            get isDeleted() {
                return result.deletedAt !== null && result.deletedAt !== undefined;
            },
            get isActive() {
                return result.status === 'ACTIVE';
            },
            get isCompleted() {
                return result.status === 'COMPLETED';
            },
            get isCancelled() {
                return result.status === 'CANCELLED';
            },
        }));
    }
    async 활성_조회한다() {
        const results = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('employee', 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
            .select([
            'project.id AS id',
            'project.name AS name',
            'project.projectCode AS "projectCode"',
            'project.status AS status',
            'project.startDate AS "startDate"',
            'project.endDate AS "endDate"',
            'project.createdAt AS "createdAt"',
            'project.updatedAt AS "updatedAt"',
            'project.deletedAt AS "deletedAt"',
            'manager.id AS manager_employee_id',
            'manager.externalId AS manager_external_id',
            'manager.name AS manager_name',
            'manager.email AS manager_email',
            'manager.phoneNumber AS manager_phone_number',
            'manager.departmentName AS manager_department_name',
            'manager.rankName AS manager_rank_name',
        ])
            .where('project.deletedAt IS NULL')
            .andWhere('project.status = :status', { status: project_types_1.ProjectStatus.ACTIVE })
            .orderBy('project.name', 'ASC')
            .getRawMany();
        return results.map((result) => ({
            id: result.id,
            name: result.name,
            projectCode: result.projectCode,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            deletedAt: result.deletedAt,
            manager: result.manager_external_id
                ? {
                    managerId: result.manager_external_id,
                    employeeId: result.manager_employee_id,
                    name: result.manager_name,
                    email: result.manager_email,
                    phoneNumber: result.manager_phone_number,
                    departmentName: result.manager_department_name,
                    rankName: result.manager_rank_name,
                }
                : undefined,
            get isDeleted() {
                return result.deletedAt !== null && result.deletedAt !== undefined;
            },
            get isActive() {
                return result.status === 'ACTIVE';
            },
            get isCompleted() {
                return result.status === 'COMPLETED';
            },
            get isCancelled() {
                return result.status === 'CANCELLED';
            },
        }));
    }
    async 매니저별_조회한다(managerId) {
        const results = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('employee', 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
            .select([
            'project.id AS id',
            'project.name AS name',
            'project.projectCode AS "projectCode"',
            'project.status AS status',
            'project.startDate AS "startDate"',
            'project.endDate AS "endDate"',
            'project.createdAt AS "createdAt"',
            'project.updatedAt AS "updatedAt"',
            'project.deletedAt AS "deletedAt"',
            'manager.id AS manager_employee_id',
            'manager.externalId AS manager_external_id',
            'manager.name AS manager_name',
            'manager.email AS manager_email',
            'manager.phoneNumber AS manager_phone_number',
            'manager.departmentName AS manager_department_name',
            'manager.rankName AS manager_rank_name',
        ])
            .where('project.deletedAt IS NULL')
            .andWhere('project.managerId = :managerId', { managerId })
            .orderBy('project.name', 'ASC')
            .getRawMany();
        return results.map((result) => ({
            id: result.id,
            name: result.name,
            projectCode: result.projectCode,
            status: result.status,
            startDate: result.startDate,
            endDate: result.endDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            deletedAt: result.deletedAt,
            manager: result.manager_external_id
                ? {
                    managerId: result.manager_external_id,
                    employeeId: result.manager_employee_id,
                    name: result.manager_name,
                    email: result.manager_email,
                    phoneNumber: result.manager_phone_number,
                    departmentName: result.manager_department_name,
                    rankName: result.manager_rank_name,
                }
                : undefined,
            get isDeleted() {
                return result.deletedAt !== null && result.deletedAt !== undefined;
            },
            get isActive() {
                return result.status === 'ACTIVE';
            },
            get isCompleted() {
                return result.status === 'COMPLETED';
            },
            get isCancelled() {
                return result.status === 'CANCELLED';
            },
        }));
    }
    async 존재하는가(id) {
        const count = await this.projectRepository.count({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 프로젝트코드가_존재하는가(projectCode, excludeId) {
        const queryBuilder = this.projectRepository.createQueryBuilder('project');
        queryBuilder.where('project.projectCode = :projectCode', { projectCode });
        queryBuilder.andWhere('project.deletedAt IS NULL');
        if (excludeId) {
            queryBuilder.andWhere('project.id != :excludeId', { excludeId });
        }
        const count = await queryBuilder.getCount();
        return count > 0;
    }
    async 상태_변경한다(id, status, updatedBy) {
        const project = await this.projectRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!project) {
            throw new common_1.NotFoundException(`ID ${id}에 해당하는 프로젝트를 찾을 수 없습니다.`);
        }
        project.status = status;
        project.수정자를_설정한다(updatedBy);
        const savedProject = await this.projectRepository.save(project);
        return savedProject.DTO로_변환한다();
    }
    async 완료_처리한다(id, updatedBy) {
        return this.상태_변경한다(id, project_types_1.ProjectStatus.COMPLETED, updatedBy);
    }
    async 취소_처리한다(id, updatedBy) {
        return this.상태_변경한다(id, project_types_1.ProjectStatus.CANCELLED, updatedBy);
    }
    async 하위_프로젝트_목록_조회한다(parentProjectId, depth = 0, maxDepth = 10) {
        if (depth >= maxDepth) {
            return [];
        }
        const results = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoin('employee', 'manager', 'manager.externalId = project.managerId AND manager.deletedAt IS NULL')
            .select([
            'project.id AS id',
            'project.name AS name',
            'project.projectCode AS "projectCode"',
            'project.status AS status',
            'project.startDate AS "startDate"',
            'project.endDate AS "endDate"',
            'project.createdAt AS "createdAt"',
            'project.updatedAt AS "updatedAt"',
            'project.deletedAt AS "deletedAt"',
            'project.managerId AS "managerId"',
            'project.parentProjectId AS "parentProjectId"',
            'manager.id AS manager_employee_id',
            'manager.externalId AS manager_external_id',
            'manager.name AS manager_name',
            'manager.email AS manager_email',
            'manager.phoneNumber AS manager_phone_number',
            'manager.departmentName AS manager_department_name',
            'manager.rankName AS manager_rank_name',
        ])
            .where('project.parentProjectId = :parentProjectId', { parentProjectId })
            .andWhere('project.deletedAt IS NULL')
            .orderBy('project.createdAt', 'ASC')
            .getRawMany();
        const projectsWithChildren = await Promise.all(results.map(async (result) => {
            const children = await this.하위_프로젝트_목록_조회한다(result.id, depth + 1, maxDepth);
            return {
                id: result.id,
                name: result.name,
                projectCode: result.projectCode,
                status: result.status,
                startDate: result.startDate,
                endDate: result.endDate,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
                deletedAt: result.deletedAt,
                managerId: result.managerId,
                parentProjectId: result.parentProjectId,
                manager: result.manager_external_id
                    ? {
                        managerId: result.manager_external_id,
                        employeeId: result.manager_employee_id,
                        name: result.manager_name,
                        email: result.manager_email,
                        phoneNumber: result.manager_phone_number,
                        departmentName: result.manager_department_name,
                        rankName: result.manager_rank_name,
                    }
                    : undefined,
                childProjects: children.length > 0 ? children : undefined,
                get isDeleted() {
                    return result.deletedAt !== null && result.deletedAt !== undefined;
                },
                get isActive() {
                    return result.status === 'ACTIVE';
                },
                get isCompleted() {
                    return result.status === 'COMPLETED';
                },
                get isCancelled() {
                    return result.status === 'CANCELLED';
                },
            };
        }));
        return projectsWithChildren;
    }
    async 하위_프로젝트_수를_조회한다(parentProjectId) {
        return this.projectRepository.count({
            where: { parentProjectId, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 계층구조_목록_조회한다(options = {}) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', filter = {} } = options;
        const parentFilter = {
            ...filter,
            hierarchyLevel: 'parent',
        };
        const parentProjects = await this.목록_조회한다({
            page,
            limit,
            sortBy,
            sortOrder,
            filter: parentFilter,
        });
        const projectsWithChildren = await Promise.all(parentProjects.projects.map(async (parent) => {
            const children = await this.하위_프로젝트_목록_조회한다(parent.id);
            return {
                ...parent,
                childProjects: children,
                childProjectCount: children.length,
            };
        }));
        return {
            projects: projectsWithChildren,
            total: parentProjects.total,
            page: parentProjects.page,
            limit: parentProjects.limit,
        };
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProjectService);
//# sourceMappingURL=project.service.js.map