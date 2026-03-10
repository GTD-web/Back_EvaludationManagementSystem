import { IBaseEntity } from '@libs/database/base/base.entity';
import type { EvaluationProjectAssignmentDto } from '../evaluation-project-assignment.types';

/**
 * 평가 프로젝트 할당 인터페이스
 * 특정 평가기간에 직원에게 할당된 프로젝트를 관리합니다.
 */
export interface IEvaluationProjectAssignment extends IBaseEntity {
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 할당일 */
  assignedDate: Date;
  /** 할당자 ID */
  assignedBy: string;
  /** 프로젝트 시작일 */
  projectStartDate?: Date;
  /** 프로젝트 종료일 */
  projectEndDate?: Date;

  /**
   * 특정 평가기간에 속하는지 확인한다
   * @param periodId 확인할 평가기간 ID
   * @returns 평가기간 일치 여부
   */
  평가기간과_일치하는가(periodId: string): boolean;

  /**
   * 특정 직원의 할당인지 확인한다
   * @param employeeId 확인할 직원 ID
   * @returns 직원 일치 여부
   */
  해당_직원의_할당인가(employeeId: string): boolean;

  /**
   * 특정 프로젝트 할당인지 확인한다
   * @param projectId 확인할 프로젝트 ID
   * @returns 프로젝트 일치 여부
   */
  해당_프로젝트_할당인가(projectId: string): boolean;

  /**
   * DTO로 변환한다
   * @returns 평가 프로젝트 할당 DTO
   */
  DTO로_변환한다(): EvaluationProjectAssignmentDto;
}
