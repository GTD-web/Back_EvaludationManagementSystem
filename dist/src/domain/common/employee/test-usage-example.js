"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeTestHelpers = exports.EmployeeTestUsageExample = void 0;
class EmployeeTestUsageExample {
    employeeTestService;
    constructor(employeeTestService) {
        this.employeeTestService = employeeTestService;
    }
    async 기본_테스트데이터_생성_예시() {
        const employees = await this.employeeTestService.테스트용_목데이터를_생성한다();
        console.log('생성된 직원 수:', employees.length);
        console.log('재직중인 직원들:', employees.filter((e) => e.isActive));
        const customEmployee = await this.employeeTestService.특정_직원_테스트데이터를_생성한다({
            employeeNumber: 'CUSTOM001',
            name: '커스텀직원',
            email: 'custom@company.com',
            externalId: 'custom-emp-001',
            phoneNumber: '010-9999-9999',
            status: '재직중',
            departmentId: 'custom-dept',
        });
        console.log('커스텀 직원 생성:', customEmployee);
        const randomEmployees = await this.employeeTestService.랜덤_테스트데이터를_생성한다(5);
        console.log('랜덤 직원 생성:', randomEmployees.length);
        const departmentEmployees = await this.employeeTestService.부서별_직원_테스트데이터를_생성한다('test-dept-001', 3);
        console.log('부서별 직원 생성:', departmentEmployees.length);
        const managerEmployeeData = await this.employeeTestService.매니저_하위직원_테스트데이터를_생성한다(2, 3);
        console.log('매니저-하위직원 관계 생성:', managerEmployeeData.length);
        return {
            basic: employees,
            custom: customEmployee,
            random: randomEmployees,
            department: departmentEmployees,
            managerEmployee: managerEmployeeData,
        };
    }
    async 테스트데이터_정리_예시() {
        const deletedCount = await this.employeeTestService.테스트_데이터를_정리한다();
        console.log('삭제된 테스트 데이터 수:', deletedCount);
    }
    async 전체_테스트_시나리오() {
        try {
            console.log('=== 테스트 데이터 생성 시작 ===');
            const testData = await this.기본_테스트데이터_생성_예시();
            console.log('=== 테스트 완료 ===');
            console.log('생성된 직원 수:', testData.basic.length);
            console.log('재직중인 직원 수:', testData.basic.filter((e) => e.isActive).length);
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
exports.EmployeeTestUsageExample = EmployeeTestUsageExample;
class EmployeeTestHelpers {
    employeeTestService;
    constructor(employeeTestService) {
        this.employeeTestService = employeeTestService;
    }
    async E2E_테스트용_데이터_설정() {
        return await this.employeeTestService.테스트용_목데이터를_생성한다();
    }
    async E2E_테스트용_데이터_정리() {
        return await this.employeeTestService.테스트_데이터를_정리한다();
    }
    async 특정_테스트케이스용_데이터_생성(testCase) {
        switch (testCase) {
            case 'department':
                return await this.employeeTestService.부서별_직원_테스트데이터를_생성한다('test-dept', 10);
            case 'manager':
                return await this.employeeTestService.매니저_하위직원_테스트데이터를_생성한다(3, 5);
            case 'random':
                return await this.employeeTestService.랜덤_테스트데이터를_생성한다(20);
            case 'basic':
            default:
                return await this.employeeTestService.테스트용_목데이터를_생성한다();
        }
    }
}
exports.EmployeeTestHelpers = EmployeeTestHelpers;
//# sourceMappingURL=test-usage-example.js.map