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
exports.ProjectTestService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("./project.entity");
const project_types_1 = require("./project.types");
const employee_entity_1 = require("../employee/employee.entity");
let ProjectTestService = class ProjectTestService {
    projectRepository;
    employeeRepository;
    constructor(projectRepository, employeeRepository) {
        this.projectRepository = projectRepository;
        this.employeeRepository = employeeRepository;
    }
    async 테스트용_목데이터를_생성한다() {
        const testProjects = [
            {
                name: '루미르 통합 포탈 개발',
                projectCode: 'LUMIR-001',
                status: project_types_1.ProjectStatus.ACTIVE,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                managerId: 'emp-001',
            },
            {
                name: '평가 시스템 고도화',
                projectCode: 'EVAL-001',
                status: project_types_1.ProjectStatus.ACTIVE,
                startDate: new Date('2024-02-01'),
                endDate: new Date('2024-11-30'),
                managerId: 'emp-003',
            },
            {
                name: '사용자 인터페이스 개선',
                projectCode: 'UI-001',
                status: project_types_1.ProjectStatus.ACTIVE,
                startDate: new Date('2024-03-01'),
                endDate: new Date('2024-10-31'),
                managerId: 'emp-005',
            },
            {
                name: '데이터 마이그레이션',
                projectCode: 'MIGR-001',
                status: project_types_1.ProjectStatus.ACTIVE,
                startDate: new Date('2024-04-01'),
                endDate: new Date('2024-09-30'),
                managerId: 'emp-006',
            },
            {
                name: '보안 강화 프로젝트',
                projectCode: 'SEC-001',
                status: project_types_1.ProjectStatus.ACTIVE,
                startDate: new Date('2024-05-01'),
                endDate: new Date('2024-12-31'),
                managerId: 'emp-007',
            },
            {
                name: '시스템 분석 및 설계',
                projectCode: 'ANAL-001',
                status: project_types_1.ProjectStatus.COMPLETED,
                startDate: new Date('2023-10-01'),
                endDate: new Date('2023-12-31'),
                managerId: 'emp-001',
            },
            {
                name: '프로토타입 개발',
                projectCode: 'PROTO-001',
                status: project_types_1.ProjectStatus.COMPLETED,
                startDate: new Date('2023-11-01'),
                endDate: new Date('2024-01-31'),
                managerId: 'emp-003',
            },
            {
                name: '초기 데이터 구축',
                projectCode: 'DATA-001',
                status: project_types_1.ProjectStatus.COMPLETED,
                startDate: new Date('2023-12-01'),
                endDate: new Date('2024-02-29'),
                managerId: 'emp-010',
            },
            {
                name: '레거시 시스템 연동',
                projectCode: 'LEGACY-001',
                status: project_types_1.ProjectStatus.CANCELLED,
                startDate: new Date('2024-01-15'),
                endDate: new Date('2024-06-30'),
                managerId: 'emp-002',
            },
            {
                name: '모바일 앱 개발',
                projectCode: 'MOBILE-001',
                status: project_types_1.ProjectStatus.CANCELLED,
                startDate: new Date('2024-02-01'),
                endDate: new Date('2024-08-31'),
                managerId: 'emp-004',
            },
            {
                name: '내부 프로세스 개선',
                projectCode: undefined,
                status: project_types_1.ProjectStatus.ACTIVE,
                startDate: new Date('2024-06-01'),
                endDate: new Date('2024-12-31'),
                managerId: 'emp-010',
            },
            {
                name: '문서화 작업',
                projectCode: undefined,
                status: project_types_1.ProjectStatus.ACTIVE,
                startDate: new Date('2024-07-01'),
                endDate: new Date('2024-11-30'),
                managerId: 'emp-011',
            },
        ];
        const externalIds = [
            ...new Set(testProjects.map((p) => p.managerId).filter((id) => id)),
        ];
        const employees = await this.employeeRepository.find({
            where: externalIds.map((externalId) => ({ externalId })),
        });
        const externalIdToUuid = new Map();
        employees.forEach((emp) => {
            externalIdToUuid.set(emp.externalId, emp.id);
        });
        const projects = testProjects.map((proj) => {
            const managerUuid = proj.managerId
                ? externalIdToUuid.get(proj.managerId)
                : undefined;
            const project = new project_entity_1.Project(proj.name, proj.projectCode, proj.status, proj.startDate, proj.endDate, managerUuid);
            return project;
        });
        const savedProjects = await this.projectRepository.save(projects);
        console.log(`프로젝트 생성 완료: ${savedProjects.length}개`);
        console.log(`managerId가 UUID로 변환된 프로젝트: ${savedProjects.filter((p) => p.managerId).length}개`);
        return savedProjects.map((project) => project.DTO로_변환한다());
    }
    async 특정_프로젝트_테스트데이터를_생성한다(projectData) {
        const project = new project_entity_1.Project(projectData.name, projectData.projectCode, projectData.status || project_types_1.ProjectStatus.ACTIVE, projectData.startDate, projectData.endDate, projectData.managerId);
        const savedProject = await this.projectRepository.save(project);
        return savedProject.DTO로_변환한다();
    }
    async 랜덤_테스트데이터를_생성한다(count = 10) {
        const projects = [];
        const statuses = [
            project_types_1.ProjectStatus.ACTIVE,
            project_types_1.ProjectStatus.COMPLETED,
            project_types_1.ProjectStatus.CANCELLED,
        ];
        const projectTypes = [
            '개발',
            '분석',
            '설계',
            '테스트',
            '배포',
            '유지보수',
            '개선',
            '마이그레이션',
        ];
        for (let i = 0; i < count; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
            const startYear = 2023 + Math.floor(Math.random() * 2);
            const startMonth = Math.floor(Math.random() * 12);
            const startDay = Math.floor(Math.random() * 28) + 1;
            const duration = Math.floor(Math.random() * 12) + 1;
            const startDate = new Date(startYear, startMonth, startDay);
            const endDate = new Date(startYear, startMonth + duration, startDay);
            const project = new project_entity_1.Project(`테스트${projectType}프로젝트${i + 1}`, `TEST${String(i + 1).padStart(3, '0')}`, status, startDate, endDate, `manager-${Math.floor(Math.random() * 5) + 1}`);
            projects.push(project);
        }
        const savedProjects = await this.projectRepository.save(projects);
        return savedProjects.map((project) => project.DTO로_변환한다());
    }
    async 테스트_데이터를_정리한다() {
        return await this.모든_테스트데이터를_삭제한다();
    }
    async 모든_테스트데이터를_삭제한다() {
        const result = await this.projectRepository
            .createQueryBuilder()
            .delete()
            .execute();
        return result.affected || 0;
    }
    async 상태별_프로젝트_테스트데이터를_생성한다(status, count = 5) {
        const projects = [];
        const projectTypes = [
            '개발',
            '분석',
            '설계',
            '테스트',
            '배포',
            '유지보수',
            '개선',
            '마이그레이션',
        ];
        for (let i = 0; i < count; i++) {
            const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
            const startYear = 2023 + Math.floor(Math.random() * 2);
            const startMonth = Math.floor(Math.random() * 12);
            const startDay = Math.floor(Math.random() * 28) + 1;
            const duration = Math.floor(Math.random() * 12) + 1;
            const startDate = new Date(startYear, startMonth, startDay);
            const endDate = new Date(startYear, startMonth + duration, startDay);
            const project = new project_entity_1.Project(`${status}${projectType}프로젝트${i + 1}`, `${status.slice(0, 3).toUpperCase()}${String(i + 1).padStart(3, '0')}`, status, startDate, endDate, `manager-${Math.floor(Math.random() * 5) + 1}`);
            projects.push(project);
        }
        const savedProjects = await this.projectRepository.save(projects);
        return savedProjects.map((project) => project.DTO로_변환한다());
    }
    async 매니저별_프로젝트_테스트데이터를_생성한다(managerId, count = 3) {
        const projects = [];
        const projectTypes = [
            '개발',
            '분석',
            '설계',
            '테스트',
            '배포',
            '유지보수',
            '개선',
            '마이그레이션',
        ];
        const statuses = [
            project_types_1.ProjectStatus.ACTIVE,
            project_types_1.ProjectStatus.COMPLETED,
            project_types_1.ProjectStatus.CANCELLED,
        ];
        for (let i = 0; i < count; i++) {
            const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const startYear = 2023 + Math.floor(Math.random() * 2);
            const startMonth = Math.floor(Math.random() * 12);
            const startDay = Math.floor(Math.random() * 28) + 1;
            const duration = Math.floor(Math.random() * 12) + 1;
            const startDate = new Date(startYear, startMonth, startDay);
            const endDate = new Date(startYear, startMonth + duration, startDay);
            const project = new project_entity_1.Project(`${managerId}매니저${projectType}프로젝트${i + 1}`, `${managerId.slice(-3).toUpperCase()}${String(i + 1).padStart(3, '0')}`, status, startDate, endDate, managerId);
            projects.push(project);
        }
        const savedProjects = await this.projectRepository.save(projects);
        return savedProjects.map((project) => project.DTO로_변환한다());
    }
    async 기간별_프로젝트_테스트데이터를_생성한다(startYear, endYear, count = 10) {
        const projects = [];
        const projectTypes = [
            '개발',
            '분석',
            '설계',
            '테스트',
            '배포',
            '유지보수',
            '개선',
            '마이그레이션',
        ];
        const statuses = [
            project_types_1.ProjectStatus.ACTIVE,
            project_types_1.ProjectStatus.COMPLETED,
            project_types_1.ProjectStatus.CANCELLED,
        ];
        for (let i = 0; i < count; i++) {
            const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
            const month = Math.floor(Math.random() * 12);
            const day = Math.floor(Math.random() * 28) + 1;
            const duration = Math.floor(Math.random() * 12) + 1;
            const startDate = new Date(year, month, day);
            const endDate = new Date(year, month + duration, day);
            const project = new project_entity_1.Project(`${year}년${projectType}프로젝트${i + 1}`, `${year}${String(i + 1).padStart(3, '0')}`, status, startDate, endDate, `manager-${Math.floor(Math.random() * 5) + 1}`);
            projects.push(project);
        }
        const savedProjects = await this.projectRepository.save(projects);
        return savedProjects.map((project) => project.DTO로_변환한다());
    }
};
exports.ProjectTestService = ProjectTestService;
exports.ProjectTestService = ProjectTestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProjectTestService);
//# sourceMappingURL=project-test.service.js.map