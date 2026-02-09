import { IBaseEntity } from '@libs/database/base/base.entity';
import type { EvaluationWbsAssignmentDto } from '../evaluation-wbs-assignment.types';

/**
 * 평가 WBS 할당 인터페이스
 * 특정 평가기간에 직원에게 할당된 WBS 항목을 관리합니다.
 */
export interface IEvaluationWbsAssignment extends IBaseEntity {
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당일 */
  assignedDate: Date;
  /** 할당자 ID */
  assignedBy: string;
  /** 표시 순서 */
  displayOrder: number;
  /** 가중치 (0~100, 직원별 WBS 중요도 기반 자동 계산) */
  weight: number;
  /** 시작일 */
  startDate?: Date;
  /** 종료일 */
  endDate?: Date;

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
   * 특정 프로젝트의 WBS 할당인지 확인한다
   * @param projectId 확인할 프로젝트 ID
   * @returns 프로젝트 일치 여부
   */
  해당_프로젝트의_WBS_할당인가(projectId: string): boolean;

  /**
   * 특정 WBS 항목 할당인지 확인한다
   * @param wbsItemId 확인할 WBS 항목 ID
   * @returns WBS 항목 일치 여부
   */
  해당_WBS_항목의_할당인가(wbsItemId: string): boolean;

  /**
   * DTO로 변환한다
   * @returns 평가 WBS 할당 DTO
   */
  DTO로_변환한다(): EvaluationWbsAssignmentDto;
}
