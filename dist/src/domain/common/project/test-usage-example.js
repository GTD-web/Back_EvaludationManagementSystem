"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectTestHelpers = exports.ProjectTestUsageExample = void 0;
const project_types_1 = require("./project.types");
class ProjectTestUsageExample {
    projectTestService;
    constructor(projectTestService) {
        this.projectTestService = projectTestService;
    }
    async 기본_테스트데이터_생성_예시() {
        const projects = await this.projectTestService.테스트용_목데이터를_생성한다();
        console.log('생성된 프로젝트 수:', projects.length);
        console.log('활성 프로젝트들:', projects.filter((p) => p.isActive));
        const customProject = await this.projectTestService.특정_프로젝트_테스트데이터를_생성한다({
            name: '커스텀프로젝트',
            projectCode: 'CUSTOM-001',
            status: project_types_1.ProjectStatus.ACTIVE,
            startDate: new Date('2024-06-01'),
            endDate: new Date('2024-12-31'),
            managerId: 'custom-manager',
        });
        console.log('커스텀 프로젝트 생성:', customProject);
        const randomProjects = await this.projectTestService.랜덤_테스트데이터를_생성한다(5);
        console.log('랜덤 프로젝트 생성:', randomProjects.length);
        const activeProjects = await this.projectTestService.상태별_프로젝트_테스트데이터를_생성한다(project_types_1.ProjectStatus.ACTIVE, 3);
        console.log('활성 프로젝트 생성:', activeProjects.length);
        const managerProjects = await this.projectTestService.매니저별_프로젝트_테스트데이터를_생성한다('test-manager-001', 2);
        console.log('매니저별 프로젝트 생성:', managerProjects.length);
        const periodProjects = await this.projectTestService.기간별_프로젝트_테스트데이터를_생성한다(2023, 2024, 4);
        console.log('기간별 프로젝트 생성:', periodProjects.length);
        return {
            basic: projects,
            custom: customProject,
            random: randomProjects,
            active: activeProjects,
            manager: managerProjects,
            period: periodProjects,
        };
    }
    async 테스트데이터_정리_예시() {
        const deletedCount = await this.projectTestService.테스트_데이터를_정리한다();
        console.log('삭제된 테스트 데이터 수:', deletedCount);
    }
    async 전체_테스트_시나리오() {
        try {
            console.log('=== 테스트 데이터 생성 시작 ===');
            const testData = await this.기본_테스트데이터_생성_예시();
            console.log('=== 테스트 완료 ===');
            console.log('생성된 프로젝트 수:', testData.basic.length);
            console.log('활성 프로젝트 수:', testData.basic.filter((p) => p.isActive).length);
            console.log('완료된 프로젝트 수:', testData.basic.filter((p) => p.isCompleted).length);
            console.log('취소된 프로젝트 수:', testData.basic.filter((p) => p.isCancelled).length);
            return {
                testData,
            };
        }
        catch (error) {
            console.error('테스트 실행 중 오류:', error);
            throw error;
        }
        finally {
            console.log('=== 테스트 데이터 정리 ===');
            await this.테스트데이터_정리_예시();
        }
    }
}
exports.ProjectTestUsageExample = ProjectTestUsageExample;
class ProjectTestHelpers {
    projectTestService;
    constructor(projectTestService) {
        this.projectTestService = projectTestService;
    }
    async E2E_테스트용_데이터_설정() {
        return await this.projectTestService.테스트용_목데이터를_생성한다();
    }
    async E2E_테스트용_데이터_정리() {
        return await this.projectTestService.테스트_데이터를_정리한다();
    }
    async 특정_테스트케이스용_데이터_생성(testCase) {
        switch (testCase) {
            case 'active':
                return await this.projectTestService.상태별_프로젝트_테스트데이터를_생성한다(project_types_1.ProjectStatus.ACTIVE, 10);
            case 'completed':
                return await this.projectTestService.상태별_프로젝트_테스트데이터를_생성한다(project_types_1.ProjectStatus.COMPLETED, 5);
            case 'cancelled':
                return await this.projectTestService.상태별_프로젝트_테스트데이터를_생성한다(project_types_1.ProjectStatus.CANCELLED, 3);
            case 'manager':
                return await this.projectTestService.매니저별_프로젝트_테스트데이터를_생성한다('test-manager', 5);
            case 'period':
                return await this.projectTestService.기간별_프로젝트_테스트데이터를_생성한다(2023, 2024, 8);
            case 'random':
                return await this.projectTestService.랜덤_테스트데이터를_생성한다(15);
            case 'basic':
            default:
                return await this.projectTestService.테스트용_목데이터를_생성한다();
        }
    }
}
exports.ProjectTestHelpers = ProjectTestHelpers;
//# sourceMappingURL=test-usage-example.js.map