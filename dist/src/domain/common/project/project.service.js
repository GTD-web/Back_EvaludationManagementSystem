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
        console.log('\n🚀 [생성한다] 프로젝트 생성 시작');
        console.log('📋 data.name:', data.name);
        console.log('📋 data.managerId (입력값):', data.managerId);
        console.log('📋 data.parentProjectId:', data.parentProjectId);
        console.log('📋 data.childProjects:', data.childProjects ? `${data.childProjects.length}개` : '없음');
        let finalManagerId = data.managerId;
        if (data.parentProjectId) {
            const parentProject = await this.projectRepository.findOne({
                where: { id: data.parentProjectId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (!parentProject) {
                throw new common_1.NotFoundException(`상위 프로젝트 ID ${data.parentProjectId}를 찾을 수 없습니다.`);
            }
            if (!finalManagerId) {
                console.log('🔍 managerId 없음 → 최상단 프로젝트 PM 찾기 시작');
                const topLevelProject = await this.최상단_프로젝트_조회한다(data.parentProjectId);
                finalManagerId = topLevelProject.managerId;
                console.log('✅ 최상단 프로젝트 PM 찾음:', finalManagerId);
            }
        }
        console.log('📋 최종 사용할 managerId:', finalManagerId);
        const project = project_entity_1.Project.생성한다({
            ...data,
            managerId: finalManagerId,
        }, createdBy);
        const savedProject = await this.projectRepository.save(project);
        console.log('✅ 프로젝트 생성 완료 - ID:', savedProject.id, ', managerId:', savedProject.managerId);
        if (data.childProjects && data.childProjects.length > 0) {
            console.log('\n📦 하위 프로젝트 생성 시작');
            console.log('  - 전달할 defaultManagerId:', finalManagerId);
            await this.하위_프로젝트들_생성한다(savedProject.id, savedProject.projectCode || savedProject.id, data.childProjects, data.status, data.startDate, data.endDate, finalManagerId, createdBy);
        }
        const result = await this.ID로_조회한다(savedProject.id, true);
        if (!result) {
            throw new common_1.NotFoundException(`생성된 프로젝트를 찾을 수 없습니다.`);
        }
        return result;
    }
    async 하위_프로젝트들_생성한다(topLevelProjectId, topLevelProjectCode, childProjects, status, startDate, endDate, defaultManagerId, createdBy = 'system') {
        console.log('🔍 [하위_프로젝트들_생성한다] 시작');
        console.log('📋 defaultManagerId (최상단 PM):', defaultManagerId);
        console.log('📋 childProjects 개수:', childProjects.length);
        console.log('📋 childProjects 상세:', JSON.stringify(childProjects, null, 2));
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
                console.log(`\n🔹 Level ${level}, Index ${index} 처리 중`);
                console.log('  - child.name:', child.name);
                console.log('  - child.managerId (입력값):', child.managerId);
                console.log('  - defaultManagerId (최상단 PM):', defaultManagerId);
                console.log('  - 최종 사용할 managerId (무조건 최상단):', defaultManagerId);
                const childProjectCode = child.projectCode ||
                    `${topLevelProjectCode}-SUB${level}-${String.fromCharCode(65 + index)}`;
                console.log('  - 실제 저장될 managerId:', defaultManagerId);
                const createdChild = await this.projectRepository.save(project_entity_1.Project.생성한다({
                    name: child.name,
                    projectCode: childProjectCode,
                    status,
                    startDate,
                    endDate,
                    managerId: defaultManagerId,
                    parentProjectId: lastCreatedIdOfPreviousLevel,
                }, createdBy));
                console.log('  ✅ 생성 완료 - ID:', createdChild.id, ', managerId:', createdChild.managerId);
                lastCreatedInThisLevel = createdChild;
            }
            if (lastCreatedInThisLevel) {
                lastCreatedIdOfPreviousLevel = lastCreatedInThisLevel.id;
            }
        }
    }
    async 일괄_생성한다(dataList, createdBy) {
        console.log('\n🚀 [일괄_생성한다] 일괄 생성 시작 - 총', dataList.length, '개');
        const success = [];
        const failed = [];
        for (let i = 0; i < dataList.length; i++) {
            console.log(`\n📦 [${i + 1}/${dataList.length}] 프로젝트 생성 중`);
            console.log('  - name:', dataList[i].name);
            console.log('  - managerId (입력값):', dataList[i].managerId);
            console.log('  - parentProjectId:', dataList[i].parentProjectId);
            console.log('  - childProjects:', dataList[i].childProjects ? `${dataList[i].childProjects.length}개` : '없음');
            try {
                let finalManagerId = dataList[i].managerId;
                if (dataList[i].parentProjectId && !finalManagerId) {
                    console.log('  🔍 managerId 없음 → 최상단 프로젝트 PM 찾기 시작');
                    const topLevelProject = await this.최상단_프로젝트_조회한다(dataList[i].parentProjectId);
                    finalManagerId = topLevelProject.managerId;
                    console.log('  ✅ 최상단 프로젝트 PM 찾음:', finalManagerId);
                }
                console.log('  📋 최종 사용할 managerId:', finalManagerId);
                const project = project_entity_1.Project.생성한다({
                    ...dataList[i],
                    managerId: finalManagerId,
                }, createdBy);
                const savedProject = await this.projectRepository.save(project);
                console.log('  ✅ 프로젝트 생성 완료 - managerId:', savedProject.managerId);
                if (dataList[i].childProjects && dataList[i].childProjects.length > 0) {
                    console.log('  📦 하위 프로젝트 생성 - defaultManagerId:', finalManagerId);
                    await this.하위_프로젝트들_생성한다(savedProject.id, savedProject.projectCode || savedProject.id, dataList[i].childProjects, dataList[i].status, dataList[i].startDate, dataList[i].endDate, finalManagerId, createdBy);
                }
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
    async 최상단_프로젝트_조회한다(projectId) {
        let currentProject = await this.projectRepository.findOne({
            where: { id: projectId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!currentProject) {
            throw new common_1.NotFoundException(`프로젝트 ID ${projectId}를 찾을 수 없습니다.`);
        }
        while (currentProject.parentProjectId) {
            const parentProject = await this.projectRepository.findOne({
                where: { id: currentProject.parentProjectId, deletedAt: (0, typeorm_2.IsNull)() },
            });
            if (!parentProject) {
                break;
            }
            currentProject = parentProject;
        }
        console.log('  🔝 최상단 프로젝트 찾음 - ID:', currentProject.id, ', name:', currentProject.name, ', managerId:', currentProject.managerId);
        return currentProject;
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
    async 하위_프로젝트들_일괄_삭제한다(forceDelete = false, hardDelete = false, deletedBy) {
        const startTime = Date.now();
        const childProjects = await this.projectRepository
            .createQueryBuilder('project')
            .select([
            'project.id',
            'project.name',
            'project.projectCode',
            'project.parentProjectId',
        ])
            .where('project.deletedAt IS NULL')
            .andWhere(`(
          project.parentProjectId IS NOT NULL
          OR project.projectCode LIKE '%-SUB%'
          OR project.name LIKE '%하위%'
          OR project.name LIKE '% - 1차%'
          OR project.name LIKE '% - 2차%'
          OR project.name LIKE '% - 3차%'
          OR project.name LIKE '% - 4차%'
          OR project.name LIKE '% - 5차%'
          OR project.name LIKE '% - 6차%'
          OR project.name LIKE '% - 7차%'
          OR project.name LIKE '% - 8차%'
          OR project.name LIKE '% - 9차%'
          OR project.name LIKE '% - 10차%'
        )`)
            .getMany();
        if (childProjects.length === 0) {
            throw new common_1.NotFoundException('삭제할 하위 프로젝트를 찾을 수 없습니다');
        }
        const assignmentCheckPerformed = !forceDelete;
        if (!forceDelete) {
            const projectIds = childProjects.map((p) => p.id);
            const assignmentsExist = await this.evaluationProjectAssignmentRepository.count({
                where: { projectId: projectIds },
            });
            if (assignmentsExist > 0) {
                throw new project_exceptions_1.ProjectHasAssignmentsException(childProjects[0].id, assignmentsExist, `${assignmentsExist}개의 할당이 있는 하위 프로젝트가 포함되어 있어 삭제할 수 없습니다`);
            }
        }
        const deletedProjectsInfo = childProjects.map((p) => ({
            id: p.id,
            name: p.name,
            projectCode: p.projectCode || '',
            parentProjectId: p.parentProjectId ?? null,
        }));
        if (hardDelete) {
            const projectIds = childProjects.map((p) => p.id);
            await this.projectRepository.delete(projectIds);
        }
        else {
            for (const project of childProjects) {
                project.삭제한다(deletedBy);
                await this.projectRepository.save(project);
            }
        }
        const executionTimeSeconds = (Date.now() - startTime) / 1000;
        return {
            deletedCount: childProjects.length,
            deleteType: hardDelete ? 'hard' : 'soft',
            assignmentCheckPerformed,
            deletedProjects: deletedProjectsInfo,
            executionTimeSeconds,
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