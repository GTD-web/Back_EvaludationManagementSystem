import { ProjectDto } from './project.types';

/**
 * 프로젝트 도메인 인터페이스 (평가 시스템 전용)
 *
 * 평가 시스템에서 사용하는 프로젝트 기능만 정의합니다.
 * 기본적으로는 데이터 접근과 DTO 변환 기능을 제공합니다.
 */
export interface IProject {
  // 기본 속성 (readonly로 엔티티 필드들)
  /** 고유 식별자 */
  readonly id: string;
  /** 프로젝트명 */
  readonly name: string;
  /** 프로젝트 코드 */
  readonly projectCode?: string;
  /** 프로젝트 매니저 ID */
  readonly managerId?: string;
}
