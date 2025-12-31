/**
 * ProjectTestService 사용 예시
 *
 * 이 파일은 ProjectTestService의 사용법을 보여주는 예시입니다.
 * 실제 테스트에서 참고하여 사용하세요.
 */

import { ProjectTestService } from './project-test.service';
import { ProjectStatus } from './project.types';

/**
 * 테스트 서비스 사용 예시 클래스
 */
export class ProjectTestUsageExample {
  constructor(private readonly projectTestService: ProjectTestService) {}

  /**
   * 기본 테스트 데이터 생성 예시
   */
  async 기본_테스트데이터_생성_예시() {
    // 1. 기본 목데이터 생성 (다양한 상태 포함)
    const projects =
      await this.projectTestService.테스트용_목데이터를_생성한다();
    console.log('생성된 프로젝트 수:', projects.length);
    console.log(
      '활성 프로젝트들:',
      projects.filter((p) => p.isActive),
    );

    // 2. 특정 프로젝트 생성
    const customProject =
      await this.projectTestService.특정_프로젝트_테스트데이터를_생성한다({
        name: '커스텀프로젝트',
        projectCode: 'CUSTOM-001',
        status: ProjectStatus.ACTIVE,
        managerId: 'custom-manager',
      });
    console.log('커스텀 프로젝트 생성:', customProject);

    // 3. 랜덤 테스트 데이터 생성
    const randomProjects =
      await this.projectTestService.랜덤_테스트데이터를_생성한다(5);
    console.log('랜덤 프로젝트 생성:', randomProjects.length);

    // 4. 상태별 프로젝트 데이터 생성
    const activeProjects =
      await this.projectTestService.상태별_프로젝트_테스트데이터를_생성한다(
        ProjectStatus.ACTIVE,
        3,
      );
    console.log('활성 프로젝트 생성:', activeProjects.length);

    // 5. 매니저별 프로젝트 데이터 생성
    const managerProjects =
      await this.projectTestService.매니저별_프로젝트_테스트데이터를_생성한다(
        'test-manager-001',
        2,
      );
    console.log('매니저별 프로젝트 생성:', managerProjects.length);

    // 6. 기간별 프로젝트 데이터 생성
    const periodProjects =
      await this.projectTestService.기간별_프로젝트_테스트데이터를_생성한다(
        2023,
        2024,
        4,
      );
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

  /**
   * 테스트 데이터 정리 예시
   */
  async 테스트데이터_정리_예시() {
    // 1. 테스트 데이터만 정리
    const deletedCount =
      await this.projectTestService.테스트_데이터를_정리한다();
    console.log('삭제된 테스트 데이터 수:', deletedCount);

    // 2. 모든 데이터 삭제 (주의: 운영 환경에서 사용 금지)
    // const allDeletedCount = await this.projectTestService.모든_테스트데이터를_삭제한다();
    // console.log('삭제된 모든 데이터 수:', allDeletedCount);
  }

  /**
   * 전체 테스트 시나리오 예시
   */
  async 전체_테스트_시나리오() {
    try {
      console.log('=== 테스트 데이터 생성 시작 ===');

      // 1. 기본 테스트 데이터 생성
      const testData = await this.기본_테스트데이터_생성_예시();

      console.log('=== 테스트 완료 ===');
      console.log('생성된 프로젝트 수:', testData.basic.length);
      console.log(
        '활성 프로젝트 수:',
        testData.basic.filter((p) => p.isActive).length,
      );
      console.log(
        '완료된 프로젝트 수:',
        testData.basic.filter((p) => p.isCompleted).length,
      );
      console.log(
        '취소된 프로젝트 수:',
        testData.basic.filter((p) => p.isCancelled).length,
      );

      return {
        testData,
      };
    } catch (error) {
      console.error('테스트 실행 중 오류:', error);
      throw error;
    } finally {
      // 2. 테스트 데이터 정리
      console.log('=== 테스트 데이터 정리 ===');
      await this.테스트데이터_정리_예시();
    }
  }
}

/**
 * E2E 테스트에서 사용할 수 있는 헬퍼 함수들
 */
export class ProjectTestHelpers {
  constructor(private readonly projectTestService: ProjectTestService) {}

  /**
   * E2E 테스트용 기본 데이터 설정
   */
  async E2E_테스트용_데이터_설정() {
    return await this.projectTestService.테스트용_목데이터를_생성한다();
  }

  /**
   * E2E 테스트용 데이터 정리
   */
  async E2E_테스트용_데이터_정리() {
    return await this.projectTestService.테스트_데이터를_정리한다();
  }

  /**
   * 특정 테스트 케이스용 데이터 생성
   */
  async 특정_테스트케이스용_데이터_생성(testCase: string) {
    switch (testCase) {
      case 'active':
        return await this.projectTestService.상태별_프로젝트_테스트데이터를_생성한다(
          ProjectStatus.ACTIVE,
          10,
        );
      case 'completed':
        return await this.projectTestService.상태별_프로젝트_테스트데이터를_생성한다(
          ProjectStatus.COMPLETED,
          5,
        );
      case 'cancelled':
        return await this.projectTestService.상태별_프로젝트_테스트데이터를_생성한다(
          ProjectStatus.CANCELLED,
          3,
        );
      case 'manager':
        return await this.projectTestService.매니저별_프로젝트_테스트데이터를_생성한다(
          'test-manager',
          5,
        );
      case 'period':
        return await this.projectTestService.기간별_프로젝트_테스트데이터를_생성한다(
          2023,
          2024,
          8,
        );
      case 'random':
        return await this.projectTestService.랜덤_테스트데이터를_생성한다(15);
      case 'basic':
      default:
        return await this.projectTestService.테스트용_목데이터를_생성한다();
    }
  }
}
