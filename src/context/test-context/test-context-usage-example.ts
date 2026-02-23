/**
 * TestContextService 사용 예시
 *
 * 이 파일은 TestContextService의 사용법을 보여주는 예시입니다.
 * 실제 테스트에서 참고하여 사용하세요.
 */

import { TestContextService } from './test-context.service';

/**
 * 테스트 컨텍스트 사용 예시 클래스
 */
export class TestContextUsageExample {
  constructor(private readonly testContextService: TestContextService) {}

  /**
   * 기본 테스트 환경 생성 예시
   */
  async 기본_테스트환경_생성_예시() {
    // 1. 완전한 테스트 환경 생성
    const testData = await this.testContextService.완전한_테스트환경을_생성한다();
    console.log('=== 완전한 테스트 환경 생성 완료 ===');
    console.log('부서 수:', testData.departments.length);
    console.log('직원 수:', testData.employees.length);
    console.log('프로젝트 수:', testData.projects.length);
    console.log('WBS 항목 수:', testData.wbsItems.length);

    return testData;
  }

  /**
   * 부서와 직원 생성 예시
   */
  async 부서와_직원_생성_예시() {
    // 1. 부서와 직원 생성
    const { departments, employees } = await this.testContextService.부서와_직원을_생성한다();
    console.log('=== 부서와 직원 생성 완료 ===');
    console.log('부서 수:', departments.length);
    console.log('직원 수:', employees.length);

    // 2. 특정 부서에 직원 추가
    if (departments.length > 0) {
      const additionalEmployees = await this.testContextService.특정_부서에_직원을_추가한다(
        departments[0].id,
        3,
      );
      console.log('추가된 직원 수:', additionalEmployees.length);
    }

    // 3. 매니저-하위직원 관계 생성
    const managerEmployees = await this.testContextService.매니저_하위직원_관계를_생성한다(2, 2);
    console.log('매니저-하위직원 관계 생성:', managerEmployees.length);

    return {
      departments,
      employees,
      additionalEmployees: departments.length > 0 ? await this.testContextService.특정_부서에_직원을_추가한다(departments[0].id, 3) : [],
      managerEmployees,
    };
  }

  /**
   * 프로젝트와 WBS 생성 예시
   */
  async 프로젝트와_WBS_생성_예시() {
    // 1. 프로젝트와 WBS 생성
    const { projects, wbsItems } = await this.testContextService.프로젝트와_WBS를_생성한다(2);
    console.log('=== 프로젝트와 WBS 생성 완료 ===');
    console.log('프로젝트 수:', projects.length);
    console.log('WBS 항목 수:', wbsItems.length);

    // 2. 특정 프로젝트에 WBS 추가
    if (projects.length > 0) {
      const additionalWbsItems = await this.testContextService.특정_프로젝트에_WBS를_추가한다(
        projects[0].id,
        5,
      );
      console.log('추가된 WBS 항목 수:', additionalWbsItems.length);
    }

    // 3. 계층구조 WBS 생성
    if (projects.length > 0) {
      const hierarchicalWbsItems = await this.testContextService.계층구조_WBS를_생성한다(
        projects[0].id,
        3,
        2,
      );
      console.log('계층구조 WBS 항목 수:', hierarchicalWbsItems.length);
    }

    return {
      projects,
      wbsItems,
      additionalWbsItems: projects.length > 0 ? await this.testContextService.특정_프로젝트에_WBS를_추가한다(projects[0].id, 5) : [],
      hierarchicalWbsItems: projects.length > 0 ? await this.testContextService.계층구조_WBS를_생성한다(projects[0].id, 3, 2) : [],
    };
  }

  /**
   * 평가 시스템용 테스트 데이터 생성 예시
   */
  async 평가시스템용_테스트데이터_생성_예시() {
    // 1. 평가 시스템용 완전한 테스트 데이터 생성
    const testData = await this.testContextService.평가시스템용_완전한_테스트데이터를_생성한다();
    console.log('=== 평가 시스템용 테스트 데이터 생성 완료 ===');
    console.log('부서 수:', testData.departments.length);
    console.log('직원 수:', testData.employees.length);
    console.log('프로젝트 수:', testData.projects.length);
    console.log('WBS 항목 수:', testData.wbsItems.length);

    // 2. 프로젝트 목록 출력
    console.log('프로젝트 수:', testData.projects.length);

    // 3. 진행중인 WBS 항목만 필터링
    const inProgressWbsItems = testData.wbsItems.filter((w) => w.isInProgress);
    console.log('진행중인 WBS 항목 수:', inProgressWbsItems.length);

    return {
      ...testData,
      inProgressWbsItems,
    };
  }

  /**
   * 테스트 데이터 정리 예시
   */
  async 테스트데이터_정리_예시() {
    // 1. 테스트 데이터만 정리
    const cleanedData = await this.testContextService.테스트_데이터를_정리한다();
    console.log('=== 테스트 데이터 정리 완료 ===');
    console.log('정리된 데이터 수:', cleanedData);

    // 2. 모든 데이터 삭제 (주의: 운영 환경에서 사용 금지)
    // const deletedData = await this.testContextService.모든_테스트데이터를_삭제한다();
    // console.log('삭제된 모든 데이터 수:', deletedData);

    return cleanedData;
  }

  /**
   * 전체 테스트 시나리오 예시
   */
  async 전체_테스트_시나리오() {
    try {
      console.log('=== 테스트 컨텍스트 시나리오 시작 ===');

      // 1. 기본 테스트 환경 생성
      const basicTestData = await this.기본_테스트환경_생성_예시();

      // 2. 부서와 직원 생성
      const orgTestData = await this.부서와_직원_생성_예시();

      // 3. 프로젝트와 WBS 생성
      const projectTestData = await this.프로젝트와_WBS_생성_예시();

      // 4. 평가 시스템용 테스트 데이터 생성
      const evaluationTestData = await this.평가시스템용_테스트데이터_생성_예시();

      console.log('=== 테스트 컨텍스트 시나리오 완료 ===');

      return {
        basic: basicTestData,
        organization: orgTestData,
        project: projectTestData,
        evaluation: evaluationTestData,
      };
    } catch (error) {
      console.error('테스트 컨텍스트 시나리오 실행 중 오류:', error);
      throw error;
    } finally {
      // 5. 테스트 데이터 정리
      console.log('=== 테스트 데이터 정리 ===');
      await this.테스트데이터_정리_예시();
    }
  }
}

/**
 * E2E 테스트에서 사용할 수 있는 헬퍼 함수들
 */
export class TestContextHelpers {
  constructor(private readonly testContextService: TestContextService) {}

  /**
   * E2E 테스트용 기본 데이터 설정
   */
  async E2E_테스트용_데이터_설정() {
    return await this.testContextService.완전한_테스트환경을_생성한다();
  }

  /**
   * E2E 테스트용 데이터 정리
   */
  async E2E_테스트용_데이터_정리() {
    return await this.testContextService.테스트_데이터를_정리한다();
  }

  /**
   * 특정 테스트 케이스용 데이터 생성
   */
  async 특정_테스트케이스용_데이터_생성(testCase: string) {
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
        // 프로젝트를 먼저 생성하고 WBS 추가
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

  /**
   * 테스트 환경 상태 확인
   */
  async 테스트환경_상태_확인() {
    return await this.testContextService.테스트환경_상태를_확인한다();
  }
}
