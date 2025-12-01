"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSSOMockData = fetchSSOMockData;
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const sso_1 = require("../src/domain/common/sso");
const common_1 = require("@nestjs/common");
async function fetchSSOMockData() {
    const logger = new common_1.Logger('SSOFetchMockData');
    logger.log('SSO Mock 데이터 수집을 시작합니다...');
    logger.log('환경 변수 확인:');
    logger.log(`  SSO_BASE_URL: ${process.env.SSO_BASE_URL || '설정되지 않음'}`);
    logger.log(`  SSO_CLIENT_ID: ${process.env.SSO_CLIENT_ID ? '***' : '설정되지 않음'}`);
    logger.log(`  SSO_CLIENT_SECRET: ${process.env.SSO_CLIENT_SECRET ? '***' : '설정되지 않음'}`);
    logger.log(`  SSO_SYSTEM_NAME: ${process.env.SSO_SYSTEM_NAME || 'EMS-PROD'}`);
    logger.log(`  SSO_ENABLE_JSON_STORAGE: ${process.env.SSO_ENABLE_JSON_STORAGE || 'true'}`);
    process.env.SSO_ENABLE_JSON_STORAGE = 'true';
    delete process.env.VERCEL;
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.GOOGLE_CLOUD_FUNCTION;
    delete process.env.AZURE_FUNCTIONS_ENVIRONMENT;
    process.env.NODE_ENV = 'development';
    try {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
            logger: ['log', 'error', 'warn', 'debug'],
        });
        const ssoService = app.get(sso_1.SSOService);
        logger.log('SSO 서비스 초기화 중...');
        await ssoService.초기화한다();
        logger.log('SSO 서비스 초기화 완료');
        logger.log('\n=== 부서 계층구조 조회 ===');
        try {
            const hierarchy = await ssoService.부서계층구조를조회한다({
                includeEmptyDepartments: true,
                withEmployeeDetail: false,
            });
            logger.log(`부서 계층구조 조회 완료: ${hierarchy.totalDepartments}개 부서`);
        }
        catch (error) {
            logger.error(`부서 계층구조 조회 실패: ${error.message}`);
        }
        logger.log('\n=== 모든 부서 정보 조회 ===');
        try {
            const departments = await ssoService.모든부서정보를조회한다({
                includeEmptyDepartments: true,
            });
            logger.log(`모든 부서 정보 조회 완료: ${departments.length}개 부서`);
        }
        catch (error) {
            logger.error(`모든 부서 정보 조회 실패: ${error.message}`);
        }
        logger.log('\n=== 모든 직원 정보 조회 (부서 계층구조) ===');
        try {
            const employees = await ssoService.모든직원정보를조회한다({
                includeEmptyDepartments: true,
            });
            logger.log(`모든 직원 정보 조회 완료: ${employees.length}명`);
        }
        catch (error) {
            logger.error(`모든 직원 정보 조회 실패: ${error.message}`);
        }
        logger.log('\n=== 여러 직원 원시 정보 조회 ===');
        try {
            const rawEmployees = await ssoService.여러직원원시정보를조회한다({
                withDetail: true,
                includeTerminated: false,
            });
            logger.log(`여러 직원 원시 정보 조회 완료: ${rawEmployees.length}명`);
        }
        catch (error) {
            logger.error(`여러 직원 원시 정보 조회 실패: ${error.message}`);
        }
        logger.log('\n=== 직원 관리자 정보 조회 ===');
        try {
            const managers = await ssoService.직원관리자정보를조회한다();
            logger.log(`직원 관리자 정보 조회 완료: ${managers.total}명`);
        }
        catch (error) {
            logger.error(`직원 관리자 정보 조회 실패: ${error.message}`);
        }
        const testEmployeeNumber = process.env.TEST_EMPLOYEE_NUMBER;
        if (testEmployeeNumber) {
            logger.log(`\n=== 특정 직원 정보 조회 (사번: ${testEmployeeNumber}) ===`);
            try {
                const employee = await ssoService.사번으로직원을조회한다(testEmployeeNumber);
                logger.log(`직원 정보 조회 완료: ${employee.name} (${employee.email})`);
            }
            catch (error) {
                logger.error(`직원 정보 조회 실패: ${error.message}`);
            }
        }
        logger.log('\n=== SSO Mock 데이터 수집 완료 ===');
        logger.log('생성된 JSON 파일은 src/domain/common/sso/mock-data/ 폴더에 저장되었습니다.');
        await app.close();
    }
    catch (error) {
        logger.error('SSO Mock 데이터 수집 중 오류 발생:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    fetchSSOMockData()
        .then(() => {
        process.exit(0);
    })
        .catch((error) => {
        console.error('스크립트 실행 실패:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=sso-fetch-mock-data.js.map