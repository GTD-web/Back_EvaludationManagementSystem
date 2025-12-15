import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * WBS 평가 기준 인터페이스
 * WBS 항목별 개별 평가 기준을 관리하는 인터페이스입니다.
 */
export interface IWbsEvaluationCriteria extends IBaseEntity {
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 평가 기준 내용 */
  criteria: string;
  /** 중요도 (1~5) */
  importance: number;
  /** 세부 프로젝트 (서브 프로젝트) */
  subProject?: string | null;

  /**
   * 평가 기준 내용을 업데이트한다
   * @param criteria 새로운 평가 기준 내용
   * @param importance 중요도 (1~5)
   * @param subProject 세부 프로젝트 (서브 프로젝트)
   * @param updatedBy 수정자 ID
   */
  기준내용업데이트한다(
    criteria: string,
    importance: number,
    subProject: string | null | undefined,
    updatedBy: string,
  ): void;

  /**
   * 평가 기준이 특정 WBS 항목에 속하는지 확인한다
   * @param wbsItemId 확인할 WBS 항목 ID
   * @returns WBS 항목 일치 여부
   */
  WBS항목일치하는가(wbsItemId: string): boolean;

  /**
   * 평가 기준이 유효한지 확인한다
   * @returns 유효성 여부
   */
  유효한가(): boolean;
}
