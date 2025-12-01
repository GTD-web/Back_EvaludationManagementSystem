"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestContextHelpers = exports.TestContextUsageExample = void 0;
class TestContextUsageExample {
    testContextService;
    constructor(testContextService) {
        this.testContextService = testContextService;
    }
    async 기본_테스트환경_생성_예시() {
        const testData = await this.testContextService.완전한_테스트환경을_생성한다();
        console.log('=== 완전한 테스트 환경 생성 완료 ===');
        console.log('부서 수:', testData.departments.length);
        console.log('직원 수:', testData.employees.length);
        console.log('프로젝트 수:', testData.projects.length);
        console.log('WBS 항목 수:', testData.wbsItems.length);
        return testData;
    }
    async 부서와_직원_생성_예시() {
        const { departments, employees } = await this.testContextService.부서와_직원을_생성한다();
        console.log('=== 부서와 직원 생성 완료 ===');
        console.log('부서 수:', departments.length);
        console.log('직원 수:', employees.length);
        if (departments.length > 0) {
            const additionalEmployees = await this.testContextService.특정_부서에_직원을_추가한다(departments[0].id, 3);
            console.log('추가된 직원 수:', additionalEmployees.length);
        }
        const managerEmployees = await this.testContextService.매니저_하위직원_관계를_생성한다(2, 2);
        console.log('매니저-하위직원 관계 생성:', managerEmployees.length);
        return {
            departments,
            employees,
            additionalEmployees: departments.length > 0 ? await this.testContextService.특정_부서에_직원을_추가한다(departments[0].id, 3) : [],
            managerEmployees,
        };
    }
    async 프로젝트와_WBS_생성_예시() {
        const { projects, wbsItems } = await this.testContextService.프로젝트와_WBS를_생성한다(2);
        console.log('=== 프로젝트와 WBS 생성 완료 ===');
        console.log('프로젝트 수:', projects.length);
        console.log('WBS 항목 수:', wbsItems.length);
        if (projects.length > 0) {
            const additionalWbsItems = await this.testContextService.특정_프로젝트에_WBS를_추가한다(projects[0].id, 5);
            console.log('추가된 WBS 항목 수:', additionalWbsItems.length);
        }
        if (projects.length > 0) {
            const hierarchicalWbsItems = await this.testContextService.계층구조_WBS를_생성한다(projects[0].id, 3, 2);
            console.log('계층구조 WBS 항목 수:', hierarchicalWbsItems.length);
        }
        return {
            projects,
            wbsItems,
            additionalWbsItems: projects.length > 0 ? await this.testContextService.특정_프로젝트에_WBS를_추가한다(projects[0].id, 5) : [],
            hierarchicalWbsItems: projects.length > 0 ? await this.testContextService.계층구조_WBS를_생성한다(projects[0].id, 3, 2) : [],
        };
    }
    async 평가시스템용_테스트데이터_생성_예시() {
        const testData = await this.testContextService.평가시스템용_완전한_테스트데이터를_생성한다();
        console.log('=== 평가 시스템용 테스트 데이터 생성 완료 ===');
        console.log('부서 수:', testData.departments.length);
        console.log('직원 수:', testData.employees.length);
        console.log('프로젝트 수:', testData.projects.length);
        console.log('WBS 항목 수:', testData.wbsItems.length);
        const activeProjects = testData.projects.filter((p) => p.isActive);
        console.log('활성 프로젝트 수:', activeProjects.length);
        const inProgressWbsItems = testData.wbsItems.filter((w) => w.isInProgress);
        console.log('진행중인 WBS 항목 수:', inProgressWbsItems.length);
        return {
            ...testData,
            activeProjects,
            inProgressWbsItems,
        };
    }
    async 테스트데이터_정리_예시() {
        const cleanedData = await this.testContextService.테스트_데이터를_정리한다();
        console.log('=== 테스트 데이터 정리 완료 ===');
        console.log('정리된 데이터 수:', cleanedData);
        return cleanedData;
    }
    async 전체_테스트_시나리오() {
        try {
            console.log('=== 테스트 컨텍스트 시나리오 시작 ===');
            const basicTestData = await this.기본_테스트환경_생성_예시();
            const orgTestData = await this.부서와_직원_생성_예시();
            const projectTestData = await this.프로젝트와_WBS_생성_예시();
            const evaluationTestData = await this.평가시스템용_테스트데이터_생성_예시();
            console.log('=== 테스트 컨텍스트 시나리오 완료 ===');
            return {
                basic: basicTestData,
                organization: orgTestData,
                project: projectTestData,
                evaluation: evaluationTestData,
            };
        }
        catch (error) {
            console.error('테스트 컨텍스트 시나리오 실행 중 오류:', error);
            throw error;
        }
        finally {
            console.log('=== 테스트 데이터 정리 ===');
            await this.테스트데이터_정리_예시();
        }
    }
}
exports.TestContextUsageExample = TestContextUsageExample;
class TestContextHelpers {
    testContextService;
    constructor(testContextService) {
        this.testContextService = testContextService;
    }
    async E2E_테스트용_데이터_설정() {
        return await this.testContextService.완전한_테스트환경을_생성한다();
    }
    async E2E_테스트용_데이터_정리() {
        return await this.testContextService.테스트_데이터를_정리한다();
    }
    async 특정_테스트케이스용_데이터_생성(testCase) {
        switch (testCase) {
            case 'organization':
                return await this.testContextService.부서와_직원을_생성한다();
            case 'project':
                return await this.testContextService.프로젝트와_WBS를_생성한다(3);
            case 'evaluation':
                return await this.testContextService.평가시스템용_완전한_테스트데이터를_생성한다();
            case 'manager-employee':
                return await this.testContextService.매니저_하위직원_관계를_생성한다(2, 3);
            case 'hierarchical-wbs':
                const { projects } = await this.testContextService.프로젝트와_WBS를_생성한다(1);
                if (projects.length > 0) {
                    const wbsItems = await this.testContextService.계층구조_WBS를_생성한다(projects[0].id, 3, 2);
                    return { projects, wbsItems };
                }
                return { projects: [], wbsItems: [] };
            case 'full':
            default:
                return await this.testContextService.완전한_테스트환경을_생성한다();
        }
    }
    async 테스트환경_상태_확인() {
        return await this.testContextService.테스트환경_상태를_확인한다();
    }
}
exports.TestContextHelpers = TestContextHelpers;
//# sourceMappingURL=test-context-usage-example.js.map